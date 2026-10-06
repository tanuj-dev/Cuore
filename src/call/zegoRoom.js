// ─────────────────────────────────────────────────────────────────────────────
// The consultation room, owned OUTSIDE React.
//
// ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
// The call used to be `<ZegoUIKitPrebuiltCall>`: a component that painted the
// entire in-call UI into the screen and exposed none of it. Two consequences
// we could not live with:
//
//   1. The UI was not ours. The doctor's video, the control bar, the layout —
//      all internal. A patient on a phone got the SDK's idea of a call, not a
//      consultation designed for one.
//   2. The room's lifetime was tied to a mounted component. Leaving the screen
//      meant leaving the room, so minimizing had to be smuggled past the SDK:
//      `MinimizingHelper.isMinimizeSwitch` told its unmount effect to skip
//      `leaveRoom()`, and `zegoMinimize.js` had to mutate the SDK's private
//      route-params object by reference to make `onWindowMaximized` fire at
//      all. A whole layer of workaround for "don't hang up yet".
//
// `@zegocloud/zego-uikit-rn` — the layer the prebuilt kit is itself built on —
// keeps the room in a module-level singleton. So the room lives HERE, in plain
// module state, and React only renders views onto it. Minimizing is then not a
// mechanism at all: it is rendering the same `<ZegoAudioVideoView>` in a small
// box instead of a big one. Nothing to smuggle, nothing to keep mounted.
//
// Everything in this file is idempotent and safe to call from anywhere,
// including a headless push handler, because none of it touches React.
// ─────────────────────────────────────────────────────────────────────────────
import ZegoUIKit from '@zegocloud/zego-uikit-rn';

const CB = 'cuorecare-room';

/* The live room, or null. Module state on purpose: it must outlive every screen
   that looks at it. */
let current = null; // { appID, roomID, userID, userName, mode }
let joining = null; // in-flight join promise, so two callers share one join
let refreshToken = null; // () => Promise<string>

const listeners = new Set();
let snapshot = {
  connected: false,
  remoteUserID: null,
  remoteName: null,
  remoteVideoOn: false,
  remoteAudioOn: true,
  micOn: true,
  cameraOn: true,
  speakerOn: true,
  frontCamera: true,
};

function emit(patch) {
  let changed = false;
  const next = { ...snapshot };
  Object.keys(patch).forEach(k => {
    if (next[k] !== patch[k]) {
      next[k] = patch[k];
      changed = true;
    }
  });
  if (!changed) return;
  snapshot = next;
  listeners.forEach(fn => {
    try {
      fn(snapshot);
    } catch (e) {
      // A bad listener must never take the call down with it.
      console.warn('[cuorecare][room] listener threw', e);
    }
  });
}

export function getRoomSnapshot() {
  return snapshot;
}

export function subscribeRoom(fn) {
  listeners.add(fn);
  fn(snapshot);
  return () => listeners.delete(fn);
}

export function getCurrentRoom() {
  return current;
}

export function isInRoom(roomID) {
  return !!current && (!roomID || current.roomID === roomID);
}

/* The other person in the room. A consultation is always 1:1, so "the first
   user who is not me" is the doctor — no member list to reconcile. */
function syncRemote() {
  try {
    const me = current?.userID;
    const others = (ZegoUIKit.getAllUsers() || []).filter(u => u && u.userID !== me);
    const doctor = others[0];
    if (!doctor) {
      emit({ remoteUserID: null, remoteName: null, remoteVideoOn: false, remoteAudioOn: true });
      return;
    }
    /* `isCameraOn` / `isMicrophoneOn` — NOT the `isCameraDeviceOn` the SDK uses
       on its INTERNAL user objects. getAllUsers() maps them through
       _createPublicUser, which renames both. Reading the internal names gives
       undefined, which reads as "camera off" and hides the doctor behind a
       placeholder for the whole consultation. */
    emit({
      remoteUserID: doctor.userID,
      remoteName: doctor.userName || null,
      remoteVideoOn: doctor.isCameraOn !== false,
      remoteAudioOn: doctor.isMicrophoneOn !== false,
    });
  } catch (e) {
    console.warn('[cuorecare][room] could not read the participant list', e);
  }
}

function registerCallbacks() {
  ZegoUIKit.onRoomStateChanged(CB, (_roomID, reason) => {
    /* The enum is spelled differently across SDK versions, so match the two
       states that mean "up" rather than trying to list every one that does not.
       CONNECTING and RECONNECTING are deliberately NOT connected. */
    const state = String(reason || '').toUpperCase();
    emit({ connected: state === 'CONNECTED' || state === 'LOGINED' || state === 'RECONNECTED' });
  });
  ZegoUIKit.onJoinRoom(CB, () => {
    emit({ connected: true });
    syncRemote();
  });
  ZegoUIKit.onUserJoin(CB, syncRemote);
  ZegoUIKit.onUserLeave(CB, syncRemote);
  ZegoUIKit.onUserInfoUpdate(CB, syncRemote);
  ZegoUIKit.onAudioVideoAvailable(CB, syncRemote);
  ZegoUIKit.onAudioVideoUnavailable(CB, syncRemote);
  ZegoUIKit.onCameraOn(CB, syncRemote);
  ZegoUIKit.onMicrophoneOn(CB, syncRemote);

  /* The RTC token is deliberately short-lived (the backend mints 30 minutes and
     says so). Without this the room evicts us mid-consultation, which is the
     single most expensive failure this feature has. */
  ZegoUIKit.onRequireNewToken(CB, async () => {
    try {
      const fresh = await refreshToken?.();
      return fresh || '';
    } catch (e) {
      console.warn('[cuorecare][room] token refresh failed', e);
      return '';
    }
  });
}

function clearCallbacks() {
  [
    'onRoomStateChanged', 'onJoinRoom', 'onUserJoin', 'onUserLeave',
    'onUserInfoUpdate', 'onAudioVideoAvailable', 'onAudioVideoUnavailable',
    'onCameraOn', 'onMicrophoneOn', 'onRequireNewToken',
  ].forEach(name => {
    try {
      ZegoUIKit[name]?.(CB);
    } catch (_) {
      /* removing a callback must never throw on the way out */
    }
  });
}

/**
 * Join (or re-join) the consultation room. Safe to call twice: a second call for
 * the SAME room returns the first one's promise rather than logging in again —
 * two logins under one userID make ZEGO kick the older session, which reads to
 * the patient as the call dropping by itself.
 */
export async function joinRoom({
  appID,
  userID,
  userName,
  roomID,
  token,
  video = true,
  onRequireNewToken,
}) {
  refreshToken = onRequireNewToken || refreshToken;

  if (current && current.roomID === roomID && current.userID === userID) {
    return joining || Promise.resolve();
  }
  if (current) await leaveRoom();

  joining = (async () => {
    // appSign is '' on purpose: the browser/device never sees the app secret.
    // The server-minted Token04 is the only credential here.
    await ZegoUIKit.init(Number(appID), '', { userID: String(userID), userName: String(userName || userID) });
    registerCallbacks();
    await ZegoUIKit.joinRoom(String(roomID), String(token));
    current = { appID, roomID, userID, userName, mode: video ? 'video' : 'voice' };

    await ZegoUIKit.turnMicrophoneOn(String(userID), true);
    await ZegoUIKit.turnCameraOn(String(userID), !!video);
    ZegoUIKit.setAudioOutputToSpeaker(true);

    emit({ micOn: true, cameraOn: !!video, speakerOn: true, frontCamera: true, connected: true });
    syncRemote();
  })();

  try {
    await joining;
  } finally {
    joining = null;
  }
  return undefined;
}

export async function leaveRoom() {
  if (!current) return;
  const had = current;
  current = null;
  clearCallbacks();
  try {
    await ZegoUIKit.leaveRoom();
  } catch (e) {
    console.warn('[cuorecare][room] leaveRoom threw', e);
  }
  try {
    await ZegoUIKit.uninit();
  } catch (e) {
    console.warn('[cuorecare][room] uninit threw', e);
  }
  refreshToken = null;
  snapshot = {
    connected: false,
    remoteUserID: null,
    remoteName: null,
    remoteVideoOn: false,
    remoteAudioOn: true,
    micOn: true,
    cameraOn: had.mode === 'video',
    speakerOn: true,
    frontCamera: true,
  };
  listeners.forEach(fn => {
    try {
      fn(snapshot);
    } catch (_) {
      /* ignore */
    }
  });
}

/* ── Controls. Each one reports the new value optimistically and then lets the
   SDK's own callback confirm it, so a button never sits "pressed" waiting on a
   round trip it may not get on a bad line. ──────────────────────────────── */

export async function setMicrophone(on) {
  if (!current) return;
  emit({ micOn: on });
  try {
    await ZegoUIKit.turnMicrophoneOn(String(current.userID), on);
  } catch (e) {
    emit({ micOn: !on });
    console.warn('[cuorecare][room] could not toggle the microphone', e);
  }
}

export async function setCamera(on) {
  if (!current) return;
  emit({ cameraOn: on });
  try {
    await ZegoUIKit.turnCameraOn(String(current.userID), on);
  } catch (e) {
    emit({ cameraOn: !on });
    console.warn('[cuorecare][room] could not toggle the camera', e);
  }
}

export async function switchCamera() {
  if (!current) return;
  const next = !snapshot.frontCamera;
  emit({ frontCamera: next });
  try {
    // Not a React hook — the SDK just happens to name this `useFrontFacingCamera`.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await ZegoUIKit.useFrontFacingCamera(next);
  } catch (e) {
    emit({ frontCamera: !next });
    console.warn('[cuorecare][room] could not switch the camera', e);
  }
}

export function setSpeaker(on) {
  if (!current) return;
  emit({ speakerOn: on });
  try {
    ZegoUIKit.setAudioOutputToSpeaker(on);
  } catch (e) {
    emit({ speakerOn: !on });
    console.warn('[cuorecare][room] could not switch the audio output', e);
  }
}

/* Re-attach every live stream to the video views that are on screen RIGHT NOW.
 *
 * A ZEGO video view binds to a native view id at mount. Minimising destroys the
 * full-screen views and builds the bubble's; restoring does the reverse. The room
 * never dropped — but the streams are still pointed at view ids that no longer
 * exist, so both tiles come back BLACK and stay black until something else forces
 * a re-render (toggling the camera, which is how this was found). */
export function forceRenderVideoView() {
  try {
    ZegoUIKit.forceRenderVideoView();
  } catch (e) {
    console.warn('[cuorecare][room] forceRenderVideoView threw', e);
  }
}

export function getSelfUserID() {
  return current?.userID || null;
}
