import React, { useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Text,
  Linking,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';
import { SafeAreaView } from 'react-native-safe-area-context';
import RenderHTML from 'react-native-render-html';

const KnowledgeDetails = ({ navigation, route }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const { details, referenceLinks } = route?.params || {};
  const { width } = useWindowDimensions();
  const detailsHtml =
    typeof details === 'string' ? details : '<p>No content available.</p>';

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.listContent}
      >
        <View style={styles.contentWrap}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Image source={Images.BACK_BUTTON} style={styles.backIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.container}>
            <RenderHTML
              contentWidth={width}
              source={{ html: detailsHtml }}
              tagsStyles={{
                p: {
                  fontSize: 15,
                  color: '#475569',
                  lineHeight: 24,
                  fontFamily: 'Poppins-Regular',
                  marginTop: 0,
                  marginBottom: 12,
                },
                ul: {
                  paddingLeft: 24,
                  marginBottom: 16,
                  marginTop: 8,
                },
                ol: {
                  paddingLeft: 24,
                  marginBottom: 16,
                  marginTop: 8,
                },
                li: {
                  marginBottom: 10,
                  fontSize: 15,
                  color: '#475569',
                  lineHeight: 24,
                  fontFamily: 'Poppins-Regular',
                  paddingLeft: 4,
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
                  fontSize: 24,
                  fontFamily: 'Poppins-SemiBold',
                  marginBottom: 14,
                  marginTop: 4,
                  color: '#EA580C',
                },
                h2: {
                  fontSize: 20,
                  fontFamily: 'Poppins-SemiBold',
                  marginBottom: 12,
                  marginTop: 4,
                  color: '#EA580C',
                },
                h3: {
                  fontSize: 18,
                  fontFamily: 'Poppins-Medium',
                  marginBottom: 10,
                  marginTop: 4,
                  color: '#EA580C',
                },
                h4: {
                  fontSize: 16,
                  fontFamily: 'Poppins-Medium',
                  marginBottom: 8,
                  marginTop: 4,
                  color: '#EA580C',
                },
              }}
            />

            {referenceLinks?.length > 0 && (
              <View style={styles.referencesContainer}>
                <Text style={styles.referencesLabel}>References</Text>
                {referenceLinks.map((link, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => Linking.openURL(link)}
                  >
                    <Text style={styles.referenceLink}>{link}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = c => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.card,
  },
  scroll: {
    flex: 1,
  },
  listContent: {
    paddingBottom: hp(6),
  },
  contentWrap: {
    flex: 1,
    backgroundColor: c.surface,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.card,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(2),
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    ...(Platform.OS === 'android' && { elevation: 0.5 }),
  },
  backButton: {
    paddingHorizontal: hp(1),
  },
  backIcon: {
    resizeMode: 'contain',
    height: hp(3.5),
    width: wp(4),
  },
  container: {
    padding: wp(5),
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    marginTop: hp(3),
    color: c.primary,
    marginBottom: hp(3),
    letterSpacing: 0.2,
  },
  paragraph: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.subText,
    marginBottom: hp(1.5),
    letterSpacing: 0.2,
  },
  quizContainer: {
    backgroundColor: c.mutedSurface,
    padding: wp(4),
    borderRadius: 12,
    marginTop: hp(2),
    borderWidth: 1,
    borderColor: c.border,
  },
  quizTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: c.text,
    marginBottom: hp(2),
    letterSpacing: 0.2,
  },
  quizQuestion: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    marginBottom: hp(1.5),
    letterSpacing: 0.2,
  },
  option: {
    padding: wp(3),
    backgroundColor: c.mutedSurface,
    borderRadius: 10,
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: c.border,
  },
  selectedOption: {
    padding: wp(3),
    backgroundColor: '#E0F2FE',
    borderRadius: 10,
    marginBottom: hp(1),
    borderWidth: 2,
    borderColor: '#11418A',
  },
  correctOption: {
    padding: wp(3),
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  incorrectOption: {
    padding: wp(3),
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  optionText: {
    fontFamily: 'Poppins-Regular',
    fontSize: wp(3.6),
    letterSpacing: 0.2,
  },
  referencesContainer: {
    marginTop: hp(3),
    paddingTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  referencesLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: c.text,
    marginBottom: hp(1),
  },
  referenceLink: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#2563EB',
    textDecorationLine: 'underline',
    marginBottom: hp(1),
    lineHeight: 22,
  },
});

export default KnowledgeDetails;
