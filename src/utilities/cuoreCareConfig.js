import {
  IAP_ALL_ACCESS_PLAN,
  IAP_ALL_ACCESS_PRODUCT_ID,
  CUORECARE_LEGACY_IAP_PRODUCT_IDS,
} from './iapPlans';

/**
 * CuoreCare — premium telemedicine tier configuration.
 *
 * This is a SEPARATE subscription tier from base Cuore premium. The feature talks to the
 * same Cuore backend, but the `/api/cuorecare/*` surface currently lives on the
 * `feature/cuorecare` branch, deployed to STAGING. Staging shares the production Mongo DB
 * and JWT secret, so a token issued by the normal login flow authenticates here too.
 *
 * ⚠️ AT MERGE TIME: once `feature/cuorecare` is merged to master and deployed to prod,
 * point CUORECARE_BASE_URL at the production API (Constants.BASEURL —
 * https://cuore-backend-995g.onrender.com) or reuse the main axios instance.
 */
export const CUORECARE_BASE_URL = 'https://cuore-backend-staging.onrender.com';

// Public ZEGOCloud AppID (safe to ship in the client — the server-signed token is the
// capability). Region + AppID must match the doctor portal and the backend.
export const ZEGO_APP_ID = 1632393921;

// ZEGO / ZIM stable identities. The backend mints tokens for `u_<patientId>` (this app)
// and `d_<doctorId>` (doctor portal); the room spine is `cuorecare_<appointmentId>`.
export const zegoDoctorUserId = doctorId => 'd_' + String(doctorId);
export const zegoPatientUserId = patientId => 'u_' + String(patientId);

// Consultation modes supported by the backend Appointment.MODE enum.
export const CUORECARE_MODES = ['video', 'voice', 'chat'];

// ─── In-App Purchase ────────────────────────────────────────────────────────
// CuoreCare is NO LONGER SOLD AS ITS OWN TIER. Since 2026-09-14 there is exactly one
// product — Cuore All Access (₹359/year, see Constants.IAP_ALL_ACCESS_PLAN) — and it grants
// base premium and CuoreCare together. The backend grants both entitlements from EITHER
// verify endpoint when it sees an all-access product id, so it does not matter whether the
// user buys from this screen or from the base paywall.
//
// The old CuoreCare-only SKUs are RETIRED, not deleted:
//   iOS      com.cuore.cuorecare.quarterly (3 months, ₹999), com.cuore.cuorecare.annual (₹1,999)
//   Android  cuorecare_quarterly, cuorecare_annual
// They stay live in both stores because people are still subscribed to them, and this list
// is what `getAvailablePurchases` is filtered against — dropping an id here would make an
// existing CuoreCare subscriber look unsubscribed. Never delete them.
export { CUORECARE_LEGACY_IAP_PRODUCT_IDS };

// Sold + retired. Used for fetchProducts and for recognising an existing entitlement.
export const CUORECARE_IAP_PRODUCT_IDS = [
  IAP_ALL_ACCESS_PRODUCT_ID,
  ...CUORECARE_LEGACY_IAP_PRODUCT_IDS,
];

// The CuoreCare paywall now offers the same single All Access plan as the base paywall.
export const CUORECARE_IAP_PLANS = [IAP_ALL_ACCESS_PLAN];

// India store prices are tax-inclusive; nothing is added on top at display time.
export const CUORECARE_IAP_GST_RATE = 0.18;

// Minutes the room opens before the scheduled start (mirrors backend join-window early
// value for a friendlier "Join" affordance; the server is the source of truth and returns
// 425 TOO_EARLY with `opensAt` if the client is ahead of it).
export const JOIN_EARLY_MINUTES = 5;

// Minutes before the scheduled start after which a patient can no longer cancel or reschedule
// a CONFIRMED consultation. Mirrors flags.cancellation.patientCutoffMinutes on the backend
// (config/cuoreCareFlags.js), which is the real enforcement — this copy exists only so the app
// can warn ahead of time and grey the buttons out instead of letting the patient tap into a
// 409. Change both together; the server replies with `cutoffMinutes` on rejection, so a drift
// shows up as a mismatched number in the error rather than a silent wrong-answer.
export const CANCEL_CUTOFF_MINUTES = 15;

export default {
  CUORECARE_BASE_URL,
  ZEGO_APP_ID,
  CUORECARE_MODES,
  CUORECARE_IAP_PRODUCT_IDS,
  CUORECARE_IAP_PLANS,
  CUORECARE_IAP_GST_RATE,
  JOIN_EARLY_MINUTES,
  CANCEL_CUTOFF_MINUTES,
  zegoDoctorUserId,
  zegoPatientUserId,
};
