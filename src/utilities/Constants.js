import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

/** Shown on Score, Today, and Health for the references / sources entry + modals */
export const CLINICAL_REFERENCES_LABEL = 'Clinical References & Sources';

/**
 * User-visible app version from the native binary (iOS `CFBundleShortVersionString` /
 * Android `versionName`). Call this when you need a fresh read; `APP_VERSION` is
 * captured once at startup for backwards compatibility.
 */
export function getNativeAppVersion() {
  try {
    const v = DeviceInfo.getVersion();
    if (v != null && String(v).trim() !== '') {
      return String(v).trim();
    }
  } catch {
    // e.g. tests or bridge not ready
  }
  return '0.0.0';
}

/** Used for update checks (App.js) — same source as Profile version line. */
export const APP_VERSION = getNativeAppVersion();

export const APP_STORE_URL = 'https://apps.apple.com/app/cuore/id6758409790';
export const PLAY_STORE_URL = 'market://details?id=com.cuore';

export const STORE_URL = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;

let MAIN_URL_QA_UAT = 'https://uatcom.edureka.in/';
let MAIN_URL_QA_A2 = 'https://a2com.edureka.in/';

let MAIN_URL_PRODUCTION = 'https://www.edureka.co/';
let API_VERSION = 'api/1.0';
let API_VERSION_2 = 'api/2.0';

let MAIN_URL = MAIN_URL_QA_A2;

// let BASE_URL = 'https://cuore-backend-995g.onrender.com';
let BASE_URL = 'https://cuore-backend-staging.onrender.com';
let BASE_URL_V2 = MAIN_URL + API_VERSION_2;

let IS_PRODUCTION = MAIN_URL === MAIN_URL_PRODUCTION ? true : false;

const REGEX = {
  // eslint-disable-next-line no-useless-escape
  EMAIL:
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  TEXT: /^[a-zA-Z]+$/,
  NUMBERS: /^\d{10,12}$/,
  ALPHA_NUMERIC: /^[a-z0-9]+$/i,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{4,}$/,
  // NAME: /^([a-zA-Z]+\s)*[a-zA-Z]+$/
  // NAME: /[^0-9a-zA-Z]/g
  NAME: /^([a-zA-Z]+\s)*[a-zA-Z]+$/,
  FULLNAME: /^[a-zA-Z]{2,40}( [a-zA-Z]{2,40})+$/,
};

const SHARE_BASE_URL = 'https://cuore-backend-1.onrender.com';

const Constants = {
  BASEURL: BASE_URL,
  SHARE_BASE_URL,
};
export default Constants;

// ─── In-App Purchase ────────────────────────────────────────────────────────
// The catalog itself lives in ./iapPlans so it can be imported without dragging
// react-native-device-info (above) into modules and tests that have no use for it.
// Re-exported here because these names are imported from Constants across the app.
export {
  IAP_ALL_ACCESS_PRODUCT_ID,
  IAP_ALL_ACCESS_PRODUCT_IDS,
  IAP_ALL_ACCESS_PLAN,
  IAP_LEGACY_SUBSCRIPTION_IDS,
  isAllAccessProductId,
} from './iapPlans';

import {
  IAP_ALL_ACCESS_PLAN as ALL_ACCESS_PLAN,
  IAP_ALL_ACCESS_PRODUCT_ID as ALL_ACCESS_ID,
  IAP_LEGACY_SUBSCRIPTION_IDS as LEGACY_BASE_IDS,
} from './iapPlans';

// Everything the app knows about — sold + retired. Used for fetchProducts and, critically,
// for filtering restored purchases.
export const IAP_SUBSCRIPTION_IDS = [ALL_ACCESS_ID, ...LEGACY_BASE_IDS];

// Kept for the places that expect a single primary id.
export const IAP_SUBSCRIPTION_ID = ALL_ACCESS_ID;

// Store prices in India are tax-inclusive (Apple and Google collect GST), so ₹359 is the
// final amount charged and nothing is added on top at display time.
export const IAP_GST_RATE = 0.18;

// What the paywall renders. One entry by design — retired SKUs are intentionally absent.
export const IAP_PLANS = [ALL_ACCESS_PLAN];
