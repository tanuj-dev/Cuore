import React, { useEffect, useRef, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Animated, Text, StyleSheet, View, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const ToastMessage = ({ message, type = 'info', onHide, top }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const HEIGHT = top;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  }, [slideAnim, onHide]);

  const backgroundColor =
    type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#11418A';

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          top: HEIGHT,
          backgroundColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

export default ToastMessage;

const createStyles = c => StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 40,
    left: width * 0.1,
    right: width * 0.1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  text: {
    color: c.card,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    letterSpacing: 0.2,
    lineHeight: 20,
  },
});
