import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { wp, hp, Images, color } from '../../utilities';

const OnBoardingFive = ({ onFormChange, initialData = {} }) => {
  const [exerciseMinutes, setExerciseMinutes] = useState('');
  const [eatingPreference, setEatingPreference] = useState('');
  const [fruitsVeg, setFruitsVeg] = useState('');
  const [processedFood, setProcessedFood] = useState('');
  const [fiberFood, setFiberFood] = useState('');
  // ❌ was 'Sun' – this made it look like user had already selected
  const [restDay, setRestDay] = useState('');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ✅ Prefill from parent once
  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      setExerciseMinutes(initialData.min_exercise_per_week || '');
      setEatingPreference(initialData.eating_preference || '');
      setFruitsVeg(initialData.fruits_veg || '');
      setProcessedFood(initialData.processed_food || '');
      setFiberFood(initialData.high_fiber || '');
      // ❌ was 'Sun' – now only use value if it exists
      setRestDay(initialData.rest_day || '');

      if (initialData.preferred_ex_time) {
        const [timeStr, ampm] = initialData.preferred_ex_time.split(' ');
        const [hourStr, minStr] = timeStr.split(':');
        let hour = parseInt(hourStr);
        const min = parseInt(minStr);
        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;
        const dateObj = new Date();
        dateObj.setHours(hour);
        dateObj.setMinutes(min);
        setTime(dateObj);
      }
    }
  }, []); // ✅ Run only once

  const dayMap = {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday',
  };
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

  // ✅ Send data to parent — only when something changes
  useEffect(() => {
    if (onFormChange) {
      const payload = {
        min_exercise_per_week: exerciseMinutes,
        preferred_ex_time: formatTime(time),
        rest_day: restDay,
        eating_preference: eatingPreference,
        fruits_veg: fruitsVeg,
        processed_food: processedFood,
        high_fiber: fiberFood,
      };
      onFormChange(payload);
    }
  }, [
    exerciseMinutes,
    eatingPreference,
    fruitsVeg,
    processedFood,
    fiberFood,
    restDay,
    time,
  ]);

  const renderRadioOptions = (options, selected, onSelect) =>
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
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={{ fontFamily: 'Roboto-Regular', fontSize: wp(4) }}>
            {formatTime(time)}
          </Text>
          <Image
            style={{
              resizeMode: 'contain',
              height: hp(2),
              width: wp(5),
              tintColor: '#000000',
            }}
            source={Images.WATCH}
          />
        </TouchableOpacity>
        {showTimePicker && (
          <View style={styles.datePickerWrapper}>
            <DateTimePicker
              mode="time"
              value={time}
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeTime}
              textColor="#000000"
              themeVariant="light"
            />
          </View>
        )}

        <Text style={styles.question}>
          Select your weekly rest day from exercise
        </Text>

        <View style={styles.dayRow}>
          {Object.keys(dayMap).map(day => (
            <TouchableOpacity
              key={day}
              onPress={() => setRestDay(dayMap[day])} // Save full day name
              style={[
                styles.dayChip,
                restDay === dayMap[day] && styles.selectedDayChip,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  restDay === dayMap[day] && styles.selectedDayText,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🔴 show message until user selects a rest day (first time only) */}
        {!restDay && (
          <Text style={styles.errorText}>
            Please select your weekly rest day.
          </Text>
        )}

        <Text style={styles.question}>What is your eating preference?</Text>
        {renderRadioOptions(
          ['Vegetarian', 'Eggetarian', 'Non-Vegetarian'],
          eatingPreference,
          setEatingPreference,
        )}

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
  errorText: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.2),
    color: '#DC2626',
    marginTop: hp(0.5),
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
  datePickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: hp(1),
    padding: wp(2),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
