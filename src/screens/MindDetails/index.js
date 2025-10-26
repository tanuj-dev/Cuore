import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Sound from 'react-native-sound';
import { hp, wp, color, Images } from '../../utilities';
import RenderHTML from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

const MindDetails = ({ navigation, route }) => {
  const { instructions, audio } = route.params;
  const { width } = useWindowDimensions();

  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Load sound and get duration
  useEffect(() => {
    Sound.setCategory('Playback');

    const breathingSound = new Sound(audio, Sound.MAIN_BUNDLE, error => {
      if (error) {
        console.log('Failed to load sound', error);
        return;
      }
      setSound(breathingSound);
      setAudioDuration(breathingSound.getDuration());
    });

    return () => {
      breathingSound.release();
    };
  }, [audio]);

  // Track current time
  useEffect(() => {
    let interval = null;

    if (sound && isPlaying) {
      interval = setInterval(() => {
        sound.getCurrentTime(seconds => {
          setCurrentTime(seconds);
        });
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sound, isPlaying]);

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

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
              marginTop: Platform.OS === 'ios' ? hp(3) : 0,
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
          {/* Audio Box */}
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
            </View>

            <View style={{ width: '100%', marginTop: hp(2) }}>
              <Slider
                style={{ width: '100%', height: 20 }}
                minimumValue={0}
                maximumValue={audioDuration}
                step={1}
                value={currentTime}
                onValueChange={setCurrentTime}
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
                <Text>{formatTime(currentTime)}</Text>
                <Text>{formatTime(audioDuration)}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionBox}>
            <RenderHTML
              contentWidth={width}
              source={{ html: instructions }}
              baseStyle={styles.descriptionText}
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
});
