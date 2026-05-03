import React, { useState, useEffect, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
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
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  console.log('Initial data in OnBoardingThree:', initialData);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [text, setText] = useState('');

  // ✅ Refill data every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (initialData && Object.keys(initialData).length > 0) {
        let savedOptions = [];

        if (initialData.selectedOptions) {
          // Case 1: already array
          savedOptions = initialData.selectedOptions;
        } else {
          // Case 2: object form (q1–q6)
          savedOptions = Object.entries(initialData)
            .filter(([key, value]) => key.startsWith('q') && value !== 'false')
            .map(([_, value]) => value);
        }

        setSelectedOptions(savedOptions);
        setText(initialData.other_conditions || '');
        console.log(savedOptions, 'selectedOptions restored');
      }
    }, [initialData]),
  );

  // ✅ Helper to notify parent (called only when user changes something)
  const updateParent = (
    updatedOptions = selectedOptions,
    updatedText = text,
  ) => {
    onFormChange?.({
      selectedOptions: updatedOptions,
      other_conditions: updatedText,
    });
  };

  // console.log('Selected options:', selectedOptions);

  // ✅ Text input change handler
  const handleChangeText = input => {
    if (input.length <= 60) {
      setText(input);
      updateParent(selectedOptions, input);
    } else {
      // console.log('Character limit reached');
    }
  };

  // ✅ Fixed toggle logic (preserve + toggle + prevent duplicates)
  const toggleOption = option => {
    setSelectedOptions(prev => {
      const prevSet = new Set(prev);

      if (prevSet.has(option)) {
        prevSet.delete(option); // remove
      } else {
        prevSet.add(option); // add
      }

      const updated = Array.from(prevSet);
      updateParent(updated, text);
      return updated;
    });
  };

  return (
    <View style={styles.container}>
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
        List major medical/surgical conditions (max 3). HTN & Diabetes already
        covered above.
      </Text>
      <View style={styles.tagsWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Condition 1 / Condition 2 / …"
          placeholderTextColor={c.inputPlaceholder}
          multiline
          value={text}
          onChangeText={handleChangeText}
          underlineColorAndroid="transparent"
        />
        <Text style={styles.wordCount}>Characters: {text.length}/60</Text>
      </View>
    </View>
  );
};

export default OnBoardingThree;

const createStyles = c => StyleSheet.create({
  container: {
    padding: wp(1),
    backgroundColor: c.card,
    flexGrow: 1,
  },
  card: {
    backgroundColor: c.surface,
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
    borderColor: c.border,
    borderRadius: wp(1),
    marginTop: hp(0.5),
    marginRight: wp(2.5),
  },
  checkedBox: {
    backgroundColor: '#11418A',
    borderColor: '#11418A',
  },
  optionText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14, letterSpacing: 0.2,
    flex: 1,
    color: c.onboardingLabel,
  },
  tagTitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14, letterSpacing: 0.2,
    marginBottom: hp(1),
    color: c.onboardingLabel,
  },
  tagsWrapper: {
    marginTop: hp(2),
    borderRadius: hp(0.5),
    backgroundColor: c.card,
    padding: hp(1),
  },
  input: {
    height: hp(8),
    borderWidth: 0,
    padding: 10,
    borderRadius: 5,
    color: c.text,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    backgroundColor: 'transparent',
  },
  wordCount: {
    textAlign: 'right',
    color: c.onboardingNote,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
  },
});
