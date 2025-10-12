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

const OtpScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const loading = useSelector(state => state.auth.loading);

  const { phone, requestId, retryAfter, testOtp, CreateAccountScreen } =
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
      } = result?.data;

      const tokenPayload = {
        accessToken: access_token,
        refreshToken: refresh_token,
        userId: user_id,
        expiresIn: expires_in,
        newUser: new_user,
        onboardingStatus: onboardingStatus,
      };

      // ✅ Save token securely
      await EncryptedStorage.setItem(
        'auth_tokens',
        JSON.stringify(tokenPayload),
      );
      console.log('Token saved to EncryptedStorage');

      // ✅ Read it back immediately for confirmation
      const storedToken = await EncryptedStorage.getItem('auth_tokens');
      console.log('Retrieved token from storage:', JSON.parse(storedToken));

      if (onboardingStatus === 'complete') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'OnBoarding' }],
        });
      }
    } catch (err) {
      console.log('OTP verification failed:', err.message);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoader(true);
      const result = await dispatch(sendOtp(`+91${phone}`)).unwrap();
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
      <TouchableOpacity
        style={styles.backArrow}
        onPress={() => navigation.goBack()}
      >
        <Image
          source={Images.BACK_BUTTON}
          style={{
            resizeMode: 'contain',
            height: hp(3.5),
            width: wp(4),
            tintColor: '#000000',
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
            <ActivityIndicator color="#1E64AC" />
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
    backgroundColor: '#F9FAFB',
    paddingHorizontal: wp(6),
    paddingTop: hp(3),
  },
  backArrow: {
    marginTop: Platform.OS === 'ios' ? hp(2) : 0,
    marginBottom: hp(3),
  },
  title: {
    marginTop: hp(7),
    fontSize: hp(2.4),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: hp(3),
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  otpInput: {
    width: wp(12),
    height: wp(12),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp(2),
    textAlign: 'center',
    fontSize: hp(2),
    backgroundColor: '#fff',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: hp(1.6),
    color: '#6B7280',
    marginBottom: hp(3),
  },
  submitButton: {
    backgroundColor: '#1E64AC',
    paddingVertical: hp(1.6),
    borderRadius: wp(2),
    alignItems: 'center',
    marginBottom: hp(2),
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: hp(2),
    fontWeight: '600',
  },
  timerText: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: hp(1),
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    color: '#1E64AC',
    fontWeight: '500',
    fontSize: hp(1.8),
  },
});

export default OtpScreen;
