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
    setExistingReminder(prev =>
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
        Alert.alert('Error', 'Failed to update reminder. Please try again.');
        setVisible(false);
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
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeSelected}
            />
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
});
