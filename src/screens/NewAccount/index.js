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
} from 'react-native';
import Toast from '../../components/Toast';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Images, hp, wp, Color } from '../../utilities';
import color from '../../utilities/Color';
import images from '../../utilities/Images';
import { createAccountThunk } from '../../redux/slices';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import EncryptedStorage from 'react-native-encrypted-storage';
import { create } from 'react-test-renderer';

const CreateAccountScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();

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
    if (!fullName.trim() || !mobileNumber.trim()) {
      alert('Missing Fields', 'Please fill all required fields.');
      return;
    } else if (fullName.trim().length < 3) {
      setToast({
        message: 'Full name must be at least 3 characters long',
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
      alert('Terms Required', 'Please agree to the Terms and Conditions.');
      return;
    }

    // ✅ Proceed with account creation logic

    // 🔹 Payload (match backend keys)
    const payload = {
      phone: `+91${mobileNumber}`,
      display_name: fullName,
      caregiver_mobile: familyNumber.trim() ? `+91${familyNumber.trim()}` : '',
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
        alert(
          'Account Created',
          resultAction.payload?.message ||
            'Account created successfully. Please verify OTP.',
          [
            {
              text: 'OK',
              onPress: () =>
                navigation.navigate('OtpScreen', {
                  requestId: resultAction?.payload.request_id,
                  retryAfter: resultAction?.payload.retry_after_seconds,
                  CreateAccountScreen: true,
                  phone: mobileNumber,
                  // Needed so Resend can re-submit the signup and get a fresh request_id
                  registrationPayload: payload,
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
        alert(
          'Error',
          resultAction.payload?.message ||
            'Failed to create account. Please try again.',
        );
      }
    } catch (error) {
      console.error('Create Account Error:', error);
      alert('Error', error.message || 'Something went wrong.');
    }
  };

  return (
    <>
      {AlertComponent}
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
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
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
                height: hp(4.5),
                width: wp(30),
                alignSelf: 'center',
                marginBottom: hp(2.5),
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
              placeholderTextColor="#94A3B8"
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
              placeholderTextColor="#94A3B8"
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
              placeholderTextColor="#94A3B8"
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
              placeholder="Link to your doctor for supervision"
              placeholderTextColor="#94A3B8"
              value={doctorCode}
              onChangeText={setDoctorCode}
            />

            {/* Corporate code */}
            <Text style={styles.label}>Corporate Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Only for corporate plan users"
              placeholderTextColor="#94A3B8"
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
              <TouchableOpacity
                style={styles.customCheckbox}
                onPress={() => setIsChecked(!isChecked)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    isChecked && styles.checkboxBoxChecked,
                  ]}
                >
                  {isChecked && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>
                By clicking, I accept the{' '}
                <Text
                  style={styles.link}
                  onPress={() => Linking.openURL('https://cuore.health/terms')}
                >
                  Terms & Conditions
                </Text>{' '}
                and{' '}
                <Text
                  style={styles.link}
                  onPress={() =>
                    Linking.openURL('https://cuore.health/privacy')
                  }
                >
                  Privacy
                </Text>
              </Text>
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleCreateAccount}
              style={[
                styles.verifyButton,
                { backgroundColor: loading ? '#94A3B8' : '#11418A' },
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
    </>
  );
};

// 🧾 Styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: wp(5),
    flexGrow: 1,
  },
  backArrow: {
    // marginBottom: hp(2),
    // marginTop: Platform.OS === 'ios' ? hp(2) : hp(1),
    padding: hp(0.5),
  },
  title: {
    color: '#1E293B',
    fontSize: 24,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    marginBottom: hp(3),
    letterSpacing: -0.3,
  },
  label: {
    color: '#475569',
    fontSize: 14,
    marginBottom: hp(0.8),
    marginTop: hp(1.8),
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2,
  },
  optional: {
    fontStyle: 'italic',
    fontFamily: 'Poppins-Regular',
    color: '#94A3B8',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(4),
    fontSize: 15,
    backgroundColor: '#F8FAFC',
    fontFamily: 'Poppins-Regular',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  infoText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: hp(2),
    marginBottom: hp(2),
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(2.5),
    marginTop: hp(1),
  },
  customCheckbox: {
    marginRight: wp(2.5),
    marginTop: hp(0.3),
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#11418A',
    borderColor: '#11418A',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  link: {
    color: '#11418A',
    textDecorationLine: 'underline',
    fontFamily: 'Poppins-Medium',
  },
  verifyButton: {
    paddingVertical: hp(2),
    borderRadius: 12,
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
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.5,
  },
});

export default CreateAccountScreen;
