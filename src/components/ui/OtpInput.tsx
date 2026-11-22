import React, { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from './Text';
import { radius, useTheme } from '../../theme';

/* One hidden input drives N visual boxes. Paste, SMS autofill and backspace all work for free,
 * which per-box inputs get wrong on Android. */
export default function OtpInput({ value, onChange, length = 4, error }: { value: string; onChange: (v: string) => void; length?: number; error?: boolean }) {
  const t = useTheme();
  const ref = useRef<React.ComponentRef<typeof TextInput>>(null);
  return (
    <Pressable onPress={() => ref.current?.focus()} style={styles.row} accessibilityLabel="One time password">
      {Array.from({ length }).map((_, i) => {
        const active = i === Math.min(value.length, length - 1);
        return (
          <View
            key={i}
            style={[
              styles.box,
              { backgroundColor: t.surface, borderColor: error ? t.danger : active ? t.brand : t.border, borderWidth: active || error ? 2 : 1 },
            ]}>
            <Text style={{ color: t.text, fontSize: 24, fontWeight: '700' }}>{value[i] ?? ''}</Text>
          </View>
        );
      })}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={v => onChange(v.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        style={styles.hidden}
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  // Boxes share the row (capped at 58) so a 6-digit code fits a phone as well as a 4-digit one.
  box: { flex: 1, maxWidth: 58, height: 64, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
