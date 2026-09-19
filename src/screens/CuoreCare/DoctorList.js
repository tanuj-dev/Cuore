import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Search, MapPin, Stethoscope, Video, ChevronRight } from 'lucide-react-native';

import { CC } from './ccTheme';
import { CCHeader, Card, DoctorAvatar, EmptyState } from './components';
import { getCuoreCareDoctors } from '../../redux/CuoreCare/thunks';

const F = CC.fonts;

export default function DoctorList({ navigation, route }) {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector(state => state.cuoreCare.doctors);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  /* ACCEPTING A FOLLOW-UP LANDS HERE, not on the booking form.
   *
   * BookAppointment needs a whole doctor object — its channel list decides which consultation
   * modes are even offered — and a snapshot carried from a reminder issued weeks ago can be
   * stale. So the reminder hands over an ID, this screen resolves it against the LIVE list, and
   * hands the real record on. If that doctor is no longer bookable the patient simply stays
   * here with the list in front of them, which is the right outcome rather than an error.
   */
  const bookWithDoctorId = route?.params?.bookWithDoctorId || null;
  const initialDate = route?.params?.initialDate || null;
  const handedOff = useRef(false);

  useEffect(() => {
    if (!bookWithDoctorId || handedOff.current || loading) return;
    const doc = (list || []).find(d => String(d._id) === String(bookWithDoctorId));
    if (!doc) return;
    handedOff.current = true;
    // `replace`, not `navigate`: the patient asked to book, not to browse. Going back from the
    // booking screen should return them to Today, not to a list they never chose to open.
    navigation.replace('CuoreCareBook', { doctor: doc, initialDate });
  }, [bookWithDoctorId, initialDate, list, loading, navigation]);

  const fetch = useCallback(
    q => dispatch(getCuoreCareDoctors({ search: q })),
    [dispatch],
  );

  /* ONE effect, not two. The initial load used to sit in its own effect while the debounced
   * search below ALSO fired for the empty query 350ms after mount — so opening the doctor list
   * always sent the same request twice. The first load now runs immediately and only a typed
   * change is debounced.
   *
   * The sequence guard is here for the same reason as everywhere else in this flow: the
   * debounce cancels timers, not requests already in flight, so a slow answer for an earlier
   * prefix must not be allowed to replace a newer list. */
  const seq = useRef(0);
  const lastSearch = useRef('');
  useEffect(() => {
    const q = search.trim();
    const typed = lastSearch.current !== q;
    lastSearch.current = q;
    const mine = ++seq.current;
    const run = () => {
      if (mine !== seq.current) return;
      fetch(q);
    };
    if (!typed) {
      run();
      return undefined;
    }
    const t = setTimeout(run, 350);
    return () => clearTimeout(t);
  }, [search, fetch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(getCuoreCareDoctors({ search: search.trim() }));
    setRefreshing(false);
  }, [dispatch, search]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CCHeader title="Choose a doctor" onBack={() => navigation.goBack()} />

      <View style={styles.searchWrap}>
        <Search size={18} color={CC.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name"
          placeholderTextColor={CC.muted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="words"
          returnKeyType="search"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && (list || []).length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={CC.primary} />
          </View>
        ) : (list || []).length === 0 ? (
          <EmptyState
            icon={<Stethoscope size={40} color={CC.muted} />}
            title="No doctors found"
            message={
              error
                ? error
                : search
                ? 'Try a different name.'
                : 'CuoreCare doctors will appear here soon.'
            }
          />
        ) : (
          (list || []).map(doc => (
            <Card
              key={doc._id}
              style={styles.docCard}
              onPress={() =>
                navigation.navigate('CuoreCareBook', { doctor: doc })
              }
            >
              <DoctorAvatar uri={doc.photoUrl} name={doc.displayName} size={52} />
              <View style={styles.docMid}>
                <Text style={styles.docName} numberOfLines={1}>
                  {doc.displayName || 'CuoreCare doctor'}
                </Text>
                {!!doc.specialization && (
                  <Text style={styles.docSpec} numberOfLines={1}>
                    {doc.specialization}
                  </Text>
                )}
                {!!doc.address?.city && (
                  <View style={styles.cityRow}>
                    <MapPin size={12} color={CC.muted} />
                    <Text style={styles.cityText}>{doc.address.city}</Text>
                  </View>
                )}
                <View style={styles.channelRow}>
                  {(doc.channels || []).includes('walkin') && (
                    <View style={styles.channelChip}>
                      <Stethoscope size={11} color={CC.primary} />
                      <Text style={styles.channelChipText}>Walk-in</Text>
                    </View>
                  )}
                  {(doc.channels || ['teleconsult']).includes('teleconsult') && (
                    <View style={styles.channelChip}>
                      <Video size={11} color={CC.primary} />
                      <Text style={styles.channelChipText}>Teleconsult</Text>
                    </View>
                  )}
                </View>
              </View>
              <ChevronRight size={20} color={CC.muted} />
            </Card>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CC.surface },
  center: { paddingVertical: 40, alignItems: 'center' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CC.white,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CC.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: F.PoppinsRegular,
    fontSize: 14,
    color: CC.text,
    paddingVertical: 12,
    marginLeft: 8,
  },
  scroll: { padding: 16 },
  docCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  docMid: { flex: 1, marginLeft: 14 },
  docName: { fontFamily: F.PoppinsSemiBold, fontSize: 15, color: CC.text },
  docSpec: { fontFamily: F.PoppinsRegular, fontSize: 12.5, color: CC.subText, marginTop: 1 },
  cityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  cityText: { fontFamily: F.PoppinsRegular, fontSize: 11.5, color: CC.muted, marginLeft: 4 },
  channelRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: CC.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  channelChipText: { fontFamily: F.PoppinsMedium, fontSize: 10.5, color: CC.primary },
});
