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

import { METRIC } from './types';
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

const READ_PERMISSIONS = [
  ...new Set(Object.values(RECORD_FOR)),
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

export function openSettings() {
  try {
    openHealthConnectSettings();
    return true;
  } catch (e) {
    return false;
  }
}
