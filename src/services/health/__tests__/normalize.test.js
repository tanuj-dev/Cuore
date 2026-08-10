import {
  normalizeSpO2,
  glucoseToMgDl,
  mergedMinutes,
  hkQuantity,
  hkBloodPressure,
  hkSleep,
  hkDailyTotal,
  hcSimple,
  hcHeartRate,
  hcBloodPressure,
  hcDuration,
  hcSleep,
} from '../normalize';
import { METRIC, exerciseBand, sleepBand, mapBiologicalSex } from '../types';

describe('normalizeSpO2', () => {
  it('scales a 0-1 fraction to percent', () => {
    expect(normalizeSpO2(0.97)).toBeCloseTo(97);
  });

  it('leaves an already-percent value alone', () => {
    expect(normalizeSpO2(97)).toBe(97);
  });

  it('treats exactly 1 as a fraction (100%), not 1%', () => {
    expect(normalizeSpO2(1)).toBe(100);
  });

  it('returns null for junk', () => {
    expect(normalizeSpO2(undefined)).toBeNull();
    expect(normalizeSpO2(NaN)).toBeNull();
  });
});

describe('glucoseToMgDl', () => {
  it('converts mmol/L using 18.0182', () => {
    expect(glucoseToMgDl(5.5, 'millimolesPerLiter')).toBeCloseTo(99.1, 1);
  });

  it('leaves mg/dL untouched', () => {
    expect(glucoseToMgDl(99, 'milligramsPerDeciliter')).toBe(99);
  });

  it('defaults to mg/dL when the unit is missing', () => {
    expect(glucoseToMgDl(99, undefined)).toBe(99);
  });
});

describe('mergedMinutes', () => {
  it('sums non-overlapping intervals', () => {
    expect(
      mergedMinutes([
        { start: '2026-08-08T00:00:00Z', end: '2026-08-08T01:00:00Z' },
        { start: '2026-08-08T02:00:00Z', end: '2026-08-08T03:00:00Z' },
      ])
    ).toBe(120);
  });

  it('does NOT double-count overlapping intervals', () => {
    // The whole point: a legacy ASLEEP sample spanning CORE/DEEP/REM must count once.
    expect(
      mergedMinutes([
        { start: '2026-08-08T00:00:00Z', end: '2026-08-08T06:00:00Z' },
        { start: '2026-08-08T01:00:00Z', end: '2026-08-08T02:00:00Z' },
        { start: '2026-08-08T03:00:00Z', end: '2026-08-08T04:00:00Z' },
      ])
    ).toBe(360);
  });

  it('merges partially overlapping intervals', () => {
    expect(
      mergedMinutes([
        { start: '2026-08-08T00:00:00Z', end: '2026-08-08T02:00:00Z' },
        { start: '2026-08-08T01:00:00Z', end: '2026-08-08T03:00:00Z' },
      ])
    ).toBe(180);
  });

  it('ignores zero-length and reversed intervals', () => {
    expect(
      mergedMinutes([
        { start: '2026-08-08T01:00:00Z', end: '2026-08-08T01:00:00Z' },
        { start: '2026-08-08T05:00:00Z', end: '2026-08-08T04:00:00Z' },
      ])
    ).toBe(0);
  });

  it('returns 0 for an empty list', () => {
    expect(mergedMinutes([])).toBe(0);
  });
});

describe('hkQuantity', () => {
  const samples = [
    { id: 'A', value: 72, startDate: '2026-08-08T06:00:00Z', endDate: '2026-08-08T06:00:00Z', sourceName: 'Apple Watch' },
  ];

  it('maps to a canonical sample with the right unit', () => {
    const [s] = hkQuantity(METRIC.heartRate, samples);
    expect(s).toMatchObject({
      metricType: 'heartRate',
      value: 72,
      unit: 'bpm',
      externalId: 'A',
      sourceName: 'Apple Watch',
    });
  });

  it('applies a transform when given', () => {
    const [s] = hkQuantity(METRIC.weightKg, [{ ...samples[0], value: 70000 }], g => g / 1000);
    expect(s.value).toBe(70);
    expect(s.unit).toBe('kg');
  });

  it('drops samples with no id, since there would be nothing to dedupe on', () => {
    expect(hkQuantity(METRIC.heartRate, [{ ...samples[0], id: undefined }])).toHaveLength(0);
  });

  it('survives a non-array', () => {
    expect(hkQuantity(METRIC.heartRate, undefined)).toEqual([]);
  });
});

describe('hkBloodPressure', () => {
  const bp = [
    {
      id: 'BP1',
      bloodPressureSystolicValue: 120,
      bloodPressureDiastolicValue: 80,
      startDate: '2026-08-08T06:00:00Z',
      endDate: '2026-08-08T06:00:00Z',
    },
  ];

  it('splits one correlation into two samples', () => {
    const out = hkBloodPressure(bp);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ metricType: 'bloodPressureSystolic', value: 120, unit: 'mmHg' });
    expect(out[1]).toMatchObject({ metricType: 'bloodPressureDiastolic', value: 80 });
  });

  it('gives the halves distinct externalIds so they cannot collide', () => {
    const out = hkBloodPressure(bp);
    expect(out[0].externalId).toBe('BP1:sys');
    expect(out[1].externalId).toBe('BP1:dia');
    expect(out[0].externalId).not.toBe(out[1].externalId);
  });

  it('emits nothing when only one half is present', () => {
    expect(hkBloodPressure([{ ...bp[0], bloodPressureDiastolicValue: undefined }])).toHaveLength(0);
  });

  // react-native-health builds the BP dictionary from exactly four keys and includes
  // neither id nor sourceName, so this -- not the shape above -- is what a device sends.
  const realShape = [
    {
      bloodPressureSystolicValue: 120,
      bloodPressureDiastolicValue: 80,
      startDate: '2026-08-08T22:50:00.000+0530',
      endDate: '2026-08-08T22:50:00.000+0530',
    },
  ];

  it('keeps readings that carry no id at all', () => {
    const out = hkBloodPressure(realShape);
    expect(out).toHaveLength(2);
    expect(out[0].value).toBe(120);
    expect(out[1].value).toBe(80);
  });

  it('derives a stable id from the timestamp, still distinct per half', () => {
    const first = hkBloodPressure(realShape);
    const second = hkBloodPressure(realShape);
    expect(first[0].externalId).toBe(second[0].externalId);
    expect(first[0].externalId).not.toBe(first[1].externalId);
    expect(first[0].externalId).toMatch(/:sys$/);
    expect(first[1].externalId).toMatch(/:dia$/);
  });

  it('gives two readings at different times different ids', () => {
    const later = [{ ...realShape[0], startDate: '2026-08-08T23:50:00.000+0530' }];
    expect(hkBloodPressure(realShape)[0].externalId).not.toBe(
      hkBloodPressure(later)[0].externalId,
    );
  });

  it('still prefers a real id when the library provides one', () => {
    const withId = [{ ...realShape[0], id: 'UUID-1' }];
    expect(hkBloodPressure(withId)[0].externalId).toBe('UUID-1:sys');
  });

  it('drops a reading whose timestamp is unusable', () => {
    expect(
      hkBloodPressure([{ ...realShape[0], startDate: 'nonsense', endDate: 'nonsense' }]),
    ).toHaveLength(0);
  });
});

describe('hkSleep', () => {
  const night = [
    { id: '1', value: 'INBED', startDate: '2026-08-07T22:00:00Z', endDate: '2026-08-08T06:00:00Z' },
    { id: '2', value: 'CORE', startDate: '2026-08-07T23:00:00Z', endDate: '2026-08-08T02:00:00Z' },
    { id: '3', value: 'DEEP', startDate: '2026-08-08T02:00:00Z', endDate: '2026-08-08T03:00:00Z' },
    { id: '4', value: 'REM', startDate: '2026-08-08T03:00:00Z', endDate: '2026-08-08T04:00:00Z' },
    { id: '5', value: 'AWAKE', startDate: '2026-08-08T04:00:00Z', endDate: '2026-08-08T04:30:00Z' },
  ];

  it('excludes INBED and AWAKE, counting only real sleep', () => {
    const [s] = hkSleep(night);
    // CORE 3h + DEEP 1h + REM 1h = 5h. INBED (8h) and AWAKE (30m) must not count.
    expect(s.value).toBe(300);
    expect(s.unit).toBe('min');
  });

  it('rolls a night up into a single sample', () => {
    expect(hkSleep(night)).toHaveLength(1);
  });

  it('uses a stable day-derived externalId so a re-sync updates rather than duplicates', () => {
    const first = hkSleep(night)[0].externalId;
    const second = hkSleep(night)[0].externalId;
    expect(first).toBe(second);
    expect(first).toMatch(/^hk-sleep-\d{4}-\d{2}-\d{2}$/);
  });

  it('counts legacy undifferentiated ASLEEP samples', () => {
    const [s] = hkSleep([
      { id: '9', value: 'ASLEEP', startDate: '2026-08-07T23:00:00Z', endDate: '2026-08-08T05:00:00Z' },
    ]);
    expect(s.value).toBe(360);
  });

  it('returns nothing when the night is only INBED', () => {
    expect(hkSleep([night[0]])).toHaveLength(0);
  });
});

describe('onboarding band mapping', () => {
  // These strings are duplicated from the backend's EXERCISE_SCORE_MAP / SLEEP_MAP because
  // onboarding pre-fills before anything has synced. A drift of one character scores as
  // undefined and silently removes that component from the Cuore Score, so pin them.
  it('produces exactly the exercise bands the score expects', () => {
    expect(exerciseBand(0)).toBe('Less than 75 min');
    expect(exerciseBand(74)).toBe('Less than 75 min');
    expect(exerciseBand(75)).toBe('75 to 150 min');
    expect(exerciseBand(150)).toBe('75 to 150 min');
    expect(exerciseBand(151)).toBe('More than 150 min');
  });

  it('produces exactly the sleep bands the score expects', () => {
    expect(sleepBand(5.9)).toBe('Less than 6 hours');
    expect(sleepBand(6)).toBe('Between 6 to 7 hours');
    expect(sleepBand(7)).toBe('Between 7 to 8 hours');
    expect(sleepBand(8)).toBe('Between 8 to 9 hours');
    expect(sleepBand(9)).toBe('Between 8 to 9 hours');
    expect(sleepBand(9.1)).toBe('More than 9 hours');
  });

  it('returns null rather than a band for unusable input', () => {
    expect(exerciseBand(undefined)).toBeNull();
    expect(sleepBand(NaN)).toBeNull();
  });

  it('maps biological sex, refusing to guess at other/unknown', () => {
    expect(mapBiologicalSex('male')).toBe('male');
    expect(mapBiologicalSex('female')).toBe('female');
    // scoreBmi uses different thresholds per gender, so a guess would skew the score.
    expect(mapBiologicalSex('other')).toBeNull();
    expect(mapBiologicalSex('unknown')).toBeNull();
    expect(mapBiologicalSex(undefined)).toBeNull();
  });
});

describe('hkDailyTotal', () => {
  // Verbatim shape from a real iPhone: no id, sourceName nested in metadata[], and bucket
  // edges anchored to the query time rather than the hour.
  const realShape = [
    {
      metadata: [{ quantity: 162, sourceName: "TANUJ's iPhone", sourceId: 'com.apple.health.A2A1' }],
      value: 162,
      startDate: '2026-05-18T13:56:02.000+0530',
      endDate: '2026-05-18T14:56:02.000+0530',
    },
    {
      metadata: [{ quantity: 38, sourceName: "TANUJ's iPhone" }],
      value: 38,
      startDate: '2026-05-18T14:56:02.000+0530',
      endDate: '2026-05-18T15:56:02.000+0530',
    },
  ];

  it('keeps samples that have no id, by synthesising a day-based one', () => {
    // hkQuantity would drop every one of these for want of an externalId.
    const out = hkDailyTotal(METRIC.steps, realShape);
    expect(out).toHaveLength(1);
    expect(out[0].externalId).toMatch(/^hk-steps-\d{4}-\d{2}-\d{2}$/);
  });

  it('sums the buckets into a single daily total', () => {
    const [s] = hkDailyTotal(METRIC.steps, realShape);
    expect(s.value).toBe(200);
    expect(s.unit).toBe('count');
  });

  it('reads sourceName out of metadata when it is not top-level', () => {
    const [s] = hkDailyTotal(METRIC.steps, realShape);
    expect(s.sourceName).toBe("TANUJ's iPhone");
  });

  it('produces the SAME id when bucket edges shift between syncs', () => {
    // The anchor moves with query time, so a later sync returns different boundaries for
    // the same day. The id must not move with them or every sync duplicates the day.
    const shifted = [
      { value: 100, startDate: '2026-05-18T09:13:44.000+0530', endDate: '2026-05-18T10:13:44.000+0530' },
      { value: 100, startDate: '2026-05-18T10:13:44.000+0530', endDate: '2026-05-18T11:13:44.000+0530' },
    ];
    expect(hkDailyTotal(METRIC.steps, shifted)[0].externalId).toBe(
      hkDailyTotal(METRIC.steps, realShape)[0].externalId,
    );
  });

  it('splits distinct days into separate rows', () => {
    const twoDays = [
      { value: 100, startDate: '2026-05-18T10:00:00.000+0530', endDate: '2026-05-18T11:00:00.000+0530' },
      { value: 250, startDate: '2026-05-19T10:00:00.000+0530', endDate: '2026-05-19T11:00:00.000+0530' },
    ];
    const out = hkDailyTotal(METRIC.steps, twoDays);
    expect(out).toHaveLength(2);
    expect(out.map(s => s.value).sort((a, b) => a - b)).toEqual([100, 250]);
  });

  it('drops days that total zero', () => {
    expect(
      hkDailyTotal(METRIC.steps, [
        { value: 0, startDate: '2026-05-18T10:00:00.000+0530', endDate: '2026-05-18T11:00:00.000+0530' },
      ]),
    ).toHaveLength(0);
  });

  it('applies a transform when given', () => {
    const [s] = hkDailyTotal(METRIC.exerciseMinutes, realShape, v => v / 2);
    expect(s.value).toBe(100);
    expect(s.unit).toBe('min');
  });

  it('rounds counts to whole numbers', () => {
    // HealthKit apportions raw samples across bucket edges, so a bucket really does read
    // 391.50438462695746 steps. Nobody walks half a step.
    const fractional = [
      { value: 391.50438462695746, startDate: '2026-05-18T14:02:50.000+0530', endDate: '2026-05-18T15:02:50.000+0530' },
      { value: 162.4956153730425, startDate: '2026-05-18T15:02:50.000+0530', endDate: '2026-05-18T16:02:50.000+0530' },
    ];
    const [s] = hkDailyTotal(METRIC.steps, fractional);
    expect(Number.isInteger(s.value)).toBe(true);
    expect(s.value).toBe(554);
  });

  it('does NOT round metrics whose unit is not a count', () => {
    const [s] = hkDailyTotal(METRIC.exerciseMinutes, [
      { value: 12.5, startDate: '2026-05-18T10:00:00.000+0530', endDate: '2026-05-18T11:00:00.000+0530' },
    ]);
    expect(s.value).toBe(12.5);
  });
});

describe('hcHeartRate', () => {
  it('fans a series record out into one sample per beat reading', () => {
    const out = hcHeartRate([
      {
        metadata: { id: 'HR1', dataOrigin: 'com.mi.health' },
        samples: [
          { time: '2026-08-08T06:00:00Z', beatsPerMinute: 70 },
          { time: '2026-08-08T06:01:00Z', beatsPerMinute: 74 },
        ],
      },
    ]);
    expect(out).toHaveLength(2);
    expect(out.map(s => s.externalId)).toEqual(['HR1:0', 'HR1:1']);
    expect(out[1]).toMatchObject({ value: 74, unit: 'bpm', sourceName: 'com.mi.health' });
  });
});

describe('hcSimple', () => {
  it('reads a scalar via the getter and normalizes SpO2', () => {
    const [s] = hcSimple(
      METRIC.oxygenSaturation,
      [{ metadata: { id: 'O1' }, time: '2026-08-08T06:00:00Z', percentage: 0.97 }],
      r => normalizeSpO2(r.percentage)
    );
    expect(s.value).toBeCloseTo(97);
    expect(s.unit).toBe('%');
  });

  it('converts mmol/L glucose', () => {
    const [s] = hcSimple(
      METRIC.bloodGlucose,
      [{ metadata: { id: 'G1' }, time: '2026-08-08T06:00:00Z', level: { value: 5.5, unit: 'millimolesPerLiter' } }],
      r => glucoseToMgDl(r.level.value, r.level.unit)
    );
    expect(s.value).toBeCloseTo(99.1, 1);
    expect(s.unit).toBe('mg/dL');
  });
});

describe('hcBloodPressure', () => {
  it('splits into two samples with distinct ids', () => {
    const out = hcBloodPressure([
      {
        metadata: { id: 'BP9' },
        time: '2026-08-08T06:00:00Z',
        systolic: { inMillimetersOfMercury: 118 },
        diastolic: { inMillimetersOfMercury: 76 },
      },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].value).toBe(118);
    expect(out[1].value).toBe(76);
    expect(out[0].externalId).toBe('BP9:sys');
    expect(out[1].externalId).toBe('BP9:dia');
  });
});

describe('hcDuration', () => {
  it('derives exercise minutes from the session span', () => {
    const [s] = hcDuration(METRIC.exerciseMinutes, [
      { metadata: { id: 'E1' }, startTime: '2026-08-08T06:00:00Z', endTime: '2026-08-08T06:45:00Z' },
    ]);
    expect(s.value).toBe(45);
    expect(s.unit).toBe('min');
  });

  it('drops zero-length sessions', () => {
    expect(
      hcDuration(METRIC.exerciseMinutes, [
        { metadata: { id: 'E2' }, startTime: '2026-08-08T06:00:00Z', endTime: '2026-08-08T06:00:00Z' },
      ])
    ).toHaveLength(0);
  });
});

describe('hcSleep', () => {
  it('counts only asleep stages when stages are present', () => {
    const [s] = hcSleep([
      {
        metadata: { id: 'S1' },
        startTime: '2026-08-07T22:00:00Z',
        endTime: '2026-08-08T06:00:00Z',
        stages: [
          { stage: 1, startTime: '2026-08-07T22:00:00Z', endTime: '2026-08-07T23:00:00Z' }, // AWAKE
          { stage: 4, startTime: '2026-08-07T23:00:00Z', endTime: '2026-08-08T02:00:00Z' }, // LIGHT
          { stage: 5, startTime: '2026-08-08T02:00:00Z', endTime: '2026-08-08T04:00:00Z' }, // DEEP
          { stage: 3, startTime: '2026-08-08T04:00:00Z', endTime: '2026-08-08T04:30:00Z' }, // OUT_OF_BED
        ],
      },
    ]);
    expect(s.value).toBe(300); // 3h LIGHT + 2h DEEP
  });

  it('falls back to the whole session when no stages are given', () => {
    const [s] = hcSleep([
      { metadata: { id: 'S2' }, startTime: '2026-08-07T23:00:00Z', endTime: '2026-08-08T05:00:00Z' },
    ]);
    expect(s.value).toBe(360);
  });

  it('drops a session with stages but none of them asleep', () => {
    expect(
      hcSleep([
        {
          metadata: { id: 'S3' },
          startTime: '2026-08-07T22:00:00Z',
          endTime: '2026-08-08T06:00:00Z',
          stages: [{ stage: 1, startTime: '2026-08-07T22:00:00Z', endTime: '2026-08-08T06:00:00Z' }],
        },
      ])
    ).toHaveLength(0);
  });
});
