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
import { FileText, ChevronRight, FileX, BadgeCheck } from 'lucide-react-native';

import { CC } from './ccTheme';
import { CCHeader, Card, EmptyState } from './components';
import { fmtDayLabel } from './ccFormat';
import { getPrescriptions, getCertificates, getAppointments } from '../../redux/CuoreCare/thunks';

const F = CC.fonts;

// Certificate type → patient-facing label.
const CERT_LABEL = {
  fitness: 'Medical Fitness Certificate',
  sick_leave: 'Medical Leave Certificate',
  medical: 'Medical Certificate',
  fit_to_travel: 'Fit to Travel Certificate',
  custom: 'Medical Certificate',
};

const TABS = [
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'certificates', label: 'Certificates' },
];

export default function History({ navigation }) {
  const dispatch = useDispatch();
  const { list: prescriptions, loading: rxLoading } = useSelector(state => state.cuoreCare.prescriptions);
  const { list: certificates, loading: certLoading } = useSelector(state => state.cuoreCare.certificates);
  const completed = useSelector(state => state.cuoreCare.appointments.list);

  const [tab, setTab] = useState('prescriptions');
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(() => {
    dispatch(getPrescriptions());
    dispatch(getCertificates());
    dispatch(getAppointments({ scope: 'completed' }));
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(getPrescriptions()),
      dispatch(getCertificates()),
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

  const showingRx = tab === 'prescriptions';
  const items = showingRx ? prescriptions || [] : certificates || [];
  const loading = showingRx ? rxLoading : certLoading;

  const renderItem = doc => {
    const appt = apptById[String(doc.appointmentId)];
    const doctorName = appt?.doctorId?.displayName;
    const isRx = showingRx;
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CCHeader title="My documents" onBack={() => navigation.goBack()} />

      <View style={styles.tabs}>
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
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && items.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={CC.primary} />
          </View>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FileX size={40} color={CC.muted} />}
            title={showingRx ? 'No prescriptions yet' : 'No certificates yet'}
            message={
              showingRx
                ? 'Prescriptions issued by your CuoreCare doctor will appear here.'
                : 'Medical certificates issued by your CuoreCare doctor will appear here.'
            }
          />
        ) : (
          items.map(renderItem)
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CC.surface },
  center: { paddingVertical: 48, alignItems: 'center' },
  scroll: { padding: 16 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: CC.primarySoft,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  tabActive: { backgroundColor: CC.white },
  tabText: { fontFamily: F.PoppinsMedium, fontSize: 13.5, color: CC.subText },
  tabTextActive: { fontFamily: F.PoppinsSemiBold, color: CC.primary },
  rxCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
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
