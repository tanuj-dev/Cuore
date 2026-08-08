// ─────────────────────────────────────────────────────────────────────────────
// Thin, defensive bridge to the ZEGO Prebuilt Call Kit's OFFICIAL minimize
// mechanism. We deliberately do NOT roll our own "keep the room alive" logic:
// `@zegocloud/zego-uikit-prebuilt-call-rn` already ships one, and reusing it is what
// keeps the existing join/leave logic untouched.
//
// How the SDK's mechanism works (v6.7):
//   • `ZegoUIKitPrebuiltCall`'s unmount effect calls `ZegoUIKit.leaveRoom()` **unless**
//     `MinimizingHelper.isMinimizeSwitch` is true.
//   • `ZegoUIKitPrebuiltCallFloatingMinimizedView` (rendered persistently, see
//     CallFloatingWindow.js) sets that flag and then invokes the `onWindowMinimized` /
//     `onWindowMaximized` callbacks we pass in the call `config` — that is where we
//     navigate away from / back to the consultation screen.
//   • `onWindowMaximized` is only invoked when PrebuiltHelper's routeParams object is
//     non-empty. That object is normally filled by the SDK's *call-invitation* screens,
//     which we don't use, so `primeRouteParams()` fills it for our direct usage.
//
// Everything here is wrapped in try/catch and degrades to "minimize unavailable" rather
// than breaking a live call if the SDK's internal layout ever changes.
// ─────────────────────────────────────────────────────────────────────────────

let MinimizingHelper = null;
let PrebuiltHelper = null;

try {
  // Metro resolves this package through its `main` field (lib/commonjs), so requiring
  // the commonjs build here yields the SAME singletons the public entry point uses.
  MinimizingHelper =
    require('@zegocloud/zego-uikit-prebuilt-call-rn/lib/commonjs/call/services/minimizing_helper')
      .default;
  PrebuiltHelper =
    require('@zegocloud/zego-uikit-prebuilt-call-rn/lib/commonjs/call/services/prebuilt_helper')
      .default;
} catch (e) {
  console.warn('[cuorecare][minimize] ZEGO minimize helpers unavailable:', e?.message);
}

export function isMinimizeSupported() {
  return !!(MinimizingHelper && PrebuiltHelper);
}

/**
 * Make the SDK's floating view able to MAXIMIZE again.
 * PrebuiltHelper exposes the params object by reference on purpose ("Use reference types
 * directly, so the set method is not provided here") — mutating it is the intended API.
 */
export function primeRouteParams({ roomID, onCallEnd, onDurationUpdate } = {}) {
  if (!PrebuiltHelper) return;
  try {
    const params = PrebuiltHelper.getInstance().getRouteParams();
    Object.assign(params, {
      roomID,
      ...(typeof onCallEnd === 'function' ? { onCallEnd } : {}),
      ...(typeof onDurationUpdate === 'function' ? { onDurationUpdate } : {}),
    });
  } catch (e) {
    console.warn('[cuorecare][minimize] primeRouteParams failed:', e?.message);
  }
}

/** True while the SDK considers the call minimized (room alive, screen unmounted). */
export function isZegoMinimized() {
  try {
    return !!MinimizingHelper?.getInstance()?.getIsMinimize();
  } catch (e) {
    return false;
  }
}

/**
 * Minimize the live call. Prefers the imperative handle on <ZegoUIKitPrebuiltCall/>
 * (the SDK's own public API) and falls back to the helper singleton.
 * Returns true when the SDK accepted the request.
 */
export function minimizeZegoCall(callRef) {
  try {
    if (callRef?.current?.minimizeWindow) {
      callRef.current.minimizeWindow();
      return true;
    }
    if (MinimizingHelper) {
      MinimizingHelper.getInstance().minimizeWindow();
      return true;
    }
  } catch (e) {
    console.warn('[cuorecare][minimize] minimize failed:', e?.message);
  }
  return false;
}

/**
 * Tear the minimized call down for good (used when the user ends the call from the
 * floating window, or when the remote side hangs up while we're minimized).
 * `notifyDestroyPrebuilt` is what makes the still-registered prebuilt callback leave the
 * ZEGO room and release the camera/mic.
 */
export function destroyMinimizedZegoCall() {
  try {
    if (isZegoMinimized() && PrebuiltHelper) {
      PrebuiltHelper.getInstance().notifyDestroyPrebuilt();
      return true;
    }
  } catch (e) {
    console.warn('[cuorecare][minimize] destroy failed:', e?.message);
  }
  return false;
}

/** Clear the SDK's "restore me" params once a call is fully over. */
export function clearRouteParams() {
  try {
    PrebuiltHelper?.getInstance()?.clearRouteParams();
  } catch (e) {
    /* ignore */
  }
}
