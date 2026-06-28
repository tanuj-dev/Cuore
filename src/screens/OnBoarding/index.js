import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  Modal,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import EncryptedStorage from 'react-native-encrypted-storage';

import { Images, hp, wp } from '../../utilities';
import OnBoarding2 from '../../components/OnBoardingOne';
import OnBoardingThree from '../../components/OnBoardingThree';
import OnBoardingFour from '../../components/OnBoardingFour';
import OnBoardingFive from '../../components/OnBoardingFive';
import OnBoardingSix from '../../components/OnBoardingSix';
import OnBoardingSeven from '../../components/OnBoardingSeven';
import images from '../../utilities/Images';
import { submitOnboarding } from '../../redux/OnBoardng/onBoardingThunk';
import { createReassessment } from '../../redux/OnBoardng/onBoardingThunk';
import { getOnboardingThunk } from '../../redux/slices';
import { setUserData } from '../../redux/Auth/slice';
import Toast from '../../components/Toast';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const OnBoarding = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();
  const { STEP, screen, navigateTo } = route?.params ?? {};
  const isReassess = screen === 'Reassess';

  console.log('OnBoarding Screen Params:', route?.params);

  // Local state
  // Open directly on the requested section (edit/reassess deep-link) instead of
  // flashing step 1 first. The effect below also re-syncs if params change.
  const [step, setStep] = useState(() =>
    typeof STEP === 'number' && STEP >= 1 && STEP <= 7 ? STEP : 1,
  );
  const [onboarding2Data, setOnboarding2Data] = useState({});
  const [onboarding3Data, setOnboarding3Data] = useState({});
  const [onboarding4Data, setOnboarding4Data] = useState({});
  const [onboarding5Data, setOnboarding5Data] = useState({});
  const [onboarding6Data, setOnboarding6Data] = useState({});
  const [onboarding7Data, setOnboarding7Data] = useState({});
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef(null);
  const scrollYRef = useRef(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // When keyboard opens, scroll up so focused input stays visible
  useEffect(() => {
    if (keyboardHeight > 0 && scrollRef.current) {
      const delay = Platform.OS === 'ios' ? 150 : 400;
      const timer = setTimeout(() => {
        const newY = Math.min(scrollYRef.current + keyboardHeight * 0.4, 99999);
        scrollRef.current?.scrollTo?.({ y: newY, animated: true });
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [keyboardHeight]);

  console.log('OnBoarding Component State:', {
    // step,
    // onboarding2Data,
    onboarding3Data,
    //   onboarding4Data,
    //   onboarding5Data,
    //   onboarding6Data,
    //   onboarding7Data,
  });

  // Validate required fields for each step
  const validateStepData = step => {
    switch (step) {
      case 2:
        return (
          onboarding2Data?.age &&
          onboarding2Data?.height_cm &&
          onboarding2Data?.weight_kg &&
          onboarding2Data?.waist_cm &&
          onboarding2Data?.gender
        );

      case 4:
        return onboarding4Data?.smoking && onboarding4Data?.alcohol;

      case 5:
        return (
          onboarding5Data?.min_exercise_per_week &&
          onboarding5Data?.preferred_ex_time &&
          onboarding5Data?.rest_day &&
          onboarding5Data?.eating_preference &&
          onboarding5Data?.fruits_veg &&
          onboarding5Data?.processed_food &&
          onboarding5Data?.high_fiber
        );

      case 6:
        return (
          onboarding6Data?.sleep_hours &&
          onboarding6Data?.wake_time &&
          onboarding6Data?.problems_overwhelming &&
          onboarding6Data?.enjoyable &&
          onboarding6Data?.felt_nervous
        );

      default:
        return true;
    }
  };

  // Set step from params when screen mounts
  useEffect(() => {
    if (STEP && typeof STEP === 'number') {
      setStep(STEP);
    }
  }, [STEP]);

  // Scroll to top on step change
  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Handle next button press
  const handleNext = async () => {
    if (!validateStepData(step)) {
      setShowValidationModal(true);
      return;
    }

    if (step < 7) {
      setStep(prev => prev + 1);
      scrollToTop();

      if (step === 2) console.log('Step 2 Data:', onboarding2Data);
      if (step === 3) console.log('Step 3 Data:', onboarding3Data);
      if (step === 4) console.log('Step 4 Data:', onboarding4Data);
      if (step === 5) console.log('Step 5 Data:', onboarding5Data);
      if (step === 6) console.log('Step 6 Data:', onboarding6Data);
      return;
    }

    // Step 7 submission

    const finalPayload = {
      o2Data: onboarding2Data,
      o3Data: onboarding3Data,
      o4Data: onboarding4Data,
      o5Data: onboarding5Data,
      o6Data: onboarding6Data,
      o7Data: onboarding7Data,
      isonboarding_complete: true,
    };

    console.log('Final Onboarding Payload:', finalPayload);

    try {
      setLoading(true);
      const res =
        screen === 'Reassess'
          ? await dispatch(createReassessment(finalPayload)).unwrap()
          : await dispatch(submitOnboarding(finalPayload)).unwrap();
      console.log('Dispatch Result:', res);

      // setToast({message: 'Onboarding data submitted successfully!', type: 'error'});
      setLoading(false);
      if (res?.error) {
        setToast({
          message:
            res?.error ||
            'There was an error submitting your data. Please try again.',
          type: 'error',
        });
      }
      // The submit endpoint returns { status: 'success' }, but the reassessment
      // PUT body isn't guaranteed to carry that field. For reassess, treat the
      // absence of an explicit error as success so the save reliably completes
      // instead of silently stranding the user inside onboarding.
      const isSuccess =
        res?.status === 'success' || (isReassess && !res?.error);
      if (isSuccess) {
        setToast({
          message: isReassess
            ? 'Your details have been updated!'
            : 'Onboarding data submitted successfully!',
          type: 'success',
        });
        // Alert.alert('Success', 'Onboarding data submitted successfully!');
        setLoading(false);
        await EncryptedStorage.setItem(
          'onboardingData',
          JSON.stringify(finalPayload),
        );
        if (screen !== 'Reassess') {
          try {
            const tokenData = await EncryptedStorage.getItem('auth_tokens');
            if (tokenData) {
              const parsed = JSON.parse(tokenData);
              const explicitFalse =
                res?.isonboarding_complete === false ||
                res?.isonboarding_complete === 'false';
              const explicitTrue =
                res?.isonboarding_complete === true ||
                res?.isonboarding_complete === 'true';
              const isOnboardingDone =
                explicitTrue ||
                (!explicitFalse && res?.isonboarding_complete == null);

              const updated = {
                ...parsed,
                isonboarding_complete: isOnboardingDone,
                onboardingStatus: isOnboardingDone
                  ? 'complete'
                  : parsed.onboardingStatus,
              };
              await EncryptedStorage.setItem(
                'auth_tokens',
                JSON.stringify(updated),
              );
              dispatch(
                setUserData({
                  accessToken: updated.accessToken,
                  refreshToken: updated.refreshToken,
                  userId: updated.userId,
                  expiresIn: updated.expiresIn,
                  newUser: updated.newUser,
                  role: updated.role,
                  paymentStatus: updated.paymentStatus,
                  onboardingStatus: updated.onboardingStatus,
                  isFree: updated.isFree,
                  month: updated.month,
                }),
              );
            }
          } catch (e) {
            console.warn('[OnBoarding] persist onboarding status:', e?.message);
          }
        }
        console.log('Onboarding data saved successfully');

        if (isReassess) {
          // Reassess: return the user to the screen they launched the edit from
          // (e.g. Trend), instead of Score/Home. goBack pops this onboarding
          // screen off the stack; fall back to Home if there is no back stack
          // (e.g. opened from a deep link).
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          }
        } else {
          navigation.navigate('Score', {
            screen: 'Score',
            navigateTo: navigateTo ?? 'Home',
          });
        }
      } else if (res?.payload?.error) {
        setLoading(false);
        alert('Submission Error', res.payload.error);
      }
    } catch (error) {
      setLoading(false);
      alert(
        'Submission Error',
        'There was an error submitting your data. Please try again.',
      );
      console.error('Error saving onboarding data:', error);
    }
  };

  // Step 7 data handler
  const handleOnboarding7Change = useCallback(data => {
    setOnboarding7Data(data);
  }, []);

  // Back button
  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const onBoardingData = useSelector(
    state => state?.onboardingdata?.data ?? {},
  );

  const handleValidationError = (fieldKey, message) => {
    console.log(`Validation error in ${fieldKey}: ${message}`);

    // You can show a toast, set a global error, or disable submission
  };

  useEffect(() => {
    dispatch(getOnboardingThunk());
  }, []);

  const handleFormChange = incomingData => {
    setOnboarding3Data(prev => ({
      ...prev,
      ...incomingData,
    }));
  };

  const scrollContentStyle = {
    flexGrow: 1,
    paddingBottom: hp(4) + keyboardHeight,
  };

  return (
    <>
      {AlertComponent}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.container}
          contentContainerStyle={scrollContentStyle}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          onScroll={e => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={100}
        >
          {/* Header */}
          {step === 1 ? (
            <Image source={Images.APP_LOGO} style={styles.logo} />
          ) : (
            <TouchableOpacity
              onPress={handleBack}
              style={{ marginTop: Platform.OS === 'ios' && hp(3) }}
            >
              <Image
                source={Images.BACK_BUTTON}
                style={{ resizeMode: 'contain', height: hp(3.5), width: wp(4) }}
              />
            </TouchableOpacity>
          )}

          {/* Banner */}
          <View style={{ backgroundColor: 'white' }}>
            <Image source={Images[`ON_BOARD${step}`]} style={styles.banner} />
          </View>

          {/* Titles */}
          {step === 1 && (
            <>
              <Text style={styles.title}>Welcome to Cuore!</Text>
              <Text style={styles.subtitle}>Your everyday health companion</Text>
            </>
          )}
          {step === 2 && <Text style={styles.title}>Basic Information</Text>}
          {step === 3 && <Text style={styles.title}>Health History</Text>}
          {step === 4 && <Text style={styles.title}>Lifestyle</Text>}
          {step === 5 && (
            <Text style={styles.title}>Exercise & Eating Preferences</Text>
          )}
          {step === 6 && <Text style={styles.title}>Sleep & Stress</Text>}
          {step === 7 && <Text style={styles.title}>Health Readings</Text>}

          {/* Descriptions */}
          {step === 1 && (
            <Text style={styles.helpText}>
              Help us guide you better—share your health and wellness history
            </Text>
          )}
          {step === 2 && (
            <Text style={styles.helpText}>Fill in your details below:</Text>
          )}
          {step === 3 && (
            <Text style={styles.helpText}>
              Please select details about your family’s health, history, or
              symptoms you’ve experienced.
            </Text>
          )}
          {step === 4 && (
            <Text style={styles.helpText}>
              Your lifestyle choices significantly impact your overall health.
            </Text>
          )}
          {step === 5 && (
            <Text style={styles.helpText}>
              Let’s explore your exercise & eating preference for tailored
              recommendations.
            </Text>
          )}
          {step === 6 && (
            <Text style={styles.helpText}>
              Sleep and stress play a major role in cardio-metabolic health.
            </Text>
          )}
          {step === 7 && (
            <View style={styles.warningBox}>
              <Image
                source={images.NOTICE}
                style={{
                  height: hp(2),
                  width: hp(2),
                  resizeMode: 'contain',
                  marginTop: hp(3),
                  marginRight: hp(1),
                }}
              />
              <View style={{ paddingHorizontal: hp(2) }}>
                <Text
                  style={{
                    fontSize: 16,
                    color: '#475569',
                    fontFamily: 'Poppins-Medium',
                    letterSpacing: 0.2,
                    marginBottom: hp(0.5),
                  }}
                >
                  For awareness and tracking only
                </Text>
                <Text style={styles.warningText}>
                  If some readings aren’t available right now, you can update them
                  later in ‘Today’
                </Text>
              </View>
            </View>
          )}

          {/* Step Indicator */}
          <View style={styles.stepRow}>
            <Text style={styles.stepText}>{`${step} of 7`}</Text>
          </View>
          <ProgressBar
            progress={step / 7}
            color="#11418A"
            style={styles.progress}
          />

          {/* Step Components */}
          {step === 1 && (
            <>
              <View style={styles.disclaimerBox}>
                <Image source={Images.WARNING} style={styles.disclaimerBoxIcon} />
                <Text style={styles.disclaimerBoxText}>
                  Cuore is a wellness support tool designed to help you track
                  fitness, nutrition, sleep, stress, and health records. It is
                  intended for awareness and continuity only. Cuore does not
                  provide medical advice, diagnosis, or treatment. AI-assisted
                  summaries help organize uploaded records and may contain
                  inaccuracies. Please verify important details with your original
                  reports. For medical decisions or concerns, consult your
                  healthcare professional.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.disclaimerCheckRow}
                onPress={() => setDisclaimerAccepted(prev => !prev)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.disclaimerCheckbox,
                    disclaimerAccepted && styles.disclaimerCheckboxChecked,
                  ]}
                >
                  {disclaimerAccepted ? (
                    <Text style={styles.disclaimerCheckmark}>✓</Text>
                  ) : null}
                </View>
                <Text style={styles.disclaimerCheckLabel}>
                  I understand & Accept
                </Text>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <OnBoarding2
              initialData={
                screen !== 'Reassess'
                  ? onboarding2Data
                  : onBoardingData?.data?.o2Data
              }
              onFormChange={setOnboarding2Data}
            />
          )}

          {step === 3 && (
            <OnBoardingThree
              initialData={
                screen !== 'Reassess'
                  ? onboarding3Data
                  : onBoardingData?.data?.o3Data
              }
              onFormChange={handleFormChange}
            />
          )}
          {step === 4 && (
            <OnBoardingFour
              initialData={
                screen !== 'Reassess'
                  ? onboarding4Data
                  : onBoardingData?.data?.o4Data
              }
              onFormChange={setOnboarding4Data}
            />
          )}

          {step === 5 && (
            <OnBoardingFive
              initialData={
                screen !== 'Reassess'
                  ? onboarding5Data
                  : onBoardingData?.data?.o5Data
              }
              onFormChange={data => {
                setOnboarding5Data(prev =>
                  JSON.stringify(prev) === JSON.stringify(data) ? prev : data,
                );
              }}
            />
          )}

          {step === 6 && (
            <OnBoardingSix
              initialData={
                screen !== 'Reassess'
                  ? onboarding6Data
                  : onBoardingData?.data?.o6Data
              }
              onFormChange={data => {
                setOnboarding6Data(prev =>
                  JSON.stringify(prev) === JSON.stringify(data) ? prev : data,
                );
              }}
            />
          )}

          {step === 7 && (
            <OnBoardingSeven
              initialData={
                screen !== 'Reassess'
                  ? onboarding7Data
                  : onBoardingData?.data?.o7Data
              }
              onFormChange={handleOnboarding7Change}
            />
          )}

          {/* Button */}

          <TouchableOpacity
            style={[
              styles.button,
              step === 1 && !disclaimerAccepted && styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={step === 1 && !disclaimerAccepted}
            activeOpacity={step === 1 && !disclaimerAccepted ? 1 : 0.8}
          >
            {step === 7 && loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={[
                  styles.buttonText,
                  step === 1 && !disclaimerAccepted && styles.buttonTextDisabled,
                ]}
              >
                {step === 7 ? 'Submit' : step === 1 ? 'Start' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Validation Modal */}
          <Modal
            visible={showValidationModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowValidationModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles?.modalTitle}>Incomplete</Text>
                <Text style={styles?.modalMessage}>
                  {screen === 'Reassess'
                    ? 'Please confirm your Gender.'
                    : 'Please fill all the required details before continuing.'}
                </Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowValidationModal(false)}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onHide={() => setToast(null)}
              top={700}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default OnBoarding;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(5),
    backgroundColor: '#FFFFFF',
  },
  logo: {
    marginTop: Platform.OS === 'ios' ? hp(4) : hp(2),
    width: wp(25),
    height: hp(4),
    resizeMode: 'contain',
    marginBottom: hp(1.5),
  },
  banner: {
    width: '100%',
    height: hp(20),
    resizeMode: 'contain',
    marginVertical: hp(1.5),
    backgroundColor: 'transparent',
  },
  title: {
    fontFamily: 'Poppins-Medium',
    color: '#1E293B',
    fontSize: 22,
    marginTop: hp(1.5),
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    fontSize: 16,
    marginBottom: hp(1.5),
    letterSpacing: 0.2,
  },
  helpText: {
    fontFamily: 'Poppins-Regular',
    marginTop: hp(2),
    fontSize: 14,
    color: '#64748B',
    marginBottom: hp(1.5),
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  stepRow: {
    marginTop: hp(1.5),
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  stepText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#475569',
    letterSpacing: 0.2,
  },
  progress: {
    marginTop: hp(2),
    height: hp(1),
    borderRadius: 8,
    marginVertical: hp(1),
  },
  cardInfo: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: wp(4),
    borderRadius: 12,
    marginTop: hp(2),
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardIcon: {
    height: hp(2.5),
    width: wp(6),
    resizeMode: 'contain',
    marginRight: hp(1.5),
    marginTop: hp(0.5),
  },
  cardText: {
    fontFamily: 'Poppins-Regular',
    flex: 1,
    fontSize: 14,
    color: '#A16207',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEFCE8',
    borderWidth: 1.5,
    borderColor: '#FDE047',
    borderRadius: 12,
    padding: hp(2),
    marginTop: hp(0.5),
    marginBottom: hp(1),
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
    }),
  },
  disclaimerBoxIcon: {
    height: hp(2.5),
    width: wp(5),
    resizeMode: 'contain',
    marginRight: wp(3),
    marginTop: hp(0.2),
  },
  disclaimerBoxText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
    letterSpacing: 0.1,
    textAlign: 'justify',
  },
  disclaimer: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: hp(2.5),
    fontStyle: 'italic',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  disclaimerCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1.5),
  },
  disclaimerCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginRight: wp(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerCheckboxChecked: {
    backgroundColor: '#11418A',
    borderColor: '#11418A',
  },
  disclaimerCheckmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  disclaimerCheckLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#475569',
    letterSpacing: 0.2,
  },
  button: {
    marginBottom: hp(5),
    backgroundColor: '#11418A',
    paddingVertical: hp(2),
    borderRadius: 12,
    marginTop: hp(4),
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
  buttonText: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
  },
  buttonTextDisabled: {
    color: '#E2E8F0',
  },
  warningBox: {
    flexDirection: 'row',
    borderWidth: 1.5,
    marginTop: hp(1.5),
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE047',
    borderRadius: 12,
    padding: hp(2),
    marginBottom: hp(2),
  },
  warningText: {
    fontFamily: 'Poppins-Regular',
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  bottomText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Poppins-Regular',
    letterSpacing: 0.1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    padding: hp(3),
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  modalTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 20,
    color: '#1E293B',
    marginBottom: hp(1.5),
    letterSpacing: -0.3,
  },
  modalMessage: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: hp(2.5),
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  modalButton: {
    backgroundColor: '#11418A',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(8),
    borderRadius: 10,
  },
  modalButtonText: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
