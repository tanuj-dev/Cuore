import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { verifyOtp, sendOtp, createAccountThunk } from '../../redux/slices';
import { setUserData } from '../../redux/Auth/slice';
import EncryptedStorage from 'react-native-encrypted-storage';
import Endpoints from '../../utilities/Endpoints';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const OTP_LENGTH = 6;
// Resend stays disabled while the current OTP is still valid (5 min,
// matching the "Valid for 5 minutes" text and the backend OTP validity).
const OTP_VALIDITY_SECONDS = 5 * 60;
const createEmptyOtp = () => Array(OTP_LENGTH).fill('');

const formatTimer = seconds => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const OtpScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();

  const loading = useSelector(state => state.auth.loading);

  const {
    phone,
    role,
    requestId: initialRequestId,
    CreateAccountScreen,
    registrationPayload,
  } = route.params;
  console.log('Route params:', route.params);

  // Kept in state: every resend issues a NEW request_id, and verifying the new
  // SMS code against the old one always fails with "didn't match".
  const [requestId, setRequestId] = useState(initialRequestId);
  const [otp, setOtp] = useState(() => createEmptyOtp());
  const [timer, setTimer] = useState(OTP_VALIDITY_SECONDS);
  const [loader, setLoader] = useState(false);

  const inputs = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const focusInput = i => {
    if (i >= 0 && i < OTP_LENGTH) {
      setTimeout(() => inputs.current[i]?.focus(), 0);
    }
  };

  /** Digits & paste — backspace is handled in onKeyPress (reliable on Android). */
  const handleChange = (text, index) => {
    const digitsOnly = text.replace(/\D/g, '');

    if (digitsOnly.length === 0) {
      setOtp(prev => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    setOtp(prev => {
      const next = [...prev];
      if (digitsOnly.length === 1) {
        next[index] = digitsOnly;
        return next;
      }
      let j = index;
      for (let k = 0; k < digitsOnly.length && j < OTP_LENGTH; k++, j++) {
        next[j] = digitsOnly[k];
      }
      return next;
    });

    if (digitsOnly.length === 1) {
      if (index < OTP_LENGTH - 1) {
        focusInput(index + 1);
      }
    } else {
      const end = Math.min(index + digitsOnly.length - 1, OTP_LENGTH - 1);
      focusInput(end);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key !== 'Backspace') return;

    let focusPrevious = false;
    setOtp(prev => {
      const next = [...prev];
      if (prev[index] !== '') {
        next[index] = '';
        return next;
      }
      if (index > 0) {
        next[index - 1] = '';
        focusPrevious = true;
      }
      return next;
    });
    if (focusPrevious) {
      focusInput(index - 1);
    }
  };

  /** iOS number-pad has no ⌫ — use this to fix typos without tapping the cell */
  const removeLastFilledDigit = () => {
    let focusIndex = -1;
    setOtp(prev => {
      const next = [...prev];
      for (let i = OTP_LENGTH - 1; i >= 0; i--) {
        if (next[i] !== '') {
          next[i] = '';
          focusIndex = i;
          return next;
        }
      }
      return prev;
    });
    if (focusIndex >= 0) {
      focusInput(focusIndex);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const enteredOtp = otp.join('');
      const result = await dispatch(
        verifyOtp({
          endpoint: CreateAccountScreen
            ? Endpoints.NEWUSEROTP
            : Endpoints.VERIFYOTP,
          requestId,
          testOtp: enteredOtp,
          role,
        }),
      ).unwrap();
      console.log('OTP verified:', result);

      const otpData = result?.data || {};
      const {
        access_token,
        refresh_token,
        user_id,
        expires_in,
        new_user,
        onboardingStatus,
        isonboarding_complete,
        role: userRole,
        paymentStatus,
      } = otpData;

      const month = otpData.month ?? otpData.subscription_month ?? null;
      const isFreeUser =
        otpData.isFree === true ||
        otpData.is_free === true ||
        otpData.isFree === 'true' ||
        otpData.is_free === 'true';

      const hasPaymentAccess =
        paymentStatus === 'completed' ||
        paymentStatus === 'waived' ||
        isFreeUser;

      const tokenPayload = {
        accessToken: access_token,
        refreshToken: refresh_token,
        userId: user_id,
        expiresIn: expires_in,
        newUser: new_user,
        onboardingStatus: onboardingStatus,
        isonboarding_complete,
        role: userRole,
        paymentStatus,
        month,
        isFree: Boolean(isFreeUser),
      };

      const onboardingDone =
        onboardingStatus === 'complete' || isonboarding_complete === true;

      // Step 1: Check onboardingStatus first
      if (!onboardingDone) {
        if (userRole === 'caregiver') {
          alert(
            'Onboarding Pending',
            "You can't proceed ahead because onboarding is pending and caregiver can't onboard.",
          );
          return;
        }
        await EncryptedStorage.setItem(
          'auth_tokens',
          JSON.stringify(tokenPayload),
        );
        dispatch(setUserData(tokenPayload));
        navigation.reset({
          index: 0,
          routes: [{ name: 'OnBoarding' }],
        });
        return;
      }

      // Step 2: Caregiver without completed payment — block login, don't save token
      if (userRole === 'caregiver' && !hasPaymentAccess) {
        alert(
          'Payment Pending',
          'The account subscription payment is pending. Caregiver cannot complete the payment. Please ask the account owner to complete the payment.',
        );
        return;
      }

      // Step 3: Save token and set Redux state
      await EncryptedStorage.setItem(
        'auth_tokens',
        JSON.stringify(tokenPayload),
      );
      dispatch(setUserData(tokenPayload));
      console.log('Token saved, paymentStatus:', paymentStatus);

      // Step 4: Paid, waived, or free-tier → Home
      if (hasPaymentAccess) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
        return;
      }

      // Step 5: If payment is pending, go to Score (Continue → Checkout unless free-tier)
      if (paymentStatus === 'pending') {
        console.log('paymentStatus is pending, going to Score');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Score' }],
        });
        return;
      }

      // Step 6: Any other status (none, null, etc.) — go to Checkout
      console.log('paymentStatus is not completed/waived, going to Checkout');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Checkout' }],
      });
    } catch (err) {
      console.log('OTP verification failed:', err.message);
      const rawMessage = err?.message || 'OTP verification failed';
      const match = rawMessage.match(/\((.+)\)/);
      const displayMessage = match ? match[1] : rawMessage;
      // Code no longer valid — unlock Resend right away instead of
      // making the user wait out the rest of the validity timer
      if (/expired|already used|not found/i.test(rawMessage)) {
        setTimer(0);
      }
      alert('Verification Failed', displayMessage);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoader(true);
      let newRequestId;

      if (CreateAccountScreen && registrationPayload) {
        // Registration flow: the login resend endpoint would 404 for a
        // not-yet-registered user — re-submit the signup instead, which
        // re-sends the OTP and returns a fresh request_id.
        const result = await dispatch(
          createAccountThunk(registrationPayload),
        ).unwrap();
        console.log('Registration OTP resent:', result);
        newRequestId = result?.request_id;
      } else {
        const result = await dispatch(
          sendOtp({ phone: `+91${phone}`, role }),
        ).unwrap();
        console.log('OTP resent:', result);
        newRequestId = result?.requestId || result?.data?.request_id;
      }

      if (newRequestId) {
        setRequestId(newRequestId);
      }
      // Fresh code sent — lock Resend for its full validity window again
      setTimer(OTP_VALIDITY_SECONDS);
      setOtp(createEmptyOtp());
    } catch (err) {
      console.log('Resend OTP failed:', err?.message);
      alert(
        'Resend Failed',
        err?.message || 'Could not resend the code. Please try again.',
      );
    } finally {
      setLoader(false);
    }
  };

  return (
    <View style={styles.container}>
      {AlertComponent}
      <TouchableOpacity
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        style={styles.backArrow}
        onPress={() => navigation.goBack()}
      >
        <Image
          source={Images.BACK_BUTTON}
          style={{
            resizeMode: 'contain',
            height: hp(3.5),
            width: wp(4),
            tintColor: '#1E293B',
          }}
        />
      </TouchableOpacity>

      <Text style={styles.title}>OTP Verification</Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TouchableOpacity
            key={index}
            style={styles.otpCellOuter}
            activeOpacity={0.85}
            onPress={() => focusInput(index)}
          >
            <TextInput
              ref={ref => {
                inputs.current[index] = ref;
              }}
              style={styles.otpInput}
              pointerEvents="none"
              keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
              value={digit}
              onChangeText={text => handleChange(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              textContentType="none"
              autoComplete="off"
              importantForAutofill="no"
              blurOnSubmit={false}
              selectTextOnFocus
            />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={removeLastFilledDigit}
        style={styles.removeLastRow}
        hitSlop={{ top: 10, bottom: 10 }}
      >
        <Text style={styles.removeLastText}>⌫ Remove last digit</Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>
        OTP sent to your phone number. Valid for 5 minutes.{'\n'}
        {/* <Text style={styles.subtitleHint}>
          Tap a box to edit that digit. On iPhone, use Remove last digit (the
          number pad has no backspace key).
        </Text> */}
      </Text>

      <TouchableOpacity
        onPress={handleVerifyOtp}
        style={styles.submitButton}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.timerText}>
        {timer > 0
          ? `You can resend a new code in ${formatTimer(timer)}`
          : "Didn't receive the code?"}
      </Text>

      <TouchableOpacity
        onPress={handleResendOtp}
        disabled={timer > 0 || loader}
      >
        <View style={[styles.resendContainer, timer > 0 && { opacity: 0.4 }]}>
          {loader ? (
            <ActivityIndicator color="#11418A" />
          ) : (
            <>
              <Image
                source={Images.SHARE}
                style={{
                  resizeMode: 'contain',
                  height: hp(2),
                  width: wp(4),
                }}
              />
              <Text style={styles.resendText}> Resend OTP</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp(6),
    paddingTop: hp(3),
  },
  backArrow: {
    marginTop: Platform.OS === 'ios' ? hp(2) : hp(1),
    marginBottom: hp(3),
    padding: hp(0.5),
  },
  title: {
    marginTop: hp(7),
    fontSize: 24,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    marginBottom: hp(3),
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1),
    gap: wp(2),
  },
  otpCellOuter: {
    flex: 1,
    maxWidth: wp(14),
  },
  otpInput: {
    width: '100%',
    height: wp(14),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: 'Poppins-Medium',
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    letterSpacing: 2,
  },
  removeLastRow: {
    alignSelf: 'center',
    paddingVertical: hp(1),
    marginBottom: hp(1.5),
  },
  removeLastText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#11418A',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    fontSize: 14,
    color: '#64748B',
    marginBottom: hp(3),
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  subtitleHint: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#11418A',
    paddingVertical: hp(2),
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: hp(2),
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.5,
  },
  timerText: {
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    fontSize: 13,
    color: '#64748B',
    marginBottom: hp(1),
    letterSpacing: 0.2,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(1),
  },
  resendText: {
    fontFamily: 'Poppins-Medium',
    color: '#11418A',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});

export default OtpScreen;
