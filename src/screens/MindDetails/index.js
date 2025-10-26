import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Sound from 'react-native-sound';
import { hp, wp, color, Images } from '../../utilities';
import RenderHTML from 'react-native-render-html';
import { Scroll } from 'lucide-react-native';

const MindDetails = ({ navigation, route }) => {
  const { instructions } = route.params;
  console.log('Mind Details Instructions:', instructions);
  const [value, setValue] = useState(50);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    Sound.setCategory('Playback');
    const breathingSound = new Sound(
      // require('../../assets/audio/JB.mp3'),
      Sound.MAIN_BUNDLE,
      error => {
        if (error) {
          console.log('Failed to load sound', error);
          return;
        }
        setSound(breathingSound);
      },
    );

    return () => {
      breathingSound.release();
    };
  }, []);

  const handlePlayPause = () => {
    if (!sound) return;

    if (isPlaying) {
      sound.pause();
      setIsPlaying(false);
    } else {
      sound.play(success => {
        if (!success) {
          console.log('Playback failed');
        }
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={{ elevation: 1, backgroundColor: '#FFFFFF' }}>
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: hp(1),
              marginTop: Platform.OS === 'ios' && hp(3),
              paddingTop: hp(2),
            }}
          >
            <TouchableOpacity
              style={{ paddingHorizontal: hp(1), marginTop: hp(3) }}
              onPress={() => navigation.goBack()}
            >
              <Image
                source={Images.BACK_BUTTON}
                style={{
                  resizeMode: 'contain',
                  height: hp(3.5),
                  width: wp(4),
                }}
              />
            </TouchableOpacity>
            <Text style={styles.title}>Deep Breathing</Text>
          </View>
        </View>

        <View style={{ padding: hp(1.5) }}>
          {/* Video Box */}
          <View style={styles.videoBox}>
            <View style={styles.videoControls}>
              <TouchableOpacity onPress={handlePlayPause}>
                <Image
                  source={isPlaying ? Images.PAUSE : Images.PLAY}
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
                  source={Images.START}
                  style={{
                    resizeMode: 'contain',
                    height: hp(3),
                    width: wp(5),
                    tintColor: '#000000',
                  }}
                />
              </TouchableOpacity>
            </View>

            <View style={{ width: '100%', marginTop: hp(2) }}>
              <Slider
                style={{ width: '100%', height: 20 }}
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
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <Text>1:23</Text>
                <Text>4:56</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionBox}>
            <RenderHTML
              // contentWidth={width}
              source={{ html: instructions }}
              baseStyle={styles.baseText}
              tagsStyles={{
                p: {
                  marginBottom: 10,
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
                  color: 'rgb(237, 125, 49)',
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
      </View>
    </ScrollView>
  );
};

export default MindDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  title: {
    fontFamily: 'Roboto-Regular',
    marginTop: hp(3),
    marginLeft: hp(10),
    fontSize: 20,
    fontWeight: '400',
    marginBottom: hp(2),
    textAlign: 'center',
    color: '#000000',
  },
  videoBox: {
    alignItems: 'center',
    backgroundColor: '#E0D1DE',
    borderRadius: hp(1),
    padding: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    marginBottom: hp(2),
    height: hp(20),
  },
  videoControls: {
    alignItems: 'center',
    width: hp(20),
    marginTop: hp(5),
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp(1),
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
  },
  stepText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '400',
    color: '#4B5563',
    marginBottom: hp(1),
  },
});
