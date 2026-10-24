import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { editReminderThunk } from '../../redux/slices';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const ReminderEditor = ({
  showModal,
  setShowModal,
  requestId,
  setVisible,
  setExistingReminder,
  onSaved,
}) => {
  const [reminderText, setReminderText] = useState('');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Course fields — shown only for a reminder that has one (card.schedule: a medicine from a
  // prescription, or any reminder with an end date). Saved as "start on X, for N days"; the
  // server works out the end date and moves the medicine's other dose times with it.
  const course = requestId?.schedule || null;
  const [courseStart, setCourseStart] = useState(new Date());
  const [courseDays, setCourseDays] = useState('1');
  const [showStartPicker, setShowStartPicker] = useState(false);

  const dispatch = useDispatch();
  const userId = useSelector(state => state?.auth?.userId);
  const { alert, AlertComponent } = useCustomAlert();

  // ✅ safe fallbacks if parent did not pass these props
  const safeSetExistingReminder =
    typeof setExistingReminder === 'function' ? setExistingReminder : () => {};
  const safeSetVisible =
    typeof setVisible === 'function' ? setVisible : () => {};

  useEffect(() => {
    if (requestId) {
      const initialText =
        requestId?.title === 'Medication'
          ? requestId?.description
          : requestId?.title || '';
      setReminderText(initialText);

      /* SEED THE PICKER FROM THE CARD, NOT FROM THE CLOCK.
       *
       * `time` was initialised to `new Date()` and never touched again, so opening the editor
       * always showed the current time — and since handleChange sends whatever is in the picker,
       * simply opening a reminder and pressing Save silently MOVED it to whenever you happened to
       * be looking. That was survivable while only Wake Up could be edited; now that every
       * medication card offers the pencil, it would quietly reschedule a prescribed dose.
       *
       * The card's time arrives as "h:mm A" (timelineController formats it that way). Parsed
       * strictly so a value in some other shape falls back to now rather than to an Invalid Date,
       * which the picker renders as a blank wheel. */
      const parsed = moment(requestId?.time, ['h:mm A', 'H:mm', 'HH:mm'], true);
      if (parsed.isValid()) setTime(parsed.toDate());
      if (requestId?.schedule) {
        setCourseStart(moment(requestId.schedule.startDate, 'YYYY-MM-DD').toDate());
        setCourseDays(String(requestId.schedule.totalDays));
      }
    }
  }, [requestId]);

  const getReminderId = () =>
    requestId?.title === 'Wake Up' ? requestId?.id : requestId?.sourceId;

  const updateLocalReminder = (formattedTime, title) => {
    // use safe setter so it won't crash if undefined
    safeSetExistingReminder(prev =>
      prev.map(reminder => {
        const isMatch =
          requestId?.title === 'Wake Up'
            ? reminder.id === requestId?.id
            : reminder.sourceId === requestId?.sourceId;

        return isMatch ? { ...reminder, time: formattedTime, title } : reminder;
      }),
    );
  };

  const handleChange = async () => {
    const formattedTime = moment(time).format('hh:mm A');
    const trimmedTitle = reminderText.trim();

    if (!trimmedTitle) {
      setError('Reminder text cannot be empty');
      return;
    }

    const payload2 = { time: formattedTime, title: trimmedTitle };
    if (course) {
      const days = Number(courseDays);
      if (!Number.isInteger(days) || days < 1 || days > 365) {
        setError('Number of days must be between 1 and 365');
        return;
      }
      const startStr = moment(courseStart).format('YYYY-MM-DD');
      if (startStr !== course.startDate || days !== course.totalDays) {
        payload2.courseStartDate = startStr;
        payload2.durationDays = days;
      }
    }

    try {
      setLoading(true);
      updateLocalReminder(formattedTime, trimmedTitle);

      const res = await dispatch(
        editReminderThunk({
          sourceId: getReminderId(),
          userId,
          payload2,
        }),
      ).unwrap();

      if (res?.success) {
        setShowModal(false);
        // A course change adds or removes whole days of cards, which only a reload shows.
        if (typeof onSaved === 'function') onSaved();
      } else {
        alert('Error', res?.data?.error || 'Failed to update reminder. Please try again.');
        safeSetVisible(false);
      }
    } catch (err) {
      console.error('❌ Reminder update failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const onTimeSelected = (event, selectedTime) => {
    // Android: one-shot dialog, close on response. iOS: the inline spinner
    // fires onChange on every wheel tick — stay open until the user taps Done.
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event?.type === 'dismissed') return;
    if (selectedTime) setTime(selectedTime);
  };

  return (
    <>
      {AlertComponent}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressOut={() => setShowModal(false)}
          style={styles.overlay}
        >
          <View style={styles.bottomSheet}>
            <Text style={styles.title}>Edit Reminder</Text>

            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.timeText}>
                {time.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <View style={styles.datePickerWrapper}>
                <DateTimePicker
                  value={time}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeSelected}
                  textColor="#000000"
                  themeVariant="light"
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.pickerDoneButton}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {course && (
              <View style={styles.courseRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Start date</Text>
                  <TouchableOpacity
                    style={[styles.input, { marginBottom: 0 }]}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Text style={styles.timeText}>{moment(courseStart).format('D MMM YYYY')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ width: 110 }}>
                  <Text style={styles.fieldLabel}>Days</Text>
                  <TextInput
                    value={courseDays}
                    onChangeText={t => {
                      setCourseDays(t.replace(/[^0-9]/g, '').slice(0, 3));
                      setError('');
                    }}
                    keyboardType="number-pad"
                    style={[styles.input, { marginBottom: 0 }]}
                  />
                </View>
              </View>
            )}
            {course && (
              <Text style={styles.courseHint}>
                Ends{' '}
                {Number(courseDays) >= 1
                  ? moment(courseStart).add(Number(courseDays) - 1, 'days').format('D MMM YYYY')
                  : '—'}
              </Text>
            )}
            {showStartPicker && (
              <View style={styles.datePickerWrapper}>
                <DateTimePicker
                  value={courseStart}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selected) => {
                    if (Platform.OS === 'android') setShowStartPicker(false);
                    if (event?.type === 'dismissed') return;
                    if (selected) setCourseStart(selected);
                  }}
                  textColor="#000000"
                  themeVariant="light"
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.pickerDoneButton}
                    onPress={() => setShowStartPicker(false)}
                  >
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <TextInput
              placeholder="Reminder text"
              value={reminderText}
              onChangeText={text => {
                if (text.length <= 20) {
                  setReminderText(text);
                  setError('');
                } else {
                  setError('Reminder must be 20 characters or less');
                }
              }}
              style={styles.input}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleChange}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default ReminderEditor;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    fontSize: 16,
    color: '#374151',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  errorText: { fontSize: 12, color: '#EF4444', marginBottom: 10 },
  courseRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  fieldLabel: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  courseHint: { fontSize: 12, color: '#6B7280', marginBottom: 16 },
  datePickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
