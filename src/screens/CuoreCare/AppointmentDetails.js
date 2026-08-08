import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import {
  Video,
  Phone,
  MessageSquare,
  CalendarClock,
  FileText,
  XCircle,
  CalendarClock as Reschedule,
  Clock,
  Info,
  ClipboardList,
} from 'lucide-react-native';

import { CC, statusMeta, modeMeta } from './ccTheme';
import { CCHeader, PrimaryButton, SecondaryButton, StatusPill, DoctorAvatar, Card } from './components';
import { fmtDayLabel, fmtRange, fmtTime } from './ccFormat';
import { JOIN_EARLY_MINUTES } from '../../utilities/cuoreCareConfig';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import {
  getAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getAppointments,
  fetchCasesheet,
} from '../../redux/CuoreCare/thunks';
import { getSocket } from '../../realtime/socket';
import { EV as CC_EV } from '../../realtime/events';
import { getCallState, isCallConnected } from '../../call/callState';
import { restoreCall } from '../../call/callManager';

const F = CC.fonts;
const MODE_ICON = { video: Video, voice: Phone, chat: MessageSquare };

export default function AppointmentDetails({ navigation, route }) {
  const dispatch = useDispatch();
  const { appointmentId, justBooked } = route.params || {};
  const { data: appt, loading } = useSelector(state => state.cuoreCare.current);
  const actionLoading = useSelector(state => state.cuoreCare.action.loading);
  const { alert, AlertComponent } = useCustomAlert();

  // The reschedule sheet is otherwise forced white, which hides the (light) native iOS wheel
  // text in dark mode. Adapt the sheet + picker to the current appearance so it's always legible.
  const isDark = useColorScheme() === 'dark';
  const sheet = isDark
    ? { bg: '#1E293B', text: '#F1F5F9', sub: '#94A3B8', border: '#334155', done: '#60A5FA' }
    : { bg: CC.white, text: CC.text, sub: CC.subText, border: CC.border, done: CC.primary };

  const [refreshing, setRefreshing] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rDate, setRDate] = useState(new Date());
  const [picker, setPicker] = useState(null);
  // The doctor's finalised casesheet. Null while they're still drafting it — the server
  // only releases it once it's locked, so there's nothing to poll for.
  const [casesheet, setCasesheet] = useState(null);

  const isThis = appt && appt.appointmentId === appointmentId;

  useFocusEffect(
    useCallback(() => {
      dispatch(getAppointment(appointmentId));
      let cancelled = false;
      fetchCasesheet(appointmentId).then(res => {
        if (!cancelled && res.ok) setCasesheet(res.data);
      });
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appointmentId]),
  );

  // Live status (§4/§10): when this appointment changes server-side (doctor accepts, cancels,
  // completes, prescription issued, call ends), refetch it so the screen reflects it instantly.
  useFocusEffect(
    useCallback(() => {
      const s = getSocket();
      if (!s) return undefined;
      const onUpdate = p => {
        if (!p || !p.appointmentId || p.appointmentId === appointmentId) {
          dispatch(getAppointment(appointmentId));
        }
      };
      s.on(CC_EV.APPOINTMENT_UPDATED, onUpdate);
      s.on(CC_EV.PRESCRIPTION_READY, onUpdate);
      s.on(CC_EV.CALL_ENDED, onUpdate);
      s.on(CC_EV.CALL_MISSED, onUpdate);
      return () => {
        s.off(CC_EV.APPOINTMENT_UPDATED, onUpdate);
        s.off(CC_EV.PRESCRIPTION_READY, onUpdate);
        s.off(CC_EV.CALL_ENDED, onUpdate);
        s.off(CC_EV.CALL_MISSED, onUpdate);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appointmentId]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(getAppointment(appointmentId));
    setRefreshing(false);
  }, [dispatch, appointmentId]);

  const doc = appt?.doctorId || {};
  const status = appt?.status;
  const ModeIcon = MODE_ICON[appt?.mode] || Video;

  const { canJoin, joinOpensAt, joinLabel } = useMemo(() => {
    if (!appt || !['scheduled', 'in_progress', 'accepted'].includes(status)) {
      return { canJoin: false, joinOpensAt: null, joinLabel: null };
    }
    const opensAt = moment(appt.scheduledStart).subtract(JOIN_EARLY_MINUTES, 'minutes');
    const now = moment();
    if (now.isBefore(opensAt)) {
      return {
        canJoin: false,
        joinOpensAt: opensAt,
        joinLabel: `Join opens ${fmtDayLabel(appt.scheduledStart)} at ${fmtTime(opensAt)}`,
      };
    }
    return { canJoin: true, joinOpensAt: opensAt, joinLabel: null };
  }, [appt, status]);

  const canModify = ['requested', 'scheduled', 'accepted'].includes(status);

  const handleCancel = () => {
    alert('Cancel appointment?', 'This consultation will be cancelled. You can book again anytime.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel appointment',
        style: 'destructive',
        onPress: async () => {
          const res = await dispatch(cancelAppointment({ appointmentId, reason: '' }));
          if (cancelAppointment.fulfilled.match(res)) {
            dispatch(getAppointments({ scope: 'upcoming' }));
          } else {
            alert('Could not cancel', res.payload?.message || 'Please try again.');
          }
        },
      },
    ]);
  };

  const openReschedule = () => {
    setRDate(moment(appt?.scheduledStart).isAfter(moment()) ? new Date(appt.scheduledStart) : new Date(Date.now() + 15 * 60000));
    setRescheduleOpen(true);
    if (Platform.OS === 'android') setPicker('date');
  };

  const onPickerChange = (event, selected) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') return setPicker(null);
      if (picker === 'date' && selected) {
        const next = moment(selected).hour(moment(rDate).hour()).minute(moment(rDate).minute()).toDate();
        setRDate(next);
        setPicker('time');
        return;
      }
      if (picker === 'time' && selected) {
        setRDate(selected);
        setPicker(null);
        return;
      }
      setPicker(null);
    } else if (selected) {
      setRDate(selected);
    }
  };

  const submitReschedule = async () => {
    if (moment(rDate).isBefore(moment().add(1, 'minute'))) {
      alert('Pick a future time', 'Choose a time in the future.');
      return;
    }
    const res = await dispatch(
      rescheduleAppointment({ appointmentId, scheduledStart: moment(rDate).toISOString() }),
    );
    setRescheduleOpen(false);
    if (rescheduleAppointment.fulfilled.match(res)) {
      dispatch(getAppointment(appointmentId));
    } else {
      alert('Could not reschedule', res.payload?.message || 'Please try another time.');
    }
  };

  if ((loading && !isThis) || !appt) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <CCHeader title="Appointment" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={CC.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const meta = modeMeta(appt.mode);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {AlertComponent}
      <CCHeader title="Appointment" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {justBooked && (
          <View style={styles.bookedBanner}>
            <Info size={16} color={CC.primary} />
            <Text style={styles.bookedText}>
              Request sent. You will be notified when the doctor confirms.
            </Text>
          </View>
        )}

        {/* Doctor + status */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <DoctorAvatar uri={doc.photoUrl} name={doc.displayName} size={56} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.docName}>{doc.displayName || 'CuoreCare doctor'}</Text>
              {!!doc.specialization && <Text style={styles.docSpec}>{doc.specialization}</Text>}
            </View>
          </View>
          <View style={styles.statusRow}>
            <StatusPill status={status} />
            <View style={styles.modeChip}>
              <ModeIcon size={13} color={CC.subText} />
              <Text style={styles.modeChipText}>{meta.label}</Text>
            </View>
          </View>
        </Card>

        {/* When */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <CalendarClock size={18} color={CC.primary} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.infoValue}>{fmtDayLabel(appt.scheduledStart)}</Text>
              <Text style={styles.infoSub}>
                {fmtRange(appt.scheduledStart, appt.scheduledEnd)} · {appt.durationMinutes || 15} min
              </Text>
            </View>
          </View>
          {!!appt.reason && (
            <View style={[styles.infoRow, styles.reasonRow]}>
              <FileText size={18} color={CC.subText} />
              <Text style={styles.reasonText}>{appt.reason}</Text>
            </View>
          )}
        </Card>

        {/* Join hint */}
        {joinLabel && (
          <View style={styles.joinHint}>
            <Clock size={15} color={CC.subText} />
            <Text style={styles.joinHintText}>{joinLabel}</Text>
          </View>
        )}

        {/* Primary actions by state */}
        {['scheduled', 'in_progress', 'accepted'].includes(status) && (
          <PrimaryButton
            label={status === 'in_progress' ? 'Rejoin consultation' : 'Join consultation'}
            icon={<ModeIcon size={18} color={CC.white} />}
            disabled={!canJoin}
            onPress={() => {
              // This consultation is already running behind the floating window — bring
              // it back instead of joining the room a second time.
              if (
                isCallConnected() &&
                getCallState().appointmentId === appt.appointmentId
              ) {
                restoreCall();
                return;
              }
              navigation.navigate('CuoreCareConsultation', {
                appointmentId: appt.appointmentId,
                mode: appt.mode,
                doctorId: doc?._id,
                doctorName: doc?.displayName,
              });
            }}
            style={{ marginTop: 8 }}
          />
        )}

        {status === 'requested' && (
          <View style={styles.pendingBox}>
            <ActivityIndicator size="small" color={CC.warning} />
            <Text style={styles.pendingText}>Waiting for the doctor to confirm your request</Text>
          </View>
        )}

        {status === 'completed' && appt.prescriptionId && (
          <PrimaryButton
            label="View prescription"
            icon={<FileText size={18} color={CC.white} />}
            onPress={() =>
              navigation.navigate('CuoreCarePrescription', {
                prescriptionId: appt.prescriptionId,
                appointmentId: appt.appointmentId,
              })
            }
            style={{ marginTop: 8 }}
          />
        )}

        {status === 'completed' && !appt.prescriptionId && (
          <View style={styles.pendingBox}>
            <Info size={16} color={CC.subText} />
            <Text style={[styles.pendingText, { color: CC.subText }]}>
              Consultation completed. A prescription will appear here if the doctor issues one.
            </Text>
          </View>
        )}

        <CasesheetCard casesheet={casesheet} />

        {/* Secondary actions */}
        {canModify && (
          <View style={styles.secondaryActions}>
            <SecondaryButton
              label="Reschedule"
              icon={<Reschedule size={17} color={CC.text} />}
              onPress={openReschedule}
              style={{ flex: 1 }}
            />
            <SecondaryButton
              label="Cancel"
              tone="danger"
              icon={<XCircle size={17} color={CC.danger} />}
              onPress={handleCancel}
              style={{ flex: 1 }}
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Reschedule modal */}
      <Modal visible={rescheduleOpen} transparent animationType="slide" onRequestClose={() => setRescheduleOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: sheet.bg }]}>
            <View style={[styles.modalBar, { borderBottomColor: sheet.border }]}>
              <TouchableOpacity onPress={() => setRescheduleOpen(false)}>
                <Text style={[styles.modalCancel, { color: sheet.sub }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: sheet.text }]}>Reschedule</Text>
              <TouchableOpacity onPress={submitReschedule} disabled={actionLoading}>
                <Text style={[styles.modalDone, { color: sheet.done }]}>{actionLoading ? '...' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalPreview, { color: sheet.text }]}>
              {moment(rDate).format('ddd, D MMM YYYY')} · {moment(rDate).format('h:mm A')}
            </Text>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={rDate}
                mode="datetime"
                display="spinner"
                minimumDate={new Date(Date.now() + 5 * 60000)}
                onChange={onPickerChange}
                // Keep the native wheels legible in both appearances (dark mode was invisible
                // against the forced-white sheet before). themeVariant + textColor cover iOS.
                themeVariant={isDark ? 'dark' : 'light'}
                textColor={sheet.text}
                style={{ backgroundColor: sheet.bg }}
              />
            ) : (
              <View style={styles.androidPickerRow}>
                <SecondaryButton label="Change date" onPress={() => setPicker('date')} style={{ flex: 1 }} />
                <SecondaryButton label="Change time" onPress={() => setPicker('time')} style={{ flex: 1 }} />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {Platform.OS === 'android' && rescheduleOpen && picker && (
        <DateTimePicker
          value={rDate}
          mode={picker === 'time' ? 'time' : 'date'}
          minimumDate={picker === 'date' ? new Date(Date.now() + 5 * 60000) : undefined}
          onChange={onPickerChange}
        />
      )}
    </SafeAreaView>
  );
}

/* --------------------------------- Casesheet -------------------------------- *
 * The doctor's finalised clinical notes for this consultation. Only the sections they
 * actually filled in are shown — an empty-field skeleton would read as a broken record
 * rather than a concise one. The doctor's private notes are stripped server-side and
 * never reach this screen.
 * ---------------------------------------------------------------------------- */

const CASESHEET_SECTIONS = [
  ['chiefComplaint', 'Chief complaint'],
  ['historyOfPresentIllness', 'History'],
  ['pastHistory', 'Past history'],
  ['examination', 'Examination'],
  ['diagnosis', 'Diagnosis'],
  ['plan', 'Plan'],
];

const VITAL_ROWS = [
  ['systolic', 'Systolic', 'mmHg'],
  ['diastolic', 'Diastolic', 'mmHg'],
  ['pulse', 'Pulse', 'bpm'],
  ['spo2', 'SpO₂', '%'],
  ['weightKg', 'Weight', 'kg'],
  ['heightCm', 'Height', 'cm'],
  ['bmi', 'BMI', ''],
];

function CasesheetCard({ casesheet }) {
  const content = casesheet && casesheet.content;
  if (!content) return null;

  const sections = CASESHEET_SECTIONS.filter(([key]) => String(content[key] || '').trim());
  const vitals = VITAL_ROWS.filter(
    ([key]) => content.vitals && content.vitals[key] !== null && content.vitals[key] !== undefined,
  );
  if (sections.length === 0 && vitals.length === 0) return null;

  return (
    <Card style={styles.csCard}>
      <View style={styles.csHead}>
        <ClipboardList size={17} color={CC.primary} />
        <Text style={styles.csTitle}>Consultation notes</Text>
      </View>

      {vitals.length > 0 && (
        <View style={styles.csVitals}>
          {vitals.map(([key, label, unit]) => (
            <View key={key} style={styles.csVital}>
              <Text style={styles.csVitalLabel}>{label}</Text>
              <Text style={styles.csVitalValue}>
                {content.vitals[key]}
                {unit ? <Text style={styles.csVitalUnit}> {unit}</Text> : null}
              </Text>
            </View>
          ))}
        </View>
      )}

      {sections.map(([key, label]) => (
        <View key={key} style={styles.csSection}>
          <Text style={styles.csLabel}>{label}</Text>
          <Text style={styles.csBody}>{String(content[key]).trim()}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CC.surface },
  csCard: { marginTop: 16 },
  csHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  csTitle: { fontFamily: F.PoppinsSemiBold, fontSize: 14.5, color: CC.text },
  csVitals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  csVital: {
    backgroundColor: CC.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 78,
  },
  csVitalLabel: { fontFamily: F.PoppinsRegular, fontSize: 10.5, color: CC.subText },
  csVitalValue: { fontFamily: F.PoppinsSemiBold, fontSize: 14, color: CC.primary },
  csVitalUnit: { fontFamily: F.PoppinsRegular, fontSize: 10.5, color: CC.subText },
  csSection: { marginBottom: 12 },
  csLabel: {
    fontFamily: F.PoppinsMedium,
    fontSize: 11,
    color: CC.subText,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  csBody: { fontFamily: F.PoppinsRegular, fontSize: 13.5, color: CC.text, lineHeight: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20 },

  bookedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CC.primarySoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  bookedText: { flex: 1, fontFamily: F.PoppinsRegular, fontSize: 12.5, color: CC.primary, marginLeft: 8, lineHeight: 18 },

  headerCard: { marginBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  docName: { fontFamily: F.PoppinsSemiBold, fontSize: 17, color: CC.text },
  docSpec: { fontFamily: F.PoppinsRegular, fontSize: 13, color: CC.subText, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 10 },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CC.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  modeChipText: { fontFamily: F.PoppinsMedium, fontSize: 11, color: CC.subText, marginLeft: 5 },

  infoCard: { marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoValue: { fontFamily: F.PoppinsSemiBold, fontSize: 15, color: CC.text },
  infoSub: { fontFamily: F.PoppinsRegular, fontSize: 12.5, color: CC.subText, marginTop: 2 },
  reasonRow: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: CC.border, alignItems: 'flex-start' },
  reasonText: { flex: 1, fontFamily: F.PoppinsRegular, fontSize: 13.5, color: CC.text, marginLeft: 12, lineHeight: 20 },

  joinHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  joinHintText: { fontFamily: F.PoppinsRegular, fontSize: 12.5, color: CC.subText, marginLeft: 6 },

  pendingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CC.warningSoft,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  pendingText: { flex: 1, fontFamily: F.PoppinsMedium, fontSize: 13, color: CC.warning, marginLeft: 10, lineHeight: 19 },

  secondaryActions: { flexDirection: 'row', gap: 12, marginTop: 14 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: CC.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingBottom: 24 },
  modalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: CC.border,
  },
  modalTitle: { fontFamily: F.PoppinsSemiBold, fontSize: 15, color: CC.text },
  modalCancel: { fontFamily: F.PoppinsMedium, fontSize: 14, color: CC.subText },
  modalDone: { fontFamily: F.PoppinsSemiBold, fontSize: 14, color: CC.primary },
  modalPreview: { fontFamily: F.PoppinsMedium, fontSize: 14, color: CC.text, textAlign: 'center', paddingVertical: 14 },
  androidPickerRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 18 },
});
