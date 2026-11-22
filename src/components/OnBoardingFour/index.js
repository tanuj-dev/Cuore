import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { hp, wp } from '../../utilities';

const OnBoardingFour = ({ onFormChange, initialData = {} }) => {
  const [tobacco, setTobacco] = useState(initialData?.smoking || '');
  const [alcohol, setAlcohol] = useState(initialData?.alcohol || '');

  // ✅ Update parent when state changes (only when data changes)
  useEffect(() => {
    const formData = { smoking: tobacco, alcohol: alcohol };
    onFormChange && onFormChange(formData);
  }, [tobacco, alcohol]);

  const renderOptions = (options, selected, onSelect) =>
    options.map((option, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => onSelect(option)}
        style={styles.optionRow}
      >
        <View style={styles.radioOuter}>
          {selected === option && <View style={styles.radioInner} />}
        </View>
        <Text style={styles.optionText}>{option}</Text>
      </TouchableOpacity>
    ));

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.question}>
          In the last one year, how often have you used tobacco products?
        </Text>
        {renderOptions(
          ['Never', 'Quit >6 months ago', 'Occasionally', 'Daily'],
          tobacco,
          setTobacco,
        )}

        <Text style={styles.question}>
          How much alcohol do you drink?
          <Text style={styles.note}>
            {'\n'}1 drink = 1 pint beer, 45ml hard liquor, or 150ml wine
          </Text>
        </Text>
        {renderOptions(
          [
            'Never',
            'Quit >6 months ago',
            '1-2 drinks occasionally',
            '2 or more drinks at least twice per week',
          ],
          alcohol,
          setAlcohol,
        )}
      </View>
    </ScrollView>
  );
};

export default OnBoardingFour;

const styles = StyleSheet.create({
  container: {
    padding: wp(0.5),
    backgroundColor: '#fff',
    flexGrow: 1,
  },

  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  question: { fontFamily: 'Poppins-SemiBold', fontSize: 15, marginBottom: 14, color: '#0F172A' },
  note: { fontFamily: 'Poppins-Regular', fontSize: 13, letterSpacing: 0.1, color: '#64748B', marginBottom: 6 },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1E64AC' },
  optionText: { fontFamily: 'Poppins-Regular', fontSize: 14, letterSpacing: 0.1, color: '#334155', flex: 1 },
  button: {
    backgroundColor: '#1E64AC',
    paddingVertical: hp(1.8),
    borderRadius: wp(2.5),
    alignItems: 'center',
    marginBottom: hp(3),
  },
  buttonText: {
    fontFamily: 'Poppins-Regular',
    color: '#fff',
    fontSize: 15, letterSpacing: 0.3,
    
  },
});
