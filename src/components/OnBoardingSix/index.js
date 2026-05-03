import React, { useState, useEffect, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
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
import { Images, wp, hp } from '../../utilities';

const RadioOption = ({ label, selected, onPress, styles }) => (
  <TouchableOpacity style={styles.radioOption} onPress={onPress}>
    <View style={styles.radioCircle}>
      {selected && <View style={styles.radioCircleSelected} />}
    </View>
    <Text style={styles.radioLabel}>{label}</Text>
  </TouchableOpacity>
);

const OnBoardingSix = ({ onFormChange, initialData = {} }) => {
  const { colors: c, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const timeSpinnerProps = useMemo(() => {
    if (Platform.OS !== 'ios') return {};
    return {
      themeVariant: isDark ? 'dark' : 'light',
      textColor: isDark ? c.text : '#0F172A',
    };
  }, [isDark, c.text]);

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
  }, [initialData]);

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
  }, [sleepHours, time, problems, enjoyment, anxiety, onFormChange]);

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
            styles={styles}
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
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: wp(4),
              color: c.text,
            }}
          >
            {formatTime(time)}
          </Text>
          <Image
            style={{
              resizeMode: 'contain',
              height: hp(2),
              width: wp(5),
              tintColor: c.navIconTint,
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
              {...timeSpinnerProps}
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
            styles={styles}
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
            styles={styles}
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
            styles={styles}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default OnBoardingSix;

const createStyles = c => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.card,
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
    borderColor: c.border,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },

  card: {
    backgroundColor: c.card,
    borderRadius: wp(2),
    padding: wp(4),
    elevation: 1,
    marginBottom: 10,
  },
  cardTitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: wp(3.8),

    color: c.onboardingQuestion,
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
    borderColor: c.border,
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
    color: c.onboardingOption,
  },
  timeInput: {
    fontFamily: 'Poppins-Regular',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: wp(2),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    marginBottom: hp(2),
  },
  subHint: {
    fontFamily: 'Poppins-Regular',
    fontSize: wp(3.2),
    color: c.onboardingNote,
    marginBottom: hp(1),
  },
  datePickerWrapper: {
    backgroundColor: c.card,
    borderRadius: 8,
    marginTop: hp(1),
    padding: wp(2),
    borderWidth: 1,
    borderColor: c.border,
  },
});
