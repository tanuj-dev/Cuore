import { createAsyncThunk } from '@reduxjs/toolkit';

import { getApiCall, postApiCall, deleteApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';
import * as Health from '../../services/health';

// Must match MAX_SAMPLES_PER_REQUEST in backend/config/healthMetrics.js. A 90-day first
// sync of watch heart-rate data runs to tens of thousands of samples; the server rejects
// anything larger with a 413.
const CHUNK_SIZE = 2000;

// Foreground syncs are throttled to this. Health data does not change fast enough to be
// worth a round trip on every app switch.
const MIN_SYNC_INTERVAL_MS = 4 * 60 * 60 * 1000;

// Module-level in-flight guard. A foreground event landing during a manual pull-to-refresh
// would otherwise post the same window twice -- harmless server-side thanks to the unique
// index, but it doubles the upload for no reason.
let syncInFlight = false;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Read from the device, post in chunks, and advance anchors ONLY for what the server
 * accepted. Shared by connect and sync.
 */
async function runSync({ metricTypes } = {}) {
  const platform = Health.platformName();
  if (!platform) return { synced: 0, accepted: 0, rejected: {} };

  const { samples, anchors } = await Health.readMetrics(
    metricTypes ? { metricTypes } : undefined,
  );

  const grantedTypes = await Health.getGrantedMetrics();

  // Always POST at least once, even with nothing to send.
  //
  // The server records the connection itself -- healthSync.enabled, platform, grantedTypes
  // -- inside the sync handler. Skipping the request when Health has no data to give would
  // mean the server never learns the user connected, so the next status fetch returns
  // enabled:false and the screen asks them to connect again, forever. An empty batch is a
  // few bytes and keeps lastSyncedAt honest.
  const batches = samples.length ? chunk(samples, CHUNK_SIZE) : [[]];

  let accepted = 0;
  const rejected = {};
  let allOk = true;

  for (const batch of batches) {
    const res = await postApiCall(EndPoints.HEALTH_SYNC, {
      platform,
      samples: batch,
      grantedTypes,
    });

    if (res?.status === 200 && res?.data?.success) {
      accepted += res.data.accepted || 0;
      for (const [reason, count] of Object.entries(res.data.rejected || {})) {
        rejected[reason] = (rejected[reason] || 0) + count;
      }
    } else {
      // Stop at the first failed batch. Continuing would advance past a window the server
      // never received.
      allOk = false;
      break;
    }
  }

  // Anchors advance only when every batch landed. A partial success re-reads next time and
  // dedupes server-side, which is cheap; skipping a window silently loses data, which is not.
  if (allOk) await Health.commitAnchors(anchors);

  return { synced: samples.length, accepted, rejected, complete: allOk };
}

/**
 * Connect: request OS permission, then immediately backfill.
 *
 * On iOS a "granted" result only means the permission sheet was shown -- HealthKit refuses
 * to say what was actually allowed. The backfill result is the real signal, which is why we
 * sync straight away rather than reporting success off the permission call alone.
 */
export const connectHealthThunk = createAsyncThunk(
  'healthSync/connect',
  async (_, { rejectWithValue }) => {
    try {
      const status = await Health.getSdkStatus();
      if (status !== Health.SDK_STATUS.available) {
        return rejectWithValue({ code: status, message: 'Health data is not available on this device' });
      }

      const ok = await Health.requestHealthPermissions();
      if (!ok) {
        return rejectWithValue({ code: 'denied', message: 'Permission was not granted' });
      }

      const result = await runSync();
      const granted = await Health.getGrantedMetrics();

      return { platform: Health.platformName(), grantedTypes: granted, ...result };
    } catch (err) {
      return rejectWithValue({ code: 'error', message: err?.message || 'Could not connect' });
    }
  },
);

export const syncHealthThunk = createAsyncThunk(
  'healthSync/sync',
  async ({ force = false } = {}, { getState, rejectWithValue }) => {
    if (syncInFlight) return rejectWithValue({ code: 'busy', silent: true });

    const state = getState().healthSync || {};
    if (!state.connected) return rejectWithValue({ code: 'not_connected', silent: true });

    if (!force && state.lastSyncedAt) {
      const age = Date.now() - new Date(state.lastSyncedAt).getTime();
      if (age < MIN_SYNC_INTERVAL_MS) {
        return rejectWithValue({ code: 'throttled', silent: true });
      }
    }

    syncInFlight = true;
    try {
      return await runSync();
    } catch (err) {
      return rejectWithValue({ code: 'error', message: err?.message || 'Sync failed' });
    } finally {
      syncInFlight = false;
    }
  },
);

/** Settings-screen state: what the server thinks is connected, plus live device availability. */
export const getHealthStatusThunk = createAsyncThunk(
  'healthSync/status',
  async (_, { rejectWithValue }) => {
    try {
      const sdkStatus = await Health.getSdkStatus();

      const res = await getApiCall(EndPoints.HEALTH_STATUS);
      if (res?.status === 200 && res?.data?.success) {
        return { sdkStatus, ...res.data };
      }

      // 503 means the feature flag is off server-side. That is a deployment state, not an
      // error the user should see -- the UI hides the feature entirely.
      if (res?.status === 503) {
        return { sdkStatus, featureDisabled: true, enabled: false };
      }

      return rejectWithValue({ message: res?.data?.message || 'Could not load status' });
    } catch (err) {
      return rejectWithValue({ message: err?.message || 'Network error' });
    }
  },
);

/** Latest value per metric, for the summary list. */
export const getHealthLatestThunk = createAsyncThunk(
  'healthSync/latest',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getApiCall(EndPoints.HEALTH_LATEST);
      if (res?.status === 200 && res?.data?.success) return res.data;
      return rejectWithValue({ message: res?.data?.message || 'Could not load metrics' });
    } catch (err) {
      return rejectWithValue({ message: err?.message || 'Network error' });
    }
  },
);

/** Daily buckets for one metric, for the chart. */
export const getHealthSeriesThunk = createAsyncThunk(
  'healthSync/series',
  async ({ metricType = 'steps', days = 30 } = {}, { rejectWithValue }) => {
    try {
      const res = await getApiCall(
        `${EndPoints.HEALTH_SERIES}?metricType=${metricType}&days=${days}`,
      );
      if (res?.status === 200 && res?.data?.success) return res.data;
      return rejectWithValue({ message: res?.data?.message || 'Could not load series' });
    } catch (err) {
      return rejectWithValue({ message: err?.message || 'Network error' });
    }
  },
);

/**
 * Disconnect. Stops our syncing and optionally purges what was already stored.
 *
 * OS permissions are NOT revoked -- neither platform lets an app rescind its own grants in
 * a way that takes effect immediately (Health Connect's revokeAllPermissions needs a process
 * restart, and its own docs advise against using it for this). The UI must point the user at
 * OS settings if they want the grant gone too.
 */
export const disconnectHealthThunk = createAsyncThunk(
  'healthSync/disconnect',
  async ({ purge = false } = {}, { rejectWithValue }) => {
    try {
      const endpoint = purge
        ? `${EndPoints.HEALTH_DISCONNECT}?purge=true`
        : EndPoints.HEALTH_DISCONNECT;

      const res = await deleteApiCall(endpoint);

      // Clear local anchors regardless of the server's answer. Leaving them behind means a
      // later reconnect would skip everything since the old anchor and silently miss data.
      await Health.resetAnchors();

      if (res?.status === 200) return { purged: !!purge, deleted: res.data?.deleted || 0 };
      return rejectWithValue({ message: res?.data?.message || 'Could not disconnect' });
    } catch (err) {
      return rejectWithValue({ message: err?.message || 'Network error' });
    }
  },
);
