import React from 'react';
import { StyleSheet, TextInputProps, View } from 'react-native';
import { Text, TextInput } from './Text';
import { font, radius, spacing, useTheme } from '../../theme';

/* The labelled input every CuoreMD form uses (features/network/ui.tsx there): a bold muted label,
 * a surface box whose border turns brand blue on focus and red on error, and an error or hint
 * line under it. `prefix` puts a fixed lead-in such as "+91" inside the box; `required` adds a
 * muted "Required" after the label. */
type FieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  hint?: string;
  lines?: number;
  prefix?: string;
  required?: boolean;
};

export default function Field({ label, error, hint, lines, prefix, required, onFocus, onBlur, ...input }: FieldProps) {
  const t = useTheme();
  const [focused, setFocused] = React.useState(false);
  const multiline = !!lines;
  return (
    <View>
      <Text style={[font.small, { color: t.textMuted, marginBottom: 6, fontWeight: '700' }]}>
        {label}
        {required ? <Text style={{ fontWeight: '500' }}> (Required)</Text> : null}
      </Text>
      <View
        style={[
          styles.box,
          {
            backgroundColor: t.surface,
            borderColor: error ? t.danger : focused ? t.brand : t.border,
            borderWidth: focused || error ? 2 : 1,
          },
          multiline && { minHeight: 28 * (lines as number) + 24, alignItems: 'flex-start' },
        ]}>
        {prefix ? (
          <>
            <Text style={[font.bodyStrong, { color: t.text }]}>{prefix}</Text>
            <View style={[styles.sep, { backgroundColor: t.border }]} />
          </>
        ) : null}
        <TextInput
          {...input}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          accessibilityLabel={label}
          placeholderTextColor={t.textMuted}
          onFocus={e => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: t.text }, multiline && { minHeight: 28 * (lines as number) }]}
        />
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[font.small, { color: t.danger, marginTop: 6 }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[font.small, { color: t.textMuted, marginTop: 6 }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', minHeight: 52, borderRadius: radius.md, paddingHorizontal: spacing.lg },
  sep: { width: 1, height: 22, marginHorizontal: spacing.md },
  input: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 10 },
});
