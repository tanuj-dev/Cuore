import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useCallback } from 'react';
import { ProgressBar } from 'react-native-paper';
import { Images, hp, wp } from '../../utilities';
import OnBoarding2 from '../../components/OnBoardingOne';
import OnBoardingThree from '../../components/OnBoardingThree';
import OnBoardingFour from '../../components/OnBoardingFour';
import OnBoardingFive from '../../components/OnBoardingFive';
import OnBoardingSix from '../../components/OnBoardingSix';
import OnBoardingSeven from '../../components/OnBoardingSeven';
import images from '../../utilities/Images';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import EncryptedStorage from 'react-native-encrypted-storage';
import { submitOnboarding } from '../../redux/OnBoardng/onBoardingThunk';

const OnBoarding = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { STEP } = route.params ?? {}; // fallback in case params are missing
  const [step, setStep] = useState(1);

  const [onboarding2Data, setOnboarding2Data] = useState({});
  const [onboarding3Data, setOnboarding3Data] = useState({});
  const [onboarding4Data, setOnboarding4Data] = useState({});
  const [onboarding5Data, setOnboarding5Data] = useState({});
  const [onboarding6Data, setOnboarding6Data] = useState({});
  const [onboarding7Data, setOnboarding7Data] = useState({});
  const [showValidationModal, setShowValidationModal] = useState(false);

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

  const handleNext = async () => {
    if (!validateStepData(step)) {
      setShowValidationModal(true);
      return;
    }

    if (step < 7) {
      setStep(prev => prev + 1);
      scrollToTop();

      if (step === 2) console.log('Onboarding Step 2 Data:', onboarding2Data);
      if (step === 3) console.log('Onboarding Step 3 Data:', onboarding3Data);
      if (step === 4) console.log('Onboarding Step 4 Data:', onboarding4Data);
      if (step === 5) console.log('Onboarding Step 5 Data:', onboarding5Data);
      if (step === 6) console.log('Onboarding Step 6 Data:', onboarding6Data);
    } else {
      console.log('Onboarding Step 7 Data:', onboarding7Data);

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
        const res = await dispatch(submitOnboarding(finalPayload));
        console.log('Dispatch Result:', res);

        if (res && res.payload.status === 'success') {
          console.log('OnBoarding2 Response:', res);
          await EncryptedStorage.setItem(
            'onboardingData',
            JSON.stringify(finalPayload),
          );
          await EncryptedStorage.setItem('onboardingCompleted', 'true');
          console.log('Onboarding data saved successfully');
          console.log(
            'Retrieved Onboarding Data:',
            JSON.parse(await EncryptedStorage.getItem('onboardingData')),
          );
          navigation.navigate('Score');
        } else {
          // navigation.navigate('Score');
        }
      } catch (error) {
        Alert.alert(
          'Submission Error',
          'There was an error submitting your data. Please try again.',
        );

        console.error('Error saving onboarding data:', error);
      }
    }
  };

  const handleOnboarding7Change = useCallback(data => {
    setOnboarding7Data(data);
    // console.log('OnBoarding7 Data:', data);
  }, []);

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const scrollRef = useRef();

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
  };

  return (
    <>
      <ScrollView ref={scrollRef} style={styles.container}>
        {/* Logo */}
        {step == 1 ? (
          <Image source={Images.APP_LOGO} style={styles.logo} />
        ) : (
          <TouchableOpacity
            onPress={handleBack}
            style={{ marginTop: Platform.OS == 'ios' && hp(3) }}
          >
            <Image
              source={Images.BACK_BUTTON} // Replace with actual key in your `images` object
              style={{ resizeMode: 'contain', height: hp(3.5), width: wp(4) }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}

        {/* Main Banner */}
        <View style={{ backgroundColor: 'white' }}>
          <Image source={Images[`ON_BOARD${step}`]} style={styles.banner} />
        </View>

        {/* Headings */}
        {step == 1 && (
          <View>
            <Text style={styles.title}>Welcome to Cuore!</Text>
            <Text style={styles.subtitle}>Your everyday health companion</Text>
          </View>
        )}
        {step == 2 && (
          <View>
            <Text style={styles.title}>Basic Information</Text>
          </View>
        )}
        {step == 3 && <Text style={styles.title}>Health History</Text>}
        {step == 4 && <Text style={styles.title}>Lifestyle</Text>}
        {step == 5 && (
          <Text style={styles.title}>Exercise & Eating Preferences</Text>
        )}
        {step == 6 && <Text style={styles.title}>Sleep & Stress</Text>}
        {step == 7 && <Text style={styles.title}>Biomarkers</Text>}

        {step == 1 && (
          <Text style={styles.helpText}>
            Help us guide you better—share your health and wellness history
          </Text>
        )}
        {step == 2 && (
          <Text style={styles.helpText}>Fill in your details below:</Text>
        )}

        {step == 3 && (
          <Text style={styles.helpText}>
            Please select details about your family’s health, history, or
            symptoms you’ve experienced.
          </Text>
        )}
        {step == 4 && (
          <Text style={styles.helpText}>
            Your lifestyle choices significantly impact your overall health.
          </Text>
        )}
        {step == 5 && (
          <Text style={styles.helpText}>
            Let’s explore your exercise & eating preference for tailored
            recommendations.
          </Text>
        )}
        {step == 6 && (
          <Text style={styles.helpText}>
            Sleep and stress play a major role in cardio-metabolic health, let’s
            understand how they impact you.
          </Text>
        )}
        {step == 7 && (
          <View style={styles.warningBox}>
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: hp(1),
                marginTop: hp(3),
              }}
            >
              <Image
                style={{ resizeMode: 'contain', height: hp(2), width: hp(2) }}
                source={images.NOTICE}
              />
            </View>
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

        {/* Info Cards */}
        {step == 1 && (
          <View>
            <View style={styles.cardInfo}>
              <Image source={Images.NOTICE} style={[styles.cardIcon]}></Image>
              <Text style={[styles.cardText, { color: '4B5563' }]}>
                Please have a weighing scale and measuring tape ready.
              </Text>
            </View>

            <View style={[styles.cardInfo, { backgroundColor: '#FBFAE5' }]}>
              <Image source={Images.WARNING} style={[styles.cardIcon]}></Image>
              <Text style={styles.cardText}>
                This plan is tailored for you — using it for others can impact
                your recommendations
              </Text>
            </View>

            {/* Disclaimer */}
            <Text style={styles.disclaimer}>
              <Text style={{ fontWeight: 'bold' }}>Disclaimer:</Text> This
              assessment is not a substitute for professional medical advice.
              Always consult your doctor before beginning any new therapy or
              treatment.
            </Text>
          </View>
        )}

        {step == 2 && (
          <OnBoarding2
            initialData={onboarding2Data}
            onFormChange={setOnboarding2Data}
          ></OnBoarding2>
        )}
        {step == 3 && (
          <OnBoardingThree
            initialData={onboarding3Data}
            onFormChange={setOnboarding3Data}
          ></OnBoardingThree>
        )}
        {step == 4 && (
          <OnBoardingFour
            initialData={onboarding4Data}
            onFormChange={setOnboarding4Data}
          ></OnBoardingFour>
        )}
        {step == 5 && (
          <OnBoardingFive
            initialData={onboarding5Data}
            onFormChange={data => {
              // ✅ Only update if data actually changed
              setOnboarding5Data(prev => {
                if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
                return data;
              });
            }}
          />
        )}
        {step == 6 && (
          <OnBoardingSix
            initialData={onboarding6Data}
            onFormChange={data => {
              setOnboarding6Data(prev => {
                if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
                return data;
              });
            }}
          />
        )}
        {step == 7 && (
          <OnBoardingSeven
            initialData={onboarding7Data}
            onFormChange={handleOnboarding7Change}
          />
        )}

        {/* Start Button */}
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {step == 7 ? 'Submit' : step == 1 ? ' Start' : 'Next'}
          </Text>
        </TouchableOpacity>
        <Modal
          visible={showValidationModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowValidationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Incomplete</Text>
              <Text style={styles.modalMessage}>
                Please fill all the details before continuing.
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
      </ScrollView>
    </>
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
    // elevation: 3, // borderBlockColor: 'red',
    width: '100%',
    height: hp(20),
    resizeMode: 'contain',
    marginVertical: hp(1),
    // borderWidth: 2, // ensure no border
    bordexrColor: 'white', // just in case
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
  warningText: { fontFamily: 'Roboto-Regular', color: '#333', fontSize: 14 },
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
