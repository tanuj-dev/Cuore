import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { radius, useTheme } from '../../theme';

type Accent = 'teal' | 'violet' | 'amber' | 'rose' | 'sky' | 'green';

export default function QuickAction({ icon, label, accent, onPress }: { icon: React.ReactNode; label: string; accent: Accent; onPress: () => void }) {
  const t = useTheme();
  const a = t.accents[accent];
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.wrap, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.box, { backgroundColor: a.bg }]}>{icon}</View>
      <Text numberOfLines={2} style={{ color: t.text, fontSize: 12, fontWeight: '700', marginTop: 8, textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Three per row: nine Home actions read as a 3-3-3 grid instead of 4-4-1 (Launch edits, 5 Nov).
  wrap: { width: '33.333%', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 },

  box: { width: 58, height: 58, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
});
