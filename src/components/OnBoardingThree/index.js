import React, { useState, useEffect } from 'react';
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

/* "If Gender selected Female in O2 & age between 11 & 51 — add questions in O3."
 *
 * Inclusive at both ends, and the age is the one answered in O2 rather than one derived from a
 * birthday — that is what the spec points at, and re-deriving it would silently drop the question
 * for somebody who turned 52 between onboarding and a reassessment.
 *
 * THE BACKEND RESTATES THIS RULE in utils/cyclePredictions.js isCycleQuestionEligible, because it
 * decides the same thing when serving the calendar. The two must agree; change both or neither. */
const CYCLE_AGE_RANGE = [10, 51]; // Launch Edits 13 Nov
const isCycleQuestionEligible = (gender, age) => {
  if (!/^(f|female|woman|girl)$/i.test(String(gender || '').trim())) return false;
  const n = Number(age);
  if (!Number.isFinite(n)) return false;
  return n >= CYCLE_AGE_RANGE[0] && n <= CYCLE_AGE_RANGE[1];
};

// Stored values, and what the patient reads. The values must match the backend's own enum
// (onboardingModel o3Data.menstrualStatus).
const PERIOD_STATUS_OPTIONS = [
  { value: 'regular', label: 'Regular' },
  { value: 'irregular', label: 'Irregular' },
  { value: 'stopped', label: 'They have stopped' },
];

const OnBoardingThree = ({ onFormChange, initialData = {}, o2Data = {} }) => {
  console.log('Initial data in OnBoardingThree:', initialData);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [text, setText] = useState('');
  // null until answered. Null is not "they have stopped" — it means the question was not answered,
  // and the backend keeps that distinction too.
  const [menstrualStatus, setMenstrualStatus] = useState(null);

  const askPeriods = isCycleQuestionEligible(o2Data?.gender, o2Data?.age);

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
        setMenstrualStatus(initialData.menstrualStatus ?? null);
        console.log(selectedOptions, 'selectedOptions restored');
      }
    }, [initialData]),
  );

  // ✅ Helper to notify parent (called only when user changes something)
  const updateParent = (
    updatedOptions = selectedOptions,
    updatedText = text,
    updatedStatus = menstrualStatus,
  ) => {
    onFormChange?.({
      selectedOptions: updatedOptions,
      other_conditions: updatedText,
      /* Sent only when the question was actually shown. A man's submit must not carry the key at
       * all — an explicit null from a form that never asked is indistinguishable, at the database,
       * from a woman who declined to answer. */
      ...(askPeriods ? { menstrualStatus: updatedStatus } : {}),
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

      {/* Periods — shown only to the group the spec names. A single-choice question among a card
          of multi-select checkboxes, so it is given its own card and radio controls rather than
          sharing the list above: three options where exactly one is true does not behave like six
          where any may be. */}
      {askPeriods && (
        <View style={styles.card}>
          <Text style={styles.questionTitle}>
            What best describes your periods currently?
          </Text>
          {PERIOD_STATUS_OPTIONS.map(opt => {
            const selected = menstrualStatus === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => {
                  setMenstrualStatus(opt.value);
                  updateParent(selectedOptions, text, opt.value);
                }}
                style={styles.optionRow}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <View style={[styles.radio, selected && styles.radioOn]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.optionText}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Additional input */}
      <Text style={styles.tagTitle}>
        List major medical/surgical conditions (max 3). HTN & Diabetes already
        covered above.
      </Text>
      <View style={styles.tagsWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Condition 1 / Condition 2 / …"
          multiline
          value={text}
          onChangeText={handleChangeText}
        />
        <Text style={styles.wordCount}>Characters: {text.length}/60</Text>
      </View>
    </View>
  );
};

export default OnBoardingThree;

const styles = StyleSheet.create({
  container: {
    padding: wp(1),
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  questionTitle: {
    fontSize: hp(1.9),
    color: '#16283F',
    fontWeight: '600',
    marginBottom: hp(1.2),
  },
  // A circle, where the checkboxes above are squares: the shape is the difference between
  // "pick any" and "pick one", and it reads before the label does.
  radio: {
    height: hp(2.4),
    width: hp(2.4),
    // Same gap the checkboxes above carry. Without it the control sits against its own label.
    marginRight: wp(2.5),
    borderRadius: hp(1.2),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: '#11418A' },
  radioDot: {
    height: hp(1.2),
    width: hp(1.2),
    borderRadius: hp(0.6),
    backgroundColor: '#11418A',
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
    borderColor: '#E2E8F0',
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
    color: '#475569',
  },
  tagTitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14, letterSpacing: 0.2,
    marginBottom: hp(1),
    color: '#475569',
  },
  tagsWrapper: {
    marginTop: hp(2),
    borderWidth: 0.3,
    borderRadius: hp(0.5),
    borderColor: '#E2E8F0',
    elevation: 1,
    backgroundColor: '#FFFFFF',
    padding: hp(1),
  },
  input: {
    height: hp(8),
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
  },
  wordCount: {
    textAlign: 'right',
    color: '#888',
  },
});
