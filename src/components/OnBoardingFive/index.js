import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import {images, wp, hp, color, Images} from '../../utilities';
import DateTimePicker from '@react-native-community/datetimepicker';

const OnBoardingFive = () => {
  const [exerciseMinutes, setExerciseMinutes] = useState('');
  const [eatingPreference, setEatingPreference] = useState('');
  const [cuisine, setCuisine] = useState({indian: false, global: false});
  const [fruitsVeg, setFruitsVeg] = useState('');
  const [processedFood, setProcessedFood] = useState('');
  const [fiberFood, setFiberFood] = useState('');
  const [restDay, setRestDay] = useState('Sun'); // Just mock selection
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [time, setTime] = useState(new Date());

  const renderRadioOptions = (options, selected, onSelect) =>
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

  const formatTime = date => {
    const hours = date.getHours();
    const mins = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHour = hours % 12 || 12;
    const formattedMin = mins < 10 ? `0${mins}` : mins;
    return `${formattedHour}:${formattedMin} ${ampm}`;
  };
  const onChangeTime = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) setTime(selectedTime);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.question}>
          How many minutes of exercise do you typically get per week?
        </Text>
        {renderRadioOptions(
          ['Less than 75 min', '75 to 150 min', 'More than 150 min'],
          exerciseMinutes,
          setExerciseMinutes,
        )}

        <Text style={styles.question}>
          What time of day do you usually prefer to exercise?
        </Text>
        <Text style={styles.note}>Ideal range: 6:30 AM to 6:30 PM</Text>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setShowTimePicker(true)}>
          <Text style={{fontFamily: 'Roboto-Regular', fontSize: wp(4)}}>
            {formatTime(time)}
          </Text>
          <Image
            style={{
              resizeMode: 'contain',
              height: hp(2),
              width: wp(5),
              tintColor: '#000000',
            }}
            source={Images.WATCH}></Image>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            mode="time"
            value={time}
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeTime}
          />
        )}

        <Text style={styles.question}>
          select your weekly rest day from exercise
        </Text>
        <View style={styles.dayRow}>
          {['Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'].map(day => (
            <TouchableOpacity
              key={day}
              onPress={() => setRestDay(day)}
              style={[
                styles.dayChip,
                restDay === day && styles.selectedDayChip,
              ]}>
              <Text
                style={[
                  styles.dayText,
                  restDay === day && styles.selectedDayText,
                ]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.question}>What is your eating preference?</Text>
        {renderRadioOptions(
          ['Vegetarian', 'Eggetarian', 'Non-Vegetarian'],
          eatingPreference,
          setEatingPreference,
        )}

        {/* <Text style={styles.question}>What type of cuisine do you prefer?</Text>
        {['Indian', 'Global'].map(type => (
          <TouchableOpacity
            key={type}
            onPress={() =>
              setCuisine({
                indian: type === 'Indian',
                global: type === 'Global',
              })
            }
            style={styles.optionRow}>
            <View style={styles.checkbox}>
              {(type === 'Indian' ? cuisine.indian : cuisine.global) && (
                <View style={styles.checkboxTick} />
              )}
            </View>
            <Text style={styles.optionText}>{type}</Text>
          </TouchableOpacity>
        ))} */}

        <Text style={styles.question}>
          How often do you eat at least 4-5 servings of fruits and vegetables?
        </Text>
        {renderRadioOptions(
          ['Daily', 'Often', 'Sometimes', 'Rarely'],
          fruitsVeg,
          setFruitsVeg,
        )}

        <Text style={styles.question}>
          How often do you consume fried or processed foods?
        </Text>
        <Text style={styles.note}>
          (burgers, pizza, pasta, fries, chips, cookies, pakoda, etc.)
        </Text>
        {renderRadioOptions(
          ['Daily', 'Often', 'Sometimes', 'Rarely'],
          processedFood,
          setProcessedFood,
        )}

        <Text style={styles.question}>
          How often do you eat high-fiber foods?
        </Text>
        <Text style={styles.note}>
          (oats, whole grain breads/roti, pulses, beans, etc.)
        </Text>
        {renderRadioOptions(
          ['Daily', 'Often', 'Sometimes', 'Rarely'],
          fiberFood,
          setFiberFood,
        )}
      </View>
    </ScrollView>
  );
};

export default OnBoardingFive;

const styles = StyleSheet.create({
  container: {
    padding: wp(0.5),
    backgroundColor: 'white',
    flexGrow: 1,
  },
  timeButton: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginTop: hp(1),
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignSelf: 'flex-start',
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
    fontSize: wp(3.6),
    fontWeight: '450',
    marginTop: hp(2),
    marginBottom: hp(2),
    color: color.QUESTION_COLOR,
  },
  note: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3),
    color: color.NOTE_COLOR,
    marginBottom: hp(1),
  },
  optionRow: {
    // backgroundColor: 'red',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.2),
  },
  radioOuter: {
    width: wp(4.5),
    height: wp(4.5),
    borderRadius: wp(2.25),
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
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
  checkbox: {
    width: wp(4.5),
    height: wp(4.5),
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: hp(3),
    marginRight: wp(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxTick: {
    width: wp(2.5),
    height: wp(2.5),
    backgroundColor: '#007bff',
    borderRadius: hp(2),
  },
  optionText: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.5),
    color: color.ANSWER_COLOR,
    flex: 1,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: wp(2),
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    marginBottom: hp(1),
  },
  dropdownText: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.5),
    color: '#555',
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginBottom: hp(1),
  },
  dayChip: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: wp(2),
    backgroundColor: '#eaeaea',
    marginRight: wp(1),
    marginBottom: hp(1),
  },
  selectedDayChip: {
    backgroundColor: '#007bff',
  },
  dayText: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.2),
    color: '#333',
  },
  selectedDayText: {
    fontFamily: 'Roboto-Regular',
    color: '#fff',
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
