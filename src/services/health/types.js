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
