// ─────────────────────────────────────────────────────────────────────────────
// Picture-in-Picture + call-notification permission bridge (Android).
//
// Backed by the native `CuoreCall` module (android/app/src/main/java/com/cuore/call).
// Every method degrades to a safe no-op when the native module is missing (iOS, or a
// JS bundle running on an older binary), so nothing here can break the call.
//
// iOS note: system PiP for a *call* requires AVPictureInPictureController over a
// sample-buffer layer, which the ZEGO Prebuilt Call Kit does not expose. iOS therefore
// keeps the call alive with the `audio` background mode (audio continues; the camera is
// suspended by the OS while backgrounded, which is Apple's documented behaviour) and
// uses the in-app floating window when the user stays inside the app.
// ─────────────────────────────────────────────────────────────────────────────
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const CuoreCall = NativeModules.CuoreCall || null;

let emitter = null;
function getEmitter() {
  if (!CuoreCall) return null;
  if (!emitter) {
    try {
      emitter = new NativeEventEmitter(CuoreCall);
    } catch (e) {
      emitter = null;
    }
  }
  return emitter;
}

export const isPipAvailable = () =>
  Platform.OS === 'android' && !!CuoreCall && !!CuoreCall.pipSupported;

/**
 * Tell the native side whether a call is live. When true, MainActivity enters
 * Picture-in-Picture on `onUserLeaveHint()` (Home button / recents) instead of just
 * going to the background, and on Android 12+ it auto-enters PiP.
 */
export function setNativeCallActive(active, mode = 'video') {
  try {
    CuoreCall?.setCallActive?.(!!active, String(mode || 'video'));
  } catch (e) {
    /* ignore */
  }
}

/** Enter PiP right now (used by the "watch in a floating window" affordance). */
export function enterPip() {
  try {
    return CuoreCall?.enterPictureInPicture?.() || Promise.resolve(false);
  } catch (e) {
    return Promise.resolve(false);
  }
}

/** Subscribe to Android PiP mode changes. Returns an unsubscribe function. */
export function onPipModeChanged(handler) {
  const em = getEmitter();
  if (!em) return () => {};
  const sub = em.addListener('CuoreCallPipChanged', e => handler(!!e?.isInPictureInPictureMode));
  return () => sub.remove();
}

/**
 * Android 14+ (API 34) no longer grants USE_FULL_SCREEN_INTENT to ordinary apps.
 * Without it a call notification degrades to a heads-up banner (still rings) instead of
 * the full-screen lock-screen call UI.
 */
export async function canUseFullScreenIntent() {
  try {
    if (!CuoreCall?.canUseFullScreenIntent) return true;
    return await CuoreCall.canUseFullScreenIntent();
  } catch (e) {
    return true;
  }
}

/** Opens the system screen where the user can grant full-screen-intent access. */
export function openFullScreenIntentSettings() {
  try {
    CuoreCall?.openFullScreenIntentSettings?.();
  } catch (e) {
    /* ignore */
  }
}

/**
 * Let the incoming-call screen show over the lock screen and wake the display, the way
 * the system dialer does. Enabled only while a call is ringing.
 */
export function setShowWhenLocked(show) {
  try {
    CuoreCall?.setShowWhenLocked?.(!!show);
  } catch (e) {
    /* ignore */
  }
}

/** True when the activity is currently displayed as a system PiP window. */
export async function isInPipMode() {
  try {
    if (!CuoreCall?.isInPictureInPictureMode) return false;
    return await CuoreCall.isInPictureInPictureMode();
  } catch (e) {
    return false;
  }
}
