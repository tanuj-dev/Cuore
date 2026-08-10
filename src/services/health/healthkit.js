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

import { METRIC, exerciseBand, sleepBand, mapBiologicalSex } from './types';
import {
  hkQuantity,
  hkBloodPressure,
  hkSleep,
  hkDailyTotal,
  normalizeSpO2,
} from './normalize';

// WHY WE DO NOT CALL METHODS ON THE PACKAGE'S DEFAULT EXPORT
//
// react-native-health builds its export as:
//     Object.assign({}, NativeModules.AppleHealthKit, { Constants })
//
// Object.assign copies only OWN ENUMERABLE properties. Under the old bridge
// NativeModules.X was a plain object whose methods were own properties, so that worked.
// Under the New Architecture -- which this app has enabled -- NativeModules.X is an interop
// proxy whose methods resolve through a handler rather than existing as own properties, so
// Object.assign copies nothing but Constants. Every method then reads as undefined:
//     "_reactNativeHealth.default.isAvailable is not a function"
//
// The native module itself is present and correct; only the package's export pattern is
// pre-New-Arch. So take the METHODS straight off NativeModules, and use the package purely
// for Constants, which are plain JS and unaffected.
const HK = NativeModules.AppleHealthKit;

export const isNativeModuleLinked = () => !!HK;

if (!HK) {
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
  // Onboarding pre-fill only. These are never synced to the server -- they populate the
  // basic-info form so a user with a Watch and a scale does not retype what their phone
  // already knows.
  P.DateOfBirth,
  P.BiologicalSex,
  P.Height,
  P.WaistCircumference,
];

const HK_OPTIONS = { permissions: { read: READ_PERMISSIONS, write: [] } };

/**
 * Promisify react-native-health's (err, results) callbacks. Never rejects.
 *
 * Every outcome is logged in __DEV__. A read returning nothing is indistinguishable from a
 * read that failed unless we say which happened -- HealthKit reports a denied type as an
 * error, and "no data" and "not allowed" both end up as an empty array otherwise. That
 * ambiguity cost a debugging round already.
 */
function query(method, options) {
  return new Promise(resolve => {
    const fn = HK && HK[method];

    if (typeof fn !== 'function') {
      if (__DEV__) {
        console.warn(`[healthSync] ${method} is not exposed by the native module`);
      }
      resolve([]);
      return;
    }

    try {
      fn(options, (err, results) => {
        if (err) {
          // A denied read is reported as an error. That is a normal state, not a failure:
          // the user may share heart rate but not sleep.
          if (__DEV__) {
            console.log(`[healthSync] ${method} -> error:`, err);
          }
          resolve([]);
          return;
        }

        const list = Array.isArray(results) ? results : results ? [results] : [];
        if (__DEV__) {
          console.log(
            `[healthSync] ${method} -> ${list.length} sample(s)`,
            list.length ? JSON.stringify(list[0]) : '',
          );
        }
        resolve(list);
      });
    } catch (e) {
      if (__DEV__) {
        console.warn(`[healthSync] ${method} threw:`, e?.message || e);
      }
      resolve([]);
    }
  });
}

export async function isAvailable() {
  if (!isNativeModuleLinked()) return false;

  return new Promise(resolve => {
    try {
      HK.isAvailable((err, available) => {
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
  if (!HK) return false;

  return new Promise(resolve => {
    try {
      HK.initHealthKit(HK_OPTIONS, err => {
        if (err) {
          console.warn('[healthSync] initHealthKit returned an error:', err);
        }
        resolve(!err);
      });
    } catch (e) {
      console.warn('[healthSync] initHealthKit threw:', e?.message || e);
      resolve(false);
    }
  });
}

export async function readMetrics({ metricTypes, since, until }) {
  const startDate = new Date(since).toISOString();
  const endDate = new Date(until).toISOString();
  const base = { startDate, endDate, ascending: true };

  if (__DEV__) {
    // The window itself is a suspect whenever reads come back empty: an inverted or
    // future-dated range returns nothing without erroring.
    console.log(
      `[healthSync] reading ${metricTypes.length} metric(s) from ${startDate} to ${endDate}`,
    );
  }

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
    // A statistics collection rather than raw samples, so HealthKit merges iPhone and Watch
    // counts for us -- raw samples would double-count anyone carrying both. The results
    // carry no id and their bucket edges move with the query time, so hkDailyTotal rolls
    // them into stable per-day rows. See the note on hkDailyTotal.
    jobs.push(
      query('getDailyStepCountSamples', { ...base, unit: U.count }).then(r =>
        hkDailyTotal(METRIC.steps, r)
      )
    );
  }

  if (want.has(METRIC.exerciseMinutes)) {
    // Same collection query, same lack of ids, same treatment.
    jobs.push(
      query('getAppleExerciseTime', { ...base, unit: U.minute }).then(r =>
        hkDailyTotal(METRIC.exerciseMinutes, r)
      )
    );
  }

  if (want.has(METRIC.sleepMinutes)) {
    jobs.push(query('getSleepSamples', { ...base, limit: 10000 }).then(hkSleep));
  }

  const results = await Promise.all(jobs);
  return results.flat();
}

/**
 * Values for pre-filling the onboarding form. Read straight from HealthKit rather than the
 * server, because onboarding happens before anything has ever synced.
 *
 * Returns only the keys HealthKit actually answered. A missing key means "ask the user" --
 * never a default, never a zero. On iOS a denied type is indistinguishable from an empty
 * one, so absence is the only signal available and the form must treat it as a question.
 *
 * UNITS: height and waist default to INCHES in this library and there is no centimetre unit,
 * so both are requested in metres and scaled. Reading the default would have shown a 175cm
 * person as 69cm.
 */
export async function readOnboardingProfile() {
  if (!HK) return {};

  const now = Date.now();
  const iso = ms => new Date(ms).toISOString();
  const monthAgo = { startDate: iso(now - 30 * 86400000), endDate: iso(now) };
  const weekAgo = { startDate: iso(now - 7 * 86400000), endDate: iso(now) };

  const first = arr => (Array.isArray(arr) && arr.length ? arr[0] : null);
  const latest = arr =>
    Array.isArray(arr) && arr.length
      ? arr.reduce((a, b) => (new Date(b.endDate) > new Date(a.endDate) ? b : a))
      : null;

  const [dob, sex, height, weight, waist, rhr, bp, glucose, exercise, sleep] =
    await Promise.all([
      query('getDateOfBirth', {}),
      query('getBiologicalSex', {}),
      query('getLatestHeight', { unit: U.meter }),
      query('getLatestWeight', { unit: U.gram }),
      query('getLatestWaistCircumference', { unit: U.meter }),
      query('getRestingHeartRateSamples', { ...monthAgo, unit: U.bpm }),
      query('getBloodPressureSamples', monthAgo),
      query('getBloodGlucoseSamples', { ...monthAgo, unit: U.mgPerdL }),
      query('getAppleExerciseTime', { ...weekAgo, unit: U.minute }),
      query('getSleepSamples', { ...weekAgo, limit: 10000 }),
    ]);

  const out = {};
  const put = (key, value, decimals = 0) => {
    if (!Number.isFinite(value) || value <= 0) return;
    const f = 10 ** decimals;
    out[key] = Math.round(value * f) / f;
  };

  // getDateOfBirth returns { value: <iso>, age } and either may be null.
  const age = first(dob)?.age;
  if (Number.isFinite(age) && age > 0) out.age = age;

  const gender = mapBiologicalSex(first(sex)?.value);
  if (gender) out.gender = gender;

  put('height_cm', first(height)?.value * 100);
  put('weight_kg', first(weight)?.value / 1000, 1);
  put('waist_cm', first(waist)?.value * 100);
  put('pulse', latest(rhr)?.value);

  // Both halves or nothing; half a reading is not a reading.
  const bpLatest = latest(bp);
  if (bpLatest) {
    const sys = bpLatest.bloodPressureSystolicValue;
    const dia = bpLatest.bloodPressureDiastolicValue;
    if (Number.isFinite(sys) && Number.isFinite(dia)) {
      put('bp_upper', sys);
      put('bp_lower', dia);
    }
  }

  put('bs_am', latest(glucose)?.value);

  // Weekly total, mapped to the band the Cuore Score expects.
  if (Array.isArray(exercise) && exercise.length) {
    const weekly = exercise.reduce((sum, s) => sum + (s.value || 0), 0);
    const band = exerciseBand(weekly);
    if (band) out.min_exercise_per_week = band;
  }

  // Average over nights that HAVE data, not over seven. Dividing by seven when three nights
  // were recorded reports a good sleeper as sleeping three hours.
  const nights = hkSleep(sleep);
  if (nights.length) {
    const avgMinutes = nights.reduce((sum, n) => sum + n.value, 0) / nights.length;
    const band = sleepBand(avgMinutes / 60);
    if (band) out.sleep_hours = band;
  }

  return out;
}

export function openSettings() {
  // iOS has no deep link into a specific app's Health permissions; the user has to go
  // Health app -> Sharing -> Apps. The facade surfaces this as guidance text instead.
  return false;
}
