import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import {hp, wp, Images} from '../../utilities';

const KnowledgeDetails = ({navigation}) => {
  const [selectedOption, setSelectedOption] = useState(null);

  // 🔽 Local dynamic data
  const article = {
    title: 'The Cardiovascular Disease Paradox',
    content: [
      'Coronary artery disease is highly prevalent in Indians, despite low cholesterol and traditional risk factors. Over 50% of coronary artery disease-related deaths in India occur before the age of 50.',
    ],
    quiz: {
      question:
        'What percentage of coronary artery disease-related deaths occur before age 50?',
      options: ['30%', '40%', '50%', '60%'],
      correctAnswer: '50%',
    },
  };

  const handleOptionSelect = option => {
    setSelectedOption(option);
  };

  return (
    <View style={{flex: 1, backgroundColor: '#F9FAFB'}}>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#FFFFFF',
          paddingVertical: hp(3),
          elevation: 2,
        }}>
        <TouchableOpacity
          style={{paddingHorizontal: hp(1)}}
          onPress={() => navigation.goBack()}>
          <Image
            source={Images.BACK_BUTTON} // Replace with actual key in your `images` object
            style={{
              resizeMode: 'contain',
              height: hp(3),
              width: wp(4),
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        {/* <Text style={styles.title}>Cuore Fitness</Text> */}
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>{article.title}</Text>

        {article.content.map((para, index) => (
          <Text key={index} style={styles.paragraph}>
            {para}
          </Text>
        ))}

        {article.quiz && (
          <View style={styles.quizContainer}>
            <Text style={styles.quizTitle}>Quick Quiz</Text>
            <Text style={styles.quizQuestion}>{article.quiz.question}</Text>

            {article.quiz.options.map((option, index) => {
              const isCorrect = option === article.quiz.correctAnswer;
              const isSelected = selectedOption === option;
              const showResult = selectedOption !== null;

              let optionStyle = styles.option;
              if (showResult && isCorrect) optionStyle = styles.correctOption;
              else if (showResult && isSelected && !isCorrect)
                optionStyle = styles.incorrectOption;
              else if (isSelected) optionStyle = styles.selectedOption;

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleOptionSelect(option)}
                  style={optionStyle}>
                  <Text style={styles.optionText}>
                    {option}
                    {showResult && isCorrect ? '  ✓ (Correct Answer!)' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <Text
          style={{
            fontFamily: 'Roboto-Regular',
            fontWeight: '400',
            fontsq: 14,
            color: '#374151',
            marginTop: hp(2),
          }}>
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
          }}>
          Cardiovascular diseases and their risk factors are rapidly increasing,
          especially in urban areas, but rural populations are also seeing a
          worrying rise.
        </Text>
      </View>
    </View>
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
  optionText: {fontFamily: 'Roboto-Regular', fontSize: wp(3.6)},
});

export default KnowledgeDetails;
