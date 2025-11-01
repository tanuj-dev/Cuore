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
import { editWakeupThunk } from '../../redux/slices';
import moment from 'moment';
import {
  getHomeData,
  editReminderThunk,
  deleteReminderThunk,
} from '../../redux/slices';

const ReminderEditor = ({ showModal, setShowModal, requestId, setVisible }) => {
  // console.log('Editing reminder:', requestId);
  const [reminderText, setReminderText] = useState('');
  // console.log('Initial reminder text:', reminderText);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dispatch = useDispatch();
  const onTimeSelected = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) setTime(selectedTime);
  };

  const userId = useSelector(state => state?.auth?.userId);
  // console.log('User ID in ReminderEditor:', userId);

  const handleChange = async () => {
    const formattedTime = moment(time).format('hh:mm A'); // e.g., "07:15 AM"

    const payload = {
      newWakeUpTime: formattedTime,
      // reminderText: reminderText.trim(),
    };
    const payload2 = {
      time: formattedTime,
      title: reminderText.trim(),
    };

    try {
      setLoading(true);
      const reminderId = requestId?.sourceId;
      console.log(payload2, 'payload');
      const res =
        requestId?.title == 'Wake Up'
          ? await dispatch(editWakeupThunk({ userId, payload })).unwrap()
          : await dispatch(
              editReminderThunk({ sourceId: reminderId, userId, payload2 }),
            ).unwrap();
      console.log(res, 'res');
      if (
        requestId?.title == 'Wake Up'
          ? res?.message ==
            'Wake-up time updated successfully. Timeline adjusted.'
          : res?.message == 'Reminder updated successfully.'
      ) {
        dispatch(getHomeData(userId));
        setVisible(false);
        setLoading(false);
      } else {
        setVisible(false);
        Alert.alert('Error', 'Failed to update reminder. Please try again.');
        setLoading(false);
      }

      console.log('✅ Wakeup updated successfully');
    } catch (err) {
      setLoading(false);
      console.error('❌ Wakeup update failed:', err);
    }

    setShowModal(false);
  };
  useEffect(() => {
    if (requestId) {
      setReminderText(requestId?.title || '');
    }
  }, [requestId]);

  return (
    <>
      <Modal
        onBackdropPress={() => setShowModal(false)} // 👈 tap outside to close
        onSwipeComplete={() => setShowModal(false)} // 👈 swipe down to close
        visible={showModal}
        transparent
        animationType="slide"
        animationIn="slideInUp"
        animationOut="slideOutDown"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          onPress={() => {
            setReminderText('');
            setShowModal(false);
          }}
          style={styles.overlay}
        >
          <View style={styles.bottomSheet}>
            <Text style={styles.title}>Edit Reminder</Text>

            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={{ color: '#333' }}>
                {time?.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={time.getTime() ? time : new Date()}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'default' : 'default'}
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

            <TouchableOpacity style={styles.button} onPress={handleChange}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Change</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)', // darker for better focus
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
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  charLimitText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -4,
  },
  errorText: {
    // backgroundColor: 'red',
    fontSize: 12,
    color: '#EF4444',
    // marginTop: 4,
    marginBottom: 10,
  },
});
