import React, { use, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hp, wp, Images, color } from '../../utilities';
import { useSelector, useDispatch } from 'react-redux';
import { getOnboardingThunk } from '../../redux/slices';
import GaugeMeter from '../../components/SpeedpMeter';

// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Score = ({ navigation, route }) => {
  console.log(
    useSelector(state => state.onboarding),
    'onboarding state',
  );
  const screen = route.params?.screen;
  console.log(route.params, 'route params');

  const health_metrics = useSelector(state =>
    screen === 'Reassess'
      ? state.reassessment?.data?.data?.health_metrics
      : state.onboarding?.data?.data?.health_metrics,
  );

  const convertVitalsToArray = vitals => {
    const result = [];

    if (vitals?.blood_pressure) {
      result.push({
        label: 'Resting BP',
        value: vitals.blood_pressure.current,
        target: vitals.blood_pressure.target,
      });
    }

    if (vitals?.blood_sugar) {
      result.push({
        label: 'Blood Sugar (Fasting)',
        value: vitals.blood_sugar.fasting?.value,
        target: vitals.blood_sugar.fasting?.target,
      });
      result.push({
        label: 'Blood Sugar (After Meal)',
        value: vitals.blood_sugar.after_meal?.value,
        target: vitals.blood_sugar.after_meal?.target || '—',
      });
    }

    if (vitals?.body_fat) {
      result.push({
        label: 'Body Fat',
        value: `${vitals.body_fat?.value}${vitals.body_fat?.unit}`,
        target: `${vitals.body_fat?.target}${vitals.body_fat?.unit}`,
      });
    }

    if (vitals?.cholesterol?.tg_hdl_ratio) {
      result.push({
        label: 'Cholesterol (TG/HDL)',
        value: vitals.cholesterol.tg_hdl_ratio.value,
        target: vitals.cholesterol.tg_hdl_ratio.target,
      });
    }

    return result;
  };
  const getVitalColor = (label, value, target) => {
    switch (label) {
      case 'Resting BP':
        if (value < 100) return 'orange';
        if (value <= 130) return 'green';
        if (value <= 145) return 'orange';
        return 'red';

      case 'Blood Sugar (Fasting)':
        if (value < 100) return 'red';
        if (value <= 139) return 'green';
        if (value <= 170) return 'orange';
        return 'red';

      case 'Blood Sugar (After Meal)':
        if (value < 130) return 'red';
        if (value <= 169) return 'green';
        if (value <= 220) return 'orange';
        return 'red';

      case 'Cholesterol (TG/HDL)':
        if (value < 2.8) return 'green';
        if (value <= 4.0) return 'orange';
        return 'red';

      case 'Body Fat':
        const diff = Math.abs(value - target);
        const percentDiff = (diff / target) * 100;
        if (percentDiff < 5) return 'green';
        if (percentDiff <= 15) return 'orange';
        return 'red';

      default:
        return 'gray'; // fallback
    }
  };
  const { data, loading, error } = useSelector(state => state.onboardingdata);
  const onBoardingData = useSelector(state => state?.onboardingdata?.data);
  console.log('Onboarding Data:', data);
  console.log('Loading State:', loading);
  console.log('Error State:', error);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getOnboardingThunk());
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={{ backgroundColor: '#F9FAFB' }}>
        <View style={{ backgroundColor: '#FFFFFF', elevation: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              // backgroundColor: 'red',
              marginTop: Platform.OS == 'ios' && hp(4),
              justifyContent: 'space-between',
              padding: hp(1),
            }}
          >
            <TouchableOpacity>
              <Text> </Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={Images.SHARE_4} // Replace with actual key in your `images` object
                style={{
                  resizeMode: 'contain',
                  height: hp(2),
                  tintColor: 'black',
                  // marginLeft: hp(-1.8),
                }}
                resizeMode="contain"
              />
              <Image
                source={Images.UNCLE} // Replace with actual key in your `images` object
                style={{
                  // tintColor: 'red',
                  width: wp(9),
                  resizeMode: 'cover',
                  height: hp(3),
                  // marginLeft: hp(-1.8),
                }}
                resizeMode="contain"
              />
            </View>
          </View>
          <View style={styles.header}>
            <Text style={styles.date}>Feb 25, 2025</Text>
            <Text style={styles.title}>Cuore Score</Text>
            <View style={styles.avatarWrapper}>
              <Image source={Images.avatar} style={styles.avatar} />
            </View>
          </View>
        </View>

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
          <Text style={styles.timeToTarget}>Estimated Time to Target</Text>
          <View style={{ flexDirection: 'row' }}>
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontSize: 17,
                color: '#1E64AC',
                fontWeight: '500',
              }}
            >
              {Math.round(health_metrics?.estimated_time_to_target?.value)}
            </Text>
            <Text style={styles.months}>
              {' '}
              {health_metrics?.estimated_time_to_target?.unit}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('OnBoarding', {
                screen: 'Reassess',
                onBoardingData: onBoardingData ? onBoardingData : {},
              })
            }
            style={styles.reassessButton}
          >
            <Image
              source={Images.EDIT} // Replace with actual key in your `images` object
              style={{
                resizeMode: 'contain',
                height: hp(2),

                marginLeft: hp(2),
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
          />
          <InfoCard
            label="Weight"
            value={health_metrics?.weight?.current}
            subText={`${health_metrics?.weight?.target} kg`}
          />
        </View>
        <View style={styles.row}>
          <InfoCard
            label="BMI"
            value={health_metrics?.bmi.value}
            subText={`Target: ${health_metrics?.bmi?.target}`}
          />
          <InfoCard
            label="Lifestyle"
            value={`${health_metrics?.lifestyle_score?.value?.toFixed(1)}%`}
            subText={`Target: >${health_metrics?.lifestyle_score.target}`}
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
            marginTop: hp(1),
            marginHorizontal: hp(1.5),
            elevation: 2,
            backgroundColor: 'white',
          }}
        >
          {convertVitalsToArray(health_metrics?.vitals).map((item, index) => (
            <View
              key={index}
              style={{ marginVertical: index === 2 ? hp(2) : 0 }}
            >
              <VitalCard
                data={item.health_metrics?.vitals}
                label={item.label}
                // hint={'ta'}
                value={item.value}
                target={item.target}
                colorCode={'red'}
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

        <TouchableOpacity
          onPress={() => navigation.navigate('Checkout')}
          style={styles.continueButton}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const InfoCard = ({ label, value, subText }) => (
  <View style={styles.infoCard}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>

    {subText && <Text style={styles.infoSub}>{subText}</Text>}
  </View>
);
const getVitalColor = (label, value, target) => {
  switch (label) {
    case 'Resting BP':
      if (value < 100) return 'orange';
      if (value <= 130) return 'green';
      if (value <= 145) return 'orange';
      return 'red';

    case 'Blood Sugar (Fasting)':
      if (value < 100) return 'red';
      if (value <= 139) return 'green';
      if (value <= 170) return 'orange'; // ✅ handles 140–170
      return 'red';

    case 'Blood Sugar (After Meal)':
      if (value < 130) return 'red';
      if (value <= 169) return 'green';
      if (value <= 220) return 'orange';
      return 'red';

    case 'Cholesterol (TG/HDL)':
      if (value < 2.8) return 'green';
      if (value <= 4.0) return 'orange';
      return 'red';

    case 'Body Fat':
      const diff = Math.abs(value - target);
      const percentDiff = (diff / target) * 100;
      if (percentDiff < 5) return 'green';
      if (percentDiff <= 15) return 'orange';
      return 'red';

    default:
      return 'gray'; // fallback
  }
};

const VitalCard = ({ label, value, target, colorCode, hint }) => {
  const barColor = getVitalColor(label, value, target);
  return (
    <View style={styles.vitalCard}>
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
          <View style={[styles.vitalBar, { backgroundColor: barColor }]} />

          <Text style={styles.vitalTarget}>{target}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    padding: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.5),
    color: '#6B7280',
    marginBottom: hp(3),
  },
  title: {
    fontFamily: 'Roboto-Regular',
    marginLeft: hp(-4),
    fontSize: wp(5),
    fontWeight: '400',
    marginTop: hp(2),
    color: '#000000',
  },
  avatarWrapper: {},
  avatar: { width: wp(10), height: wp(10), borderRadius: wp(5) },

  scoreCard: {
    backgroundColor: 'red',
    paddingVertical: hp(2),
    marginHorizontal: hp(1),
    backgroundColor: '#FFFFFF',
    elevation: 1,
    borderRadius: hp(1),
    alignItems: 'center',
    marginVertical: hp(2),
  },
  meter: { width: wp(70), height: wp(34), resizeMode: 'cover' },
  score: { fontSize: wp(10), fontWeight: 'bold', color: '#0047AB' },
  timeToTarget: {
    fontFamily: 'Roboto-Regular',
    fontSize: 15,
    color: 'red',
    fontWeight: '400',
    color: '#4B5563',
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
    color: '#fff',
    fontWeight: '400',
    marginRight: hp(6),
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
    fontSize: wp(4),
    marginBottom: hp(1),
    color: '#000000',
    fontSize: 14,
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
    marginTop: hp(4),
    marginBottom: hp(6),
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
    fontWeight: '500',
  },
  bottomText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    fontFamily: 'Roboto-Regular',
  },
});

export default Score;
