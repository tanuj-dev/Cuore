import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const SkeletonBox = ({ width, height, borderRadius = 8, style }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: '#E2E8F0', opacity },
        style,
      ]}
    />
  );
};

export default SkeletonBox;
