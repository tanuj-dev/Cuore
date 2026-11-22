import React from 'react';
import { StyleProp, StyleSheet, Text as RNText, TextInput as RNTextInput, TextStyle } from 'react-native';

/* The app font is Poppins, the same family as the Cuore patient app. React Native cannot pick a
 * weight from a custom family via `fontWeight`, so each weight maps to its own font file. The
 * numeric weight in a style is the source of truth; it is replaced by the right family here, so
 * screens keep writing `fontWeight: '700'` and still get the real bold file instead of a faked one. */
const FAMILY: Record<string, string> = {
  '100': 'Poppins-Light',
  '200': 'Poppins-Light',
  '300': 'Poppins-Light',
  '400': 'Poppins-Regular',
  normal: 'Poppins-Regular',
  '500': 'Poppins-Medium',
  '600': 'Poppins-SemiBold',
  '700': 'Poppins-Bold',
  bold: 'Poppins-Bold',
  '800': 'Poppins-ExtraBold',
  '900': 'Poppins-ExtraBold',
};

function withFont(style: StyleProp<TextStyle>) {
  const flat = (StyleSheet.flatten(style) || {}) as Record<string, unknown>;
  if (flat.fontFamily) return flat;
  const { fontWeight, ...rest } = flat;
  return { ...rest, fontFamily: FAMILY[String(fontWeight ?? '400')] ?? FAMILY['400'] };
}

export function Text(props: React.ComponentProps<typeof RNText>) {
  return <RNText {...props} style={withFont(props.style)} />;
}

export function TextInput(props: React.ComponentProps<typeof RNTextInput>) {
  return <RNTextInput {...props} style={withFont(props.style)} />;
}
