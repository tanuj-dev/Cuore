import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Switch,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Images, hp, wp } from '../../utilities';

const Reminder = props => {
  const { isVisible, setIsVisible, navigation } = props;
  const [reminderText, setReminderText] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] = useState('Daily');
  const [endRepeat, setEndRepeat] = useState('Never');
  const [isMedicine, setIsMedicine] = useState(false);
  const [flagAsMedication, setFlatAsMedication] = useState(false);

  const existingEntries = [
    { name: 'Metformin 500 mg', schedule: 'Daily, 8:00 AM' },
    { name: 'Storvas 10 mg', schedule: 'Daily, 9:00 PM' },
    { name: 'Allegra 180 mg', schedule: "5Jun'24 - 12Jun'24, 6:00 PM" },
  ];

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
  };

  const handleTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || date;
    setShowTimePicker(false);
    setDate(currentTime);
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={() => setIsVisible(false)}
      style={styles.modal}
    >
      <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <Text
          style={{
            backgroundColor: 'transparent',
            color: 'white',
            fontSize: hp(4),
          }}
        >
          will update soom
        </Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: { justifyContent: 'flex-end', margin: 0 },
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    // borderTopLeftRadius: 20,
    // borderTopRightRadius: 20,
    // padding: 20,
    height: '93%',
    marginBottom: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: '400',
    marginBottom: 10,
    color: '#000000',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    marginVertical: 10,
    marginLeft: hp(1),
    color: '#000000',
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginVertical: 5,
    marginLeft: hp(2),
  },
  entryText: { fontSize: 14, fontWeight: '400', color: '#000000' },
  entrySubtext: { fontSize: 14, color: '#4B5563' },
  iconButton: { paddingHorizontal: 10 },
  icon: { fontSize: 16 },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 15,
    marginHorizontal: hp(2),
  },
  inputGroup: {
    marginBottom: 2,
    // paddingHorizontal: hp(2.5),
    // backgroundColor: 'red',
  },
  input: {
    // paddingVertical: hp(3),
    height: hp(6),
    fontSize: hp(2),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    // padding: hp(2),
  },
  infoText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  dateTimeInput: {
    // width: hp(10),
    // backgroundColor: 'red',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    flex: 1,
    marginRight: 10,
    justifyContent: 'space-between',
  },
  pickerRow: {
    // flex: 1,
    // backgroundColor: 'red',
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    // marginBottom: 40,
    // borderWidth: 1,
    height: hp(15),
  },
  picker: { margin: 0 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: -hp(3) },
  switchLabel: { marginLeft: 10, fontSize: 14 },
  addButton: {
    marginTop: hp(1.5),
    alignSelf: 'center',
    width: hp(12),
    // height: hp(),
    backgroundColor: '#1E64AC',
    borderRadius: 8,
    paddingVertical: hp(0.8),
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 15, fontWeight: '400' },
});

export default Reminder;
