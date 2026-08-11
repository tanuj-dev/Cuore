# Apple Health + Health Connect Integration — Implementation Guide

**Target:** Read health metrics from Apple HealthKit (iOS) and Android Health Connect, sync them to the Cuore backend, and use them to populate the Health screen vitals and improve Cuore Score inputs.

**Scope of this document:** every step, in order, from pre-work approvals through store submission.

**Repos touched:**
| Repo | Path | Branch |
|---|---|---|
| App | `/Users/apple/Desktop/CuoreApp` | `feature/cuorecare` → new `feature/health-sync` |
| Backend | `/Users/apple/Desktop/cuore all/cuore_backend_App&web/backend` | `feature/cuorecare` → new `feature/health-sync` |

---

## Important framing

1. **"Google Health" does not exist as an API.** Google Fit's Android and REST APIs are shut down. The Android target is **Health Connect** (`androidx.health.connect:connect-client`), built into Android 14+ and a Play Store app on Android 9–13.
2. **Read-only.** We request read permissions only. Writing back to HealthKit/Health Connect adds review scrutiny and we have no data worth writing yet.
3. **Additive, never authoritative.** A synced value pre-fills a field; the user can always overwrite. A denied permission or missing Health Connect app must never break the Health screen.
4. **Lab biomarkers cannot come from Health.** `HbA1c`, `TG_HDL_Ratio`, `HsCRP` have no equivalent record type in either SDK. They stay manual / record-upload.

### What each platform can actually give us

| Cuore field | HealthKit type | Health Connect type |
|---|---|---|
| `heartRate` | `HKQuantityTypeIdentifierHeartRate` | `HeartRate` |
| `restingHeartRate` | `HKQuantityTypeIdentifierRestingHeartRate` | `RestingHeartRate` |
| `bloodPressure` | `HKCorrelationTypeIdentifierBloodPressure` | `BloodPressure` |
| `bloodSugarPP` | `HKQuantityTypeIdentifierBloodGlucose` | `BloodGlucose` |
| `weight_kg` | `HKQuantityTypeIdentifierBodyMass` | `Weight` |
| `bmi` | `HKQuantityTypeIdentifierBodyMassIndex` | derived from Weight + Height |
| steps | `HKQuantityTypeIdentifierStepCount` | `Steps` |
| exercise minutes | `HKQuantityTypeIdentifierAppleExerciseTime` | `ExerciseSession` |
| sleep hours | `HKCategoryTypeIdentifierSleepAnalysis` | `SleepSession` |
| SpO2 | `HKQuantityTypeIdentifierOxygenSaturation` | `OxygenSaturation` |
| `HbA1c` / `TG_HDL_Ratio` / `HsCRP` | **none** | **none** |

---

# PHASE 0 — Pre-work (start before any code)

These have external lead times. Kick them off first or the build will finish and sit unreleasable.

## Step 0.1 — Resolve the existing product disclosure

`src/screens/Health/index.js:697` currently tells users verbatim:

> "Vitals (e.g., heart rate, blood pressure, blood sugar) are entered by you. Cuore does not connect to external medical devices."

Someone wrote this deliberately — likely for App Store review positioning or to stay clear of medical-device claims. **Get sign-off from whoever owns that copy before proceeding.** New copy must:
- State which categories are read, from which source
- State that data is used only to populate the user's own health view and score
- State that it is never used for advertising and never sold
- Keep the "not a medical device / not a diagnosis" disclaimer

## Step 0.2 — Google Play Health Apps Declaration

Play Console → App content → **Health apps declaration**. Required to ship any app that reads Health Connect data.

You must declare:
- Which Health Connect data types you read
- The specific in-app feature each type serves
- That data is not used for ads
- Your privacy policy URL, which must explicitly cover Health Connect data

This is a human review with real turnaround. **Submit it in week 1.** A rejection here blocks the Android release entirely, regardless of code state.

## Step 0.3 — Apple HealthKit capability

1. Apple Developer portal → Certificates, Identifiers & Profiles → your App ID (`com.cuore` bundle) → enable **HealthKit**.
2. Regenerate provisioning profiles.
3. Xcode → target `Cuore` → Signing & Capabilities → **+ Capability → HealthKit**.
4. Do **not** tick "Clinical Health Records" — that is a separate, much heavier review.

App Review requirements to be aware of:
- Purpose strings must be specific, not generic
- HealthKit data must not be stored in iCloud
- HealthKit data must not be used for advertising or shared with third parties
- Privacy policy must be linked in the App Store listing

## Step 0.4 — Android minSdk decision

`android/build.gradle:4` is currently `minSdkVersion = 24`. `androidx.health.connect:connect-client` requires **26**.

Before bumping, check Play Console → Statistics → filter by Android version, and quantify how many active users sit on API 24–25 (Android 7.0/7.1). Two options:

- **Bump to 26** (recommended if the affected slice is negligible). Simple, one-line change.
- **Keep 24, gate at runtime.** Requires `tools:overrideLibrary` in the manifest plus careful reflection-free guarding. Fragile — only take this if the user data says you must.

Record the decision in this doc before writing code.

## Step 0.5 — Privacy policy update

The website (`cuorewebsite`) privacy policy needs a dedicated section covering:
- HealthKit / Health Connect data categories read
- Purpose of each
- Retention period
- That the user can revoke at any time from OS settings
- That it is never sold or used for ads

Both Apple and Google reviewers read this. It must be live before submission.

---

# PHASE 1 — Backend (build this first)

Backend-first is the established pattern in this project. Do not start the app work until these endpoints return real data.

## Step 1.1 — New model: `models/HealthMetric.js`

There is no time-series model in the backend today (`HealthRecord`, `Medication`, `onboardingModel` are all point-in-time). Create one.

```js
// backend/models/HealthMetric.js
const mongoose = require('mongoose');

const METRIC_TYPES = [
  'heartRate',
  'restingHeartRate',
  'bloodPressureSystolic',
  'bloodPressureDiastolic',
  'bloodGlucose',
  'weightKg',
  'bmi',
  'steps',
  'exerciseMinutes',
  'sleepMinutes',
  'oxygenSaturation',
];

const healthMetricSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    metricType: { type: String, enum: METRIC_TYPES, required: true },
    value: { type: Number, required: true },
    unit: { type: String, required: true },

    // Sample window. Instantaneous samples have startTime === endTime.
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },

    source: {
      platform: { type: String, enum: ['healthkit', 'healthconnect'], required: true },
      // Originating app/device as reported by the OS, e.g. "Apple Watch", "Mi Fit"
      sourceName: { type: String },
    },

    // Stable per-sample identity for idempotent upserts.
    // HealthKit: sample UUID. Health Connect: metadata.id.
    externalId: { type: String, required: true },
  },
  { timestamps: true }
);

// The dedupe contract. Re-syncing the same window must not create duplicates.
healthMetricSchema.index(
  { userId: 1, source: 1, externalId: 1 },
  { unique: true }
);

// Query pattern: "latest N of type X for user"
healthMetricSchema.index({ userId: 1, metricType: 1, endTime: -1 });

healthMetricSchema.statics.METRIC_TYPES = METRIC_TYPES;

module.exports = mongoose.model('HealthMetric', healthMetricSchema);
```

**Why `externalId` matters:** both platforms re-emit samples when a user edits history, and a sync window will overlap the previous one. Without the unique index you will accumulate duplicates and every average will drift.

## Step 1.2 — Sync-state on the user

Add to `models/User.js`:

```js
healthSync: {
  enabled:       { type: Boolean, default: false },
  platform:      { type: String, enum: ['healthkit', 'healthconnect'] },
  grantedTypes:  [{ type: String }],
  lastSyncedAt:  { type: Date },
  // Per-type high-water mark so each sync only pulls new samples
  anchors: { type: Map, of: Date, default: {} },
},
```

## Step 1.3 — Controller: `controllers/healthMetricController.js`

Three handlers:

```js
// backend/controllers/healthMetricController.js
const HealthMetric = require('../models/HealthMetric');
const User = require('../models/User');

const MAX_BATCH = 2000;

// POST /api/v1/health-metrics/sync
exports.syncMetrics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { platform, samples = [], anchors = {} } = req.body;

    if (!['healthkit', 'healthconnect'].includes(platform)) {
      return res.status(400).json({ success: false, message: 'Invalid platform' });
    }
    if (samples.length > MAX_BATCH) {
      return res
        .status(413)
        .json({ success: false, message: `Max ${MAX_BATCH} samples per request` });
    }

    // Reject obviously bad values before they poison averages.
    const valid = samples.filter(
      s =>
        s.externalId &&
        s.metricType &&
        typeof s.value === 'number' &&
        Number.isFinite(s.value) &&
        s.startTime &&
        s.endTime &&
        new Date(s.startTime) <= new Date(s.endTime) &&
        new Date(s.endTime) <= new Date(Date.now() + 60 * 1000) // no future samples
    );

    const ops = valid.map(s => ({
      updateOne: {
        filter: { userId, 'source.platform': platform, externalId: s.externalId },
        update: {
          $set: {
            userId,
            metricType: s.metricType,
            value: s.value,
            unit: s.unit,
            startTime: new Date(s.startTime),
            endTime: new Date(s.endTime),
            source: { platform, sourceName: s.sourceName },
            externalId: s.externalId,
          },
        },
        upsert: true,
      },
    }));

    let result = { upsertedCount: 0, modifiedCount: 0 };
    if (ops.length) {
      // ordered:false so one bad sample doesn't abort the batch
      result = await HealthMetric.bulkWrite(ops, { ordered: false });
    }

    const anchorUpdates = {};
    Object.entries(anchors).forEach(([type, iso]) => {
      anchorUpdates[`healthSync.anchors.${type}`] = new Date(iso);
    });

    await User.findByIdAndUpdate(userId, {
      $set: {
        'healthSync.enabled': true,
        'healthSync.platform': platform,
        'healthSync.lastSyncedAt': new Date(),
        ...anchorUpdates,
      },
    });

    return res.json({
      success: true,
      received: samples.length,
      accepted: valid.length,
      inserted: result.upsertedCount || 0,
      updated: result.modifiedCount || 0,
    });
  } catch (err) {
    console.error('syncMetrics error:', err);
    return res.status(500).json({ success: false, message: 'Sync failed' });
  }
};

// GET /api/v1/health-metrics/:userId/latest
exports.getLatestMetrics = async (req, res) => { /* aggregate: $sort endTime desc, $group by metricType, $first */ };

// GET /api/v1/health-metrics/:userId/series?metricType=steps&days=30
exports.getMetricSeries = async (req, res) => { /* daily buckets for react-native-chart-kit */ };
```

`bulkWrite` with `ordered: false` plus the unique index is what makes the sync safely retryable — a dropped response means the app retries the same window and nothing duplicates.

## Step 1.4 — Routes: `routes/healthMetricRoutes.js`

**Deviation from the original sketch, adopted deliberately:** no route takes a `userId` from the URL. The id always comes from the verified token via `req.user.userId`.

The older `/api/v1/cuorehealth/:userId` routes accept an id in the path with only `protect` behind them, which means any authenticated user can pass someone else's id. Rather than copy that shape, these routes read the id from the token — which `protect` already populates correctly for caregiver tokens too, since a caregiver's token carries the supervised patient's id. There is simply no id to tamper with.

```js
router.use(featureGate);                       // 503 while HEALTH_SYNC_ENABLED !== "true"

router.get('/status', protect, getSyncStatus);
router.get('/latest', protect, getLatestMetrics);
router.get('/series', protect, getMetricSeries);
router.post('/sync', protect, syncMetrics);
router.delete('/', protect, disconnectSync);
```

`/status` and `DELETE` were added beyond the original three: the settings screen needs to render connection state, and disconnect must be able to clear anchors (and optionally purge samples via `?purge=true`).

Mounted in `server.js` next to the CuoreCare mount:

```js
app.use('/api/v1/health-metrics', require('./routes/healthMetricRoutes.js'));
```

## Step 1.4b — Dark-ship flag

Added to mirror the CuoreCare pattern: every route 503s while `HEALTH_SYNC_ENABLED !== "true"`. This lets the backend merge and deploy to Render long before the Play Health Apps Declaration clears, with zero user-facing effect. `config/healthSyncFlags.js` holds the flag; set `HEALTH_SYNC_ENABLED=true` in the Render dashboard to turn it on.

## Step 1.5 — Feed the Health screen — DONE

`controllers/cuoreHealthController.js` → `getCuoreHealthData` builds the `healthObservations` object consumed at `src/screens/Health/index.js:146`. It now fills any vital the user has **not** entered from the newest `HealthMetric`, and tags the origin:

```js
healthObservations.heartRate = {
  value: 72,
  status: 'green',
  origin: 'healthkit',        // 'manual' | 'healthkit' | 'healthconnect'
  measuredAt: '2026-08-07T06:12:00Z',
};
```

The `origin` field is what lets the UI show a provenance chip instead of silently presenting device data as self-reported. Manual entry wins every tie — a user who typed a value meant it. Anything not filled from sync is labelled `origin: 'manual'` so the app never has to guess.

Only `heartRate`, `bloodPressure` and `bloodSugarPP` participate; the lab values have no platform equivalent. Blood pressure requires **both** systolic and diastolic — one without the other is not a reading. The systolic/diastolic thresholds were extracted into a local `getBpStatus(sys, dia)` so manual and synced readings score identically; equivalence was verified against the original inline logic across all 23,711 sys/dia combinations.

## Step 1.6 — Backend verification before moving on

```bash
cd "/Users/apple/Desktop/cuore all/cuore_backend_App&web/backend" && npm start
```

Then, with a real bearer token:
- POST the same 50-sample batch **twice**. Second call must report `inserted: 0`. If it inserts again, the unique index is wrong — fix before continuing.
- POST a sample with a future `endTime`. Must be rejected, not stored.
- GET `/latest` and confirm one row per `metricType`.

---

# PHASE 2 — iOS native setup

## Step 2.1 — Install the library — DONE (`react-native-health`, not the Nitro one)

The original recommendation here was `@kingstinct/react-native-healthkit`, on the reasoning that New Architecture is on and `react-native-nitro-modules` was already a dependency. **That reasoning was wrong** — the installed nitro version is pinned by something else:

| Package | Requires nitro |
|---|---|
| `react-native-iap@14.7.7` (installed) | `^0.31.1` → 0.31.x only |
| `@kingstinct/react-native-healthkit` ≥13.2.3 | ≥0.33 |
| `@kingstinct/react-native-healthkit` ≥13.3.1 | ≥0.35 |
| `react-native-iap@16.1.0` (latest) | `^0.36.5` |
| `react-native-health@1.19.0` | none |

Using the Nitro library means dragging `react-native-iap` from 14 → 16, a two-major upgrade that rewrites subscription verification. Not worth it for a nicer HealthKit API.

```bash
npm install react-native-health --legacy-peer-deps
```

`react-native-iap` stays on 14.7.7 and nitro on 0.31.10 — verify both after installing.

**This is not a React Native version problem.** RN 0.81.1 satisfies every candidate library (they all peer `>=0.79`), so upgrading RN would not resolve it.

Trade-off accepted: an older callback-based API running through the New Architecture interop layer. Both are hidden behind the `src/services/health/` facade, so if IAP is ever upgraded for its own reasons, swapping to the Nitro library touches only the iOS adapter.

**Pin the exact version and read that version's README before writing query code** — do not copy API names from memory or from this doc without checking.

## Step 2.2 — Entitlement

`ios/Cuore/Cuore.entitlements` currently only has `aps-environment`. Xcode's HealthKit capability (Step 0.3) adds this automatically — verify it lands:

```xml
<key>com.apple.developer.healthkit</key>
<true/>
```

Do not hand-add `com.apple.developer.healthkit.access` unless you are doing clinical records.

## Step 2.3 — Purpose strings

`ios/Cuore/Info.plist` — add next to the existing usage descriptions (around line 36):

```xml
<key>NSHealthShareUsageDescription</key>
<string>Cuore reads your heart rate, blood pressure, blood glucose, weight, steps, exercise and sleep from Apple Health to keep your health dashboard and Cuore Score up to date without manual entry.</string>
```

Only add `NSHealthUpdateUsageDescription` if you later decide to write. Vague strings ("to improve your experience") get rejected.

## Step 2.4 — Pods

```bash
cd /Users/apple/Desktop/CuoreApp/ios && pod install
```

## Step 2.5 — Simulator caveat

The iOS Simulator has no Health data. Add samples manually via the Health app in the Simulator, or test on a physical device. **Blood pressure and sleep in particular are easiest to verify on a real device.**

---

# PHASE 3 — Android native setup

## Step 3.1 — Install

```bash
cd /Users/apple/Desktop/CuoreApp && npm install react-native-health-connect
```

## Step 3.2 — Bump minSdk

`android/build.gradle:4`:

```groovy
minSdkVersion = 26   // was 24 — required by androidx.health.connect:connect-client
```

## Step 3.3 — Manifest permissions

`android/app/src/main/AndroidManifest.xml` — add to the existing `<uses-permission>` block:

```xml
<!-- Health Connect (read-only) -->
<uses-permission android:name="android.permission.health.READ_HEART_RATE" />
<uses-permission android:name="android.permission.health.READ_RESTING_HEART_RATE" />
<uses-permission android:name="android.permission.health.READ_BLOOD_PRESSURE" />
<uses-permission android:name="android.permission.health.READ_BLOOD_GLUCOSE" />
<uses-permission android:name="android.permission.health.READ_WEIGHT" />
<uses-permission android:name="android.permission.health.READ_HEIGHT" />
<uses-permission android:name="android.permission.health.READ_STEPS" />
<uses-permission android:name="android.permission.health.READ_EXERCISE" />
<uses-permission android:name="android.permission.health.READ_SLEEP" />
<uses-permission android:name="android.permission.health.READ_OXYGEN_SATURATION" />
```

Add to the existing `<queries>` block (there is already one for `market://`):

```xml
<package android:name="com.google.android.apps.healthdata" />
```

Without that, you cannot detect whether Health Connect is installed on Android 9–13.

## Step 3.4 — Permission rationale (both variants required)

Health Connect requires a screen explaining *why* you want the data, reachable from Health Connect's own settings. The mechanism differs by API level, and you need **both**.

Inside `<application>`, on the existing `.MainActivity` (`AndroidManifest.xml`, around line 78) — for API < 34:

```xml
<intent-filter>
  <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
</intent-filter>
```

And as a sibling of `MainActivity` — for API 34+:

```xml
<activity-alias
  android:name="ViewPermissionUsageActivity"
  android:exported="true"
  android:targetActivity=".MainActivity"
  android:permission="android.permission.START_VIEW_PERMISSION_USAGE">
  <intent-filter>
    <action android:name="android.intent.action.VIEW_PERMISSION_USAGE" />
    <category android:name="android.intent.category.HEALTH_PERMISSIONS" />
  </intent-filter>
</activity-alias>
```

Note `MainActivity` is `launchMode="singleTask"` — the rationale intent will surface through `onNewIntent`, so route it in JS via the existing deep-link/intent handling rather than assuming a cold start.

## Step 3.5 — Availability handling

Three distinct states the UI must handle separately:

| `getSdkStatus()` | Meaning | UI action |
|---|---|---|
| `SDK_AVAILABLE` | Ready | Show the connect button |
| `SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED` | Installed but old | Deep-link to Play Store listing for `com.google.android.apps.healthdata` |
| `SDK_UNAVAILABLE` | Not supported on this device | Hide the feature entirely |

Never show a connect button that leads to a dead end.

---

# PHASE 4 — JS facade layer

`src/services/` exists but is empty. This is where the platform abstraction lives, so no screen ever imports a platform SDK.

```
src/services/health/
  index.js          — public API, the only thing screens/thunks import
  types.js          — canonical metric names, units, METRIC_CONFIG
  healthkit.js      — iOS adapter
  healthconnect.js  — Android adapter
  normalize.js      — platform sample → canonical sample
  anchors.js        — per-type high-water marks in EncryptedStorage
```

## Step 4.1 — Canonical sample shape

Every adapter must return exactly this, whatever the platform gave it:

```js
{
  metricType: 'heartRate',      // from METRIC_TYPES, matches backend enum
  value: 72,
  unit: 'bpm',
  startTime: '2026-08-07T06:12:00.000Z',
  endTime:   '2026-08-07T06:12:00.000Z',
  externalId: 'A1B2C3-...',     // HK sample UUID | HC metadata.id
  sourceName: 'Apple Watch',
}
```

## Step 4.2 — Unit normalization (get this right or the data is garbage)

Do the conversion in `normalize.js`, once, and never trust the platform default:

| Metric | Canonical unit | Trap |
|---|---|---|
| `bloodGlucose` | mg/dL | HealthKit returns mol/L by default; HC returns `millimolesPerLiter`. **× 18.0182** to reach mg/dL |
| `weightKg` | kg | HealthKit may return pounds depending on locale |
| `oxygenSaturation` | % | Both return a 0–1 fraction. **× 100** |
| `sleepMinutes` | minutes | HK gives per-stage `INBED`/`ASLEEP*` categories; sum only asleep stages, and de-overlap them |
| `bloodPressure` | mmHg | HK is a *correlation* holding two samples; split into `bloodPressureSystolic` + `bloodPressureDiastolic` sharing one `externalId` prefix |
| `exerciseMinutes` | minutes | HC gives session start/end; compute duration. HK gives minutes directly |
| `steps` | count | **Deduplicate across sources** — iPhone and Watch both report steps; HealthKit's statistics query already merges, raw sample queries do not |

Write a unit test per row. This table is where integrations like this actually fail.

## Step 4.3 — Public facade

`src/services/health/index.js` exposes only these, and never throws:

```js
export async function isHealthAvailable()        // → boolean
export async function getSdkStatus()             // → 'available' | 'needs_update' | 'unavailable'
export async function requestHealthPermissions() // → { granted: string[], denied: string[] }
export async function getGrantedPermissions()    // → string[]
export async function readMetrics({ metricTypes, since, until })  // → canonical samples[]
export async function openHealthSettings()       // → void
```

Contract: every function resolves. Permission denial, a missing provider, a revoked grant — all return empty/false, never a rejected promise. A health-sync failure must not be able to break the Health screen render.

## Step 4.4 — Anchors

Store per-metric high-water marks in `EncryptedStorage` (the app already uses it for `auth_tokens`) under `health_sync_anchors`. On each sync, read from `anchor - 24h` (overlap covers late-arriving samples from a watch that synced afterwards) and rely on the backend's unique index to absorb the duplicates. First-ever sync: pull 90 days.

---

# PHASE 5 — Redux + sync orchestration

Follow the existing per-feature folder pattern.

```
src/redux/Health/
  slice.js         — { available, status, connected, grantedTypes, lastSyncedAt, syncing, error }
  healthThunks.js  — connectHealthThunk, syncHealthThunk, disconnectHealthThunk
```

## Step 5.1 — Thunks

- **`connectHealthThunk`** — check availability → request permissions → immediate 90-day backfill → POST to `/sync`
- **`syncHealthThunk`** — read granted types since anchor → normalize → chunk into ≤2000-sample batches → POST each → advance anchors **only on a 2xx**
- **`disconnectHealthThunk`** — clear local anchors, flip `healthSync.enabled` false server-side. Note: you cannot revoke OS permissions programmatically; the UI must point the user to `openHealthSettings()`.

## Step 5.2 — Register

- `src/redux/store.js`: add `health: healthSlice.reducer` — careful, the key `health` is **already taken** by `getHealth.reducer` (line ~44). Use `healthSync` as the state key to avoid a silent collision.
- `src/redux/slices.js`: re-export the three thunks alongside the existing exports.
- `src/utilities/Endpoints.js`: add

```js
HEALTH_SYNC: '/api/v1/health-metrics',        // POST /:userId/sync
HEALTH_LATEST: '/api/v1/health-metrics',      // GET  /:userId/latest
HEALTH_SERIES: '/api/v1/health-metrics',      // GET  /:userId/series
```

Use the existing `postApiCall` / `getApiCall` from `src/utilities/Services.js` — they already attach the bearer token from `EncryptedStorage`.

## Step 5.3 — Sync triggers

Deliberately conservative:

1. On successful connect (backfill)
2. On app foreground, **only if** `lastSyncedAt > 4h` ago
3. Manual pull-to-refresh on the Health screen
4. Never on render, never on a timer, never per-screen-mount

Guard with an in-flight flag so a foreground event during a manual sync doesn't double-post.

---

# PHASE 6 — UI

## Step 6.1 — Connect entry point

Add a "Connected Health Sources" row in `src/screens/Profile` (or `EditProfile`), following the existing row styling. States: not connected → connected (N types, last synced) → needs update → unavailable.

Per the project's UI standard: **no emojis. Use `lucide-react-native`**, which is already a dependency. `HeartPulse`, `Activity`, `RefreshCw`, `Link2Off` cover this.

## Step 6.2 — Pre-permission explainer screen

Do not fire the OS permission sheet cold. Show a Cuore-styled screen first: which data, why, that it's read-only, that they can disconnect anytime. This measurably improves grant rates and Apple reviewers look for it.

## Step 6.3 — Health screen provenance

In `src/screens/Health/index.js`, `getHealthObservationsData` (line 229) gains a provenance chip per observation using the `origin` field from Step 1.5 — "From Apple Health · 2h ago" vs "Entered by you". Users must never be unable to tell which is which.

## Step 6.4 — Replace the disclosure copy

`src/screens/Health/index.js:697` — swap in the copy approved in Step 0.1.

## Step 6.5 — Score inputs

`min_exercise_per_week` (`models/onboardingModel.js:60`) and `sleep_hours` (line 69) are self-reported strings feeding `exerciseScore`, `sleepScore` and the fitness formula at line 415. Where synced data exists, pre-fill the reassessment form with the computed real value and label it as such — still editable. `weight_kg` / `bmi` already have history arrays at lines 110–115 ready to receive the series.

This is the highest-value part of the whole integration: it replaces guesswork inside the score itself. Ship it as pre-fill, not silent substitution, so score changes stay explainable to the user.

---

# PHASE 7 — Testing

## Unit
- `normalize.js` — one test per row of the Step 4.2 unit table, including the mol/L → mg/dL factor and the 0–1 → % SpO2 case
- Sleep stage summing with deliberately overlapping stages
- Blood pressure correlation split
- Anchor advance logic: must **not** advance on a failed POST

## Integration (backend)
- Double-POST idempotency (`inserted: 0` on the second)
- 2001-sample batch → 413
- Future-dated sample → rejected
- `/latest` returns exactly one row per metric type

## Device matrix
| Case | Expected |
|---|---|
| iOS, all permissions granted | Full sync |
| iOS, partial grant | Only granted types sync; no error state |
| iOS, all denied | Feature shows "not connected", Health screen unaffected |
| iOS, permission revoked in Settings after connecting | Next sync degrades quietly, UI reflects it |
| Android 14+ (built-in Health Connect) | Full sync |
| Android 9–13, Health Connect installed | Full sync |
| Android 9–13, **not** installed | Play Store deep link, no crash |
| Android, no data in Health Connect | Empty state, not an error |
| Airplane mode mid-sync | Anchors do not advance; retry succeeds |
| Two rapid foreground events | Single sync, no double-post |

**HealthKit cannot be tested meaningfully on the Simulator.** Budget for a physical iPhone, ideally one with a paired Watch for the multi-source step dedupe case.

## Regression
Confirm the Health screen, Cuore Score and reassessment flow all behave identically with the feature switched off. This must be a strictly additive change.

---

# PHASE 8 — Release

## Step 8.1 — iOS
- Purpose strings final and specific
- Privacy policy live and linked
- App Store Connect → App Privacy → declare Health & Fitness data collection, linkage, and purpose
- Review notes: state plainly that HealthKit is read-only, used to populate the user's own dashboard, never used for ads, never stored in iCloud
- Provide a demo account with seeded health data — reviewers will not connect their own Health data

## Step 8.2 — Android
- Health Apps Declaration **approved** (Step 0.2 — verify, don't assume)
- Data safety form updated for health data
- minSdk bump noted in release notes
- Test on both an Android 14+ device (built-in provider) and an Android 12 device (APK provider)

## Step 8.3 — Post-release
- Track grant rate, sync success rate, and samples-per-user
- Watch for the duplicate-sample signature: a user whose sample count grows without their activity doing so. That means an `externalId` collision path you missed.

---

# Effort estimate

| Phase | Estimate |
|---|---|
| 0 — Pre-work | 1 day of work; **approvals run for weeks in parallel** |
| 1 — Backend | 3–4 days |
| 2 — iOS native | 1 day |
| 3 — Android native | 1–2 days (incl. rationale activity) |
| 4 — Facade + normalization | 3–4 days (unit conversion is the real cost) |
| 5 — Redux + sync | 2 days |
| 6 — UI | 3–4 days |
| 7 — Testing | 3 days (device matrix) |
| 8 — Release | 1 day + review turnaround |

**~3.5 weeks of engineering.** Play's Health Apps Declaration is the schedule risk, not the code — start it on day one.

## Suggested narrower v1

If you want something shippable sooner: **steps + sleep + weight only.**
- No blood pressure correlation splitting, no glucose unit conversion — the two hardest normalization cases drop out
- Directly improves `exerciseScore` and `sleepScore`, the highest-value target
- Same Phase 0 approvals, same plumbing
- **~2 weeks**, and Phases 1–5 are built to extend by adding rows to `METRIC_TYPES`
