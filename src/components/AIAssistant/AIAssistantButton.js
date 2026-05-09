import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { useAIAssistant } from './AIAssistantContext';
import { getThemeColors } from '../../theme/colors';

// Sparkle/AI icon drawn with plain RN Views (no icon lib dependency)
function AIIcon({ size = 22, color = '#FFFFFF' }) {
  const s = size / 22;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Vertical bar */}
      <View
        style={{
          position: 'absolute',
          width: 2.5 * s,
          height: 18 * s,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
      {/* Horizontal bar */}
      <View
        style={{
          position: 'absolute',
          width: 18 * s,
          height: 2.5 * s,
          borderRadius: 2,
          backgroundColor: color,
        }}
      />
      {/* Diagonal / star sparkle dots */}
      {[
        { top: 1 * s, left: 1 * s },
        { top: 1 * s, right: 1 * s },
        { bottom: 1 * s, left: 1 * s },
        { bottom: 1 * s, right: 1 * s },
      ].map((pos, i) => (
        <View
          key={i}
          style={[
            {
              position: 'absolute',
              width: 4 * s,
              height: 4 * s,
              borderRadius: 2 * s,
              backgroundColor: color,
              opacity: 0.7,
            },
            pos,
          ]}
        />
      ))}
    </View>
  );
}

export default function AIAssistantButton() {
  const { isOpen, toggleChat } = useAIAssistant();
  const themeMode = useSelector(state => state.theme?.mode ?? 'light');
  const colors = getThemeColors(themeMode);

  // Pulse ring animation
  const pulseAnim = useRef(new Animated.Value(0)).current;
  // Button scale on press
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Rotation for the AI icon when open
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Infinite pulse loop
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(800),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Rotate icon when chat opens/closes
  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  }, [isOpen, rotateAnim]);

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 0.15, 0] });
  const rotation = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
    toggleChat();
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Pulse ring (hidden while chat is open) */}
      {!isOpen && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
              backgroundColor: colors.primary,
            },
          ]}
        />
      )}

      {/* The button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity onPress={handlePress} activeOpacity={1}>
          <LinearGradient
            colors={
              themeMode === 'dark'
                ? ['#3B82F6', '#1D4ED8']
                : ['#1D6FE8', '#0F3F8C']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Animated.View style={{ transform: [{ rotate: rotation }] }}>
              <AIIcon size={24} color="#FFFFFF" />
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const BUTTON_SIZE = 58;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 12,
  },
});
