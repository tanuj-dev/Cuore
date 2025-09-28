import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Images, color, hp, wp } from '../../utilities'; // Make sure this utility works

const OnBoardingSeven = () => {
  const [oxygen, setOxygen] = useState('');
  const [pulse, setPulse] = useState('');
  const [bpUpper, setBpUpper] = useState('');
  const [bpLower, setBpLower] = useState('');
  const [fastingSugar, setFastingSugar] = useState('');
  const [afterMealSugar, setAfterMealSugar] = useState('');
  const [hba1c, setHba1c] = useState('');
  const [hdl, setHdl] = useState('');
  const [ldl, setLdl] = useState('');
  const [triglycerides, setTriglycerides] = useState('');
  const [hscrp, setHscrp] = useState('mg/dl');

  const renderDoubleInputRow = (
    label1,
    value1,
    onChange1,
    label2,
    value2,
    onChange2,
    placeholder2,
  ) => (
    <View style={styles.row}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label1}</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={value1}
          onChangeText={onChange1}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label2}</Text>
        <TextInput
          placeholder={placeholder2}
          style={styles.input}
          keyboardType="numeric"
          value={value2}
          onChangeText={onChange2}
        />
      </View>
    </View>
  );

  return (
    <View
      // showsVerticalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={{ padding: wp(5), paddingBottom: hp(5) }}
    >
      <Text style={styles.sectionTitle}>Vital Signs (Resting values)</Text>

      {renderDoubleInputRow(
        'Oxygen Saturation (%)',
        oxygen,
        setOxygen,
        'Pulse (bpm)',
        pulse,
        setPulse,
      )}

      {renderDoubleInputRow(
        'BP (Upper Reading)',
        bpUpper,
        setBpUpper,
        'BP (Lower Reading)',
        bpLower,
        setBpLower,
      )}

      <Text style={styles.sectionTitle}>Blood Tests</Text>
      <View style={{ flexDirection: 'row' }}>
        <Image
          style={{ height: hp(2), width: wp(4), marginRight: hp(1) }}
          source={Images.NOTICE}
        ></Image>
        <Text style={styles.note}>
          Yearly for non-diabetics, unless advised
        </Text>
      </View>

      {renderDoubleInputRow(
        'Blood Sugar (Fasting)',
        fastingSugar,
        setFastingSugar,
        'Blood Sugar (After Meal)',
        afterMealSugar,
        setAfterMealSugar,
        '2 hours after meal',
      )}

      {renderDoubleInputRow(
        'HbA1c',
        hba1c,
        setHba1c,
        'HDL (Annual)',
        hdl,
        setHdl,
      )}

      {renderDoubleInputRow(
        'LDL (Annual)',
        ldl,
        setLdl,
        'Triglycerides (Annual)',
        triglycerides,
        setTriglycerides,
      )}

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
            value={hscrp}
            onChangeText={setHscrp}
          />
        </View>
        <View style={styles.unitContainer}>
          <TouchableOpacity
            style={[
              styles.unitButton,
              hscrp === 'mg/dl' && styles.unitButtonSelected,
            ]}
            onPress={() => setHscrp('mg/dl')}
          >
            <Text
              style={[styles.unitText, hscrp === 'mg/dl' && { color: 'white' }]}
            >
              mg/dl
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.unitButton,
              hscrp === 'mg/L' && styles.unitButtonSelected,
            ]}
            onPress={() => setHscrp('mg/L')}
          >
            <Text
              style={[styles.unitText, hscrp === 'mg/L' && { color: 'white' }]}
            >
              mg/L
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.inputGroup, { opacity: 0 }]}>
          {/* Empty view to keep row layout even */}
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
