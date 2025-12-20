import React, { use, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import { hp, wp, Images, color } from '../../utilities';
import { useSelector, useDispatch } from 'react-redux';
import { getCuoreScoreThunk, getOnboardingThunk } from '../../redux/slices';
import GaugeMeter from '../../components/SpeedpMeter';
import Loader from '../../components/Loader';

// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Score = ({ navigation, route }) => {
  console.log(
    useSelector(state => state.onboarding),
    'onboarding state',
  );
  const screen = route.params?.screen;
  const navigateTo = route.params?.navigateTo;
  console.log(route, 'route params');

  const convertVitalsToArray = vitals => {
    const result = [];

    if (vitals?.blood_pressure) {
      result.push({
        label: 'Resting BP',
        value: vitals.blood_pressure.current,
        target: vitals.blood_pressure.target,
        status: vitals.blood_pressure.status.lower,
      });
    }

    if (vitals?.blood_sugar) {
      result.push({
        label: 'Blood Sugar (Fasting)',
        value: vitals.blood_sugar.fasting?.value,
        target: vitals.blood_sugar.fasting?.target,
        status: vitals.blood_sugar.fasting.status,
      });
      result.push({
        label: 'Blood Sugar (After Meal)',
        value: vitals.blood_sugar.after_meal?.value,
        target: vitals.blood_sugar.after_meal?.target || '—',
        status: vitals.blood_sugar.after_meal.status,
      });
      result.push({
        label: 'A1C',
        value: vitals.blood_sugar.A1C?.value,
        target: vitals.blood_sugar.A1C?.target,
        status: vitals?.blood_sugar.A1C.status,
      });
    }

    if (vitals?.body_fat) {
      result.push({
        label: 'Body Fat',
        value: `${vitals.body_fat?.value}${vitals.body_fat?.unit}`,
        target: `${vitals.body_fat?.target}${vitals.body_fat?.unit}`,
        status: vitals.body_fat.status,
      });
    }

    if (vitals?.cholesterol?.tg_hdl_ratio) {
      result.push({
        label: 'Cholesterol (TG/HDL)',
        value: vitals.cholesterol?.tg_hdl_ratio?.value,
        target: vitals.cholesterol?.tg_hdl_ratio?.target,
        status: vitals?.cholesterol?.tg_hdl_ratio?.status,
      });
    }

    return result;
  };

  const dispatch = useDispatch();

  const user_Id = useSelector(state => state.auth?.userId);
  const role = useSelector(state => state.auth?.role);
  const loading = useSelector(state => state.cuoreScore?.loading);
  const health_metrics = useSelector(
    state => state.cuoreScore?.data?.health_metrics,
  );
  const date = useSelector(state => state.cuoreScore?.data?.current_date);

  const hasDiabetes = useSelector(
    state => state.onboardingdata?.data?.data?.o3Data?.hasDiabetes,
  );

  const viewShotRef = useRef(null);

  const handleShareScreenshot = async () => {
    try {
      if (viewShotRef.current) {
        // Capture only what's currently visible on screen (no scrolling)
        const uri = await viewShotRef.current.capture();

        const shareOptions = {
          title: 'Cuore Score',
          message: 'Check out my Cuore Score!',
          url: uri,
          type: 'image/jpeg',
        };

        await Share.open(shareOptions);
      }
    } catch (error) {
      console.error('Error sharing screenshot:', error);
      // User cancelled sharing - don't show error
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share screenshot');
      }
    }
  };

  useEffect(() => {
    if (user_Id) {
      dispatch(getCuoreScoreThunk(user_Id));
      dispatch(getOnboardingThunk());
    }
  }, [dispatch, user_Id]); // ✅ Added dependencies

  console.log(user_Id, 'user_Id');
  console.log(health_metrics, 'health_metrics');
  // console.log(hasDiabetes, 'hasDiabetes');

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
    <Loader />;
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'jpg', quality: 0.9 }}
        style={{ flex: 1 }}
        collapsable={false}
      >
        <View style={{ flex: 1 }}>
          {/* Fixed Header - Non-scrollable */}
          <View style={styles.fixedHeader}>
            <View style={{ backgroundColor: '#FFFFFF', elevation: 1 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  // padding: hp(1),
                  paddingTop: hp(2),
                  paddingHorizontal: hp(2),
                }}
              >
                <TouchableOpacity>
                  <Text style={styles.date}>{date || ''}</Text>
                </TouchableOpacity>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <TouchableOpacity
                    disabled={role == 'caregiver'}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    onPress={handleShareScreenshot}
                  >
                    <Image
                      source={Images.SHARE_4}
                      style={{
                        resizeMode: 'contain',
                        height: hp(2),
                        tintColor: 'black',
                      }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                  <Image
                    source={Images.UNCLE}
                    style={{
                      width: wp(9),
                      resizeMode: 'cover',
                      height: hp(3),
                    }}
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
                onRefresh={() => dispatch(getCuoreScoreThunk(user_Id))}
              />
            }
            style={styles.container}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            <View style={{ backgroundColor: '#F9FAFB' }}>
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
                <View style={{ flexDirection: 'row' }}>
                  <Text
                    style={{
                      fontFamily: 'Roboto-Regular',
                      fontSize: 17,
                      color: '#1E64AC',
                      fontWeight: '500',
                    }}
                  >
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
                  disabled={role == 'caregiver'}
                  onPress={() =>
                    navigation.navigate('OnBoarding', {
                      screen: 'Reassess',
                    })
                  }
                  style={styles.reassessButton}
                >
                  <Image
                    source={Images.EDIT} // Replace with actual key in your `images` object
                    style={{
                      resizeMode: 'contain',
                      height: hp(2),
                      width: wp(6),
                      tintColor: '#FFFFFF',

                      // marginLeft: hp(2),
                    }}
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
              <View
                style={{
                  marginTop: hp(2),
                  // marginHorizontal: hp(1.5),
                  elevation: 0.5,
                  // padding: hp(2),
                  paddingVertical: hp(2),
                  margin: hp(1.5),
                  backgroundColor: 'white',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  borderRadius: hp(1),
                }}
              >
                {convertVitalsToArray(health_metrics?.vitals)
                  .filter(
                    item =>
                      item.value !== undefined &&
                      item.value !== null &&
                      item.value !== '',
                  )
                  .map((item, index) => (
                    <View
                      key={index}
                      style={{ marginVertical: index === 2 ? hp(2) : 0 }}
                    >
                      <VitalCard
                        data={item.health_metrics?.vitals}
                        label={item.label}
                        value={item.value}
                        target={item.target}
                        color={item.status}
                        colorCode={'red'}
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

              <View
                style={{
                  backgroundColor: 'white',
                  margin: hp(2),
                  marginBottom: hp(6),
                  // marginVertical: hp(1),
                  marginTop: hp(2),
                  borderRadius: hp(1),
                  paddingVertical: hp(1),
                  elevation: 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  // paddingBottom: hp(2),
                }}
              >
                <TouchableOpacity
                  disabled={role == 'caregiver'}
                  onPress={() => {
                    // navigation.reset({
                    //   index: 0,
                    //   routes: [
                    //     {
                    //       name: 'Home',
                    //       state: {
                    //         index: 2, // Explore tab index
                    //         routes: [
                    //           { name: 'Today' },
                    //           { name: 'Explore' },
                    //           { name: 'Predict' },
                    //           { name: 'Chat' },
                    //           { name: 'Profile' },
                    //         ],
                    //       },
                    //     },
                    //   ],
                    // });

                    if (navigateTo == 'Home') {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Home' }],
                      });
                    } else if (navigateTo == 'Mind') {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Home' }],
                      });
                    } else {
                      navigation.navigate('Checkout');
                    }
                  }}
                  style={styles.continueButton}
                >
                  <Text style={styles.continueText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </ViewShot>
    </SafeAreaView>
  );
};

const InfoCard = ({ label, value, subText, png }) => (
  <View style={styles.infoCard}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>

    {subText && (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: hp(0.5),
        }}
      >
        <Image
          source={png} // Replace with actual key in your `images` object
          style={{
            resizeMode: 'contain',
            height: hp(3),
            width: wp(4),
            tintColor: '#FF8D10',
            marginRight: hp(0.5),
          }}
        />
        <Text style={styles.infoSub}>
          {label == 'Metabolic Age'
            ? subText?.toString().startsWith('-')
              ? subText
              : `+${subText}`
            : subText}
        </Text>
      </View>
    )}
  </View>
);
const getVitalColor = (label, value, target, hasDiabetes) => {
  switch (label) {
    case 'Resting BP': {
      const [systolic, diastolic] = value.split('/').map(Number);
      const total = systolic + diastolic;

      if (total < 180) return 'orange';
      if (total <= 200) return 'green';
      if (total <= 220) return 'orange';
      return 'red';
    }

    case 'Blood Sugar (Fasting)': {
      if (hasDiabetes) {
        if (value < 100) return 'red';
        if (value <= 139) return 'green';
        if (value <= 170) return 'orange';
        return 'red';
      } else {
        if (value < 100) return 'green';
        if (value <= 125) return 'orange'; // ✅ handles 140–170
        return 'red';
      }
    }

    case 'Blood Sugar (After Meal)': {
      if (hasDiabetes) {
        if (value < 130) return 'red';
        if (value <= 169) return 'green';
        if (value <= 220) return 'orange';
        return 'red';
      } else {
        if (value < 140) return 'green';
        if (value <= 200) return 'orange';
        return 'red';
      }
    }

    case 'Cholesterol (TG/HDL)':
      if (value < 2.8) return 'green';
      if (value <= 4.0) return 'orange';
      return 'red';

    case 'Body Fat': {
      const cleanValue = parseFloat(String(value).replace('%', ''));
      const cleanTarget = parseFloat(String(target).replace('%', ''));

      if (isNaN(cleanValue) || isNaN(cleanTarget) || cleanTarget === 0) {
        console.warn('Invalid Body Fat values:', value, target);
        return 'red';
      }

      const diff = Math.abs(cleanValue - cleanTarget);
      const percentageDiff = (diff / cleanTarget) * 100;
      console.log(diff, 'diff');
      console.log(percentageDiff.toFixed(2), '% difference');

      if (percentageDiff < 5) return 'green';
      if (percentageDiff <= 15) return 'orange';
      return 'red';
    }

    default:
      return 'gray'; // fallback
  }
};

const VitalCard = ({
  label,
  value,
  target,
  colorCode,
  hint,
  hasDiabetes,
  color,
}) => {
  console.log(label, value, target, 'vital card props');
  const barColor = getVitalColor(label, value, target, hasDiabetes);
  return (
    <View style={styles.vitalCard}>
      {label && (
        <View style={styles.vitalRow}>
          <View
            style={{
              width: wp(25),
              // backgroundColor: 'yellow',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={[
                styles.vitalLabel,
                { marginTop: hint == '' ? hp(2) : hp(0) },
              ]}
            >
              {label}
            </Text>
          </View>
          <View
            style={{
              // backgroundColor: 'red',
              width: wp(20),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={styles.vitalValue}>{value}</Text>
          </View>
          <View style={{ flexDirection: 'row', width: hp(22) }}>
            <View style={[styles.vitalBar, { backgroundColor: color }]} />

            <Text style={styles.vitalTarget}>{target}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  header: {
    // padding: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // paddingBottom: hp(2),
  },
  date: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.5),
    color: '#6B7280',
    // marginBottom: hp(3),
  },
  title: {
    fontFamily: 'Roboto-Regular',
    // marginLeft: hp(-4),
    fontSize: wp(5),
    fontWeight: '400',
    marginTop: hp(-3),
    color: '#000000',
    textAlign: 'center',
    marginLeft: hp(5),
  },
  avatarWrapper: {},
  avatar: { width: wp(10), height: wp(10), borderRadius: wp(5) },

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
});

export default Score;
