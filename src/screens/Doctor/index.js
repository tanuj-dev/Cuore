import React, { useState, useEffect, useMemo } from 'react';
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images, hp, wp } from '../../utilities';
import { useDispatch, useSelector } from 'react-redux';
import { getDoctors, searchDoctors } from '../../redux/Profile/profileThunk';
import { useCustomAlert } from '../../hooks/useCustomAlert';

/** Labels match product picker; `value` is sent as ?specialization= (e.g. cardio) */
const DOCTOR_SPECIALIZATIONS = [
  { label: 'General Physician', value: 'general_physician' },
  { label: 'General Practitioner', value: 'general_practitioner' },
  { label: 'Family Physician', value: 'family_physician' },
  { label: 'Internal Medicine Specialist', value: 'internal_medicine' },
  { label: 'Cardiologist', value: 'cardio' },
  { label: 'Interventional Cardiologist', value: 'interventional_cardio' },
  { label: 'Diabetologist', value: 'diabetologist' },
  { label: 'Endocrinologist', value: 'endocrinologist' },
  { label: 'Nephrologist', value: 'nephrologist' },
  { label: 'Pulmonologist', value: 'pulmonologist' },
  { label: 'Geriatrician', value: 'geriatrician' },
  {
    label: 'Obstetrician & Gynecologist',
    value: 'obstetrician_gynecologist',
  },
  { label: 'Bariatric / Obesity Specialist', value: 'bariatric' },
  { label: 'Pediatrician', value: 'pediatrician' },
];

function doctorMatchesNameQuery(doc, rawQuery) {
  const q = String(rawQuery || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  if (!q) return true;
  const name = String(doc?.name || '').toLowerCase();
  return name.includes(q);
}

const Doctor = ({ navigation }) => {
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();
  const { data, loading } = useSelector(state => state.doctors);

  const [doctors, setDoctors] = useState([]);
  const [specialization, setSpecialization] = useState(null);
  const [specModalVisible, setSpecModalVisible] = useState(false);
  /** Client-side only; filters current list (API has no name search) */
  const [nameSearch, setNameSearch] = useState('');

  const filteredDoctors = useMemo(
    () => doctors.filter(d => doctorMatchesNameQuery(d, nameSearch)),
    [doctors, nameSearch],
  );

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

  const applyDoctorList = (result, fallbackMessage) => {
    if (result?.success) {
      setDoctors(
        (result?.data?.data || []).map(d => ({ ...d, selected: false })),
      );
    } else {
      alert('Search', result?.message || fallbackMessage);
    }
  };

  const fetchBySpecialization = async specValue => {
    try {
      const result = await dispatch(searchDoctors(specValue)).unwrap();
      applyDoctorList(result, 'No doctors found.');
    } catch (e) {
      const msg =
        typeof e === 'string'
          ? e
          : e?.message || e?.payload?.message || 'Search failed.';
      alert('Error', msg);
    }
  };

  const handlePickSpecialization = async item => {
    setSpecModalVisible(false);
    if (item == null) {
      setSpecialization(null);
      dispatch(getDoctors());
      return;
    }
    setSpecialization(item);
    await fetchBySpecialization(item.value);
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
              {String(item.specialization || '').trim() ? (
                <Text style={styles.specialization}>
                  {String(item.specialization).trim()}
                </Text>
              ) : null}
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

          <Text style={styles.filterLabel}>Filter by specialization</Text>
          <TouchableOpacity
            style={styles.dropdownField}
            onPress={() => setSpecModalVisible(true)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.dropdownFieldText,
                !specialization && styles.dropdownPlaceholder,
              ]}
              numberOfLines={1}
            >
              {specialization
                ? specialization.label
                : 'All specializations — tap to filter'}
            </Text>
            <Text style={styles.dropdownChevron}>▼</Text>
          </TouchableOpacity>

          <Text style={styles.filterLabel}>Search by name</Text>
          <Text style={styles.nameSearchHint}>
            Filters the doctors above on your device — names only.
          </Text>
          <View style={styles.nameSearchBox}>
            <Image style={styles.nameSearchIcon} source={Images.SEARCH} />
            <TextInput
              value={nameSearch}
              onChangeText={setNameSearch}
              placeholderTextColor="#94A3B8"
              placeholder="Type a doctor's name..."
              style={styles.nameSearchInput}
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="search"
            />
            {nameSearch.length > 0 && (
              <TouchableOpacity
                onPress={() => setNameSearch('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.nameSearchClear}>✕</Text>
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
                Try another specialization or view all doctors.
              </Text>
            </View>
          ) : filteredDoctors.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No name match</Text>
              <Text style={styles.emptySubText}>
                No doctor in this list matches “{nameSearch.trim()}”. Clear the
                name search or pick another specialization.
              </Text>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {filteredDoctors.map((item, index) =>
                renderDoctorCard(item, index),
              )}
            </View>
          )}
        </ScrollView>

        <Modal
          visible={specModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSpecModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.specModalOverlay}
            activeOpacity={1}
            onPress={() => setSpecModalVisible(false)}
          >
            <View
              onStartShouldSetResponder={() => true}
              style={styles.specModalSheet}
            >
              <Text style={styles.specModalTitle}>Specialization</Text>
              <ScrollView
                style={styles.specModalScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  style={styles.specRow}
                  onPress={() => handlePickSpecialization(null)}
                  activeOpacity={0.7}
                >
                  {!specialization ? (
                    <Text style={styles.specRowCheck}>✓</Text>
                  ) : (
                    <View style={styles.specRowCheckSpacer} />
                  )}
                  <Text style={styles.specRowLabel}>All specializations</Text>
                </TouchableOpacity>
                {DOCTOR_SPECIALIZATIONS.map(item => {
                  const selected = specialization?.value === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={styles.specRow}
                      onPress={() => handlePickSpecialization(item)}
                      activeOpacity={0.7}
                    >
                      {selected ? (
                        <Text style={styles.specRowCheck}>✓</Text>
                      ) : (
                        <View style={styles.specRowCheckSpacer} />
                      )}
                      <Text style={styles.specRowLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

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
  filterLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#475569',
    marginHorizontal: wp(4),
    marginTop: hp(2),
    marginBottom: hp(0.6),
  },
  dropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp(4),
    paddingVertical: hp(1.4),
    paddingHorizontal: wp(3),
    borderRadius: 12,
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
  dropdownFieldText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#1E293B',
  },
  dropdownPlaceholder: {
    color: '#94A3B8',
  },
  dropdownChevron: {
    fontSize: 10,
    color: '#64748B',
    marginLeft: wp(2),
  },
  nameSearchHint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: '#94A3B8',
    marginHorizontal: wp(4),
    marginTop: -hp(0.3),
    marginBottom: hp(0.8),
    lineHeight: 16,
  },
  nameSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp(4),
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
    borderRadius: 12,
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
  nameSearchIcon: {
    height: hp(2.2),
    width: wp(4.5),
    marginRight: wp(2),
    resizeMode: 'contain',
    tintColor: '#94A3B8',
  },
  nameSearchInput: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 0,
  },
  nameSearchClear: {
    fontSize: 14,
    color: '#94A3B8',
    paddingLeft: wp(2),
  },
  specModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  specModalSheet: {
    backgroundColor: '#3F3F46',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '72%',
    paddingBottom: hp(2),
  },
  specModalTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#FAFAFA',
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  specModalScroll: {
    maxHeight: hp(48),
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.35),
    paddingHorizontal: wp(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  specRowCheck: {
    width: wp(6),
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
  },
  specRowCheckSpacer: {
    width: wp(6),
  },
  specRowLabel: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
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
    marginBottom: hp(0.3),
    textTransform: 'capitalize',
  },
  specialization: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#11418A',
    marginBottom: hp(0.45),
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
