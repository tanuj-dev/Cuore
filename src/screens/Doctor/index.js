import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images, hp, wp } from '../../utilities';
import { useDispatch, useSelector } from 'react-redux';
import { getDoctors, searchDoctors } from '../../redux/Profile/profileThunk';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const Doctor = ({ navigation }) => {
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();
  const { data, loading } = useSelector(state => state.doctors);

  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(getDoctors());
  }, [dispatch]);

  useEffect(() => {
    const list = data?.data?.data ?? [];
    setDoctors(list.map(doc => ({ ...doc, selected: doc.selected === true })));
  }, [data?.data?.data]);

  const toggleSelection = id => {
    setDoctors(prev => prev.map(doc => ({ ...doc, selected: doc._id === id })));
  };

  const handleSearch = async () => {
    if (search.trim() === '') {
      dispatch(getDoctors());
      return;
    }
    try {
      const result = await dispatch(searchDoctors(search.trim())).unwrap();
      if (result?.success) {
        setDoctors(
          (result?.data?.data || []).map(d => ({ ...d, selected: false })),
        );
      } else {
        alert('Search', result?.message || 'No doctors found.');
      }
    } catch (e) {
      alert('Error', e?.message || 'Search failed.');
    }
  };

  const handleRequestSupervision = () => {
    alert(
      'Request Sent',
      "Your request has been sent. Someone from the doctor's office will get in touch with you.",
      [
        {
          text: 'OK',
          onPress: () =>
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
        },
      ],
    );
  };

  const renderDoctorCard = (item, index) => {
    const isSelected = item.selected;
    const feeParts = String(item.fees || '')
      .split('   ')
      .filter(Boolean);

    return (
      <View key={item._id || item.id || index} style={styles.cardRow}>
        <TouchableOpacity
          onPress={() => toggleSelection(item._id)}
          style={[
            styles.checkboxCircle,
            isSelected && styles.checkboxCircleSelected,
          ]}
          activeOpacity={0.7}
        >
          {isSelected && (
            <Image source={Images.RIGHT} style={styles.checkIcon} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, isSelected && styles.cardSelected]}
          onPress={() => toggleSelection(item._id)}
          activeOpacity={0.85}
        >
          <View style={styles.cardTop}>
            <View style={styles.details}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.addressRow}>
                <Text style={styles.addressText}>
                  {[
                    item.address?.areaSector,
                    item.address?.city,
                    item.address?.clinicAddress,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            </View>
            {item.linkedPatients != null && (
              <View style={styles.patientBadge}>
                <Text style={styles.patientCount}>{item.linkedPatients}</Text>
                <Text style={styles.patientLabel}>patients</Text>
              </View>
            )}
          </View>

          <View style={styles.feesBox}>
            <Text style={styles.feesLabel}>Fees</Text>
            <View style={styles.feesList}>
              {feeParts.length > 0 ? (
                feeParts.map((part, i) => (
                  <View key={i} style={styles.feeChip}>
                    <Text style={styles.feesItem}>{part.trim()}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.feesItem}>—</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      {AlertComponent}
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Image
              source={Images.BACK_BUTTON}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cuore-Partnered Doctors</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.noteBox}>
            <View style={styles.noteAccent} />
            <View style={styles.noteInner}>
              <Text style={styles.noteLabel}>Note </Text>
              <Text style={styles.noteText}>
                Cuore doesn't collect supervision fees. You need to pay your
                doctor directly for remote supervision.
              </Text>
            </View>
          </View>

          <View style={styles.searchBox}>
            <Image style={styles.searchIcon} source={Images.SEARCH} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#94A3B8"
              placeholder="Search your doctor..."
              style={styles.searchInput}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearch('');
                  dispatch(getDoctors());
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>Doctors</Text>
            <Text style={styles.listHeaderSub}>Linked Patients</Text>
          </View>

          {loading && doctors.length === 0 ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#11418A" />
              <Text style={styles.loadingText}>Loading doctors...</Text>
            </View>
          ) : doctors.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No doctors found.</Text>
              <Text style={styles.emptySubText}>
                Try a different search term.
              </Text>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {doctors.map((item, index) => renderDoctorCard(item, index))}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleRequestSupervision}
            style={styles.button}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Request Supervision</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
    }),
  },
  backButton: {
    padding: hp(0.5),
  },
  backIcon: {
    height: hp(3),
    width: wp(5),
    tintColor: '#1E293B',
  },
  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#1E293B',
    marginLeft: wp(3),
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(2),
  },
  noteBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF7F7',
    marginHorizontal: wp(4),
    marginTop: hp(2),
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  noteAccent: {
    width: 4,
    backgroundColor: '#EF4444',
  },
  noteInner: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: hp(1.5),
  },
  noteLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#DC2626',
  },
  noteText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  searchBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp(4),
    marginTop: hp(2),
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      android: { elevation: 1 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
    }),
  },
  searchIcon: {
    height: hp(2.2),
    width: wp(4.5),
    marginRight: wp(2),
    resizeMode: 'contain',
    tintColor: '#94A3B8',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 0,
  },
  clearText: {
    fontSize: 14,
    color: '#94A3B8',
    paddingLeft: wp(2),
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: wp(4),
    marginTop: hp(2.5),
    marginBottom: hp(1),
  },
  listHeaderTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#1E293B',
  },
  listHeaderSub: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  listWrap: {
    paddingHorizontal: wp(4),
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(1.5),
  },
  checkboxCircle: {
    marginTop: hp(1.6),
    marginRight: wp(2.5),
    height: wp(5),
    width: wp(5),
    borderRadius: wp(2.5),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleSelected: {
    borderColor: '#11418A',
    backgroundColor: '#11418A',
  },
  checkIcon: {
    width: wp(3),
    height: wp(3),
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: wp(3.5),
    borderLeftWidth: 3,
    borderLeftColor: '#CBD5E1',
    ...Platform.select({
      android: { elevation: 1 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
    }),
  },
  cardSelected: {
    borderLeftColor: '#11418A',
    backgroundColor: '#F8FAFF',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(1.2),
  },
  details: {
    flex: 1,
  },
  name: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#1E293B',
    marginBottom: hp(0.4),
    textTransform: 'capitalize',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    flex: 1,
  },
  patientBadge: {
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    marginLeft: wp(2),
    minWidth: wp(10),
  },
  patientCount: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#11418A',
  },
  patientLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: '#64748B',
  },
  feesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: hp(1.2),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  feesLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: '#475569',
    marginBottom: hp(0.6),
  },
  feesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(1.5),
  },
  feeChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingVertical: hp(0.4),
    paddingHorizontal: wp(2),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: wp(1.5),
    marginBottom: hp(0.4),
  },
  feesItem: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#374151',
  },
  loadingWrap: {
    paddingVertical: hp(6),
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#64748B',
    marginTop: hp(1),
  },
  emptyWrap: {
    paddingVertical: hp(6),
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#1E293B',
  },
  emptySubText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#94A3B8',
    marginTop: hp(0.5),
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
    }),
  },
  button: {
    backgroundColor: '#11418A',
    paddingVertical: hp(1.8),
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default Doctor;
