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
} from 'react-native';
import { hp, wp, Images } from '../../utilities';
import GaugeMeter from '../../components/SpeedpMeter';
import { useSelector, useDispatch } from 'react-redux';
import { getMind } from '../../redux/slices';
import ApiErrorFallback from '../../components/ApiError';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLOR_SCHEMES = [
  {
    borderColor: '#3B82F6',
    backgroundColor: '#D8E0E8',
  },
  {
    borderColor: '#14B8A6',
    backgroundColor: '#D8E0E7',
  },
  {
    borderColor: '#A855F7',
    backgroundColor: '#F0FDFA',
  },
  {
    borderColor: '#06B6D4',
    backgroundColor: '#ECFEFF',
  },
];

const Mind = ({ navigation }) => {
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
              borderWidth: 1.5,
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

  if (loading && !data) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E64AC" />
          <Text style={styles.loadingText}>Loading your mind data...</Text>
        </View>
      </SafeAreaView>
    );
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
          <Image source={Images.SUN} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>
            ☀️ Morning Calm, Mental Clarity
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {morning?.map((item, index) => renderActivityCard(item, index))}
        </ScrollView>

        <Text style={styles.sectionTitle}>🌙 Quiet Mind, Restful Night</Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontFamily: 'Roboto-Regular',
    marginTop: hp(2),
    fontSize: 16,
    color: '#4B5563',
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
    fontFamily: 'Roboto-Regular',
    marginTop: hp(1),
    marginLeft: hp(11),
    fontSize: 20,
    fontWeight: '400',
    alignSelf: 'center',
    color: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: wp(4),
    paddingBottom: hp(8),
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
    fontFamily: 'Roboto-Regular',
    marginTop: hp(0.5),
    fontSize: wp(4),
    color: '#374151',
  },
  reassessButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E64AC',
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(4),
    borderRadius: wp(2),
    marginVertical: hp(2),
    minWidth: wp(50),
  },
  reassessButtonDisabled: {
    opacity: 0.5,
  },
  editIcon: {
    resizeMode: 'contain',
    width: wp(4),
    height: hp(4),
    tintColor: 'white',
  },
  reassessText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    marginLeft: wp(1),
  },
  reflectionCard: {
    borderLeftWidth: 4,
    borderColor: '#DEA1D7',
    flexDirection: 'row',
    backgroundColor: '#F2E3F2',
    padding: hp(1),
    borderRadius: wp(2),
    marginBottom: hp(2),
  },
  brainIcon: {
    resizeMode: 'contain',
    width: wp(4),
    height: hp(2),
  },
  reflectionContent: {
    marginLeft: hp(2),
    flex: 1,
  },
  reflectionTitle: {
    fontFamily: 'Roboto-Regular',
    color: '#1E64AC',
    fontWeight: '400',
    fontSize: 16,
    marginBottom: hp(0.5),
  },
  reflectionQuote: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    fontSize: 15,
    color: '#374151',
    lineHeight: hp(2.5),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1),
  },
  sectionIcon: {
    resizeMode: 'contain',
    width: wp(4),
    height: hp(2),
    marginLeft: hp(-1.8),
    tintColor: 'white',
  },
  sectionTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 18,
    fontWeight: '400',
    color: '#1E64AC',
    marginBottom: hp(1),
    marginLeft: hp(0.5),
    marginTop: hp(2),
  },
  horizontalScroll: {
    paddingRight: wp(4),
  },
  activityCard: {
    backgroundColor: '#EAF5FF',
    padding: hp(1.5),
    height: hp(12),
    width: wp(50),
    borderRadius: wp(2),
    marginRight: wp(2),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardTitle: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    fontSize: 14,
    color: '#111827',
    marginBottom: hp(0.5),
  },
  cardDesc: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    fontSize: 14,
    marginTop: hp(1),
    color: '#4B5563',
  },
  footerNote: {
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    fontSize: 16,
    color: '#1E64AC',
    marginTop: hp(2),
    marginBottom: hp(5),
    fontWeight: '400',
  },
});

export default Mind;
