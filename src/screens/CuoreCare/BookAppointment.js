import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { Video, Phone, MessageSquare, CalendarX, Clock } from 'lucide-react-native';

import { CC } from './ccTheme';
import { fmtTime } from './ccFormat';
import { CCHeader, PrimaryButton, DoctorAvatar, Card } from './components';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import {
  bookAppointment,
  getDoctorAvailableDates,
  getDoctorSlots,
} from '../../redux/CuoreCare/thunks';
import { resetBookingAvailability } from '../../redux/CuoreCare/slice';

const F = CC.fonts;

const MODES = [
  { key: 'video', label: 'Video', desc: 'Face-to-face', icon: Video },
  { key: 'voice', label: 'Voice', desc: 'Audio only', icon: Phone },
  { key: 'chat', label: 'Chat', desc: 'Text messages', icon: MessageSquare },
];

// Device timezone (falls back to the backend default for older Hermes without full Intl).
function deviceTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) return tz;
  } catch (_) {}
  return 'Asia/Kolkata';
}

// Two-line label for a date chip: "Today / Tmrw / Mon" + day number + month.
function dateChip(dateStr) {
  const m = moment(dateStr, 'YYYY-MM-DD');
  let top = m.format('ddd');
  if (m.isSame(moment(), 'day')) top = 'Today';
  else if (m.isSame(moment().add(1, 'day'), 'day')) top = 'Tmrw';
  return { top, day: m.format('D'), month: m.format('MMM') };
}

export default function BookAppointment({ navigation, route }) {
  const dispatch = useDispatch();
  const doctor = route.params?.doctor || {};
  const { alert, AlertComponent } = useCustomAlert();

  const actionLoading = useSelector(state => state.cuoreCare.action.loading);
  const { datesLoading, dates, configured, slotsLoading, slots, slotsDate } = useSelector(
    state => state.cuoreCare.availability,
  );

  const [mode, setMode] = useState('video');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [reason, setReason] = useState('');

  const doctorId = doctor?._id;

  // Load the doctor's bookable dates on mount; clear slot state on unmount.
  useEffect(() => {
    if (doctorId) dispatch(getDoctorAvailableDates({ doctorId }));
    return () => {
      dispatch(resetBookingAvailability());
    };
  }, [dispatch, doctorId]);

  const pickDate = useCallback(
    dateStr => {
      setSelectedDate(dateStr);
      setSelectedSlot(null);
      if (doctorId) dispatch(getDoctorSlots({ doctorId, date: dateStr }));
    },
    [dispatch, doctorId],
  );

  const handleBook = async () => {
    if (!doctorId) {
      alert('Missing doctor', 'Please select a doctor again.');
      return;
    }
    if (!selectedSlot) {
      alert('Pick a time', 'Please choose an available time slot.');
      return;
    }
    const res = await dispatch(
      bookAppointment({
        doctorId,
        mode,
        scheduledStart: selectedSlot.start,
        reason: reason.trim(),
        timezone: deviceTimezone(),
      }),
    );

    if (bookAppointment.fulfilled.match(res)) {
      const appt = res.payload;
      navigation.replace('CuoreCareAppointment', {
        appointmentId: appt.appointmentId,
        justBooked: true,
      });
      return;
    }

    const err = res.payload;
    // Slot got taken between selection and booking → refresh this day's slots and let them retry.
    if (err?.code === 'SLOT_TAKEN' || err?.code === 'SLOT_UNAVAILABLE') {
      setSelectedSlot(null);
      if (selectedDate) dispatch(getDoctorSlots({ doctorId, date: selectedDate }));
      alert('Slot no longer available', err?.message || 'Please pick another time.');
    } else if (err?.code === 'NO_AVAILABILITY') {
      alert('No slots yet', err?.message || "This doctor hasn't opened any consultation slots yet.");
    } else {
      alert('Could not book', err?.message || 'Please try another time.');
    }
  };

  const renderDates = () => {
    if (datesLoading) {
      return (
        <View style={styles.inlineLoading}>
          <ActivityIndicator color={CC.primary} />
        </View>
      );
    }
    if (!configured) {
      return (
        <View style={styles.emptyBox}>
          <CalendarX size={22} color={CC.muted} />
          <Text style={styles.emptyText}>
            This doctor hasn't opened any consultation slots yet. Please check back soon.
          </Text>
        </View>
      );
    }
    if (!dates.length) {
      return (
        <View style={styles.emptyBox}>
          <CalendarX size={22} color={CC.muted} />
          <Text style={styles.emptyText}>No available dates in the coming weeks.</Text>
        </View>
      );
    }
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateRow}
      >
        {dates.map(d => {
          const active = selectedDate === d.date;
          const c = dateChip(d.date);
          return (
            <TouchableOpacity
              key={d.date}
              style={[styles.dateCard, active && styles.dateCardActive]}
              onPress={() => pickDate(d.date)}
              activeOpacity={0.85}
            >
              <Text style={[styles.dateTop, active && styles.dateActiveText]}>{c.top}</Text>
              <Text style={[styles.dateDay, active && styles.dateActiveText]}>{c.day}</Text>
              <Text style={[styles.dateMonth, active && styles.dateActiveText]}>{c.month}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderSlots = () => {
    if (!selectedDate) return null;
    if (slotsLoading || slotsDate !== selectedDate) {
      return (
        <View style={styles.inlineLoading}>
          <ActivityIndicator color={CC.primary} />
        </View>
      );
    }
    if (!slots.length) {
      return (
        <View style={styles.emptyBox}>
          <Clock size={22} color={CC.muted} />
          <Text style={styles.emptyText}>No open slots for this day. Try another date.</Text>
        </View>
      );
    }
    return (
      <View style={styles.slotWrap}>
        {slots.map(slot => {
          const active = selectedSlot?.start === slot.start;
          return (
            <TouchableOpacity
              key={slot.start}
              style={[styles.slotChip, active && styles.slotChipActive]}
              onPress={() => setSelectedSlot(slot)}
              activeOpacity={0.85}
            >
              <Text style={[styles.slotText, active && styles.slotTextActive]}>
                {fmtTime(slot.start)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {AlertComponent}
      <CCHeader title="Book consultation" onBack={() => navigation.goBack()} />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={24}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor summary */}
        <Card style={styles.docCard}>
          <DoctorAvatar uri={doctor.photoUrl} name={doctor.displayName} size={52} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.docName}>{doctor.displayName || 'CuoreCare doctor'}</Text>
            {!!doctor.specialization && <Text style={styles.docSpec}>{doctor.specialization}</Text>}
          </View>
        </Card>

        {/* Mode */}
        <Text style={styles.section}>Consultation type</Text>
        <View style={styles.modeRow}>
          {MODES.map(m => {
            const active = mode === m.key;
            const Icon = m.icon;
            return (
              <TouchableOpacity
                key={m.key}
                style={[styles.modeCard, active && styles.modeCardActive]}
                onPress={() => setMode(m.key)}
                activeOpacity={0.85}
              >
                <Icon size={22} color={active ? CC.primary : CC.subText} />
                <Text style={[styles.modeLabel, active && { color: CC.primary }]}>{m.label}</Text>
                <Text style={styles.modeDesc}>{m.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date */}
        <Text style={styles.section}>Select a date</Text>
        {renderDates()}

        {/* Time slots */}
        {selectedDate && (
          <>
            <Text style={styles.section}>Select a time</Text>
            {renderSlots()}
          </>
        )}

        {/* Reason */}
        <Text style={styles.section}>Reason (optional)</Text>
        <TextInput
          style={styles.reason}
          placeholder="Briefly describe your concern"
          placeholderTextColor={CC.muted}
          value={reason}
          onChangeText={setReason}
          multiline
          maxLength={500}
        />

        {selectedSlot && (
          <View style={styles.summary}>
            <Clock size={15} color={CC.primary} />
            <Text style={styles.summaryText}>
              {moment(selectedSlot.start).format('ddd, D MMM')} · {fmtTime(selectedSlot.start)}
              {selectedSlot.durationMinutes ? ` · ${selectedSlot.durationMinutes} min` : ''}
            </Text>
          </View>
        )}

        <Text style={styles.note}>
          Your request is sent to the doctor for confirmation. You will be notified once it is
          accepted.
        </Text>

        <PrimaryButton
          label="Request appointment"
          onPress={handleBook}
          loading={actionLoading}
          disabled={!selectedSlot}
          style={{ marginTop: 20 }}
        />
        <View style={{ height: 40 }} />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CC.surface },
  scroll: { padding: 20 },
  docCard: { flexDirection: 'row', alignItems: 'center' },
  docName: { fontFamily: F.PoppinsSemiBold, fontSize: 16, color: CC.text },
  docSpec: { fontFamily: F.PoppinsRegular, fontSize: 12.5, color: CC.subText, marginTop: 1 },

  section: { fontFamily: F.PoppinsSemiBold, fontSize: 14, color: CC.text, marginTop: 24, marginBottom: 12 },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeCard: {
    flex: 1,
    backgroundColor: CC.white,
    borderWidth: 1.5,
    borderColor: CC.border,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modeCardActive: { borderColor: CC.primary, backgroundColor: CC.primarySoft },
  modeLabel: { fontFamily: F.PoppinsSemiBold, fontSize: 13.5, color: CC.text, marginTop: 8 },
  modeDesc: { fontFamily: F.PoppinsRegular, fontSize: 11, color: CC.muted, marginTop: 2 },

  // Date chips
  dateRow: { gap: 10, paddingRight: 8 },
  dateCard: {
    width: 64,
    backgroundColor: CC.white,
    borderWidth: 1.5,
    borderColor: CC.border,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dateCardActive: { borderColor: CC.primary, backgroundColor: CC.primary },
  dateTop: { fontFamily: F.PoppinsMedium, fontSize: 11.5, color: CC.subText },
  dateDay: { fontFamily: F.PoppinsSemiBold, fontSize: 20, color: CC.text, marginVertical: 1 },
  dateMonth: { fontFamily: F.PoppinsRegular, fontSize: 11, color: CC.muted },
  dateActiveText: { color: CC.white },

  // Slot chips
  slotWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotChip: {
    backgroundColor: CC.white,
    borderWidth: 1.5,
    borderColor: CC.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  slotChipActive: { borderColor: CC.primary, backgroundColor: CC.primarySoft },
  slotText: { fontFamily: F.PoppinsMedium, fontSize: 13.5, color: CC.text },
  slotTextActive: { color: CC.primary },

  inlineLoading: { paddingVertical: 20, alignItems: 'center' },
  emptyBox: {
    backgroundColor: CC.white,
    borderWidth: 1,
    borderColor: CC.border,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  emptyText: { flex: 1, fontFamily: F.PoppinsRegular, fontSize: 13, color: CC.subText, lineHeight: 19 },

  reason: {
    backgroundColor: CC.white,
    borderWidth: 1,
    borderColor: CC.border,
    borderRadius: 14,
    padding: 14,
    minHeight: 90,
    textAlignVertical: 'top',
    fontFamily: F.PoppinsRegular,
    fontSize: 14,
    color: CC.text,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CC.primarySoft,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  summaryText: { fontFamily: F.PoppinsMedium, fontSize: 13, color: CC.primary },
  note: {
    fontFamily: F.PoppinsRegular,
    fontSize: 12,
    color: CC.subText,
    marginTop: 16,
    lineHeight: 18,
  },
});
