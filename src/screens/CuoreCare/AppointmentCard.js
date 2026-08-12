import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Video, Phone, MessageSquare, Stethoscope, ChevronRight } from 'lucide-react-native';
import { CC, modeMeta } from './ccTheme';
import { fmtDateTime, fmtRange } from './ccFormat';
import { Card, StatusPill, DoctorAvatar } from './components';

const F = CC.fonts;
const MODE_ICON = { video: Video, voice: Phone, chat: MessageSquare, in_person: Stethoscope };

/**
 * Compact appointment row. Expects the patient-scoped shape where `doctorId` is populated
 * with { displayName, specialization, photoUrl }.
 */
export default function AppointmentCard({ appointment, onPress }) {
  const doc = appointment?.doctorId || {};
  const ModeIcon = MODE_ICON[appointment?.mode] || Video;
  const meta = modeMeta(appointment?.mode);

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <DoctorAvatar uri={doc.photoUrl} name={doc.displayName} size={46} />
        <View style={styles.mid}>
          <Text style={styles.name} numberOfLines={1}>
            {doc.displayName || 'CuoreCare doctor'}
          </Text>
          {!!doc.specialization && (
            <Text style={styles.spec} numberOfLines={1}>
              {doc.specialization}
            </Text>
          )}
          <View style={styles.modeRow}>
            <ModeIcon size={13} color={CC.subText} />
            <Text style={styles.modeText}>{meta.label.replace(' consult', '')}</Text>
          </View>
        </View>
        <ChevronRight size={20} color={CC.muted} />
      </View>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.when}>{fmtDateTime(appointment?.scheduledStart)}</Text>
          <Text style={styles.range}>
            {fmtRange(appointment?.scheduledStart, appointment?.scheduledEnd)}
          </Text>
        </View>
        <StatusPill status={appointment?.status} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  mid: { flex: 1, marginLeft: 12 },
  name: { fontFamily: F.PoppinsSemiBold, fontSize: 15, color: CC.text },
  spec: { fontFamily: F.PoppinsRegular, fontSize: 12, color: CC.subText, marginTop: 1 },
  modeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  modeText: { fontFamily: F.PoppinsMedium, fontSize: 11, color: CC.subText, marginLeft: 5 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: CC.border,
  },
  when: { fontFamily: F.PoppinsMedium, fontSize: 13, color: CC.text },
  range: { fontFamily: F.PoppinsRegular, fontSize: 12, color: CC.subText, marginTop: 1 },
});
