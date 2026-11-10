import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Bell, Pill, Trash2, Pencil } from 'lucide-react-native';
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

const Reminder = ({ isVisible, setIsVisible, user_id, scheduleReminder }) => {
  const dispatch = useDispatch();

  const [reminderText, setReminderText] = useState('');
  const [date, setDate] = useState(null); // store as actual Date object
  const [time, setTime] = useState(null); // store as actual Date object
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] = useState('Every Day');
  const [endRepeat, setEndRepeat] = useState('Never');
  const [endRepeatDate, setEndRepeatDate] = useState(null); // only meaningful when endRepeat === 'On Date'
  const [showPicker, setShowPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [flagAsMedication, setFlagAsMedication] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [existingReminder, setExistingReminder] = useState([]);
  console.log('Existing Reminders in Reminder Modal:', existingReminder);

  // ✅ Handle Date Picker (store as Date, not string)
  const handleDateChange = (event, selectedDate) => {
    // Android shows a one-shot dialog — close on any response. iOS's inline
    // spinner fires onChange on every wheel tick, so it must stay open until
    // the user taps Done.
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    // If user dismissed, don't update state
    if (event?.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      // Convert to local timezone (fix UTC → IST issue)
      const localDate = new Date(
        selectedDate.getTime() + selectedDate.getTimezoneOffset() * 60000,
      );
      setDate(localDate); // ✅ keep it as Date object
    }
  };

  // ✅ Handle End-Repeat "On Date" picker (same pattern as handleDateChange)
  const handleEndRepeatDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (event?.type === 'dismissed') {
      return;
    }
    if (selectedDate) {
      const localDate = new Date(
        selectedDate.getTime() + selectedDate.getTimezoneOffset() * 60000,
      );
      setEndRepeatDate(localDate);
    }
  };

  // ✅ Handle Time Picker
  const handleTimeChange = (event, selectedTime) => {
    // Android: one-shot dialog, close on response. iOS: stay open until Done.
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    // If user dismissed, don't update state
    if (event?.type === 'dismissed') {
      return;
    }

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
    if (reminderText.trim() === '') {
      setToastMessage('Please enter a reminder text.');
      setToastType('error');
      return;
    }

    // "On Date" needs an actual date picked — there's no sensible default to fall back to,
    // and sending the raw "On Date" label as if it were a date breaks reminder creation.
    if (endRepeat === 'On Date' && !endRepeatDate) {
      setToastMessage('Please choose an end date for "End Repeat".');
      setToastType('error');
      return;
    }

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

    // endDate must be an actual parseable date string (or the literal "Never" sentinel the
    // backend recognizes) — never the raw "End Repeat" dropdown label.
    let formattedEndDate = 'Never';
    if (endRepeat === 'On Date' && endRepeatDate) {
      const localEndDate = new Date(
        endRepeatDate.getTime() - endRepeatDate.getTimezoneOffset() * 60000,
      );
      formattedEndDate = localEndDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
    }

    const reminderData = {
      title: reminderText || 'Untitled Reminder',
      startDate: formattedDate,
      endDate: formattedEndDate,
      time: formattedTime,
      repeatFrequency: repeat || 'Every Day',
      isMedication: flagAsMedication,
    };

    // setExistingReminder(prev => [...prev, reminderData]);

    setLoading(true);
    try {
      const res = await dispatch(
        setReminder({ userId: user_id, reminderData }),
      );
      console.log('Set Reminder Response:', res);
      const id = res?.payload?.data?.data?._id || null;
      const sourceId = res?.payload?.data?.sourceId || null;

      if (res?.payload?.success) {
        setExistingReminder(prev => [
          ...prev,
          { ...reminderData, id, sourceId },
        ]);
        setToastMessage('Reminder set successfully!');
        setToastType('success');
        setReminderText('');

        // setIsVisible(false);
        // dispatch(getHomeData(user_id));
      } else {
        setToastMessage('Failed to set reminder.');
        setToastType('error');
      }
    } catch (error) {
      console.error(error);
      setToastMessage('Something went wrong.');
      setToastType('error');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setExistingReminder(scheduleReminder || []);
  }, [scheduleReminder]);

  return (
    <Modal
      // swipeThreshold={10}
      propagateSwipe
      animationIn="slideInUp"
      animationOut="slideOutDown"
      // swipeDirection="down"
      isVisible={isVisible}
      onBackdropPress={() => setIsVisible(false)}
      style={styles.modal}
    >
      {toastMessage ? (
        <Toast
          top={120}
          message={toastMessage}
          onHide={() => setToastMessage('')}
          type={toastType}
        />
      ) : null}

      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Your reminders</Text>
            <TouchableOpacity
              onPress={() => {
                dispatch(getHomeData(user_id));
                setIsVisible(false);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image style={styles.closeIcon} source={Images.CROSS} />
            </TouchableOpacity>
          </View>
          {/* Existing Reminders */}
          <Text style={styles.subtitle}>Today's reminders</Text>
          {existingReminder && existingReminder.length > 0 ? (
            existingReminder.map((item, index) => (
              <View key={item.id || index.toString()} style={styles.entryCard}>
                {/* Medicine vs other reminder at a glance (Launch edits, 5 Nov: happier, clearer). */}
                <View style={[styles.entryBadge, item.type === 'USER_MEDICATION' ? styles.entryBadgeMed : null]}>
                  {item.type === 'USER_MEDICATION' ? <Pill size={16} color="#7C3AED" /> : <Bell size={16} color="#2563EB" />}
                </View>
                <View style={styles.entryContent}>
                  <Text style={styles.entryText} numberOfLines={1}>
                    {item.title === 'Medication' ? item.description : item.title}
                  </Text>
                  <Text style={styles.entrySubtext}>{item.time}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setRequestId(item);
                    setShowModal(true);
                  }}
                  style={styles.iconButton}
                  accessibilityLabel="Edit reminder"
                  hitSlop={8}
                >
                  <Pencil size={18} color="#2563EB" />
                </TouchableOpacity>

                {item?.title?.toLowerCase() !== 'wake up' && (
                  <TouchableOpacity
                    accessibilityLabel="Delete reminder"
                    hitSlop={8}
                    onPress={() =>
                      // Deleting used to happen on the first tap with no way back — one slip of the
                      // thumb removed a prescribed medicine. Ask first.
                      Alert.alert(
                        'Delete this reminder?',
                        item.title === 'Medication' ? item.description : item.title,
                        [
                          { text: 'Keep', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => {
                              setExistingReminder(prev => prev.filter(reminder => reminder.sourceId !== item.sourceId));
                              dispatch(deleteReminderThunk({ userId: user_id, sourceId: item.sourceId }));
                            },
                          },
                        ],
                      )
                    }
                    style={styles.iconButton}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No reminders yet</Text>
          )}
          <View style={styles.divider} />
          {/* Add New Entry */}
          <Text style={styles.subtitle}>Add a reminder</Text>
          {/* Reminder Input */}
          <TextInput
            placeholder="What should we remind you about?"
            style={styles.input}
            placeholderTextColor="#6B7280"
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
              <Text
                style={[
                  styles.dateTimeLabel,
                  !date && styles.dateTimePlaceholder,
                ]}
              >
                {date ? formatDisplayDate(date) : 'Start Date'}
              </Text>
              <Image source={Images.CALANDER} style={styles.dateTimeIcon} />
            </TouchableOpacity>

            {/* Time Picker */}
            <TouchableOpacity
              style={styles.dateTimeInput}
              onPress={() => setShowTimePicker(!showTimePicker)}
            >
              <Text
                style={[
                  styles.dateTimeLabel,
                  !time && styles.dateTimePlaceholder,
                ]}
              >
                {time ? formatTime(time) : 'Current Time'}
              </Text>
              <Image source={Images.CLOCK} style={styles.dateTimeIcon} />
            </TouchableOpacity>
          </View>
          {/* One-tap times — no wheel needed for the usual four. */}
          <View style={styles.quickRow}>
            {[
              ['Morning', 8],
              ['Afternoon', 13],
              ['Evening', 18],
              ['Night', 21],
            ].map(([label, h]) => {
              const on = !!time && time.getHours() === h && time.getMinutes() === 0;
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.quickChip, on && styles.quickChipOn]}
                  onPress={() => {
                    const d = new Date();
                    d.setHours(h, 0, 0, 0);
                    setTime(d);
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={[styles.quickText, on && styles.quickTextOn]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {showDatePicker && (
            <View style={styles.datePickerWrapper}>
              <DateTimePicker
                value={date || new Date()}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                textColor="#000000"
                themeVariant="light"
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.pickerDoneButton}
                  onPress={() => {
                    if (!date) {
                      // No wheel movement yet — commit the shown value (today),
                      // converted the same way handleDateChange stores it
                      const now = new Date();
                      setDate(
                        new Date(
                          now.getTime() + now.getTimezoneOffset() * 60000,
                        ),
                      );
                    }
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {showTimePicker && (
            <View style={styles.datePickerWrapper}>
              <DateTimePicker
                value={time || new Date()}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                textColor="#000000"
                themeVariant="light"
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.pickerDoneButton}
                  onPress={() => {
                    if (!time) {
                      setTime(new Date());
                    }
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {/* Repeat — every option visible as a chip (was a dropdown you had to open, scroll and
              close). Same values the server already accepts. */}
          <Text style={styles.fieldLabel}>Repeat</Text>
          <View style={styles.repeatRow}>
            {[
              ['Never', 'Once'],
              ['Every Day', 'Daily'],
              ['Every Week', 'Weekly'],
              ['Every 2 Week', '2 weeks'],
              ['Every Month', 'Monthly'],
              ['Every Year', 'Yearly'],
            ].map(([value, label]) => (
              <TouchableOpacity
                key={value}
                onPress={() => setRepeat(value)}
                style={[styles.repeatChip, repeat === value && styles.repeatChipOn]}
              >
                <Text style={[styles.repeatText, repeat === value && styles.repeatTextOn]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* End Repeat */}
          <View style={styles.pickercontainerEnd}>
            <TouchableOpacity
              style={styles.pickerinput}
              onPress={() => setShowEndPicker(!showEndPicker)}
            >
              <Text style={styles.pickerLabel}>End Repeat</Text>
              <View style={styles.pickerValueRow}>
                <Text style={styles.pickerValue}>{endRepeat}</Text>
                <Image style={styles.pickerChevron} source={Images.DOWN} />
              </View>
            </TouchableOpacity>
            {showEndPicker && (
              <Picker
                selectedValue={endRepeat}
                onValueChange={itemValue => {
                  setEndRepeat(itemValue);
                  setShowEndPicker(false);
                }}
                style={styles.repeatpicker}
                itemStyle={styles.pickerItemStyle}
              >
                <Picker.Item label="Never" value="Never" />
                <Picker.Item label="On Date" value="On Date" />
              </Picker>
            )}
          </View>
          {/* End Repeat: "On Date" needs an actual date — same tappable-field +
              inline-spinner pattern as Start Date above. */}
          {endRepeat === 'On Date' && (
            <>
              <TouchableOpacity
                style={styles.dateTimeInputFull}
                onPress={() => setShowEndDatePicker(!showEndDatePicker)}
              >
                <Text
                  style={[
                    styles.dateTimeLabel,
                    !endRepeatDate && styles.dateTimePlaceholder,
                  ]}
                >
                  {endRepeatDate ? formatDisplayDate(endRepeatDate) : 'Select end date'}
                </Text>
                <Image source={Images.CALANDER} style={styles.dateTimeIcon} />
              </TouchableOpacity>
              {showEndDatePicker && (
                <View style={styles.datePickerWrapper}>
                  <DateTimePicker
                    value={endRepeatDate || new Date()}
                    mode="date"
                    display="spinner"
                    minimumDate={date || new Date()}
                    onChange={handleEndRepeatDateChange}
                    textColor="#000000"
                    themeVariant="light"
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.pickerDoneButton}
                      onPress={() => {
                        if (!endRepeatDate) {
                          const now = new Date();
                          setEndRepeatDate(
                            new Date(
                              now.getTime() + now.getTimezoneOffset() * 60000,
                            ),
                          );
                        }
                        setShowEndDatePicker(false);
                      }}
                    >
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
          {/* Medication Switch */}
          <View style={styles.switchRow}>
            <Switch
              value={flagAsMedication}
              onValueChange={setFlagAsMedication}
            />
            <Text style={styles.switchLabel}>This is a medicine (louder medicine alarm)</Text>
          </View>
          {/* Add Button */}
          <TouchableOpacity onPress={handleAddEntry} style={styles.addButton}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.addButtonText}>Add reminder</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Reminder Editor Modal */}
      <ReminderEditor
        existingReminder={existingReminder}
        setExistingReminder={setExistingReminder}
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
  entryBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  entryBadgeMed: { backgroundColor: '#EDE9FE' },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickChip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: '#F1F5F9' },
  quickChipOn: { backgroundColor: '#2563EB' },
  quickText: { fontSize: 12, color: '#334155', fontFamily: 'Poppins-Medium' },
  quickTextOn: { color: '#FFFFFF' },
  fieldLabel: { fontSize: 12.5, color: '#64748B', fontFamily: 'Poppins-Medium', marginBottom: 6 },
  repeatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  repeatChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  repeatChipOn: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  repeatText: { fontSize: 13, color: '#334155', fontFamily: 'Poppins-Medium' },
  repeatTextOn: { color: '#1D4ED8' },
  modal: { justifyContent: 'flex-end', margin: 0 },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: '90%',
    ...(Platform.OS === 'android' && { elevation: 0.5 }),
  },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    marginBottom: 15,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  closeIcon: {
    width: 20,
    height: 20,
    tintColor: '#64748B',
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    marginVertical: 10,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  entryContent: { flex: 1 },
  entryText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  entrySubtext: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  iconButton: { paddingHorizontal: 8 },
  entryIcon: { width: 18, height: 18 },
  deleteIcon: { width: 18, height: 18, tintColor: '#EF4444' },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginVertical: 15,
  },
  inputGroup: { marginBottom: 12 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  infoText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dateTimeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginRight: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeInputFull: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  dateTimePlaceholder: { color: '#94A3B8' },
  dateTimeIcon: { width: 18, height: 18 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  switchLabel: {
    fontFamily: 'Poppins-Regular',
    marginLeft: 8,
    fontSize: 14,
    color: '#475569',
    letterSpacing: 0.2,
  },
  addButton: {
    marginTop: 20,
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 40,
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    ...(Platform.OS === 'android' && { elevation: 2 }),
  },
  addButtonText: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  pickercontainer: { marginVertical: 20 },
  pickercontainerEnd: { marginVertical: 20, marginTop: 10 },
  pickerinput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 10,
  },
  pickerLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  pickerValueRow: { flexDirection: 'row', alignItems: 'center' },
  pickerValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#64748B',
    letterSpacing: 0.2,
  },
  pickerChevron: { marginLeft: 6 },
  pickerItemStyle: { color: '#11418A' },
  repeatpicker: {
    marginBottom: 100,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginVertical: 10,
    letterSpacing: 0.2,
  },
  datePickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginVertical: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerDoneButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#11418A',
    borderRadius: 8,
    marginTop: 4,
    marginRight: 4,
  },
  pickerDoneText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
});

export default Reminder;
