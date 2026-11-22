import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';
import GaugeMeter from '../../components/SpeedpMeter';
import { useSelector, useDispatch } from 'react-redux';
import { getMind } from '../../redux/slices';
import ApiErrorFallback from '../../components/ApiError';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeroHeader from '../../components/ui/HeroHeader';
import { Sun, Moon, Pencil, Brain } from 'lucide-react-native';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';
import SkeletonBox from '../../components/SkeletonBox';

const MindSkeleton = ({ onBack }) => (
  <View style={{ flex: 1, backgroundColor: '#F4F7FB' }}>
    <HeroHeader title="Sleep & Stress" subtitle="Your sleep, stress and calm-mind routines." onBack={onBack} />
    <ScrollView scrollEnabled={false} style={{ backgroundColor: '#F9FAFB' }} contentContainerStyle={{ padding: wp(4) }}>
      {/* Score gauges */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: hp(2) }}>
        <View style={{ alignItems: 'center', gap: hp(1) }}>
          <SkeletonBox width={wp(32)} height={wp(20)} borderRadius={wp(16)} />
          <SkeletonBox width={80} height={14} borderRadius={6} />
        </View>
        <View style={{ alignItems: 'center', gap: hp(1) }}>
          <SkeletonBox width={wp(32)} height={wp(20)} borderRadius={wp(16)} />
          <SkeletonBox width={80} height={14} borderRadius={6} />
        </View>
      </View>
      {/* Reassess button */}
      <SkeletonBox width={wp(50)} height={40} borderRadius={8} style={{ alignSelf: 'center', marginVertical: hp(2) }} />
      {/* Reflection card */}
      <SkeletonBox width="100%" height={70} borderRadius={8} style={{ marginBottom: hp(2) }} />
      {/* Section title */}
      <SkeletonBox width={220} height={18} borderRadius={6} style={{ marginBottom: hp(1) }} />
      {/* Horizontal cards */}
      <View style={{ flexDirection: 'row', gap: wp(2), marginBottom: hp(2) }}>
        <SkeletonBox width={wp(50)} height={hp(12)} borderRadius={8} />
        <SkeletonBox width={wp(50)} height={hp(12)} borderRadius={8} />
      </View>
      {/* Second section */}
      <SkeletonBox width={200} height={18} borderRadius={6} style={{ marginBottom: hp(1) }} />
      <View style={{ flexDirection: 'row', gap: wp(2) }}>
        <SkeletonBox width={wp(50)} height={hp(12)} borderRadius={8} />
        <SkeletonBox width={wp(50)} height={hp(12)} borderRadius={8} />
      </View>
    </ScrollView>
  </View>
);

const COLOR_SCHEMES = [
  { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' },
  { borderColor: '#99F6E4', backgroundColor: '#F0FDFA' },
  { borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' },
  { borderColor: '#A5F3FC', backgroundColor: '#ECFEFF' },
];

const Mind = ({ navigation }) => {
  const dispatch = useDispatch();
  useLightStatusBar();
  const [refreshing, setRefreshing] = useState(false);

  const userId = useSelector(state => state.auth.userId);
  const { data, loading, error } = useSelector(state => state.mind);
  const role = useSelector(state => state.auth.role);

  const morning = data?.data?.morningHarmony;
  const evening = data?.data?.quietMind;

  useEffect(() => {
    if (userId && !data) {
      dispatch(getMind(userId));
    }
  }, [userId, dispatch, data]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (userId) {
        await dispatch(getMind(userId));
      }
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, userId]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleReassess = useCallback(() => {
    navigation.navigate('OnBoarding', {
      STEP: 6,
      screen: 'Reassess',
      navigateTo: 'Mind',
    });
  }, [navigation]);

  const handleCardPress = useCallback(
    item => {
      console.log('item', item);
      navigation.navigate('MindDetails', {
        instructions: item?.instructions,
        audio: item?.audioUrl,
        title: item?.title,
      });
    },
    [navigation],
  );

  const renderActivityCard = useCallback(
    (item, index) => {
      const scheme = COLOR_SCHEMES[index % COLOR_SCHEMES.length];
      return (
        <TouchableOpacity
          key={index}
          onPress={() => handleCardPress(item)}
          style={[
            styles.activityCard,
            {
              borderColor: scheme.borderColor,
              backgroundColor: scheme.backgroundColor,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text style={styles.cardTitle}>{item?.title}</Text>
          <Text style={styles.cardDesc}>{item?.subtitle}</Text>
        </TouchableOpacity>
      );
    },
    [handleCardPress],
  );

  if (!data) {
    return <MindSkeleton onBack={handleGoBack} />;
  }

  if (error && !data) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ApiErrorFallback
          message="Unable to load mind data. Please try again."
          onRetry={onRefresh}
        />
      </SafeAreaView>
    );
  }

  if (!morning && !evening) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ApiErrorFallback
          message="No meditation data available at the moment."
          onRetry={onRefresh}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safeArea}>
      <HeroHeader
        title="Sleep & Stress"
        subtitle="Your sleep, stress and calm-mind routines."
        onBack={handleGoBack}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1E64AC"
          />
        }
      >
        <View style={styles.scoreContainer}>
          <View style={styles.scoreBox}>
            <GaugeMeter
              size={wp(32)}
              value={data?.data?.sleepScore}
              thickness={15}
            />
            <Text style={styles.scoreLabel}>Sleep Score</Text>
          </View>
          <View style={styles.scoreBox}>
            <GaugeMeter
              size={wp(32)}
              value={data?.data?.stressScore}
              thickness={15}
            />
            <Text style={styles.scoreLabel}>Stress Score</Text>
          </View>
        </View>

        <TouchableOpacity
          disabled={role === 'caregiver'}
          onPress={handleReassess}
          style={[
            styles.reassessButton,
            role === 'caregiver' && styles.reassessButtonDisabled,
          ]}
          activeOpacity={0.7}
        >
          <Pencil size={16} color="#FFFFFF" />
          <Text style={styles.reassessText}>Re-assess</Text>
        </TouchableOpacity>

        <View style={styles.reflectionCard}>
          <View style={styles.brainTile}>
            <Brain size={18} color="#7C3AED" />
          </View>
          <View style={styles.reflectionContent}>
            <Text style={styles.reflectionTitle}>Mindful Reflections</Text>
            <Text style={styles.reflectionQuote}>
              Let go of what was. Surrender to what is. {'\n'}Have faith in what
              will be.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconTile}>
            <Sun size={16} color="#B45309" />
          </View>
          <Text style={styles.sectionTitle}>Morning Calm, Mental Clarity</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {morning?.map((item, index) => renderActivityCard(item, index))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconTile, styles.sectionIconTileNight]}>
            <Moon size={16} color="#1E64AC" />
          </View>
          <Text style={styles.sectionTitle}>Quiet Mind, Restful Night</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {evening?.map((item, index) => renderActivityCard(item, index))}
        </ScrollView>

        <Text style={styles.footerNote}>
          Stick to one meditation for 21 days to unlock deeper benefits
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  brainTile: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  sectionIconTileNight: { backgroundColor: '#DBEAFE' },
  sectionIconTile: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  safeArea: { flex: 1, backgroundColor: '#F4F7FB' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontFamily: 'Poppins-Regular',
    marginTop: hp(2),
    fontSize: 16,
    color: '#64748B',
    letterSpacing: 0.2,
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: hp(1),
    alignItems: 'center',
    marginBottom: hp(1),
  },
  backButton: {
    paddingHorizontal: hp(1),
    marginTop: hp(1),
  },
  backIcon: {
    resizeMode: 'contain',
    height: hp(3.5),
    width: wp(4),
  },
  title: {
    fontFamily: 'Poppins-Medium',
    marginTop: hp(1),
    marginLeft: hp(11),
    fontSize: 20,
    alignSelf: 'center',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  scrollContent: { padding: wp(4), paddingBottom: hp(8) },
  scoreContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingVertical: hp(2) },
  scoreBox: {
    alignItems: 'center',
  },
  scoreLabel: { fontFamily: 'Poppins-SemiBold', marginTop: hp(0.5), fontSize: 14, color: '#0F172A' },
  reassessButton: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E64AC', paddingVertical: 13, borderRadius: 14, marginVertical: hp(2) },
  reassessButtonDisabled: {
    opacity: 0.5,
  },
  editIcon: {
    resizeMode: 'contain',
    width: wp(4),
    height: hp(4),
    tintColor: '#FFFFFF',
  },
  reassessText: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 15, marginLeft: 8 },
  reflectionCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 16, borderRadius: 16, marginBottom: hp(1) },
  brainIcon: {
    resizeMode: 'contain',
    width: wp(4),
    height: hp(2),
  },
  reflectionContent: { marginLeft: 12, flex: 1 },
  reflectionTitle: { fontFamily: 'Poppins-SemiBold', color: '#0F172A', fontSize: 15, marginBottom: 4 },
  reflectionQuote: { fontFamily: 'Poppins-Regular', fontSize: 14, color: '#475569', lineHeight: 21 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: hp(2.5), marginBottom: hp(1.2) },
  sectionIcon: {
    resizeMode: 'contain',
    width: wp(4),
    height: hp(2),
    marginLeft: hp(-1.8),
    tintColor: '#FFFFFF',
  },
  sectionTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: '#0F172A', flex: 1 },
  horizontalScroll: {
    paddingRight: wp(4),
  },
  activityCard: { borderWidth: 1, padding: 14, minHeight: hp(12), width: wp(50), borderRadius: 16, marginRight: wp(2.5) },
  cardTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#0F172A', marginBottom: 2 },
  cardDesc: { fontFamily: 'Poppins-Regular', fontSize: 13, marginTop: 4, color: '#475569' },
  footerNote: { fontFamily: 'Poppins-Medium', textAlign: 'center', fontSize: 14, color: '#64748B', marginTop: hp(3), marginBottom: hp(5) },
});

export default Mind;
