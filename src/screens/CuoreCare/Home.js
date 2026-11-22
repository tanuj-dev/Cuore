import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import HeroDiscs from '../../components/ui/HeroDiscs';
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
  useLightStatusBar();
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
      <View style={styles.safe}>
        <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <HeroFill />
          <View style={styles.topBar}>
            <DrawerMenuButton color={CC.white} style={styles.menuButton} />
            <Text style={styles.topTitle}>CuoreCare</Text>
          </View>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={CC.primary} />
        </View>
      </View>
    );
  }

  /* ----- no access to EITHER family (real subscription/entitlement for CuoreCare, or an
     EMR-enabled doctor for walk-in bookings) → paywall. Essential+granted users have
     access.cuoreCare=true even though subscription.active is false, so they skip this
     branch entirely too. ----- */
  if (access.checked && !access.cuoreCare && !access.emr) {
    return (
      <View style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.paywallScroll}
          contentInsetAdjustmentBehavior="never"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={[styles.hero, styles.paywallHero, { paddingTop: insets.top + 8 }]}>
            <HeroFill />
            <View style={styles.topBar}>
              <DrawerMenuButton color={CC.white} style={styles.menuButton} />
            </View>
            <View style={styles.heroIconWrap}>
              <Stethoscope size={30} color={CC.white} />
            </View>
            <Text style={styles.heroTitle}>CuoreCare</Text>
            <Text style={styles.heroSubtitle}>
              Care for your heart and metabolic health, from wherever you are. Book a video,
              voice or chat consultation and get a digital prescription.
            </Text>
          </View>

          <View style={styles.paywallBody}>
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
          </View>
        </ScrollView>
      </View>
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
    <View style={styles.safe}>
      {/* CuoreMD blue hero. The gradient is an absolute fill behind a padded View: on the New
          Architecture a padded LinearGradient paints only its content box and clipped the
          header. Title text stays white on the blue; a white-labelled clinic's brand colour is
          shown as a dot beside the subtitle instead, since an arbitrary clinic colour is not
          guaranteed to read on blue. */}
      <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
        <HeroFill />
        <View style={styles.topBar}>
          <DrawerMenuButton color={CC.white} style={styles.menuButton} />
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
            <Text style={styles.topTitle} numberOfLines={2}>
              {branding?.name || 'CuoreCare'}
            </Text>
            <View style={styles.subRow}>
              {branding?.whiteLabel && branding.color ? (
                <View style={[styles.brandDot, { backgroundColor: branding.color }]} />
              ) : null}
              <Text style={styles.topSubtitle} numberOfLines={1}>
                {branding?.whiteLabel
                  ? 'Your consultations · Powered by Cuore'
                  : branding?.name
                  ? 'CuoreCare · Your consultations'
                  : 'Your consultations'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.rxButton}
            onPress={() => navigation.navigate('CuoreCareHistory')}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <FileText size={15} color={CC.white} />
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
      </View>

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
            activeOpacity={0.85}
            onPress={() => navigation.navigate('CuoreCareDoctors')}
            style={styles.bookCard}
            accessibilityRole="button"
          >
            <View style={styles.bookIcon}>
              <CalendarPlus size={22} color={CC.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.bookTitle}>Book a consultation</Text>
              <Text style={styles.bookDesc}>Pick a doctor and a time that suits you</Text>
            </View>
            <ChevronRight size={20} color={CC.muted} />
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
            icon={<Stethoscope size={34} color={CC.primary} />}
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
    </View>
  );
}

// CuoreMD hero blue (brandDark → brand), as on Today, Explore and Profile.
const HERO = ['#1E3A8A', '#1E64AC'];

function HeroFill() {
  return (
    <>
      <LinearGradient
        colors={HERO}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <HeroDiscs />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CC.surface },
  center: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },

  /* hero (shared by all three states) */
  hero: {
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    marginBottom: 18,
  },
  topBar: {
    flexDirection: 'row',
    /* Top-aligned, not centred: the clinic name can run to two lines, and a centred Records
       button would drift down the taller header with it. */
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  menuButton: { paddingRight: 12, paddingTop: 2 },
  topTitle: { fontFamily: F.PoppinsBold, fontSize: 20, color: CC.white, lineHeight: 27 },
  subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  topSubtitle: {
    fontFamily: F.PoppinsRegular,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.82)',
    flexShrink: 1,
  },
  rxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  rxButtonText: { fontFamily: F.PoppinsMedium, fontSize: 12.5, color: CC.white, marginLeft: 6 },
  // White outline so the active (brand-filled) chip still separates from the blue hero.
  switcherRow: {
    alignSelf: 'flex-start',
    marginLeft: 52,
    marginTop: 12,
    borderColor: 'rgba(255,255,255,0.55)',
  },

  /* paywall */
  paywallScroll: { paddingBottom: 40 },
  paywallHero: { alignItems: 'center', paddingBottom: 28, overflow: 'hidden' },
  paywallBody: { paddingHorizontal: 20 },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  heroTitle: { fontFamily: F.PoppinsBold, fontSize: 26, color: CC.white, marginTop: 14 },
  heroSubtitle: {
    fontFamily: F.PoppinsRegular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
    paddingHorizontal: 24,
  },
  benefitsCard: { alignSelf: 'stretch', marginTop: 4, padding: 4 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  benefitDivider: { borderBottomWidth: 1, borderBottomColor: CC.border },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CC.card,
    borderRadius: CC.radius,
    borderWidth: 1,
    borderColor: CC.border,
    padding: 16,
    marginBottom: 18,
    ...CC.shadow,
  },
  bookIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: CC.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bookTitle: { fontFamily: F.PoppinsSemiBold, fontSize: 15, color: CC.text },
  bookDesc: { fontFamily: F.PoppinsRegular, fontSize: 12.5, color: CC.subText, marginTop: 2 },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#E8EEF6',
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
