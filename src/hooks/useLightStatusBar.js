import { useCallback } from 'react';
import { StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// How many blue-hero screens currently count as focused. Switching between two such tabs runs
// the NEW tab's focus before the OLD tab's blur cleanup, so an unconditional "dark on blur"
// would win and leave a dark clock on the new blue hero. Only go dark when none is left.
let lightScreens = 0;

/**
 * White status-bar text while a screen with a blue CuoreMD hero is focused, dark again when it
 * loses focus.
 *
 * Set imperatively on focus rather than with a <StatusBar> element: tab screens stay mounted when
 * hidden, so an element in one tab kept every other tab's clock white on a white header.
 */
export function useLightStatusBar() {
  useFocusEffect(
    useCallback(() => {
      lightScreens += 1;
      StatusBar.setBarStyle('light-content', true);
      return () => {
        lightScreens = Math.max(0, lightScreens - 1);
        if (lightScreens === 0) {
          StatusBar.setBarStyle('dark-content', true);
        }
      };
    }, []),
  );
}
