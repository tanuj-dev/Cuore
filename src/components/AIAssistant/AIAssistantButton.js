import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { useAIAssistant } from './AIAssistantContext';

// ─── Sparkle star icon (4-pointed, drawn from Views) ─────────────────────────
function SparkleIcon({ size = 26, color = '#FFFFFF' }) {
  const arm = size * 0.44;
  const thin = size * 0.11;
  const dot = size * 0.14;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Long vertical arm */}
      <View style={{ position: 'absolute', width: thin, height: arm * 1.15, borderRadius: thin, backgroundColor: color }} />
      {/* Long horizontal arm */}
      <View style={{ position: 'absolute', width: arm * 1.15, height: thin, borderRadius: thin, backgroundColor: color }} />
      {/* Short diagonal arms */}
      <View style={{ position: 'absolute', width: thin * 0.8, height: arm * 0.6, borderRadius: thin, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', width: thin * 0.8, height: arm * 0.6, borderRadius: thin, backgroundColor: color, transform: [{ rotate: '-45deg' }] }} />
      {/* Center highlight dot */}
      <View style={{ position: 'absolute', width: dot, height: dot, borderRadius: dot / 2, backgroundColor: 'rgba(255,255,255,0.5)' }} />
    </View>
  );
}

// ─── X icon for close state ───────────────────────────────────────────────────
function CloseIcon({ size = 20, color = '#FFFFFF' }) {
  const arm = size * 0.72;
  const thick = size * 0.14;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: arm, height: thick, borderRadius: thick, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', width: arm, height: thick, borderRadius: thick, backgroundColor: color, transform: [{ rotate: '-45deg' }] }} />
    </View>
  );
}

// ─── Main floating button ─────────────────────────────────────────────────────
export default function AIAssistantButton() {
  const { isOpen, toggleChat } = useAIAssistant();
  const themeMode = useSelector(state => state.theme?.mode ?? 'light');
  const isDark = themeMode === 'dark';

  // Three staggered pulse rings
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;
  // Press scale
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Mount entrance (pops in from 0)
  const mountAnim = useRef(new Animated.Value(0)).current;
  // Icon morph: 0 = sparkle, 1 = X
  const morphAnim = useRef(new Animated.Value(0)).current;

  // Mount pop-in animation
  useEffect(() => {
    Animated.spring(mountAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 140,
      friction: 8,
      delay: 400,
    }).start();
  }, [mountAnim]);

  // Staggered pulse rings (pause when open)
  useEffect(() => {
    if (isOpen) return;

    const makePulse = (anim, extraDelay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(extraDelay),
          Animated.timing(anim, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay(400),
        ]),
      );

    const p1 = makePulse(pulse1, 0);
    const p2 = makePulse(pulse2, 500);
    const p3 = makePulse(pulse3, 1000);
    p1.start(); p2.start(); p3.start();
    return () => { p1.stop(); p2.stop(); p3.stop(); };
  }, [isOpen, pulse1, pulse2, pulse3]);

  // Icon morph animation
  useEffect(() => {
    Animated.spring(morphAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [isOpen, morphAnim]);

  const ringStyle = anim => ({
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: isDark ? '#3B82F6' : '#1D6FE8',
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
    opacity: anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.45, 0.1, 0] }),
  });

  const sparkleOpacity = morphAnim.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0] });
  const sparkleScale = morphAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] });
  const closeOpacity = morphAnim.interpolate({ inputRange: [0.6, 1], outputRange: [0, 1] });
  const closeScale = morphAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.84, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 250, friction: 7 }),
    ]).start();
    toggleChat();
  };

  const gradientColors = isDark
    ? ['#4F46E5', '#7C3AED']
    : ['#1D6FE8', '#6D28D9'];

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: Animated.multiply(mountAnim, scaleAnim) }] },
      ]}
      pointerEvents="box-none"
    >
      {/* 3 staggered pulse rings — only when closed */}
      {!isOpen && (
        <>
          <Animated.View style={ringStyle(pulse1)} />
          <Animated.View style={ringStyle(pulse2)} />
          <Animated.View style={ringStyle(pulse3)} />
        </>
      )}

      {/* Button */}
      <TouchableOpacity onPress={handlePress} activeOpacity={1}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          {/* Sparkle icon — visible when closed */}
          <Animated.View
            style={[
              styles.iconLayer,
              { opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
            ]}
          >
            <SparkleIcon size={26} color="#FFFFFF" />
          </Animated.View>

          {/* Close icon — visible when open */}
          <Animated.View
            style={[
              styles.iconLayer,
              { opacity: closeOpacity, transform: [{ scale: closeScale }] },
            ]}
          >
            <CloseIcon size={22} color="#FFFFFF" />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>

      {/* "AI" label badge */}
      {!isOpen && (
        <View style={[styles.badge, { backgroundColor: isDark ? '#10B981' : '#059669' }]}>
          <Text style={styles.badgeText}>AI</Text>
        </View>
      )}
    </Animated.View>
  );
}

const BUTTON_SIZE = 60;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 88,
    right: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 20,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 16,
  },
  iconLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
