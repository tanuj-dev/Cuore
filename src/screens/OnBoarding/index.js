import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
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
import Toast from '../../components/Toast';

const OnBoarding = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { STEP, screen, navigateTo } = route?.params ?? {};

  console.log('OnBoarding Screen Params:', route?.params);

  // Local state
  const [step, setStep] = useState(1);
  const [onboarding2Data, setOnboarding2Data] = useState({});
  const [onboarding3Data, setOnboarding3Data] = useState({});
  const [onboarding4Data, setOnboarding4Data] = useState({});
  const [onboarding5Data, setOnboarding5Data] = useState({});
  const [onboarding6Data, setOnboarding6Data] = useState({});
  const [onboarding7Data, setOnboarding7Data] = useState({});
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  console.log('OnBoarding Component State:', {
    // step,
    // onboarding2Data,
    onboarding3Data,
    //   onboarding4Data,
    //   onboarding5Data,
    //   onboarding6Data,
    //   onboarding7Data,
  });

  const scrollRef = useRef();

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
      if (res?.status === 'success') {
        setToast({
          message: 'Onboarding data submitted successfully!',
          type: 'success',
        });
        // Alert.alert('Success', 'Onboarding data submitted successfully!');
        setLoading(false);
        await EncryptedStorage.setItem(
          'onboardingData',
          JSON.stringify(finalPayload),
        );
        await EncryptedStorage.setItem('onboardingCompleted', 'true');
        console.log('Onboarding data saved successfully');

        navigation.navigate('Score', {
          screen: screen === 'Reassess' ? 'Reassess' : 'Score',
          navigateTo: navigateTo ?? 'Home',
        });
      } else if (res?.payload?.error) {
        setLoading(false);
        Alert.alert('Submission Error', res.payload.error);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert(
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollRef}
          style={styles.container}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
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
          {step === 7 && <Text style={styles.title}>Biomarkers</Text>}

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
              Sleep and stress play a major role in cardio-metabolic health, let’s
              understand how they impact you.
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
                    fontSize: hp(2),
                    color: '#4B5563',
                    fontFamily: 'Roboto-Regular',
                  }}
                >
                  Keep your biomarkers up to date{'\n'}
                </Text>
                <Text style={styles.warningText}>
                  If some biomarkers aren’t available right now, you can update
                  them later in ‘Today’
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
            color="#0A5FD8"
            style={styles.progress}
          />

          {/* Step Components */}
          {step === 1 && (
            <>
              <View style={styles.cardInfo}>
                <Image source={Images.NOTICE} style={styles.cardIcon} />
                <Text style={[styles.cardText, { color: '#4B5563' }]}>
                  Please have a weighing scale and measuring tape ready.
                </Text>
              </View>

              <View style={[styles.cardInfo, { backgroundColor: '#FBFAE5' }]}>
                <Image source={Images.WARNING} style={styles.cardIcon} />
                <Text style={styles.cardText}>
                  This plan is tailored for you — using it for others can impact
                  your recommendations.
                </Text>
              </View>

              <Text style={styles.disclaimer}>
                <Text style={{ fontWeight: 'bold' }}>Disclaimer:</Text> This
                assessment is not a substitute for professional medical advice.
                Always consult your doctor before beginning any new therapy or
                treatment.
              </Text>
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

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            {step === 7 && loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
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
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default OnBoarding;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: wp(5),
    backgroundColor: '#fff',
  },
  logo: {
    marginTop: Platform.OS == 'ios' && hp(4),
    width: wp(20),
    height: hp(3),
    resizeMode: 'contain',
    marginBottom: hp(1),
  },
  banner: {
    // elevation: 3,
    // borderBlockColor: 'red',
    width: '100%',
    height: hp(20),
    resizeMode: 'contain',
    marginVertical: hp(1),
    // borderWidth: 2,
    // ensure no border bordexrColor: 'white',
    // just in case
    backgroundColor: 'transparent', // avoid dark background peeking
  },
  title: {
    fontFamily: 'Roboto-Regular',
    color: '#111827',
    fontSize: wp(5.5),
    fontWeight: '450',
    marginTop: hp(1),
  },
  subtitle: {
    fontFamily: 'Roboto-Regular',
    color: '#111827',
    fontSize: wp(5.5),
    fontWeight: '450',
    marginBottom: hp(1),
  },
  helpText: {
    fontFamily: 'Roboto-Regular',
    marginTop: hp(2),
    fontSize: wp(3.5),
    color: '#111827',
    marginBottom: hp(1),
  },
  stepRow: {
    marginTop: hp(1),
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  stepText: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.5),
    color: '#111827',
  },
  progress: {
    marginTop: hp(2),
    height: hp(1),
    borderRadius: wp(2),
    marginVertical: hp(1),
  },
  cardInfo: {
    flexDirection: 'row',
    // alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: wp(3),
    borderRadius: wp(2),
    marginTop: hp(2),
    alignItems: 'flex-start',
  },
  cardIcon: {
    height: hp(2),
    width: wp(5),
    resizeMode: 'contain',
    marginRight: hp(1),
    marginTop: hp(1),
    // marginLeft: wp(-4),
  },
  cardText: {
    fontFamily: 'Roboto-Regular',
    flex: 1,
    fontSize: wp(3.5),
    color: '#A16207',
  },
  disclaimer: {
    fontSize: wp(3),
    color: '#6B7280',
    marginTop: hp(2),
    fontStyle: 'italic',
  },
  button: {
    marginBottom: hp(5),
    backgroundColor: '#1E64AC',
    paddingVertical: hp(1.5),
    borderRadius: wp(1),
    marginTop: hp(4),
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Roboto-Regular',
    color: '#fff',
    fontSize: wp(4),
  },
  warningBox: {
    flexDirection: 'row',
    borderWidth: 2,
    marginTop: hp(1),
    backgroundColor: '#FFF8DC',
    // borderLeftWidth: 4,
    borderColor: '#FEF08A',
    borderRadius: hp(1),
    padding: 12,
    marginBottom: 20,
  },
  warningText: {
    fontFamily: 'Roboto-Regular',
    color: '#333',
    fontSize: 14,
  },
  bottomText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    fontFamily: 'Roboto-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
