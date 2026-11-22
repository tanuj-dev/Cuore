import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Check, ShieldCheck } from 'lucide-react-native';
import Toast from '../../components/Toast';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { createAccountThunk } from '../../redux/slices';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import EncryptedStorage from 'react-native-encrypted-storage';
import { Text } from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Field from '../../components/ui/Field';
import HeroHeader from '../../components/ui/HeroHeader';
import { font, radius, spacing, useTheme } from '../../theme';

const CreateAccountScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();
  const t = useTheme();

  // Local state for all input fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [familyNumber, setFamilyNumber] = useState('');
  const [doctorCode, setDoctorCode] = useState('');
  const [corporateCode, setCorporateCode] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [toast, setToast] = useState(null);

  // Optional: get loading from redux
  const { loading } = useSelector(state => state.auth || {});

  const handleCreateAccount = async () => {
    // Basic validations
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

    // Mobile number must be exactly 10 digits
    const isValidMobile = /^[0-9]{10}$/.test(mobileNumber);
    if (!isValidMobile) {
      setToast({
        message: 'Mobile number must be exactly 10 digits long',
        type: 'error',
      });
      return;
    }

    // Terms and Conditions check
    if (!isChecked) {
      setToast({
        message: 'Please agree to the Terms and Conditions.',
        type: 'error',
      });
      return;
    }

    // Terms and Conditions check
    if (!isChecked) {
      alert('Terms Required', 'Please agree to the Terms and Conditions.');
      return;
    }

    // Proceed with account creation logic

    // Payload (match backend keys)
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

  const onDigits = setter => text => {
    const digitsOnly = text.replace(/[^0-9]/g, '');
    if (digitsOnly.length <= 10) {
      setter(digitsOnly);
    } else {
      setToast({
        message: 'Mobile number must be 10 digits only',
        type: 'error',
      });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      {AlertComponent}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          // The hero paints under the status bar itself; no automatic top inset.
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
        >
          <HeroHeader
            title="Create account"
            subtitle="Join Cuore in a minute"
            onBack={() => navigation.goBack()}
            bottom={56}
          />

          <View style={styles.formWrap}>
            <Card style={styles.card}>
              <View style={{ gap: spacing.lg }}>
                <Field
                  label="Full name"
                  required
                  placeholder="Enter your full name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  textContentType="name"
                />
                <Field
                  label="Mobile number"
                  required
                  prefix="+91"
                  placeholder="10-digit number"
                  keyboardType="number-pad"
                  value={mobileNumber}
                  onChangeText={onDigits(setMobileNumber)}
                />
                <Field
                  label="Family member's mobile number"
                  prefix="+91"
                  placeholder="So they can see your progress"
                  keyboardType="number-pad"
                  value={familyNumber}
                  onChangeText={onDigits(setFamilyNumber)}
                />
                <Field
                  label="Doctor's code"
                  placeholder="Link to your doctor for supervision"
                  value={doctorCode}
                  onChangeText={setDoctorCode}
                  autoCapitalize="characters"
                />
                <Field
                  label="Corporate code"
                  placeholder="Only for corporate plan users"
                  value={corporateCode}
                  onChangeText={setCorporateCode}
                  autoCapitalize="characters"
                />
              </View>

              {toast && (
                <Toast
                  message={toast.message}
                  type={toast.type}
                  onHide={() => setToast(null)}
                  top={100}
                />
              )}

              <View style={[styles.info, { backgroundColor: t.infoSoft }]}>
                <ShieldCheck size={18} color={t.info} />
                <Text style={[font.small, styles.infoText, { color: t.text }]}>
                  By entering your caregiver's and doctor's contact details,
                  you authorize Cuore to share relevant health information with
                  them to enable coordinated, personalized care as part of your
                  program.
                </Text>
              </View>

              <Pressable
                style={styles.checkRow}
                onPress={() => setIsChecked(!isChecked)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isChecked }}
              >
                <View
                  style={[
                    styles.checkBox,
                    {
                      borderColor: isChecked ? t.brand : t.border,
                      backgroundColor: isChecked ? t.brand : t.surface,
                    },
                  ]}
                >
                  {isChecked && <Check size={15} color="#fff" strokeWidth={3} />}
                </View>
                <Text style={[font.small, styles.checkText, { color: t.textMuted }]}>
                  I accept the{' '}
                  <Text
                    style={{ color: t.brand, fontWeight: '700' }}
                    onPress={() => Linking.openURL('https://cuore.health/terms')}
                  >
                    Terms & Conditions
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={{ color: t.brand, fontWeight: '700' }}
                    onPress={() =>
                      Linking.openURL('https://cuore.health/privacy')
                    }
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </Pressable>

              <Button
                label="Create account"
                onPress={handleCreateAccount}
                loading={loading}
                style={{ marginTop: spacing.xl }}
              />
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: spacing.xxxl },
  formWrap: { paddingHorizontal: spacing.lg, marginTop: -36 },
  card: { padding: spacing.xl, borderRadius: radius.xl },
  info: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xl,
  },
  infoText: { flex: 1, lineHeight: 19 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.lg,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 1,
  },
  checkText: { flex: 1, lineHeight: 20 },
});

export default CreateAccountScreen;
