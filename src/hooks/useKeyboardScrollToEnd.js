import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * For the short sign-in screens (Login, OTP) whose input and button sit at the bottom of the
 * scroll content. When the keyboard opens, scroll to the end so the field being typed in AND the
 * button below it are above the keyboard.
 *
 * Replaces react-native-keyboard-aware-scroll-view on these screens: on the New Architecture it
 * did not move the content, so the mobile number / OTP boxes sat under the keyboard.
 *
 * `keyboardOpen` lets a screen drop padding it only needs for centring while the keyboard is shut.
 */
export function useKeyboardScrollToEnd() {
  const ref = useRef(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    // iOS only: Android keeps its own keyboard handling on these screens.
    if (Platform.OS !== 'ios') return undefined;
    const show = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardOpen(true);
      // After the padding change above has laid out.
      requestAnimationFrame(() => ref.current?.scrollToEnd({ animated: true }));
    });
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return { ref, keyboardOpen };
}
