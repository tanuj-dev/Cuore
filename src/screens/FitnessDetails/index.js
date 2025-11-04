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
import RenderHTML from 'react-native-render-html';
// import {Ionicons} from '@expo/vector-icons';

const FitnessDetails = ({ navigation, route }) => {
  const { instruction, data } = route?.params;
  console.log('Instructions:', instruction);
  console.log('Data:', data);

  const exerciseVideoMap = {
    'Arm Raises with Inhale–Exhale':
      'https://www.youtube.com/embed/zB71bclwPuo', // found via “Let’s De-Stress: Seated Breathing (Exercise 1)”. :contentReference[oaicite:0]{index=0}
    Bhujangasana: 'https://www.youtube.com/embed/URL_FOR_Bhujangasana',
    'Ardha Matsyendrasana': 'https://www.youtube.com/embed/51EqCa6ZGCw', // “Ardha Matsyendrasana | The Half Fish Pose | Steps | Yogic Fitness” :contentReference[oaicite:1]{index=1}
    Tadasana: 'https://www.youtube.com/embed/URL_FOR_Tadasana',
    'Virabhadrasana 1':
      'https://www.youtube.com/embed/URL_FOR_Virabhadrasana_1',
    'Neck Rotation': 'https://www.youtube.com/embed/URL_FOR_Neck_Rotation',
    'Lateral Leg Swings':
      'https://www.youtube.com/embed/URL_FOR_Lateral_Leg_Swings',
    'March on the Spot':
      'https://www.youtube.com/embed/URL_FOR_March_on_the_spot',
    'Bicycle Crunches':
      'https://www.youtube.com/embed/URL_FOR_Bicycle_Crunches',
    'Bodyweight Calf Raises': 'https://www.youtube.com/embed/CufVyiLj878', // found via “Bodyweight Calf Raise – YouTube” :contentReference[oaicite:2]{index=2}
    'Cat–Camel Stretch':
      'https://www.youtube.com/embed/URL_FOR_Cat_Camel_Stretch',
    'Butterfly Stretch':
      'https://www.youtube.com/embed/URL_FOR_Butterfly_Stretch',
    'Shoulder Rotation':
      'https://www.youtube.com/embed/URL_FOR_Shoulder_Rotation',
    'Eagle arms stretch':
      'https://www.youtube.com/embed/URL_FOR_Eagle_arms_stretch',
    'Walk with intermittent Jogging':
      'https://www.youtube.com/embed/URL_FOR_Walk_with_intermittent_Jogging',
    'Walking (Brisk)': 'https://www.youtube.com/embed/URL_FOR_Walking_Brisk',
    Skipping: 'https://www.youtube.com/embed/URL_FOR_Skipping',
    'Superman Back Extension':
      'https://www.youtube.com/embed/URL_FOR_Superman_Back_Extension',
    'Incline Push-Up': 'https://www.youtube.com/embed/URL_FOR_Incline_Push_Up',
    'Resistance Band Shoulder Press':
      'https://www.youtube.com/embed/URL_FOR_Resistance_Band_Shoulder_Press',
    'Dumbbell Hammer Curl':
      'https://www.youtube.com/embed/URL_FOR_Dumbbell_Hammer_Curl',
    'Dumbbell Triceps Overhead Extension':
      'https://www.youtube.com/embed/URL_FOR_Dumbbell_Triceps_Overhead_Extension',
  };

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
                tintColor: '#000000',
              }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.title,
              {
                color: '#000000',
                alignSelf: 'center',
              },
            ]}
          >
            {data?.title ? data.title : 'Cuore Fitness'}
          </Text>
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
            <Text style={styles.detailText}>
              Duration: {instruction?.duration}
            </Text>
            <Text style={styles.detailText}>Sets: {instruction?.sets}</Text>
          </View>

          <Text style={styles.detailText}>
            Equipment:
            {instruction?.equipment == 'None'
              ? 'No equipment specified'
              : instruction?.equipment}
          </Text>
        </View>

        {/* Instructions */}
        <View
          style={[
            styles.instructionBox,
            { borderLeftColor: data?.color || '#884DFF' },
          ]}
        >
          <RenderHTML
            source={{
              html: instruction?.instructionsText || (
                <p>No instructions available.</p>
              ),
              numberOfLines: 0,
            }}
            tagsStyles={{
              p: {
                fontSize: 14,
                color: '#4B5563',
                lineHeight: 20,
              },
              ul: {
                paddingLeft: 20,
                marginBottom: 10,
              },
              ol: {
                paddingLeft: 20,
                marginBottom: 10,
              },
              li: {
                marginBottom: 6,
                fontSize: 14,
                color: '#4B5563',
              },
              strong: {
                fontWeight: 'bold',
                color: '#111827',
              },
              em: {
                fontStyle: 'italic',
                color: '#6B7280',
              },
              h1: {
                fontSize: 22,
                fontWeight: '700',
                marginBottom: 12,
                color: data?.color || '#ed7d31',
              },
              h3: {
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8,
                color: '#1F2937',
              },
            }}
          />
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
    marginLeft: hp(2),
    fontSize: 18,
    fontWeight: '500',
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
