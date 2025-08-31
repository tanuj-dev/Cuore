import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import {images, hp, wp} from '../../utilities';

const OnBoardingFour = () => {
  const [tobacco, setTobacco] = useState('');
  const [alcohol, setAlcohol] = useState('');

  const renderOptions = (options, selected, onSelect) =>
    options.map((option, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => onSelect(option)}
        style={styles.optionRow}>
        <View style={styles.radioOuter}>
          {selected === option && <View style={styles.radioInner} />}
        </View>
        <Text style={styles.optionText}>{option}</Text>
      </TouchableOpacity>
    ));

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {/* Card */}
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

      {/* Next Button */}
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
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.5),
    fontWeight: '450',
    marginBottom: hp(2),
    color: '#111827',
  },
  note: {
    fontFamily: 'Roboto-Regular',
    // marginTop: 40,
    fontSize: wp(3),
    fontWeight: '400',
    color: '#6B7280',
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
    borderColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  radioInner: {
    width: wp(2.5),
    height: wp(2.5),
    borderRadius: wp(1.25),
    backgroundColor: '#007bff',
  },
  optionText: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.5),
    color: '#374151',
    flex: 1,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: hp(1.8),
    borderRadius: wp(2.5),
    alignItems: 'center',
    marginBottom: hp(3),
  },
  buttonText: {
    fontFamily: 'Roboto-Regular',
    color: '#fff',
    fontSize: wp(4),
    fontWeight: '600',
  },
});
