import { createSlice } from '@reduxjs/toolkit';

import {
  connectHealthThunk,
  syncHealthThunk,
  getHealthStatusThunk,
  disconnectHealthThunk,
  getHealthLatestThunk,
  getHealthSeriesThunk,
} from './healthThunks';

// NOTE ON THE STATE KEY
// The store already has `health` (redux/Home/slice -> getHealth), which holds the My Health
// screen payload. This slice is registered as `healthSync` so the two cannot collide.

const initialState = {
  // Device capability: 'available' | 'needs_update' | 'unavailable' | null (unknown yet)
  sdkStatus: null,
  // Server-side feature flag is off; hide the feature entirely rather than showing an error.
  featureDisabled: false,

  connected: false,
  platform: null,
  grantedTypes: [],
  lastSyncedAt: null,

  loadingStatus: false,
  connecting: false,
  syncing: false,
  disconnecting: false,

  // Last sync outcome, for the settings row.
  lastResult: null,
  error: null,

  // --- Read models for the data modal ---
  // latest: { metricType: { value, unit, measuredAt, origin, sourceName } }
  latest: null,
  latestTimezone: null,
  loadingLatest: false,
  // series: [{ date: 'YYYY-MM-DD', value, min, max, samples }]
  series: [],
  seriesMetric: null,
  seriesUnit: null,
  loadingSeries: false,
};

const healthSyncSlice = createSlice({
  name: 'healthSync',
  initialState,
  reducers: {
    clearHealthError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // --- status ---
      .addCase(getHealthStatusThunk.pending, state => {
        state.loadingStatus = true;
      })
      .addCase(getHealthStatusThunk.fulfilled, (state, action) => {
        const p = action.payload || {};
        state.loadingStatus = false;
        state.sdkStatus = p.sdkStatus ?? null;
        state.featureDisabled = !!p.featureDisabled;
        state.connected = !!p.enabled;
        state.platform = p.platform ?? null;
        state.grantedTypes = p.grantedTypes || [];
        state.lastSyncedAt = p.lastSyncedAt ?? null;
      })
      .addCase(getHealthStatusThunk.rejected, (state, action) => {
        state.loadingStatus = false;
        state.error = action.payload?.message || 'Could not load status';
      })

      // --- connect ---
      .addCase(connectHealthThunk.pending, state => {
        state.connecting = true;
        state.error = null;
      })
      .addCase(connectHealthThunk.fulfilled, (state, action) => {
        const p = action.payload || {};
        state.connecting = false;
        state.connected = true;
        state.platform = p.platform ?? null;
        state.grantedTypes = p.grantedTypes || [];
        state.lastSyncedAt = new Date().toISOString();
        state.lastResult = { synced: p.synced || 0, accepted: p.accepted || 0 };
      })
      .addCase(connectHealthThunk.rejected, (state, action) => {
        state.connecting = false;
        // A refused permission is a normal outcome, not an error to shout about. The UI
        // simply stays disconnected.
        state.error = action.payload?.code === 'denied' ? null : action.payload?.message;
      })

      // --- sync ---
      .addCase(syncHealthThunk.pending, state => {
        state.syncing = true;
      })
      .addCase(syncHealthThunk.fulfilled, (state, action) => {
        const p = action.payload || {};
        state.syncing = false;
        state.lastSyncedAt = new Date().toISOString();
        state.lastResult = {
          synced: p.synced || 0,
          accepted: p.accepted || 0,
          rejected: p.rejected || {},
        };
      })
      .addCase(syncHealthThunk.rejected, (state, action) => {
        state.syncing = false;
        // throttled / busy / not_connected are expected control flow, not failures.
        if (!action.payload?.silent) {
          state.error = action.payload?.message || 'Sync failed';
        }
      })

      // --- latest ---
      .addCase(getHealthLatestThunk.pending, state => {
        state.loadingLatest = true;
      })
      .addCase(getHealthLatestThunk.fulfilled, (state, action) => {
        state.loadingLatest = false;
        state.latest = action.payload?.metrics || {};
        state.latestTimezone = action.payload?.timezone || null;
        if (action.payload?.lastSyncedAt) state.lastSyncedAt = action.payload.lastSyncedAt;
      })
      .addCase(getHealthLatestThunk.rejected, state => {
        state.loadingLatest = false;
        // Deliberately not set as a user-visible error: the modal shows an empty state
        // instead, which is the same thing a user with no data would see anyway.
        state.latest = state.latest || {};
      })

      // --- series ---
      .addCase(getHealthSeriesThunk.pending, state => {
        state.loadingSeries = true;
      })
      .addCase(getHealthSeriesThunk.fulfilled, (state, action) => {
        state.loadingSeries = false;
        state.series = action.payload?.series || [];
        state.seriesMetric = action.payload?.metricType || null;
        state.seriesUnit = action.payload?.unit || null;
      })
      .addCase(getHealthSeriesThunk.rejected, state => {
        state.loadingSeries = false;
        state.series = [];
      })

      // --- disconnect ---
      .addCase(disconnectHealthThunk.pending, state => {
        state.disconnecting = true;
      })
      .addCase(disconnectHealthThunk.fulfilled, state => {
        state.disconnecting = false;
        state.connected = false;
        state.platform = null;
        state.grantedTypes = [];
        state.lastSyncedAt = null;
        state.lastResult = null;
        // Drop the read models too. Leaving them would show stale readings on a screen
        // that now says "not connected".
        state.latest = null;
        state.series = [];
      })
      .addCase(disconnectHealthThunk.rejected, (state, action) => {
        state.disconnecting = false;
        state.error = action.payload?.message || 'Could not disconnect';
      });
  },
});

export const { clearHealthError } = healthSyncSlice.actions;
export { healthSyncSlice };
export default healthSyncSlice.reducer;
