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

const ProgressBarWithImage = ({ navigation, data }) => {
  console.log('ProgressBar data:', data);
  const progress = data?.periods?.[0]?.value || 0;
  const progressBarWidth = 300;
  const animatedLeft = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const targetLeft = (progress / 100) * progressBarWidth;

    Animated.timing(animatedLeft, {
      toValue: targetLeft,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Score')}
      style={styles.container}
    >
      <View style={styles.labelRow}>
        <Text style={styles.label}>Aug '24</Text>
        <Text style={styles.label}>Dec '24</Text>
        <Text style={styles.label}>{data?.periods?.[0]?.month}</Text>
      </View>

      <View style={{ alignItems: 'center' }}>
        <View style={styles.progressContainer}>
          <LinearGradient
            colors={['#d5393c', '#f0b323', '#30c96d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBar, { width: progressBarWidth }]}
          />
        </View>

        <Animated.View
          style={{
            position: 'absolute',
            bottom: hp(2.5),
            zIndex: 1000,
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            backgroundColor: '#FFFFFF',
            borderRadius: hp(5),
            padding: hp(0.5),
            left: animatedLeft,
          }}
        >
          <TouchableOpacity onPress={() => navigation.navigate('Score')}>
            <Image
              source={images.UNCLE}
              style={{
                height: hp(3),
                width: hp(3),
                borderRadius: hp(3),
                resizeMode: 'cover',
              }}
            />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={{
            flexDirection: 'row',
            position: 'absolute',
            bottom: hp(2.5),
            alignItems: 'center',
            zIndex: 1000,
            height: hp(4),
            width: hp(6),
            borderRadius: hp(5),
            padding: hp(0.5),
            left: animatedLeft,
            top: hp(2),
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('Score')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: -hp(1),
            }}
          >
            <Image
              source={images.FLAG}
              style={{
                width: 14,
                height: 14,
                marginRight: 4,
                resizeMode: 'contain',
              }}
            />
            <Text style={styles.percentText}>{Math.round(progress)}</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.percentRow}>
          <Text style={styles.percentText}>0%</Text>
          <Text style={styles.percentText}>100%</Text>
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
    fontFamily: 'Roboto-Regular',
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    position: 'relative',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
  },
  profileImage: {
    right: -13,
    resizeMode: 'contain',
    position: 'absolute',
    margin: 0,
    width: hp(3.5),
    height: hp(3.5),
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    bottom: -9,
    zIndex: 100,
  },
  percentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    width: wp(80),
  },
  percentText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  centerIndicator: {
    marginHorizontal: hp(12),
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ProgressBarWithImage;
