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

const KnowledgeDetails = ({ navigation, route }) => {
  const { details } = route.params || {};

  console.log('Knowledge Details:', details);
  const [selectedOption, setSelectedOption] = useState(null);

  // 🔽 Local dynamic data
  const article = {
    title: 'The Cardiovascular Disease Paradox',
    content: [
      'Coronary artery disease is highly prevalent in Indians, despite low cholesterol and traditional risk factors. Over 50% of coronary artery disease-related deaths in India occur before the age of 50.',
    ],
  };

  const handleOptionSelect = option => {
    setSelectedOption(option);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', height: hp(100) }}>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#FFFFFF',
            paddingVertical: Platform.OS === 'ios' ? hp(3) : hp(3),
            elevation: 2,
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            style={{
              marginTop: Platform.OS === 'ios' ? hp(4) : hp(0),
              paddingHorizontal: hp(2),
            }}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={Images.BACK_BUTTON}
              style={{
                resizeMode: 'contain',
                marginLeft: Platform.OS === 'ios' ? hp(0) : hp(0.2),
                height: hp(3),
                width: wp(4),
              }}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          {/* <Text style={styles.title}>{article.title}</Text> */}

          {details?.map((para, index) => (
            <React.Fragment key={index}>
              {(para?.children || []).map((child, cIndex) => (
                <Text key={cIndex} style={styles.paragraph}>
                  {child.text}
                </Text>
              ))}
              {/* const children = details?.children || []; */}
              {/* <Text key={index} style={styles.paragraph}>
              {para}
            </Text> */}
            </React.Fragment>
          ))}

          {/* <Text
          style={{
            fontFamily: 'Roboto-Regular',
            fontWeight: '400',
            fontsq: 14,
            color: '#374151',
            marginTop: hp(2),
          }}
        >
          Cardiovascular diseases and their risk factors are rapidly increasing,
          especially in urban areas, but rural populations are also seeing a
          worrying rise.
        </Text>
        <Text
          style={{
            fontFamily: 'Roboto-Regular',
            fontWeight: '400',
            fontsq: 14,
            color: '#374151',
            marginTop: hp(2),
          }}
        >
          Cardiovascular diseases and their risk factors are rapidly increasing,
          especially in urban areas, but rural populations are also seeing a
          worrying rise.
        </Text> */}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: wp(5),
    // backgroundColor: '#F9FAFB',
    flex: 1,
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
    fontWeight: 'bold',
    marginBottom: hp(1.5),
    // display: 'fle6',
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
  optionText: { fontFamily: 'Roboto-Regular', fontSize: wp(3.6) },
});

export default KnowledgeDetails;
