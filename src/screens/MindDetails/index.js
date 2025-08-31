import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {hp, wp, color, Images} from '../../utilities';
import Slider from '@react-native-community/slider';

// import Icon from 'react-native-vector-icons/MaterialIcons';

const MindDetails = ({navigation}) => {
  const [value, setValue] = useState(50);
  return (
    <View style={styles.container}>
      {/* Header */}

      <View style={{   elevation: 1, backgroundColor: '#FFFFFF',}}>
  <View
        style={{
          flexDirection: 'row',
         
                marginTop:Platform.OS =='ios'&& hp(5),
          paddingTop: hp(2),
       
        }}>
        <TouchableOpacity
          style={{paddingHorizontal: hp(1)}}
          onPress={() => navigation.goBack()}>
          <Image
            source={Images.BACK_BUTTON} // Replace with actual key in your `images` object
            style={{
              resizeMode: 'contain',
              height: hp(3.5),
              width: wp(4),
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.title}>Deep Breathing</Text>
      </View>
      </View>
    
      <View style={{padding: hp(1.5)}}>
        {/* Video Box */}
        <View style={styles.videoBox}>
          <View style={styles.videoControls}>
            <TouchableOpacity>
              <Image
                source={Images.PLAY} // Replace with actual key in your `images` object
                style={{
                  resizeMode: 'contain',
                  height: hp(3),
                  width: wp(5),
                  tintColor: '#000000',
                }}
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Image
                source={Images.PAUSE} // Replace with actual key in your `images` object
                style={{
                  resizeMode: 'contain',
                  height: hp(3),
                  width: wp(5),
                  tintColor: '#000000',
                }}
              />
            </TouchableOpacity>

            <TouchableOpacity>
              <Image
                source={Images.START} // Replace with actual key in your `images` object
                style={{
                  resizeMode: 'contain',
                  height: hp(3),
                  width: wp(5),
                  tintColor: '#000000',
                }}
              />
            </TouchableOpacity>
          </View>
          <View
            style={{
              padding: 0,
              backgroundColor: '',
              width: '100%',
              marginTop: hp(2),
            }}>
            <Slider
              style={{width: '100%', height: 20}}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={value}
              onValueChange={setValue}
              minimumTrackTintColor="black"
              maximumTrackTintColor="white"
              thumbTintColor="black"
            />
            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text>1:23</Text>
              <Text>4:56</Text>
            </View>
          </View>
          {/* <View style={styles.timeRow}>
            <Text style={styles.timeText}>1:23</Text>
            <Text style={styles.timeText}>4:56</Text>
          </View> */}
        </View>

        {/* Description */}
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionText}>
            Box breathing is a powerful breathwork technique that promotes
            focus, relaxation, and stress reduction. It can be practiced while
            stretching, commuting, or walking.
            {'\n'}If Dizziness or Light-headedness happens, stop and return to
            normal breathing.
          </Text>

          {/* Steps */}
          <Text style={styles.stepTitle}>Steps</Text>

          <Text style={styles.stepText}>
            1. Find a Comfortable Position{'\n'}• Sit upright or lie down in a
            relaxed position.{'\n'}• Keep your shoulders relaxed and spine
            straight.
          </Text>

          <Text style={styles.stepText}>
            2. Inhale Through Your Nose (4 Seconds){'\n'}• Breathe in slowly and
            deeply through your nose for a count of 4.{'\n'}• Feel your belly
            expand as you fill your lungs.
          </Text>

          <Text style={styles.stepText}>
            3. Hold Your Breath (4 Seconds){'\n'}• Gently hold your breath for 4
            seconds.{'\n'}• Avoid tensing your body—stay relaxed.
          </Text>

          <Text style={styles.stepText}>
            4. Exhale Slowly Through Your Mouth (4 Seconds){'\n'}• Breathe out
            slowly and completely through your mouth for 4 seconds.{'\n'}• Feel
            your body releasing tension with the exhale.
          </Text>
        </View>
      </View>
    </View>
  );
};

export default MindDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    // padding: hp(2),
  },
  title: {
    fontFamily: 'Roboto-Regular',
    marginTop: hp(1),
    marginLeft: hp(12),
    fontSize: 20,
    fontWeight: '400',
    marginBottom: hp(2),
    alignSelf: 'center',
    color: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  headerTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(2.5),
    fontWeight: '600',
    color: color.primary,
  },
  videoBox: {
    // justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0D1DE',
    borderRadius: hp(1),
    padding: hp(2),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    marginBottom: hp(2),
    height: hp(20),
  },
  videoControls: {
    alignItems: 'center',
    width: hp(20),
    // backgroundColor: 'red',
    marginTop: hp(5),
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp(1),
  },
  progressBarContainer: {
    height: hp(0.7),
    backgroundColor: '#E0E0E0',
    borderRadius: hp(1),
    overflow: 'hidden',
  },
  progressBar: {
    width: '30%',
    height: '100%',
    backgroundColor: color.primary,
  },
  timeRow: {
    width: wp(70),
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(0.5),
  },
  timeText: {
    fontSize: hp(1.5),
    color: color.text,
  },
  descriptionBox: {
    backgroundColor: '#F9F9F9',
    padding: hp(2),
    borderRadius: hp(1),
    borderLeftWidth: 3,
    borderLeftColor: '#E1AEDA',
  },
  descriptionText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#4B5563',
    marginBottom: hp(1.5),
    fontWeight: '400',
  },
  stepTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: hp(1),
    color: '#4B5563',
    fontWeight: '400',
  },
  stepText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '400',
    color: '#4B5563',
    marginBottom: hp(1),
  },
});
