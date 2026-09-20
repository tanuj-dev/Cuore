import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CalendarDays, ChevronRight, User } from 'lucide-react-native';
import { CC, modeMeta, modeIcon } from './ccTheme';
import { fmtDateTime, fmtRange } from './ccFormat';
import { Card, StatusPill, DoctorAvatar } from './components';

const F = CC.fonts;

/**
 * Compact appointment row. Expects the patient-scoped shape where `doctorId` is populated
 * with { displayName, specialization, photoUrl }.
 *
 * `forPatient` is set by the API only when the consultation is for a FAMILY MEMBER rather than
 * the account holder. The list is one combined household feed — an appointment diary that hid a
 * child's consultation in a separate profile would be a way to miss it — so every row that is
 * not the account holder's own has to say whose it is, or a parent cannot tell their 3pm from
 * their child's.
 */
/* Doctors are stored as a plain name ("rakesh yadavv"), which is how it used to render — no
 * title, no capitals. Patients address a doctor as "Dr.", so the card says so. Skipped when the
 * stored name already carries a title, so nobody becomes "Dr. Dr. Rakesh". */
const doctorName = raw => {
  const name = String(raw || '').trim();
  if (!name) return 'CuoreCare doctor';
  return /^(dr\.?|prof\.?)\s/i.test(name) ? name : `Dr. ${name}`;
};

export default function AppointmentCard({ appointment, onPress }) {
  const doc = appointment?.doctorId || {};
  const forPatient = appointment?.forPatient;
  const ModeIcon = modeIcon(appointment?.mode);
  const meta = modeMeta(appointment?.mode);

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <DoctorAvatar uri={doc.photoUrl} name={doc.displayName} size={46} />
        <View style={styles.mid}>
          <Text style={styles.name} numberOfLines={1}>
            {doctorName(doc.displayName)}
          </Text>
          {!!doc.specialization && (
            <Text style={styles.spec} numberOfLines={1}>
              {doc.specialization}
            </Text>
          )}
          {/* A chip rather than loose text: it is a fact about the consultation (how it
              happens), and it now reads as one at a glance instead of blending into the
              specialisation line above it. */}
          <View style={styles.modeChip}>
            <ModeIcon size={12} color={CC.primary} />
            <Text style={styles.modeText}>{meta.label.replace(' consult', '')}</Text>
          </View>
        </View>
        <ChevronRight size={20} color={CC.muted} />
      </View>

      {!!forPatient?.name && (
        <View style={styles.forRow}>
          <User size={12} color={CC.primary} />
          <Text style={styles.forText} numberOfLines={1}>
            For {forPatient.name}
            {forPatient.relationship ? ` · ${forPatient.relationship}` : ''}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.whenIcon}>
          <CalendarDays size={15} color={CC.primary} />
        </View>
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
  name: {
    fontFamily: F.PoppinsSemiBold,
    fontSize: 15,
    color: CC.text,
    textTransform: 'capitalize',
  },
  spec: {
    fontFamily: F.PoppinsRegular,
    fontSize: 12,
    color: CC.subText,
    marginTop: 1,
    textTransform: 'capitalize',
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: CC.primarySoft,
  },
  modeText: { fontFamily: F.PoppinsMedium, fontSize: 11, color: CC.primary, marginLeft: 5 },
  forRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: CC.primarySoft,
  },
  forText: {
    fontFamily: F.PoppinsMedium,
    fontSize: 11,
    color: CC.primary,
    marginLeft: 5,
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: CC.border,
  },
  whenIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: CC.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  when: { fontFamily: F.PoppinsSemiBold, fontSize: 13, color: CC.text },
  range: { fontFamily: F.PoppinsRegular, fontSize: 12, color: CC.subText, marginTop: 1 },
});
