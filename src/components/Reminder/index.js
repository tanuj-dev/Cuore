import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import Modal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

const Reminder = ({ isVisible, setIsVisible }) => {
  const [reminderText, setReminderText] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] = useState('Daily');
  const [endRepeat, setEndRepeat] = useState('Never');
  const [flagAsMedication, setFlagAsMedication] = useState(false);

  const existingEntries = [
    { name: 'Metformin 500 mg', schedule: 'Daily, 8:00 AM' },
    { name: 'Storvas 10 mg', schedule: 'Daily, 9:00 PM' },
    { name: 'Allegra 180 mg', schedule: "5Jun'24 - 12Jun'24, 6:00 PM" },
  ];

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) setDate(selectedTime);
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={() => setIsVisible(false)}
      style={styles.modal}
    >
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Title */}
          <Text style={styles.title}>Add/Delete Entry</Text>

          {/* Existing Entries */}
          <Text style={styles.subtitle}>Existing Entries</Text>
          {existingEntries.map((entry, idx) => (
            <View key={idx} style={styles.entryCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryText}>{entry.name}</Text>
                <Text style={styles.entrySubtext}>{entry.schedule}</Text>
              </View>
              <TouchableOpacity style={styles.iconButton}>
                <Text style={{ fontSize: 16, color: '#1E64AC' }}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Text style={{ fontSize: 18, color: 'red' }}>🗑</Text>
              </TouchableOpacity>
            </View>
          ))}

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
            <Text style={styles.infoText}>
              Use '/' to separate multiple reminders set for the same time
            </Text>
          </View>

          {/* Date & Time */}
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{date.toDateString()}</Text>
              <Text>📅</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateTimeInput}
              onPress={() => setShowTimePicker(true)}
            >
              <Text>
                {date.getHours()}:
                {date.getMinutes().toString().padStart(2, '0')}
              </Text>
              <Text>⏰</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}

          {/* Repeat */}
          <Picker
            selectedValue={repeat}
            onValueChange={itemValue => setRepeat(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Daily" value="Daily" />
            <Picker.Item label="Weekly" value="Weekly" />
            <Picker.Item label="Monthly" value="Monthly" />
          </Picker>

          {/* End Repeat */}
          <Picker
            selectedValue={endRepeat}
            onValueChange={itemValue => setEndRepeat(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Never" value="Never" />
            <Picker.Item label="After 1 Month" value="1Month" />
            <Picker.Item label="After 6 Months" value="6Months" />
          </Picker>

          {/* Flag as medication */}
          <View style={styles.switchRow}>
            <Switch
              value={flagAsMedication}
              onValueChange={setFlagAsMedication}
            />
            <Text style={styles.switchLabel}>Flag as medication</Text>
          </View>

          {/* Add Entry Button */}
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>Add Entry</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
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
  title: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  subtitle: { fontSize: 16, fontWeight: '500', marginVertical: 10 },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginVertical: 5,
  },
  entryText: { fontSize: 14, fontWeight: '500', color: '#000' },
  entrySubtext: { fontSize: 13, color: '#4B5563' },
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
});

export default Reminder;
