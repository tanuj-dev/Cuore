import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { ChevronLeft } from 'lucide-react-native';
import Hero from './Hero';
import { font, spacing } from '../../theme';

type Props = { title: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode; children?: React.ReactNode; bottom?: number };

/* Gradient hero for stack screens: back button, title, optional right action and extra content. */
export default function HeroHeader({ title, subtitle, onBack, right, children, bottom = 24 }: Props) {
  return (
    <Hero bottom={bottom}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={10} style={styles.back}>
            <ChevronLeft size={22} color="#fff" />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[font.h1, { color: '#fff' }]} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={[font.small, { color: 'rgba(255,255,255,0.78)', marginTop: 2 }]} numberOfLines={2}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </Hero>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
});
