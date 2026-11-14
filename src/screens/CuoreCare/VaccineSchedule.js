import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import moment from 'moment';
import { Baby, CheckCircle2, Syringe } from 'lucide-react-native';

import { CC } from './ccTheme';
import { Card } from './components';

const F = CC.fonts;

// Backend dates are calendar days ("YYYY-MM-DD"), not instants — parse them strictly in local
// time so a due date never shifts by a day across time zones.
const day = s => (s ? moment(s, ['YYYY-MM-DD', moment.ISO_8601]) : null);
const fmtDate = s => {
  const m = day(s);
  return m && m.isValid() ? m.format('D MMM YYYY') : '';
};

const PILL = {
  overdue: { fg: CC.danger, bg: CC.dangerSoft },
  due: { fg: CC.warning, bg: CC.warningSoft },
  upcoming: { fg: CC.primary, bg: CC.primarySoft },
  done: { fg: CC.subText, bg: '#F1F5F9' },
};

function pillLabel(item) {
  switch (item.status) {
    case 'overdue':
      return 'Overdue';
    case 'due': {
      const m = day(item.dueDate);
      return m && m.isSame(moment(), 'day') ? 'Due today' : 'Due now';
    }
    case 'done':
      return 'Done';
    default: {
      const d = fmtDate(item.dueDate);
      return d ? `Upcoming · ${d}` : 'Upcoming';
    }
  }
}

function sortByDueDate(items) {
  return [...(items || [])].sort((a, b) => {
    const da = day(a.dueDate);
    const db = day(b.dueDate);
    const va = da && da.isValid() ? da.valueOf() : Number.MAX_SAFE_INTEGER;
    const vb = db && db.isValid() ? db.valueOf() : Number.MAX_SAFE_INTEGER;
    return va - vb;
  });
}

function ScheduleRow({ item, last }) {
  const done = item.status === 'done';
  const tone = PILL[item.status] || PILL.upcoming;
  const title = [item.name, item.dose].filter(Boolean).join(' · ');
  const sub = done
    ? item.administeredDate
      ? `Given on ${fmtDate(item.administeredDate)}`
      : 'Given'
    : [item.age, item.dueDate ? `Due ${fmtDate(item.dueDate)}` : null].filter(Boolean).join(' · ');

  return (
    <View style={[styles.row, !last && styles.rowDivider, done && styles.rowDone]}>
      <View style={[styles.rowIcon, { backgroundColor: tone.bg }]}>
        {done ? <CheckCircle2 size={16} color={tone.fg} /> : <Syringe size={16} color={tone.fg} />}
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, done && styles.textDone]} numberOfLines={2}>
          {title}
        </Text>
        {!!sub && <Text style={styles.rowSub}>{sub}</Text>}
        {!!item.note && !done && (
          <Text style={styles.rowNote} numberOfLines={2}>
            {item.note}
          </Text>
        )}
      </View>
      {!done && (
        <View style={[styles.pill, { backgroundColor: tone.bg }]}>
          <Text style={[styles.pillText, { color: tone.fg }]}>{pillLabel(item)}</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Per-child vaccine schedule (GET /api/cuorecare/my/vaccine-schedule). Renders nothing when
 * the account has no children, so adults never see an empty section.
 *
 * @param {Array} childList         the API's `children` array
 * @param {string|null} activeProfileId  the profile switcher's selection; when it names one of
 *                                   the children only that child's schedule is shown
 */
export default function VaccineSchedule({ childList, activeProfileId }) {
  const visible = useMemo(() => {
    const list = Array.isArray(childList) ? childList : [];
    if (!activeProfileId) return list;
    return list.filter(c => String(c.patientId) === String(activeProfileId));
  }, [childList, activeProfileId]);

  if (visible.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Vaccine schedule</Text>
      {visible.map(child => {
        const items = sortByDueDate(child.items);
        const pending = items.filter(i => i.status === 'overdue' || i.status === 'due').length;
        const dob = fmtDate(child.dob);
        return (
          <Card key={String(child.patientId)} style={styles.card}>
            <View style={styles.childHeader}>
              <View style={styles.childIcon}>
                <Baby size={20} color={CC.accentViolet} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.childName} numberOfLines={1}>
                  {child.name || 'Child'}
                </Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {[dob ? `Born ${dob}` : null, child.doctorName].filter(Boolean).join(' · ')}
                </Text>
              </View>
              {pending > 0 && (
                <View style={[styles.pill, { backgroundColor: PILL.overdue.bg }]}>
                  <Text style={[styles.pillText, { color: PILL.overdue.fg }]}>
                    {pending} pending
                  </Text>
                </View>
              )}
            </View>

            {!child.scheduleConfigured || items.length === 0 ? (
              <Text style={styles.emptyText}>
                Your doctor has not set up a vaccine schedule for {child.name || 'this child'} yet.
              </Text>
            ) : (
              items.map((item, idx) => (
                <ScheduleRow
                  key={String(item.itemId || `${item.name}-${idx}`)}
                  item={item}
                  last={idx === items.length - 1}
                />
              ))
            )}
          </Card>
        );
      })}
      <Text style={styles.heading}>Recorded vaccinations</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  heading: {
    fontFamily: F.PoppinsSemiBold,
    fontSize: 15,
    color: CC.text,
    marginBottom: 10,
    marginTop: 4,
  },
  card: { marginBottom: 16, alignItems: 'stretch' },
  childHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  childIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: CC.accentVioletSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  childName: { fontFamily: F.PoppinsSemiBold, fontSize: 15, color: CC.text },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: CC.border },
  rowDone: { opacity: 0.6 },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowBody: { flex: 1, marginRight: 8 },
  rowTitle: { fontFamily: F.PoppinsMedium, fontSize: 13.5, color: CC.text },
  textDone: { color: CC.subText },
  rowSub: { fontFamily: F.PoppinsRegular, fontSize: 12, color: CC.subText, marginTop: 1 },
  rowNote: { fontFamily: F.PoppinsRegular, fontSize: 11.5, color: CC.muted, marginTop: 2 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontFamily: F.PoppinsSemiBold, fontSize: 11 },
  emptyText: { fontFamily: F.PoppinsRegular, fontSize: 12.5, color: CC.subText, paddingVertical: 8 },
});
