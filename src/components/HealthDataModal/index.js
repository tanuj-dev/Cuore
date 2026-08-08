import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  HeartPulse,
  Activity,
  Droplet,
  Wind,
  Scale,
  Footprints,
  Moon,
  Timer,
} from 'lucide-react-native';

import { hp, wp } from '../../utilities';
import { getHealthLatestThunk, getHealthSeriesThunk } from '../../redux/slices';

// Presentation for each canonical metric. Anything the server returns that is not listed
// here is simply not shown, so adding a metric server-side cannot break this screen.
const DISPLAY = {
  steps: { label: 'Steps', Icon: Footprints, decimals: 0 },
  exerciseMinutes: { label: 'Exercise', Icon: Timer, decimals: 0, suffix: ' min' },
  sleepMinutes: { label: 'Sleep', Icon: Moon, decimals: 0, format: v => formatSleep(v) },
  heartRate: { label: 'Heart rate', Icon: HeartPulse, decimals: 0 },
  restingHeartRate: { label: 'Resting heart rate', Icon: HeartPulse, decimals: 0 },
  bloodPressureSystolic: { label: 'Systolic', Icon: Activity, decimals: 0 },
  bloodPressureDiastolic: { label: 'Diastolic', Icon: Activity, decimals: 0 },
  bloodGlucose: { label: 'Blood glucose', Icon: Droplet, decimals: 0 },
  oxygenSaturation: { label: 'Blood oxygen', Icon: Wind, decimals: 0 },
  weightKg: { label: 'Weight', Icon: Scale, decimals: 1 },
};

const ORDER = [
  'steps',
  'exerciseMinutes',
  'sleepMinutes',
  'heartRate',
  'restingHeartRate',
  'bloodPressureSystolic',
  'bloodPressureDiastolic',
  'bloodGlucose',
  'oxygenSaturation',
  'weightKg',
];

function formatSleep(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

function formatMeasuredAt(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 60) return `${Math.max(mins, 0)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const chartConfig = {
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#FFFFFF',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(17, 65, 138, ${opacity})`,
  labelColor: () => '#94A3B8',
  barPercentage: 0.55,
  propsForBackgroundLines: { stroke: '#F1F5F9' },
};

const HealthDataModal = ({ visible, onClose }) => {
  const dispatch = useDispatch();
  const {
    latest,
    series,
    seriesUnit,
    loadingLatest,
    loadingSeries,
    lastSyncedAt,
    connected,
  } = useSelector(state => state.healthSync);

  useEffect(() => {
    if (!visible) return;
    dispatch(getHealthLatestThunk());
    dispatch(getHealthSeriesThunk({ metricType: 'steps', days: 14 }));
  }, [visible, dispatch]);

  const rows = useMemo(() => {
    if (!latest) return [];
    return ORDER.filter(key => latest[key] && DISPLAY[key]).map(key => ({
      key,
      ...DISPLAY[key],
      ...latest[key],
    }));
  }, [latest]);

  // 14 days of labels would overlap badly at phone width, so label every third bar and
  // blank the rest. chart-kit has no built-in tick thinning.
  const chartData = useMemo(() => {
    if (!series?.length) return null;
    return {
      labels: series.map((d, i) => (i % 3 === 0 ? d.date.slice(8) : '')),
      datasets: [{ data: series.map(d => d.value) }],
    };
  }, [series]);

  const totalSteps = useMemo(
    () => (series || []).reduce((sum, d) => sum + (d.value || 0), 0),
    [series],
  );

  const renderBody = useCallback(() => {
    if (loadingLatest && !latest) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color="#11418A" />
        </View>
      );
    }

    if (!connected) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Not connected</Text>
          <Text style={styles.emptyText}>
            Connect {Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect'} from
            Connected Health Sources to see your readings here.
          </Text>
        </View>
      );
    }

    if (!rows.length && !chartData) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Nothing synced yet</Text>
          <Text style={styles.emptyText}>
            Readings will appear here once your phone has health data to share. Steps
            accumulate on their own; vitals need a connected device or a manual entry in the
            Health app.
          </Text>
        </View>
      );
    }

    return (
      <>
        {chartData ? (
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Steps, last 14 days</Text>
              <Text style={styles.chartTotal}>
                {Math.round(totalSteps).toLocaleString()} total
              </Text>
            </View>
            <BarChart
              data={chartData}
              width={wp(84)}
              height={hp(24)}
              chartConfig={chartConfig}
              fromZero
              showValuesOnTopOfBars={false}
              withInnerLines
              yAxisLabel=""
              yAxisSuffix=""
              style={styles.chart}
            />
          </View>
        ) : loadingSeries ? (
          <View style={styles.chartCard}>
            <ActivityIndicator color="#11418A" />
          </View>
        ) : null}

        {rows.length ? (
          <>
            <Text style={styles.sectionHeader}>LATEST READINGS</Text>
            <View style={styles.card}>
              {rows.map((row, i) => {
                const { Icon } = row;
                const value = row.format
                  ? row.format(row.value)
                  : `${row.value.toFixed(row.decimals)}${row.suffix || ''}`;
                return (
                  <View
                    key={row.key}
                    style={[styles.row, i === rows.length - 1 && styles.rowLast]}
                  >
                    <Icon size={wp(5)} color="#64748B" />
                    <View style={styles.rowText}>
                      <Text style={styles.rowLabel}>{row.label}</Text>
                      <Text style={styles.rowMeta}>
                        {formatMeasuredAt(row.measuredAt)}
                        {row.sourceName ? ` · ${row.sourceName}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.rowValue}>
                      {value}
                      {row.format ? '' : <Text style={styles.rowUnit}> {row.unit}</Text>}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}

        <Text style={styles.footnote}>
          Steps, exercise and sleep are totalled per day. Everything else shows your most
          recent reading. Values you entered in Cuore yourself are not shown here.
        </Text>
      </>
    );
  }, [
    loadingLatest,
    latest,
    connected,
    rows,
    chartData,
    loadingSeries,
    totalSteps,
    seriesUnit,
  ]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <SafeAreaView style={styles.wrapper} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Health Data</Text>
              {lastSyncedAt ? (
                <Text style={styles.subtitle}>
                  Synced {formatMeasuredAt(lastSyncedAt)}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.close} hitSlop={12}>
              <X size={wp(5.5)} color="#1E293B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {renderBody()}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.6),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: wp(4.6), fontFamily: 'Poppins-Medium', color: '#1E293B' },
  subtitle: {
    fontSize: wp(3.1),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginTop: hp(0.2),
  },
  close: { padding: wp(1) },

  scroll: { flex: 1 },
  content: { paddingHorizontal: wp(5), paddingBottom: hp(5) },

  centered: { alignItems: 'center', paddingTop: hp(12), paddingHorizontal: wp(4) },
  emptyTitle: {
    fontSize: wp(4.2),
    fontFamily: 'Poppins-Medium',
    color: '#1E293B',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: wp(3.4),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    textAlign: 'center',
    marginTop: hp(1),
    lineHeight: hp(2.6),
  },

  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingTop: hp(2),
    paddingBottom: hp(1),
    marginTop: hp(2),
    alignItems: 'center',
  },
  chartHeader: {
    width: '100%',
    paddingHorizontal: wp(4),
    marginBottom: hp(1),
  },
  chartTitle: { fontSize: wp(3.8), fontFamily: 'Poppins-Medium', color: '#1E293B' },
  chartTotal: {
    fontSize: wp(3.2),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginTop: hp(0.2),
  },
  chart: { marginLeft: -wp(2), borderRadius: wp(2) },

  sectionHeader: {
    fontSize: wp(3),
    fontFamily: 'Poppins-Medium',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginTop: hp(3),
    marginBottom: hp(1),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: wp(4),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.6),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLast: { borderBottomWidth: 0 },
  rowText: { flex: 1, marginLeft: wp(3.5) },
  rowLabel: { fontSize: wp(3.7), fontFamily: 'Poppins-Medium', color: '#1E293B' },
  rowMeta: {
    fontSize: wp(3),
    fontFamily: 'Poppins-Regular',
    color: '#94A3B8',
    marginTop: hp(0.2),
  },
  rowValue: { fontSize: wp(4), fontFamily: 'Poppins-Medium', color: '#11418A' },
  rowUnit: { fontSize: wp(3), fontFamily: 'Poppins-Regular', color: '#64748B' },

  footnote: {
    fontSize: wp(3),
    fontFamily: 'Poppins-Regular',
    color: '#94A3B8',
    lineHeight: hp(2.2),
    marginTop: hp(2.5),
  },
});

export default HealthDataModal;
