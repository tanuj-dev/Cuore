import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { hp, wp } from '../../utilities';

const options = [
  'One of my parents was diagnosed with diabetes before the age of 60',
  'One of my parents had a heart attack before the age of 60',
  'I have Hypertension (High blood pressure)',
  'I have Diabetes (High blood sugar)',
  'I feel short of breath or experience chest discomfort even during mild activity or at rest',
  "I've noticed an increase in hunger, thirst, or the need to urinate frequently",
];

const OnBoardingThree = ({ onFormChange, initialData = {} }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [text, setText] = useState('');

  // ✅ Prefill if user revisits onboarding
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      let options = [];

      if (Array.isArray(initialData)) {
        // Case 1: initialData is already an array
        options = initialData.filter(item => item !== 'false');
      } else {
        // Case 2: initialData is an object with q1–q6 and other_conditions
        options = Object.entries(initialData)
          .filter(([key, value]) => key.startsWith('q') && value !== 'false')
          .map(([_, value]) => value); // ✅ Only values
      }

      setSelectedOptions(options);
      setText(initialData.other_conditions || '');
    }
  }, [initialData]);

  // ✅ Send data to parent only when user updates something
  const updateParent = (
    updatedOptions = selectedOptions,
    updatedText = text,
  ) => {
    onFormChange?.({
      selectedOptions: updatedOptions,
      other_conditions: updatedText,
    });
  };

  const handleChangeText = input => {
    if (input.length <= 60) {
      setText(input);
      updateParent(selectedOptions, input);
    }
  };

  const toggleOption = option => {
    setSelectedOptions(prev => {
      const updated = prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev, option];
      updateParent(updated, text);
      return updated;
    });
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* Options */}
      <View style={styles.card}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => toggleOption(option)}
            style={styles.optionRow}
          >
            <View
              style={[
                styles.checkbox,
                selectedOptions.includes(option) && styles.checkedBox,
              ]}
            />
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Additional input */}
      <Text style={styles.tagTitle}>
        List any important medical or surgical conditions you’ve been treated
        for. Use ‘/’ to separate multiple conditions
      </Text>
      <View style={styles.tagsWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Condition 1 / Condition 2 / …."
          multiline
          value={text}
          onChangeText={handleChangeText}
        />
        <Text style={styles.wordCount}>Characters: {text.length}/60</Text>
      </View>
    </ScrollView>
  );
};

export default OnBoardingThree;

const styles = StyleSheet.create({
  container: {
    padding: wp(1),
    backgroundColor: '#fff',
    flexGrow: 1,
  },

  card: {
    backgroundColor: 'white',
    padding: wp(4),
    borderRadius: wp(1),
    marginBottom: hp(2),
    elevation: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(1.5),
  },
  checkbox: {
    width: wp(4),
    height: wp(4.5),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp(1),
    marginTop: hp(0.5),
    marginRight: wp(2.5),
  },
  checkedBox: {
    backgroundColor: '#1E64AC',
    borderColor: '#007bff',
  },
  optionText: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.5),
    flex: 1,
    color: '#374151',
  },
  tagTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.5),
    marginBottom: hp(1),
    color: '#374151',
  },
  tagsWrapper: {
    marginTop: hp(2),
    // height: hp(15),
    borderWidth: 0.3,
    borderRadius: hp(0.5),
    borderColor: '#D1D5DB',
    elevation: 1,
    backgroundColor: '#FFFFFF',
    padding: hp(1),
  },
  input: {
    height: hp(8),
    // borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    // minHeight: 100,
    borderRadius: 5,
  },
  wordCount: {
    // marginTop: 5,
    textAlign: 'right',
    color: '#888',
  },

  button: {
    backgroundColor: '#007bff',
    paddingVertical: hp(1.8),
    borderRadius: wp(2.5),
    alignItems: 'center',
    marginBottom: hp(3),
  },
  buttonText: {
    fontFamily: 'Roboto-Regular',
    color: '#fff',
    fontSize: wp(4),
    fontWeight: '600',
  },
});
