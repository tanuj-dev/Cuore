import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Video from 'react-native-video';
import { Clock, Repeat, Dumbbell } from 'lucide-react-native';
import { hp } from '../../utilities';
import RenderHTML from 'react-native-render-html';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';

const Stat = ({ Icon, tint, bg, label, value }) => (
  <View style={styles.stat}>
    <View style={[styles.statTile, { backgroundColor: bg }]}>
      <Icon size={16} color={tint} />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue} numberOfLines={2}>
      {value || '-'}
    </Text>
  </View>
);

const FitnessDetails = ({ navigation, route }) => {
  const { instruction, data } = route?.params || {};
  const { width } = useWindowDimensions();
  useLightStatusBar();
  const instructionsHtml =
    typeof instruction?.instructionsText === 'string'
      ? instruction.instructionsText
      : '<p>No instructions available.</p>';

  return (
    <View style={styles.container}>
      <HeroHeader
        title="Cuore Fitness"
        subtitle={data?.title || 'Watch the demo, then follow the steps.'}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.scroll}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.videoContainer}>
            <Video
              source={{
                uri:
                  data?.videoUrl ||
                  'https://www.shutterstock.com/shutterstock/videos/1054650107/preview/stock-footage-humor-in-sports-fat-african-american-lazy-guy-resting-on-couch-while-his-clumsy-funny-friend-doing.mp4',
              }}
              style={styles.video}
              controls
              resizeMode="cover"
            />
          </View>

          <View style={styles.statsRow}>
            <Stat
              Icon={Clock}
              tint="#1E64AC"
              bg="#DBEAFE"
              label="Duration"
              value={instruction?.duration}
            />
            <Stat
              Icon={Repeat}
              tint="#059669"
              bg="#D1FAE5"
              label="Sets"
              value={instruction?.sets}
            />
            <Stat
              Icon={Dumbbell}
              tint="#B45309"
              bg="#FEF3C7"
              label="Equipment"
              value={
                instruction?.equipment === 'None'
                  ? 'None'
                  : instruction?.equipment
              }
            />
          </View>

          <Text style={styles.sectionTitle}>How to do it</Text>
          <View style={styles.instructionBox}>
            <RenderHTML
              contentWidth={width}
              source={{ html: instructionsHtml }}
              tagsStyles={{
                p: {
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: hp(6) },
  videoContainer: {
    width: '100%',
    height: hp(25),
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#0F172A',
  },
  video: { width: '100%', height: '100%' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  stat: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  statTile: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: { fontFamily: 'Poppins-Regular', fontSize: 12, color: '#64748B' },
  statValue: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#0F172A' },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 10,
  },
  instructionBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});

export default FitnessDetails;
