import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Images, hp, wp } from '../../utilities';
import Constants from '../../utilities/Constants';
import { sendOtp } from '../../redux/slices';

const Login = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [tab, setTab] = useState('User');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(phoneNumber)) {
      Alert.alert(
        'Invalid Number',
        'Please enter a valid 10-digit mobile number.',
      );
      return;
    }

    setLoading(true);
    console.log('Dispatching sendOtp with phone number:', phoneNumber);

    try {
      const result = await dispatch(sendOtp(`+91${phoneNumber}`)).unwrap();

      console.log('OTP sent:', result);
      navigation.navigate('OtpScreen', {
        phone: phoneNumber,
        requestId: result.requestId,
        retryAfter: result.retryAfter,
        testOtp: result.testOtp,
      });
    } catch (err) {
      console.log('OTP failed:', err.message);

      if (err.message === 'Unknown error') {
        Alert.alert(
          'Error',
          'Network error. Please check your connection and try again.',
        );
      } else {
        Alert.alert(
          'Error',
          err.message || 'Failed to send OTP. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('NewAccount'),
            },
          ],
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={Images.APP_LOGO} style={styles.logo} />
      <Text style={styles.loginText}>
        Log in with your registered mobile number
      </Text>
      <View style={styles.card}>
        <View style={styles.switchTabs}>
          <TouchableOpacity
            onPress={() => setTab('User')}
            style={tab == 'User' ? styles.activeTab : styles.inactiveTab}
          >
            <Text
              style={
                tab == 'User' ? styles.activeTabText : styles.inactiveTabText
              }
            >
              User
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('Caregiver')}
            style={tab == 'Caregiver' ? styles.activeTab : styles.inactiveTab}
          >
            <Text
              style={
                tab == 'Caregiver'
                  ? styles.activeTabText
                  : styles.inactiveTabText
              }
            >
              Caregiver
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.countryCodeContainer}>
            <Text style={styles.countryCode}>+91</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="9876543210"
            keyboardType="numeric"
            placeholderTextColor="#999"
            onChangeText={text => setPhoneNumber(text)}
          />
        </View>
        {tab == 'User' && (
          <TouchableOpacity onPress={() => navigation.navigate('NewAccount')}>
            <Text style={styles.signupText}>
              New user? <Text style={styles.signupLink}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleSendOtp}
          // onPress={() => navigation.navigate('OnBoarding')}
          style={styles.verifyButton}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyText}>Verify</Text>
          )}
        </TouchableOpacity>
      </View>
      {/* <TouchableOpacity
        onPress={() => navigation.navigate('OtpScreen')}
        style={{
          marginTop: hp(9),
          backgroundColor: '#1E64AC',
          padding: hp(1.5),
          alignItems: 'center',
          borderRadius: hp(0.5),
          marginHorizontal: hp(2),
        }}>
        <Text style={styles.verifyText}>Get OTP</Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: hp(10),
    paddingHorizontal: wp(6),
  },
  logo: {
    width: wp(25),
    height: hp(5),
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: hp(2),
  },
  loginText: {
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    fontSize: hp(1.8),
    color: '#4B5563',
    marginBottom: hp(3),
  },
  card: {
    backgroundColor: 'white',
    padding: hp(2),
    borderRadius: hp(1),
  },
  switchTabs: {
    flexDirection: 'row',
    backgroundColor: '#E9ECEF',
    borderRadius: hp(1),
    marginBottom: hp(2),
  },
  activeTab: {
    flex: 1,
    backgroundColor: '#1E64AC',
    paddingVertical: hp(1.2),
    borderRadius: hp(1),
  },
  inactiveTab: {
    flex: 1,
    paddingVertical: hp(1.2),
  },
  activeTabText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: hp(1.8),
  },
  inactiveTabText: {
    fontFamily: 'Roboto-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: hp(1.8),
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: hp(1),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    marginBottom: hp(1.5),
    alignItems: 'center',
  },
  countryCodeContainer: {
    marginRight: wp(2),
  },
  countryCode: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(2),
    color: '#6B7280',
  },
  phoneInput: {
    fontFamily: 'Roboto-Regular',
    flex: 1,
    fontSize: hp(2),
    color: '#6B7280',
  },
  signupText: {
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    fontSize: hp(1.7),
    color: '#4B5563',
    marginBottom: hp(3),
  },
  signupLink: {
    fontFamily: 'Roboto-Regular',
    color: '#1E64AC',
    fontWeight: '500',
  },
  verifyButton: {
    backgroundColor: '#1E64AC',
    borderRadius: hp(1),
    paddingVertical: hp(1.8),
    alignItems: 'center',
  },
  verifyText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontSize: hp(2),
    fontWeight: '600',
  },
});

export default Login;
