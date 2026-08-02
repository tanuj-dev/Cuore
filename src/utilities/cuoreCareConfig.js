import { Platform } from 'react-native';

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

// ─── In-App Purchase (SEPARATE CuoreCare tier) ──────────────────────────────
// Product IDs CREATED as auto-renewing subscriptions (2026-08-01):
//   iOS (App Store Connect group "CuoreCare", status "Prepare for Submission" — sandbox-
//     testable now; submit for review WITH the CuoreCare app build):
//     com.cuore.cuorecare.quarterly (3 months, ₹999), com.cuore.cuorecare.annual (1 year, ₹1,999)
//   Android (Play Console, auto-renewing base plans, ACTIVE):
//     cuorecare_quarterly (3 months, ₹999), cuorecare_annual (1 year, ₹1,999)
// Intentionally distinct from the base-premium SKUs so the tiers bill and verify independently.
// The backend derives the plan from `plan` (sent explicitly) or the id.
export const CUORECARE_IAP_PRODUCT_IDS =
  Platform.OS === 'ios'
    ? ['com.cuore.cuorecare.quarterly', 'com.cuore.cuorecare.annual']
    : ['cuorecare_quarterly', 'cuorecare_annual'];

export const CUORECARE_IAP_PLANS = [
  {
    key: 'quarterly',
    plan: 'quarterly',
    title: 'CuoreCare 3 Months',
    subtitle: 'Unlimited video, voice & chat consultations',
    duration: '3 Months',
    oldPrice: null,
    newPrice: 999,
    productId:
      Platform.OS === 'ios'
        ? 'com.cuore.cuorecare.quarterly'
        : 'cuorecare_quarterly',
    topPick: false,
  },
  {
    key: 'annual',
    plan: 'annual',
    title: 'CuoreCare 1 Year',
    subtitle: 'Best value — a full year of doctor access',
    duration: '1 Year',
    oldPrice: null,
    newPrice: 1999,
    productId:
      Platform.OS === 'ios' ? 'com.cuore.cuorecare.annual' : 'cuorecare_annual',
    topPick: true,
  },
];

export const CUORECARE_IAP_GST_RATE = 0.18;

// Minutes the room opens before the scheduled start (mirrors backend join-window early
// value for a friendlier "Join" affordance; the server is the source of truth and returns
// 425 TOO_EARLY with `opensAt` if the client is ahead of it).
export const JOIN_EARLY_MINUTES = 5;

export default {
  CUORECARE_BASE_URL,
  ZEGO_APP_ID,
  CUORECARE_MODES,
  CUORECARE_IAP_PRODUCT_IDS,
  CUORECARE_IAP_PLANS,
  CUORECARE_IAP_GST_RATE,
  JOIN_EARLY_MINUTES,
  zegoDoctorUserId,
  zegoPatientUserId,
};
