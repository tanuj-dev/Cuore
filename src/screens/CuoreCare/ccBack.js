import { useCallback } from 'react';

/**
 * A back handler that always has somewhere to go.
 *
 * CuoreCare screens are reachable two ways: pushed from inside the tab (Home → Doctors →
 * Book → …), and jumped to from OUTSIDE it — a push notification, or the Today screen's
 * consultation card — via a nested `navigate('Home', { screen: 'Tabs', params: { screen:
 * 'CuoreCare', params: { screen: 'CuoreCareAppointment', … } } })`.
 *
 * Those nested jumps pass `initial: false` so the tab's own root sits underneath (see
 * AppDrawerContent for the same trap). This hook is the belt to that braces: if a screen
 * ever does end up as the only route in the stack, back must still work. `goBack()` on a
 * one-route stack is a silent no-op — the chevron looks tappable and does nothing, and
 * because the tab's stack keeps that state, re-tapping the CuoreCare tab (which pops to
 * top) is a no-op too. The screen is then inescapable until the app is restarted.
 *
 * Deliberately NOT `navigation.canGoBack()`: that walks up to the parent navigators and
 * answers true for the tab history, so it would hide exactly the case this guards.
 */
export function goBackOrHome(navigation, fallback = 'CuoreCareHome') {
  const state = navigation?.getState?.();
  if (state && state.index > 0) {
    navigation.goBack();
    return;
  }
  // Replace, not navigate: leaves the tab holding just its root, which is what the user
  // expects to find when they come back to it. `navigate` would push the root ON TOP of the
  // orphan, so back from the root would land on the screen we were escaping.
  if (navigation?.replace) {
    navigation.replace(fallback);
  } else {
    navigation?.goBack?.();
  }
}

export function useCCBack(navigation, fallback = 'CuoreCareHome') {
  return useCallback(() => goBackOrHome(navigation, fallback), [navigation, fallback]);
}

export default useCCBack;
