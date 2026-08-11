// Public facade for health sync. Screens and thunks import ONLY from here -- no platform
// SDK, no platform types, no Platform.OS checks anywhere else in the app.
//
// CONTRACT: every function resolves. A denied permission, a missing Health Connect app, a
// revoked grant, a throwing native module -- all return an empty/false result rather than
// rejecting. Health sync is an enhancement; it must never be able to break the Health
// screen or block a render.

import { Platform } from 'react-native';

import { SYNCED_METRICS, PLATFORM } from './types';
import { getAnchors, advanceAnchors, clearAnchors, windowFor } from './anchors';

const isIOS = Platform.OS === 'ios';

// Loaded lazily so the other platform's native module is never touched. Importing
// react-native-health on Android (or vice versa) logs noisy warnings at best.
function adapter() {
  // Wrapped because a require() that throws at module-load time -- a missing native
  // module, a renamed export -- would otherwise escape every try/catch below and take the
  // whole screen down. Degrading to "unavailable" is the correct failure mode.
  try {
    if (isIOS) return require('./healthkit');
    if (Platform.OS === 'android') return require('./healthconnect');
  } catch (e) {
    console.warn('[healthSync] health adapter failed to load:', e?.message || e);
  }
  return null;
}

export const SDK_STATUS = {
  available: 'available',
  needsUpdate: 'needs_update',
  unavailable: 'unavailable',
};

export const platformName = () =>
  isIOS ? PLATFORM.ios : Platform.OS === 'android' ? PLATFORM.android : null;

/**
 * Three-state, because "not available" has three different remedies:
 *   available    -> show the connect button
 *   needs_update -> deep link to the Play Store listing for Health Connect
 *   unavailable  -> hide the feature; this device cannot do it
 * Never show a connect button that leads nowhere.
 */
export async function getSdkStatus() {
  const a = adapter();
  if (!a) return SDK_STATUS.unavailable;
  try {
    if (isIOS) {
      return (await a.isAvailable()) ? SDK_STATUS.available : SDK_STATUS.unavailable;
    }
    return await a.getSdkStatus();
  } catch (e) {
    return SDK_STATUS.unavailable;
  }
}

export async function isHealthAvailable() {
  return (await getSdkStatus()) === SDK_STATUS.available;
}

export async function requestHealthPermissions() {
  const a = adapter();
  if (!a) return false;
  try {
    return await a.requestPermissions();
  } catch (e) {
    return false;
  }
}

/**
 * Which metrics the user granted.
 *
 * iOS cannot answer this. HealthKit deliberately refuses to disclose read authorization --
 * telling an app "denied" would itself leak that the user has data they want hidden. So on
 * iOS we optimistically report everything and let empty reads be the real signal. Callers
 * must treat this as a hint, never as a guarantee.
 */
export async function getGrantedMetrics() {
  const a = adapter();
  if (!a) return [];
  try {
    if (isIOS) return SYNCED_METRICS;
    return await a.getGrantedMetrics();
  } catch (e) {
    return [];
  }
}

/**
 * Read canonical samples for the given metrics.
 *
 * Windows come from the stored anchors (anchor - 24h, or a 90-day backfill on first sync)
 * unless an explicit since/until is passed. Returns { samples, anchors } where `anchors`
 * are the candidate new high-water marks -- do NOT persist them until the server has
 * accepted the samples; see commitAnchors.
 */
export async function readMetrics({ metricTypes = SYNCED_METRICS, since, until } = {}) {
  const a = adapter();
  if (!a) return { samples: [], anchors: {} };

  try {
    const now = Date.now();
    const stored = await getAnchors();

    // One window per metric so a newly granted type still gets its full backfill even
    // though the others are up to date.
    const windows = new Map();
    for (const metric of metricTypes) {
      const w =
        since && until
          ? { since: new Date(since), until: new Date(until) }
          : windowFor(stored, metric, now);
      const key = `${w.since.getTime()}|${w.until.getTime()}`;
      if (!windows.has(key)) windows.set(key, { ...w, metrics: [] });
      windows.get(key).metrics.push(metric);
    }

    const batches = await Promise.all(
      [...windows.values()].map(w =>
        a.readMetrics({ metricTypes: w.metrics, since: w.since, until: w.until })
      )
    );
    const samples = batches.flat();

    // Candidate anchors: the newest endTime actually seen per metric.
    const anchors = {};
    for (const s of samples) {
      const end = new Date(s.endTime).getTime();
      if (!Number.isFinite(end)) continue;
      const prev = anchors[s.metricType] ? new Date(anchors[s.metricType]).getTime() : 0;
      if (end > prev) anchors[s.metricType] = new Date(end).toISOString();
    }

    return { samples, anchors };
  } catch (e) {
    return { samples: [], anchors: {} };
  }
}

/** Persist anchors. Call ONLY after the server has accepted the corresponding samples. */
export async function commitAnchors(anchors) {
  return advanceAnchors(anchors);
}

export async function resetAnchors() {
  return clearAnchors();
}

/**
 * Send the user to the OS settings that own these permissions.
 *
 * Returns false on iOS, which has no deep link into an app's Health sharing settings -- the
 * UI must tell the user to open Health > Sharing > Apps > Cuore instead. On Android this
 * opens Health Connect. Note that revoking is ALWAYS the user's job: neither platform lets
 * an app rescind its own granted permissions in a way that takes effect immediately.
 */
export function openHealthSettings() {
  const a = adapter();
  if (!a) return false;
  try {
    return a.openSettings();
  } catch (e) {
    return false;
  }
}

export { SYNCED_METRICS };
