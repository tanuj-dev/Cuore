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
}) => {
  const [reminderText, setReminderText] = useState('');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    try {
      setLoading(true);
      updateLocalReminder(formattedTime, trimmedTitle);

      const res = await dispatch(
        editReminderThunk({
          sourceId: getReminderId(),
          userId,
          payload2: { time: formattedTime, title: trimmedTitle },
        }),
      ).unwrap();

      if (res?.success) {
        setShowModal(false);
      } else {
        alert('Error', 'Failed to update reminder. Please try again.');
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
