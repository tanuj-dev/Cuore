import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Images, color, hp, wp } from '../../utilities';

const validationLimits = {
  o2_sat: { min: 70, max: 100 },
  pulse: { min: 40, max: 240 },
  bp_upper: { min: 50, max: 320 },
  bp_lower: { min: 40, max: 260 },
  bs_f: { min: 30, max: 2000 },
  bs_am: { min: 50, max: 2000 },
  A1C: { min: 4, max: 27 },
  HDL: { min: 20, max: 100 },
  LDL: { min: 60, max: 900 },
  Trig: { min: 60, max: 900 },
  HsCRP: { min: 0.09, max: 10 },
};

const OnBoardingSeven = ({ initialData, onFormChange }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const [formData, setFormData] = useState({
    o2_sat: '',
    pulse: '',
    bp_upper: '',
    bp_lower: '',
    bs_f: '',
    bs_am: '',
    A1C: '',
    HDL: '',
    LDL: '',
    Trig: '',
    HsCRP: '',
    hscrp_unit: '',
  });

  const [errors, setErrors] = useState({});
  const lastSentData = useRef(formData);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => {
        const updated = { ...prev, ...initialData };
        if (JSON.stringify(prev) !== JSON.stringify(updated)) {
          return updated;
        }
        return prev;
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (
      typeof onFormChange === 'function' &&
      JSON.stringify(lastSentData.current) !== JSON.stringify(formData)
    ) {
      lastSentData.current = formData;
      onFormChange(formData);
    }
  }, [formData, onFormChange]);

  const handleChange = (key, value) => {
    const numericKeys = Object.keys(validationLimits);
    let newValue = value;

    if (numericKeys.includes(key)) {
      // Strip non-numeric characters except one dot
      const filtered = value.replace(/[^0-9.]/g, '');
      const match = filtered.match(/^\d*(\.\d{0,1})?/);
      newValue = match ? match[0] : '';

      // Always update formData so user can type freely
      setFormData(prev => ({ ...prev, [key]: newValue }));

      // Allow clearing the field
      if (newValue === '') {
        setErrors(prev => ({ ...prev, [key]: null }));
        return;
      }

      const num = parseFloat(newValue);
      const { min, max } = validationLimits[key];

      if (num >= min && num <= max) {
        setErrors(prev => ({ ...prev, [key]: null }));
      } else {
        setErrors(prev => ({
          ...prev,
          [key]: `Value must be between ${min} and ${max}`,
        }));
      }
    } else {
      // Non-numeric field (e.g. unit)
      setFormData(prev => ({ ...prev, [key]: value }));
    }
  };

  const renderDoubleInputRow = (first, second) => (
    <View style={styles.row}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{first.label}</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder={first.placeholder}
          value={formData[first.key]?.toString() || ''}
          onChangeText={text => handleChange(first.key, text)}
        />
        {errors[first.key] && (
          <Text style={styles.errorText}>{errors[first.key]}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{second.label}</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder={second.placeholder}
          value={formData[second.key]?.toString() || ''}
          onChangeText={text => handleChange(second.key, text)}
        />
        {errors[second.key] && (
          <Text style={styles.errorText}>{errors[second.key]}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Vital Signs (Resting values)</Text>
      {renderDoubleInputRow(
        { label: 'Oxygen Saturation (%)', key: 'o2_sat' },
        { label: 'Pulse (bpm)', key: 'pulse' },
      )}
      {renderDoubleInputRow(
        { label: 'BP (Upper Reading)', key: 'bp_upper' },
        { label: 'BP (Lower Reading)', key: 'bp_lower' },
      )}

      <Text style={styles.sectionTitle}>Blood Tests</Text>
      <View style={styles.noteRow}>
        <Image style={styles.noteIcon} source={Images.NOTICE} />
        <View style={styles.noteTextWrap}>
          <Text style={styles.note}>
          General guidance: often checked annually. Follow your doctor’s advice
          </Text>
        </View>
      </View>

      <Text style={styles.subsectionTitle}>Blood Sugar</Text>
      {renderDoubleInputRow(
        { label: 'Fasting', key: 'bs_f' },
        { label: 'After Meal', key: 'bs_am' },
      )}
      {renderDoubleInputRow(
        { label: 'HbA1c', key: 'A1C' },
        { label: 'HDL (Annual)', key: 'HDL' },
      )}
      {renderDoubleInputRow(
        { label: 'LDL (Annual)', key: 'LDL' },
        { label: 'Triglycerides (Annual)', key: 'Trig' },
      )}

      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>HsCRP (Annual)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData?.HsCRP?.toString() || ''}
            onChangeText={text => handleChange('HsCRP', text)}
          />
          {errors.HsCRP && <Text style={styles.errorText}>{errors.HsCRP}</Text>}
        </View>

        {/* <View style={styles.unitContainer}>
          {['mg/dl', 'mg/L'].map(unit => (
            <TouchableOpacity
              key={unit}
              style={[
                styles.unitButton,
                formData?.hscrp_unit === unit && styles.unitButtonSelected,
              ]}
              onPress={() => handleChange('hscrp_unit', unit)}
            >
              <Text
                style={[
                  styles.unitText,
                  formData.hscrp_unit === unit && { color: 'white' },
                ]}
              >
                {unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View> */}

        <View style={[styles.inputGroup, { opacity: 0 }]}>
          <Text style={styles.label}>Hidden</Text>
          <TextInput style={styles.input} editable={false} />
        </View>
      </View>
    </View>
  );
};

// --- Styles ---
const createStyles = c => StyleSheet.create({
  container: {
    padding: hp(1),
    backgroundColor: c.card,
    flex: 1,
    elevation: 1,
    borderRadius: hp(1),
  },
  sectionTitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: wp(4.5),
    marginTop: hp(2),
    marginBottom: hp(1),
    color: color.QUESTION_COLOR,
  },
  subsectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: color.QUESTION_COLOR,
    marginTop: hp(1),
    marginBottom: hp(1),
    letterSpacing: 0.2,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(2),
  },
  noteIcon: {
    height: hp(2),
    width: wp(4),
    marginRight: hp(1),
  },
  noteTextWrap: {
    flex: 1,
    flexShrink: 1,
  },
  note: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    letterSpacing: 0.2,
    color: color.NOTE_COLOR,
    marginBottom: hp(2),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp(4),
    marginBottom: hp(2),
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.subText,
    marginBottom: hp(1),
  },
  input: {
    fontFamily: 'Poppins-Regular',
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
    borderRadius: wp(2),
  },
  unitContainer: {
    flexDirection: 'row',
    paddingVertical: hp(1),
    marginTop: Platform.OS === 'android' ? hp(3.8) : hp(2.9),
  },
  unitButton: {
    padding: hp(0.45),
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 5,
    backgroundColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  unitText: {
    fontSize: hp(1.5),
    color: c.text,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});

export default OnBoardingSeven;
