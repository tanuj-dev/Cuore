import { Platform } from 'react-native';

/**
 * The in-app purchase catalog — the single source of truth for what Cuore sells.
 *
 * Lives in its own module, separate from Constants.js, ON PURPOSE. Constants.js imports
 * `react-native-device-info`, which constructs a NativeEventEmitter at import time and blows
 * up under Jest unless every consuming test mocks it. Having cuoreCareConfig.js reach into
 * Constants.js for the plan therefore broke the CuoreCare unit tests, which have no interest
 * in device info at all. This module depends on nothing but `Platform`, so both Constants.js
 * and cuoreCareConfig.js can share one definition without dragging a native module behind it.
 *
 * ── WHAT IS SOLD ────────────────────────────────────────────────────────────────────────────
 * ONE plan: Cuore All Access, ₹359/year, granting BOTH base premium and CuoreCare
 * telemedicine. Created 2026-09-14:
 *   iOS      com.cuore.allaccess.annual  (App Store Connect group "Cuore Premium")
 *   Android  cuore_allaccess_annual      (base plan `annual`, auto-renewing, 1 year)
 *
 * ── WHAT IS RETIRED (AND WHY IT IS STILL HERE) ──────────────────────────────────────────────
 * The old tiered SKUs (₹99/mo and ₹999/yr base; ₹999/3mo and ₹1,999/yr CuoreCare) are
 * withdrawn from the paywall but deliberately still listed. They remain live in both stores
 * because people are still subscribed to them, and these lists are what restored purchases are
 * filtered against — dropping an id would make a paying subscriber look unsubscribed and be
 * shown a paywall they have already bought. Never delete them.
 */

// Both stores' ids for the one product. Needed as a LIST wherever a product id comes back from
// the SERVER rather than from this device's store: someone who subscribed on Android and then
// signs in on iOS still has the Android id on their receipt.
export const IAP_ALL_ACCESS_PRODUCT_IDS = [
  'com.cuore.allaccess.annual', // iOS
  'cuore_allaccess_annual', // Android
  'cuore_allaccess_annual_web', // cuore.health (Razorpay) — same plan, bought on the web
];

// The only product a new purchase on THIS device can use.
export const IAP_ALL_ACCESS_PRODUCT_ID =
  Platform.OS === 'ios' ? 'com.cuore.allaccess.annual' : 'cuore_allaccess_annual';

// Retired base-premium SKUs — recognised for restore/validation only.
export const IAP_LEGACY_SUBSCRIPTION_IDS =
  Platform.OS === 'ios'
    ? ['com.cuore.monthly99', 'com.cuore.annual1499']
    : ['cuore_monthly_99', 'pro_membership_annual'];

// Retired CuoreCare-only SKUs — recognised for restore/validation only.
export const CUORECARE_LEGACY_IAP_PRODUCT_IDS =
  Platform.OS === 'ios'
    ? ['com.cuore.cuorecare.quarterly', 'com.cuore.cuorecare.annual']
    : ['cuorecare_quarterly', 'cuorecare_annual'];

/**
 * The single sellable plan. Carries the union of the fields the base paywall
 * (screens/Checkout) and the CuoreCare paywall (screens/CuoreCare/Subscribe) each read, so
 * both screens render this same object.
 */
export const IAP_ALL_ACCESS_PLAN = {
  key: 'allaccess',
  // Plan key the CuoreCare backend derives its period from.
  plan: 'annual',
  title: 'All Access',
  subtitle: 'Everything in Cuore, plus doctor consultations',
  duration: '12 Months',
  oldPrice: null,
  newPrice: 359,
  productId: IAP_ALL_ACCESS_PRODUCT_ID,
  topPick: true,
};

/** True for either store's All Access id. */
export const isAllAccessProductId = productId =>
  IAP_ALL_ACCESS_PRODUCT_IDS.includes(productId);
