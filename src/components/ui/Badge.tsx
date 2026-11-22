import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { font, radius, useTheme } from '../../theme';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export default function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = useTheme();
  const map = {
    success: [t.successSoft, t.success],
    warning: [t.warningSoft, t.warning],
    danger: [t.dangerSoft, t.danger],
    info: [t.infoSoft, t.info],
    neutral: [t.surface2, t.textMuted],
  }[tone];
  return (
    <View style={[styles.b, { backgroundColor: map[0] }]}>
      <Text style={[font.tiny, { color: map[1], textTransform: 'capitalize' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  b: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
});
