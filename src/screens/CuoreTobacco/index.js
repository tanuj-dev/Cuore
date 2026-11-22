import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { hp, wp } from '../../utilities';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';
import {
  Clock,
  Trophy,
  Quote,
  Hourglass,
  Wallet,
  HeartPulse,
  PiggyBank,
} from 'lucide-react-native';
import ToastMessage from '../../components/Toast';
import { useSelector, useDispatch } from 'react-redux';
import {
  getTobacco,
  updateTobaccoProfile,
  logTobaccoUsage,
} from '../../redux/slices';
import SkeletonBox from '../../components/SkeletonBox';

const TobaccoSkeleton = ({ onBack }) => (
  <View style={{ flex: 1, backgroundColor: '#F4F7FB' }}>
    <HeroHeader title="Cuore Habits" subtitle="Track habit-free days and what you gain." onBack={onBack} />
    <ScrollView
      scrollEnabled={false}
      contentContainerStyle={{
        padding: wp(4),
        backgroundColor: '#F8FAFC',
        gap: hp(2),
      }}
    >
      {/* Main box */}
      <View
        style={{
          backgroundColor: '#F1F5F9',
          padding: wp(4),
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          gap: hp(2),
        }}
      >
        <SkeletonBox width={160} height={16} />
        <SkeletonBox width="100%" height={50} borderRadius={10} />
        <SkeletonBox
          width={80}
          height={36}
          borderRadius={10}
          style={{ alignSelf: 'flex-end' }}
        />
        <SkeletonBox width={100} height={16} />
      </View>
      {/* Quote box */}
      <SkeletonBox width="100%" height={56} borderRadius={12} />
      {/* Challenge box */}
      <View
        style={{
          backgroundColor: '#F1F5F9',
          padding: wp(4),
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          gap: hp(1.5),
        }}
      >
        <SkeletonBox width={160} height={20} />
        <SkeletonBox width="90%" height={18} borderRadius={6} />
        <SkeletonBox width="70%" height={16} borderRadius={6} />
      </View>
      {/* Profile box */}
      <View
        style={{
          backgroundColor: '#E2E8F0',
          padding: wp(4),
          borderRadius: 12,
          gap: hp(1.5),
        }}
      >
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

const NUDGES = [
  'Pay attention to each moment. Is the experience as enjoyable as the anticipation?',
  'Noticing a trigger is the first step to changing it.',
  'Stress and habit are connected by routine, not by need.',
  'The habit relieves withdrawal, not stress.',
  "The habit didn't create relief. It ended a craving.",
  'Notice the difference between wanting and needing.',
  'The urge will pass whether you act on it or not.',
  'Most cravings pass in minutes, not hours.',
  'Cravings become easier to manage when they are understood.',
  'The pause is where freedom begins.',
  'Freedom grows with every conscious choice.',
  'Every habit starts with a thought.',
  'Notice how many people enjoy the moment without it.',
  'Social confidence comes from you, not the habit.',
  "The goal isn't resisting forever. It's not needing it anymore.",
];

const getRandomNudge = () => NUDGES[Math.floor(Math.random() * NUDGES.length)];

const Tobacco = ({ navigation }) => {
  useLightStatusBar();
  const [yesterdayCount, setYesterdayCount] = useState('');
  const [cigarettesPerDay, setCigarettesPerDay] = useState(0);
  const [yearsOfSmoking, setYearsOfSmoking] = useState(0);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentNudge, setCurrentNudge] = useState(getRandomNudge);
  const hasSyncedFromProfile = useRef(false);

  const data = useSelector(state => state.tobacco.data?.data);

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
  const dailyChalanges = useSelector(
    state => state.tobacco.data?.data?.allChallenges,
  );
  const userId = useSelector(state => state.auth.userId);
  const profileData = data?.profile;
  console.log('profileData', profileData);
  const stats = data?.stats;
  console.log('Tobacco Profile Data from Redux:', profileData);

  const dispatch = useDispatch();

  useEffect(() => {
    if (userId && !data) {
      dispatch(getTobacco(userId));
    }
  }, [dispatch, userId, data]);

  const tobaccoLoading = useSelector(state => state.tobacco.loading);

  if (!data) {
    return <TobaccoSkeleton onBack={() => navigation.goBack()} />;
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
    console.log('handleLogUsage triggered');
    setLoading(true);
    const count =
      yesterdayCount !== '' && yesterdayCount !== undefined
        ? Number(yesterdayCount)
        : 0;
    const res = await dispatch(logTobaccoUsage({ userId, count })).unwrap();
    console.log('logTobaccoUsage response:', res);
    if (res.status === 'success') {
      setToast('Usage logged successfully');
      dispatch(getTobacco(userId));
    }
    setLoading(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentNudge(getRandomNudge());
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
        <HeroHeader
          title="Cuore Habits"
          subtitle="Track habit-free days and what you gain."
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.box}>
            <View style={styles.boxTop}>
              <View style={styles.rowCenter}>
                <View style={styles.iconTile}>
                  <Clock size={18} color="#1E64AC" />
                </View>
                <Text style={styles.daysText}>
                  {profileData?.tobaccoFreeDays} habit-free days
                </Text>
              </View>
              <View style={styles.levelPill}>
                <Trophy size={14} color="#B45309" />
                <Text style={styles.levelText}>
                  Level {profileData?.currentLevel}
                </Text>
              </View>
            </View>

            <Text style={styles.label}>
              Enter the number of units used yesterday
            </Text>
            <View style={styles.logRow}>
              <TextInput
                style={styles.inputSmall}
                keyboardType="numeric"
                value={String(yesterdayCount)}
                onChangeText={setYesterdayCount}
                placeholder="0"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity
                style={styles.logSubmitButton}
                onPress={() => handleLogUsage()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.reassessText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.quoteBox}>
            <Quote size={18} color="#1E64AC" />
            <Text style={styles.quote}>{currentNudge}</Text>
          </View>

          <View style={styles.challengeBox}>
            <Text style={styles.sectionTitleAccent}>Next Level Challenge</Text>
            <Text style={styles.challengeSubText}>
              {dailyChalanges
                ? dailyChalanges[data?.currentLevel]?.challengeText
                : null}
            </Text>
            <Text style={styles.detailText}>
              {dailyChalanges
                ? dailyChalanges[data?.currentLevel]?.challengeText2
                : null}
            </Text>
          </View>

          <View style={styles.profileBox}>
            <Text style={styles.sectionTitleDark}>Your Habit Profile</Text>

            <Text style={styles.inputLabel}>Units per day</Text>
            <TextInput
              placeholderTextColor="#64748B"
              placeholder="Enter the count"
              style={styles.input}
              keyboardType="numeric"
              value={cigarettesPerDay}
              onChangeText={setCigarettesPerDay}
            />

            <Text style={[styles.inputLabel, styles.inputLabelSpaced]}>
              Years of use
            </Text>
            <TextInput
              placeholder="Num of years"
              placeholderTextColor="#64748B"
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
                <ActivityIndicator size="small" color="#FFFFFF" />
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
              <View style={[styles.gridIcon, { backgroundColor: '#FEE2E2' }]}>
                <Hourglass size={18} color="#DC2626" />
              </View>
              <Text style={styles.gridLabel}>Estimated Longevity Impact</Text>
              <Text style={styles.gridValueRed}>{stats?.yearsLost}</Text>
            </View>

            <View style={styles.gridBox}>
              <View style={[styles.gridIcon, { backgroundColor: '#FEF3C7' }]}>
                <Wallet size={18} color="#B45309" />
              </View>
              <Text style={styles.gridLabel}>Money Spent</Text>
              <Text style={styles.gridValue}>{stats?.moneySpent}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Benefits of Stopping Now</Text>

          <View style={styles.gridContainer}>
            <View style={styles.gridBox}>
              <View style={[styles.gridIcon, { backgroundColor: '#D1FAE5' }]}>
                <HeartPulse size={18} color="#059669" />
              </View>
              <Text style={styles.gridLabel}>Potential Longevity Benefit</Text>
              <Text style={styles.gridValue}>{stats?.yearsSaved}</Text>
            </View>

            <View style={styles.gridBox}>
              <View style={[styles.gridIcon, { backgroundColor: '#DBEAFE' }]}>
                <PiggyBank size={18} color="#1E64AC" />
              </View>
              <Text style={styles.gridLabel}>Money Saved</Text>
              <Text style={styles.gridValue}>{stats?.moneySaved}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  iconTile: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  boxTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  container: { padding: wp(4), paddingBottom: hp(6), backgroundColor: '#F4F7FB' },
  box: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: hp(2), borderWidth: 1, borderColor: '#E2E8F0' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  daysText: { fontFamily: 'Poppins-SemiBold', fontSize: 15, marginLeft: 10, color: '#0F172A', flexShrink: 1 },
  label: { fontFamily: 'Poppins-Medium', fontSize: 13, color: '#64748B', marginBottom: 8 },
  inputSmall: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Poppins-Medium', fontSize: 15, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0' },
  logSubmitButton: { paddingHorizontal: 20, paddingVertical: 13, backgroundColor: '#1E64AC', borderRadius: 12, minWidth: 96, alignItems: 'center' },
  levelText: { fontFamily: 'Poppins-SemiBold', fontSize: 12, color: '#B45309' },
  quoteBox: { flexDirection: 'row', gap: 10, backgroundColor: '#EFF6FF', padding: 16, borderRadius: 16, marginBottom: hp(2), borderWidth: 1, borderColor: '#BFDBFE' },
  quote: { flex: 1, fontFamily: 'Poppins-Medium', fontSize: 14.5, lineHeight: 22, color: '#1E3A8A' },
  challengeBox: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: hp(2), borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: '#0F172A', marginTop: 4, marginBottom: 12 },
  sectionTitleAccent: { fontFamily: 'Poppins-SemiBold', fontSize: 12, color: '#1E64AC', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  sectionTitleDark: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: '#0F172A', marginBottom: 4 },
  challengeSubText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, lineHeight: 23, color: '#0F172A', marginBottom: 6 },
  detailText: { fontFamily: 'Poppins-Regular', fontSize: 14, lineHeight: 21, color: '#475569' },
  profileBox: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: hp(2), borderWidth: 1, borderColor: '#E2E8F0' },
  inputLabel: { fontFamily: 'Poppins-Medium', fontSize: 13, color: '#64748B', marginTop: 12, marginBottom: 6 },
  inputLabelSpaced: { marginTop: 14 },
  input: { fontFamily: 'Poppins-Regular', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#0F172A', fontSize: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  gridContainer: { flexDirection: 'row', gap: 12, marginBottom: hp(2) },
  gridBox: { flex: 1, backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  gridIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  gridLabel: { fontFamily: 'Poppins-Medium', fontSize: 12.5, lineHeight: 18, color: '#64748B', marginTop: 10, marginBottom: 4 },
  gridValue: { fontFamily: 'Poppins-SemiBold', fontSize: 18, color: '#0F172A' },
  gridValueRed: { fontFamily: 'Poppins-SemiBold', fontSize: 18, color: '#DC2626' },
  reassessButton: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E64AC', borderRadius: 12, marginTop: 16, paddingVertical: 13 },
  reassessText: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 14 },
});

export default Tobacco;
