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

  card: {
    backgroundColor: '#FFFFFF',
    padding: wp(4),
    borderRadius: wp(3),
    marginBottom: hp(2),
    elevation: 1,
  },
  question: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14, letterSpacing: 0.2,
    
    marginBottom: hp(2),
    color: '#111827',
  },
  note: {
    fontFamily: 'Poppins-Regular',
    // marginTop: 40,
    fontSize: 13, letterSpacing: 0.1,
    
    color: '#64748B',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  radioOuter: {
    width: wp(4.5),
    height: wp(4.5),
    borderRadius: wp(2.25),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  radioInner: {
    width: wp(2.5),
    height: wp(2.5),
    borderRadius: wp(1.25),
    backgroundColor: '#11418A',
  },
  optionText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14, letterSpacing: 0.2,
    color: '#475569',
    flex: 1,
  },
  button: {
    backgroundColor: '#11418A',
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
