import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  BackHandler,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { RotateCcw } from 'lucide-react-native';
import { useKeyboardScrollToEnd } from '../../hooks/useKeyboardScrollToEnd';
import { hp } from '../../utilities';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { verifyOtp, sendOtp, createAccountThunk } from '../../redux/slices';
import { setUserData } from '../../redux/Auth/slice';
import EncryptedStorage from 'react-native-encrypted-storage';
import Endpoints from '../../utilities/Endpoints';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { Text } from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import OtpInput from '../../components/ui/OtpInput';
import HeroHeader from '../../components/ui/HeroHeader';
import { font, radius, spacing, useTheme } from '../../theme';

/* iOS: a plain ScrollView that scrolls to the end when the keyboard opens (useKeyboardScrollToEnd),
 * because KeyboardAwareScrollView left the fields under the keyboard there. Android keeps
 * KeyboardAwareScrollView exactly as before. */
const Scroller = Platform.OS === 'ios' ? ScrollView : KeyboardAwareScrollView;
const SCROLLER_ANDROID_PROPS =
  Platform.OS === 'ios'
    ? {}
    : { enableOnAndroid: true, extraScrollHeight: hp(22) };

const OTP_LENGTH = 6;
// Fallback only — the real validity comes from the backend's
// retry_after_seconds (which mirrors Message Central's OTP validity).
// Resend stays disabled while the current OTP is still valid.
const OTP_VALIDITY_SECONDS = 60;
const createEmptyOtp = () => Array(OTP_LENGTH).fill('');

const formatTimer = seconds => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const OtpScreen = () => {
  const t = useTheme();
  const { ref: scrollRef } = useKeyboardScrollToEnd();
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();

  const loading = useSelector(state => state.auth.loading);

  const {
    phone,
    role,
    requestId: initialRequestId,
    retryAfter,
    CreateAccountScreen,
    registrationPayload,
  } = route.params;
  console.log('Route params:', route.params);

  // Kept in state: every resend issues a NEW request_id, and verifying the new
  // SMS code against the old one always fails with "didn't match".
  const [requestId, setRequestId] = useState(initialRequestId);
  const [otp, setOtp] = useState(() => createEmptyOtp());
  // Server-driven so backend/MC validity changes don't need an app release
  const [otpValidity, setOtpValidity] = useState(
    retryAfter || OTP_VALIDITY_SECONDS,
  );
  const [timer, setTimer] = useState(retryAfter || OTP_VALIDITY_SECONDS);
  const [loader, setLoader] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Block going back while the resend timer is running, so the user can't
  // leave the OTP screen and re-trigger a new send inside the cooldown.
  // Covers Android hardware back + iOS swipe-back gesture. Re-enabled at 0.
  useEffect(() => {
    navigation.setOptions?.({ gestureEnabled: timer <= 0 });
    const onHardwareBack = () => timer > 0; // returning true blocks the back
    const sub = BackHandler.addEventListener(
      'hardwareBackPress',
      onHardwareBack,
    );
    return () => sub.remove();
  }, [timer, navigation]);

  // One hidden input drives the boxes (components/ui/OtpInput): typing, paste, SMS autofill and
  // backspace all work there, so the old per-box focus juggling and "Remove last digit" are gone.
  const otpValue = otp.join('');
  const onOtpChange = v =>
    setOtp(Array.from({ length: OTP_LENGTH }, (_, i) => v[i] || ''));

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
      const premiumExpiry = otpData.premiumExpiry ?? null;
      const isFreeUser =
        otpData.isFree === true ||
        otpData.is_free === true ||
        otpData.isFree === 'true' ||
        otpData.is_free === 'true';

      // A waived/free grant only counts while the free window is still open.
      // (Paid 'completed' always counts; no premiumExpiry = unlimited/corporate.)
      const freeStillValid = premiumExpiry
        ? new Date(premiumExpiry).getTime() > Date.now()
        : true;
      const hasPaymentAccess =
        paymentStatus === 'completed' ||
        ((paymentStatus === 'waived' || isFreeUser) && freeStillValid);

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
        premiumExpiry,
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
      let newValidity;

      if (CreateAccountScreen && registrationPayload) {
        // Registration flow: the login resend endpoint would 404 for a
        // not-yet-registered user — re-submit the signup instead, which
        // re-sends the OTP and returns a fresh request_id.
        const result = await dispatch(
          createAccountThunk(registrationPayload),
        ).unwrap();
        console.log('Registration OTP resent:', result);
        newRequestId = result?.request_id;
        newValidity = result?.retry_after_seconds;
      } else {
        const result = await dispatch(
          sendOtp({ phone: `+91${phone}`, role }),
        ).unwrap();
        console.log('OTP resent:', result);
        newRequestId = result?.requestId || result?.data?.request_id;
        newValidity = result?.retryAfter || result?.data?.retry_after_seconds;
      }

      if (newRequestId) {
        setRequestId(newRequestId);
      }
      // Fresh code sent — lock Resend for its full validity window again
      const validity = newValidity || otpValidity;
      setOtpValidity(validity);
      setTimer(validity);
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

  const validityLabel =
    otpValidity >= 60
      ? `${Math.round(otpValidity / 60)} minute${otpValidity >= 120 ? 's' : ''}`
      : `${otpValidity} seconds`;

  return (
    /* Scrollable with the keypad open, so Verify can be reached without closing it first. When
       the keypad opens the screen scrolls to the end (useKeyboardScrollToEnd), which keeps the OTP
       boxes, Verify and Resend above it; "handled" lets the first tap on Verify press it rather
       than only dismissing the keyboard. */
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Scroller
        {...SCROLLER_ANDROID_PROPS}
        ref={scrollRef}
        style={styles.root}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        // The hero paints under the status bar itself; no automatic top inset.
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        {AlertComponent}
        {/* Back stays hidden while the resend timer runs, the same rule as the gesture and
            hardware back above. */}
        <HeroHeader
          title="Verify your number"
          subtitle={`Enter the ${OTP_LENGTH}-digit code sent to +91 ${phone}`}
          onBack={timer > 0 ? undefined : () => navigation.goBack()}
          bottom={56}
        />

        <View style={styles.formWrap}>
          <View
            style={[
              styles.card,
              { backgroundColor: t.surface, borderColor: t.border },
            ]}
          >
            <OtpInput
              value={otpValue}
              onChange={onOtpChange}
              length={OTP_LENGTH}
            />

            <Text style={[font.small, styles.validity, { color: t.textMuted }]}>
              The code is valid for {validityLabel}.
            </Text>

            <Button
              label="Verify and continue"
              onPress={handleVerifyOtp}
              loading={loading}
              disabled={otpValue.length !== OTP_LENGTH}
              style={{ marginTop: spacing.xl }}
            />

            <Pressable
              onPress={handleResendOtp}
              disabled={timer > 0 || loader}
              style={styles.resend}
              accessibilityRole="button"
            >
              {timer > 0 ? (
                <Text style={[font.small, { color: t.textMuted }]}>
                  Resend code in {formatTimer(timer)}
                </Text>
              ) : (
                <View style={styles.resendRow}>
                  <RotateCcw size={15} color={t.brand} />
                  <Text
                    style={[
                      font.small,
                      { color: t.brand, fontWeight: '700', marginLeft: 6 },
                    ]}
                  >
                    {loader ? 'Sending...' : 'Resend code'}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </Scroller>
    </KeyboardAvoidingView>
  );
};

export default OtpScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: spacing.xxl },
  formWrap: { paddingHorizontal: spacing.lg, marginTop: -36 },
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
  validity: { textAlign: 'center', marginTop: spacing.lg },
  resend: { marginTop: spacing.lg, alignItems: 'center', paddingVertical: 4 },
  resendRow: { flexDirection: 'row', alignItems: 'center' },
});
