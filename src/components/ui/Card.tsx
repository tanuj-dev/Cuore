import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { radius, spacing, useTheme } from '../../theme';

type Props = { children: React.ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle>; flat?: boolean };

export default function Card({ children, onPress, style, flat }: Props) {
  const t = useTheme();
  const base: ViewStyle = {
    backgroundColor: t.surface,
    borderColor: t.border,
    shadowColor: t.shadow,
    shadowOpacity: flat || t.isDark ? 0 : 0.06,
  };
  if (!onPress) return <View style={[styles.card, base, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, base, style, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
});
