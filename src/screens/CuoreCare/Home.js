import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import {
  Stethoscope,
  CalendarPlus,
  FileText,
  Video,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from 'lucide-react-native';

import { CC } from './ccTheme';
import { PrimaryButton, EmptyState, Card } from './components';
import ProfileSwitcher from '../../components/ProfileSwitcher';
import AppointmentCard from './AppointmentCard';
import {
  getCuoreCareStatus,
  getCuoreCareAccess,
  getAppointments,
  getPrescriptions,
} from '../../redux/CuoreCare/thunks';
import { getSocket } from '../../realtime/socket';
import { EV as CC_EV } from '../../realtime/events';

const F = CC.fonts;

const BENEFITS = [
  { icon: Video, title: 'Video, voice & chat', desc: 'Consult a doctor the way you prefer' },
  { icon: ShieldCheck, title: 'Verified CuoreCare doctors', desc: 'Cardio-metabolic specialists' },
  { icon: FileText, title: 'Digital prescriptions', desc: 'Signed PDF you can view & share' },
];

export default function CuoreCareHome({ navigation }) {
  const dispatch = useDispatch();
  const subscription = useSelector(state => state.cuoreCare.subscription);
  const access = useSelector(state => state.cuoreCare.access);
  const appointments = useSelector(state => state.cuoreCare.appointments);
  const branding = useSelector(state => state.cuoreCare.access?.branding);
  const [segment, setSegment] = useState('upcoming'); // upcoming | completed
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    (scope = segment) => {
      dispatch(getCuoreCareStatus());
      dispatch(getCuoreCareAccess());
      dispatch(getAppointments({ scope }));
    },
    [dispatch, segment],
  );

  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [segment]),
  );

  // Live updates (§10): while this screen is focused, refresh when the server signals an
  // appointment or prescription change — no manual pull-to-refresh required.
  useFocusEffect(
    useCallback(() => {
      const s = getSocket();
      if (!s) return undefined;
      const refresh = () => load();
      s.on(CC_EV.APPOINTMENT_NEW, refresh);
      s.on(CC_EV.APPOINTMENT_UPDATED, refresh);
      s.on(CC_EV.PRESCRIPTION_READY, refresh);
      return () => {
        s.off(CC_EV.APPOINTMENT_NEW, refresh);
        s.off(CC_EV.APPOINTMENT_UPDATED, refresh);
        s.off(CC_EV.PRESCRIPTION_READY, refresh);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [segment]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(getCuoreCareStatus()),
      dispatch(getCuoreCareAccess()),
      dispatch(getAppointments({ scope: segment })),
      dispatch(getPrescriptions()),
    ]);
    setRefreshing(false);
  }, [dispatch, segment]);

  const onSegment = scope => {
    setSegment(scope);
    dispatch(getAppointments({ scope }));
  };

  /* ----- initial access check still loading ----- */
  if (!access.checked && (access.loading || subscription.loading)) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={CC.surface} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={CC.primary} />
        </View>
      </SafeAreaView>
    );
  }

  /* ----- no access to EITHER family (real subscription/entitlement for CuoreCare, or an
     EMR-enabled doctor for walk-in bookings) → paywall. Essential+granted users have
     access.cuoreCare=true even though subscription.active is false, so they skip this
     branch entirely too. ----- */
  if (access.checked && !access.cuoreCare && !access.emr) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={CC.surface} />
        <ScrollView
          contentContainerStyle={styles.paywallScroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.heroIconWrap}>
            <Stethoscope size={34} color={CC.primary} />
          </View>
          <Text style={styles.heroTitle}>CuoreCare</Text>
          <Text style={styles.heroSubtitle}>
            Talk to a doctor about your heart and metabolic health — book a video, voice or
            chat consultation and get a digital prescription.
          </Text>

          <Card style={styles.benefitsCard}>
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <View
                  key={b.title}
                  style={[styles.benefitRow, i < BENEFITS.length - 1 && styles.benefitDivider]}
                >
                  <View style={styles.benefitIcon}>
                    <Icon size={18} color={CC.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.benefitTitle}>{b.title}</Text>
                    <Text style={styles.benefitDesc}>{b.desc}</Text>
                  </View>
                </View>
              );
            })}
          </Card>

          {subscription.state === 'expired' && (
            <Text style={styles.expiredNote}>
              Your CuoreCare subscription has expired. Renew to continue booking consultations.
            </Text>
          )}

          <PrimaryButton
            label={subscription.state === 'expired' ? 'Renew CuoreCare' : 'Subscribe to CuoreCare'}
            onPress={() => navigation.navigate('CuoreCareSubscribe')}
            style={{ marginTop: 20 }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ----- subscribed → scheduler ----- */
  const list = appointments.list || [];
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={CC.surface} />
      {/* Header */}
      <View style={styles.topBar}>
        {/* minWidth:0 matters: without it a flex child refuses to shrink below its text's
            intrinsic width, so the title pushed the switcher and Records button sideways
            instead of truncating. */}
        <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
          {/* White-labelling: the practice's name is the title when the patient has a linked
              doctor, with "CuoreCare" demoted to the line beneath. A patient's relationship is
              with their clinic, not with our product name. Falls back to the plain title when
              there is no branding to show — never to a clinic name we invented. */}
          <Text style={styles.topTitle} numberOfLines={1}>
            {branding?.name || 'CuoreCare'}
          </Text>
          <Text style={styles.topSubtitle} numberOfLines={1}>
            {branding?.name ? 'CuoreCare · Your consultations' : 'Your consultations'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.rxButton}
          onPress={() => navigation.navigate('CuoreCareHistory')}
        >
          <FileText size={18} color={CC.primary} />
          <Text style={styles.rxButtonText}>Records</Text>
        </TouchableOpacity>
      </View>
      {/* Swap user, on its own line rather than as a third item in the bar above.
          A 22pt clinic name, a family member's name and the Records button do not share one
          402pt row: the title lost, and "Sunrise Multispecialty Clinic" rendered as "Sunrise…".
          The switcher renders nothing at all for an account with no family members, so a
          single-person account's header keeps exactly the layout it had — no empty row, because
          this is the component itself and not a wrapper around it. */}
      <ProfileSwitcher compact style={styles.switcherRow} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Book CTA — a patient can book here if they have EITHER a teleconsult
            relationship (access.cuoreCare) or a walk-in one (access.emr) with their doctor;
            DoctorList/BookAppointment already only offer the channel(s) that doctor has
            actually published for this patient. */}
        {(access.cuoreCare || access.emr) && (
          <Card style={styles.bookCard} onPress={() => navigation.navigate('CuoreCareDoctors')}>
            <View style={styles.bookIcon}>
              <CalendarPlus size={22} color={CC.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookTitle}>Book a consultation</Text>
              <Text style={styles.bookDesc}>Browse your CuoreCare doctors and pick a time</Text>
            </View>
          </Card>
        )}

        {/* Segmented control */}
        <View style={styles.segment}>
          {[
            { key: 'upcoming', label: 'Upcoming', icon: Clock },
            { key: 'completed', label: 'Past', icon: CheckCircle2 },
          ].map(seg => {
            const active = segment === seg.key;
            const Icon = seg.icon;
            return (
              <TouchableOpacity
                key={seg.key}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
                onPress={() => onSegment(seg.key)}
                activeOpacity={0.8}
              >
                <Icon size={15} color={active ? CC.primary : CC.subText} />
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {seg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* List */}
        {appointments.loading && list.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={CC.primary} />
          </View>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Stethoscope size={40} color={CC.muted} />}
            title={segment === 'upcoming' ? 'No upcoming consultations' : 'No past consultations'}
            message={
              segment === 'upcoming'
                ? access.cuoreCare || access.emr
                  ? 'Book a consultation to get started.'
                  : 'Your doctor will add you here when they check you in for a visit.'
                : 'Your completed consultations will appear here.'
            }
            action={
              segment === 'upcoming' && (access.cuoreCare || access.emr) ? (
                <PrimaryButton
                  label="Book a consultation"
                  onPress={() => navigation.navigate('CuoreCareDoctors')}
                />
              ) : null
            }
          />
        ) : (
          list.map(appt => (
            <AppointmentCard
              key={appt.appointmentId || appt._id}
              appointment={appt}
              onPress={() =>
                navigation.navigate('CuoreCareAppointment', {
                  appointmentId: appt.appointmentId,
                })
              }
            />
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CC.surface },
  center: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },

  /* paywall */
  paywallScroll: { padding: 20, paddingBottom: 40, alignItems: 'center' },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: CC.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  heroTitle: { fontFamily: F.PoppinsBold, fontSize: 24, color: CC.text, marginTop: 16 },
  heroSubtitle: {
    fontFamily: F.PoppinsRegular,
    fontSize: 14,
    color: CC.subText,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  benefitsCard: { alignSelf: 'stretch', marginTop: 24, padding: 4 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  benefitDivider: { borderBottomWidth: 1, borderBottomColor: CC.border },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CC.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  benefitTitle: { fontFamily: F.PoppinsSemiBold, fontSize: 14, color: CC.text },
  benefitDesc: { fontFamily: F.PoppinsRegular, fontSize: 12, color: CC.subText, marginTop: 1 },
  expiredNote: {
    fontFamily: F.PoppinsRegular,
    fontSize: 13,
    color: CC.danger,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 19,
  },

  /* scheduler */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: CC.surface,
  },
  switcherRow: { alignSelf: 'flex-start', marginLeft: 20, marginBottom: 10 },
  topTitle: { fontFamily: F.PoppinsBold, fontSize: 22, color: CC.text },
  topSubtitle: { fontFamily: F.PoppinsRegular, fontSize: 13, color: CC.subText, marginTop: 1 },
  rxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CC.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rxButtonText: { fontFamily: F.PoppinsMedium, fontSize: 13, color: CC.primary, marginLeft: 6 },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CC.white,
    marginBottom: 20,
  },
  bookIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: CC.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bookTitle: { fontFamily: F.PoppinsSemiBold, fontSize: 15, color: CC.text },
  bookDesc: { fontFamily: F.PoppinsRegular, fontSize: 12, color: CC.subText, marginTop: 2 },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F7',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
  },
  segmentItemActive: {
    backgroundColor: CC.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: { fontFamily: F.PoppinsMedium, fontSize: 13, color: CC.subText, marginLeft: 6 },
  segmentTextActive: { color: CC.primary },
});
