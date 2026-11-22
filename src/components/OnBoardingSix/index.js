import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { wp, hp, color } from '../../utilities';

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
          <Clock size={18} color="#1E64AC" />
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
    backgroundColor: '#FFFFFF',
    padding: wp(0.5),
    // marginBottom: 10,
    // borderWidth: 1,
  },
  timeButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 14, paddingVertical: 13, paddingHorizontal: 14, width: '100%', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#FFFFFF' },

  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#0F172A', marginTop: 6, marginBottom: 10, letterSpacing: -0.1 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  radioCircleSelected: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1E64AC' },
  radioLabel: { fontFamily: 'Poppins-Regular', fontSize: 14, letterSpacing: 0.1, color: '#334155' },
  timeInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 16, backgroundColor: '#FFFFFF' },
  subHint: { fontFamily: 'Poppins-Regular', fontSize: 13, letterSpacing: 0.1, color: '#64748B', marginBottom: 6 },
  datePickerWrapper: { backgroundColor: '#FFFFFF', borderRadius: 12, marginTop: 8, padding: 8, borderWidth: 1, borderColor: '#E2E8F0' },
});
