import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import FocusedStatusBar from './FocusedStatusBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/responsive';

/* Every screen sits inside this: themed background, status bar, safe-area top inset, and a
 * centred max-width column so tablets get a readable layout instead of stretched phone UI. */
export default function Screen({ children, style, top = true }: { children: React.ReactNode; style?: ViewStyle; top?: boolean }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { contentMaxWidth } = useResponsive();
  return (
    <View style={[styles.root, { backgroundColor: t.bg, paddingTop: top ? insets.top : 0 }]}>
      {top ? <FocusedStatusBar style={t.isDark ? 'light-content' : 'dark-content'} /> : null}
      <View style={[styles.col, { maxWidth: contentMaxWidth }, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  col: { flex: 1, width: '100%' },
});
