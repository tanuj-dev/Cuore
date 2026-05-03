import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
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
import {
  getDoctors,
  requestSupervision,
  searchDoctors,
} from '../../redux/Profile/profileThunk';
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

const PAGE_SIZE = 10;

const doctorRowId = doc => doc?._id ?? doc?.id;

/** Only Active / Pending are shown; e.g. prohibited is hidden */
const formatDoctorStatus = status => {
  const s = String(status ?? '')
    .trim()
    .toLowerCase();
  if (s === 'active') return 'Active';
  if (s === 'pending') return 'Pending';
  return '';
};

const Doctor = ({ navigation }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();
  const { loading } = useSelector(state => state.doctors);

  const [doctors, setDoctors] = useState([]);
  const [specialization, setSpecialization] = useState(null);
  const [specModalVisible, setSpecModalVisible] = useState(false);
  const [nameSearch, setNameSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [requestingSupervision, setRequestingSupervision] = useState(false);

  const selectedDoctor = useMemo(
    () => doctors.find(d => d.selected),
    [doctors],
  );

  const toggleSelection = id => {
    if (id == null) return;
    setDoctors(prev =>
      prev.map(doc => ({ ...doc, selected: doctorRowId(doc) === id })),
    );
  };

  const getListFromResult = result => {
    if (Array.isArray(result?.data?.data)) return result.data.data;
    if (Array.isArray(result?.data?.items)) return result.data.items;
    if (Array.isArray(result?.data)) return result.data;
    return [];
  };

  const getPaginationFromResult = result =>
    result?.data?.pagination || result?.data?.meta || {};

  const fetchDoctors = useCallback(
    async ({ nextPage = 1, append = false, searchValue, specValue } = {}) => {
      const search = String(searchValue ?? nameSearch).trim();
      const specializationValue = specValue ?? specialization?.value ?? '';
      const filters = {
        search,
        specialization: specializationValue,
        page: nextPage,
        limit: PAGE_SIZE,
      };

      try {
        const action = search || specializationValue ? searchDoctors : getDoctors;
        const result = await dispatch(action(filters)).unwrap();
        if (!result?.success) {
          alert('Search', result?.message || 'No doctors found.');
          return;
        }

        const list = getListFromResult(result).map(d => ({
          ...d,
          selected: false,
        }));
        const pagination = getPaginationFromResult(result);
        const totalPages =
          Number(pagination?.totalPages || pagination?.total_pages) || null;
        const currentPage =
          Number(
            pagination?.page ||
              pagination?.currentPage ||
              pagination?.current_page,
          ) || nextPage;

        setDoctors(prev => {
          if (!append) return list;
          const existing = new Set(prev.map(d => d._id || d.id));
          const merged = [...prev];
          list.forEach(item => {
            const key = item._id || item.id;
            if (!existing.has(key)) merged.push(item);
          });
          return merged;
        });

        if (totalPages != null) {
          setHasMore(currentPage < totalPages);
        } else {
          setHasMore(list.length >= PAGE_SIZE);
        }

        setPage(nextPage);
      } catch (e) {
        const msg =
          typeof e === 'string'
            ? e
            : e?.message || e?.payload?.message || 'Search failed.';
        alert('Error', msg);
        if (!append) {
          setDoctors([]);
          setHasMore(false);
        }
      } finally {
        if (append) setLoadingMore(false);
      }
    },
    [alert, dispatch, nameSearch, specialization?.value],
  );

  const loadMore = async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchDoctors({ nextPage: page + 1, append: true });
  };

  const handlePickSpecialization = async item => {
    setSpecModalVisible(false);
    setSpecialization(item || null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasMore(true);
      fetchDoctors({
        nextPage: 1,
        append: false,
        searchValue: nameSearch,
        specValue: specialization?.value || '',
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [nameSearch, specialization?.value, fetchDoctors]);

  const hasFilters = useMemo(
    () => Boolean(String(nameSearch).trim() || specialization?.value),
    [nameSearch, specialization?.value],
  );

  /** Your doctor(s) first, then others; order within each group preserved */
  const sortedDoctors = useMemo(() => {
    const copy = [...doctors];
    copy.sort((a, b) => {
      const aMine = Boolean(a.isMyDoctor);
      const bMine = Boolean(b.isMyDoctor);
      if (aMine !== bMine) return aMine ? -1 : 1;
      return 0;
    });
    return copy;
  }, [doctors]);

  const emptyText = hasFilters ? 'No doctors found for your filters.' : 'No doctors found.';
  const emptySubText = hasFilters
    ? 'Try another name or specialization.'
    : 'Try again after some time.';

  const renderLoadMore = () => {
    if (!doctors.length || !hasMore) return null;
    return (
      <TouchableOpacity
        onPress={loadMore}
        style={styles.loadMoreButton}
        disabled={loadingMore}
        activeOpacity={0.85}
      >
        {loadingMore ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.loadMoreText}>Load more</Text>
        )}
      </TouchableOpacity>
    );
  };

  const handleRequestSupervision = async () => {
    const id = doctorRowId(selectedDoctor);
    if (!id) {
      alert('Select a doctor', 'Please choose a doctor to request supervision.');
      return;
    }
    try {
      setRequestingSupervision(true);
      await dispatch(requestSupervision({ _id: id })).unwrap();
      alert(
        'Request sent',
        "Your request has been sent. Someone from the doctor's office will get in touch with you.",
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
          },
        ],
      );
    } catch (e) {
      const msg =
        typeof e === 'string'
          ? e
          : e?.message || e?.payload?.message || 'Could not send request.';
      alert('Error', msg);
    } finally {
      setRequestingSupervision(false);
    }
  };

  const renderDoctorCard = (item, index) => {
    const isSelected = item.selected;
    const isMyDoctor = Boolean(item.isMyDoctor);
    const statusLabel = formatDoctorStatus(item.status);
    const statusLower = String(item.status ?? '')
      .trim()
      .toLowerCase();

    return (
      <View key={item._id || item.id || index} style={styles.cardRow}>
        <TouchableOpacity
          onPress={() => toggleSelection(doctorRowId(item))}
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
          style={[
            styles.card,
            isMyDoctor && styles.cardMyDoctor,
            isSelected && styles.cardSelected,
            isMyDoctor && isSelected && styles.cardMyDoctorSelected,
          ]}
          onPress={() => toggleSelection(doctorRowId(item))}
          activeOpacity={0.85}
        >
          {statusLabel || isMyDoctor ? (
            <View style={styles.cardStatusRow}>
              {statusLabel ? (
                <View
                  style={[
                    styles.statusBadge,
                    statusLower === 'active' && styles.statusBadgeActive,
                    statusLower === 'pending' && styles.statusBadgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      statusLower === 'active' && styles.statusBadgeTextActive,
                      statusLower === 'pending' &&
                        styles.statusBadgeTextPending,
                    ]}
                  >
                    {statusLabel}
                  </Text>
                </View>
              ) : (
                <View style={styles.statusBadgeSpacer} />
              )}
              {isMyDoctor ? (
                <View style={styles.myDoctorTag}>
                  <Text style={styles.myDoctorTagText}>Your doctor</Text>
                </View>
              ) : null}
            </View>
          ) : null}
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

  const footerContent = renderLoadMore();

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
            Search doctors by name from server.
          </Text>
          <View style={styles.nameSearchBox}>
            <Image style={styles.nameSearchIcon} source={Images.SEARCH} />
            <TextInput
              value={nameSearch}
              onChangeText={setNameSearch}
              placeholderTextColor={c.inputPlaceholder}
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
              <Text style={styles.emptyText}>{emptyText}</Text>
              <Text style={styles.emptySubText}>
                {emptySubText}
              </Text>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {sortedDoctors.map((item, index) =>
                renderDoctorCard(item, index),
              )}
              {footerContent}
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

        {selectedDoctor ? (
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleRequestSupervision}
              style={styles.button}
              activeOpacity={0.85}
              disabled={requestingSupervision}
            >
              {requestingSupervision ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Request Supervision</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </SafeAreaView>
    </>
  );
};

const createStyles = c => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.mutedSurface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: c.card,
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
    tintColor: c.navIconTint,
  },
  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: c.text,
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
    color: c.subText,
    marginHorizontal: wp(4),
    marginTop: hp(2),
    marginBottom: hp(0.6),
  },
  dropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.card,
    marginHorizontal: wp(4),
    paddingVertical: hp(1.4),
    paddingHorizontal: wp(3),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
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
    color: c.text,
  },
  dropdownPlaceholder: {
    color: c.tabInactive,
  },
  dropdownChevron: {
    fontSize: 10,
    color: c.subText,
    marginLeft: wp(2),
  },
  nameSearchHint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: c.tabInactive,
    marginHorizontal: wp(4),
    marginTop: -hp(0.3),
    marginBottom: hp(0.8),
    lineHeight: 16,
  },
  nameSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.card,
    marginHorizontal: wp(4),
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
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
    tintColor: c.tabInactive,
  },
  nameSearchInput: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: c.text,
    paddingVertical: 0,
  },
  nameSearchClear: {
    fontSize: 14,
    color: c.tabInactive,
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
    color: c.card,
    fontFamily: 'Poppins-Medium',
  },
  specRowCheckSpacer: {
    width: wp(6),
  },
  specRowLabel: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: c.card,
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
    color: c.text,
  },
  listHeaderSub: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: c.tabInactive,
  },
  listWrap: {
    paddingHorizontal: wp(4),
  },
  loadMoreButton: {
    marginTop: hp(1),
    marginBottom: hp(2),
    alignSelf: 'center',
    backgroundColor: '#11418A',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(6),
    borderRadius: 10,
  },
  loadMoreText: {
    fontFamily: 'Poppins-Medium',
    color: c.card,
    fontSize: 13,
    letterSpacing: 0.2,
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
    borderColor: c.icon,
    backgroundColor: c.card,
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
    tintColor: c.card,
  },
  card: {
    flex: 1,
    backgroundColor: c.card,
    borderRadius: 14,
    padding: wp(3.5),
    borderLeftWidth: 3,
    borderLeftColor: '#CBD5E1',
    borderWidth: 1,
    borderColor: 'transparent',
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
  cardMyDoctor: {
    backgroundColor: '#ECFDF5',
    borderLeftColor: '#16A34A',
    borderColor: '#BBF7D0',
  },
  cardSelected: {
    borderLeftColor: '#11418A',
    backgroundColor: '#F8FAFF',
  },
  cardMyDoctorSelected: {
    borderLeftColor: '#15803D',
    backgroundColor: '#D1FAE5',
    borderColor: '#86EFAC',
  },
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
    minHeight: hp(2.6),
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: hp(0.35),
    paddingHorizontal: wp(2.2),
    borderRadius: 8,
  },
  statusBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    letterSpacing: 0.2,
  },
  statusBadgeTextActive: {
    color: '#166534',
  },
  statusBadgeTextPending: {
    color: '#92400E',
  },
  statusBadgeSpacer: {
    flex: 1,
  },
  myDoctorTag: {
    backgroundColor: '#16A34A',
    paddingVertical: hp(0.35),
    paddingHorizontal: wp(2.5),
    borderRadius: 8,
    marginLeft: wp(2),
  },
  myDoctorTagText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: c.card,
    letterSpacing: 0.15,
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
    color: c.text,
    marginBottom: hp(0.3),
    textTransform: 'capitalize',
  },
  specialization: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: c.primary,
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
    color: c.subText,
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
    color: c.primary,
  },
  patientLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: c.subText,
  },
  feesBox: {
    backgroundColor: c.surface,
    borderRadius: 10,
    padding: hp(1.2),
    borderWidth: 1,
    borderColor: c.border,
  },
  feesLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: c.subText,
    marginBottom: hp(0.6),
  },
  feesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(1.5),
  },
  feeChip: {
    backgroundColor: c.card,
    borderRadius: 6,
    paddingVertical: hp(0.4),
    paddingHorizontal: wp(2),
    borderWidth: 1,
    borderColor: c.border,
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
    color: c.subText,
    marginTop: hp(1),
  },
  emptyWrap: {
    paddingVertical: hp(6),
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: c.text,
  },
  emptySubText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: c.tabInactive,
    marginTop: hp(0.5),
  },
  footer: {
    backgroundColor: c.card,
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
    color: c.card,
    letterSpacing: 0.3,
  },
});

export default Doctor;
