import React, { useEffect, useState, useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
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
  const { colors: c, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const spinnerPickerProps = useMemo(() => {
    if (Platform.OS !== 'ios') return {};
    return {
      themeVariant: isDark ? 'dark' : 'light',
      textColor: isDark ? c.text : '#0F172A',
    };
  }, [isDark, c.text]);

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

  const onTimeSelected = (_, selectedTime) => {
    setShowTimePicker(false);
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
              style={styles.inputShell}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.inputText}>
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
                  {...spinnerPickerProps}
                />
              </View>
            )}

            <TextInput
              placeholder="Reminder text"
              placeholderTextColor={c.inputPlaceholder}
              value={reminderText}
              onChangeText={text => {
                if (text.length <= 20) {
                  setReminderText(text);
                  setError('');
                } else {
                  setError('Reminder must be 20 characters or less');
                }
              }}
              style={styles.textField}
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

const createStyles = c => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    backgroundColor: c.card,
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
    color: c.text,
    marginBottom: 16,
  },
  inputShell: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
    color: c.text,
  },
  textField: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    fontSize: 16,
    color: c.text,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: c.onPrimary, fontWeight: '600', fontSize: 16 },
  errorText: { fontSize: 12, color: '#EF4444', marginBottom: 10 },
  datePickerWrapper: {
    backgroundColor: c.card,
    borderRadius: 8,
    marginBottom: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: c.border,
  },
});
