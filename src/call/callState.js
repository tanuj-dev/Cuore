// ─────────────────────────────────────────────────────────────────────────────
// CuoreCare call state — the SINGLE source of truth for "is there a call, and
// what is it doing right now".
//
// This is a plain module-level store (no React, no redux) on purpose: it has to be
// readable and writable from places that have no React tree and no redux Provider —
// the headless FCM background handler in index.js, notifee background events, and
// the notification helpers. React components subscribe through `useCallState()`.
//
// The lifecycle mirrors the spec:
//   idle → incoming → ringing → connecting → connected → (minimized | background) → ended
//                             ↘ declined
// `minimized`/`background` are presentation states layered on top of `connected`, so
// they are ALSO tracked as booleans (`minimized`, `pip`) — `status` reports the most
// specific state while `isCallActive()` stays true throughout.
// ─────────────────────────────────────────────────────────────────────────────

export const CallStatus = {
  IDLE: 'idle',
  INCOMING: 'incoming',
  RINGING: 'ringing',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  MINIMIZED: 'minimized',
  BACKGROUND: 'background',
  ENDED: 'ended',
  DECLINED: 'declined',
};

const INITIAL = {
  status: CallStatus.IDLE,
  appointmentId: null,
  mode: 'video',
  doctorId: null,
  doctorName: null,
  doctorPhotoUrl: null,
  appointment: null,
  // ZEGO join payload (roomId / rtcToken / zimToken / userId) — cached so restoring a
  // minimized call does NOT re-run the /join round-trip.
  joinData: null,
  connectedAt: null, // ms epoch — drives the call timer in the floating window
  minimized: false,
  pip: false, // Android system Picture-in-Picture is showing the app
  ringing: false,
  endReason: null,
};

let state = { ...INITIAL };
const listeners = new Set();

function emit() {
  listeners.forEach(fn => {
    try {
      fn(state);
    } catch (e) {
      /* a bad listener must never break the call */
    }
  });
}

export function getCallState() {
  return state;
}

export function setCallState(patch) {
  if (!patch) return state;
  let changed = false;
  const next = { ...state };
  Object.keys(patch).forEach(k => {
    if (next[k] !== patch[k]) {
      next[k] = patch[k];
      changed = true;
    }
  });
  if (!changed) return state;
  state = next;
  emit();
  return state;
}

export function resetCallState(endReason = null) {
  state = { ...INITIAL, status: CallStatus.IDLE, endReason };
  emit();
  return state;
}

export function subscribeCallState(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** True while a call occupies the device — incoming, connecting, or live. */
export function isCallActive() {
  return [
    CallStatus.INCOMING,
    CallStatus.RINGING,
    CallStatus.CONNECTING,
    CallStatus.CONNECTED,
    CallStatus.MINIMIZED,
    CallStatus.BACKGROUND,
  ].includes(state.status);
}

/** True once media is up (connected, minimized or backgrounded). */
export function isCallConnected() {
  return [CallStatus.CONNECTED, CallStatus.MINIMIZED, CallStatus.BACKGROUND].includes(
    state.status,
  );
}

// ── Duplicate-push / duplicate-event suppression ────────────────────────────
// The same incoming call can arrive twice (socket `call:incoming` AND the FCM data
// push, or a retried push). Only the first claim within the window wins, so the
// ringtone is never started twice and the UI never stacks two call screens.
const claims = new Map(); // appointmentId -> claimedAt (ms)
const CLAIM_TTL_MS = 60000;

function sweepClaims(now) {
  claims.forEach((ts, id) => {
    if (now - ts > CLAIM_TTL_MS) claims.delete(id);
  });
}

export function claimIncomingCall(appointmentId) {
  if (!appointmentId) return false;
  const now = Date.now();
  sweepClaims(now);
  if (claims.has(appointmentId)) return false;
  claims.set(appointmentId, now);
  return true;
}

/** Release the claim so a later, genuinely new call for the same appointment can ring. */
export function releaseIncomingCall(appointmentId) {
  if (appointmentId) claims.delete(appointmentId);
}

export function hasClaim(appointmentId) {
  return !!appointmentId && claims.has(appointmentId);
}
