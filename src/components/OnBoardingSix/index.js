import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Images, wp, hp, color } from '../../utilities';

const RadioOption = ({ label, selected, onPress }) => (
  <TouchableOpacity style={styles.radioOption} onPress={onPress}>
    <View style={styles.radioCircle}>
      {selected && <View style={styles.radioCircleSelected} />}
    </View>
    <Text style={styles.radioLabel}>{label}</Text>
  </TouchableOpacity>
);

const OnBoardingSix = ({ onFormChange, initialData = {} }) => {
  const [sleepHours, setSleepHours] = useState('');
  const [problems, setProblems] = useState('');
  const [enjoyment, setEnjoyment] = useState('');
  const [anxiety, setAnxiety] = useState('');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ✅ Prefill data when coming back to this screen
  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      setSleepHours(initialData.sleep_hours || '');
      setProblems(initialData.problems_overwhelming || '');
      setEnjoyment(initialData.enjoyable || '');
      setAnxiety(initialData.felt_nervous || '');

      if (initialData.wake_time) {
        const [timeStr, ampm] = initialData.wake_time.split(' ');
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
  }, []); // ✅ Run once only

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

  // ✅ Send data upward only when it changes
  useEffect(() => {
    if (onFormChange) {
      const payload = {
        sleep_hours: sleepHours,
        wake_time: formatTime(time),
        problems_overwhelming: problems,
        enjoyable: enjoyment,
        felt_nervous: anxiety,
      };
      onFormChange(payload);
    }
  }, [sleepHours, time, problems, enjoyment, anxiety]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          How many hours do you sleep regularly?
        </Text>
        {[
          'Less than 6 hours',
          'Between 6 to 7 hours',
          'Between 7 to 8 hours',
          'Between 8 to 9 hours',
          'More than 9 hours',
        ].map(option => (
          <RadioOption
            key={option}
            label={option}
            selected={sleepHours === option}
            onPress={() => setSleepHours(option)}
          />
        ))}

        <Text style={[styles.cardTitle, { marginTop: hp(2) }]}>
          What is your preferred wake-up time?
        </Text>
        <Text style={styles.subHint}>(Ideal between 5:30 AM - 7:00 AM)</Text>

        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: wp(4) }}>
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

        <Text style={styles.cardTitle}>
          In the past 3 months, have your problems felt overwhelming?
        </Text>
        {['Always', 'Often', 'Sometimes', 'Never'].map(option => (
          <RadioOption
            key={option}
            label={option}
            selected={problems === option}
            onPress={() => setProblems(option)}
          />
        ))}

        <Text style={styles.cardTitle}>
          Lately, have activities felt less enjoyable or engaging?
        </Text>
        {['Always', 'Often', 'Sometimes', 'Never'].map(option => (
          <RadioOption
            key={option}
            label={option}
            selected={enjoyment === option}
            onPress={() => setEnjoyment(option)}
          />
        ))}

        <Text style={styles.cardTitle}>
          Have you felt nervous, anxious, or on edge lately?
        </Text>
        {['Always', 'Often', 'Sometimes', 'Never'].map(option => (
          <RadioOption
            key={option}
            label={option}
            selected={anxiety === option}
            onPress={() => setAnxiety(option)}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default OnBoardingSix;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFF',
    padding: wp(0.5),
    // marginBottom: 10,
    // borderWidth: 1,
  },
  timeButton: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginTop: hp(1),
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(2),
    padding: wp(4),
    elevation: 1,
    marginBottom: 10,
  },
  cardTitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: wp(3.8),
    
    color: color.QUESTION_COLOR,
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  radioCircle: {
    width: wp(4.5),
    height: wp(4.5),
    borderRadius: wp(2.25),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  radioCircleSelected: {
    width: wp(2.5),
    height: wp(2.5),
    borderRadius: wp(1.25),
    backgroundColor: '#11418A',
  },
  radioLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14, letterSpacing: 0.2,
    color: color.ANSWER_COLOR,
  },
  timeInput: {
    fontFamily: 'Poppins-Regular',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: wp(2),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    marginBottom: hp(2),
  },
  subHint: {
    fontFamily: 'Poppins-Regular',
    fontSize: wp(3.2),
    color: color.NOTE_COLOR,
    marginBottom: hp(1),
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
