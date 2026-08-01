# CuoreCare — Patient App (React Native)

Premium telemedicine tier for the Cuore patient app: a CuoreCare subscriber browses
`isCuoreCareDoctor` doctors, books a **video / voice / chat** consultation, joins it in-app
(ZEGO Prebuilt Call Kit + ZIM), and views / downloads / shares a signed PDF prescription.

Built on branch **`feature/cuorecare`**. The backend (`/api/cuorecare/*`) and doctor portal
(CuoreMD) are already done; this document covers only the patient app.

> **Nothing is merged to `main`.** Do not merge until the whole feature is tested + approved.

---

## 1. What was added

```
src/utilities/cuoreCareConfig.js     ZEGO AppID, base URL, IAP product ids, identity helpers
src/utilities/cuoreCareApi.js        fetch client for /api/cuorecare/* (auth + base URL isolated)
src/redux/CuoreCare/thunks.js        status / doctors / appointments / prescriptions + call actions
src/redux/CuoreCare/slice.js         cuoreCare reducer (registered in redux/store.js)
src/navigation/CuoreCareStack.js     the CuoreCare tab stack
src/screens/CuoreCare/
  Home.js               scheduler + subscription paywall (tab entry)
  Subscribe.js          CuoreCare IAP (SEPARATE tier) → /subscription/verify
  DoctorList.js         browse / search CuoreCare doctors
  BookAppointment.js    mode + date/time + reason → book
  AppointmentDetails.js join / cancel / reschedule / view prescription
  Consultation.js       join orchestrator → ZegoUIKitPrebuiltCall (A/V) or ZIM chat
  ChatConsultation.js   ZIM 1-to-1 chat UI
  useZimChat.js         ZIM RN hook (login / history / send / receive)
  PrescriptionView.js   react-native-pdf viewer + download + share
  History.js            issued prescriptions
  AppointmentCard.js, components.js, ccTheme.js, ccFormat.js   shared UI
  callInvitation.js     VoIP ringing scaffold (GATED OFF — see §6)
```

Edited: `redux/store.js` (+cuoreCare reducer), `navigation/index.js` (+CuoreCare tab,
+`CuoreCareConsultation` root screen), `App.js` (FCM deep-links for CuoreCare pushes),
`ios/Cuore/Info.plist` + `android/.../AndroidManifest.xml` (mic/audio/VoIP permissions),
`package.json` (ZEGO/ZIM deps).

---

## 2. Backend base URL  ⚠️ must flip at merge

`/api/cuorecare/*` currently lives only on **staging**. `cuoreCareConfig.js` points there:

```js
export const CUORECARE_BASE_URL = 'https://cuore-backend-staging.onrender.com';
```

Staging shares the prod Mongo DB + JWT secret, so the normal login token authenticates
against it. **After `feature/cuorecare` is merged to master and deployed to prod, change
this constant to the prod API** (`https://cuore-backend-995g.onrender.com`, i.e.
`Constants.BASEURL`). Everything else in the app already uses the prod base URL.

---

## 3. Install & build

JS deps are already installed (`npm install` ran). Native still needs linking:

```bash
# iOS — the leading LANG/LC_ALL avoids a CocoaPods "Unicode Normalization … ASCII-8BIT" crash
cd ios && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install && cd ..
npx react-native run-ios

# Android (autolinking handles the native modules)
npx react-native run-android
```

New dependencies for Layer 1 (all pinned in `package.json`):
`@zegocloud/zego-uikit-prebuilt-call-rn`, `@zegocloud/zego-uikit-rn`,
`zego-express-engine-reactnative`, `zego-zim-react-native@^2.28` (the 2.x line — required by
the uikit peer range), `react-delegate-component`, `@sayem314/react-native-keep-awake`,
`react-native-uuid`, `@react-navigation/native-stack`.

> **Removed on purpose:** `zego-zpns-react-native` + `@zegocloud/zego-uikit-signaling-plugin-rn`.
> ZPNs ships an iOS `+load` swizzler (`RCTZPNsSwizzler`) that asserts on
> `objc_getClass("AppDelegate")` and **crashes at launch (SIGABRT)** on RN 0.81's Swift
> AppDelegate. They are only needed for VoIP ringing (§6) — reinstall them then, together with
> the native push integration that makes the AppDelegate discoverable to ObjC.

> RN requires **no spaces** in the project path (Hermes build breaks otherwise) — keep the
> repo at `/Users/apple/Desktop/CuoreApp`.

---

## 4. Store product IDs (IAP)  ⚠️ TODO before real purchases

The CuoreCare tier uses **separate** SKUs (see `cuoreCareConfig.js`), which must be created
as auto-renewing subscriptions in the stores:

| Plan    | iOS (App Store Connect)         | Android (Play Console) |
|---------|---------------------------------|------------------------|
| Monthly | `com.cuore.cuorecare.monthly`   | `cuorecare_monthly`    |
| Annual  | `com.cuore.cuorecare.annual`    | `cuorecare_annual`     |

Until these exist, the Subscribe screen loads but a purchase returns "product unavailable"
(handled gracefully). The **gated flow is fully testable without a purchase** because the
staging test patient already has an active CuoreCare entitlement.

---

## 5. Testing on staging

Test patient (international format): **`+919319801618`**, OTP **`931980`**
(`/api/v1/auth/otp/request` → `/otp/verify`). This user has an active CuoreCare subscription,
so the CuoreCare tab shows the scheduler (not the paywall).

Happy path:
1. Log in → open the **CuoreCare** tab → *Book a consultation*.
2. Pick a doctor (only `isCuoreCareDoctor` doctors appear) → mode + a near-future time → request.
3. Doctor accepts in CuoreMD (test doctor `+919876543210`, OTP `9319`).
4. At the appointment time, tap **Join** → ZEGO video/voice, or the ZIM chat for chat mode.
5. After the doctor completes + prescribes → **View prescription** → download / share the PDF.

The room opens `JOIN_EARLY_MINUTES` (5) before start; the server is authoritative and returns
`TOO_EARLY` / `WINDOW_CLOSED` / `CUORECARE_SUBSCRIPTION_REQUIRED`, all handled in
`Consultation.js`. ZEGO AppID **1632393921**; room `cuorecare_<appointmentId>`; identities
`u_<patientId>` (this app) / `d_<doctorId>` (doctor).

---

## 6. VoIP ringing (Layer 2) — status

**Shipped today:** scheduled in-app join. The backend already pushes an FCM
"Your doctor has joined" that deep-links straight to the appointment (`App.js` →
`navigateFromNotification`), so the patient gets a timely nudge without native VoIP.

**Not yet active:** full native ringing (CallKit / ConnectionService via ZEGO ZPNs).
`src/screens/CuoreCare/callInvitation.js` is a gated scaffold. Lighting it up needs work
**outside this app**:

1. **Backend** — endpoint to mint a *persistent* (identity-bound) ZIM token for the patient's
   push identity (today `zimToken` is per-appointment, from `/join` only).
2. **Doctor portal** — send a ZEGO call invitation when the doctor starts the consultation.
3. **ZEGO console** — enable ZPNs; upload an APNs **VoIP** cert (iOS) + configure FCM (Android).
4. **iOS native** — PushKit + CallKit in AppDelegate (`voip` background mode already added).
5. **Android native** — ConnectionService + full-screen-intent incoming-call Activity
   (foreground-service / full-screen-intent permissions already added).

Then set `CUORECARE_VOIP_ENABLED = true`, wire the ZEGO waiting/in-call screens onto a
native-stack navigator, render `<ZegoCallInvitationDialog/>` in the NavigationContainer, and
call `initCuoreCareCallInvitation(...)` after login. Verify the exact `init` signature against
the installed package version first.

---

## 7. Verified backend contract (patient surface)

```
GET   /api/cuorecare/subscription/status                 → { cuoreCare:{ active, plan, state, expiryDate } }
POST  /api/cuorecare/subscription/verify                 { productId, purchaseToken, orderId, platform, plan } → { payment:'done'|'expired'|'failed' }
GET   /api/cuorecare/doctors?search=&specialization=     → { doctors:[{ _id, displayName, specialization, photoUrl, doctorCode, address.city }] }
POST  /api/cuorecare/appointments                        { doctorId, mode, scheduledStart, durationMinutes, reason, timezone } → 201 { appointment }
GET   /api/cuorecare/appointments?scope=&search=         → { appointments } (doctorId populated)
GET   /api/cuorecare/appointments/:id                    → { appointment }  (id = apt_… or _id)
PATCH /api/cuorecare/appointments/:id/cancel             { reason }
PATCH /api/cuorecare/appointments/:id/reschedule         { scheduledStart, durationMinutes }
POST  /api/cuorecare/appointments/:id/join               → { appId, roomId, userId, mode, rtcToken, zimToken, rtcTokenTtlSec } | 425/410/402/503
POST  /api/cuorecare/appointments/:id/token/refresh      → { rtcToken, zimToken, rtcTokenTtlSec }
POST  /api/cuorecare/appointments/:id/events             { type:'joined'|'left' }
GET   /api/cuorecare/prescriptions                       → { prescriptions:[{ prescriptionId, appointmentId, issuedAt, status }] }
GET   /api/cuorecare/prescriptions/:id                   → { url, expiresInSec:300 }  (signed S3 URL; id = rx_… or _id)
```
