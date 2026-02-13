import React from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';
import { SafeAreaView } from 'react-native-safe-area-context';
import RenderHTML from 'react-native-render-html';

const KnowledgeDetails = ({ navigation, route }) => {
  const { details } = route?.params || {};
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  listContent: {
    paddingBottom: hp(6),
  },
  contentWrap: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
    color: '#11418A',
    marginBottom: hp(3),
    letterSpacing: 0.2,
  },
  paragraph: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#475569',
    marginBottom: hp(1.5),
    letterSpacing: 0.2,
  },
  quizContainer: {
    backgroundColor: '#F1F5F9',
    padding: wp(4),
    borderRadius: 12,
    marginTop: hp(2),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quizTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#1E293B',
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
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
});

export default KnowledgeDetails;
