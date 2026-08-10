// Android adapter. Querying and permissions only -- all reshaping lives in normalize.js.
//
// Unlike HealthKit, Health Connect DOES report which permissions were granted, and it can
// be absent entirely: it ships in the OS on Android 14+, is an installable Play Store app
// on 9-13, and does not exist below 9. Availability is therefore a three-state answer, not
// a boolean, and the UI has to be able to send the user to the Play Store.

import {
  initialize,
  getSdkStatus as hcGetSdkStatus,
  requestPermission,
  getGrantedPermissions as hcGetGrantedPermissions,
  readRecords,
  openHealthConnectSettings,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

import { METRIC, exerciseBand, sleepBand } from './types';
import {
  hcSimple,
  hcHeartRate,
  hcBloodPressure,
  hcDuration,
  hcSleep,
  normalizeSpO2,
  glucoseToMgDl,
} from './normalize';

// Canonical metric -> Health Connect record type. Both blood pressure halves come from the
// single BloodPressure record.
const RECORD_FOR = {
  [METRIC.heartRate]: 'HeartRate',
  [METRIC.restingHeartRate]: 'RestingHeartRate',
  [METRIC.bloodPressureSystolic]: 'BloodPressure',
  [METRIC.bloodPressureDiastolic]: 'BloodPressure',
  [METRIC.bloodGlucose]: 'BloodGlucose',
  [METRIC.oxygenSaturation]: 'OxygenSaturation',
  [METRIC.weightKg]: 'Weight',
  [METRIC.steps]: 'Steps',
  [METRIC.exerciseMinutes]: 'ExerciseSession',
  [METRIC.sleepMinutes]: 'SleepSession',
};

// Height is requested but is NOT a synced metric -- it is read once to pre-fill onboarding,
// since BMI is derived server-side from the height captured there. Kept out of RECORD_FOR so
// nothing tries to sync it as a time series.
const EXTRA_READ_RECORDS = ['Height'];

const READ_PERMISSIONS = [
  ...new Set([...Object.values(RECORD_FOR), ...EXTRA_READ_RECORDS]),
].map(recordType => ({ accessType: 'read', recordType }));

export const SDK = {
  available: 'available',
  needsUpdate: 'needs_update',
  unavailable: 'unavailable',
};

export async function getSdkStatus() {
  try {
    const status = await hcGetSdkStatus();
    if (status === SdkAvailabilityStatus.SDK_AVAILABLE) return SDK.available;
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
      return SDK.needsUpdate;
    }
    return SDK.unavailable;
  } catch (e) {
    return SDK.unavailable;
  }
}

export async function isAvailable() {
  return (await getSdkStatus()) === SDK.available;
}

async function ensureInitialized() {
  try {
    return await initialize();
  } catch (e) {
    return false;
  }
}

export async function requestPermissions() {
  if (!(await ensureInitialized())) return false;
  try {
    const granted = await requestPermission(READ_PERMISSIONS);
    return Array.isArray(granted) && granted.length > 0;
  } catch (e) {
    return false;
  }
}

/** Canonical metric types the user has actually granted. */
export async function getGrantedMetrics() {
  if (!(await ensureInitialized())) return [];
  try {
    const granted = await hcGetGrantedPermissions();
    const grantedRecords = new Set(
      (granted || []).filter(p => p.accessType === 'read').map(p => p.recordType)
    );
    return Object.keys(RECORD_FOR).filter(metric => grantedRecords.has(RECORD_FOR[metric]));
  } catch (e) {
    return [];
  }
}

async function read(recordType, since, until) {
  try {
    const result = await readRecords(recordType, {
      timeRangeFilter: {
        operator: 'between',
        startTime: new Date(since).toISOString(),
        endTime: new Date(until).toISOString(),
      },
    });
    // The library has returned both {records:[...]} and a bare array across versions.
    if (Array.isArray(result)) return result;
    return Array.isArray(result?.records) ? result.records : [];
  } catch (e) {
    // A revoked or never-granted permission throws. That is a normal state.
    return [];
  }
}

export async function readMetrics({ metricTypes, since, until }) {
  if (!(await ensureInitialized())) return [];

  const want = new Set(metricTypes);
  const jobs = [];

  if (want.has(METRIC.heartRate)) {
    jobs.push(read('HeartRate', since, until).then(hcHeartRate));
  }

  if (want.has(METRIC.restingHeartRate)) {
    jobs.push(
      read('RestingHeartRate', since, until).then(r =>
        hcSimple(METRIC.restingHeartRate, r, x => x.beatsPerMinute)
      )
    );
  }

  if (want.has(METRIC.bloodPressureSystolic) || want.has(METRIC.bloodPressureDiastolic)) {
    jobs.push(read('BloodPressure', since, until).then(hcBloodPressure));
  }

  if (want.has(METRIC.bloodGlucose)) {
    // level is {value, unit}; unit may be millimolesPerLiter, which must be converted.
    jobs.push(
      read('BloodGlucose', since, until).then(r =>
        hcSimple(METRIC.bloodGlucose, r, x => glucoseToMgDl(x.level?.value, x.level?.unit))
      )
    );
  }

  if (want.has(METRIC.oxygenSaturation)) {
    jobs.push(
      read('OxygenSaturation', since, until).then(r =>
        hcSimple(METRIC.oxygenSaturation, r, x => normalizeSpO2(x.percentage))
      )
    );
  }

  if (want.has(METRIC.weightKg)) {
    jobs.push(
      read('Weight', since, until).then(r =>
        hcSimple(METRIC.weightKg, r, x => x.weight?.inKilograms ?? x.weight?.value)
      )
    );
  }

  if (want.has(METRIC.steps)) {
    jobs.push(read('Steps', since, until).then(r => hcSimple(METRIC.steps, r, x => x.count)));
  }

  if (want.has(METRIC.exerciseMinutes)) {
    jobs.push(
      read('ExerciseSession', since, until).then(r => hcDuration(METRIC.exerciseMinutes, r))
    );
  }

  if (want.has(METRIC.sleepMinutes)) {
    jobs.push(read('SleepSession', since, until).then(hcSleep));
  }

  const results = await Promise.all(jobs);
  return results.flat();
}

/**
 * Onboarding pre-fill, Android side.
 *
 * Health Connect has NO equivalent for date of birth or biological sex -- they are not
 * record types -- so age and gender are always asked on Android even when an iPhone user
 * would have had them filled. That asymmetry is the platform's, not a gap here.
 */
export async function readOnboardingProfile() {
  if (!(await ensureInitialized())) return {};

  const now = Date.now();
  const monthAgo = new Date(now - 30 * 86400000);
  const weekAgo = new Date(now - 7 * 86400000);
  const until = new Date(now);

  const [height, weight, rhr, bp, glucose, exercise, sleep] = await Promise.all([
    read('Height', monthAgo, until),
    read('Weight', monthAgo, until),
    read('RestingHeartRate', monthAgo, until),
    read('BloodPressure', monthAgo, until),
    read('BloodGlucose', monthAgo, until),
    read('ExerciseSession', weekAgo, until),
    read('SleepSession', weekAgo, until),
  ]);

  const out = {};
  const put = (key, value, decimals = 0) => {
    if (!Number.isFinite(value) || value <= 0) return;
    const f = 10 ** decimals;
    out[key] = Math.round(value * f) / f;
  };
  const newest = (rows, timeKey = 'time') =>
    Array.isArray(rows) && rows.length
      ? rows.reduce((a, b) => (new Date(b[timeKey]) > new Date(a[timeKey]) ? b : a))
      : null;

  const h = newest(height);
  if (h) put('height_cm', (h.height?.inMeters ?? h.height?.value) * 100);

  const w = newest(weight);
  if (w) put('weight_kg', w.weight?.inKilograms ?? w.weight?.value, 1);

  const r = newest(rhr);
  if (r) put('pulse', r.beatsPerMinute);

  const b = newest(bp);
  if (b) {
    const sys = b.systolic?.inMillimetersOfMercury ?? b.systolic?.value;
    const dia = b.diastolic?.inMillimetersOfMercury ?? b.diastolic?.value;
    if (Number.isFinite(sys) && Number.isFinite(dia)) {
      put('bp_upper', sys);
      put('bp_lower', dia);
    }
  }

  const g = newest(glucose);
  if (g) put('bs_am', glucoseToMgDl(g.level?.value, g.level?.unit));

  const sessions = hcDuration(METRIC.exerciseMinutes, exercise);
  if (sessions.length) {
    const weekly = sessions.reduce((sum, s) => sum + s.value, 0);
    const band = exerciseBand(weekly);
    if (band) out.min_exercise_per_week = band;
  }

  const nights = hcSleep(sleep);
  if (nights.length) {
    const avgMinutes = nights.reduce((sum, n) => sum + n.value, 0) / nights.length;
    const band = sleepBand(avgMinutes / 60);
    if (band) out.sleep_hours = band;
  }

  return out;
}

export function openSettings() {
  try {
    openHealthConnectSettings();
    return true;
  } catch (e) {
    return false;
  }
}
