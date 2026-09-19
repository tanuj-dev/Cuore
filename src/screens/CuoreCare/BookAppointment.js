import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Video, Phone, MessageSquare, Stethoscope, CalendarX, Clock } from 'lucide-react-native';

import { CC } from './ccTheme';
import { fmtTime } from './ccFormat';
import { CCHeader, PrimaryButton, DoctorAvatar, Card, EmptyState } from './components';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import {
  bookAppointment,
  getDoctorAvailableDates,
  getDoctorSlots,
} from '../../redux/CuoreCare/thunks';
import { resetBookingAvailability } from '../../redux/CuoreCare/slice';
import { getSocket, subscribeSlots, unsubscribeSlots } from '../../realtime/socket';
import EV from '../../realtime/events';
import { fetchDependants } from '../../redux/Dependants/thunks';
import { setActiveProfile } from '../../redux/Dependants/slice';

const F = CC.fonts;

// Mirrors the backend's Appointment.CHANNEL_FOR_MODE exactly — a walk-in and a
// video/voice/chat consultation are independently bookable (they don't share a slot), so
// which of these a patient may even pick depends on doctor.channels (see below).
const CHANNEL_FOR_MODE = {
  in_person: 'walkin',
  video: 'teleconsult',
  voice: 'teleconsult',
  chat: 'teleconsult',
};

const ALL_MODES = [
  { key: 'in_person', label: 'Walk-in', desc: 'Visit the clinic', icon: Stethoscope },
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

  // Which channels THIS doctor actually offers to THIS patient — already access-aware
  // (computed server-side in listDoctors from the doctor's published toggles intersected
  // with the patient's own entitlement), so the picker below never needs its own separate
  // access fetch. Falls back to teleconsult-only for a stale cached doctor object from
  // before this field existed.
  const channels = doctor.channels && doctor.channels.length ? doctor.channels : ['teleconsult'];
  const MODES = ALL_MODES.filter(m => channels.includes(CHANNEL_FOR_MODE[m.key]));

  const [mode, setMode] = useState(() => MODES[0]?.key || null);
  const [selectedDate, setSelectedDate] = useState(null);
  /* The day the doctor prescribed on a follow-up, handed over when the patient accepted it.
   * A SUGGESTION, not a booking: it opens that day's slots and the patient is free to pick
   * another, which is what the requirement asks for in as many words. Consumed once — see the
   * effect below — so re-picking a different day is not undone by a later refetch. */
  const initialDate = route.params?.initialDate || null;
  const initialDateUsed = useRef(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [reason, setReason] = useState('');
  // Who is this consultation FOR? null = the account holder, otherwise a dependantId.
  // Read from the shared slice rather than local state so the choice matches what the Records
  // tab is showing — a booking made for a child while Records still shows the parent is exactly
  // the confusion family profiles are meant to remove.
  const dependants = useSelector(st => st.dependants?.items || []);
  const activeProfileId = useSelector(st => st.dependants?.activeProfileId || null);

  const doctorId = doctor?._id;
  const channel = mode ? CHANNEL_FOR_MODE[mode] : null;

  // The family list, so "Who is this for?" has something to offer. Fetched here rather than
  // relied upon from a previous screen: this screen is reachable directly from a notification
  // deep link, where nothing else would have loaded it.
  useEffect(() => {
    dispatch(fetchDependants());
  }, [dispatch]);

  // Re-fetch bookable dates whenever the CHANNEL changes (walk-in vs teleconsult have
  // independent slot lists) — switching between video/voice/chat doesn't refetch, since
  // those all share the same teleconsult channel/slot list.
  useEffect(() => {
    if (doctorId && channel) dispatch(getDoctorAvailableDates({ doctorId, channel }));
    setSelectedDate(null);
    setSelectedSlot(null);
    return () => {
      dispatch(resetBookingAvailability());
    };
  }, [dispatch, doctorId, channel]);

  const pickDate = useCallback(
    dateStr => {
      setSelectedDate(dateStr);
      setSelectedSlot(null);
      if (doctorId && channel) dispatch(getDoctorSlots({ doctorId, date: dateStr, channel }));
    },
    [dispatch, doctorId, channel],
  );

  /* Open on the prescribed day once the bookable dates are known.
   *
   * It has to wait for `dates`, because opening a day the doctor does not work would show an
   * empty slot list and read as "no appointments available". When the prescribed day is not
   * bookable the patient is left on the normal unselected state with every real day in front of
   * them — the suggestion is simply not available, which they can see for themselves. */
  useEffect(() => {
    if (!initialDate || initialDateUsed.current || selectedDate) return;
    if (!dates || !dates.length) return;
    initialDateUsed.current = true;
    const bookable = dates.some(d => (typeof d === 'string' ? d : d?.date) === initialDate);
    if (bookable) pickDate(initialDate);
  }, [initialDate, dates, selectedDate, pickDate]);

  // ---- live slot updates ----
  // Watch this doctor's calendar for the channel on screen, so a slot someone else takes greys
  // out without a pull-to-refresh. The server gates the subscription with the same access rule
  // as the REST slot endpoints and the event it sends is a bare invalidation signal — we always
  // refetch through the normal authorized endpoint rather than trusting pushed data.
  //
  // If the socket is down this is simply inert: the screen keeps working from its initial fetch.
  useEffect(() => {
    if (!doctorId || !channel) return undefined;
    const socket = getSocket();
    if (!socket) return undefined;

    subscribeSlots(doctorId, channel);

    // socket.io restores the CONNECTION automatically but not room membership — rooms live on
    // the server and are dropped when the socket goes away. Without this, one blip (backgrounded
    // app, tunnel change) would leave the screen silently subscribed to nothing for the rest of
    // its life. Re-subscribing on every connect also covers the case where the socket existed
    // but hadn't connected yet when this effect ran; the emit while disconnected is a no-op.
    // A refetch is paired with it because anything could have changed while we were away.
    const onConnect = () => {
      subscribeSlots(doctorId, channel);
      dispatch(getDoctorAvailableDates({ doctorId, channel }));
      if (selectedDate) dispatch(getDoctorSlots({ doctorId, date: selectedDate, channel }));
    };

    const onSlotsChanged = payload => {
      // Ignore other doctors and the other channel — one socket serves the whole app.
      if (!payload || String(payload.doctorId) !== String(doctorId) || payload.channel !== channel) return;
      // The dates hint lets us skip a refetch for a day we aren't showing. No hint (an
      // availability edit) means "anything could have changed", so always refetch.
      const days = Array.isArray(payload.dates) ? payload.dates : null;
      const affectsOpenDay = !days || (selectedDate && days.includes(selectedDate));

      // The date strip itself can change either way — a day can become fully booked, or open
      // up again — so it is refetched on every signal.
      dispatch(getDoctorAvailableDates({ doctorId, channel }));
      if (selectedDate && affectsOpenDay) {
        dispatch(getDoctorSlots({ doctorId, date: selectedDate, channel }));
      }
    };

    socket.on(EV.SLOTS_CHANGED, onSlotsChanged);
    socket.on('connect', onConnect);
    return () => {
      socket.off(EV.SLOTS_CHANGED, onSlotsChanged);
      socket.off('connect', onConnect);
      unsubscribeSlots(doctorId, channel);
    };
  }, [dispatch, doctorId, channel, selectedDate]);

  // If the slot the patient has already tapped disappears from a refreshed list, drop the
  // selection rather than letting them submit a time that is now taken — otherwise the first
  // they learn of it is a SLOT_TAKEN error on Confirm.
  useEffect(() => {
    if (!selectedSlot) return;
    if (slotsDate !== selectedDate) return; // list is for another day; nothing to compare against
    if (slotsLoading) return;
    const stillThere = slots.some(s => s.start === selectedSlot.start);
    if (!stillThere) setSelectedSlot(null);
  }, [slots, slotsDate, slotsLoading, selectedDate, selectedSlot]);

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
        // Omitted for the account holder — the server treats an absent patientId as "the
        // caller", and it verifies the link for anything else, so this is a hint rather than
        // an authorization decision.
        ...(activeProfileId ? { patientId: activeProfileId } : {}),
      }),
    );

    if (bookAppointment.fulfilled.match(res)) {
      /* §7.1 — the booking comes back UNPAID unless the patient is exempt. A payable booking goes
       * to checkout; an exempt one has already reached the doctor and goes straight to the
       * appointment, exactly as it did before payment existed.
       *
       * `payment` is passed through so checkout paints the breakdown immediately instead of
       * re-fetching something this response already carried. */
      const { appointment: appt, payment } = res.payload;
      if (payment && payment.payable) {
        navigation.replace('CuoreCareCheckout', {
          appointmentId: appt.appointmentId,
          payment,
        });
        return;
      }
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
      // `channel` is REQUIRED by /doctors/:id/slots (requireDoctorChannelAccess rejects a
      // request without it), so omitting it here made this recovery refetch 400 silently and
      // leave the stale list on screen — the one moment the patient most needs it refreshed.
      if (selectedDate) dispatch(getDoctorSlots({ doctorId, date: selectedDate, channel }));
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
        {MODES.length === 0 ? (
          <EmptyState
            icon={<CalendarX size={40} color={CC.muted} />}
            title="Nothing bookable yet"
            message="This doctor hasn't opened Walk-in or Teleconsult bookings right now."
          />
        ) : (
          <>
            <Text style={styles.section}>Consultation type</Text>
            <View style={styles.modeRow}>
              {MODES.map(m => {
                const active = mode === m.key;
                const Icon = m.icon;
                /* The doctor's own price for THIS mode, resolved server-side through the same
                 * ladder the charge uses (listDoctors → consultationFees.modePricesPaise), so the
                 * number here is the number that gets billed. `null` means the doctor has not
                 * priced this mode and has no fallback — shown as unavailable, never as free. */
                const price = doctor.modePrices?.[m.key];
                const priced = price && typeof price.rupees === 'number';
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
                    {priced ? (
                      <Text style={[styles.modePrice, active && { color: CC.primary }]}>
                        {price.rupees === 0 ? 'Free' : `₹${price.rupees}`}
                      </Text>
                    ) : (
                      <Text style={styles.modePriceMissing}>Not offered</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* The consultation fee only. The ₹10 tele-consult fee and the 3% gateway fee are
                itemised on the payment screen, which renders the server's breakdown verbatim —
                computing a total here would be a second implementation of the same arithmetic. */}
            <Text style={styles.modeFootnote}>
              Consultation fee set by your doctor. Taxes and fees are shown before you pay.
            </Text>

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

            {/* Who is it for. Shown only once there is somebody to choose between — a patient
                with no family members should not be asked to pick themselves out of a list
                of one. */}
            {dependants.length > 0 && (
              <>
                <Text style={styles.section}>Who is this for?</Text>
                <View style={styles.profileRow}>
                  <TouchableOpacity
                    style={[styles.profileChip, !activeProfileId && styles.profileChipOn]}
                    onPress={() => dispatch(setActiveProfile(null))}
                  >
                    <Text style={[styles.profileChipText, !activeProfileId && styles.profileChipTextOn]}>
                      Myself
                    </Text>
                  </TouchableOpacity>
                  {dependants.map(d => {
                    const on = String(d.dependantId) === String(activeProfileId);
                    return (
                      <TouchableOpacity
                        key={d.dependantId}
                        style={[styles.profileChip, on && styles.profileChipOn]}
                        onPress={() => dispatch(setActiveProfile(d.dependantId))}
                      >
                        <Text style={[styles.profileChipText, on && styles.profileChipTextOn]}>
                          {d.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
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
          </>
        )}
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
  modePrice: { fontFamily: F.PoppinsSemiBold, fontSize: 13, color: CC.text, marginTop: 4 },
  modePriceMissing: { fontFamily: F.PoppinsRegular, fontSize: 11, color: CC.subText, marginTop: 4 },
  modeFootnote: { fontFamily: F.PoppinsRegular, fontSize: 11.5, color: CC.subText, marginTop: 8 },
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

  profileRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  profileChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: CC.border,
    backgroundColor: CC.card,
  },
  profileChipOn: { backgroundColor: CC.primary, borderColor: CC.primary },
  profileChipText: { fontFamily: F.PoppinsMedium, fontSize: 13, color: CC.subText },
  profileChipTextOn: { color: CC.white },
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
