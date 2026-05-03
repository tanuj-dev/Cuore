import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
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
import SkeletonBox from '../../components/SkeletonBox';

const MindSkeleton = () => {
  const { colors: c } = useAppTheme();
  return (
  <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
    {/* Header */}
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: hp(2), paddingVertical: hp(1), backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border }}>
      <SkeletonBox width={wp(4)} height={hp(3.5)} borderRadius={4} />
      <SkeletonBox width={140} height={20} borderRadius={6} style={{ marginLeft: hp(10) }} />
    </View>
    <ScrollView scrollEnabled={false} style={{ backgroundColor: c.surface }} contentContainerStyle={{ padding: wp(4) }}>
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
  </SafeAreaView>
  );
};

const LIGHT_ACTIVITY_SCHEMES = [
  { borderColor: '#11418A', backgroundColor: '#E8EEF7' },
  { borderColor: '#0F766E', backgroundColor: '#CCFBF1' },
  { borderColor: '#7C3AED', backgroundColor: '#EDE9FE' },
  { borderColor: '#0891B2', backgroundColor: '#CFFAFE' },
];

const DARK_ACTIVITY_SCHEMES = [
  { borderColor: 'rgba(96,165,250,0.9)', backgroundColor: 'rgba(59,130,246,0.14)' },
  { borderColor: 'rgba(45,212,191,0.9)', backgroundColor: 'rgba(20,184,166,0.16)' },
  { borderColor: 'rgba(167,139,250,0.9)', backgroundColor: 'rgba(139,92,246,0.14)' },
  { borderColor: 'rgba(34,211,238,0.9)', backgroundColor: 'rgba(6,182,212,0.14)' },
];

const isSubtitleRedundant = (title, subtitle) => {
  const t = (title || '').trim().toLowerCase();
  const s = (subtitle || '').trim().toLowerCase();
  if (!s) return true;
  if (s === t) return true;
  if (t.endsWith(` ${s}`) || t.endsWith(s)) return true;
  return false;
};

const Mind = ({ navigation }) => {
  const { colors: c, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const activitySchemes = useMemo(
    () => (isDark ? DARK_ACTIVITY_SCHEMES : LIGHT_ACTIVITY_SCHEMES),
    [isDark],
  );

  const dispatch = useDispatch();
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
      const scheme = activitySchemes[index % activitySchemes.length];
      const showSubtitle = !isSubtitleRedundant(item?.title, item?.subtitle);
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
          <View style={styles.activityCardInner}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item?.title}
            </Text>
            {showSubtitle ? (
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item?.subtitle}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    },
    [handleCardPress, styles, activitySchemes],
  );

  if (!data) {
    return <MindSkeleton />;
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
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Image source={Images.BACK_BUTTON} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.title}>Sleep & Stress</Text>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.primary}
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
          <Image source={Images.EDIT} style={styles.editIcon} />
          <Text style={styles.reassessText}>Re-assess</Text>
        </TouchableOpacity>

        <View style={styles.reflectionCard}>
          <Image source={Images.BRAIN} style={styles.brainIcon} />
          <View style={styles.reflectionContent}>
            <Text style={styles.reflectionTitle}>Mindful Reflections</Text>
            <Text style={styles.reflectionQuote}>
              Let go of what was. Surrender to what is. {'\n'}Have faith in what
              will be.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Image source={Images.SUN} style={styles.sectionSunIcon} />
          <Text style={styles.sectionTitle}>
            Morning Calm, Mental Clarity
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {morning?.map((item, index) => renderActivityCard(item, index))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Image source={Images.MOON} style={styles.sectionMoonIcon} />
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
    </SafeAreaView>
  );
};

const createStyles = c => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: c.surface,
  },
  loadingText: {
    fontFamily: 'Poppins-Regular',
    marginTop: hp(2),
    fontSize: 16,
    color: c.subText,
    letterSpacing: 0.2,
  },
  headerContainer: {
    backgroundColor: c.card,
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
    tintColor: c.navIconTint,
  },
  title: {
    fontFamily: 'Poppins-Medium',
    marginTop: hp(1),
    marginLeft: hp(11),
    fontSize: 20,
    alignSelf: 'center',
    color: c.text,
    letterSpacing: 0.2,
  },
  container: {
    flex: 1,
    backgroundColor: c.surface,
  },
  scrollContent: {
    padding: wp(4),
    paddingBottom: hp(16),
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: hp(2),
  },
  scoreBox: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontFamily: 'Poppins-Regular',
    marginTop: hp(0.5),
    fontSize: wp(4),
    color: c.onboardingSubtitle,
    letterSpacing: 0.2,
  },
  reassessButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: wp(2),
    marginVertical: hp(2),
    minWidth: wp(50),
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    ...(Platform.OS === 'android' && { elevation: 2 }),
  },
  reassessButtonDisabled: {
    opacity: 0.5,
  },
  editIcon: {
    resizeMode: 'contain',
    width: wp(4),
    height: hp(4),
    tintColor: c.onPrimary,
  },
  reassessText: {
    fontFamily: 'Poppins-Medium',
    color: c.onPrimary,
    fontSize: 14,
    marginLeft: wp(1),
    letterSpacing: 0.3,
  },
  reflectionCard: {
    borderLeftWidth: 4,
    borderLeftColor: c.quoteBorder,
    flexDirection: 'row',
    backgroundColor: c.quoteBg,
    padding: hp(1.5),
    borderRadius: wp(2),
    marginBottom: hp(2),
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: c.border,
    borderRightColor: c.border,
    borderBottomColor: c.border,
  },
  brainIcon: {
    resizeMode: 'contain',
    width: wp(4),
    height: hp(2),
    tintColor: c.quoteText,
  },
  reflectionContent: {
    marginLeft: hp(2),
    flex: 1,
  },
  reflectionTitle: {
    fontFamily: 'Poppins-Medium',
    color: c.quoteText,
    fontSize: 16,
    marginBottom: hp(0.5),
    letterSpacing: 0.2,
  },
  reflectionQuote: {
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: c.quoteText,
    lineHeight: hp(2.5),
    letterSpacing: 0.2,
    opacity: 0.92,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1),
  },
  /** Full-color PNGs — do not tint (tint caused a dark center “dot” on the sun). */
  sectionSunIcon: {
    resizeMode: 'contain',
    width: wp(6),
    height: hp(3),
    marginLeft: hp(-0.5),
    marginRight: hp(0.5),
  },
  sectionMoonIcon: {
    resizeMode: 'contain',
    width: wp(5.5),
    height: hp(2.8),
    marginLeft: hp(-0.5),
    marginRight: hp(0.5),
  },
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: c.primary,
    marginBottom: hp(1),
    marginLeft: hp(0.5),
    marginTop: hp(2),
    letterSpacing: 0.2,
  },
  horizontalScroll: {
    paddingRight: wp(4),
  },
  activityCard: {
    borderWidth: 1.5,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
    minHeight: hp(12),
    width: wp(50),
    borderRadius: wp(2),
    marginRight: wp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    ...(Platform.OS === 'android' && { elevation: 0.5 }),
  },
  activityCardInner: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 0,
  },
  cardTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: c.text,
    marginBottom: hp(0.4),
    letterSpacing: 0.2,
  },
  cardDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    marginTop: hp(0.4),
    color: c.onboardingSubtitle,
    letterSpacing: 0.2,
  },
  footerNote: {
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    fontSize: 16,
    color: c.primary,
    marginTop: hp(2),
    marginBottom: hp(5),
    letterSpacing: 0.2,
  },
});

export default Mind;
