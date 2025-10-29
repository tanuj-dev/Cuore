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
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import Modal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Images } from '../../utilities';
import { setReminder } from '../../redux/slices';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { getHomeData, deleteReminderThunk } from '../../redux/slices';
import ReminderEditor from '../ReminderEditor';

const Reminder = ({ isVisible, setIsVisible, user_id, existingReminders }) => {
  console.log('User ID in Reminder:', user_id, isVisible, existingReminders);
  const dispatch = useDispatch();
  const [reminderText, setReminderText] = useState('');
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null); // null initially
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] = useState('Every Day');
  const [encRepeat, setEncRepeat] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [endRepeat, setEndRepeat] = useState('Never');
  const [flagAsMedication, setFlagAsMedication] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [requestId, setRequestId] = useState(null);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false); // hide picker

    if (selectedDate) {
      // Normalize to midday to avoid timezone rollback
      const normalizedDate = new Date(selectedDate);
      normalizedDate.setHours(12, 0, 0, 0); // avoids midnight timezone issues
      setDate(normalizedDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false); // hide picker
    if (selectedTime) {
      setTime(selectedTime); // ✅ update state with selected time
    }
  };

  // format time helper
  const formatTime = date => {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleAddEntry = async () => {
    const reminderData = {
      title: reminderText,
      startDate: date ? date.toISOString() : new Date().toISOString(),
      endDate: endRepeat || 'Never',
      time: time ? formatTime(time) : '5:30 PM',
      repeatFrequency: repeat || 'Daily',
      isMedication: flagAsMedication,
    };

    const userId = user_id;
    console.log(userId, 'userId in handleAddEntry');
    const res = await dispatch(
      setReminder({
        userId,
        reminderData,
      }),
    );
    if (res.status === 201 || 200) {
      const homeData = dispatch(getHomeData(userId));
      console.log('Home data after setting reminder:', homeData);
      setIsVisible(false);
    }
    console.log('Set Reminder Response:', res);
    // Close the modal
    // setIsVisible(false);
  };

  return (
    <Modal
      swipeThreshold={10}
      propagateSwipe={true}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      swipeDirection="down"
      isVisible={isVisible}
      onBackdropPress={() => setIsVisible(false)}
      style={styles.modal}
    >
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Text style={styles.title}>Add/Delete Entry</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Image
                  style={{
                    width: 13,
                    height: 13,
                    resizeMode: 'contain',
                    tintColor: '#6B7280',
                  }}
                  source={Images.CROSS}
                />
              </TouchableOpacity>
            </View>

            {/* Existing Entries */}
            <Text style={styles.subtitle}>Existing Entries</Text>
            <FlatList
              data={existingReminders}
              keyExtractor={(item, index) => item.id || index.toString()}
              renderItem={({ item }) => (
                <View style={styles.entryCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryText}>{item.title}</Text>
                    <Text style={styles.entrySubtext}>{item.time}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      console.log(item?.title);
                      setRequestId(item);
                      setShowModal(true);
                    }}
                    style={styles.iconButton}
                  >
                    <Image
                      source={Images.EDIT}
                      style={{ width: 16, height: 16 }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      dispatch(
                        deleteReminderThunk({
                          userId: user_id,
                          reminderId: item.id,
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
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No reminders yet</Text>
              }
            />

            {/* Divider */}
            <View style={styles.divider} />

            {/* Add New Entry */}
            <Text style={styles.subtitle}>Add New Entry</Text>

            {/* Reminder Input */}
            <View style={styles.inputGroup}>
              <TextInput
                placeholder="Enter reminder"
                style={styles.input}
                value={reminderText}
                onChangeText={setReminderText}
              />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 6,
                }}
              >
                <Image
                  source={Images.NOTICE} // replace with your image path
                  style={{ width: 16, height: 16, marginRight: 6 }}
                />
                <Text style={styles.infoText}>
                  Use '/' to separate multiple reminders set for the same time
                </Text>
              </View>
            </View>

            {/* Date & Time */}
            <View style={styles.dateTimeRow}>
              {/* Date Picker */}
              <TouchableOpacity
                style={styles.dateTimeInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: date ? '#000' : '#888' }}>
                  {date ? date.toDateString() : 'Start Date'}{' '}
                  {/* placeholder text */}
                </Text>

                <Image
                  source={Images.CALANDER} // replace with your calendar image
                  style={{ width: 18, height: 18, marginLeft: 8 }}
                />
              </TouchableOpacity>

              {/* Time Picker */}
              <TouchableOpacity
                style={styles.dateTimeInput}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={{ color: time ? '#000' : '#888' }}>
                  {time ? formatTime(time) : 'HH:MM'} {/* placeholder text */}
                </Text>
                <Image
                  source={Images.CLOCK} // replace with your clock image
                  style={{ width: 18, height: 18, marginLeft: 8 }}
                />
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker
                dateFormat="longdate"
                style={{ flex: 1, marginBottom: 10 }}
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

            {/* Repeat */}
            <View style={styles.pickercontainer}>
              {/* Fake input */}
              <TouchableOpacity
                style={styles.pickerinput}
                onPress={() => setShowPicker(!showPicker)}
              >
                <Text style={{ color: repeat ? '#000' : '#888' }}>Repeat</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: '#6B7280',
                    }}
                  >
                    {' '}
                    {repeat ? repeat : 'Daily'}
                  </Text>
                  <Image style={{ marginLeft: 4 }} source={Images.DOWN}></Image>
                </View>
              </TouchableOpacity>

              {/* Conditionally show Picker */}
              {showPicker && (
                <Picker
                  itemStyle={{ color: '#1E64AC' }} // iOS only
                  selectedValue={repeat}
                  onValueChange={itemValue => {
                    setRepeat(itemValue);
                    setShowPicker(false); // hide after selection
                  }}
                  style={styles.repeatpicker}
                >
                  <Picker.Item label="Never" value="Never" />
                  <Picker.Item label="Every Day" value="Every Day" />
                  <Picker.Item label="Every Week" value="Every Week" />
                  <Picker.Item label="Every 2 Week" value="Every 2 Week" />
                  <Picker.Item label="Every Month" value="Every Month" />
                  <Picker.Item label="Every Year" value="Every Year" />
                </Picker>
              )}
            </View>

            {/* End Repeat */}

            <View style={[styles.pickercontainer, { marginTop: -10 }]}>
              {/* Fake input */}
              <TouchableOpacity
                style={styles.pickerinput}
                onPress={() => setShowEndPicker(!showEndPicker)}
              >
                <Text style={{ color: '#888' }}>End Repeat</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: '#6B7280',
                    }}
                  >
                    {endRepeat ? endRepeat : 'Never'}
                  </Text>
                  <Image style={{ marginLeft: 4 }} source={Images.DOWN}></Image>
                </View>
              </TouchableOpacity>

              {/* Conditionally show Picker */}
              {showEndPicker && (
                <Picker
                  selectedValue={endRepeat}
                  onValueChange={itemValue => {
                    setEndRepeat(itemValue);
                    setShowEndPicker(false); // hide after selection
                  }}
                  style={styles.repeatpicker}
                  itemStyle={{ color: '#1E64AC' }} // iOS only
                >
                  <Picker.Item
                    style={{ color: 'red' }}
                    label="Never"
                    value="Never"
                  />
                  <Picker.Item label="On Date" value="On Date" />
                  {/* <Picker.Item label="After 6 Months" value="6 Months" /> */}
                </Picker>
              )}
            </View>

            {/* <Picker
            selectedValue={endRepeat}
            onValueChange={itemValue => setEndRepeat(itemValue)}
            style={styles.picker}
          >
           
          </Picker> */}

            {/* Flag as medication */}
            <View style={styles.switchRow}>
              <Switch
                value={flagAsMedication}
                onValueChange={setFlagAsMedication}
              />
              <Text style={styles.switchLabel}>Flag as medication</Text>
            </View>

            {/* Add Entry Button */}
            <TouchableOpacity
              onPress={() => handleAddEntry()}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>Add Entry</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      <ReminderEditor
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
  title: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 15,
    color: '#000000',
  },
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
  dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between' },
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
  picker: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginVertical: 10,
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
  pickercontainer: {
    marginVertical: 20,
    // margin: 20,
  },
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
    // marginTop: 10,
  },
});

export default Reminder;
