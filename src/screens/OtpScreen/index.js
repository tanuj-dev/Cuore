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
import { verifyOtp, sendOtp } from '../../redux/slices';
import EncryptedStorage from 'react-native-encrypted-storage';
import Endpoints from '../../utilities/Endpoints';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const OtpScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();

  const loading = useSelector(state => state.auth.loading);

  const { phone, role, requestId, retryAfter, testOtp, CreateAccountScreen } =
    route.params;
  console.log('Route params:', route.params);

  const [otp, setOtp] = useState([...testOtp]);
  const [timer, setTimer] = useState(retryAfter || 30);
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

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    if (text === '') {
      newOtp[index] = '';
      setOtp(newOtp);
      if (index > 0) inputs.current[index - 1].focus();
    } else if (/^\d$/.test(text)) {
      newOtp[index] = text;
      setOtp(newOtp);
      if (index < 5) inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '') {
      if (index > 0) inputs.current[index - 1].focus();
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

      const {
        access_token,
        refresh_token,
        user_id,
        expires_in,
        new_user,
        onboardingStatus,
        role: userRole,
        paymentStatus,
      } = result?.data || {};

      const tokenPayload = {
        accessToken: access_token,
        refreshToken: refresh_token,
        userId: user_id,
        expiresIn: expires_in,
        newUser: new_user,
        onboardingStatus: onboardingStatus,
        role: userRole,
        paymentStatus: paymentStatus,
      };

      // Step 1: Check onboardingStatus first
      if (onboardingStatus !== 'complete') {
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
        navigation.reset({
          index: 0,
          routes: [{ name: 'OnBoarding' }],
        });
        return;
      }

      // Step 2: Caregiver with pending payment — block login, don't save token
      if (userRole === 'caregiver' && paymentStatus === 'pending') {
        alert(
          'Payment Pending',
          'The account subscription payment is pending. Caregiver cannot complete the payment. Please ask the account owner to complete the payment.',
        );
        return;
      }

      // Step 3: Save token for all other cases
      await EncryptedStorage.setItem(
        'auth_tokens',
        JSON.stringify(tokenPayload),
      );
      console.log('Token saved to EncryptedStorage');

      // Step 4: Redirect non-caregiver pending payment users to Checkout
      if (paymentStatus === 'pending') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Checkout' }],
        });
        return;
      }

      // Step 5: Payment completed/waived — go to Home
      if (paymentStatus === 'completed' || paymentStatus === 'waived') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
        return;
      }

      // Default fallback
      console.warn('Unexpected user state - navigating to Home as fallback');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (err) {
      console.log('OTP verification failed:', err.message);
      // You might want to show an error alert here
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoader(true);
      const result = await dispatch(
        sendOtp({ phone: `+91${phone}`, role }),
      ).unwrap();
      console.log('OTP resent:', result);

      setTimer(result.retryAfter || 30);
      setOtp([...result.testOtp]);
    } catch (err) {
      console.log('Resend OTP failed:', err.message);
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
          <TextInput
            key={index}
            ref={ref => (inputs.current[index] = ref)}
            style={styles.otpInput}
            keyboardType="numeric"
            maxLength={1}
            value={digit}
            onChangeText={text => handleChange(text, index)}
            onKeyPress={e => handleKeyPress(e, index)}
          />
        ))}
      </View>

      <Text style={styles.subtitle}>
        OTP sent to your phone number. Valid for 5 minutes.
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
        Didn't receive code? Resend in: {timer}s
      </Text>

      <TouchableOpacity
        onPress={handleResendOtp}
        disabled={timer > 0 || loader}
      >
        <View style={styles.resendContainer}>
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
    marginBottom: hp(2.5),
    gap: wp(2),
  },
  otpInput: {
    flex: 1,
    maxWidth: wp(14),
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
  subtitle: {
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    fontSize: 14,
    color: '#64748B',
    marginBottom: hp(3),
    lineHeight: 20,
    letterSpacing: 0.2,
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
