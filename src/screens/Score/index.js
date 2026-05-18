import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import EncryptedStorage from 'react-native-encrypted-storage';
import { hp, wp, Images } from '../../utilities';
import { CLINICAL_REFERENCES_LABEL } from '../../utilities/Constants';
import { Info } from 'lucide-react-native';

const MEDICAL_REFERENCES = [
  {
    intro:
      "Cuore's score, trend summaries, and lifestyle guidance are formed by widely cited public health guidance and cardiometabolic research. The sources below support the general guideline ranges and health recommendations referenced within the app.",
  },
  {
    section: 'Body Mass Index (BMI) Classification',
    links: [
      { title: 'CDC – About BMI', url: 'https://www.cdc.gov/bmi' },
      {
        title: 'NIH – BMI Classification',
        url: 'https://www.nhlbi.nih.gov/health/educational/lose_wt/BMI/bmi_tbl.htm',
      },
    ],
    note: '(BMI categories are general population references. Individual risk interpretation may vary.)',
  },
  {
    section: 'Calorie & Energy Balance Estimation',
    links: [
      {
        title:
          'National Institutes of Health (NHLBI) – Healthy Weight & Energy Balance',
        url: 'https://www.nhlbi.nih.gov/health/educational/lose_wt',
      },
    ],
    note: '(Calorie guidance is derived from standard resting metabolic rate and energy balance estimation methods.)',
  },
  {
    section: 'Physical Activity Guidance',
    links: [
      {
        title: 'American Heart Association – Physical Activity Recommendations',
        url: 'https://www.heart.org/en/healthy-living/fitness/fitness-basics/aha-recs-for-physical-activity-in-adults',
      },
    ],
  },
  {
    section: 'Blood Pressure Classification & Risk Context',
    links: [
      {
        title: 'American Heart Association – High Blood Pressure',
        url: 'https://www.heart.org/en/health-topics/high-blood-pressure',
      },
    ],
  },
  {
    section: 'Blood Glucose & Diabetes Risk Context',
    links: [
      {
        title: 'American Diabetes Association – Diagnosis',
        url: 'https://diabetes.org/about-diabetes/diagnosis',
      },
    ],
  },
  {
    section: 'Lipid & Cardiovascular Risk Context',
    links: [
      {
        title: 'American Heart Association – Cholesterol Overview',
        url: 'https://www.heart.org/en/health-topics/cholesterol',
      },
    ],
    note: '(Lipid markers, including triglycerides and HDL cholesterol, are interpreted within broader cardiovascular risk context. Cuore presents lipid values for awareness and longitudinal trend tracking rather than diagnostic classification.)',
  },
  {
    section: 'Longitudinal Cardiometabolic Research',
    links: [
      {
        title: 'Framingham Heart Study',
        url: 'https://framinghamheartstudy.org',
      },
    ],
    note: "(Cuore's trend summaries and projections reflect general population research examining associations between lifestyle factors and cardiometabolic risk.)",
  },
  {
    section: 'About Metabolic Age & Body Composition',
    note: 'Cuore\'s comparative "metabolic age" and body composition summaries are derived from established population-based cardiometabolic risk modeling concepts and are intended for awareness and engagement purposes only.',
  },
  {
    section: 'How Cuore Uses These References',
    note: 'Cuore organizes user-provided health data and provides general public health context for awareness. Trend projections reflect general population research patterns and are not medical predictions. Cuore does not diagnose, treat, prescribe, or replace medical advice. All scores and projections are informational and should be interpreted in consultation with a qualified healthcare professional.',
  },
];
import { useSelector, useDispatch } from 'react-redux';
import { getCuoreScoreThunk, getOnboardingThunk } from '../../redux/slices';
import { shareData } from '../../redux/slices';
import GaugeMeter from '../../components/SpeedpMeter';
import Loader from '../../components/Loader';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const Score = ({ navigation }) => {
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();

  // Combine selectors for better performance
  const { userId, role } = useSelector(state => ({
    userId: state.auth?.userId,
    role: state.auth?.role,
  }));

  const { loading, health_metrics, date } = useSelector(state => ({
    loading: state.cuoreScore?.loading,
    health_metrics: state.cuoreScore?.data?.health_metrics,
    date: state.cuoreScore?.data?.current_date,
  }));

  const hasDiabetes = useSelector(
    state => state.onboardingdata?.data?.data?.o3Data?.hasDiabetes,
  );
  const paymentStatus = useSelector(state => state.auth?.paymentStatus);
  const isFreeFlag = useSelector(state => state.auth?.isFree);
  const viewShotRef = useRef(null);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [showReferencesModal, setShowReferencesModal] = useState(false);
  const [showWebViewModal, setShowWebViewModal] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [webViewLoading, setWebViewLoading] = useState(false);

  // Memoize vitals conversion
  const convertVitalsToArray = useCallback(vitals => {
    if (!vitals) return [];

    const result = [];

    if (vitals.blood_pressure) {
      result.push({
        label: 'Resting BP',
        value: vitals.blood_pressure.current,
        target: vitals.blood_pressure.target,
        status: vitals.blood_pressure.status?.lower,
      });
    }

    if (vitals.blood_sugar) {
      if (vitals.blood_sugar.fasting) {
        result.push({
          label: 'Blood Sugar (Fasting)',
          value: vitals.blood_sugar.fasting.value,
          target: vitals.blood_sugar.fasting.target,
          status: vitals.blood_sugar.fasting.status,
        });
      }
      if (vitals.blood_sugar.after_meal) {
        result.push({
          label: 'Blood Sugar (After Meal)',
          value: vitals.blood_sugar.after_meal.value,
          target: vitals.blood_sugar.after_meal.target || '—',
          status: vitals.blood_sugar.after_meal.status,
        });
      }
      if (vitals.blood_sugar.A1C) {
        result.push({
          label: 'A1C',
          value: vitals.blood_sugar.A1C.value,
          target: vitals.blood_sugar.A1C.target,
          status: vitals.blood_sugar.A1C.status,
        });
      }
    }

    if (vitals.body_fat) {
      result.push({
        label: 'Body Fat',
        value: `${vitals.body_fat.value}${vitals.body_fat.unit || ''}`,
        target: `${vitals.body_fat.target}${vitals.body_fat.unit || ''}`,
        status: vitals.body_fat.status,
      });
    }

    if (vitals.cholesterol?.tg_hdl_ratio) {
      result.push({
        label: 'Cholesterol (TG/HDL)',
        value: vitals.cholesterol.tg_hdl_ratio.value,
        target: vitals.cholesterol.tg_hdl_ratio.target,
        status: vitals.cholesterol.tg_hdl_ratio.status,
      });
    }

    return result;
  }, []);

  // Memoize filtered vitals
  const filteredVitals = useMemo(() => {
    const vitals = convertVitalsToArray(health_metrics?.vitals);
    return vitals.filter(
      item =>
        item.value !== undefined && item.value !== null && item.value !== '',
    );
  }, [health_metrics?.vitals, convertVitalsToArray]);

  const handleShareScreenshot = useCallback(async () => {
    try {
      setSharingLoading(true);
      const payload = {
        page: 'CUORE_SCORE',
      };

      const response = await dispatch(shareData(payload));

      // Check if response is successful and contains PDF data
      if (
        response.payload &&
        response.payload.success &&
        response.payload.data
      ) {
        const pdfData = response.payload.data;

        // Determine if pdfData is a URL string or an object with URL
        let pdfUrl;
        if (typeof pdfData === 'string') {
          pdfUrl = pdfData;
        } else if (pdfData.url) {
          pdfUrl = pdfData.url;
        } else if (pdfData.file) {
          pdfUrl = pdfData.file;
        } else {
          pdfUrl = pdfData;
        }

        const shareOptions = {
          title: 'Cuore Score',
          message: 'Check out my Cuore Score!',
          url: pdfUrl,
          type: 'application/pdf',
        };

        await Share.open(shareOptions);
      } else {
        alert('Error', 'Failed to generate PDF for sharing');
      }
    } catch (error) {
      // User cancelled sharing - don't show error
      if (error.message !== 'User did not share') {
        alert('Error', 'Failed to share PDF');
      }
    } finally {
      setSharingLoading(false);
    }
  }, [dispatch, alert]);

  useEffect(() => {
    if (userId) {
      dispatch(getCuoreScoreThunk(userId));
      dispatch(getOnboardingThunk());
    }
  }, [dispatch, userId]);

  const handleRefresh = useCallback(() => {
    if (userId) {
      dispatch(getCuoreScoreThunk(userId));
    }
  }, [dispatch, userId]);

  const handleContinue = useCallback(async () => {
    let status = paymentStatus;
    let isFreeUser = Boolean(isFreeFlag);
    try {
      const tokenData = await EncryptedStorage.getItem('auth_tokens');
      if (tokenData) {
        const parsed = JSON.parse(tokenData);
        if (status == null) status = parsed.paymentStatus;
        if (!isFreeUser) {
          isFreeUser =
            parsed.isFree === true ||
            parsed.isFree === 'true' ||
            parsed.is_free === true;
        }
      }
    } catch (_) {}

    console.log(
      'Score: handleContinue paymentStatus:',
      status,
      'isFree:',
      isFreeUser,
    );
    if (status === 'completed' || status === 'waived' || isFreeUser) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Checkout' }],
      });
    }
  }, [navigation, paymentStatus, isFreeFlag]);

  const handleReassess = useCallback(() => {
    navigation.navigate('OnBoarding', {
      STEP: 2,
      screen: 'Reassess',
    });
  }, [navigation]);

  // if (health_metrics == undefined) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //       <Image
  //         source={Images.ERROR_ICON}
  //         style={{ height: hp(10), width: hp(10) }}
  //       />
  //       <Text style={{ fontSize: 16, color: '#DC2626', marginTop: hp(2) }}>
  //         Something went wrong
  //       </Text>
  //       <Text
  //         style={{
  //           fontSize: 14,
  //           color: '#6B7280',
  //           textAlign: 'center',
  //           marginTop: hp(1),
  //           paddingHorizontal: wp(10),
  //         }}
  //       >
  //         We couldn’t load your data. Please check your internet connection or
  //         try again later.
  //       </Text>
  //       <TouchableOpacity
  //         // onPress={dispatch(getCuoreScoreThunk(user_Id))}
  //         style={{
  //           marginTop: hp(3),
  //           backgroundColor: '#1E64AC',
  //           paddingHorizontal: wp(6),
  //           paddingVertical: hp(1.5),
  //           borderRadius: hp(1),
  //         }}
  //       >
  //         <Text style={{ color: '#fff', fontWeight: '500' }}>Retry</Text>
  //       </TouchableOpacity>
  //     </View>
  //   );
  // }

  const profileImage = useSelector(
    state =>
      state?.profile?.data?.data?.user?.photo_url ||
      state?.profile?.data?.data?.user?.photoUrl,
  );
  const profileImageSource = profileImage
    ? { uri: profileImage }
    : Images.UNCLE;

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      {AlertComponent}
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'jpg', quality: 0.9 }}
          style={styles.viewShot}
          collapsable={false}
        >
          <View style={styles.viewShotContent}>
            {/* Fixed Header - Non-scrollable */}
            <View style={styles.fixedHeader}>
              <View style={styles.headerContainer}>
                <View style={styles.headerTopRow}>
                  <TouchableOpacity>
                    <Text style={styles.date}>{date || ''}</Text>
                  </TouchableOpacity>
                  <View style={styles.headerIconsRow}>
                    <TouchableOpacity
                      disabled={role === 'caregiver'}
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                      onPress={handleShareScreenshot}
                    >
                      <Image
                        source={require('../../assets/images/share4.png')}
                        style={styles.shareIcon}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                    <Image
                      source={profileImageSource}
                      style={styles.profileIcon}
                      resizeMode="contain"
                    />
                  </View>
                </View>
                <View style={styles.header}>
                  <Text style={styles.title}>Cuore Score</Text>
                  <View style={styles.avatarWrapper}>
                    <Image source={Images.avatar} style={styles.avatar} />
                  </View>
                </View>
              </View>
            </View>

            <ScrollView
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={handleRefresh}
                />
              }
              style={styles.container}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.scrollContent}>
                <View style={styles.scoreCard}>
                  <GaugeMeter
                    value={Math.round(health_metrics?.health_score)}
                  />
                  {/* <Text
                  style={{
                    fontSize: hp(2.5),
                    color: 'red',
                    // marginLeft: hp(1),
                    fontFamily: 'Roboto-Regular',
                    marginBottom: hp(1),
                  }}
                >
                  {Math.round(health_metrics?.health_score)}
                </Text> */}
                  {/* <Text style={styles.score}>78</Text> */}
                  {/* <Text style={styles.scoreDisclaimer}>
                  As you habits change, update you score regularly
                </Text> */}
                  <View style={styles.timeToTargetTitleRow}>
                    <Image
                      source={Images.NOTICE}
                      style={styles.timeToTargetTitleIcon}
                      resizeMode="contain"
                    />

                    <Text style={styles.timeToTarget}>Progress Projection</Text>
                  </View>
                  <View style={styles.timeToTargetRow}>
                    <Text style={styles.months}>
                      {Math.round(
                        health_metrics?.estimated_time_to_target?.value,
                      )}
                    </Text>
                    <Text style={styles.months}>
                      {' '}
                      {health_metrics?.estimated_time_to_target?.unit}
                    </Text>
                  </View>
                  <View style={styles.projectionDisclaimerRow}>
                    {/* <Image
                    source={Images.NOTICE}
                    style={styles.projectionDisclaimerIcon}
                    resizeMode="contain"
                  /> */}
                    <Text style={styles.projectionDisclaimerText}>
                      As your habits change, update your score regularly.
                    </Text>
                  </View>

                  <TouchableOpacity
                    disabled={role === 'caregiver'}
                    onPress={handleReassess}
                    style={styles.reassessButton}
                  >
                    <Image
                      source={Images.EDIT}
                      style={styles.reassessIcon}
                      resizeMode="contain"
                    />

                    <Text style={styles.reassessText}>Update Score </Text>
                  </TouchableOpacity>
                  <Text style={styles.reassessNote}>
                    Based on general lifestyle and cardiometabolic research;
                    consistent habit changes are commonly associated with
                    measurable improvements over time. This estimate reflects
                    general population trends and is not a medical prediction.
                    Individual results vary.
                  </Text>
                </View>

                <View style={styles.row}>
                  <InfoCard
                    label="Metabolic Age"
                    value={health_metrics?.metabolic_age?.value}
                    // subText={health_metrics?.metabolic_age?.gap}
                    png={Images.TREND}
                  />
                  <InfoCard
                    label="Weight"
                    value={health_metrics?.weight?.current}
                    // subText={`Target:${Math.round(
                    //   health_metrics?.weight?.target,
                    // )} kg`}
                    png={Images.WEIGHT}
                  />
                </View>
                <View style={styles.row}>
                  <InfoCard
                    label="BMI"
                    value={health_metrics?.bmi.value}
                    // subText={`Target: ${health_metrics?.bmi?.target}`}
                    png={Images.WEIGHT}
                  />
                  <InfoCard
                    label="Lifestyle"
                    value={`${health_metrics?.lifestyle_score?.value?.toFixed(
                      1,
                    )}%`}
                    // subText={`Target: >${health_metrics?.lifestyle_score.target}`}
                    png={Images.TREND}
                  />
                </View>

                <View style={styles.row}>
                  <InfoCard
                    label="Recommended Calories"
                    value={`${health_metrics?.recommended?.calories?.value} kcal`}
                  />
                  <InfoCard
                    label="Recommended Exercise"
                    value={`${health_metrics?.recommended?.exercise?.value} min`}
                  />
                </View>
                <View style={styles.vitalsContainer}>
                  {filteredVitals.map((item, index) => (
                    <View
                      key={`${item.label}-${index}`}
                      style={styles.vitalItemWrapper}
                    >
                      <VitalCard
                        label={item.label}
                        value={item.value}
                        // target={item.target}
                        color={item.status}
                        hasDiabetes={hasDiabetes}
                      />
                    </View>
                  ))}

                  <View style={styles.focusRow}>
                    <Text style={styles.focusLabel}>Main Focus</Text>
                    <View style={styles.focusTags}>
                      <Text style={styles.focusTag}>
                        {health_metrics?.main_focus?.[0]}
                      </Text>
                      <Text style={styles.focusTag}>
                        {health_metrics?.main_focus?.[1]}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.continueContainer}>
                  <TouchableOpacity
                    disabled={role === 'caregiver'}
                    onPress={handleContinue}
                    style={styles.continueButton}
                  >
                    <Text style={styles.continueText}>Continue</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.card, styles.referencesCard]}
                  onPress={() => setShowReferencesModal(true)}
                  activeOpacity={0.8}
                >
                  <Info
                    size={Math.max(16, hp(1.85))}
                    color="#94A3B8"
                    strokeWidth={2}
                    style={styles.referencesInfoIcon}
                  />
                  <Text style={styles.referencesCardText}>
                    {CLINICAL_REFERENCES_LABEL}
                  </Text>
                </TouchableOpacity>

                {/* <Text style={styles.bold}>History: </Text>
                         
              
                          <Text style={[styles.bold, {marginTop: hp(1)}]}>Medications:</Text>
                          <Text style={{fontSize: 14, fontWeight: '400', color: '#4B5563'}}>
                            Diabetes on metformin   Hypertension (HTN) on Cardace
                          </Text>
              
                          <Text style={[styles.label, {marginTop: hp(1)}]}>
                            <Text style={styles.bold}>Labs:</Text>
                          </Text>
                          <Text style={{fontSize: 14, fontWeight: '400', color: '#4B5563'}}>
                            RBS: 230
                          </Text> */}
              </View>
            </ScrollView>
          </View>
        </ViewShot>
        {/* Loading overlay for PDF sharing */}
        <Modal
          transparent={true}
          animationType="fade"
          visible={sharingLoading}
          onRequestClose={() => setSharingLoading(false)}
        >
          <View style={styles.sharingLoaderOverlay}>
            <View style={styles.sharingLoaderContainer}>
              <ActivityIndicator size="large" color="#11418A" />
              <Text style={styles.sharingLoaderText}>Generating PDF...</Text>
            </View>
          </View>
        </Modal>

        {/* Medical References Modal */}
        <Modal
          visible={showReferencesModal}
          animationType="slide"
          onRequestClose={() => setShowReferencesModal(false)}
        >
          <SafeAreaView style={styles.refModalSafe}>
            <View style={styles.refModalHeader}>
              <Text style={styles.refModalTitle}>
                {CLINICAL_REFERENCES_LABEL}
              </Text>
              <TouchableOpacity
                style={styles.refModalCloseBtn}
                onPress={() => setShowReferencesModal(false)}
              >
                <Text style={styles.refModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.refModalScroll}
              contentContainerStyle={styles.refModalContent}
              showsVerticalScrollIndicator={true}
            >
              {MEDICAL_REFERENCES.map((block, idx) => (
                <View key={`ref-${idx}`} style={styles.refBlock}>
                  {block.intro ? (
                    <Text style={styles.refIntro}>{block.intro}</Text>
                  ) : null}
                  {block.section ? (
                    <Text style={styles.refSectionTitle}>{block.section}</Text>
                  ) : null}
                  {block.links?.map((link, linkIdx) => (
                    <TouchableOpacity
                      key={`link-${idx}-${linkIdx}`}
                      style={styles.refLinkRow}
                      onPress={() => {
                        setWebViewUrl(link.url);
                        setShowReferencesModal(false);
                        setShowWebViewModal(true);
                      }}
                    >
                      <Text style={styles.refLinkBullet}>•</Text>
                      <Text style={styles.refLinkText}>{link.title}</Text>
                      <Text style={styles.refLinkUrl} numberOfLines={1}>
                        {link.url}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {block.note ? (
                    <Text style={styles.refNote}>{block.note}</Text>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* WebView Modal for links */}
        <Modal
          visible={showWebViewModal}
          animationType="slide"
          onRequestClose={() => {
            setShowWebViewModal(false);
            setWebViewUrl('');
          }}
        >
          <SafeAreaView style={styles.webViewModalSafe}>
            <View style={styles.webViewModalHeader}>
              <TouchableOpacity
                style={styles.webViewModalCloseBtn}
                onPress={() => {
                  setShowWebViewModal(false);
                  setWebViewUrl('');
                }}
              >
                <Text style={styles.webViewModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            {webViewLoading && (
              <View style={styles.webViewLoaderWrap}>
                <ActivityIndicator size="large" color="#11418A" />
              </View>
            )}
            {webViewUrl ? (
              <WebView
                source={{ uri: webViewUrl }}
                onLoadStart={() => setWebViewLoading(true)}
                onLoadEnd={() => setWebViewLoading(false)}
                style={styles.webViewStyle}
              />
            ) : null}
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </>
  );
};

const InfoCard = React.memo(({ label, value, subText, png }) => (
  <View style={styles.infoCard}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>

    {subText && (
      <View style={styles.infoSubContainer}>
        <Image source={png} style={styles.infoSubIcon} resizeMode="contain" />
        <Text style={styles.infoSub}>
          {label === 'Metabolic Age'
            ? subText?.toString().startsWith('-')
              ? subText
              : `+${subText}`
            : subText}
        </Text>
      </View>
    )}
  </View>
));
const VitalCard = React.memo(({ label, value, target, hasDiabetes, color }) => {
  return (
    <View style={styles.vitalCard}>
      {label && (
        <View style={styles.vitalRow}>
          <View style={styles.vitalLabelContainer}>
            <Text style={styles.vitalLabel}>{label}</Text>
          </View>
          <View style={styles.vitalValueContainer}>
            <Text style={styles.vitalValue}>{value}</Text>
          </View>
          <View style={styles.vitalTargetContainer}>
            <View style={[styles.vitalBar, { backgroundColor: color }]} />
            {/* <Text style={styles.vitalTarget}>{target}</Text> */}
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  viewShot: {
    flex: 1,
  },
  viewShotContent: {
    flex: 1,
  },
  scrollContent: {
    backgroundColor: '#F8FAFC',
  },
  container: { flex: 1, backgroundColor: '#FFFFFF', marginTop: hp(9) },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: hp(2),
    paddingHorizontal: hp(2),
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#64748B',
    letterSpacing: 0.2,
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 20,
    marginTop: hp(-3),
    color: '#1E293B',
    textAlign: 'center',
    marginLeft: hp(5),
    letterSpacing: -0.3,
  },
  shareIcon: {
    resizeMode: 'contain',
    height: hp(2),
    // width: wp(4),
    tintColor: '#1E293B',
  },
  profileIcon: {
    resizeMode: 'contain',
    width: wp(7),
    height: hp(3.5),
    borderRadius: wp(40),
  },
  avatarWrapper: {},
  avatar: { width: wp(10), height: wp(10), borderRadius: wp(5) },
  timeToTargetRow: {
    flexDirection: 'row',
  },
  timeToTargetValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#11418A',
    letterSpacing: 0.3,
  },
  reassessIcon: {
    resizeMode: 'contain',
    height: hp(2),
    width: wp(6),
    tintColor: '#FFFFFF',
  },

  scoreCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: hp(2.5),
    marginHorizontal: hp(1.5),
    elevation: 2,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  meter: { width: wp(70), height: wp(34), resizeMode: 'cover' },
  score: { fontSize: wp(10), color: '#11418A', fontFamily: 'Poppins-Medium' },
  timeToTargetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.3),
  },
  timeToTargetTitleIcon: {
    marginRight: hp(1),
    height: hp(1.5),
    width: hp(2),
  },
  timeToTarget: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: '#64748B',
    letterSpacing: 0.2,
  },
  projectionDisclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: hp(1),
    marginBottom: hp(0.5),
  },
  projectionDisclaimerIcon: {
    marginRight: hp(1),
    height: hp(1.5),
    width: hp(2),
    marginHorizontal: hp(0.5),
  },
  projectionDisclaimerText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    lineHeight: 18,
    letterSpacing: 0.2,

    textAlign: 'center',
  },
  months: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: '#64748B',
    letterSpacing: 0.2,
  },
  reassessButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#11418A',
    paddingVertical: hp(1.5),
    borderRadius: 12,
    marginVertical: hp(2),
    marginHorizontal: hp(2),
    width: '90%',
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  reassessText: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    marginLeft: wp(3),
    fontSize: 15,
    letterSpacing: 0.3,
  },
  reassessNote: {
    fontFamily: 'Poppins-Regular',
    paddingHorizontal: hp(2),
    textAlign: 'center',
    marginTop: hp(1),
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  reassessLink: {
    fontFamily: 'Poppins-Medium',
    textDecorationLine: 'underline',
    color: '#11418A',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    marginVertical: hp(1),
  },
  infoCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    padding: wp(3.5),
    borderRadius: 12,
    justifyContent: 'center',
  },
  infoValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  infoLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#64748B',
    marginBottom: hp(0.5),
    letterSpacing: 0.2,
  },
  infoSub: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#FF8D10',
    letterSpacing: 0.2,
  },
  infoSubContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.8),
  },
  infoSubIcon: {
    resizeMode: 'contain',
    height: hp(2.5),
    width: wp(4),
    tintColor: '#FF8D10',
    marginRight: hp(0.5),
  },
  vitalsContainer: {
    marginTop: hp(2),
    paddingVertical: hp(2),
    margin: hp(1.5),
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderRadius: 12,
  },
  vitalItemWrapper: {
    marginVertical: 0,
  },
  vitalLabelContainer: {
    width: wp(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalValueContainer: {
    width: wp(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalTargetContainer: {
    flexDirection: 'row',
    flex: 1,
    minWidth: wp(40),
    marginLeft: wp(2),
  },
  continueContainer: {
    backgroundColor: '#FFFFFF',
    margin: hp(2),
    marginBottom: hp(6),
    marginTop: hp(2),
    borderRadius: 12,
    paddingVertical: hp(1),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },

  vitalCard: {
    justifyContent: 'center',
    paddingHorizontal: wp(4),
    marginVertical: hp(0.8),
  },
  vitalLabel: {
    fontFamily: 'Poppins-Regular',
    alignSelf: 'flex-start',
    fontSize: 14,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  vitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vitalValue: {
    fontFamily: 'Poppins-Medium',
    marginLeft: hp(2),
    fontSize: 14,
    color: '#1E293B',
    alignSelf: 'flex-start',
    letterSpacing: 0.2,
  },
  vitalTarget: {
    fontFamily: 'Poppins-Regular',
    marginLeft: hp(1),
    fontSize: 13,
    color: '#64748B',
    letterSpacing: 0.2,
  },
  vitalBar: {
    marginTop: hp(0.5),
    flex: 1,
    height: hp(1),
    borderRadius: wp(2),
  },
  green: { backgroundColor: '#10B981' },
  yellow: { backgroundColor: '#F59E0B' },
  red: { backgroundColor: '#EF4444' },

  focusRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: wp(4),
    marginVertical: hp(2),
  },
  focusLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    marginBottom: hp(1),
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  focusTags: { flexDirection: 'row', gap: wp(3) },
  focusTag: {
    fontFamily: 'Poppins-Regular',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    fontSize: 13,
    color: '#DC2626',
    letterSpacing: 0.2,
  },

  continueButton: {
    margin: wp(4),
    backgroundColor: '#11418A',
    paddingVertical: hp(1.8),
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  continueText: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  bottomText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Poppins-Regular',
    letterSpacing: 0.1,
  },
  sharingLoaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharingLoaderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: hp(3),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: wp(40),
  },
  sharingLoaderText: {
    marginTop: hp(1.5),
    fontSize: 15,
    color: '#1E293B',
    fontFamily: 'Poppins-Regular',
    letterSpacing: 0.2,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: hp(2),
    marginVertical: hp(1),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'center',
    marginHorizontal: hp(1.5),
  },
  referencesCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  referencesInfoIcon: {
    marginRight: hp(1),
  },
  referencesCardText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.15,
    lineHeight: 18,
    flex: 1,
  },
  refModalSafe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  refModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  refModalTitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#64748B',
    flex: 1,
    marginRight: wp(2),
    letterSpacing: 0.15,
  },
  refModalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refModalCloseText: {
    fontSize: 20,
    color: '#475569',
    fontFamily: 'Poppins-Regular',
  },
  refModalScroll: {
    flex: 1,
  },
  refModalContent: {
    padding: wp(4),
    paddingBottom: hp(8),
  },
  refBlock: {
    marginBottom: hp(2.5),
  },
  refIntro: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    letterSpacing: 0.2,
    marginBottom: hp(1),
  },
  refSectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#11418A',
    marginBottom: hp(1),
    letterSpacing: 0.2,
  },
  refLinkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: hp(0.8),
    paddingVertical: hp(0.3),
  },
  refLinkBullet: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#11418A',
    marginRight: wp(1.5),
  },
  refLinkText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#11418A',
    textDecorationLine: 'underline',
    letterSpacing: 0.2,
    flex: 1,
  },
  refLinkUrl: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: wp(2),
    flex: 1,
  },
  refNote: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: hp(0.5),
    letterSpacing: 0.2,
  },
  webViewModalSafe: {
    marginTop: hp(2),
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webViewModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  webViewModalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewModalCloseText: {
    fontSize: 20,
    color: '#475569',
    fontFamily: 'Poppins-Regular',
  },
  webViewLoaderWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 1,
  },
  webViewStyle: {
    flex: 1,
  },
  scoreDisclaimer: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#64748B',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginVertical: hp(1),
  },
});

export default Score;
