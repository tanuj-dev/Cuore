import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import { hp, wp, Images } from '../../utilities';
import Header from '../../components/Header';
import ToastMessage from '../../components/Toast';
import { useSelector, useDispatch } from 'react-redux';
import {
  getTobacco,
  updateTobaccoProfile,
  logTobaccoUsage,
} from '../../redux/slices';
import SkeletonBox from '../../components/SkeletonBox';

const TobaccoSkeleton = () => {
  const { colors: c } = useAppTheme();
  return (
  <View style={{ flex: 1, backgroundColor: c.background }}>
    {/* Header placeholder */}
    <View style={{ height: hp(7), backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border, justifyContent: 'center', paddingHorizontal: hp(2) }}>
      <SkeletonBox width={140} height={20} />
    </View>
    <ScrollView scrollEnabled={false} contentContainerStyle={{ padding: wp(4), backgroundColor: c.surface, gap: hp(2) }}>
      {/* Main box */}
      <View style={{ backgroundColor: c.mutedSurface, padding: wp(4), borderRadius: 12, borderWidth: 1, borderColor: c.border, gap: hp(2) }}>
        <SkeletonBox width={160} height={16} />
        <SkeletonBox width="100%" height={50} borderRadius={10} />
        <SkeletonBox width={80} height={36} borderRadius={10} style={{ alignSelf: 'flex-end' }} />
        <SkeletonBox width={100} height={16} />
      </View>
      {/* Quote box */}
      <SkeletonBox width="100%" height={56} borderRadius={12} />
      {/* Challenge box */}
      <View style={{ backgroundColor: c.mutedSurface, padding: wp(4), borderRadius: 12, borderWidth: 1, borderColor: c.border, gap: hp(1.5) }}>
        <SkeletonBox width={160} height={20} />
        <SkeletonBox width="90%" height={18} borderRadius={6} />
        <SkeletonBox width="70%" height={16} borderRadius={6} />
      </View>
      {/* Profile box */}
      <View style={{ backgroundColor: c.mutedSurface, padding: wp(4), borderRadius: 12, gap: hp(1.5) }}>
        <SkeletonBox width={160} height={18} />
        <SkeletonBox width="100%" height={44} borderRadius={10} />
        <SkeletonBox width="100%" height={44} borderRadius={10} />
        <SkeletonBox width="100%" height={44} borderRadius={10} />
      </View>
      {/* Stats grid */}
      <View style={{ flexDirection: 'row', gap: wp(2) }}>
        <SkeletonBox width="48%" height={90} borderRadius={12} />
        <SkeletonBox width="48%" height={90} borderRadius={12} />
      </View>
    </ScrollView>
  </View>
  );
};

const Tobacco = ({ navigation }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const [yesterdayCount, setYesterdayCount] = useState('');
  const [cigarettesPerDay, setCigarettesPerDay] = useState(0);
  const [yearsOfSmoking, setYearsOfSmoking] = useState(0);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasSyncedFromProfile = useRef(false);

  const data = useSelector(state => state.tobacco.data?.data);
  const dailyChalanges = useSelector(
    state => state.tobacco.data?.data?.allChallenges,
  );
  const userId = useSelector(state => state.auth.userId);
  const profileData = data?.profile;
  const stats = data?.stats;

  // Show previousDayCount from profile only once when data loads; user can then clear and type freely
  useEffect(() => {
    if (
      profileData?.previousDayCount != null &&
      profileData?.previousDayCount !== '' &&
      !hasSyncedFromProfile.current
    ) {
      setYesterdayCount(String(profileData.previousDayCount));
      hasSyncedFromProfile.current = true;
    }
  }, [profileData?.previousDayCount]);

  const dispatch = useDispatch();

  useEffect(() => {
    if (userId && !data) {
      dispatch(getTobacco(userId));
    }
  }, [dispatch, userId, data]);

  const tobaccoLoading = useSelector(state => state.tobacco.loading);

  if (!data) {
    return <TobaccoSkeleton />;
  }

  const handleSubmit = async () => {
    setLoading(true);
    const payload = {
      cigarettesPerDay: cigarettesPerDay,
      yearsOfSmoking: yearsOfSmoking,
    };
    const res = await dispatch(
      updateTobaccoProfile({ userId, payload }),
    ).unwrap();
    if (res.status === 'success') {
      setCigarettesPerDay('');
      setYearsOfSmoking('');
      setToast('Profile updated successfully');
      dispatch(getTobacco(userId));
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  const handleLogUsage = async () => {
    setLoading(true);
    const count =
      yesterdayCount !== '' && yesterdayCount !== undefined
        ? Number(yesterdayCount)
        : 0;
    const res = await dispatch(logTobaccoUsage({ userId, count })).unwrap();
    if (res.status === 'success') {
      setToast('Tobacco usage logged successfully');
      dispatch(getTobacco(userId));
    }
    setLoading(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    hasSyncedFromProfile.current = false;
    if (userId) {
      dispatch(getTobacco(userId));
    }
    setRefreshing(false);
  };

  // const nudge = dailyChalanges?.find(challenge => challenge.isCurrent)?.nudge;

  return (
    <>
      <View style={styles.screen}>
        <Header title="Cuore Tobacco" navigation={navigation} />

        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={c.primary}
            />
          }
        >
          <View style={styles.box}>
            <View style={styles.rowCenter}>
              <Image style={styles.iconWatch} source={Images.WATCH} />
              <Text style={styles.daysText}>
                {profileData?.tobaccoFreeDays} days tobacco-free
              </Text>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>
                Enter number of tobacco products or cigarettes used yesterday
              </Text>
              <TextInput
                style={styles.inputSmall}
                keyboardType="numeric"
                value={String(yesterdayCount)}
                onChangeText={setYesterdayCount}
                placeholder="0"
                placeholderTextColor={c.inputPlaceholder}
              />
            </View>
            <TouchableOpacity
              style={styles.logSubmitButton}
              onPress={() => handleLogUsage()}
            >
              {loading ? (
                <ActivityIndicator size="small" color={c.onPrimary} />
              ) : (
                <Text style={styles.reassessText}>Submit</Text>
              )}
            </TouchableOpacity>
            <View style={[styles.rowCenter, styles.levelRow]}>
              <Text style={styles.levelText}>
                Level {profileData?.currentLevel}
              </Text>
              <Image style={styles.iconTrophy} source={Images.TROPHY} />
            </View>
          </View>

          <View style={styles.quoteBox}>
            <Text style={styles.quote}>
              {data?.encouragement &&
              String(data.encouragement).trim() !== '' &&
              String(data.encouragement).trim() !== '--'
                ? data.encouragement
                : 'Keep going — every tobacco-free day counts.'}
            </Text>
          </View>

          <View style={styles.challengeBox}>
            <Text style={styles.sectionTitleAccent}>Next Level Challenge</Text>
            <Text style={styles.challengeSubText}>
              {dailyChalanges?.[data?.currentLevel]?.challengeText ?? ''}
            </Text>
            <Text style={styles.detailText}>
              {dailyChalanges?.[data?.currentLevel]?.challengeText2 ?? ''}
            </Text>
          </View>

          <View style={styles.profileBox}>
            <Text style={styles.sectionTitleDark}>Your Smoking Profile</Text>

            <Text style={styles.inputLabel}>Cigarettes per day</Text>
            <TextInput
              placeholderTextColor={c.inputPlaceholder}
              placeholder="Enter the count"
              style={styles.input}
              keyboardType="numeric"
              value={cigarettesPerDay}
              onChangeText={setCigarettesPerDay}
            />

            <Text style={[styles.inputLabel, styles.inputLabelSpaced]}>
              Years of smoking
            </Text>
            <TextInput
              placeholder="Num of years"
              placeholderTextColor={c.inputPlaceholder}
              style={styles.input}
              keyboardType="numeric"
              value={yearsOfSmoking}
              onChangeText={setYearsOfSmoking}
            />

            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.reassessButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color={c.onPrimary} />
              ) : (
                <Text style={styles.reassessText}>Submit</Text>
              )}
            </TouchableOpacity>

            {toast && (
              <ToastMessage
                message={toast}
                type="success"
                onHide={() => setToast(null)}
                top={50}
              />
            )}
          </View>

          <View style={styles.gridContainer}>
            <View style={styles.gridBox}>
              <Image style={styles.gridIcon} source={Images.SOIL_WATCH} />
              <Text style={styles.gridLabel}>Estimated Longevity Impact</Text>
              <Text style={styles.gridValueRed}>{stats?.yearsLost}</Text>
            </View>

            <View style={styles.gridBox}>
              <Image style={styles.gridIcon} source={Images.COIN} />
              <Text style={styles.gridLabel}>Money Spent</Text>
              <Text style={styles.gridValue}>{stats?.moneySpent}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Benefits of Quitting Now</Text>

          <View style={styles.gridContainer}>
            <View style={styles.gridBox}>
              <Image style={styles.gridIcon} source={Images.HEART} />
              <Text style={styles.gridLabel}>Potential Longevity Benefit</Text>
              <Text style={styles.gridValue}>{stats?.yearsSaved}</Text>
            </View>

            <View style={styles.gridBox}>
              <Image style={styles.gridIcon} source={Images.PIGIBACK} />
              <Text style={styles.gridLabel}>Money Saved</Text>
              <Text style={styles.gridValue}>{stats?.moneySaved}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

const createStyles = c => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.card,
  },
  container: {
    padding: wp(4),
    paddingBottom: hp(16),
    backgroundColor: c.surface,
  },
  box: {
    backgroundColor: c.mutedSurface,
    padding: wp(4),
    borderRadius: 12,
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: c.border,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWatch: {
    resizeMode: 'contain',
    width: wp(5),
    height: hp(3),
    tintColor: c.primary,
  },
  iconTrophy: {
    resizeMode: 'contain',
    width: wp(9),
    height: hp(3.5),
  },
  daysText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    marginLeft: hp(1),
    color: c.text,
    letterSpacing: 0.2,
  },
  inputRow: {
    paddingVertical: hp(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
    flexWrap: 'wrap',
  },
  label: {
    fontFamily: 'Poppins-Regular',
    flex: 1,
    fontSize: 15,
    color: c.onboardingSubtitle,
    marginRight: wp(3),
    letterSpacing: 0.2,
  },
  inputSmall: {
    backgroundColor: c.card,
    borderRadius: 10,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    width: wp(17),
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    color: c.text,
    borderWidth: 1,
    borderColor: c.border,
  },
  logSubmitButton: {
    alignSelf: 'flex-end',
    marginTop: hp(1),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    backgroundColor: c.primary,
    borderRadius: 10,
  },
  levelRow: {
    marginTop: hp(1.5),
  },
  levelText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.text,
    letterSpacing: 0.2,
  },
  quoteBox: {
    borderLeftWidth: 4,
    borderLeftColor: c.quoteBorder,
    backgroundColor: c.quoteBg,
    padding: wp(4),
    borderRadius: 12,
    marginBottom: hp(2),
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: c.border,
  },
  quote: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: c.quoteText,
    letterSpacing: 0.2,
    fontWeight: '600',
    lineHeight: 22,
  },
  challengeBox: {
    backgroundColor: c.mutedSurface,
    padding: wp(4),
    borderRadius: 12,
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: c.border,
    ...(Platform.OS === 'android' && { elevation: 1 }),
  },
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: c.primary,
    marginBottom: hp(1.5),
    letterSpacing: 0.2,
  },
  sectionTitleAccent: {
    fontFamily: 'Poppins-Regular',
    fontSize: 20,
    color: c.primary,
    marginBottom: hp(1),
    letterSpacing: 0.2,
  },
  sectionTitleDark: {
    fontFamily: 'Poppins-Regular',
    fontSize: 18,
    color: c.text,
    marginBottom: hp(1),
    letterSpacing: 0.2,
  },
  challengeSubText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 18,
    color: c.text,
    paddingVertical: hp(1),
    marginBottom: hp(0.5),
    letterSpacing: 0.2,
  },
  detailText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: c.onboardingSubtitle,
    letterSpacing: 0.2,
  },
  profileBox: {
    backgroundColor: c.mutedSurface,
    padding: wp(4),
    borderRadius: 12,
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: c.border,
  },
  inputLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.onboardingSubtitle,
    marginTop: hp(1.2),
    marginBottom: hp(0.5),
    letterSpacing: 0.2,
  },
  inputLabelSpaced: {
    marginVertical: hp(2),
  },
  input: {
    fontFamily: 'Poppins-Regular',
    backgroundColor: c.card,
    borderRadius: 10,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.2),
    color: c.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: c.border,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  gridBox: {
    flex: 1,
    backgroundColor: c.card,
    padding: wp(4),
    borderRadius: 12,
    marginRight: wp(2),
    borderWidth: 1,
    borderColor: c.border,
  },
  gridIcon: {
    resizeMode: 'contain',
    width: wp(5),
    height: hp(4),
    alignSelf: 'flex-start',
  },
  gridLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.onboardingSubtitle,
    paddingVertical: hp(1),
    letterSpacing: 0.2,
  },
  gridValue: {
    fontFamily: 'Poppins-Regular',
    fontSize: 20,
    color: c.text,
    letterSpacing: 0.2,
  },
  gridValueRed: {
    fontFamily: 'Poppins-Regular',
    fontSize: 20,
    color: '#DC2626',
    letterSpacing: 0.2,
  },
  reassessButton: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
    borderRadius: 10,
    marginVertical: hp(2),
    paddingVertical: hp(1.2),
  },
  reassessText: {
    fontFamily: 'Poppins-Medium',
    color: c.onPrimary,
    fontSize: 14,
    letterSpacing: 0.2,
  },
});

export default Tobacco;
