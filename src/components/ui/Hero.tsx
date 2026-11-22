import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import FocusedStatusBar from './FocusedStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, useTheme } from '../../theme';
import { useResponsive } from '../../theme/responsive';

/* The gradient header every top-level screen opens with. The gradient paints only its own
 * content box, so it sits behind the padded wrapper rather than carrying the padding itself. */
/* `onBack` adds a back arrow for a screen that is pushed rather than shown as a tab (Schedule and
 * Requests for a doctor, Launch Edits 16 Nov). */
export default function Hero({ children, bottom = 56, onBack }: { children: React.ReactNode; bottom?: number; onBack?: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, isTablet } = useResponsive();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.md, paddingBottom: bottom }]}>
      <FocusedStatusBar style="light-content" />
      <LinearGradient colors={[t.heroA, t.heroB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {/* Soft decorative discs give the flat gradient some depth. */}
      <View style={[styles.disc, { top: -60, right: -40, width: 200, height: 200 }]} />
      <View style={[styles.disc, { bottom: -50, left: -60, width: 160, height: 160, opacity: 0.06 }]} />
      <View style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', paddingHorizontal: isTablet ? 0 : spacing.lg }}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
            <ArrowLeft size={22} color="#fff" />
          </Pressable>
        ) : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)', marginBottom: spacing.sm },
  disc: { position: 'absolute', borderRadius: 999, backgroundColor: '#ffffff', opacity: 0.09 },
});
