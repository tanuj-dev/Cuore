// Root navigation ref, in its own module so non-React code (notification handlers, the
// call manager, headless FCM tasks) can navigate without importing App.js — which would
// create an import cycle. App.js re-exports this ref for backwards compatibility.
import React from 'react';

export const navigationRef = React.createRef();

export function navReady() {
  return !!navigationRef.current?.isReady?.();
}

// Navigate as soon as the navigator is mounted. Cold starts (notification tap on a killed
// app) reach this before NavigationContainer is ready, so retry briefly.
export function navigateWhenReady(name, params, attempt = 0) {
  if (navReady()) {
    navigationRef.current.navigate(name, params);
    return;
  }
  if (attempt < 25) setTimeout(() => navigateWhenReady(name, params, attempt + 1), 200);
}

// Routes that mean "the app hasn't finished booting / the user isn't in yet".
const BOOT_ROUTES = ['Splash'];
const AUTH_ROUTES = ['Login', 'Signup', 'OtpScreen', 'NewAccount'];

/**
 * Like navigateWhenReady, but for cold starts from a call notification: Splash decides
 * where the user belongs and RESETS the stack, which would wipe a call screen pushed too
 * early. So wait until Splash is done — and give up entirely if it lands on the auth
 * flow, because there is no session to join a consultation with.
 */
export function navigateAfterBoot(name, params, attempt = 0) {
  if (navReady()) {
    const current = navigationRef.current.getCurrentRoute?.()?.name;
    if (AUTH_ROUTES.includes(current)) return; // logged out — nothing to open
    if (!BOOT_ROUTES.includes(current)) {
      navigationRef.current.navigate(name, params);
      return;
    }
  }
  if (attempt < 60) setTimeout(() => navigateAfterBoot(name, params, attempt + 1), 250);
}

export default navigationRef;
