// Per-metric high-water marks: the newest sample endTime we have successfully synced.
//
// Stored in EncryptedStorage alongside auth_tokens, following the app's existing pattern.
// The server also keeps anchors (User.healthSync.anchors) and is the authority -- these are
// a local fast path so a sync does not need a round trip before it can start reading.

import EncryptedStorage from 'react-native-encrypted-storage';

const KEY = 'health_sync_anchors';

// Every read window starts this far BEFORE the stored anchor. A watch can deliver samples
// hours after the fact, and a window that began exactly at the anchor would skip them
// forever. The server's unique index absorbs the resulting overlap.
export const OVERLAP_MS = 24 * 60 * 60 * 1000;

// First-ever sync reaches back this far. The server rejects anything older than 400 days.
export const BACKFILL_DAYS = 90;

export async function getAnchors() {
  try {
    const raw = await EncryptedStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return {};
  }
}

/**
 * Advance anchors. Only ever moves forward -- an out-of-order response must not rewind a
 * later one and cause the same window to be re-read indefinitely.
 *
 * Call this ONLY after the server has accepted the samples. Advancing on a failed POST
 * silently drops that window.
 */
export async function advanceAnchors(updates) {
  try {
    const current = await getAnchors();
    let changed = false;

    for (const [metricType, iso] of Object.entries(updates || {})) {
      const next = new Date(iso).getTime();
      if (!Number.isFinite(next)) continue;
      const prev = current[metricType] ? new Date(current[metricType]).getTime() : 0;
      if (next > prev) {
        current[metricType] = new Date(next).toISOString();
        changed = true;
      }
    }

    if (changed) await EncryptedStorage.setItem(KEY, JSON.stringify(current));
    return current;
  } catch (e) {
    // A failed anchor write costs a re-read next sync, which dedupes server-side. Safe.
    return {};
  }
}

/** Read window for a metric: anchor - 24h, or the backfill window on first sync. */
export function windowFor(anchors, metricType, now = Date.now()) {
  const anchor = anchors?.[metricType] ? new Date(anchors[metricType]).getTime() : null;
  const since = Number.isFinite(anchor)
    ? anchor - OVERLAP_MS
    : now - BACKFILL_DAYS * 24 * 60 * 60 * 1000;
  return { since: new Date(since), until: new Date(now) };
}

export async function clearAnchors() {
  try {
    await EncryptedStorage.removeItem(KEY);
  } catch (e) {
    // Nothing to do; a stale anchor only causes a redundant re-read.
  }
}
