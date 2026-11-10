import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  AppState,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import EncryptedStorage from 'react-native-encrypted-storage';
import { setUserData } from '../../redux/Auth/slice';
import { hp, wp, Images } from '../../utilities';

// Resolves once the app is in the foreground (immediately if it already is).
const waitUntilActive = () =>
  new Promise(resolve => {
    if (AppState.currentState === 'active') {
      resolve();
      return;
    }
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active') {
        sub.remove();
        resolve();
      }
    });
  });

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Reads the stored session, retrying transient Keychain/Keystore failures. Returns the
// raw string, or null only when every attempt found nothing.
const readAuthTokensWithRetry = async (attempts = 4) => {
  let lastError = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const value = await EncryptedStorage.getItem('auth_tokens');
      if (value) return value;
    } catch (e) {
      lastError = e;
      console.log('Splash: auth_tokens read failed, retrying:', e?.message);
    }
    await sleep(300 * (i + 1));
  }
  if (lastError) throw lastError;
  return null;
};

const Splash = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const dotAnim1 = useRef(new Animated.Value(0.3)).current;
  const dotAnim2 = useRef(new Animated.Value(0.3)).current;
  const dotAnim3 = useRef(new Animated.Value(0.3)).current;

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
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ).start();

    pulseDot(dotAnim1, 0);
    pulseDot(dotAnim2, 200);
    pulseDot(dotAnim3, 400);
  }, [fadeAnim, scaleAnim, slideAnim, dotAnim1, dotAnim2, dotAnim3]);

  // Auth check
  useEffect(() => {
    let hasNavigated = false;
    const navigateTo = (screen, delay = 3000) => {
      if (hasNavigated) return;
      hasNavigated = true;
      setTimeout(() => navigation.replace(screen), delay);
    };

    const checkLoginStatus = async () => {
      try {
        // iOS can pre-launch ("prewarm") the app before the device is unlocked, and the
        // Keychain is unreadable until then: the read throws or comes back empty, which used
        // to send a logged-in user to Login on the first open (and Home only on the second).
        // So: wait until the app is really in the foreground, then read with retries, and
        // only treat "no token" as logged out once several reads agree.
        await waitUntilActive();
        console.log('Splash: reading auth_tokens...');
        const tokenData = await readAuthTokensWithRetry();
        console.log('Splash: auth_tokens read, has data:', !!tokenData);

        // Step 1: No token → Login
        if (!tokenData) {
          console.log('Splash: no token found → Login');
          navigateTo('Login');
          return;
        }

        const parsed = JSON.parse(tokenData);
        const access_token = parsed.accessToken;
        console.log(
          'Splash: paymentStatus:',
          parsed.paymentStatus,
          'onboardingStatus:',
          parsed.onboardingStatus,
        );

        if (!access_token) {
          console.log('Splash: no access token → Login');
          await EncryptedStorage.removeItem('auth_tokens');
          navigateTo('Login');
          return;
        }

        const onboardingDone =
          parsed.onboardingStatus === 'complete' ||
          parsed.isonboarding_complete === true;

        // Step 2: Has token but onboarding not complete → OnBoarding
        if (!onboardingDone) {
          if (parsed.role === 'caregiver') {
            await EncryptedStorage.removeItem('auth_tokens');
            navigateTo('Login');
          } else {
            dispatch(setUserData(parsed));
            navigateTo('OnBoarding');
          }
          return;
        }

        const isFreeUser =
          parsed.isFree === true ||
          parsed.isFree === 'true' ||
          parsed.is_free === true;

        // Enforce the free-tier expiry locally: a waived/free grant lapses once
        // premiumExpiry passes, so the user is routed to the paywall even mid-
        // session (the app doesn't re-fetch status on launch). No premiumExpiry
        // = unlimited/corporate grant.
        const freeStillValid = parsed.premiumExpiry
          ? new Date(parsed.premiumExpiry).getTime() > Date.now()
          : true;
        const hasPaymentAccess =
          parsed.paymentStatus === 'completed' ||
          ((parsed.paymentStatus === 'waived' || isFreeUser) && freeStillValid);

        // Caregiver without valid payment → Login (free-tier counts as access)
        if (parsed.role === 'caregiver' && !hasPaymentAccess) {
          await EncryptedStorage.removeItem('auth_tokens');
          navigateTo('Login');
          return;
        }

        dispatch(setUserData(parsed));

        // Step 3: Has token + onboarding complete + payment not done → Score/Checkout
        if (!hasPaymentAccess) {
          if (parsed.paymentStatus === 'pending') {
            console.log('Splash: payment pending → Score');
            navigateTo('Score');
          } else {
            console.log('Splash: payment incomplete → Checkout');
            navigateTo('Checkout');
          }
          return;
        }

        // Step 4: All checks passed → Home
        console.log('Splash: all checks passed → Home');
        navigateTo('Home');
      } catch (err) {
        console.log('Splash: error reading token:', err.message);
        navigateTo('Login');
      }
    };

    // Safety net — only if the check itself is stuck. It no longer races a slow
    // cold-start Keychain read (that is what sent logged-in users to Login): it fires
    // late, and still prefers Home when a token can be read by then.
    const safetyTimer = setTimeout(async () => {
      console.log('Splash: safety timeout triggered');
      try {
        const late = await EncryptedStorage.getItem('auth_tokens');
        if (late && JSON.parse(late)?.accessToken) {
          checkLoginStatus();
          return;
        }
      } catch (e) {}
      navigateTo('Login', 0);
    }, 20000);

    checkLoginStatus();

    return () => clearTimeout(safetyTimer);
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
