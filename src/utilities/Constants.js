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

export const IAP_SUBSCRIPTION_IDS =
  Platform.OS === 'ios'
    ? ['com.cuore.monthly99', 'com.cuore.annual1499']
    : ['cuore_monthly_99', 'pro_membership_annual'];

// Keep primary annual ID for backward compatibility where single ID is expected.
export const IAP_SUBSCRIPTION_ID =
  Platform.OS === 'ios' ? 'com.cuore.annual1499' : 'pro_membership_annual';

export const IAP_GST_RATE = 0.18;

export const IAP_PLANS = [
  {
    title: 'Monthly',
    subtitle: 'Flexible monthly access to all premium features',
    duration: '1 Month',
    oldPrice: 199,
    newPrice: 99,
    daily: '₹3.3/day',
    discount: '50%',
    productId:
      Platform.OS === 'ios' ? 'com.cuore.monthly99' : 'cuore_monthly_99',
    topPick: false,
  },
  {
    title: 'Annual',
    subtitle: 'Commit to lasting health and sustained results',
    duration: '12 Months',
    oldPrice: 2999,
    newPrice: 999,
    daily: '₹2.7/day',
    discount: '67%',
    productId: IAP_SUBSCRIPTION_ID,
    topPick: true,
  },
];
