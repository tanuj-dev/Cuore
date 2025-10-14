import React, { useState } from 'react';
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import Toast from '../../components/Toast';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { Images, hp, wp, Color } from '../../utilities';
import color from '../../utilities/Color';
import images from '../../utilities/Images';
import { createAccountThunk } from '../../redux/slices';
import EncryptedStorage from 'react-native-encrypted-storage';
import { create } from 'react-test-renderer';

const CreateAccountScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // 🧩 Local state for all input fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [familyNumber, setFamilyNumber] = useState('');
  const [doctorCode, setDoctorCode] = useState('');
  const [corporateCode, setCorporateCode] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [toast, setToast] = useState(null);

  // 🔄 Optional: get loading from redux
  const { loading } = useSelector(state => state.auth || {});

  const handleCreateAccount = async () => {
    // 🔹 Basic validations
    if (!fullName.trim() || !mobileNumber.trim() || !familyNumber.trim()) {
      Alert.alert('Missing Fields', 'Please fill all required fields.');
      return;
    } else if (fullName.trim().length < 3) {
      setToast({
        message: 'Full name must be at least 3 characters long',
        type: 'error',
      });
      return;
    } else if (familyNumber.trim().length < 10) {
      setToast({
        message: 'Family member number must be at least 10 digits long',
        type: 'error',
      });
      return;
    }

    // 🔹 Mobile number must be exactly 10 digits
    const isValidMobile = /^[0-9]{10}$/.test(mobileNumber);
    if (!isValidMobile) {
      setToast({
        message: 'Mobile number must be exactly 10 digits long',
        type: 'error',
      });
      return;
    }

    // 🔹 Terms and Conditions check
    if (!isChecked) {
      setToast({
        message: 'Please agree to the Terms and Conditions.',
        type: 'error',
      });
      return;
    }

    // 🔹 Terms and Conditions check
    if (!isChecked) {
      Alert.alert(
        'Terms Required',
        'Please agree to the Terms and Conditions.',
      );
      return;
    }

    // ✅ Proceed with account creation logic

    // 🔹 Payload (match backend keys)
    const payload = {
      phone: `+91${mobileNumber}`,
      display_name: fullName,
      caregiver_mobile: `+91${familyNumber}`,
      doctor_code: doctorCode.toString(),
      corporate_code: corporateCode.toString(),
      consent_flags: {
        tos: true,
        share_with_doctor: false,
      },
    };

    try {
      const resultAction = await dispatch(createAccountThunk(payload));
      console.log('Create Account Result:', resultAction);

      if (createAccountThunk.fulfilled.match(resultAction)) {
        Alert.alert(
          'Account Created',
          resultAction.payload?.message ||
            'Account created successfully. Please verify OTP.',
          [
            {
              text: 'OK',
              onPress: () =>
                navigation.navigate('OtpScreen', {
                  requestId: resultAction?.payload.request_id,
                  testOtp: resultAction?.payload.test_otp_code,
                  CreateAccountScreen: true,
                  phone: mobileNumber,
                }),
            },
          ],
        );

        await EncryptedStorage.setItem(
          'request_id',
          JSON.stringify({
            request_id: resultAction?.payload.request_id,
          }),
        );
        console.log('[EncryptedStorage] Saved user_id and request_id');
      } else {
        Alert.alert(
          'Error',
          resultAction.payload?.message ||
            'Failed to create account. Please try again.',
        );
      }
    } catch (error) {
      console.error('Create Account Error:', error);
      Alert.alert('Error', error.message || 'Something went wrong.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* 🔙 Back Button */}
          <Pressable
            style={styles.backArrow}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={Images.BACK_BUTTON}
              style={{
                height: hp(3.5),
                width: wp(4),
                resizeMode: 'contain',
              }}
            />
          </Pressable>

          {/* 🩺 Logo */}
          <Image
            style={{
              resizeMode: 'contain',
              height: hp(3.5),
              width: wp(),
              marginBottom: hp(2),
            }}
            source={images.APP_LOGO}
          />

          {/* 🧾 Title */}
          <Text style={styles.title}>Create Account</Text>

          {/* Full Name */}
          <Text style={styles.label}>
            Full Name <Text style={styles.optional}>(Required)</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter user’s full name"
            placeholderTextColor="#6B7280"
            value={fullName}
            onChangeText={setFullName}
          />

          {/* Mobile Number */}
          <Text style={styles.label}>
            Mobile Number <Text style={styles.optional}>(Required)</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your registered mobile number"
            placeholderTextColor="#6B7280"
            keyboardType="phone-pad"
            value={mobileNumber}
            onChangeText={text => {
              const digitsOnly = text.replace(/[^0-9]/g, '');
              if (digitsOnly.length <= 10) {
                setMobileNumber(digitsOnly);
              } else {
                setToast({
                  message: 'Mobile number must be 10 digits only',
                  type: 'error',
                });
              }
            }}
          />
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onHide={() => setToast(null)}
              top={100}
            />
          )}
          {/* Family member's mobile */}
          <Text style={styles.label}>Family member's mobile number</Text>
          <TextInput
            style={styles.input}
            placeholder="So they can see your progress"
            placeholderTextColor="#6B7280"
            keyboardType="phone-pad"
            value={familyNumber}
            onChangeText={text => {
              const digitsOnly = text.replace(/[^0-9]/g, '');
              if (digitsOnly.length <= 10) {
                setFamilyNumber(digitsOnly);
              } else {
                setToast({
                  message: 'Mobile number must be 10 digits only',
                  type: 'error',
                });
              }
            }}
          />

          {/* Doctor's code */}
          <Text style={styles.label}>Doctor's Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Connect to partnered doctor for supervision"
            placeholderTextColor="#6B7280"
            value={doctorCode}
            onChangeText={setDoctorCode}
          />

          {/* Corporate code */}
          <Text style={styles.label}>Corporate Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Only for corporate plan users"
            placeholderTextColor="#6B7280"
            value={corporateCode}
            onChangeText={setCorporateCode}
          />

          {/* Info */}
          <Text style={styles.infoText}>
            By entering your caregiver’s and doctor’s contact details, you
            authorize Cuore to share relevant health information with them to
            enable coordinated, personalized care as part of your program.
          </Text>

          {/* Terms Checkbox */}
          <View style={styles.checkboxContainer}>
            <BouncyCheckbox
              size={20}
              fillColor="#9CA3AF"
              unfillColor="#FFFFFF"
              textComponent={
                <Text style={styles.checkboxLabel}>
                  I have read and agree to the{' '}
                  <Text
                    style={styles.link}
                    onPress={() => Linking.openURL('https://example.com/terms')}
                  >
                    Terms and Conditions
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={styles.link}
                    onPress={() =>
                      Linking.openURL('https://example.com/privacy')
                    }
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              }
              isChecked={isChecked}
              onPress={checked => setIsChecked(checked)}
            />
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            onPress={handleCreateAccount}
            style={[
              styles.verifyButton,
              { backgroundColor: loading ? '#9CA3AF' : color.DARK_BLUE },
            ]}
            disabled={loading}
          >
            <Text style={styles.verifyText}>
              {loading ? 'Creating...' : 'Verify'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

// 🧾 Styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: wp(5),
    flexGrow: 1,
  },
  backArrow: {
    marginBottom: hp(2),
    marginTop: Platform.OS == 'ios' && hp(2),
  },
  title: {
    color: '#111827',
    fontSize: hp(2.6),
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: hp(3),
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: hp(0.8),
    marginTop: hp(1.5),
    fontFamily: 'Roboto-Regular',
  },
  optional: {
    fontStyle: 'italic',
    fontWeight: '400',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp(1.5),
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
    fontSize: 14,
    backgroundColor: '#fff',
    fontFamily: 'Roboto-Regular',
  },
  infoText: {
    fontSize: hp(1.5),
    color: '#4B5563',
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(2),
  },
  checkboxLabel: {
    flex: 1,
    fontSize: hp(1.5),
    color: '#4B5563',
    marginLeft: wp(2),
  },
  link: {
    color: '#1E64AC',
    textDecorationLine: 'underline',
  },
  verifyButton: {
    paddingVertical: hp(1.6),
    borderRadius: wp(2),
    alignItems: 'center',
  },
  verifyText: {
    color: 'white',
    fontSize: hp(2),
    fontWeight: '600',
  },
});

export default CreateAccountScreen;
