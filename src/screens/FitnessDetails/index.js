import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Video from 'react-native-video';
import { hp, wp, color, Images } from '../../utilities';
import { Space } from 'lucide-react-native';
// import {Ionicons} from '@expo/vector-icons';

const FitnessDetails = ({ navigation, route }) => {
  const { instruction } = route?.params;
  console.log('Instructions:', instruction);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View>
        {' '}
        <View
          style={{
            flexDirection: 'row',
            marginTop: Platform.OS == 'ios' && hp(5),
            backgroundColor: '#FFFFFF',
            paddingTop: hp(2),
            elevation: 1,
          }}
        >
          <TouchableOpacity
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            style={{ paddingHorizontal: hp(1) }}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={Images.BACK_BUTTON} // Replace with actual key in your `images` object
              style={{
                resizeMode: 'contain',
                marginTop: hp(0.5),
                marginLeft: wp(1),
                height: hp(3.5),
                width: wp(4),
              }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.title}>Cuore Fitness</Text>
        </View>
      </View>

      <View style={{ padding: hp(1) }}>
        {/* Video */}
        <View style={styles.videoContainer}>
          <Video
            source={{
              uri: 'https://www.shutterstock.com/shutterstock/videos/1054650107/preview/stock-footage-humor-in-sports-fat-african-american-lazy-guy-resting-on-couch-while-his-clumsy-funny-friend-doing.mp4',
            }}
            style={styles.video}
            controls
            resizeMode="cover"
          />
        </View>

        {/* Details */}
        <View style={styles.detailsBox}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Text style={styles.detailText}>{instruction?.duration}</Text>
            <Text style={styles.detailText}>Sets: {instruction?.sets}</Text>
          </View>

          <Text style={styles.detailText}>{instruction?.equipment}</Text>
        </View>

        {/* Instructions */}
        <View style={[styles.instructionBox, {}]}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          <Text style={styles.instructionsText}>1. Starting Position:</Text>
          <Text style={styles.bullet}>
            • Stand tall and hold onto a wall or a sturdy surface for support.
          </Text>

          <Text style={styles.instructionsText}>2. Weight Shift:</Text>
          <Text style={styles.bullet}>
            • Shift your weight onto your right leg, keeping your left leg
            relaxed.
          </Text>

          <Text style={styles.instructionsText}>3. Swinging Movement:</Text>
          <Text style={styles.bullet}>
            • Swing your left leg out to the left side, keeping it straight, and
            then cross it in front of your body to the right.
          </Text>

          <Text style={styles.instructionsText}>4. Repeat:</Text>
          <Text style={styles.bullet}>
            • Return your left leg to the starting position and repeat the
            movement for the desired number of repetitions.
          </Text>

          <Text style={styles.instructionsText}>5. Switch Sides:</Text>
          <Text style={styles.bullet}>
            • Once you’ve completed the set with your left leg, switch to your
            right leg and repeat the same swinging motion.
          </Text>

          <Text style={styles.instructionsTip}>
            Tips for Lateral Leg Swing:
          </Text>
          <Text style={styles.bullet}>
            • Keep your torso stationary and engage your core to maintain
            balance.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // padding: wp(4),
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  headerTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(5),
    fontWeight: '500',
    marginLeft: wp(3),
    color: '#1e4d92',
  },
  videoContainer: {
    // flex: 1,
    width: '100%',
    height: hp(25),
    borderRadius: wp(3),
    overflow: 'hidden',
    marginBottom: hp(2),
    // backgroundColor: 'red',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  detailsBox: {
    backgroundColor: '#EBEDEF',
    padding: wp(4),
    borderRadius: wp(2),
    marginBottom: hp(2),
  },
  detailText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    marginBottom: hp(0.5),
    fontWeight: '400',
    color: '#374151',
  },
  instructionBox: {
    marginBottom: hp(3),
    borderLeftWidth: 4,
    borderLeftColor: '#884DFF',
    backgroundColor: '#FFFFFF',
    padding: wp(4),
    borderRadius: wp(2),
    // Floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1, // Android
  },
  instructionsTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: hp(1),
    color: '#374151',
  },
  instructionsText: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    fontSize: wp(3.9),
    marginTop: hp(1),
    color: '#374151',
  },
  bullet: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.7),
    color: '#374151',
    marginLeft: wp(3),
  },
  instructionsTip: {
    fontFamily: 'Roboto-Regular',
    fontWeight: 'bold',
    fontSize: wp(3.9),
    marginTop: hp(2),
  },
});

export default FitnessDetails;
