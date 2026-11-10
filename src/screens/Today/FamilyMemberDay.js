/**
 * Today, while the app is acting for a FAMILY MEMBER (Launch edits, 5 Nov).
 *
 * "CuoreCare → user swap … medicine, consultation, vaccination reminders needed for non-primary
 * users (so swap changes home and lifestyle cards are hidden for non-primary user, just
 * reminders are shown)."
 *
 * The lifestyle plan (meals, fitness, mind, score) is the account holder's own; a family member
 * has none. So this replaces Today's body with that person's reminders and upcoming
 * consultations only, and says plainly whose day it is, with a one-tap way back.
 * Data: GET /api/v1/timeline/family/:patientId/day (backend timelineController).
 */
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { CalendarClock, CheckCircle2, Pill, Stethoscope, Syringe, Bell } from 'lucide-react-native';
import { getApiCall } from '../../utilities/Services';
import { setActiveProfile } from '../../redux/Dependants/slice';
import ProfileSwitcher from '../../components/ProfileSwitcher';

const BRAND = '#11418A';
const KIND = {
  medicine: { label: 'Medicine', Icon: Pill, bg: '#EFF6FF', fg: '#1D4ED8' },
  consultation: { label: 'Consultation', Icon: Stethoscope, bg: '#ECFDF5', fg: '#047857' },
  vaccination: { label: 'Vaccination', Icon: Syringe, bg: '#FDF2F8', fg: '#BE185D' },
  reminder: { label: 'Reminder', Icon: Bell, bg: '#F5F3FF', fg: '#6D28D9' },
};

const fmtWhen = iso => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

export default function FamilyMemberDay({ member }) {
  const dispatch = useDispatch();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      // getApiCall returns the error response (not a throw) on 4xx/5xx, or undefined offline.
      const res = await getApiCall(`/api/v1/timeline/family/${member.dependantId}/day`);
      if (res && res.status >= 200 && res.status < 300) setData(res.data || null);
      else setError(res?.data?.error || 'Could not load reminders.');
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not load reminders.');
    }
  }, [member.dependantId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const reminders = data?.reminders || [];
  const upcoming = data?.upcomingConsultations || [];

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} />}
      >
        <View style={styles.headRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Viewing</Text>
            <Text style={styles.title} numberOfLines={1}>{member.name}'s day</Text>
          </View>
          <ProfileSwitcher compact />
        </View>
        <TouchableOpacity style={styles.backBanner} onPress={() => dispatch(setActiveProfile(null))} activeOpacity={0.85}>
          <Text style={styles.backText}>Lifestyle cards are only shown for you. Tap to switch back to yourself.</Text>
        </TouchableOpacity>

        <Text style={styles.section}>Today's reminders</Text>
        {!data && !error ? (
          <ActivityIndicator color={BRAND} style={{ marginVertical: 24 }} />
        ) : error ? (
          <Text style={styles.empty}>{error}</Text>
        ) : reminders.length === 0 ? (
          <Text style={styles.empty}>No medicine, consultation or vaccination reminders today.</Text>
        ) : (
          reminders.map(r => {
            const k = KIND[r.kind] || KIND.reminder;
            return (
              <View key={r.id} style={[styles.card, r.completed && { opacity: 0.6 }]}>
                <View style={[styles.icon, { backgroundColor: k.bg }]}>
                  <k.Icon size={20} color={k.fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{r.title}</Text>
                  <Text style={styles.cardSub} numberOfLines={2}>
                    {[k.label, r.time, r.description].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                {r.completed ? <CheckCircle2 size={20} color="#16A34A" /> : null}
              </View>
            );
          })
        )}

        <Text style={styles.section}>Upcoming consultations</Text>
        {upcoming.length === 0 ? (
          <Text style={styles.empty}>None booked.</Text>
        ) : (
          upcoming.map(a => (
            <View key={a.id} style={styles.card}>
              <View style={[styles.icon, { backgroundColor: KIND.consultation.bg }]}>
                <CalendarClock size={20} color={KIND.consultation.fg} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{a.doctorName ? `Dr. ${a.doctorName.replace(/^dr\.?\s*/i, '')}` : 'Consultation'}</Text>
                <Text style={styles.cardSub}>{[fmtWhen(a.at), a.mode].filter(Boolean).join(' · ')}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 48 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kicker: { fontFamily: 'Poppins-Regular', fontSize: 12, color: '#64748B' },
  title: { fontFamily: 'Poppins-SemiBold', fontSize: 20, color: '#0F172A' },
  backBanner: { marginTop: 12, backgroundColor: '#EEF2FF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#C7D2FE' },
  backText: { fontFamily: 'Poppins-Medium', fontSize: 12.5, color: '#3730A3' },
  section: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#1E293B', marginTop: 20, marginBottom: 8 },
  empty: { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#64748B', paddingVertical: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Poppins-Medium', fontSize: 14, color: '#0F172A' },
  cardSub: { fontFamily: 'Poppins-Regular', fontSize: 12, color: '#64748B', marginTop: 2 },
});
