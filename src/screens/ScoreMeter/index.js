import React, { useEffect, useRef, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import {View, Text, StyleSheet, Animated} from 'react-native';
import Svg, {Path, G, Line as SvgLine} from 'react-native-svg';

const AnimatedLine = Animated.createAnimatedComponent(SvgLine);

const ScoreMeter = ({score = 50}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const needleRef = useRef(new Animated.Value(0)).current;

  const angle = (score / 100) * 180 - 90;

  useEffect(() => {
    Animated.timing(needleRef, {
      toValue: angle,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [angle, needleRef]);

  const rotation = needleRef.interpolate({
    inputRange: [-90, 90],
    outputRange: ['-90deg', '90deg'],
  });

  return (
    <View style={styles.container}>
      <Svg height="180" width="300" viewBox="0 0 300 180">
        <Path
          d="M30 150 A120 120 0 0 1 270 150"
          stroke="#ddd"
          strokeWidth="20"
          fill="none"
        />
        <Path
          d="M30 150 A120 120 0 0 1 150 30"
          stroke="#F44336"
          strokeWidth="20"
          fill="none"
        />
        <Path
          d="M150 30 A120 120 0 0 1 210 60"
          stroke="#FF9800"
          strokeWidth="20"
          fill="none"
        />
        <Path
          d="M210 60 A120 120 0 0 1 270 150"
          stroke="#4CAF50"
          strokeWidth="20"
          fill="none"
        />

        {/* Score Needle */}
        <G origin="150,150">
          <AnimatedLine
            x1="0"
            y1="0"
            x2="0"
            y2="-100"
            stroke="blue"
            strokeWidth="4"
            strokeLinecap="round"
            transform={[
              {translateX: 150},
              {translateY: 150},
              {rotate: rotation},
              {translateX: -150},
              {translateY: -150},
            ]}
          />
        </G>
      </Svg>
      <Text style={styles.scoreText}>{score}</Text>
    </View>
  );
};

const createStyles = c => StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 20,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: c.text,
  },
});

export default ScoreMeter;
