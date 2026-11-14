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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { documentsForProfile } from './documentOwner';
import { useFocusEffect } from '@react-navigation/native';
import {
  Stethoscope,
  CalendarPlus,
  FileText,
  Video,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react-native';

import { CC } from './ccTheme';
import { PrimaryButton, EmptyState, Card } from './components';
import ProfileSwitcher from '../../components/ProfileSwitcher';
import DrawerMenuButton from '../../components/DrawerMenuButton';
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

// Each benefit gets its own friendly accent chip.
const BENEFITS = [
  {
    icon: Video,
    title: 'Video, voice & chat',
    desc: 'Consult a doctor the way you prefer',
    fg: CC.accentSky,
    bg: CC.accentSkySoft,
  },
  {
    icon: ShieldCheck,
    title: 'Verified CuoreCare doctors',
    desc: 'Cardio-metabolic specialists',
    fg: CC.accentTeal,
    bg: CC.accentTealSoft,
  },
  {
    icon: FileText,
    title: 'Digital prescriptions',
    desc: 'Signed PDF you can view & share',
    fg: CC.accentCoral,
    bg: CC.accentCoralSoft,
  },
];

export default function CuoreCareHome({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const subscription = useSelector(state => state.cuoreCare.subscription);
  const access = useSelector(state => state.cuoreCare.access);
  const appointments = useSelector(state => state.cuoreCare.appointments);
  const branding = useSelector(state => state.cuoreCare.access?.branding);
  const activeProfileId = useSelector(state => state.dependants?.activeProfileId) || null;
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
          <LinearGradient
            colors={CC.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroIconWrap}
          >
            <Stethoscope size={34} color={CC.primary} />
          </LinearGradient>
          <Text style={styles.heroTitle}>CuoreCare</Text>
          <Text style={styles.heroSubtitle}>
            Care for your heart and metabolic health, from wherever you are. Book a video,
            voice or chat consultation and get a digital prescription.
          </Text>

          <Card style={styles.benefitsCard}>
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <View
                  key={b.title}
                  style={[styles.benefitRow, i < BENEFITS.length - 1 && styles.benefitDivider]}
                >
                  <View style={[styles.benefitIcon, { backgroundColor: b.bg }]}>
                    <Icon size={18} color={b.fg} />
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
  // Launch edits (5 Nov): after a user swap, upcoming & past consultations are the DISPLAYED
  // person's, not the account holder's. Same ownership rule as the documents (documentOwner.js):
  // a family member's appointment carries `forPatient`; the holder's own carries none.
  const list = documentsForProfile(appointments.list, activeProfileId);
  return (
    // Top inset is painted by the gradient band itself (paddingTop below), so the wash runs
    // up under the status bar instead of stopping at a flat strip.
    <SafeAreaView style={styles.safe} edges={[]}>
      <StatusBar barStyle="dark-content" backgroundColor={CC.heroGradient[0]} />
      {/* Header — a soft gradient wash for a warmer welcome. Colour only; the clinic's
          brandColor still wins on the title below when the practice is white-labelled. */}
      <LinearGradient
        colors={CC.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroBand, { paddingTop: insets.top }]}
      >
        <View style={styles.topBar}>
          <DrawerMenuButton style={styles.menuButton} />
          {/* minWidth:0 matters: without it a flex child refuses to shrink below its text's
              intrinsic width, so the title pushed the Records button sideways instead of
              wrapping. */}
          <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
            {/* White-labelling: the practice's name is the title when the patient has a linked
                doctor, with "CuoreCare" demoted to the line beneath. A patient's relationship is
                with their clinic, not with our product name. Falls back to the plain title when
                there is no branding to show — never to a clinic name we invented.

                TWO lines, not one: a real clinic name ("Sunrise Multispecialty Clinic") does not
                fit a phone's width beside a button, and truncating the practice's own name to
                "Sunrise Multispecial…" is a poor way to show whose care this is. The type is a
                step smaller for the same reason — it buys the second line back. */}
            <Text
              style={[styles.topTitle, branding?.whiteLabel && branding.color ? { color: branding.color } : null]}
              numberOfLines={2}
            >
              {branding?.name || 'CuoreCare'}
            </Text>
            <Text style={styles.topSubtitle} numberOfLines={1}>
              {branding?.whiteLabel
                ? 'Your consultations · Powered by Cuore'
                : branding?.name
                ? 'CuoreCare · Your consultations'
                : 'Your consultations'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.rxButton}
            onPress={() => navigation.navigate('CuoreCareHistory')}
            activeOpacity={0.8}
          >
            <FileText size={16} color={CC.primary} />
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
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Book CTA — a patient can book here if they have EITHER a teleconsult
            relationship (access.cuoreCare) or a walk-in one (access.emr) with their doctor;
            DoctorList/BookAppointment already only offer the channel(s) that doctor has
            actually published for this patient. */}
        {(access.cuoreCare || access.emr) && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('CuoreCareDoctors')}
            style={styles.bookShadow}
          >
            <LinearGradient
              colors={CC.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bookCard}
            >
              <View style={styles.bookIcon}>
                <CalendarPlus size={22} color={CC.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookTitle}>Book a consultation</Text>
                <Text style={styles.bookDesc}>Pick a doctor and a time that suits you</Text>
              </View>
              <ChevronRight size={20} color={CC.white} />
            </LinearGradient>
          </TouchableOpacity>
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
            icon={<Stethoscope size={36} color={CC.accentViolet} />}
            title={segment === 'upcoming' ? 'Nothing scheduled yet' : 'No past consultations'}
            message={
              segment === 'upcoming'
                ? access.cuoreCare || access.emr
                  ? 'Your doctor is just a few taps away. Book a consultation whenever you are ready.'
                  : 'Your doctor will add you here when they check you in for a visit.'
                : 'Once you have had a consultation, you will find it here.'
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
    width: 84,
    height: 84,
    borderRadius: 42,
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
  heroBand: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    /* Top-aligned, not centred: the title can now run to two lines, and a centred Records
       button would drift down the taller header with it. */
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 14,
  },
  menuButton: { paddingRight: 12, paddingTop: 2 },
  switcherRow: { alignSelf: 'flex-start', marginLeft: 20, marginBottom: 14 },
  topTitle: { fontFamily: F.PoppinsBold, fontSize: 19, color: CC.text, lineHeight: 25 },
  topSubtitle: { fontFamily: F.PoppinsRegular, fontSize: 12.5, color: CC.subText, marginTop: 2 },
  rxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CC.white,
    /* A border as well as the tint: on the very light surface the soft-blue fill alone barely
       reads as a control, which is why it looked like a label rather than a button. */
    borderWidth: 1,
    borderColor: '#DBE7FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  rxButtonText: { fontFamily: F.PoppinsMedium, fontSize: 12.5, color: CC.primary, marginLeft: 6 },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },
  bookShadow: {
    borderRadius: CC.radius,
    marginBottom: 20,
    ...CC.shadow,
    shadowColor: CC.primary,
    shadowOpacity: 0.22,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: CC.radius,
    padding: 16,
  },
  bookIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bookTitle: { fontFamily: F.PoppinsSemiBold, fontSize: 15, color: CC.white },
  bookDesc: { fontFamily: F.PoppinsRegular, fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#ECEAF4',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
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
