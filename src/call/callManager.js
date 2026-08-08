// ─────────────────────────────────────────────────────────────────────────────
// CuoreCare call manager — the one place that decides what happens to a call.
//
// It keeps four things in sync, which is exactly what the previous implementation did
// not do:
//   1. call state       (src/call/callState.js — the source of truth)
//   2. the ringtone     (src/realtime/ringtone.js)
//   3. the notification (src/notifications/incomingCall.js + the ongoing-call FGS)
//   4. the UI           (navigation, via the root navigation ref)
//
// ZEGO's own join/leave logic is deliberately NOT touched here: the Consultation screen
// still owns it. This module only tells the UI where to go and keeps the OS-level bits
// (ring, vibration, notification, foreground service, PiP flag) consistent.
// ─────────────────────────────────────────────────────────────────────────────
import { AppState } from 'react-native';

import {
  CallStatus,
  getCallState,
  setCallState,
  resetCallState,
  claimIncomingCall,
  releaseIncomingCall,
  isCallActive,
  isCallConnected,
} from './callState';
import { startRing, stopRing } from '../realtime/ringtone';
import {
  displayIncomingCallNotification,
  cancelIncomingCallNotification,
  declineIncomingCall as tellBackendDeclined,
} from '../notifications/incomingCall';
import { startOngoingCallNotification, stopOngoingCallNotification } from './ongoingCall';
import { setNativeCallActive } from './pip';
import { clearRouteParams, destroyMinimizedZegoCall, isZegoMinimized } from './zegoMinimize';
import {
  navigationRef,
  navigateWhenReady,
  navigateAfterBoot,
} from '../navigation/navigationRef';
import { recordConsultationEvent } from '../redux/CuoreCare/thunks';

const isForeground = () => AppState.currentState === 'active';

function startRinging() {
  if (getCallState().ringing) return;
  setCallState({ ringing: true });
  startRing();
}

/**
 * Make sure the device is ringing for the call that is currently on screen. Used by the
 * incoming-call screen: when it is opened by TAPPING the notification, the notification
 * (and its channel ringtone) is cancelled, so the in-app ring has to take over.
 */
export function ensureRinging() {
  const s = getCallState();
  if (s.status !== CallStatus.RINGING && s.status !== CallStatus.INCOMING) return;
  if (!isForeground()) return;
  startRinging();
}

export function stopRinging() {
  if (!getCallState().ringing) {
    stopRing(); // belt and braces — a ring started elsewhere must still die
    setCallState({ ringing: false });
    return;
  }
  setCallState({ ringing: false });
  stopRing();
}

/**
 * A call is arriving. Called from THREE independent sources — the realtime socket, the
 * FCM foreground message, and the notification tap — so it must be idempotent.
 *
 * @param payload {appointmentId, mode, from:{name,photoUrl}, appointment, doctorName}
 * @param source  'socket' | 'fcm' | 'notification'
 */
export function handleIncomingCall(payload = {}, source = 'socket') {
  const appointmentId = payload.appointmentId;
  if (!appointmentId) return;

  // Already in a live call → do not hijack it. (Multiple simultaneous incoming calls:
  // the first one wins, the later one is declined as busy below.)
  if (isCallConnected() && getCallState().appointmentId !== appointmentId) {
    recordConsultationEvent(appointmentId, 'declined');
    cancelIncomingCallNotification(appointmentId);
    return;
  }

  const fresh = claimIncomingCall(appointmentId);
  if (!fresh) {
    // Duplicate push/event for the SAME call: never ring twice. But if it arrived via a
    // notification tap we still bring the UI up.
    if (source === 'notification' && !isCallConnected()) openIncomingCallScreen(payload);
    return;
  }

  const doctorName = payload.doctorName || payload.from?.name || 'Your doctor';
  setCallState({
    status: CallStatus.RINGING,
    appointmentId,
    mode: payload.mode || 'video',
    doctorId: payload.appointment?.doctorId?._id || payload.appointment?.doctorId || null,
    doctorName,
    doctorPhotoUrl: payload.from?.photoUrl || null,
    appointment: payload.appointment || null,
    joinData: null,
    connectedAt: null,
    minimized: false,
    endReason: null,
  });

  if (isForeground()) {
    // In-app: the full-screen call UI + our own looping ring/vibration.
    startRinging();
    openIncomingCallScreen({ ...payload, doctorName });
  } else {
    // Backgrounded but still alive (socket event, or an FCM message handled by the
    // foreground handler during the brief inactive window): raise the OS call
    // notification so the device rings through the notification channel.
    displayIncomingCallNotification({
      appointmentId,
      mode: payload.mode || 'video',
      doctorName,
    });
  }
}

function openIncomingCallScreen(payload = {}) {
  navigateAfterBoot('CuoreCareIncomingCall', {
    appointmentId: payload.appointmentId,
    mode: payload.mode || 'video',
    from: payload.from || { name: payload.doctorName || 'Your doctor', role: 'doctor' },
    appointment: payload.appointment,
  });
}

/**
 * User answered (in-app button, or the notification's Accept action).
 * `navigateFn(params)` lets the incoming-call screen REPLACE itself with the call screen
 * instead of stacking on top of it.
 */
export function acceptCall(payload = {}, navigateFn = null) {
  const s = getCallState();
  const appointmentId = payload.appointmentId || s.appointmentId;
  if (!appointmentId) return;

  stopRinging();
  cancelIncomingCallNotification(appointmentId);

  setCallState({
    status: CallStatus.CONNECTING,
    appointmentId,
    mode: payload.mode || s.mode || 'video',
    doctorName: payload.doctorName || s.doctorName,
    doctorId: payload.doctorId || s.doctorId,
    minimized: false,
  });

  const params = {
    appointmentId,
    mode: payload.mode || s.mode || 'video',
    doctorId: payload.doctorId || s.doctorId,
    doctorName: payload.doctorName || s.doctorName,
  };
  if (typeof navigateFn === 'function') navigateFn(params);
  // Accepted from the tray/lock screen — the app may still be booting.
  else navigateAfterBoot('CuoreCareConsultation', params);
}

/** User declined (in-app button, or the notification's Decline action). */
export function declineCall(appointmentId) {
  const id = appointmentId || getCallState().appointmentId;
  stopRinging();
  cancelIncomingCallNotification(id);
  if (id) tellBackendDeclined(id); // best-effort → the doctor sees "declined"
  setCallState({ status: CallStatus.DECLINED, endReason: 'declined' });
  releaseIncomingCall(id);
  resetCallState('declined');
  goBackFromCallScreen();
}

/**
 * The call went away without the user acting on it: the doctor cancelled, the ring timed
 * out, or the backend ended/missed it.
 */
export function dismissIncomingCall(appointmentId, reason = 'cancelled') {
  const id = appointmentId || getCallState().appointmentId;
  stopRinging();
  cancelIncomingCallNotification(id);
  releaseIncomingCall(id);
  if (!isCallConnected()) {
    resetCallState(reason);
    goBackFromCallScreen();
  }
}

function goBackFromCallScreen() {
  const nav = navigationRef.current;
  if (!nav?.isReady?.()) return;
  const current = nav.getCurrentRoute?.()?.name;
  if (current === 'CuoreCareIncomingCall' && nav.canGoBack()) nav.goBack();
}

// ── Live call ───────────────────────────────────────────────────────────────

/** Consultation screen reports that ZEGO tokens are in hand and the room is mounting. */
export function callConnecting({ appointmentId, mode, doctorId, doctorName, joinData }) {
  setCallState({
    status: CallStatus.CONNECTING,
    appointmentId,
    mode: mode || 'video',
    doctorId: doctorId || getCallState().doctorId,
    doctorName: doctorName || getCallState().doctorName,
    joinData: joinData || null,
  });
}

/** Media is up. Start the foreground service + arm PiP. */
export function callConnected({ appointmentId, mode, doctorName, joinData } = {}) {
  const s = getCallState();
  const effMode = mode || s.mode || 'video';
  stopRinging();
  cancelIncomingCallNotification(appointmentId || s.appointmentId);
  setCallState({
    status: CallStatus.CONNECTED,
    appointmentId: appointmentId || s.appointmentId,
    mode: effMode,
    doctorName: doctorName || s.doctorName,
    joinData: joinData || s.joinData,
    connectedAt: s.connectedAt || Date.now(),
    minimized: false,
  });
  startOngoingCallNotification({
    appointmentId: appointmentId || s.appointmentId,
    doctorName: doctorName || s.doctorName || 'your doctor',
    mode: effMode,
  });
  setNativeCallActive(true, effMode);
}

/** The call screen was minimized into the floating window (room stays connected). */
export function callMinimized() {
  if (!isCallActive()) return;
  setCallState({ status: CallStatus.MINIMIZED, minimized: true });
  // While minimized the user is deliberately using the rest of the app, so pressing Home
  // should NOT hijack the screen with a system PiP window; the foreground service keeps
  // the call alive instead.
  setNativeCallActive(false);
}

/** The floating window was tapped / the ongoing notification was pressed. */
export function restoreCall() {
  const s = getCallState();
  if (!s.appointmentId) return;
  setCallState({ status: CallStatus.CONNECTED, minimized: false });
  setNativeCallActive(true, s.mode);
  navigateWhenReady('CuoreCareConsultation', {
    appointmentId: s.appointmentId,
    mode: s.mode,
    doctorId: s.doctorId,
    doctorName: s.doctorName,
    // Skip the /join round-trip: the ZEGO room is still live, we only need the screen back.
    resume: true,
  });
}

/** Android told us the activity entered/left system Picture-in-Picture. */
export function setPipMode(inPip) {
  if (!isCallActive()) {
    setCallState({ pip: false });
    return;
  }
  setCallState({
    pip: !!inPip,
    status: inPip ? CallStatus.BACKGROUND : CallStatus.CONNECTED,
  });
}

/**
 * End the call for good. Safe to call from anywhere and more than once.
 * `fromFloating` tears down the ZEGO room that is still alive behind the floating window.
 */
export function endCall(reason = 'ended', { fromFloating = false } = {}) {
  const s = getCallState();
  const id = s.appointmentId;

  stopRinging();
  cancelIncomingCallNotification(id);
  stopOngoingCallNotification();
  setNativeCallActive(false);

  if (fromFloating || isZegoMinimized()) {
    if (id) recordConsultationEvent(id, 'left');
    destroyMinimizedZegoCall();
  }
  clearRouteParams();
  releaseIncomingCall(id);
  resetCallState(reason);
}

/** Remote hang-up / backend-ended while we are minimized or backgrounded. */
export function remoteEndedCall(appointmentId) {
  const s = getCallState();
  if (appointmentId && s.appointmentId && appointmentId !== s.appointmentId) return;
  endCall('remote_ended', { fromFloating: s.minimized || s.pip });
  goBackFromCallScreen();
}

/** Called on logout / session expiry so a call never outlives the session. */
export function teardownCalls() {
  if (isCallActive()) endCall('teardown', { fromFloating: true });
  else {
    stopRinging();
    stopOngoingCallNotification();
    setNativeCallActive(false);
  }
}
