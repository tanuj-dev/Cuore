import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import {hp, wp, Images} from '../../utilities';
// import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';

const OtpScreen = ({}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const inputs = useRef([]);
  const navigation = useNavigation();

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

  const handleResend = () => {
    setTimer(30);
    // Trigger resend logic here
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
        <Image
          source={Images.BACK_BUTTON}
          style={{
            resizeMode: 'contain',
            height: hp(3.5),
            width: wp(4),
            // marginLeft: hp(2),
            tintColor: '#000000',
          }}></Image>
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
        onPress={() => navigation.navigate('OnBoarding')}
        style={styles.submitButton}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>

      <Text style={styles.timerText}>
        Didn't receive code? Resend in: {timer}s
      </Text>

      <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
        <View style={styles.resendContainer}>
          <Image
            source={Images.SHARE}
            style={{
              resizeMode: 'contain',
              height: hp(2),
              width: wp(4),
            }}></Image>
          <Text style={styles.resendText}> Resend OTP</Text>
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
      marginTop:Platform.OS =='ios'&& hp(2),
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
    // marginTop: hp(10),
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
