// Canonical metric catalogue for the app side of health sync.
//
// This MIRRORS backend/config/healthMetrics.js. The server rejects any sample whose unit
// disagrees with its own catalogue, so if you change a unit here you must change it there
// in the same PR or every sample of that type starts bouncing with `unit_mismatch`.

export const METRIC = {
  heartRate: 'heartRate',
  restingHeartRate: 'restingHeartRate',
  bloodPressureSystolic: 'bloodPressureSystolic',
  bloodPressureDiastolic: 'bloodPressureDiastolic',
  bloodGlucose: 'bloodGlucose',
  oxygenSaturation: 'oxygenSaturation',
  weightKg: 'weightKg',
  bmi: 'bmi',
  steps: 'steps',
  exerciseMinutes: 'exerciseMinutes',
  sleepMinutes: 'sleepMinutes',
};

// Canonical units. Must match the server exactly.
export const UNIT = {
  [METRIC.heartRate]: 'bpm',
  [METRIC.restingHeartRate]: 'bpm',
  [METRIC.bloodPressureSystolic]: 'mmHg',
  [METRIC.bloodPressureDiastolic]: 'mmHg',
  [METRIC.bloodGlucose]: 'mg/dL',
  [METRIC.oxygenSaturation]: '%',
  [METRIC.weightKg]: 'kg',
  [METRIC.bmi]: 'kg/m2',
  [METRIC.steps]: 'count',
  [METRIC.exerciseMinutes]: 'min',
  [METRIC.sleepMinutes]: 'min',
};

// The metrics we actually sync. bmi is omitted deliberately: the backend already derives it
// from weight and height during onboarding, and syncing a second source would let two
// different BMIs disagree on the same screen.
export const SYNCED_METRICS = [
  METRIC.heartRate,
  METRIC.restingHeartRate,
  METRIC.bloodPressureSystolic,
  METRIC.bloodPressureDiastolic,
  METRIC.bloodGlucose,
  METRIC.oxygenSaturation,
  METRIC.weightKg,
  METRIC.steps,
  METRIC.exerciseMinutes,
  METRIC.sleepMinutes,
];

// --- HealthKit sleep values, from RCTAppleHealthKit+Queries.m ---
// INBED and AWAKE are NOT sleep. Counting INBED would roughly double reported sleep, and on
// iOS 16+ the Watch writes an INBED sample that SPANS the CORE/DEEP/REM samples, so naive
// summing double-counts even without it. ASLEEP is the pre-iOS-16 undifferentiated value.
export const HK_ASLEEP_VALUES = ['ASLEEP', 'CORE', 'DEEP', 'REM'];

// --- Health Connect sleep stages, from constants.d.ts SleepStageType ---
// SLEEPING(2), LIGHT(4), DEEP(5), REM(6) are asleep.
// UNKNOWN(0), AWAKE(1), OUT_OF_BED(3) are not.
export const HC_ASLEEP_STAGES = [2, 4, 5, 6];

export const PLATFORM = {
  ios: 'healthkit',
  android: 'healthconnect',
};

// --- Onboarding score bands ---
//
// These strings MUST match EXERCISE_SCORE_MAP and SLEEP_MAP in the backend's
// models/onboardingModel.js character for character. An unrecognised value scores as
// undefined and silently drops that component from the Cuore Score, with no error anywhere.
// Duplicated here only because onboarding pre-fills the form field before anything has been
// synced, so the server cannot supply it. There is a test pinning every string.
export function exerciseBand(weeklyMinutes) {
  if (!Number.isFinite(weeklyMinutes)) return null;
  if (weeklyMinutes < 75) return 'Less than 75 min';
  if (weeklyMinutes <= 150) return '75 to 150 min';
  return 'More than 150 min';
}

export function sleepBand(nightlyHours) {
  if (!Number.isFinite(nightlyHours)) return null;
  if (nightlyHours < 6) return 'Less than 6 hours';
  if (nightlyHours < 7) return 'Between 6 to 7 hours';
  if (nightlyHours < 8) return 'Between 7 to 8 hours';
  if (nightlyHours <= 9) return 'Between 8 to 9 hours';
  return 'More than 9 hours';
}

// HealthKit biological sex -> the app's gender values. 'other' and 'notSet' map to null on
// purpose: scoreBmi applies different thresholds per gender, so guessing would quietly skew
// someone's score. Those users are asked instead.
export function mapBiologicalSex(raw) {
  const v = String(raw || '').toLowerCase();
  if (v === 'male') return 'male';
  if (v === 'female') return 'female';
  return null;
}
