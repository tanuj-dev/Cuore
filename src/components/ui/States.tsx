import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { AlertCircle, Inbox } from 'lucide-react-native';
import { font, radius, spacing, useTheme } from '../../theme';
import Button from './Button';

export function EmptyState({ title, message, icon }: { title: string; message?: string; icon?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.center}>
      <View style={[styles.ring, { backgroundColor: t.brandSoft }]}>{icon ?? <Inbox size={28} color={t.brand} />}</View>
      <Text style={[font.h3, { color: t.text, marginTop: spacing.lg, textAlign: 'center' }]}>{title}</Text>
      {message ? (
        <Text style={[font.body, { color: t.textMuted, marginTop: 6, textAlign: 'center', maxWidth: 300 }]}>{message}</Text>
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useTheme();
  return (
    <View style={styles.center}>
      <View style={[styles.ring, { backgroundColor: t.dangerSoft }]}>
        <AlertCircle size={28} color={t.danger} />
      </View>
      <Text style={[font.h3, { color: t.text, marginTop: spacing.lg }]}>Couldn't load this</Text>
      <Text style={[font.body, { color: t.textMuted, marginTop: 6, textAlign: 'center', maxWidth: 300 }]}>{message}</Text>
      {onRetry ? <Button label="Try again" variant="secondary" small onPress={onRetry} style={{ marginTop: spacing.lg }} /> : null}
    </View>
  );
}

/* A pulsing placeholder, shown instead of a spinner so the layout does not jump when data lands. */
export function Skeleton({ height = 72, style }: { height?: number; style?: object }) {
  const t = useTheme();
  const v = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.45, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return <Animated.View style={[{ height, borderRadius: radius.lg, backgroundColor: t.surface2, opacity: v }, style]} />;
}

export function SkeletonList({ count = 4, height = 84 }: { count?: number; height?: number }) {
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: spacing.xl },
  ring: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
