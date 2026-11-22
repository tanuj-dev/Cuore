import React, { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react-native';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { color, hp, wp } from '../../utilities';

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
        <Info size={16} color="#B45309" style={styles.noteIcon} />
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
const styles = StyleSheet.create({
  container: { paddingVertical: 4, backgroundColor: '#FFFFFF', flex: 1 },
  sectionTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 16, marginTop: 18, marginBottom: 10, color: '#0F172A' },
  subsectionTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#334155', marginTop: 6, marginBottom: 8 },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(2),
  },
  noteIcon: { marginRight: 8, marginTop: 2 },
  noteTextWrap: {
    flex: 1,
    flexShrink: 1,
  },
  note: { fontFamily: 'Poppins-Regular', fontSize: 13, letterSpacing: 0.1, color: '#64748B', marginBottom: 6 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp(4),
    marginBottom: hp(2),
  },
  inputGroup: {
    flex: 1,
  },
  label: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#64748B', marginBottom: 6 },
  input: { fontFamily: 'Poppins-Regular', fontSize: 15, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#FFFFFF' },
  unitContainer: {
    flexDirection: 'row',
    paddingVertical: hp(1),
    marginTop: Platform.OS === 'android' ? hp(3.8) : hp(2.9),
  },
  unitButton: { paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 999, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  unitButtonSelected: { backgroundColor: '#1E64AC', borderColor: '#1E64AC' },
  unitText: { fontFamily: 'Poppins-Medium', fontSize: 12, color: '#334155' },
  errorText: { fontFamily: 'Poppins-Regular', fontSize: 12, color: '#BE123C', marginTop: 4 },
});

export default OnBoardingSeven;
