import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Sound from 'react-native-sound';
import { Play, Pause, Headphones } from 'lucide-react-native';
import { hp } from '../../utilities';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';
import RenderHTML from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import ToastMessage from '../../components/Toast';

const DEFAULT_AUDIO =
  'https://cdn.sanity.io/files/r1a9xgjr/production/db0a7782780399497ee5626a1651e0de584cfe9a.mp3';

function isRemoteAudioUri(uri) {
  return typeof uri === 'string' && /^https?:\/\//i.test(uri);
}

const MindDetails = ({ navigation, route }) => {
  const { instructions, audio, title } = route.params;
  const { width } = useWindowDimensions();
  useLightStatusBar();

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
      <HeroHeader
        title={title || 'Cuore Mind'}
        subtitle="Guided audio session"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentInsetAdjustmentBehavior="never"
      >
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Audio Box */}
            <View style={styles.audioCard}>
              <View style={styles.audioTop}>
                <View style={styles.audioTile}>
                  <Headphones size={20} color="#7C3AED" />
                </View>
                <View style={styles.audioText}>
                  <Text style={styles.audioTitle} numberOfLines={1}>
                    {title || 'Session'}
                  </Text>
                  <Text style={styles.audioSub}>
                    {isPlaying ? 'Playing' : 'Tap play to begin'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handlePlayPause}
                  disabled={isAudioLoading}
                  style={styles.playButton}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                >
                  {showAudioBusy ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : isPlaying ? (
                    <Pause size={22} color="#FFFFFF" fill="#FFFFFF" />
                  ) : (
                    <Play size={22} color="#FFFFFF" fill="#FFFFFF" />
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
                  minimumTrackTintColor="#1E64AC"
                  maximumTrackTintColor="#E2E8F0"
                  thumbTintColor="#1E64AC"
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
                    fontFamily: 'Poppins-SemiBold',
                    color: '#0F172A',
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
                    color: '#0F172A',
                  },
                  h3: {
                    fontSize: 16,
                    fontFamily: 'Poppins-Medium',
                    marginBottom: 8,
                    color: '#0F172A',
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F7FB' },
  scroll: { flex: 1, backgroundColor: '#F4F7FB' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: hp(4) },
  audioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
  },
  audioTop: { flexDirection: 'row', alignItems: 'center' },
  audioTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioText: { flex: 1, minWidth: 0, marginHorizontal: 12 },
  audioTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#0F172A' },
  audioSub: { fontFamily: 'Poppins-Regular', fontSize: 12.5, color: '#64748B' },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E64AC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderRow: { width: '100%', marginTop: 14 },
  slider: { width: '100%', height: 24 },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: { fontFamily: 'Poppins-Regular', fontSize: 12.5, color: '#64748B' },
  descriptionBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  descriptionText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#475569',
  },
});
