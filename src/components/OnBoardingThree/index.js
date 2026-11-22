import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react-native';
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
            >
              {selectedOptions.includes(option) ? (
                <Check size={14} color="#FFFFFF" strokeWidth={3} />
              ) : null}
            </View>
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
  questionTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#0F172A', marginTop: 6, marginBottom: 10, letterSpacing: -0.1 },
  // A circle, where the checkboxes above are squares: the shape is the difference between
  // "pick any" and "pick one", and it reads before the label does.
  radio: { height: 22, width: 22, marginRight: 12, borderRadius: 11, borderWidth: 1.5, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: '#1E64AC' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1E64AC' },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  checkbox: { width: 22, height: 22, borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 6, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkedBox: {
    backgroundColor: '#1E64AC',
    borderColor: '#1E64AC',
  },
  optionText: { fontFamily: 'Poppins-Regular', fontSize: 14, letterSpacing: 0.1, color: '#334155', flex: 1 },
  tagTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 14, marginBottom: 8, color: '#0F172A' },
  tagsWrapper: { marginTop: 6, borderWidth: 1, borderRadius: 16, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', padding: 14 },
  input: { minHeight: 72, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, borderRadius: 12, fontFamily: 'Poppins-Regular', color: '#0F172A', textAlignVertical: 'top' },
  wordCount: { textAlign: 'right', color: '#94A3B8', fontFamily: 'Poppins-Regular', fontSize: 12, marginTop: 4 },
});
