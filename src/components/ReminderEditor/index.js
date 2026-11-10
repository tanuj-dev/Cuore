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
  Pressable,
  KeyboardAvoidingView,
} from 'react-native';
import { Bell, Clock, Pill, X } from 'lucide-react-native';
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

  // Quick times (Launch edits, 5 Nov: "reminder setting, editing needs to be better — less
  // clumsy"): most reminders are morning / afternoon / evening / night, so one tap instead of a wheel.
  const QUICK_TIMES = [
    { label: 'Morning', h: 8, m: 0 },
    { label: 'Afternoon', h: 13, m: 0 },
    { label: 'Evening', h: 18, m: 0 },
    { label: 'Night', h: 21, m: 0 },
  ];
  const setQuickTime = (h, m) => {
    const d = new Date(time);
    d.setHours(h, m, 0, 0);
    setTime(d);
    setShowTimePicker(false);
  };
  const isMedicine = requestId?.type === 'USER_MEDICATION' || requestId?.title === 'Medication';
  const MAX_TITLE = 40;

  return (
    <>
      {AlertComponent}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          {/* The backdrop is its OWN layer. It used to wrap the sheet, so a tap on any empty
              part of the sheet closed it mid-edit. */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowModal(false)} />
          <View style={styles.bottomSheet}>
            <View style={styles.grabber} />
            <View style={styles.headRow}>
              <View style={[styles.headIcon, isMedicine ? styles.headIconMed : null]}>
                {isMedicine ? <Pill size={20} color="#7C3AED" /> : <Bell size={20} color="#2563EB" />}
              </View>
              <Text style={styles.title}>Edit reminder</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} hitSlop={12} accessibilityLabel="Close">
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Reminder</Text>
            <TextInput
              placeholder="e.g. Metformin 500"
              placeholderTextColor="#94A3B8"
              value={reminderText}
              maxLength={MAX_TITLE}
              onChangeText={text => {
                setReminderText(text);
                setError('');
              }}
              style={styles.input}
            />
            <Text style={styles.counter}>{reminderText.length}/{MAX_TITLE}</Text>

            <Text style={styles.fieldLabel}>Time</Text>
            <TouchableOpacity style={styles.timeCard} onPress={() => setShowTimePicker(v => !v)} activeOpacity={0.85}>
              <Clock size={20} color="#2563EB" />
              <Text style={styles.timeBig}>{moment(time).format('h:mm A')}</Text>
              <Text style={styles.timeChange}>{showTimePicker ? 'Done' : 'Change'}</Text>
            </TouchableOpacity>
            <View style={styles.chips}>
              {QUICK_TIMES.map(q => {
                const on = time.getHours() === q.h && time.getMinutes() === q.m;
                return (
                  <TouchableOpacity key={q.label} onPress={() => setQuickTime(q.h, q.m)} style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{q.label}</Text>
                    <Text style={[styles.chipSub, on && styles.chipTextOn]}>{moment().hour(q.h).minute(q.m).format('h A')}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {showTimePicker && (
              <View style={styles.datePickerWrapper}>
                <DateTimePicker
                  value={time}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeSelected}
                  textColor="#000000"
                  themeVariant="light"
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity style={styles.pickerDoneButton} onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {course && (
              <View style={styles.courseRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Start date</Text>
                  <TouchableOpacity style={[styles.input, { marginBottom: 0 }]} onPress={() => setShowStartPicker(true)}>
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
                  <TouchableOpacity style={styles.pickerDoneButton} onPress={() => setShowStartPicker(false)}>
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleChange}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

export default ReminderEditor;

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)' },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 12,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', marginBottom: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  headIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  headIconMed: { backgroundColor: '#EDE9FE' },
  title: { flex: 1, fontSize: 19, fontFamily: 'Poppins-SemiBold', color: '#0F172A' },
  fieldLabel: { fontSize: 12.5, fontFamily: 'Poppins-Medium', color: '#64748B', marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 4,
    fontSize: 16,
    color: '#0F172A',
  },
  counter: { alignSelf: 'flex-end', fontSize: 11, color: '#94A3B8', marginBottom: 12 },
  timeText: { fontSize: 16, color: '#0F172A' },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  timeBig: { flex: 1, fontSize: 22, fontFamily: 'Poppins-SemiBold', color: '#1E3A8A' },
  timeChange: { fontSize: 13, fontFamily: 'Poppins-Medium', color: '#2563EB' },
  chips: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 16 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: '#F1F5F9' },
  chipOn: { backgroundColor: '#2563EB' },
  chipText: { fontSize: 12, fontFamily: 'Poppins-Medium', color: '#334155' },
  chipSub: { fontSize: 10.5, color: '#64748B', marginTop: 1 },
  chipTextOn: { color: '#FFFFFF' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#F1F5F9' },
  cancelText: { color: '#334155', fontFamily: 'Poppins-Medium', fontSize: 15 },
  button: { flex: 2, backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontFamily: 'Poppins-SemiBold', fontSize: 16 },
  errorText: { fontSize: 12.5, color: '#DC2626', marginBottom: 10 },
  courseRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  courseHint: { fontSize: 12, color: '#64748B', marginBottom: 16 },
  datePickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerDoneButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    marginTop: 4,
    marginRight: 4,
  },
  pickerDoneText: { color: '#FFFFFF', fontFamily: 'Poppins-Medium', fontSize: 14 },
});
