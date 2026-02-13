import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import images from '../../utilities/Images';
import { hp, wp } from '../../utilities';
import { useSelector } from 'react-redux';

const IMAGE_SIZE = hp(3);
const PROGRESS_BAR_WIDTH = 300;

const ProgressBarWithImage = ({ navigation, data }) => {
  const progress = data?.periods?.[0]?.value || 0;
  const animatedLeft = useRef(new Animated.Value(0)).current;

  // ✅ profile image
  const profileImage = useSelector(
    state =>
      state?.profile?.data?.data?.user?.photo_url ||
      state?.profile?.data?.data?.user?.photoUrl
  );

  const profileImageSource = profileImage
    ? { uri: profileImage }
    : images.UNCLE;

  useEffect(() => {
    const targetLeft =
      (progress / 100) * (PROGRESS_BAR_WIDTH - IMAGE_SIZE);

    Animated.timing(animatedLeft, {
      toValue: targetLeft,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedLeft]);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('Score')}
    >
      {/* Labels */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {data?.periods?.[0]?.programTimeline?.startMonth}
        </Text>
        <Text style={styles.centerLabel}>Your Journey</Text>
        <Text style={styles.label}>
          {data?.periods?.[0]?.programTimeline?.targetMonth}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressWrapper}>
        <View style={styles.progressContainer}>
          <LinearGradient
            colors={['#EF4444', '#F59E0B', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBar, { width: PROGRESS_BAR_WIDTH }]}
          />
        </View>

        {/* ✅ SINGLE animated indicator */}
        <Animated.View
          style={[
            styles.indicatorContainer,
            { left: animatedLeft },
          ]}
        >
          <View style={styles.profileImageWrapper}>
            <Image
              source={profileImageSource}
              style={styles.profileImage}
            />
          </View>
          <View style={styles.percentBadge}>
            <Text style={styles.percentBadgeText}>
              {Math.round(progress)}%
            </Text>
          </View>
        </Animated.View>

        {/* Percent row */}
        <View style={styles.percentRow}>
          <Text style={styles.percentText}>0%</Text>
          <Text style={styles.goalText}>{data?.goal}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: hp(2),
    marginHorizontal: hp(2.5),
    paddingHorizontal: hp(2),
    paddingVertical: hp(2),
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 3 },
    }),
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: hp(2),
    paddingHorizontal: hp(0.5),
  },
  label: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    letterSpacing: 0.2,
  },
  centerLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  progressWrapper: {
    alignItems: 'center',
    marginTop: hp(1),
  },
  progressContainer: {
    height: 14,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 1 },
    }),
  },
  progressBar: {
    height: 14,
    borderRadius: 20,
  },
  indicatorContainer: {
    position: 'absolute',
    top: -hp(2.5),
    alignItems: 'center',
  },
  profileImageWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderRadius: IMAGE_SIZE / 2,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 4 },
    }),
  },
  profileImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#F8FAFC',
  },
  percentBadge: {
    marginTop: 4,
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 3 },
    }),
  },
  percentBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  percentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(2.5),
    width: wp(80),
    paddingHorizontal: hp(0.5),
  },
  percentText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    letterSpacing: 0.2,
  },
  goalText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#10B981',
    letterSpacing: 0.2,
  },
});

export default ProgressBarWithImage;
