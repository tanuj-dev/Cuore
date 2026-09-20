import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Clock, Video as VideoIcon } from 'lucide-react-native';
import { CC, statusMeta, modeMeta, modeIcon } from '../CuoreCare/ccTheme';
import { fmtRange } from '../CuoreCare/ccFormat';
import { DoctorAvatar } from '../CuoreCare/components';
import { useJoinWindow } from '../CuoreCare/joinWindow';

const F = CC.fonts;

/**
 * A scheduled CuoreCare consultation, shown as a time-card on Home/Today.
 *
 * Reuses the CuoreCare theme, formatters, avatar and — importantly — the shared
 * useJoinWindow hook, so "can this be joined yet" is answered by exactly the same rule as
 * the CuoreCare tab rather than a second copy that could drift.
 *
 * Actions are deliberately delegated, not reimplemented: Join routes into the CuoreCare
 * stack's AppointmentDetails, which owns the actual join/token flow. This card decides only
 * what to *offer*, never how to perform it.
 */
export default function ConsultationTimeCard({ appointment }) {
  const navigation = useNavigation();
  const doc = appointment?.doctorId || {};
  const ModeIcon = modeIcon(appointment?.mode);
  const mode = modeMeta(appointment?.mode);
  const status = statusMeta(appointment?.status);
  const { canJoin, joinLabel, isWalkIn } = useJoinWindow(appointment);

  // Both the card body and the action land on the same screen — one owns the consultation.
  const openDetails = useCallback(() => {
    navigation.navigate('Home', {
      screen: 'Tabs', // the drawer level around the bottom tabs
      params: {
        screen: 'CuoreCare',
        params: {
          screen: 'CuoreCareAppointment',
          params: { appointmentId: appointment?.appointmentId },
        },
      },
    });
  }, [navigation, appointment?.appointmentId]);

  // Walk-in has no room to join — the action is to see the visit details (clinic address,
  // reschedule, cancel), which is genuinely all a patient can do from their phone.
  const actionLabel = isWalkIn ? 'View visit' : canJoin ? 'Join consultation' : 'View details';
  const actionPrimary = canJoin && !isWalkIn;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={openDetails} style={styles.card}>
      <View style={styles.row}>
        <DoctorAvatar uri={doc.photoUrl} name={doc.displayName} size={42} />
        <View style={styles.mid}>
          <Text style={styles.name} numberOfLines={1}>
            {doc.displayName ? `Dr. ${doc.displayName}` : 'Your doctor'}
          </Text>
          <View style={styles.metaRow}>
            <ModeIcon size={12} color={CC.subText} />
            <Text style={styles.metaText} numberOfLines={1}>
              {mode.label}
              {/* Whose consultation. This is the card a parent glances at in the morning, so
                  it goes on the meta line rather than below the fold — "10:30, Dr Jyoti" is
                  not enough to know whether to bring the child. Absent for the account
                  holder's own appointments, which look exactly as before. */}
              {appointment?.forPatient?.name ? ` · for ${appointment.forPatient.name}` : ''}
            </Text>
          </View>
        </View>
        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.fg }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.timeRow}>
        <Clock size={13} color={CC.primary} />
        <Text style={styles.timeText}>
          {fmtRange(appointment?.scheduledStart, appointment?.scheduledEnd)}
        </Text>
      </View>

      {/* Why the action is unavailable, rather than an unexplained disabled button. */}
      {!!joinLabel && !isWalkIn && <Text style={styles.hint}>{joinLabel}</Text>}

      <View style={[styles.action, actionPrimary ? styles.actionPrimary : styles.actionSecondary]}>
        {actionPrimary && <VideoIcon size={14} color="#FFFFFF" />}
        <Text style={[styles.actionText, actionPrimary ? styles.actionTextPrimary : styles.actionTextSecondary]}>
          {actionLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8EEF7',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  mid: { flex: 1, marginLeft: 10, minWidth: 0 },
  name: { fontFamily: F.PoppinsSemiBold, fontSize: 14, color: CC.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  metaText: { fontFamily: F.PoppinsRegular, fontSize: 11.5, color: CC.subText, marginLeft: 5 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontFamily: F.PoppinsSemiBold, fontSize: 10.5 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  timeText: { fontFamily: F.PoppinsMedium, fontSize: 12.5, color: CC.text, marginLeft: 6 },
  hint: { fontFamily: F.PoppinsRegular, fontSize: 11, color: CC.muted, marginTop: 6 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 9,
    marginTop: 12,
  },
  actionPrimary: { backgroundColor: CC.primary },
  actionSecondary: { backgroundColor: '#F1F5F9' },
  actionText: { fontFamily: F.PoppinsSemiBold, fontSize: 12.5 },
  actionTextPrimary: { color: '#FFFFFF', marginLeft: 6 },
  actionTextSecondary: { color: CC.subText },
});
