import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * The two soft white discs CuoreMD lays over its blue hero gradient for depth. Place it right
 * after the gradient inside a hero that has `overflow: 'hidden'`, so the discs are clipped to
 * the rounded corners.
 */
export default function HeroDiscs() {
  return (
    <>
      <View pointerEvents="none" style={[styles.disc, styles.topRight]} />
      <View pointerEvents="none" style={[styles.disc, styles.bottomLeft]} />
    </>
  );
}

const styles = StyleSheet.create({
  disc: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    opacity: 0.09,
  },
  topRight: { top: -60, right: -40, width: 200, height: 200 },
  bottomLeft: { bottom: -50, left: -60, width: 160, height: 160, opacity: 0.06 },
});
