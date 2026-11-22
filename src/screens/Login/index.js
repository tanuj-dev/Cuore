import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  View,
  StyleSheet,
  Image,
  Linking,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ShieldCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useKeyboardScrollToEnd } from '../../hooks/useKeyboardScrollToEnd';
import { Images } from '../../utilities';
import { sendOtp } from '../../redux/slices';
import Toast from '../../components/Toast';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { Text, TextInput } from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import Segmented from '../../components/ui/Segmented';
import FocusedStatusBar from '../../components/ui/FocusedStatusBar';
import { font, radius, spacing, useTheme } from '../../theme';

/* iOS: a plain ScrollView that scrolls to the end when the keyboard opens (useKeyboardScrollToEnd),
 * because KeyboardAwareScrollView left the fields under the keyboard there. Android keeps
 * KeyboardAwareScrollView exactly as before. */
const Scroller = Platform.OS === 'ios' ? ScrollView : KeyboardAwareScrollView;
const SCROLLER_ANDROID_PROPS =
  Platform.OS === 'ios' ? {} : { enableOnAndroid: true };

const Login = ({ navigation }) => {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { ref: scrollRef } = useKeyboardScrollToEnd();
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

  const isCaregiver = tab === 'Caregiver';

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FocusedStatusBar style="light-content" />
      <Scroller
        {...SCROLLER_ANDROID_PROPS}
        ref={scrollRef}
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        // The hero paints under the status bar itself; no automatic top inset.
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        {AlertComponent}

        <View style={[styles.hero, { paddingTop: insets.top + spacing.xxl }]}>
          {/* The gradient paints only its content box, so it sits behind the padded wrapper. */}
          <LinearGradient
            colors={[t.brandDark, t.brand]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.logoTile}>
            <Image source={Images.APP_LOGO} style={styles.logo} />
          </View>
          <Text style={[font.h1, styles.heroTitle]}>Welcome to Cuore</Text>
          <Text style={[font.body, styles.heroSub]}>
            Your everyday health companion.
          </Text>
          <View style={styles.trust}>
            <ShieldCheck size={16} color="rgba(255,255,255,0.9)" />
            <Text style={[font.small, styles.trustText]}>
              Secure sign in with a one-time code
            </Text>
          </View>
        </View>

        <View style={styles.formWrap}>
          <View
            style={[
              styles.card,
              { backgroundColor: t.surface, borderColor: t.border },
            ]}
          >
            <Text style={[font.h2, { color: t.text }]}>Sign in</Text>
            <Text style={[font.body, styles.cardSub, { color: t.textMuted }]}>
              Log in with your registered mobile number.
            </Text>

            {/* Segmented pads its row for full-width use; cancel that inside the card. */}
            <View style={{ marginHorizontal: -spacing.lg }}>
              <Segmented
                options={[
                  { key: 'User', label: 'User' },
                  { key: 'Caregiver', label: 'Caregiver' },
                ]}
                value={tab}
                onChange={setTab}
              />
            </View>

            <View
              style={[
                styles.phoneRow,
                { backgroundColor: t.bg, borderColor: t.border },
              ]}
            >
              <Text style={[font.bodyStrong, { color: t.text }]}>+91</Text>
              <View style={[styles.sep, { backgroundColor: t.border }]} />
              <TextInput
                style={[styles.phoneInput, { color: t.text }]}
                placeholder="Mobile number"
                keyboardType="number-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                placeholderTextColor={t.textMuted}
                value={phoneNumber}
                returnKeyType="done"
                onSubmitEditing={handleSendOtp}
                accessibilityLabel="Mobile number"
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

            <Button
              label="Send code"
              onPress={handleSendOtp}
              loading={loading}
              style={{ marginTop: spacing.xl }}
            />

            <View style={styles.links}>
              {!isCaregiver && (
                <Pressable
                  onPress={() => navigation.navigate('NewAccount')}
                  hitSlop={8}
                  accessibilityRole="button"
                >
                  <Text style={[font.small, { color: t.textMuted }]}>
                    New to Cuore?{' '}
                    <Text style={{ color: t.brand, fontWeight: '700' }}>
                      Create account
                    </Text>
                  </Text>
                </Pressable>
              )}
              <Text style={[font.small, styles.terms, { color: t.textMuted }]}>
                By continuing, you accept the{' '}
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
            </View>
          </View>
        </View>
      </Scroller>
    </KeyboardAvoidingView>
  );
};

export default Login;

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1 },
  hero: { paddingHorizontal: spacing.xl, paddingBottom: 72 },
  logoTile: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  logo: { width: 112, height: 34, resizeMode: 'contain' },
  heroTitle: { color: '#fff', marginTop: spacing.lg, fontSize: 30 },
  heroSub: { color: 'rgba(255,255,255,0.85)', marginTop: 6, maxWidth: 320 },
  trust: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl },
  trustText: { color: 'rgba(255,255,255,0.9)', marginLeft: 8 },
  formWrap: { paddingHorizontal: spacing.lg, marginTop: -48 },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  cardSub: { marginTop: 6, marginBottom: spacing.xl },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 58,
    marginTop: spacing.sm,
  },
  sep: { width: 1, height: 24, marginHorizontal: spacing.md },
  phoneInput: { flex: 1, fontSize: 17, fontWeight: '600', height: '100%' },
  links: { marginTop: spacing.lg, alignItems: 'center', gap: spacing.md },
  terms: { textAlign: 'center', lineHeight: 19 },
});
