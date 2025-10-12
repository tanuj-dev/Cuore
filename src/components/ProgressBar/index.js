import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import images from '../../utilities/Images';
import { hp } from '../../utilities';

const ProgressBarWithImage = ({ navigation, data }) => {
  console.log('ProgressBar data:', data);
  const progress = data?.periods?.value; // 54%
  const progressBarWidth = 300;
  const indicatorPosition = progress * progressBarWidth;

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
        <TouchableOpacity
          onPress={() => navigation.navigate('Score')}
          style={
            {
              // zIndex: 10000,
              // position: 'absolute',
              // backgroundColor: 'red',
              // right: hp(10),
            }
          }
        >
          <Image
            source={images.UNCLE} // Replace with actual image or local asset
            style={[styles.profileImage]}
          />
        </TouchableOpacity>

        <View style={styles.percentRow}>
          <Text style={styles.percentText}>45%</Text>
          <View style={styles.centerIndicator}>
            <Image
              source={images.FLAG}
              style={{ width: 14, height: 14, marginRight: 4 }}
            />
            <Text style={styles.percentText}>{data?.periods?.[0]?.value}</Text>
          </View>
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
    paddingBottom: 8,
    paddingHorizontal: hp(2),
  },
  label: {
    fontFamily: 'Roboto-Regular',
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '400',
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
    marginTop: 8,
    // alignItems: 'flex-start',
  },
  percentText: {
    fontFamily: 'Roboto-Regular',
    // marginRight: 50,
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '400',
  },
  centerIndicator: {
    marginHorizontal: hp(12),
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ProgressBarWithImage;
