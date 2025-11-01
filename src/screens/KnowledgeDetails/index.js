import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';
import { SafeAreaView } from 'react-native-safe-area-context';
import RenderHTML from 'react-native-render-html';

const KnowledgeDetails = ({ navigation, route }) => {
  const { details } = route.params || {};
  const [selectedOption, setSelectedOption] = useState(null);

  const handleOptionSelect = option => {
    setSelectedOption(option);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: hp() }}
      >
        <View style={{ backgroundColor: '#F9FAFB' }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#FFFFFF',
              paddingVertical: hp(1.5),
              elevation: 2,
              alignItems: 'center',
            }}
          >
            <TouchableOpacity
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              style={{ paddingHorizontal: hp(2) }}
              onPress={() => navigation.goBack()}
            >
              <Image
                source={Images.BACK_BUTTON}
                style={{
                  resizeMode: 'contain',
                  height: hp(3),
                  width: wp(4),
                }}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.container}>
            <RenderHTML
              source={{ html: details }}
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
                  color: '#ed7d31',
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: wp(5),
  },
  title: {
    fontFamily: 'Roboto-Regular',
    fontSize: 18,
    marginTop: hp(3),
    fontWeight: '400',
    color: '#1E64AC',
    marginBottom: hp(3),
  },
  paragraph: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#374151',
    fontWeight: '400',
    marginBottom: hp(1.5),
  },
  quizContainer: {
    backgroundColor: '#EFF6FF',
    padding: wp(4),
    borderRadius: wp(2),
    marginTop: hp(2),
  },
  quizTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    marginBottom: hp(2),
  },
  quizQuestion: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: hp(1.5),
  },
  option: {
    padding: wp(3),
    backgroundColor: '#EFF6FF',
    borderRadius: wp(2),
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedOption: {
    padding: wp(3),
    backgroundColor: '#e0f2fe',
    borderRadius: wp(2),
    marginBottom: hp(1),
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  correctOption: {
    padding: wp(3),
    backgroundColor: '#dcfce7',
    borderRadius: wp(2),
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  incorrectOption: {
    padding: wp(3),
    backgroundColor: '#fee2e2',
    borderRadius: wp(2),
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  optionText: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.6),
  },
});

export default KnowledgeDetails;
