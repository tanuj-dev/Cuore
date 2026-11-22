import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { ChevronLeft } from 'lucide-react-native';
import { font, spacing, useTheme } from '../../theme';

type Props = { title: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode };

export default function ScreenHeader({ title, subtitle, onBack, right }: Props) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={10} style={[styles.back, { backgroundColor: t.surface, borderColor: t.border }]}>
          <ChevronLeft size={22} color={t.text} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[font.h1, { color: t.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={[font.small, { color: t.textMuted, marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md, gap: spacing.md },
  back: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
