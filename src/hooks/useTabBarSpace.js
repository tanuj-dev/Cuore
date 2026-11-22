import { useContext } from 'react';
import { Platform } from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* On iOS the bottom tab bar is frosted glass floating over the screen, like the system bars on
 * new iPhones. Android keeps the solid bar in the layout. */
export const GLASS_TAB_BAR = Platform.OS === 'ios';

// Gap between the floating bar and the bottom of the tab area.
export const tabBarBottomGap = insets => (insets.bottom > 0 ? 4 : 10);

/* How much of the bottom of a tab screen the glass bar covers. A scroll view that runs under the
 * bar passes it as `contentInset` / `scrollIndicatorInsets` bottom, so its last item can still be
 * scrolled clear of the bar. 0 outside the tabs and on Android. */
export function useTabBarSpace() {
  const barHeight = useContext(BottomTabBarHeightContext);
  const insets = useSafeAreaInsets();
  if (!GLASS_TAB_BAR || !barHeight) {
    return 0;
  }
  return barHeight + tabBarBottomGap(insets);
}
