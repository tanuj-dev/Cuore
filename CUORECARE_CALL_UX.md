# CuoreCare — Minimized call, background calling & ringing notifications

Implementation notes for the three behaviours added on top of the **existing, working**
ZEGO Prebuilt Call Kit integration. The ZEGO join/leave logic itself was not rewritten:
the room is still joined by `ZegoUIKitPrebuiltCall` in `src/screens/CuoreCare/Consultation.js`
with server-minted Token04 credentials from `POST /api/cuorecare/appointments/:id/join`.

---

## 1. Call state machine — one source of truth

`src/call/callState.js` holds the whole call in a plain module-level store (no React, no
redux) so it is readable from the **headless** FCM background handler, notifee background
events and the UI alike.

```
idle → incoming → ringing → connecting → connected → minimized ⇄ connected
                                    ↘                        ↘ background (system PiP)
                                     declined                 ↘ ended
```

`src/call/callManager.js` is the only place that mutates it, and it keeps four things in
lockstep on every transition: **state · ringtone · notification · navigation**.

Duplicate suppression lives in `claimIncomingCall(appointmentId)` — the first source to
claim a call (socket, FCM background push, FCM foreground push, notification tap) wins for
60 s, so the ringtone can never start twice for one call.

---

## 2. Minimized floating call window

Uses the SDK's **own** minimize mechanism rather than a hand-rolled one:

* `ZegoUIKitPrebuiltCall`'s unmount effect skips `ZegoUIKit.leaveRoom()` when
  `MinimizingHelper.isMinimizeSwitch` is set.
* `ZegoUIKitPrebuiltCallFloatingMinimizedView` (mounted persistently in
  `src/call/CallFloatingWindow.js`, above `NavigationContainer`) sets that flag and calls
  the `onWindowMinimized` / `onWindowMaximized` callbacks we pass in the call `config`.
* `src/call/zegoMinimize.js` is a defensive bridge to those SDK singletons. It also
  "primes" `PrebuiltHelper`'s routeParams, which the SDK otherwise only fills for its
  call-invitation screens — without it, tapping the floating window would not restore.

Triggers: **hardware Back**, or the **minimize button** now shown in the call's top menu
bar (`ZegoMenuBarButtonName.minimizingButton`).

On top of the SDK's video bubble we render a call pill: doctor name, live timer, tap to
return, and an explicit **End** button. Restoring reuses the cached `joinData`
(`resume: true`), so `/join` is not called twice.

> The floating bubble shows the **remote** participant (ZEGO's floating view renders the
> active remote stream). The local preview returns when the call is expanded — ZEGO's
> floating view does not expose a second video slot and its position is internal state, so
> a local overlay could not be anchored to it.

---

## 3. Background calling

**Android**
* `MainActivity` supports Picture-in-Picture (`supportsPictureInPicture`,
  `resizeableActivity`). While `CallActivityState.callActive` is true it enters PiP on
  `onUserLeaveHint()`, and auto-enters on Android 12+ (`setAutoEnterEnabled`).
* `src/call/ongoingCall.js` runs a **notifee foreground service** with
  `FOREGROUND_SERVICE_TYPE_CAMERA | MICROPHONE` for the duration of the call. From Android
  14 this is what legally keeps capture alive in the background; the manifest overrides
  notifee's service declaration with `tools:replace="android:foregroundServiceType"`.
* PiP is deliberately **not** armed while the call is minimized in-app — the user is
  intentionally using the rest of Cuore, and the foreground service already keeps the call
  running.
* Known behaviour: dismissing the system PiP window closes the activity, which ends the
  call view. Returning via the ongoing-call notification is the supported path.

**iOS**
* Background audio continues via the existing `audio` UIBackgroundMode; iOS suspends
  camera capture for backgrounded apps (Apple's documented behaviour, not a bug).
* System PiP for a call needs `AVPictureInPictureController` over a sample-buffer layer,
  which the ZEGO Prebuilt Call Kit does not expose — so the in-app floating window is the
  iOS minimize experience.
* True locked-screen ringing on iOS still requires **PushKit + CallKit**, which needs an
  Apple VoIP Services key, a separate VoIP token registration and a backend VoIP push
  path. Not enabled here; the app instead uses a time-sensitive alert push with a custom
  ringtone and Accept/Decline actions (below).

---

## 4. Incoming-call notification (the "no ringtone" bug)

Root causes addressed:

1. The call channel was created **only** from `App.js`. A push arriving in the headless
   background/quit context could hit a channel that did not exist yet.
   → `ensureCallChannel()` is now called from the display path itself.
2. An Android channel's sound is **immutable after creation** — any device that ever
   created the channel without a resolvable sound stays silent forever.
   → channel id bumped to **`cuorecare-call-v3`**, and `cuorecare-call` / `-v2` are deleted
   on startup.
3. iOS was pushed `sound: "default"` — a one-second ding, not a ring.
   → the backend now sends `sound: "iphoneringtone.mp3"` (bundled, 26 s) with
   `apns-push-type: alert` and category `CUORECARE_INCOMING_CALL`.

The channel is HIGH importance, `bypassDnd`, vibrating, with `loopSound` and
`AndroidCategory.CALL`; the notification carries a **full-screen intent** plus **Accept /
Decline** actions. Ringing therefore starts the instant the data-only push is handled —
not when the notification is tapped.

Accept/Decline work with the app backgrounded or killed: `notifee.onBackgroundEvent` in
`index.js` handles Decline headlessly (`POST …/events {type:'declined'}` via
`cuoreCareApi`, which reads the token from EncryptedStorage), and Accept launches the
activity, which routes straight into the consultation.

The backend now also sends a silent `type: 'call_cancelled'` data push when the doctor
leaves/declines/cancels/completes before pickup, so a ringing notification can never
outlive the call — even with the app process dead.

---

## 5. Files

| File | Change |
| --- | --- |
| `src/call/callState.js` | **new** — call state machine + duplicate-call claims |
| `src/call/callManager.js` | **new** — transitions; keeps ring/notification/UI in sync |
| `src/call/useCallState.js` | **new** — React subscription hook |
| `src/call/CallFloatingWindow.js` | **new** — floating window + call pill |
| `src/call/zegoMinimize.js` | **new** — bridge to the SDK's minimize mechanism |
| `src/call/ongoingCall.js` | **new** — foreground-service ongoing-call notification |
| `src/call/pip.js` | **new** — native PiP / lock-screen / FSI-permission bridge |
| `src/navigation/navigationRef.js` | **new** — nav ref extracted from App.js (no import cycle) |
| `src/notifications/incomingCall.js` | channel v3, ring config, iOS category, FSI |
| `src/notifications/NotificationService.js` | creates the new channels, deletes legacy ones |
| `src/screens/CuoreCare/Consultation.js` | minimize on Back, resume, connected state |
| `src/screens/CuoreCare/IncomingCall.js` | routes through the call manager, lock-screen |
| `src/screens/CuoreCare/AppointmentDetails.js` | Join restores an already-running call |
| `App.js` | call manager wiring, PiP events, floating window, teardown on logout |
| `index.js` | ring on push receipt, dedupe, FGS task, cancel push |
| `android/…/MainActivity.kt` | PiP |
| `android/…/call/*.kt` | **new** — `CuoreCall` native module + package |
| `android/…/AndroidManifest.xml` | PiP attrs, FGS types, `TURN_SCREEN_ON` |
| backend `config/firebaseService.js` | iOS ring sound + category; `sendCallCancelPush` |
| backend `utils/cuoreCareNotify.js` | `notifyCallCancelled` |
| backend `controllers/cuorecare/appointment.controller.js` | cancel push on end/decline/cancel |
