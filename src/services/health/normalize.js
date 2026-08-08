// Platform sample -> canonical sample.
//
// This file is where a health integration silently goes wrong. Every function here is pure
// and unit-tested; adapters do querying only and never reshape data themselves.
//
// Canonical sample shape:
//   { metricType, value, unit, startTime, endTime, externalId, sourceName }
// startTime/endTime are ISO strings. externalId must be stable across syncs -- it is what
// the server's unique index dedupes on.

import {
  METRIC,
  UNIT,
  HK_ASLEEP_VALUES,
  HC_ASLEEP_STAGES,
} from './types';

const iso = d => (d instanceof Date ? d.toISOString() : new Date(d).toISOString());

const isFiniteNumber = n => typeof n === 'number' && Number.isFinite(n);

/** Build a canonical sample, or null if anything essential is missing/unusable. */
function make(metricType, value, startTime, endTime, externalId, sourceName) {
  if (!isFiniteNumber(value) || !externalId) return null;
  const start = new Date(startTime);
  const end = new Date(endTime ?? startTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return {
    metricType,
    value,
    unit: UNIT[metricType],
    startTime: iso(start),
    endTime: iso(end),
    externalId: String(externalId),
    sourceName: sourceName || null,
  };
}

/* -------------------------------------------------------------------------- */
/*  Shared helpers                                                             */
/* -------------------------------------------------------------------------- */

/**
 * HealthKit and Health Connect both express oxygen saturation as a 0-1 FRACTION even when
 * the unit is nominally "percent". Anything <= 1 is therefore a fraction, not a percentage:
 * a real SpO2 of 1% is not survivable, so there is no ambiguous case to worry about.
 */
export function normalizeSpO2(raw) {
  if (!isFiniteNumber(raw)) return null;
  return raw <= 1 ? raw * 100 : raw;
}

const MMOL_TO_MGDL = 18.0182;

/**
 * Blood glucose to mg/dL. mmol/L is the trap: untouched it reads ~18x low.
 *
 * Match BOTH spellings. Health Connect says 'millimolesPerLiter' (which does not contain
 * the substring "mmol") while HealthKit and most display code say 'mmol/L'. Checking only
 * one of them fails silently -- the value passes straight through as if it were already
 * mg/dL, and a normal 5.5 reads as a critically low 5.5.
 */
export function glucoseToMgDl(value, unit) {
  if (!isFiniteNumber(value)) return null;
  const u = String(unit || '').toLowerCase();
  if (u.includes('mmol') || u.includes('millimole')) return value * MMOL_TO_MGDL;
  return value;
}

/**
 * Merge overlapping intervals and return total covered minutes.
 *
 * This is the reason sleep needs care on BOTH platforms. iOS 16+ writes CORE/DEEP/REM
 * samples that a legacy ASLEEP sample can span; Health Connect sessions can contain stages
 * that overlap or be recorded by two apps at once. Summing durations double-counts; merging
 * first counts wall-clock time asleep, which is what a human means by "7 hours".
 */
export function mergedMinutes(intervals) {
  const spans = intervals
    .map(i => [new Date(i.start).getTime(), new Date(i.end).getTime()])
    .filter(([s, e]) => Number.isFinite(s) && Number.isFinite(e) && e > s)
    .sort((a, b) => a[0] - b[0]);

  if (!spans.length) return 0;

  let total = 0;
  let [curStart, curEnd] = spans[0];
  for (let i = 1; i < spans.length; i++) {
    const [s, e] = spans[i];
    if (s <= curEnd) {
      curEnd = Math.max(curEnd, e);
    } else {
      total += curEnd - curStart;
      [curStart, curEnd] = [s, e];
    }
  }
  total += curEnd - curStart;
  return Math.round(total / 60000);
}

/** Group items into local calendar days using an offset-free YYYY-MM-DD key. */
function dayKey(dateLike) {
  const d = new Date(dateLike);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* -------------------------------------------------------------------------- */
/*  HealthKit (iOS)                                                            */
/* -------------------------------------------------------------------------- */

export function hkQuantity(metricType, samples, transform) {
  if (!Array.isArray(samples)) return [];
  return samples
    .map(s => {
      const value = transform ? transform(s.value) : s.value;
      return make(metricType, value, s.startDate, s.endDate, s.id, s.sourceName);
    })
    .filter(Boolean);
}

/**
 * HealthKit returns blood pressure as ONE correlation sample carrying both halves. The
 * server stores them as two metrics, so each sample fans out into two -- with suffixed
 * externalIds, because both would otherwise collide on the same UUID and the unique index
 * would keep only one of them.
 */
export function hkBloodPressure(samples) {
  if (!Array.isArray(samples)) return [];
  const out = [];
  for (const s of samples) {
    const sys = make(
      METRIC.bloodPressureSystolic,
      s.bloodPressureSystolicValue,
      s.startDate,
      s.endDate,
      s.id ? `${s.id}:sys` : null,
      s.sourceName
    );
    const dia = make(
      METRIC.bloodPressureDiastolic,
      s.bloodPressureDiastolicValue,
      s.startDate,
      s.endDate,
      s.id ? `${s.id}:dia` : null,
      s.sourceName
    );
    // Only emit a pair. Half a blood pressure reading is not a reading.
    if (sys && dia) out.push(sys, dia);
  }
  return out;
}

/**
 * Cumulative statistics samples (steps, Apple exercise time) rolled up to local calendar
 * days.
 *
 * These come from HKStatisticsCollectionQuery, and two things make them unusable as-is:
 *
 *   1. NO id. They are computed aggregates, not stored samples, so there is no UUID to
 *      dedupe on and every one of them would be dropped for want of an externalId.
 *   2. The bucket boundaries MOVE. react-native-health builds the collection with
 *      `interval.minute = period` (default 60) and leaves `anchorComponents.hour = 0`
 *      commented out, so buckets are anchored to the moment of the query -- 13:56:02 to
 *      14:56:02 for a sync run at :56:02. Deriving an id from a bucket edge would therefore
 *      produce different ids on every sync and duplicate without end.
 *
 * Rolling up to the local calendar day fixes both: the key is stable no matter how
 * HealthKit chopped the data, and it matches how the server aggregates these metrics
 * anyway. Re-syncing a day updates that day's row rather than inserting another.
 *
 * `sourceName` also sits inside metadata[] on these samples rather than at the top level.
 */
export function hkDailyTotal(metricType, samples, transform) {
  if (!Array.isArray(samples)) return [];

  const byDay = new Map();
  for (const s of samples) {
    const value = transform ? transform(s.value) : s.value;
    if (!isFiniteNumber(value)) continue;
    // Attribute a bucket to the day it STARTS in. A bucket straddling midnight is
    // inherently ambiguous; picking one end consistently is what matters.
    const key = dayKey(s.startDate);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push({ ...s, value });
  }

  const out = [];
  for (const [key, group] of byDay) {
    const total = group.reduce((sum, s) => sum + s.value, 0);
    if (total <= 0) continue;

    const starts = group.map(s => new Date(s.startDate).getTime());
    const ends = group.map(s => new Date(s.endDate).getTime());
    const sourceName =
      group.map(s => s.sourceName || s.metadata?.[0]?.sourceName).find(Boolean) || null;

    const sample = make(
      metricType,
      Math.round(total * 100) / 100,
      new Date(Math.min(...starts)),
      new Date(Math.max(...ends)),
      `hk-${metricType}-${key}`,
      sourceName,
    );
    if (sample) out.push(sample);
  }
  return out;
}

/**
 * Sleep: keep only asleep stages, merge overlaps, and roll up to one sample per night.
 * The externalId is derived from the day rather than a source UUID, because the value is an
 * aggregate of many samples -- so re-syncing the same night updates that night's row rather
 * than inserting a new one.
 */
export function hkSleep(samples) {
  if (!Array.isArray(samples)) return [];

  const asleep = samples.filter(s => HK_ASLEEP_VALUES.includes(s.value));
  if (!asleep.length) return [];

  // Attribute a night to the day it ENDS on: sleep starting 23:40 belongs to the morning.
  const byDay = new Map();
  for (const s of asleep) {
    const key = dayKey(s.endDate);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(s);
  }

  const out = [];
  for (const [key, group] of byDay) {
    const minutes = mergedMinutes(group.map(s => ({ start: s.startDate, end: s.endDate })));
    if (minutes <= 0) continue;
    const starts = group.map(s => new Date(s.startDate).getTime());
    const ends = group.map(s => new Date(s.endDate).getTime());
    const sample = make(
      METRIC.sleepMinutes,
      minutes,
      new Date(Math.min(...starts)),
      new Date(Math.max(...ends)),
      `hk-sleep-${key}`,
      group[0].sourceName
    );
    if (sample) out.push(sample);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Health Connect (Android)                                                   */
/* -------------------------------------------------------------------------- */

const hcId = r => r?.metadata?.id || r?.metadata?.clientRecordId || null;
const hcSource = r => r?.metadata?.dataOrigin || null;

/** Records with a single scalar reading: pass a getter for the value. */
export function hcSimple(metricType, records, getValue) {
  if (!Array.isArray(records)) return [];
  return records
    .map(r =>
      make(
        metricType,
        getValue(r),
        r.time ?? r.startTime,
        r.time ?? r.endTime,
        hcId(r),
        hcSource(r)
      )
    )
    .filter(Boolean);
}

/** HeartRate is a series record: one row holds many beats-per-minute samples. */
export function hcHeartRate(records) {
  if (!Array.isArray(records)) return [];
  const out = [];
  for (const r of records) {
    const id = hcId(r);
    const samples = Array.isArray(r.samples) ? r.samples : [];
    samples.forEach((s, i) => {
      const sample = make(
        METRIC.heartRate,
        s.beatsPerMinute,
        s.time,
        s.time,
        id ? `${id}:${i}` : null,
        hcSource(r)
      );
      if (sample) out.push(sample);
    });
  }
  return out;
}

/** Same fan-out as HealthKit: one record, two canonical samples, suffixed ids. */
export function hcBloodPressure(records) {
  if (!Array.isArray(records)) return [];
  const out = [];
  for (const r of records) {
    const id = hcId(r);
    const sys = make(
      METRIC.bloodPressureSystolic,
      r.systolic?.inMillimetersOfMercury ?? r.systolic?.value,
      r.time,
      r.time,
      id ? `${id}:sys` : null,
      hcSource(r)
    );
    const dia = make(
      METRIC.bloodPressureDiastolic,
      r.diastolic?.inMillimetersOfMercury ?? r.diastolic?.value,
      r.time,
      r.time,
      id ? `${id}:dia` : null,
      hcSource(r)
    );
    if (sys && dia) out.push(sys, dia);
  }
  return out;
}

/** Sessions have a duration rather than a value; ExerciseSession minutes come from the span. */
export function hcDuration(metricType, records) {
  if (!Array.isArray(records)) return [];
  return records
    .map(r => {
      const minutes = mergedMinutes([{ start: r.startTime, end: r.endTime }]);
      return make(metricType, minutes, r.startTime, r.endTime, hcId(r), hcSource(r));
    })
    .filter(s => s && s.value > 0);
}

/**
 * Sleep sessions: prefer the staged breakdown when present so awake-in-bed time is excluded.
 * A session with no stages is treated as entirely asleep, which is the best available
 * reading of what the writing app meant.
 */
export function hcSleep(records) {
  if (!Array.isArray(records)) return [];
  return records
    .map(r => {
      const stages = Array.isArray(r.stages) ? r.stages : [];
      const asleep = stages.filter(s => HC_ASLEEP_STAGES.includes(s.stage));

      const intervals = stages.length
        ? asleep.map(s => ({ start: s.startTime, end: s.endTime }))
        : [{ start: r.startTime, end: r.endTime }];

      const minutes = mergedMinutes(intervals);
      return make(METRIC.sleepMinutes, minutes, r.startTime, r.endTime, hcId(r), hcSource(r));
    })
    .filter(s => s && s.value > 0);
}
