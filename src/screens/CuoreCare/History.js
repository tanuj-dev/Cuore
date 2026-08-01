import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { FileText, ChevronRight, FileX } from 'lucide-react-native';

import { CC } from './ccTheme';
import { CCHeader, Card, EmptyState } from './components';
import { fmtDayLabel } from './ccFormat';
import { getPrescriptions, getAppointments } from '../../redux/CuoreCare/thunks';

const F = CC.fonts;

export default function History({ navigation }) {
  const dispatch = useDispatch();
  const { list: prescriptions, loading } = useSelector(state => state.cuoreCare.prescriptions);
  const completed = useSelector(state => state.cuoreCare.appointments.list);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(() => {
    dispatch(getPrescriptions());
    dispatch(getAppointments({ scope: 'completed' }));
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([dispatch(getPrescriptions()), dispatch(getAppointments({ scope: 'completed' }))]);
    setRefreshing(false);
  }, [dispatch]);

  // Enrich each prescription with its doctor name by matching appointment _id.
  const apptById = useMemo(() => {
    const map = {};
    (completed || []).forEach(a => {
      if (a?._id) map[String(a._id)] = a;
    });
    return map;
  }, [completed]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CCHeader title="Prescriptions" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && (prescriptions || []).length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={CC.primary} />
          </View>
        ) : (prescriptions || []).length === 0 ? (
          <EmptyState
            icon={<FileX size={40} color={CC.muted} />}
            title="No prescriptions yet"
            message="Prescriptions issued by your CuoreCare doctor will appear here."
          />
        ) : (
          (prescriptions || []).map(rx => {
            const appt = apptById[String(rx.appointmentId)];
            const doctorName = appt?.doctorId?.displayName;
            return (
              <Card
                key={rx.prescriptionId}
                style={styles.rxCard}
                onPress={() =>
                  navigation.navigate('CuoreCarePrescription', {
                    prescriptionId: rx.prescriptionId,
                    appointmentId: appt?.appointmentId,
                  })
                }
              >
                <View style={styles.rxIcon}>
                  <FileText size={20} color={CC.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rxTitle} numberOfLines={1}>
                    {doctorName ? `Prescription · ${doctorName}` : 'Prescription'}
                  </Text>
                  <Text style={styles.rxSub}>Issued {fmtDayLabel(rx.issuedAt)}</Text>
                </View>
                <ChevronRight size={20} color={CC.muted} />
              </Card>
            );
          })
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
