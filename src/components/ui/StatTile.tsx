import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { radius, spacing, useTheme } from '../../theme';

type Accent = 'teal' | 'violet' | 'amber' | 'rose' | 'sky' | 'green';

export default function StatTile({ icon, value, label, accent = 'sky', onPress }: { icon: React.ReactNode; value: string | number; label: string; accent?: Accent; onPress?: () => void }) {
  const t = useTheme();
  const a = t.accents[accent];
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.tile, { backgroundColor: t.surface, shadowColor: t.shadow, shadowOpacity: t.isDark ? 0 : 0.1, borderColor: t.border, opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.icon, { backgroundColor: a.bg }]}>{icon}</View>
      <Text style={{ color: t.text, fontSize: 26, fontWeight: '800', marginTop: spacing.md, letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '600', marginTop: 2 }} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, borderRadius: radius.lg, padding: spacing.md + 2, borderWidth: 1, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 4 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
