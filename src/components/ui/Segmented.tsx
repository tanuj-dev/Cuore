import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from './Text';
import { font, radius, spacing, useTheme } from '../../theme';

type Props<K extends string> = { options: { key: K; label: string }[]; value: K; onChange: (k: K) => void };

export default function Segmented<K extends string>({ options, value, onChange }: Props<K>) {
  const t = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map(o => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.key)}
            style={[styles.pill, { backgroundColor: on ? t.brand : t.surface, borderColor: on ? t.brand : t.border }]}>
            <Text style={[font.small, { color: on ? t.textOnBrand : t.textMuted, fontWeight: '700' }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.md },
  pill: { paddingHorizontal: 16, height: 38, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
