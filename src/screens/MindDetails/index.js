import React, { useState, useEffect, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Sound from 'react-native-sound';
import { hp, wp, Images } from '../../utilities';
import RenderHTML from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import ToastMessage from '../../components/Toast';

const DEFAULT_AUDIO =
  'https://cdn.sanity.io/files/r1a9xgjr/production/db0a7782780399497ee5626a1651e0de584cfe9a.mp3';

function isRemoteAudioUri(uri) {
  return typeof uri === 'string' && /^https?:\/\//i.test(uri);
}

const MindDetails = ({ navigation, route }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const { instructions, audio, title } = route.params;
  const { width } = useWindowDimensions();

  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(true);
  const [isStartingPlayback, setIsStartingPlayback] = useState(false);
  const [toast, setToast] = useState(null);

  // Load sound and get duration
  useEffect(() => {
    Sound.setCategory('Playback');
    setIsAudioLoading(true);
    setSound(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioDuration(0);
    setIsStartingPlayback(false);

    const uri = audio || DEFAULT_AUDIO;
    const basePath = isRemoteAudioUri(uri) ? '' : Sound.MAIN_BUNDLE;

    const breathingSound = new Sound(uri, basePath, error => {
      if (error) {
        console.log('Failed to load sound', error);
        setIsAudioLoading(false);
        setToast({
          message: 'Could not load audio. Check your connection and try again.',
          type: 'error',
        });
        return;
      }
      setSound(breathingSound);
      setAudioDuration(breathingSound.getDuration());
      setIsAudioLoading(false);
    });

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

  // Hide "starting playback" spinner once audio actually advances (buffers can delay first samples)
  useEffect(() => {
    if (!isStartingPlayback || !isPlaying) return;
    if (currentTime > 0.08) {
      setIsStartingPlayback(false);
    }
  }, [isStartingPlayback, isPlaying, currentTime]);

  // Safety: clear stuck "starting" state if nothing moves after a few seconds
  useEffect(() => {
    if (!isStartingPlayback) return;
    const t = setTimeout(() => setIsStartingPlayback(false), 8000);
    return () => clearTimeout(t);
  }, [isStartingPlayback]);

  const handlePlayPause = () => {
    if (!sound || isAudioLoading) return;

    if (isPlaying) {
      sound.pause();
      setIsPlaying(false);
      setIsStartingPlayback(false);
    } else {
      setIsStartingPlayback(true);
      sound.play(success => {
        setIsStartingPlayback(false);
        if (!success) {
          console.log('Playback failed');
          setToast({
            message: 'Playback failed. Try again in a moment.',
            type: 'error',
          });
        }
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const showAudioBusy =
    isAudioLoading || (isPlaying && isStartingPlayback && currentTime <= 0.08);

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.root}>
      {toast ? (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          top={Platform.OS === 'ios' ? 52 : 24}
          onHide={() => setToast(null)}
        />
      ) : null}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
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
                <TouchableOpacity
                  onPress={handlePlayPause}
                  disabled={isAudioLoading}
                  style={styles.playButtonWrap}
                  activeOpacity={0.7}
                >
                  {showAudioBusy ? (
                    <ActivityIndicator size="large" color="#11418A" />
                  ) : (
                    <Image
                      source={isPlaying ? Images.PAUSE : Images.PLAY}
                      style={styles.playIcon}
                    />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.sliderRow}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={Math.max(audioDuration, 1)}
                  step={1}
                  value={currentTime}
                  disabled={isAudioLoading || !sound}
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
                  <Text style={styles.timeText}>
                    {formatTime(audioDuration)}
                  </Text>
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
    </View>
  );
};

export default MindDetails;

const createStyles = c => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.card,
  },
  scroll: {
    flex: 1,
    backgroundColor: c.card,
  },
  container: {
    flex: 1,
    backgroundColor: c.surface,
  },
  headerWrapper: {
    backgroundColor: c.card,
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
  playButtonWrap: {
    minHeight: hp(4),
    minWidth: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    resizeMode: 'contain',
    height: hp(3),
    width: wp(5),
    tintColor: c.primary,
  },
  loadingHint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: c.subText,
    marginTop: hp(0.5),
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
    color: c.subText,
    letterSpacing: 0.2,
  },
  descriptionBox: {
    backgroundColor: c.card,
    padding: hp(2),
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#11418A',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: c.border,
  },
  descriptionText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.subText,
    marginBottom: hp(1.5),
    letterSpacing: 0.2,
  },
});
