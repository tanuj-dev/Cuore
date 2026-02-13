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
import { hp, wp, Images } from '../../utilities';
import RenderHTML from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

const MindDetails = ({ navigation, route }) => {
  const { instructions, audio, title } = route.params;
  const { width } = useWindowDimensions();

  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Load sound and get duration
  useEffect(() => {
    Sound.setCategory('Playback');

    const breathingSound = new Sound(
      audio ??
        'https://cdn.sanity.io/files/r1a9xgjr/production/db0a7782780399497ee5626a1651e0de584cfe9a.mp3',
      Sound.MAIN_BUNDLE,
      error => {
        if (error) {
          console.log('Failed to load sound', error);
          return;
        }
        setSound(breathingSound);
        setAudioDuration(breathingSound.getDuration());
      },
    );

    return () => {
      breathingSound.release();
    };
  }, [audio]);

  // Track current time
  useEffect(() => {
    let interval = null;

    if (sound && isPlaying && !isSeeking) {
      interval = setInterval(() => {
        sound.getCurrentTime(seconds => {
          setCurrentTime(seconds);
        });
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sound, isPlaying, isSeeking]);

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
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerWrapper}>
          <View style={styles.header}>
            <TouchableOpacity
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Image source={Images.BACK_BUTTON} style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.title} numberOfLines={1}>
              {title || ''}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <View style={styles.content}>
          {/* Audio Box */}
          <View style={styles.videoBox}>
            <View style={styles.videoControls}>
              <TouchableOpacity onPress={handlePlayPause}>
                <Image
                  source={isPlaying ? Images.PAUSE : Images.PLAY}
                  style={styles.playIcon}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.sliderRow}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={audioDuration}
                step={1}
                value={currentTime}
                onValueChange={() => setIsSeeking(true)}
                onSlidingComplete={value => {
                  if (sound) {
                    sound.setCurrentTime(value);
                    setCurrentTime(value);
                  }
                  setIsSeeking(false);
                }}
                minimumTrackTintColor="#11418A"
                maximumTrackTintColor="#E2E8F0"
                thumbTintColor="#11418A"
              />
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.timeText}>{formatTime(audioDuration)}</Text>
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
                  color: '#475569',
                  lineHeight: 22,
                  fontFamily: 'Poppins-Regular',
                },
                ul: { paddingLeft: 20, marginBottom: 10 },
                ol: { paddingLeft: 20, marginBottom: 10 },
                li: {
                  marginBottom: 6,
                  fontSize: 14,
                  color: '#475569',
                  fontFamily: 'Poppins-Regular',
                },
                strong: {
                  fontFamily: 'Poppins-Medium',
                  color: '#1E293B',
                },
                em: {
                  fontStyle: 'italic',
                  color: '#64748B',
                  fontFamily: 'Poppins-Regular',
                },
                h1: {
                  fontSize: 22,
                  fontFamily: 'Poppins-Medium',
                  marginBottom: 12,
                  color: '#11418A',
                },
                h3: {
                  fontSize: 16,
                  fontFamily: 'Poppins-Medium',
                  marginBottom: 8,
                  color: '#1E293B',
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
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerWrapper: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: hp(1),
    paddingTop: Platform.OS === 'ios' ? hp(3) : hp(1.5),
    paddingBottom: hp(2),
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: {
    resizeMode: 'contain',
    height: hp(3.5),
    width: wp(4),
    tintColor: '#000000',
  },
  title: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 20,
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 0.2,
    paddingHorizontal: 8,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    padding: hp(1.5),
  },
  videoBox: {
    alignItems: 'center',
    backgroundColor: '#F1E8EF',
    borderRadius: 12,
    padding: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    ...(Platform.OS === 'android' && { elevation: 0.5 }),
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
  playIcon: {
    resizeMode: 'contain',
    height: hp(3),
    width: wp(5),
    tintColor: '#11418A',
  },
  sliderRow: {
    width: '100%',
    marginTop: hp(2),
  },
  slider: {
    width: '100%',
    height: 24,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#64748B',
    letterSpacing: 0.2,
  },
  descriptionBox: {
    backgroundColor: '#FFFFFF',
    padding: hp(2),
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#11418A',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  descriptionText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#475569',
    marginBottom: hp(1.5),
    letterSpacing: 0.2,
  },
});
