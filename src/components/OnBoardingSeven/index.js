import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Images, color, hp, wp } from '../../utilities';

const OnBoardingSeven = ({ initialData, onFormChange }) => {
  const [formData, setFormData] = useState({
    oxygen: '',
    pulse: '',
    bpUpper: '',
    bpLower: '',
    fastingSugar: '',
    afterMealSugar: '',
    hba1c: '',
    hdl: '',
    ldl: '',
    triglycerides: '',
    hscrp: 'mg/dl',
  });

  // Hydrate formData from initialData on mount
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, []);

  // Notify parent on every form change
  useEffect(() => {
    onFormChange?.(formData);
  }, [formData]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const renderDoubleInputRow = (first, second) => (
    <View style={styles.row}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{first.label}</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder={first.placeholder}
          value={formData[first.key]}
          onChangeText={text => handleChange(first.key, text)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{second.label}</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder={second.placeholder}
          value={formData[second.key]}
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
        { label: 'Oxygen Saturation (%)', key: 'oxygen' },
        { label: 'Pulse (bpm)', key: 'pulse' },
      )}
      {renderDoubleInputRow(
        { label: 'BP (Upper Reading)', key: 'bpUpper' },
        { label: 'BP (Lower Reading)', key: 'bpLower' },
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
        { label: 'Blood Sugar (Fasting)', key: 'fastingSugar' },
        {
          label: 'Blood Sugar (After Meal)',
          key: 'afterMealSugar',
          placeholder: '2 hours after meal',
        },
      )}
      {renderDoubleInputRow(
        { label: 'HbA1c', key: 'hba1c' },
        { label: 'HDL (Annual)', key: 'hdl' },
      )}
      {renderDoubleInputRow(
        { label: 'LDL (Annual)', key: 'ldl' },
        { label: 'Triglycerides (Annual)', key: 'triglycerides' },
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
            value={formData.hscrp}
            onChangeText={text => handleChange('hscrp', text)}
          />
        </View>

        <View style={styles.unitContainer}>
          {['mg/dl', 'mg/L'].map(unit => (
            <TouchableOpacity
              key={unit}
              style={[
                styles.unitButton,
                formData.hscrp === unit && styles.unitButtonSelected,
              ]}
              onPress={() => handleChange('hscrp', unit)}
            >
              <Text
                style={[
                  styles.unitText,
                  formData.hscrp === unit && { color: 'white' },
                ]}
              >
                {unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.inputGroup, { opacity: 0 }]}>
          <Text style={styles.label}>Hidden</Text>
          <TextInput style={styles.input} editable={false} />
        </View>
      </View>
    </View>
  );
};

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
    // marginLeft: wp(2),
    paddingVertical: hp(1),
    flexDirection: 'row',
    marginTop: Platform.OS == 'android ' ? hp(4) : hp(2.9),
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
