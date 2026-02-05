import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
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
        <Text style={styles.label}>
          {data?.periods?.[0]?.programTimeline?.targetMonth}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={{ alignItems: 'center' }}>
        <View style={styles.progressContainer}>
          <LinearGradient
            colors={['#d5393c', '#f0b323', '#30c96d']}
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
          <Image
            source={profileImageSource}
            style={styles.profileImage}
          />
          <Text style={styles.percentText}>
            {Math.round(progress)}%
          </Text>
        </Animated.View>

        {/* Percent row */}
        <View style={styles.percentRow}>
          <Text style={styles.percentText}>0%</Text>
          <Text style={styles.percentText}>{data?.goal}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 15,
    paddingHorizontal: hp(2),
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  progressContainer: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
  },
  indicatorContainer: {
    position: 'absolute',
    top: -hp(2),
    alignItems: 'center',
  },
  profileImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    borderWidth: 2,
    borderColor: '#FFF',
    backgroundColor: '#FFF',
  },
  percentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    width: wp(80),
  },
  percentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 4,
  },
});

export default ProgressBarWithImage;
