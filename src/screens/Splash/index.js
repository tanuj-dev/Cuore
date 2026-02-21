import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import EncryptedStorage from 'react-native-encrypted-storage';
import { setUserData } from '../../redux/Auth/slice';
import { hp, wp, Images } from '../../utilities';

const Splash = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const dotAnim1  = useRef(new Animated.Value(0.3)).current;
  const dotAnim2  = useRef(new Animated.Value(0.3)).current;
  const dotAnim3  = useRef(new Animated.Value(0.3)).current;

  // Entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    const pulseDot = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1,   duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      ).start();

    pulseDot(dotAnim1, 0);
    pulseDot(dotAnim2, 200);
    pulseDot(dotAnim3, 400);
  }, []);

  // Auth check
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const tokenData = await EncryptedStorage.getItem('auth_tokens');

        if (tokenData) {
          const parsed = JSON.parse(tokenData);
          const access_token = parsed.accessToken;

          if (!access_token) {
            await EncryptedStorage.removeItem('auth_tokens');
            setTimeout(() => navigation.replace('Login'), 3000);
            return;
          }

          if (parsed.onboardingStatus !== 'complete') {
            setTimeout(() => navigation.replace('Login'), 3000);
            return;
          }

          dispatch(setUserData(parsed));

          if (parsed.paymentStatus === 'pending') {
            setTimeout(() => navigation.replace('Checkout'), 3000);
          } else {
            setTimeout(() => navigation.replace('Home'), 3000);
          }
        } else {
          setTimeout(() => navigation.replace('Login'), 3000);
        }
      } catch (err) {
        console.log('Error reading token:', err.message);
        setTimeout(() => navigation.replace('Login'), 3000);
      }
    };

    checkLoginStatus();
  }, [dispatch, navigation]);

  return (
    <View style={styles.container}>
      {/* Decorative circles */}
      <View style={[styles.circle, styles.circleTopRight]} />
      <View style={[styles.circle, styles.circleBottomLeft]} />
      <View style={[styles.circleSm, styles.circleTopLeft]} />

      {/* Logo + App name */}
      <Animated.View
        style={[
          styles.contentContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.logoCard}>
          <Image
            source={Images.CUORE_SINGLE}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>Cuore</Text>
      </Animated.View>

      {/* Taglines */}
      <Animated.View
        style={[
          styles.taglineContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.title}>Your Everyday Health Companion</Text>
        <View style={styles.divider} />
        <Text style={styles.subtitle}>
          Small Steps. Smart Guidance. Better Health.
        </Text>
      </Animated.View>

      {/* Animated dots loader */}
      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, { opacity: dotAnim1 }]} />
        <Animated.View style={[styles.dot, { opacity: dotAnim2 }]} />
        <Animated.View style={[styles.dot, { opacity: dotAnim3 }]} />
      </View>
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  /* Decorative background circles */
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(17,65,138,0.05)',
  },
  circleSm: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(17,65,138,0.04)',
  },
  circleTopRight: {
    width: wp(70),
    height: wp(70),
    top: -wp(20),
    right: -wp(20),
  },
  circleBottomLeft: {
    width: wp(60),
    height: wp(60),
    bottom: -wp(15),
    left: -wp(15),
  },
  circleTopLeft: {
    width: wp(30),
    height: wp(30),
    top: hp(12),
    left: -wp(8),
  },

  /* Logo area */
  contentContainer: {
    alignItems: 'center',
    marginBottom: hp(4),
  },
  logoCard: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: hp(2.5),
  },
  logo: {
    width: wp(22),
    height: wp(22),
  },
  appName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: hp(4),
    color: '#11418A',
    letterSpacing: 2,
  },

  /* Taglines */
  taglineContainer: {
    alignItems: 'center',
    paddingHorizontal: wp(8),
    marginBottom: hp(8),
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: hp(1.9),
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: 0.4,
    marginBottom: hp(1.2),
  },
  divider: {
    width: wp(10),
    height: 1.5,
    backgroundColor: '#CBD5E1',
    marginBottom: hp(1.2),
    borderRadius: 2,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: hp(1.6),
    color: '#64748B',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  /* Dots loader */
  dotsRow: {
    position: 'absolute',
    bottom: hp(6),
    flexDirection: 'row',
    gap: wp(2.5),
  },
  dot: {
    width: wp(2),
    height: wp(2),
    borderRadius: wp(1),
    backgroundColor: '#11418A',
  },
});
