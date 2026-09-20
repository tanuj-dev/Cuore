// src/components/DrawerMenuButton/index.js
// -----------------------------------------------------------------------------
// The hamburger that opens the app drawer.
//
// Dispatches DrawerActions rather than calling navigation.openDrawer(): the tab screens are
// several navigators below the drawer, so they hold a STACK navigation object that has no
// openDrawer on it. A dispatched action travels up to whichever ancestor can handle it, which
// means this works from any screen inside the tabs without anyone passing a drawer ref around.
//
// Drop it into a screen's header with `<DrawerMenuButton />` — it needs no props.
// -----------------------------------------------------------------------------
import React, { useCallback } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Menu } from 'lucide-react-native';

import { hp } from '../../utilities';

export default function DrawerMenuButton({ color = '#11418A', style }) {
  const navigation = useNavigation();
  const open = useCallback(
    () => navigation.dispatch(DrawerActions.openDrawer()),
    [navigation],
  );

  return (
    <TouchableOpacity
      onPress={open}
      style={[styles.button, style]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Menu size={hp(2.6)} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingRight: 10,
    justifyContent: 'center',
  },
});
