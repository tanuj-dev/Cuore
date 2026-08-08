// iOS adapter. Querying and permissions only -- all reshaping lives in normalize.js.
//
// UNIT DEFAULTS ARE A TRAP HERE. react-native-health picks its own defaults when the
// `unit` option is omitted, and two of them are wrong for us (verified in
// RCTAppleHealthKit+Methods_Results.m / +Methods_Body.m):
//
//   blood glucose -> mmol/L   (we need mg/dL; unset, every reading lands ~18x low)
//   body mass     -> pounds   (we need kg)
//
// The returned samples do NOT echo which unit was used, so a wrong default is invisible
// downstream. Always pass `unit` explicitly for those two.

import { NativeModules } from 'react-native';
import AppleHealthKit from 'react-native-health';

import { METRIC } from './types';
import {
  hkQuantity,
  hkBloodPressure,
  hkSleep,
  normalizeSpO2,
} from './normalize';

// react-native-health builds its export as Object.assign({}, NativeModules.AppleHealthKit,
// { Constants }). Constants is plain JS, so the import SUCCEEDS even when the native module
// is missing -- you just get an object with no methods. Without this check, an unlinked
// build is indistinguishable from a device that genuinely lacks HealthKit, and both surface
// as a bland "not supported on this device".
export const isNativeModuleLinked = () => !!(NativeModules && NativeModules.AppleHealthKit);

if (!isNativeModuleLinked()) {
  console.warn(
    '[healthSync] NativeModules.AppleHealthKit is missing. The JS package is installed but ' +
      'the native pod is not in this build. Run `cd ios && LANG=en_US.UTF-8 pod install`, ' +
      'then rebuild from Xcode (Product > Clean Build Folder first). HealthKit will report ' +
      'as unavailable until then.',
  );
}

const P = AppleHealthKit.Constants.Permissions;
const U = AppleHealthKit.Constants.Units;

// Read-only. Nothing is ever written back to Health.
const READ_PERMISSIONS = [
  P.HeartRate,
  P.RestingHeartRate,
  P.BloodPressureSystolic,
  P.BloodPressureDiastolic,
  P.BloodGlucose,
  P.OxygenSaturation,
  P.Weight,
  P.Steps,
  P.AppleExerciseTime,
  P.SleepAnalysis,
];

const HK_OPTIONS = { permissions: { read: READ_PERMISSIONS, write: [] } };

/** Promisify react-native-health's (err, results) callbacks. Never rejects. */
function query(method, options) {
  return new Promise(resolve => {
    const fn = AppleHealthKit[method];
    if (typeof fn !== 'function') {
      resolve([]);
      return;
    }
    try {
      fn(options, (err, results) => {
        if (err) {
          // A denied read is reported as an error. That is a normal state, not a failure:
          // the user is allowed to share heart rate but not sleep.
          resolve([]);
          return;
        }
        resolve(Array.isArray(results) ? results : results ? [results] : []);
      });
    } catch (e) {
      resolve([]);
    }
  });
}

export async function isAvailable() {
  if (!isNativeModuleLinked()) return false;

  return new Promise(resolve => {
    try {
      AppleHealthKit.isAvailable((err, available) => {
        if (err) {
          console.warn('[healthSync] HealthKit isAvailable returned an error:', err);
        }
        resolve(!err && !!available);
      });
    } catch (e) {
      console.warn('[healthSync] HealthKit isAvailable threw:', e?.message || e);
      resolve(false);
    }
  });
}

/**
 * HealthKit deliberately does NOT tell an app which read permissions were granted -- that
 * would leak the fact that a user has, say, a pregnancy or medication record. initHealthKit
 * resolving only means the sheet was shown. Treat every type as "possibly granted" and let
 * empty results speak for themselves.
 */
export async function requestPermissions() {
  return new Promise(resolve => {
    try {
      AppleHealthKit.initHealthKit(HK_OPTIONS, err => resolve(!err));
    } catch (e) {
      resolve(false);
    }
  });
}

export async function readMetrics({ metricTypes, since, until }) {
  const startDate = new Date(since).toISOString();
  const endDate = new Date(until).toISOString();
  const base = { startDate, endDate, ascending: true };
  const want = new Set(metricTypes);
  const jobs = [];

  if (want.has(METRIC.heartRate)) {
    jobs.push(
      query('getHeartRateSamples', { ...base, unit: U.bpm }).then(r =>
        hkQuantity(METRIC.heartRate, r)
      )
    );
  }

  if (want.has(METRIC.restingHeartRate)) {
    jobs.push(
      query('getRestingHeartRateSamples', { ...base, unit: U.bpm }).then(r =>
        hkQuantity(METRIC.restingHeartRate, r)
      )
    );
  }

  if (want.has(METRIC.bloodPressureSystolic) || want.has(METRIC.bloodPressureDiastolic)) {
    // One call returns both halves; normalize fans it out into two metrics.
    jobs.push(query('getBloodPressureSamples', base).then(hkBloodPressure));
  }

  if (want.has(METRIC.bloodGlucose)) {
    // Explicit mgPerdL -- the library would otherwise default to mmol/L.
    jobs.push(
      query('getBloodGlucoseSamples', { ...base, unit: U.mgPerdL }).then(r =>
        hkQuantity(METRIC.bloodGlucose, r)
      )
    );
  }

  if (want.has(METRIC.oxygenSaturation)) {
    // HKUnit percentUnit yields a 0-1 fraction despite the name.
    jobs.push(
      query('getOxygenSaturationSamples', { ...base, unit: U.percent }).then(r =>
        hkQuantity(METRIC.oxygenSaturation, r, normalizeSpO2)
      )
    );
  }

  if (want.has(METRIC.weightKg)) {
    // Explicit grams -- the library would otherwise default to pounds. There is no kg unit
    // in its enum, so convert here.
    jobs.push(
      query('getWeightSamples', { ...base, unit: U.gram }).then(r =>
        hkQuantity(METRIC.weightKg, r, g => g / 1000)
      )
    );
  }

  if (want.has(METRIC.steps)) {
    // Daily buckets rather than raw samples: HealthKit merges iPhone and Watch step counts
    // for us here. Raw samples would double-count a user who carries both.
    jobs.push(
      query('getDailyStepCountSamples', { ...base, unit: U.count }).then(r =>
        hkQuantity(METRIC.steps, r)
      )
    );
  }

  if (want.has(METRIC.exerciseMinutes)) {
    jobs.push(
      query('getAppleExerciseTime', { ...base, unit: U.minute }).then(r =>
        hkQuantity(METRIC.exerciseMinutes, r)
      )
    );
  }

  if (want.has(METRIC.sleepMinutes)) {
    jobs.push(query('getSleepSamples', { ...base, limit: 10000 }).then(hkSleep));
  }

  const results = await Promise.all(jobs);
  return results.flat();
}

export function openSettings() {
  // iOS has no deep link into a specific app's Health permissions; the user has to go
  // Health app -> Sharing -> Apps. The facade surfaces this as guidance text instead.
  return false;
}
