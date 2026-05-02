import React, { useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Video from 'react-native-video';
import { hp, wp, Images } from '../../utilities';
import RenderHTML from 'react-native-render-html';

const FitnessDetails = ({ navigation, route }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const { instruction, data } = route?.params || {};
  const { width } = useWindowDimensions();
  const instructionsHtml =
    typeof instruction?.instructionsText === 'string'
      ? instruction.instructionsText
      : '<p>No instructions available.</p>';

  return (
    <ScrollView style={styles.container}>
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
            {data?.title ? data.title : 'Cuore Fitness'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

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

        <View style={styles.detailsBox}>
          <View style={styles.detailsRow}>
            <Text style={styles.detailText}>
              Duration: {instruction?.duration}
            </Text>
            <Text style={styles.detailText}>Sets: {instruction?.sets}</Text>
          </View>

          <Text style={styles.detailText}>
            Equipment:{' '}
            {instruction?.equipment === 'None'
              ? 'No equipment specified'
              : instruction?.equipment}
          </Text>
        </View>

        <View
          style={[
            styles.instructionBox,
            { borderLeftColor: data?.color || '#11418A' },
          ]}
        >
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
                color: data?.color || '#11418A',
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
    </ScrollView>
  );
};

const createStyles = c => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.surface,
  },
  headerWrapper: {
    backgroundColor: c.card,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    ...(Platform.OS === 'android' && { elevation: 0.5 }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(2),
    paddingTop: Platform.OS === 'ios' ? hp(2) : hp(1),
    paddingBottom: hp(1.5),
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
  },
  title: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: c.text,
    textAlign: 'center',
    letterSpacing: 0.2,
    paddingHorizontal: 8,
  },
  headerSpacer: { width: 44 },
  content: {
    padding: wp(4),
    paddingBottom: hp(6),
  },
  videoContainer: {
    width: '100%',
    height: hp(25),
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: c.border,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  detailsBox: {
    backgroundColor: c.mutedSurface,
    padding: wp(4),
    borderRadius: 12,
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: c.border,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    marginBottom: hp(0.5),
    color: c.subText,
    letterSpacing: 0.2,
  },
  instructionBox: {
    marginBottom: hp(3),
    borderLeftWidth: 4,
    borderLeftColor: '#11418A',
    backgroundColor: c.card,
    padding: wp(4),
    borderRadius: 12,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: c.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    ...(Platform.OS === 'android' && { elevation: 1 }),
  },
});

export default FitnessDetails;
