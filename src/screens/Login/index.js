import React, { useState, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useDispatch } from 'react-redux';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Images, hp, wp } from '../../utilities';
import { sendOtp, loginCaregiverThunk } from '../../redux/slices';
import Toast from '../../components/Toast';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const Login = ({ navigation }) => {
  const { colors: c, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(c, isDark), [c, isDark]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [tab, setTab] = useState('User');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();

  const handleSendOtp = async () => {
    // ✅ Validate phone number
    if (!/^\d{10}$/.test(phoneNumber)) {
      setToast({
        message: 'Please enter a valid 10-digit mobile number',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    console.log('Dispatching sendOtp with phone number:', phoneNumber);

    try {
      const role = tab === 'Caregiver' ? 'caregiver' : 'user';
      const result = await dispatch(
        sendOtp({ phone: `+91${phoneNumber}`, role }),
      ).unwrap();

      console.log('OTP sent========================:', result);
      navigation.navigate('OtpScreen', {
        phone: phoneNumber,
        role,
        requestId: result.requestId,
        retryAfter: result.retryAfter,
      });
    } catch (err) {
      console.log('OTP failed:<=====', err.message);

      if (err.message) {
        alert('Error', err.message);
      } else {
        alert('Error', err.message || 'Failed to send OTP. Please try again.', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('NewAccount'),
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      showsVerticalScrollIndicator={false}
    >
      {AlertComponent}
      <Image source={Images.APP_LOGO} style={styles.logo} />
      <Text style={styles.loginText}>
        Log in with your registered mobile number
      </Text>
      <View style={styles.card}>
        <View style={styles.switchTabs}>
          <TouchableOpacity
            onPress={() => setTab('User')}
            style={tab === 'User' ? styles.activeTab : styles.inactiveTab}
          >
            <Text
              style={
                tab === 'User' ? styles.activeTabText : styles.inactiveTabText
              }
            >
              User
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('Caregiver')}
            style={tab === 'Caregiver' ? styles.activeTab : styles.inactiveTab}
          >
            <Text
              style={
                tab === 'Caregiver'
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
            <Text style={styles.flagEmoji}>🇮🇳</Text>
            <Text style={styles.countryCode}>+91</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="9876543210"
            keyboardType="numeric"
            placeholderTextColor={c.inputPlaceholder}
            value={phoneNumber}
            onChangeText={text => {
              const cleaned = text.replace(/[^0-9]/g, '');
              if (cleaned.length <= 10) {
                setPhoneNumber(cleaned);
                setToast(null);
              } else {
                setToast({
                  message: 'Mobile number must be 10 digits only',
                  type: 'error',
                });
              }
            }}
          />
        </View>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onHide={() => setToast(null)}
          />
        )}

        {tab === 'User' && (
          <TouchableOpacity onPress={() => navigation.navigate('NewAccount')}>
            <Text style={styles.signupText}>
              New user? <Text style={styles.signupLink}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleSendOtp}
          style={styles.verifyButton}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyText}>Verify</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By clicking, I accept the{' '}
          <Text
            style={styles.termsLink}
            onPress={() => Linking.openURL('https://cuore.health/terms')}
          >
            Terms & Conditions
          </Text>{' '}
          and{' '}
          <Text
            style={styles.termsLink}
            onPress={() => Linking.openURL('https://cuore.health/privacy')}
          >
            Privacy
          </Text>
        </Text>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default Login;

const createStyles = (c, isDark) => StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: c.card,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: hp(20),
    paddingHorizontal: wp(6),
    backgroundColor: c.card,
  },
  logo: {
    width: wp(30),
    height: hp(6),
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: hp(2.5),
  },
  loginText: {
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    fontSize: 15,
    color: isDark ? '#FFFFFF' : c.subText,
    marginBottom: hp(3.5),
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: c.card,
    padding: hp(2.5),
    borderRadius: 16,
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    ...Platform.select({
      android: { elevation: 2 },
      ios: { elevation: 5 },
    }),
  },
  switchTabs: {
    flexDirection: 'row',
    backgroundColor: c.mutedSurface,
    borderRadius: 12,
    marginBottom: hp(2.5),
    padding: hp(0.4),
  },
  activeTab: {
    flex: 1,
    backgroundColor: '#11418A',
    paddingVertical: hp(1.4),
    borderRadius: 10,
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    ...Platform.select({
      android: { elevation: 2 },
      ios: { elevation: 3 },
    }),
  },
  inactiveTab: {
    flex: 1,
    paddingVertical: hp(1.4),
  },
  activeTabText: {
    fontFamily: 'Poppins-Medium',
    color: c.onPrimary,
    textAlign: 'center',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  inactiveTabText: {
    fontFamily: 'Poppins-Regular',
    color: isDark ? '#FFFFFF' : c.tabInactive,
    textAlign: 'center',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: c.border,
    borderRadius: 12,
    paddingHorizontal: wp(3.5),
    paddingVertical: Platform.OS === 'ios' ? hp(1.5) : hp(1),
    marginBottom: hp(2),
    alignItems: 'center',
    backgroundColor: c.surface,
  },
  countryCodeContainer: {
    marginRight: wp(2.5),
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: wp(2.5),
    borderRightWidth: 1,
    borderRightColor: c.border,
  },
  flagEmoji: {
    fontSize: hp(2.5),
    marginRight: wp(1.5),
  },
  countryCode: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: isDark ? '#FFFFFF' : c.subText,
    letterSpacing: 0.2,
  },
  phoneInput: {
    fontFamily: 'Poppins-Regular',
    flex: 1,
    fontSize: 15,
    color: c.text,
    letterSpacing: 0.3,
  },
  errorText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#EF4444',
    marginBottom: hp(1),
    marginLeft: wp(2),
  },
  signupText: {
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    fontSize: 14,
    color: isDark ? '#FFFFFF' : c.subText,
    marginBottom: hp(2),
    letterSpacing: 0.2,
  },
  termsText: {
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    fontSize: 12,
    color: isDark ? '#FFFFFF' : c.tabInactive,
    marginBottom: hp(1),
    marginTop: hp(1.5),
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  termsLink: {
    fontFamily: 'Poppins-Medium',
    color: c.primary,
    textDecorationLine: 'underline',
  },
  signupLink: {
    fontFamily: 'Poppins-Medium',
    color: c.primary,
    letterSpacing: 0.2,
  },
  verifyButton: {
    backgroundColor: '#11418A',
    borderRadius: 12,
    paddingVertical: hp(2),
    alignItems: 'center',
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 3 },
      ios: { elevation: 5 },
    }),
  },
  verifyText: {
    fontFamily: 'Poppins-Medium',
    color: c.onPrimary,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
