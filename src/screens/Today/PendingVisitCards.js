import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CalendarClock, Stethoscope } from 'lucide-react-native';
import { Fonts, hp, wp } from '../../utilities';
import { visitRemindersFrom, whenLabel } from './visitReminders';

/**
 * FOLLOW-UP AND NEXT-VISIT REMINDERS, PINNED TO THE TOP OF TODAY.
 *
 * "App – Follow-up & next visit reminders should come on top and stay till either accepted or
 * declined – if declined should be removed from card, if accepted – on tapping should take user
 * to CuoreCare to book slot – slot should open for the date prescribed."
 *
 * ── WHY THIS IS NOT PART OF THE DAY'S SCHEDULE ───────────────────────────────────────────────
 * Doctor reminders already appeared on Today, but as ordinary schedule rows: sorted into the
 * day by clock time, and — this is the part that made them miss — only ON their due date,
 * because a schedule row is a TimelineCard generated for that day. A follow-up three months out
 * therefore showed the patient nothing at all until the morning it was due, which is the one
 * day it is too late to arrange anything.
 *
 * So a PENDING visit reminder is shown here, above the day, from the moment the doctor issues it
 * until the patient answers it. Medicine reminders are deliberately NOT pinned: they are a daily
 * routine that belongs in the schedule at its dose time, and pinning three medicines would bury
 * the day under a wall of cards.
 *
 * ── WHAT ACCEPTING DOES ──────────────────────────────────────────────────────────────────────
 * An accepted follow-up is an appointment the patient has agreed to make, so accepting hands
 * them straight to booking with the doctor and the prescribed date already chosen. They can pick
 * another day from there — the date is the doctor's suggestion, not a booking.
 *
 * Declining removes the card; the server also drops the reminder's future cards (see
 * timelineController.respondToReminder), so it does not come back tomorrow.
 */

export default function PendingVisitCards({ reminders, respondingId, onAccept, onDecline }) {
  const items = visitRemindersFrom(reminders);
  if (!items.length) return null;

  return (
    <View style={styles.wrap}>
      {items.map(r => {
        const busy = respondingId === String(r._id);
        const doctorName = r.doctorId?.displayName ? `Dr. ${r.doctorId.displayName}` : 'your doctor';
        const isNextVisit = r.visitKind === 'next_visit' || /^next visit/i.test(String(r.title || ''));

        return (
          <View key={String(r._id)} style={styles.card}>
            <View style={styles.iconWrap}>
              {isNextVisit ? (
                <CalendarClock size={hp(2.2)} color="#11418A" />
              ) : (
                <Stethoscope size={hp(2.2)} color="#11418A" />
              )}
            </View>

            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={1}>
                {isNextVisit ? 'Next visit' : 'Follow-up'} with {doctorName}
              </Text>
              <Text style={styles.meta} numberOfLines={2}>
                {r.startDate ? `Suggested for ${whenLabel(r.startDate)}` : 'Date to be decided'}
                {r.note ? ` · ${r.note}` : ''}
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  disabled={busy}
                  onPress={() => onAccept?.(r)}
                  style={[styles.accept, busy && styles.busy]}
                  accessibilityLabel={`Accept and book the ${isNextVisit ? 'next visit' : 'follow-up'}`}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.acceptText}>Accept &amp; book</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={busy}
                  onPress={() => onDecline?.(r)}
                  style={[styles.decline, busy && styles.busy]}
                  accessibilityLabel="Decline this visit"
                >
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: wp(4), paddingTop: hp(1.2) },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: wp(3.5),
    borderWidth: 1,
    borderColor: '#DBE5F1',
    padding: wp(3.5),
    marginBottom: hp(1),
  },
  iconWrap: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: '#EFF4FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: hp(1.8), fontFamily: Fonts.semiBold, color: '#0F172A' },
  meta: { fontSize: hp(1.5), fontFamily: Fonts.regular, color: '#64748B', marginTop: 2 },
  actions: { flexDirection: 'row', gap: wp(2), marginTop: hp(1) },
  accept: {
    backgroundColor: '#11418A',
    paddingVertical: hp(0.7),
    paddingHorizontal: wp(3.5),
    borderRadius: 14,
    minWidth: wp(28),
    alignItems: 'center',
  },
  acceptText: { color: '#FFFFFF', fontSize: hp(1.5), fontFamily: Fonts.semiBold },
  decline: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: hp(0.7),
    paddingHorizontal: wp(3.5),
    borderRadius: 14,
  },
  declineText: { color: '#6B7280', fontSize: hp(1.5), fontFamily: Fonts.semiBold },
  busy: { opacity: 0.5 },
});
