import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { font, radius, useTheme } from '../../theme';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  small?: boolean;
  style?: ViewStyle;
};

export default function Button({ label, onPress, variant = 'primary', loading, disabled, icon, small, style }: Props) {
  const t = useTheme();
  const palette = {
    primary: { bg: t.brand, fg: t.textOnBrand, border: t.brand },
    secondary: { bg: t.surface, fg: t.brand, border: t.border },
    danger: { bg: t.dangerSoft, fg: t.danger, border: t.dangerSoft },
    ghost: { bg: 'transparent', fg: t.brand, border: 'transparent' },
  }[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: off ? 0.55 : pressed ? 0.85 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon}
          <Text style={[font.bodyStrong, { color: palette.fg, marginLeft: icon ? 8 : 0 }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: { minHeight: 40, paddingHorizontal: 14, borderRadius: radius.sm },
});
