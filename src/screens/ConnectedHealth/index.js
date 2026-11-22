import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  Activity,
  HeartPulse,
  Moon,
  Scale,
  Footprints,
  Droplet,
  Wind,
  RefreshCw,
  Link2Off,
  ShieldCheck,
  CircleAlert,
} from 'lucide-react-native';

import { hp, wp } from '../../utilities';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import {
  connectHealthThunk,
  syncHealthThunk,
  getHealthStatusThunk,
  disconnectHealthThunk,
} from '../../redux/slices';

// The source's own name, so the screen reads the way the OS does.
const sourceName = () => (Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect');

// Must stay in step with the permissions declared in AndroidManifest.xml and requested in
// the iOS adapter. If a category is listed here but not requested, the screen promises
// something the app never reads.
const CATEGORIES = [
  { key: 'heart', Icon: HeartPulse, label: 'Heart rate', detail: 'Shown with your vitals' },
  { key: 'bp', Icon: Activity, label: 'Blood pressure', detail: 'Shown with your vitals' },
  { key: 'glucose', Icon: Droplet, label: 'Blood glucose', detail: 'Shown with your vitals' },
  { key: 'spo2', Icon: Wind, label: 'Blood oxygen', detail: 'Shown with your vitals' },
  { key: 'weight', Icon: Scale, label: 'Weight', detail: 'Builds your weight and BMI history' },
  { key: 'steps', Icon: Footprints, label: 'Steps and exercise', detail: 'Improves your Cuore Score' },
  { key: 'sleep', Icon: Moon, label: 'Sleep', detail: 'Improves your Cuore Score' },
];

const HEALTH_CONNECT_PLAY_URL =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';

function formatLastSynced(iso) {
  if (!iso) return 'Not yet synced';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 'Not yet synced';

  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'Synced just now';
  if (mins < 60) return `Synced ${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Synced ${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `Synced ${days} day${days === 1 ? '' : 's'} ago`;
}

const ConnectedHealth = ({ navigation }) => {
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();
  useLightStatusBar();
  const [refreshing, setRefreshing] = useState(false);

  const {
    sdkStatus,
    featureDisabled,
    connected,
    lastSyncedAt,
    loadingStatus,
    connecting,
    syncing,
    disconnecting,
    lastResult,
  } = useSelector(state => state.healthSync);

  useEffect(() => {
    dispatch(getHealthStatusThunk());
  }, [dispatch]);

  const onConnect = useCallback(async () => {
    const result = await dispatch(connectHealthThunk());
    if (connectHealthThunk.rejected.match(result) && result.payload?.code !== 'denied') {
      alert('Could not connect', result.payload?.message || 'Please try again.');
    }
  }, [dispatch, alert]);

  const onSync = useCallback(async () => {
    setRefreshing(true);
    await dispatch(syncHealthThunk({ force: true }));
    setRefreshing(false);
  }, [dispatch]);

  const onDisconnect = useCallback(() => {
    // Two genuinely different outcomes, so the user gets to choose rather than having the
    // destructive one assumed. Deleting is irreversible; stopping is not.
    alert(
      'Disconnect ' + sourceName() + '?',
      'Cuore will stop reading new data. You can either keep what has already been added to your health record, or remove it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop syncing',
          onPress: () => dispatch(disconnectHealthThunk({ purge: false })),
        },
        {
          text: 'Stop and delete',
          style: 'destructive',
          onPress: () => dispatch(disconnectHealthThunk({ purge: true })),
        },
      ],
    );
  }, [alert, dispatch]);

  const renderBody = () => {
    if (loadingStatus && sdkStatus === null) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color="#1E64AC" />
        </View>
      );
    }

    // Server-side flag is off. Say nothing about a feature that does not exist yet.
    if (featureDisabled) {
      return (
        <View style={styles.centered}>
          <CircleAlert size={wp(9)} color="#64748B" />
          <Text style={styles.emptyTitle}>Not available yet</Text>
          <Text style={styles.emptyText}>
            Connecting {sourceName()} is not available on your account at the moment.
          </Text>
        </View>
      );
    }

    // Health Connect exists but is out of date. A dead-end message would be useless, so
    // send the user somewhere they can act.
    if (sdkStatus === 'needs_update') {
      return (
        <View style={styles.centered}>
          <CircleAlert size={wp(9)} color="#64748B" />
          <Text style={styles.emptyTitle}>Update Health Connect</Text>
          <Text style={styles.emptyText}>
            Your version of Health Connect is too old for Cuore to read from it.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => Linking.openURL(HEALTH_CONNECT_PLAY_URL)}
          >
            <Text style={styles.primaryBtnText}>Open Play Store</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (sdkStatus === 'unavailable') {
      return (
        <View style={styles.centered}>
          <CircleAlert size={wp(9)} color="#64748B" />
          <Text style={styles.emptyTitle}>Not supported on this device</Text>
          <Text style={styles.emptyText}>
            {Platform.OS === 'android'
              ? 'Health Connect requires Android 9 or newer. You can still enter your vitals manually.'
              : 'Apple Health is not available on this device. You can still enter your vitals manually.'}
          </Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.catTile}>
              <ShieldCheck size={20} color={connected ? '#1E64AC' : '#94A3B8'} />
            </View>
            <View style={styles.statusTextWrap}>
              <Text style={styles.statusTitle}>{sourceName()}</Text>
              <Text style={styles.statusSub}>
                {connected ? formatLastSynced(lastSyncedAt) : 'Not connected'}
              </Text>
            </View>
          </View>

          {connected && lastResult?.synced > 0 ? (
            <Text style={styles.statusNote}>
              {lastResult.accepted} of {lastResult.synced} readings added
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionHeader}>WHAT CUORE READS</Text>
        <View style={styles.card}>
          {CATEGORIES.map(({ key, Icon, label, detail }, i) => (
            <View
              key={key}
              style={[styles.catRow, i === CATEGORIES.length - 1 && styles.catRowLast]}
            >
              <View style={styles.catTile}>
                <Icon size={18} color="#1E64AC" />
              </View>
              <View style={styles.catTextWrap}>
                <Text style={styles.catLabel}>{label}</Text>
                <Text style={styles.catDetail}>{detail}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimer}>
          Cuore only reads. It never changes anything in {sourceName()}, and never uses this
          data for advertising. Anything you have entered yourself is always kept in
          preference to a reading from your device.
        </Text>

        {connected ? (
          <>
            <TouchableOpacity
              style={[styles.primaryBtn, (syncing || refreshing) && styles.btnDisabled]}
              onPress={onSync}
              disabled={syncing || refreshing}
            >
              {syncing || refreshing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <RefreshCw size={wp(4.5)} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Sync now</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dangerBtn}
              onPress={onDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <>
                  <Link2Off size={wp(4.5)} color="#EF4444" />
                  <Text style={styles.dangerBtnText}>Disconnect</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.revokeHint}>
              {Platform.OS === 'ios'
                ? 'To remove Cuore’s access entirely, open the Health app and go to Sharing, then Apps, then Cuore.'
                : 'To remove Cuore’s access entirely, open Health Connect and go to App permissions, then Cuore.'}
            </Text>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, connecting && styles.btnDisabled]}
            onPress={onConnect}
            disabled={connecting}
          >
            {connecting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Connect {sourceName()}</Text>
            )}
          </TouchableOpacity>
        )}
      </>
    );
  };

  return (
    <>
      {AlertComponent}
      <View style={styles.wrapper}>
        <HeroHeader
          title="Health Sources"
          subtitle={`Sync readings from ${sourceName()}`}
          onBack={() => navigation.goBack()}
        />
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {renderBody()}
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F4F7FB' },
  container: { flex: 1 },
  content: { paddingHorizontal: wp(4), paddingTop: hp(0.5), paddingBottom: hp(5) },

  centered: { alignItems: 'center', paddingTop: hp(10), paddingHorizontal: wp(6) },
  emptyTitle: {
    fontSize: wp(4.4),
    fontFamily: 'Poppins-Medium',
    color: '#1E293B',
    marginTop: hp(2),
    textAlign: 'center',
  },
  emptyText: {
    fontSize: wp(3.5),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    textAlign: 'center',
    marginTop: hp(1),
    lineHeight: hp(2.6),
  },

  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: wp(4),
    marginTop: hp(2),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusTextWrap: { marginLeft: wp(3), flex: 1 },
  statusTitle: { fontSize: wp(4), fontFamily: 'Poppins-SemiBold', color: '#0F172A' },
  statusSub: {
    fontSize: wp(3.3),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginTop: hp(0.2),
  },
  statusNote: {
    fontSize: wp(3.2),
    fontFamily: 'Poppins-Regular',
    color: '#1E64AC',
    marginTop: hp(1.2),
  },

  sectionHeader: {
    fontSize: wp(3),
    fontFamily: 'Poppins-Medium',
    color: '#64748B',
    letterSpacing: 0.8,
    marginTop: hp(3),
    marginBottom: hp(1),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: wp(4),
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.6),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  catRowLast: { borderBottomWidth: 0 },
  catTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTextWrap: { marginLeft: wp(3.5), flex: 1 },
  catLabel: { fontSize: wp(3.7), fontFamily: 'Poppins-Medium', color: '#0F172A' },
  catDetail: {
    fontSize: wp(3.1),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginTop: hp(0.2),
  },

  disclaimer: {
    fontSize: wp(3.2),
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    lineHeight: hp(2.4),
    marginTop: hp(2),
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E64AC',
    borderRadius: 999,
    paddingVertical: hp(1.8),
    marginTop: hp(3),
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: wp(3.8),
    fontFamily: 'Poppins-Medium',
    marginLeft: wp(2),
  },
  btnDisabled: { opacity: 0.6 },

  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingVertical: hp(1.7),
    marginTop: hp(1.5),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerBtnText: {
    color: '#EF4444',
    fontSize: wp(3.8),
    fontFamily: 'Poppins-Medium',
    marginLeft: wp(2),
  },

  revokeHint: {
    fontSize: wp(3),
    fontFamily: 'Poppins-Regular',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: hp(2),
    lineHeight: hp(2.2),
  },
});

export default ConnectedHealth;
