import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {Images, wp, hp, color} from '../../utilities';
import {Calendar as CalendarIcon} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const RadioOption = ({label, selected, onPress}) => (
  <TouchableOpacity style={styles.radioOption} onPress={onPress}>
    <View
      style={[styles.radioCircle, selected && styles.radioCircleSelected]}
    />
    <Text style={styles.radioLabel}>{label}</Text>
  </TouchableOpacity>
);

const OnBoardingSix = () => {
  const [sleepHours, setSleepHours] = useState('');
  const [problems, setProblems] = useState('');
  const [enjoyment, setEnjoyment] = useState('');
  const [anxiety, setAnxiety] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [time, setTime] = useState(new Date());

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          How many hours do you sleep regularly
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

        {/* Wake-up time */}
        <Text style={[styles.cardTitle, {marginTop: hp(2)}]}>
          What is your preferred wake-up time?
        </Text>
        <Text style={styles.subHint}>(Ideal between 5:30 AM - 7:00 AM)</Text>
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

        {/* Question: Problems overwhelming */}
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

        {/* Question: Less enjoyable */}
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

        {/* Question: Anxiety */}
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
    borderColor: '#D1D5DB',
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
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.8),
    fontWeight: '450',
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
    width: wp(4),
    height: wp(4),
    borderRadius: wp(2),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: wp(2),
  },
  radioCircleSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  radioLabel: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.5),
    color: color.ANSWER_COLOR,
  },
  timeInput: {
    fontFamily: 'Roboto-Regular',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: wp(2),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    marginBottom: hp(2),
  },
  subHint: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(3.2),
    color: color.NOTE_COLOR,
    marginBottom: hp(1),
  },
});
