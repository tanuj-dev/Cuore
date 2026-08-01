# CuoreCare — Real-Time Calling & Notifications (patient app)

This documents the real-time layer added to the patient app and the **remaining native
steps** that can't be completed/verified without a device build.

## What was added (JS — verified by `react-native bundle`, iOS + Android)

- **`src/realtime/socket.js`** — one app-wide Socket.IO connection to the CuoreCare backend
  (`CUORECARE_BASE_URL`), authenticated with the same `auth_tokens.accessToken` the REST
  client uses. Connected on login / disconnected on logout in `App.js`.
- **`src/realtime/events.js`** — event-name mirror of the backend `config/cuoreCareEvents.js`.
- **Full-screen incoming call** — `src/screens/CuoreCare/IncomingCall.js`, registered on the
  ROOT stack as `CuoreCareIncomingCall`. Launched from `App.js` on a socket `call:incoming`
  (doctor started the call). Shows doctor name/photo + mode, Accept/Decline, rings.
- **Ringtone** — `src/realtime/ringtone.js`: **Vibration is the guaranteed ring** (no asset);
  audio is a bonus via `react-native-sound` playing `cuorecare_ring.wav`.
- **Live updates** — `Home.js` and `AppointmentDetails.js` refresh on `appointment:new/updated`
  and `prescription:ready` while focused. `Consultation.js` handles remote-end (`call:ended` /
  doctor `participant:left`) → leaves the call, and shows a "Reconnecting…" overlay on socket
  drop.
- **Background call push** — backend sends a **data-only** `type:incoming_call` push. `index.js`
  renders a full-screen-intent notification (`src/notifications/incomingCall.js`, channel
  `cuorecare-call`); Accept/Decline/tap are routed in `App.js`.

## Remaining native steps (require a device build — NOT done here)

1. **Bundle the ring on iOS.** The ring is generated at
   `android/app/src/main/res/raw/cuorecare_ring.wav` (Android picks it up automatically) and a
   copy is staged at **`ios/Cuore/cuorecare_ring.wav`**. In Xcode, drag that file into the
   `Cuore` target → **Build Phases → Copy Bundle Resources** (check "Copy items if needed").
   Without this, iOS falls back to vibration-only (no audio ring) — no crash.
2. **`pod install`** (a `socket.io-client` is pure JS and needs no pods, but a normal
   `cd ios && pod install` keeps the workspace consistent before the device build).
3. **iOS locked-screen call (CallKit).** A data-only push cannot present a native ringing
   call screen on a **killed** iOS app. For a true FaceTime-style lock-screen ring, add
   **PushKit VoIP pushes + CallKit** (e.g. `react-native-callkeep` + a `voip` APNs cert, and
   backend PushKit sends). Until then, on iOS the incoming call shows as an APNs alert
   (tap-to-open → the in-app full-screen screen) when backgrounded, and rings fully when the
   app is foregrounded (socket). Android already shows the full-screen-intent call.
   (This matches the previously-scaffolded `screens/CuoreCare/callInvitation.js` / ZPNs path.)

## Before this goes live

- **Flip the base URL at merge:** `src/utilities/cuoreCareConfig.js` `CUORECARE_BASE_URL`
  staging → prod (`https://cuore-backend-995g.onrender.com`).
- **Backend:** `npm install` (adds `socket.io`) and redeploy so the Socket.IO server runs.

## How to test (with a device build)

1. Log in as the patient; keep the app **foregrounded**.
2. From the doctor portal, Accept the request and click **Join** → the patient's phone shows
   the full-screen incoming call and rings. Accept → both are in the ZEGO call.
3. Background/lock the phone and repeat → Android shows the full-screen call notification;
   iOS shows the alert (tap to open).
4. Doctor clicks **End** → the patient leaves the call and returns to the appointment screen.
5. Toggle airplane mode briefly mid-call → "Reconnecting…" appears, then recovers.
