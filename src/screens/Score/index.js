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
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import { hp, wp, Images } from '../../utilities';
import { useSelector, useDispatch } from 'react-redux';
import { getCuoreScoreThunk, getOnboardingThunk } from '../../redux/slices';
import { shareData } from '../../redux/slices';
import GaugeMeter from '../../components/SpeedpMeter';
import Loader from '../../components/Loader';

const Score = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const navigateTo = route.params?.navigateTo;

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
  const viewShotRef = useRef(null);
  const [sharingLoading, setSharingLoading] = useState(false);

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
        Alert.alert('Error', 'Failed to generate PDF for sharing');
      }
    } catch (error) {
      // User cancelled sharing - don't show error
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share PDF');
      }
    } finally {
      setSharingLoading(false);
    }
  }, [dispatch]);

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

  const handleContinue = useCallback(() => {
    if (paymentStatus === 'completed') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } else {
      navigation.navigate('Checkout');
    }
  }, [navigation, navigateTo]);

  const handleReassess = useCallback(() => {
    navigation.navigate('OnBoarding', {
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
  if (loading) {
    return <Loader />;
  }

  return (
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
                      source={Images.SHARE_4}
                      style={styles.shareIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                  <Image
                    source={Images.UNCLE}
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
              <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
            }
            style={styles.container}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.scrollContent}>
              <View style={styles.scoreCard}>
                <GaugeMeter value={Math.round(health_metrics?.health_score)} />
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
                <Text style={styles.timeToTarget}>
                  Estimated Time to Target
                </Text>
                <View style={styles.timeToTargetRow}>
                  <Text style={styles.timeToTargetValue}>
                    {Math.round(
                      health_metrics?.estimated_time_to_target?.value,
                    )}
                  </Text>
                  <Text style={styles.months}>
                    {' '}
                    {health_metrics?.estimated_time_to_target?.unit}
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

                  <Text style={styles.reassessText}>Re-assess</Text>
                </TouchableOpacity>
                <Text style={styles.reassessNote}>
                  As your health evolves, so should your plan Re-assess monthly
                </Text>
              </View>

              <View style={styles.row}>
                <InfoCard
                  label="Metabolic Age"
                  value={health_metrics?.metabolic_age?.value}
                  subText={health_metrics?.metabolic_age?.gap}
                  png={Images.TREND}
                />
                <InfoCard
                  label="Weight"
                  value={health_metrics?.weight?.current}
                  subText={`Target:${Math.round(
                    health_metrics?.weight?.target,
                  )} kg`}
                  png={Images.WEIGHT}
                />
              </View>
              <View style={styles.row}>
                <InfoCard
                  label="BMI"
                  value={health_metrics?.bmi.value}
                  subText={`Target: ${health_metrics?.bmi?.target}`}
                  png={Images.WEIGHT}
                />
                <InfoCard
                  label="Lifestyle"
                  value={`${health_metrics?.lifestyle_score?.value?.toFixed(
                    1,
                  )}%`}
                  subText={`Target: >${health_metrics?.lifestyle_score.target}`}
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
                      target={item.target}
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
            <ActivityIndicator size="large" color="#1E64AC" />
            <Text style={styles.sharingLoaderText}>Generating PDF...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
            <Text style={styles.vitalTarget}>{target}</Text>
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  viewShot: {
    flex: 1,
  },
  viewShotContent: {
    flex: 1,
  },
  scrollContent: {
    backgroundColor: '#F9FAFB',
  },
  container: { flex: 1, backgroundColor: '#fff', marginTop: hp(9) },
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
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.5),
    color: '#6B7280',
  },
  title: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(5),
    fontWeight: '400',
    marginTop: hp(-3),
    color: '#000000',
    textAlign: 'center',
    marginLeft: hp(5),
  },
  shareIcon: {
    resizeMode: 'contain',
    height: hp(2),
    tintColor: 'black',
  },
  profileIcon: {
    width: wp(9),
    height: hp(3),
  },
  avatarWrapper: {},
  avatar: { width: wp(10), height: wp(10), borderRadius: wp(5) },
  timeToTargetRow: {
    flexDirection: 'row',
  },
  timeToTargetValue: {
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    color: '#1E64AC',
    fontWeight: '500',
  },
  reassessIcon: {
    resizeMode: 'contain',
    height: hp(2),
    width: wp(6),
    tintColor: '#FFFFFF',
  },

  scoreCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: hp(2),
    marginHorizontal: hp(1),
    elevation: 1,
    borderRadius: hp(1),
    alignItems: 'center',
    marginVertical: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  meter: { width: wp(70), height: wp(34), resizeMode: 'cover' },
  score: { fontSize: wp(10), fontWeight: 'bold', color: '#0047AB' },
  timeToTarget: {
    fontFamily: 'Roboto-Regular',
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '400',
  },
  months: {
    fontFamily: 'Roboto-Regular',
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
  },
  reassessButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#1E64AC',
    // marginTop: hp(4),
    // paddingHorizontal: wp(30),
    paddingVertical: hp(1),
    borderRadius: wp(2),
    // marginTop: hp(2),
    marginVertical: hp(2),
    marginHorizontal: hp(2),
    width: '90%',
  },
  reassessText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontWeight: '800',
    marginLeft: wp(3),
    // marginRight: hp(6),
    fontSize: 15,
  },
  reassessNote: {
    fontFamily: 'Roboto-Regular',
    paddingHorizontal: hp(1),
    textAlign: 'center',
    marginTop: hp(1),
    fontSize: 16,

    color: '#1E64AC',
    fontWeight: '400',
  },
  reassessLink: {
    fontFamily: 'Roboto-Regular',
    textDecorationLine: 'underline',
    color: '#0047AB',
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
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    padding: wp(3),
    borderRadius: wp(2),
    // alignItems: 'center',
    justifyContent: 'center',
  },
  infoValue: {
    fontFamily: 'Roboto-Regular',
    // marginLeft: hp(2),
    fontSize: 18,
    fontWeight: '400',
    color: '#000000',
  },
  infoLabel: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  infoSub: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    color: '#FF8D10',
    fontWeight: '400',
  },
  infoSubContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  infoSubIcon: {
    resizeMode: 'contain',
    height: hp(3),
    width: wp(4),
    tintColor: '#FF8D10',
    marginRight: hp(0.5),
  },
  vitalsContainer: {
    marginTop: hp(2),
    paddingVertical: hp(2),
    margin: hp(1.5),
    backgroundColor: 'white',
    elevation: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: hp(1),
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
    width: hp(22),
  },
  continueContainer: {
    backgroundColor: 'white',
    margin: hp(2),
    marginBottom: hp(6),
    marginTop: hp(2),
    borderRadius: hp(1),
    paddingVertical: hp(1),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  vitalCard: {
    justifyContent: 'center',
    // alignItems: 'center',
    // backgroundColor: 'red',
    paddingHorizontal: wp(4),
    marginVertical: hp(0.8),
  },
  vitalLabel: {
    fontFamily: 'Roboto-Regular',
    alignSelf: 'flex-start',
    fontSize: 14,
    // marginBottom: hp(0.5),
    fontWeight: 400,
    color: '#000000',
  },
  vitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vitalValue: {
    fontFamily: 'Roboto-Regular',
    marginLeft: hp(2),
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',

    alignSelf: 'flex-start',
  },
  vitalTarget: {
    fontFamily: 'Roboto-Regular',
    marginLeft: hp(1),
    fontSize: 14,
    color: '#6B7280',
  },
  vitalBar: {
    // alignSelf: 'flex-start',
    marginTop: hp(0.5),
    width: wp(25),
    height: hp(1),
    borderRadius: wp(2),
    marginHorizontal: wp(2),
  },
  green: { backgroundColor: '#4CAF50' },
  yellow: { backgroundColor: '#FFC107' },
  red: { backgroundColor: '#F44336' },

  focusRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: wp(4),
    marginVertical: hp(2),
  },
  focusLabel: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    marginBottom: hp(1),
    color: '#000000',
    fontWeight: '400',
  },
  focusTags: { flexDirection: 'row', gap: wp(3) },
  focusTag: {
    fontFamily: 'Roboto-Regular',
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    backgroundColor: '#D2E0EE',
    borderRadius: wp(1),
    fontSize: wp(3.5),
    color: '#B63241',
  },

  continueButton: {
    // marginTop: hp(4),
    // marginBottom: hp(6),
    margin: wp(4),
    backgroundColor: '#1E64AC',
    paddingVertical: hp(1.5),
    borderRadius: wp(1),
    alignItems: 'center',
  },
  continueText: {
    fontFamily: 'Roboto-Regular',
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  bottomText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    fontFamily: 'Roboto-Regular',
  },
  sharingLoaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharingLoaderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: hp(1),
    padding: hp(3),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: wp(40),
  },
  sharingLoaderText: {
    marginTop: hp(1.5),
    fontSize: hp(1.8),
    color: '#111827',
    fontFamily: 'Roboto-Regular',
    fontWeight: '500',
  },
});

export default Score;
