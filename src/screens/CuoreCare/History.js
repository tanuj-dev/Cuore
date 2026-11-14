import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { FileText, ChevronRight, FileX, BadgeCheck, Syringe, Receipt } from 'lucide-react-native';

import { CC } from './ccTheme';
import { CCHeader, Card, EmptyState } from './components';
import ProfileSwitcher from '../../components/ProfileSwitcher';
import { fmtDayLabel } from './ccFormat';
import { documentsForProfile } from './documentOwner';
import DiagnosticsTab from './DiagnosticsTab';
import VaccineSchedule from './VaccineSchedule';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import {
  getPrescriptions,
  getCertificates,
  getVaccinations,
  getVaccineSchedule,
  getBills,
  getAppointments,
} from '../../redux/CuoreCare/thunks';

const F = CC.fonts;

// Certificate type → patient-facing label.
const CERT_LABEL = {
  fitness: 'Medical Fitness Certificate',
  sick_leave: 'Medical Leave Certificate',
  medical: 'Medical Certificate',
  fit_to_travel: 'Fit to Travel Certificate',
  custom: 'Medical Certificate',
};

const BILL_STATUS_COLOR = { paid: CC.success, partial: '#B8860B', due: CC.danger };

// Bills and vaccinations have no PDF/appointment of their own — a doctor writes them
// directly against the patient (see routes/cuoreCareRoutes.js's GET /my/vaccinations,
// /my/bills) — so unlike Rx/Certificates they render as plain inline cards rather than
// navigating to a signed-PDF viewer.
const TABS = [
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'certificates', label: 'Certificates' },
  { key: 'vaccinations', label: 'Vaccinations' },
  { key: 'bills', label: 'Bills' },
  // Patient-uploaded lab / test reports, shown to the doctor in CuoreMD (see DiagnosticsTab).
  { key: 'diagnostics', label: 'Diagnostics' },
];

export default function History({ navigation }) {
  const dispatch = useDispatch();
  const { list: prescriptions, loading: rxLoading } = useSelector(state => state.cuoreCare.prescriptions);
  const { list: certificates, loading: certLoading } = useSelector(state => state.cuoreCare.certificates);
  const { list: vaccinations, loading: vaxLoading } = useSelector(state => state.cuoreCare.vaccinations);
  const scheduleChildren = useSelector(state => state.cuoreCare.vaccineSchedule?.children);
  const { list: bills, loading: billsLoading, totalDue } = useSelector(state => state.cuoreCare.bills);
  const completed = useSelector(state => state.cuoreCare.appointments.list);
  // Whose documents are on screen. Null = the account holder's own.
  const activeProfileId = useSelector(state => state.dependants?.activeProfileId) || null;

  const [tab, setTab] = useState('prescriptions');
  const [refreshing, setRefreshing] = useState(false);
  // Bumped on pull-to-refresh so the Diagnostics tab (which owns its own list) reloads too.
  const [refreshKey, setRefreshKey] = useState(0);
  const { alert, AlertComponent } = useCustomAlert();

  const loadAll = useCallback(() => {
    dispatch(getPrescriptions());
    dispatch(getCertificates());
    dispatch(getVaccinations());
    dispatch(getVaccineSchedule());
    dispatch(getBills());
    dispatch(getAppointments({ scope: 'completed' }));
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshKey(k => k + 1);
    await Promise.all([
      dispatch(getPrescriptions()),
      dispatch(getCertificates()),
      dispatch(getVaccinations()),
      dispatch(getVaccineSchedule()),
      dispatch(getBills()),
      dispatch(getAppointments({ scope: 'completed' })),
    ]);
    setRefreshing(false);
  }, [dispatch]);

  // Enrich each document with its doctor name by matching appointment _id.
  const apptById = useMemo(() => {
    const map = {};
    (completed || []).forEach(a => {
      if (a?._id) map[String(a._id)] = a;
    });
    return map;
  }, [completed]);

  /* ONE PERSON'S DOCUMENTS AT A TIME.
   *
   * The API returns the whole household's documents — it has to, because a family member never
   * signs in and the guardian is the only person who can open a child's prescription at all —
   * and labels each row with `forPatient` when it is not the account holder's own. The screen
   * then rendered the lot as one undifferentiated list, so a child's prescription sat in the
   * parent's history looking exactly like the parent's: "prescription generated for that number
   * should be separate under dependent and not clubbed under primary".
   *
   * So the list follows the ACTIVE PROFILE — the same one the switcher above sets and the
   * booking flow already uses. `forPatient` absent means the row is the account holder's own;
   * present means it belongs to the family member it names. Filtering on the label rather than
   * on an id we would have to fetch keeps this a pure function of what the API already sent. */
  const LIST_BY_TAB = {
    prescriptions: documentsForProfile(prescriptions, activeProfileId),
    certificates: documentsForProfile(certificates, activeProfileId),
    vaccinations: documentsForProfile(vaccinations, activeProfileId),
    bills: documentsForProfile(bills, activeProfileId),
    diagnostics: [],
  };
  const LOADING_BY_TAB = {
    prescriptions: rxLoading,
    certificates: certLoading,
    vaccinations: vaxLoading,
    bills: billsLoading,
    diagnostics: false,
  };
  const items = LIST_BY_TAB[tab];
  const loading = LOADING_BY_TAB[tab];

  const renderDoc = doc => {
    const isRx = tab === 'prescriptions';
    const appt = apptById[String(doc.appointmentId)];
    const doctorName = appt?.doctorId?.displayName;
    const title = isRx
      ? doctorName
        ? `Prescription · ${doctorName}`
        : 'Prescription'
      : CERT_LABEL[doc.type] || 'Medical Certificate';

    return (
      <Card
        key={isRx ? doc.prescriptionId : doc.certificateId}
        style={styles.rxCard}
        onPress={() =>
          navigation.navigate(isRx ? 'CuoreCarePrescription' : 'CuoreCareCertificate', {
            ...(isRx ? { prescriptionId: doc.prescriptionId } : { certificateId: doc.certificateId }),
            appointmentId: appt?.appointmentId,
          })
        }
      >
        <View style={styles.rxIcon}>
          {isRx ? <FileText size={20} color={CC.primary} /> : <BadgeCheck size={20} color={CC.primary} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rxTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.rxSub}>
            Issued {fmtDayLabel(doc.issuedAt)}
            {!isRx && doctorName ? ` · ${doctorName}` : ''}
          </Text>
        </View>
        <ChevronRight size={20} color={CC.muted} />
      </Card>
    );
  };

  const renderVaccination = v => (
    <Card key={v._id} style={styles.rxCard}>
      <View style={styles.rxIcon}>
        <Syringe size={20} color={CC.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rxTitle} numberOfLines={1}>
          {v.vaccineName}
          {v.doseNumber ? ` · ${v.doseNumber}` : ''}
        </Text>
        <Text style={styles.rxSub}>
          {fmtDayLabel(v.administeredDate)}
          {v.doctorId?.displayName ? ` · ${v.doctorId.displayName}` : ''}
          {v.nextDueDate ? ` · Next due ${fmtDayLabel(v.nextDueDate)}` : ''}
        </Text>
      </View>
    </Card>
  );

  const renderBill = b => (
    <Card key={b._id} style={styles.billCard}>
      <View style={styles.billTopRow}>
        <View style={styles.rxIcon}>
          <Receipt size={20} color={CC.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rxTitle}>₹{b.totalAmount?.toLocaleString('en-IN')}</Text>
          <Text style={styles.rxSub}>
            {fmtDayLabel(b.createdAt)}
            {b.doctorId?.displayName ? ` · ${b.doctorId.displayName}` : ''}
          </Text>
        </View>
        <Text style={[styles.billStatus, { color: BILL_STATUS_COLOR[b.status] || CC.subText }]}>
          {b.status === 'due' ? 'Due' : b.status === 'partial' ? 'Partially paid' : 'Paid'}
        </Text>
      </View>
      {b.items?.length > 0 && (
        <Text style={styles.billItems} numberOfLines={2}>
          {b.items.map(i => i.description).join(', ')}
        </Text>
      )}
      {b.dueAmount > 0 && <Text style={styles.billDue}>₹{b.dueAmount.toLocaleString('en-IN')} due</Text>}
    </Card>
  );

  const EMPTY_COPY = {
    prescriptions: { title: 'No prescriptions yet', message: 'Prescriptions issued by your doctor will appear here.' },
    certificates: { title: 'No certificates yet', message: 'Medical certificates issued by your doctor will appear here.' },
    vaccinations: { title: 'No vaccinations recorded', message: 'Vaccinations your doctor records for you will appear here.' },
    bills: { title: 'No bills yet', message: 'Bills your doctor raises for you will appear here.' },
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {AlertComponent}
      <CCHeader title="My documents" onBack={() => navigation.goBack()} />

      {/* Whose documents these are. Renders nothing for an account with no family members, so
          a patient who has never used the family plan sees the screen exactly as before. */}
      <ProfileSwitcher style={styles.switcher} />

      {tab === 'bills' && totalDue > 0 && (
        <View style={styles.dueBanner}>
          <Text style={styles.dueBannerText}>₹{totalDue.toLocaleString('en-IN')} total due</Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Child vaccine schedule sits above the recorded doses. Renders nothing when the
            account has no children (or the active profile is not a child). */}
        {tab === 'vaccinations' && (
          <VaccineSchedule childList={scheduleChildren} activeProfileId={activeProfileId} />
        )}
        {tab === 'diagnostics' ? (
          <DiagnosticsTab activeProfileId={activeProfileId} alert={alert} refreshKey={refreshKey} />
        ) : loading && items.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={CC.primary} />
          </View>
        ) : items.length === 0 ? (
          <EmptyState icon={<FileX size={40} color={CC.muted} />} title={EMPTY_COPY[tab].title} message={EMPTY_COPY[tab].message} />
        ) : tab === 'vaccinations' ? (
          items.map(renderVaccination)
        ) : tab === 'bills' ? (
          items.map(renderBill)
        ) : (
          items.map(renderDoc)
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  switcher: { alignSelf: 'flex-start', marginHorizontal: 16, marginTop: 10 },
  safe: { flex: 1, backgroundColor: CC.surface },
  center: { paddingVertical: 48, alignItems: 'center' },
  scroll: { padding: 16 },
  dueBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FDECEC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dueBannerText: { fontFamily: F.PoppinsSemiBold, fontSize: 13, color: CC.danger, textAlign: 'center' },
  tabsScroll: { marginTop: 12, flexGrow: 0 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: CC.primarySoft,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9,
  },
  tabActive: { backgroundColor: CC.white },
  // Explicit lineHeight: Poppins' metrics otherwise clip descenders ("p" in Prescriptions,
  // "g" in Diagnostics) on Android — the only labels that have them.
  tabText: {
    fontFamily: F.PoppinsMedium,
    fontSize: 13.5,
    lineHeight: 21,
    includeFontPadding: false,
    textAlignVertical: 'center',
    color: CC.subText,
  },
  tabTextActive: { fontFamily: F.PoppinsSemiBold, color: CC.primary },
  rxCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  billCard: { marginBottom: 12, alignItems: 'stretch' },
  billTopRow: { flexDirection: 'row', alignItems: 'center' },
  billStatus: { fontFamily: F.PoppinsSemiBold, fontSize: 12.5 },
  billItems: { fontFamily: F.PoppinsRegular, fontSize: 12.5, color: CC.subText, marginTop: 8 },
  billDue: { fontFamily: F.PoppinsSemiBold, fontSize: 12.5, color: CC.danger, marginTop: 4 },
  rxIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: CC.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rxTitle: { fontFamily: F.PoppinsSemiBold, fontSize: 14.5, color: CC.text },
  rxSub: { fontFamily: F.PoppinsRegular, fontSize: 12.5, color: CC.subText, marginTop: 2 },
});
