import { createRef } from 'react';

export const navigationRef = createRef();

export function navigate(name, params) {
  if (navigationRef.current?.isReady?.()) {
    navigationRef.current.navigate(name, params);
  }
}

/** Open a screen inside a nested navigator (e.g. tab `Profile` → stack screen `RenewSubscription`). */
export function navigateNested(parentRouteName, screenName, params) {
  if (navigationRef.current?.isReady?.()) {
    navigationRef.current.navigate(parentRouteName, {
      screen: screenName,
      params: params ?? undefined,
    });
  }
}

export function goBack() {
  if (navigationRef.current?.canGoBack?.()) {
    navigationRef.current.goBack();
  }
}

export function getCurrentRoute() {
  return navigationRef.current?.getCurrentRoute?.()?.name ?? null;
}
