import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Modal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Images } from '../../utilities';
import {
  setReminder,
  getHomeData,
  deleteReminderThunk,
} from '../../redux/slices';
import { useDispatch } from 'react-redux';
import ReminderEditor from '../ReminderEditor';
import Toast from '../../components/Toast';

const Reminder = ({ isVisible, setIsVisible, user_id, existingReminders }) => {
  const dispatch = useDispatch();

  const [reminderText, setReminderText] = useState('');
  const [date, setDate] = useState(null); // store as actual Date object
  const [time, setTime] = useState(null); // store as actual Date object
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] = useState('Every Day');
  const [endRepeat, setEndRepeat] = useState('Never');
  const [showPicker, setShowPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [flagAsMedication, setFlagAsMedication] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ✅ Handle Date Picker (store as Date, not string)
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);

    if (selectedDate) {
      // Convert to local timezone (fix UTC → IST issue)
      const localDate = new Date(
        selectedDate.getTime() + selectedDate.getTimezoneOffset() * 60000,
      );
      setDate(localDate); // ✅ keep it as Date object
    }
  };

  // ✅ Handle Time Picker
  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime); // Use directly — it's already in local time
    } else {
      setTime(new Date()); // fallback to current time
    }
  };

  // ✅ Format Date for Display (e.g., "04 Nov 2025")
  const formatDisplayDate = dateObj => {
    if (!dateObj) return '';
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  };

  // ✅ Format Time for Display (e.g., "03:45 PM")
  const formatTime = dateObj => {
    if (!dateObj) return '';
    return dateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  };

  // ✅ Final Reminder Creation Handler
  const handleAddEntry = async () => {
    const currentTime = new Date();

    // Ensure valid date (default: today)
    const selectedDate = date ? date : new Date();
    const localDate = new Date(
      selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000,
    );
    const formattedDate = localDate.toISOString().split('T')[0]; // "YYYY-MM-DD"

    // Ensure valid time (default: current time)
    const selectedTime = time ? time : currentTime;
    const formattedTime = formatTime(selectedTime);

    const reminderData = {
      title: reminderText || 'Untitled Reminder',
      startDate: formattedDate,
      endDate: endRepeat || 'Never',
      time: formattedTime,
      repeatFrequency: repeat || 'Every Day',
      isMedication: flagAsMedication,
    };

    setLoading(true);
    try {
      const res = await dispatch(
        setReminder({ userId: user_id, reminderData }),
      );
      console.log('Set Reminder Response:', res);

      if (res?.payload?.success) {
        setToastMessage('Reminder set successfully!');
        setIsVisible(false);
        dispatch(getHomeData(user_id));
      } else {
        setToastMessage('Failed to set reminder.');
      }
    } catch (error) {
      console.error(error);
      setToastMessage('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      swipeThreshold={10}
      propagateSwipe
      animationIn="slideInUp"
      animationOut="slideOutDown"
      swipeDirection="down"
      isVisible={isVisible}
      onBackdropPress={() => setIsVisible(false)}
      style={styles.modal}
    >
      {toastMessage ? (
        <Toast message={toastMessage} onHide={() => setToastMessage('')} />
      ) : null}

      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator
        >
          {/* Header */}
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Text style={styles.title}>Add/Delete Entry</Text>
            <TouchableOpacity onPress={() => setIsVisible(false)}>
              <Image
                style={{ width: 13, height: 13, tintColor: '#6B7280' }}
                source={Images.CROSS}
              />
            </TouchableOpacity>
          </View>
          {/* Existing Reminders */}
          <Text style={styles.subtitle}>Existing Entries</Text>
          {existingReminders && existingReminders.length > 0 ? (
            existingReminders.map((item, index) => (
              <View key={item.id || index.toString()} style={styles.entryCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryText}>
                    {item.title == 'Medication' ? item.description : item.title}
                  </Text>
                  <Text style={styles.entrySubtext}>{item.time}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setRequestId(item);
                    setShowModal(true);
                  }}
                  style={styles.iconButton}
                >
                  <Image
                    source={Images.EDIT}
                    style={{ width: 16, height: 16 }}
                  />
                </TouchableOpacity>

                {item?.title?.toLowerCase() !== 'wake up' && (
                  <TouchableOpacity
                    onPress={() => {
                      dispatch(
                        deleteReminderThunk({
                          userId: user_id,
                          sourceId: item?.sourceId,
                        }),
                      );
                      dispatch(getHomeData(user_id));
                      setIsVisible(false);
                    }}
                    style={styles.iconButton}
                  >
                    <Image
                      source={Images.DELETE}
                      style={{ width: 16, height: 16, tintColor: '#EF4444' }}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No reminders yet</Text>
          )}
          <View style={styles.divider} />
          {/* Add New Entry */}
          <Text style={styles.subtitle}>Add New Entry</Text>
          {/* Reminder Input */}
          <TextInput
            placeholder="Enter reminder"
            style={styles.input}
            value={reminderText}
            onChangeText={setReminderText}
          />
          {/* Date & Time */}
          <View style={styles.dateTimeRow}>
            {/* Date Picker */}
            <TouchableOpacity
              style={styles.dateTimeInput}
              onPress={() => setShowDatePicker(!showDatePicker)}
            >
              <Text style={{ color: date ? '#000' : '#888' }}>
                {date ? formatDisplayDate(date) : 'Start Date'}
              </Text>
              <Image
                source={Images.CALANDER}
                style={{ width: 18, height: 18 }}
              />
            </TouchableOpacity>

            {/* Time Picker */}
            <TouchableOpacity
              style={styles.dateTimeInput}
              onPress={() => setShowTimePicker(!showTimePicker)}
            >
              <Text style={{ color: time ? '#000' : '#888' }}>
                {time ? formatTime(time) : 'Current Time'}
              </Text>
              <Image source={Images.CLOCK} style={{ width: 18, height: 18 }} />
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={date || new Date()}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={time || new Date()}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
            />
          )}
          {/* Repeat & End Repeat */}
          {/* Repeat */}{' '}
          <View style={styles.pickercontainer}>
            {' '}
            <TouchableOpacity
              style={styles.pickerinput}
              onPress={() => setShowPicker(!showPicker)}
            >
              {' '}
              <Text style={{ color: '#000' }}>Repeat</Text>{' '}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {' '}
                <Text
                  style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}
                >
                  {' '}
                  {repeat}{' '}
                </Text>{' '}
                <Image style={{ marginLeft: 4 }} source={Images.DOWN} />{' '}
              </View>{' '}
            </TouchableOpacity>{' '}
            {showPicker && (
              <Picker
                itemStyle={{ color: '#1E64AC' }}
                selectedValue={repeat}
                onValueChange={itemValue => {
                  setRepeat(itemValue);
                  setShowPicker(false);
                }}
                style={styles.repeatpicker}
              >
                {' '}
                <Picker.Item label="Never" value="Never" />{' '}
                <Picker.Item label="Every Day" value="Every Day" />{' '}
                <Picker.Item label="Every Week" value="Every Week" />{' '}
                <Picker.Item label="Every 2 Week" value="Every 2 Week" />{' '}
                <Picker.Item label="Every Month" value="Every Month" />{' '}
                <Picker.Item label="Every Year" value="Every Year" />{' '}
              </Picker>
            )}{' '}
          </View>{' '}
          {/* End Repeat */}{' '}
          <View style={[styles.pickercontainer, { marginTop: -10 }]}>
            {' '}
            <TouchableOpacity
              style={styles.pickerinput}
              onPress={() => setShowEndPicker(!showEndPicker)}
            >
              {' '}
              <Text style={{ color: '#000' }}>End Repeat</Text>{' '}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {' '}
                <Text
                  style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}
                >
                  {' '}
                  {endRepeat}{' '}
                </Text>{' '}
                <Image style={{ marginLeft: 4 }} source={Images.DOWN} />{' '}
              </View>{' '}
            </TouchableOpacity>{' '}
            {showEndPicker && (
              <Picker
                selectedValue={endRepeat}
                onValueChange={itemValue => {
                  setEndRepeat(itemValue);
                  setShowEndPicker(false);
                }}
                style={styles.repeatpicker}
                itemStyle={{ color: '#1E64AC' }}
              >
                {' '}
                <Picker.Item label="Never" value="Never" />{' '}
                <Picker.Item label="On Date" value="On Date" />{' '}
              </Picker>
            )}{' '}
          </View>
          {/* ... (keep your Picker logic same here) */}
          {/* Medication Switch */}
          <View style={styles.switchRow}>
            <Switch
              value={flagAsMedication}
              onValueChange={setFlagAsMedication}
            />
            <Text style={styles.switchLabel}>Flag as medication</Text>
          </View>
          {/* Add Button */}
          <TouchableOpacity onPress={handleAddEntry} style={styles.addButton}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>Add Entry</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Reminder Editor Modal */}
      <ReminderEditor
        userId={user_id}
        setIsVisible={setIsVisible}
        requestId={requestId}
        showModal={showModal}
        setShowModal={setShowModal}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: { justifyContent: 'flex-end', margin: 0 },
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    height: '90%',
  },
  title: { fontSize: 18, fontWeight: '500', marginBottom: 15, color: '#000' },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    marginVertical: 10,
    color: '#000',
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginVertical: 5,
  },
  entryText: { fontSize: 14, fontWeight: '500', color: '#000' },
  entrySubtext: { fontSize: 13, color: '#4B5563', marginTop: 4 },
  iconButton: { paddingHorizontal: 8 },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 15,
  },
  inputGroup: { marginBottom: 12 },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  infoText: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dateTimeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  switchLabel: { marginLeft: 8, fontSize: 14 },
  addButton: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#1E64AC',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  addButtonText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  pickercontainer: { marginVertical: 20 },
  pickerinput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 12,
    borderRadius: 6,
  },
  repeatpicker: {
    marginBottom: 100,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
});

export default Reminder;
