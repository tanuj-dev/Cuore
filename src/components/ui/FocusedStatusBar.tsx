import React from 'react';
import { StatusBar, StatusBarStyle } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

/* React Native keeps a stack of <StatusBar> entries and the most recently MOUNTED one wins, so
 * with tabs a screen visited earlier can overrule the visible one. Only the focused screen gets
 * to set the style. */
export default function FocusedStatusBar({ style }: { style: StatusBarStyle }) {
  const focused = useIsFocused();
  return focused ? <StatusBar barStyle={style} /> : null;
}
