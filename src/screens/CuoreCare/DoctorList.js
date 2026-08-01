import React, { useState, useEffect, useCallback } from 'react';
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
import { Search, MapPin, Stethoscope, ChevronRight } from 'lucide-react-native';

import { CC } from './ccTheme';
import { CCHeader, Card, DoctorAvatar, EmptyState } from './components';
import { getCuoreCareDoctors } from '../../redux/CuoreCare/thunks';

const F = CC.fonts;

export default function DoctorList({ navigation }) {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector(state => state.cuoreCare.doctors);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(
    q => dispatch(getCuoreCareDoctors({ search: q })),
    [dispatch],
  );

  // Initial load
  useEffect(() => {
    fetch('');
  }, [fetch]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetch(search.trim()), 350);
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
});
