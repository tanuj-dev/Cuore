import React, { useState, useEffect, useRef } from 'react';
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

  const lastSentData = useRef(formData);

  // ✅ Sync from parent
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

  // ✅ Notify parent only if data actually changed
  useEffect(() => {
    if (
      typeof onFormChange === 'function' &&
      JSON.stringify(lastSentData.current) !== JSON.stringify(formData)
    ) {
      lastSentData.current = formData;
      onFormChange(formData);
    }
  }, [formData, onFormChange]);

  // ✅ Handle numeric conversion
  const handleChange = (key, value) => {
    const numericKeys = [
      'o2_sat',
      'pulse',
      'bp_upper',
      'bp_lower',
      'bs_f',
      'bs_am',
      'A1C',
      'HDL',
      'LDL',
      'Trig',
      'HsCRP', // still numeric but separate from unit
    ];

    let newValue = value;

    // If numeric field → strip invalid chars and convert to number
    if (numericKeys.includes(key)) {
      // Only digits and at most one dot
      const filtered = value.replace(/[^0-9.]/g, '');
      newValue = filtered === '' ? '' : Number(filtered); // empty string stays empty
    }

    setFormData(prev => ({ ...prev, [key]: newValue }));
  };

  // ✅ Render helper
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
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Vital Signs */}
      <Text style={styles.sectionTitle}>Vital Signs (Resting values)</Text>
      {renderDoubleInputRow(
        { label: 'Oxygen Saturation (%)', key: 'o2_sat' },
        { label: 'Pulse (bpm)', key: 'pulse' },
      )}
      {renderDoubleInputRow(
        { label: 'BP (Upper Reading)', key: 'bp_upper' },
        { label: 'BP (Lower Reading)', key: 'bp_lower' },
      )}

      {/* Blood Tests */}
      <Text style={styles.sectionTitle}>Blood Tests</Text>
      <View style={{ flexDirection: 'row', marginBottom: hp(2) }}>
        <Image
          style={{ height: hp(2), width: wp(4), marginRight: hp(1) }}
          source={Images.NOTICE}
        />
        <Text style={styles.note}>
          Yearly for non-diabetics, unless advised
        </Text>
      </View>

      {renderDoubleInputRow(
        { label: 'Blood Sugar (Fasting)', key: 'bs_f' },
        { label: 'Blood Sugar (After Meal)', key: 'bs_am' },
      )}
      {renderDoubleInputRow(
        { label: 'HbA1c', key: 'A1C' },
        { label: 'HDL (Annual)', key: 'HDL' },
      )}
      {renderDoubleInputRow(
        { label: 'LDL (Annual)', key: 'LDL' },
        { label: 'Triglycerides (Annual)', key: 'Trig' },
      )}

      {/* HsCRP */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: hp(2),
        }}
      >
        <View style={styles.inputGroup}>
          <Text style={styles.label}>HsCRP (Annual)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.HsCRP?.toString() || ''}
            onChangeText={text => handleChange('HsCRP', text)}
          />
        </View>

        {/* Unit Buttons */}
        <View style={styles.unitContainer}>
          {['mg/dl', 'mg/L'].map(unit => (
            <TouchableOpacity
              key={unit}
              style={[
                styles.unitButton,
                formData.hscrp_unit === unit && styles.unitButtonSelected,
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
        </View>

        {/* Spacer */}
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
  container: {
    padding: hp(1),
    backgroundColor: '#FFFFFF',
    flex: 1,
    elevation: 1,
    borderRadius: hp(1),
  },
  sectionTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(4.5),
    fontWeight: '490',
    marginTop: hp(2),
    marginBottom: hp(1),
    color: color.QUESTION_COLOR,
  },
  note: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.5),
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
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#374151',
    marginBottom: hp(1),
  },
  input: {
    fontFamily: 'Roboto-Regular',
    borderWidth: 1,
    borderColor: '#D1D5DB',
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
    padding: hp(0.5),
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
    color: '#000',
  },
});

export default OnBoardingSeven;
