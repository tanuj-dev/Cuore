import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  Linking,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';

import { hp, wp, Images } from '../../utilities';
import { CLINICAL_REFERENCES_LABEL } from '../../utilities/Constants';
import { Info, ChevronLeft, Share2, FolderOpen, FileUp } from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { getHealthRecord } from '../../redux/slices';
import { updateLastConsulted } from '../../redux/Home/homeThunk';
import { shareData } from '../../redux/slices';
import { useCustomAlert } from '../../hooks/useCustomAlert';

// Constants
const HIT_SLOP = { top: 20, bottom: 20, left: 20, right: 20 };
const REASSESS_STEP_3 = 3;
const REASSESS_STEP_7 = 7;
const MEDICAL_REFERENCES = [
  {
    parameter: 'Blood Pressure',
    source: 'American Heart Association – High Blood Pressure',
    url: 'https://www.heart.org/en/health-topics/high-blood-pressure',
    context:
      'Blood pressure categories are interpreted within a broader cardiovascular risk context. Cuore presents BP values for awareness and longitudinal tracking, not for diagnostic classification.',
  },
  {
    parameter: 'Blood Glucose & Diabetes Risk',
    source: 'American Diabetes Association – Diagnosis',
    url: 'https://diabetes.org/about-diabetes/diagnosis',
    context:
      'Blood glucose values, including fasting glucose and HbA1c, are interpreted within a broader metabolic risk context. Cuore presents these values for awareness and trend tracking, not for diagnostic use.',
  },
  {
    parameter: 'Lipid & Cardiovascular Risk',
    source: 'American Heart Association – Cholesterol Overview',
    url: 'https://www.heart.org/en/health-topics/cholesterol',
    context:
      'Lipid markers, including triglycerides and HDL cholesterol, are interpreted within broader cardiovascular risk context. Cuore presents lipid values for awareness and longitudinal trend tracking rather than diagnostic classification.',
  },
  {
    parameter: 'Longitudinal Cardiometabolic Research',
    source: 'Framingham Heart Study',
    url: 'https://framinghamheartstudy.org',
    context:
      "Cuore's trend summaries and projections reflect general population research examining associations between lifestyle factors and cardiometabolic risk.",
  },
  {
    parameter: 'Heart Rate & Cardiovascular Context',
    source: 'American Heart Association – Target Heart Rates',
    url: 'https://www.heart.org/en/healthy-living/fitness/fitness-basics/target-heart-rates',
    context:
      'Heart rate is presented as a general indicator of cardiovascular response and fitness. Cuore tracks heart rate trends for awareness and longitudinal monitoring, not for diagnostic classification.',
  },
  {
    parameter: 'Inflammation & Cardiometabolic Risk (hsCRP)',
    source: 'Mayo Clinic – C-reactive Protein (CRP) Test',
    url: 'https://www.mayoclinic.org/tests-procedures/c-reactive-protein-test/about/pac-20385228',
    context:
      'C-reactive protein (hsCRP) is a marker associated with inflammation and cardiovascular risk. Cuore presents hsCRP values for awareness and trend tracking within a broader risk context, not for diagnostic use.',
  },
];

const formatDate = date => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = monthNames[d.getMonth()];
  const year = String(d.getFullYear()).slice(-2);

  return `${day}/${month}/${year}`;
};

const Health = ({ navigation }) => {
  const [refreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lastConsulted, setLastConsulted] = useState(new Date());
  const [sharingLoading, setSharingLoading] = useState(false);
  const [showReferencesModal, setShowReferencesModal] = useState(false);
  const viewShotRef = useRef(null);
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();

  const healthObservations = useSelector(
    state => state.health?.data?.data?.data?.healthObservations,
  );
  const userId = useSelector(state => state.auth?.userId);
  const role = useSelector(state => state.auth?.role);
  const profile = useSelector(state => state.health?.data?.data?.data?.profile);
  const loading = useSelector(state => state.health?.loading);
  const profileImage = useSelector(
    state =>
      state?.profile?.data?.data?.user?.photo_url ||
      state?.profile?.data?.data?.user?.photoUrl,
  );

  const profileImageSource = profileImage
    ? { uri: profileImage }
    : Images.UNCLE;

  const isCaregiver = useMemo(() => role === 'caregiver', [role]);
  const medicationsText = useMemo(
    () =>
      Array.isArray(profile?.medications) && profile.medications.length > 0
        ? profile.medications.join(', ')
        : 'No medications listed',
    [profile?.medications],
  );

  const getHealthObservationsData = useCallback(observations => {
    return [
      {
        parameter: 'Heart Rate',
        value: observations?.heartRate?.value
          ? `${observations.heartRate.value} bpm`
          : ' -',
        status: observations?.heartRate?.status,
      },
      {
        parameter: 'Blood Pressure',
        value: observations?.bloodPressure?.value
          ? `${observations.bloodPressure.value} mmHg`
          : ' -',
        status: observations?.bloodPressure?.status,
      },
      {
        parameter: 'Blood Sugar PP',
        value: observations?.bloodSugarPP?.value
          ? `${observations.bloodSugarPP.value} mg/dL`
          : ' -',
        status: observations?.bloodSugarPP?.status,
      },
      {
        parameter: 'HbA1c',
        value: observations?.HbA1c?.value
          ? `${observations.HbA1c.value}%`
          : ' -',
        status: observations?.HbA1c?.status,
      },
      {
        parameter: 'TG/HDL Ratio',
        value: observations?.TG_HDL_Ratio?.value
          ? `${observations.TG_HDL_Ratio.value}`
          : ' -',
        status: observations?.TG_HDL_Ratio?.status,
      },
      {
        parameter: 'HsCRP',
        value: observations?.HsCRP?.value
          ? `${observations.HsCRP.value} mg/dL`
          : ' -',
        status: observations?.HsCRP?.status,
      },
      {
        parameter: 'Lifestyle Score',
        value: observations?.lifestyleScore?.value
          ? `${observations.lifestyleScore.value}%`
          : ' -',
        status: observations?.lifestyleScore?.status,
      },
    ];
  }, []);

  const healthObservationsData = useMemo(
    () => getHealthObservationsData(healthObservations),
    [healthObservations, getHealthObservationsData],
  );

  const onDateChange = useCallback(
    async (event, selectedDate) => {
      if (event.type === 'dismissed') {
        setShowDatePicker(false);
        return;
      }

      const currentDate = selectedDate || lastConsulted;
      setLastConsulted(currentDate);
      setShowDatePicker(false);

      const formattedDate = currentDate.toISOString().split('T')[0];

      const payload = {
        lastConsultedDate: formattedDate,
      };

      await dispatch(updateLastConsulted({ userId, payload }));
    },
    [dispatch, userId, lastConsulted],
  );

  useEffect(() => {
    if (userId) {
      dispatch(getHealthRecord(userId));
    }
  }, [dispatch, userId, lastConsulted]);

  const onRefresh = useCallback(() => {
    if (userId) {
      dispatch(getHealthRecord(userId));
    }
  }, [dispatch, userId]);

  const handleShareScreenshot = useCallback(async () => {
    try {
      setSharingLoading(true);
      const payload = {
        page: 'CUORE_HEALTH',
      };

      const response = await dispatch(shareData(payload));
      console.log(response.payload, 'response');

      if (
        response.payload &&
        response.payload.success &&
        response.payload.data
      ) {
        const pdfData = response.payload.data;

        let pdfUrl;
        if (typeof pdfData === 'string') {
          pdfUrl = pdfData;
        } else if (pdfData.url) {
          pdfUrl = pdfData.url;
        } else if (pdfData.file) {
          pdfUrl = pdfData.file;
        } else {
          pdfUrl = pdfData;
        }

        const shareOptions = {
          title: 'Health Records',
          message: 'Check out my health records!',
          url: pdfUrl,
          type: 'application/pdf',
        };

        await Share.open(shareOptions);
      } else {
        alert('Error', 'Failed to generate PDF for sharing');
      }
    } catch (error) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing PDF:', error);
        alert('Error', 'Failed to share PDF');
      }
    } finally {
      setSharingLoading(false);
    }
  }, [dispatch, alert]);

  const handleNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleNavigateToReassess = useCallback(
    step => {
      navigation.navigate('OnBoarding', {
        STEP: step,
        screen: 'Reassess',
        navigateTo: 'Home',
      });
    },
    [navigation],
  );

  const handleNavigateToHealthRecords = useCallback(() => {
    navigation.navigate('HealthRecords');
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#11418A" />
      </View>
    );
  }

  return (
    <View edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      {AlertComponent}
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'jpg', quality: 0.9 }}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          {/* Fixed Header - Always Visible */}
          <View style={styles.fixedHeader}>
            <TouchableOpacity
              hitSlop={HIT_SLOP}
              onPress={handleNavigateBack}
              style={styles.headerBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={22} color="#1F2937" />
            </TouchableOpacity>

            {/* flex:1 + equal-width side buttons keeps the title truly centred */}
            <Text style={styles.fixedHeaderTitle} numberOfLines={1}>
              My Health
            </Text>

            <TouchableOpacity
              disabled={isCaregiver || sharingLoading}
              hitSlop={HIT_SLOP}
              onPress={handleShareScreenshot}
              style={[
                styles.headerBtn,
                styles.headerBtnAccent,
                (isCaregiver || sharingLoading) && styles.headerBtnDisabled,
              ]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Share my health report"
            >
              <Share2 size={19} color="#11418A" />
            </TouchableOpacity>
          </View>

          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            style={{
              backgroundColor: '#FFFFFF',
              flex: 1,
              marginTop: Platform.OS === 'ios' ? hp(0) : hp(2),
            }}
            contentContainerStyle={{
              paddingTop: Platform.OS === 'ios' ? hp(10) : hp(6),
            }}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.container}>
                <View style={styles.card}>
                  {/* Name + Age + Smoker */}
                  <View style={styles.row}>
                    <Image
                      source={profileImageSource}
                      style={{
                        resizeMode: 'cover',
                        height: hp(5),
                        width: wp(12),
                        borderRadius: wp(6),
                      }}
                    />
                    <View style={{ marginLeft: hp(3) }}>
                      <Text style={styles.name}>{profile?.name}</Text>
                      <Text style={styles.detail}>
                        {profile?.age} years {profile?.smoker}
                      </Text>
                    </View>
                  </View>

                  {/* Past HO */}
                  <View
                    style={{
                      marginTop: hp(2),
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionTitle}>Past Ho:</Text>
                      <Text style={styles.detail}>{profile?.pastHO}</Text>
                    </View>
                    <TouchableOpacity
                      disabled={isCaregiver}
                      onPress={() => handleNavigateToReassess(REASSESS_STEP_3)}
                    >
                      <Image
                        source={Images.EDIT}
                        style={{
                          height: hp(3),
                          width: wp(4),
                          resizeMode: 'contain',
                        }}
                        size={20}
                        color="gray"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Medications */}
                  <View
                    style={{
                      marginTop: hp(2),
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionTitle}>Medications:</Text>
                      <Text style={styles.detail}>{medicationsText}</Text>
                    </View>
                    <TouchableOpacity onPress={handleNavigateBack}>
                      <Image
                        source={Images.EDIT}
                        style={{
                          height: hp(3),
                          width: wp(4),
                          resizeMode: 'contain',
                        }}
                        size={20}
                        color="gray"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Last Consulted */}
                  <View
                    style={{
                      marginTop: hp(2),
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionTitle}>Last Consulted:</Text>
                      <Text style={styles.detail}>
                        {formatDate(profile?.lastConsulted)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                      <Image
                        source={Images.EDIT}
                        style={{
                          height: hp(3),
                          width: wp(4),
                          resizeMode: 'contain',
                        }}
                        size={20}
                        color="gray"
                      />
                    </TouchableOpacity>
                  </View>

                  {showDatePicker && (
                    <View style={styles.datePickerWrapper}>
                      <DateTimePicker
                        disabled={isCaregiver}
                        value={lastConsulted}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                        textColor="#000000"
                        themeVariant="light"
                      />
                    </View>
                  )}
                </View>

                {/* Health Observations */}
                <View style={styles.observationsDisclaimerRow}>
                  <Image
                    style={styles.observationsDisclaimerIcon}
                    source={Images.NOTICE}
                  />
                  <Text style={styles.observationsDisclaimer}>
                    Values are manually entered by you. Status indicators
                    reflect general public health reference ranges and are not
                    diagnostic classifications.
                  </Text>
                </View>
                <View style={styles.card}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: hp(2),
                    }}
                  >
                    <Text style={styles.sectionTitle}>Health Observations</Text>
                    <TouchableOpacity
                      disabled={isCaregiver}
                      onPress={() => handleNavigateToReassess(REASSESS_STEP_7)}
                      style={styles.updateButton}
                    >
                      <Text style={styles.updateButtonText}>
                        Update Readings
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: hp(2),
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        color: '#374151',
                        fontFamily: 'Poppins-Medium',
                      }}
                    >
                      Parameter
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: '#374151',
                        fontFamily: 'Poppins-Medium',
                      }}
                    >
                      Value
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: '#000000',
                        fontFamily: 'Poppins-Medium',
                        marginRight: hp(2),
                      }}
                    >
                      Status
                    </Text>
                  </View>
                  <FlatList
                    data={healthObservationsData}
                    keyExtractor={(item, index) => `${item.parameter}-${index}`}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                    updateCellsBatchingPeriod={50}
                    initialNumToRender={7}
                    windowSize={10}
                    renderItem={({ item }) => (
                      <View
                        style={{
                          paddingVertical: hp(2),
                          borderBottomWidth: 1,
                          borderColor: '#E5E7EB',
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Text
                            style={{
                              width: hp(17),
                              fontSize: 14,
                              color: '#000000',
                              fontFamily: 'Poppins-Regular',
                            }}
                          >
                            {item?.parameter}
                          </Text>
                          <Text
                            style={{
                              marginLeft: hp(2),
                              width: hp(17),
                              fontSize: 14,
                              color: '#374151',
                              fontFamily: 'Poppins-Regular',
                            }}
                          >
                            {item?.value ?? '-'}
                          </Text>
                          <View style={{ width: hp(17) }}>
                            <View
                              style={{
                                height: hp(2),
                                width: hp(2),
                                borderRadius: hp(4),
                                backgroundColor: item.status,
                              }}
                            />
                          </View>
                        </View>
                      </View>
                    )}
                  />
                </View>

                {/* Medical References Card */}
                <TouchableOpacity
                  style={[styles.card, styles.referencesCard]}
                  onPress={() => setShowReferencesModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.referencesCardInner}>
                    <Info
                      size={Math.max(16, hp(1.85))}
                      color="#94A3B8"
                      strokeWidth={2}
                      style={styles.referencesInfoIcon}
                    />
                    <Text style={styles.referencesCardText}>
                      {CLINICAL_REFERENCES_LABEL}
                    </Text>
                    <Text style={styles.referencesCardChevron}>›</Text>
                  </View>
                </TouchableOpacity>

                {/* Health Records */}
                <TouchableOpacity
                  onPress={handleNavigateToHealthRecords}
                  style={styles.card}
                >
                  <Text style={styles.sectionTitle}>Health Records</Text>

                  <View style={styles.recordsTile}>
                    <View style={styles.recordsTileIcon}>
                      <FolderOpen size={20} color="#11418A" />
                    </View>
                    <View style={styles.recordsTileText}>
                      <Text style={styles.recordsTileTitle}>
                        Reports, prescriptions & scans
                      </Text>
                      <Text style={styles.recordsTileSub}>
                        Named by you, kept in one place
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleNavigateToHealthRecords}
                    style={styles.button}
                    activeOpacity={0.85}
                  >
                    <FileUp size={18} color="#FFFFFF" />
                    <Text style={styles.buttonText}>
                      Add / View Health Records
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.note}>
                    * Your records are stored securely and are only visible to
                    you and the doctors you are linked with.
                  </Text>
                </TouchableOpacity>

                {/* Data & privacy */}
                <View style={styles.card}>
                  <View style={styles.aiDisclaimerHeader}>
                    <Image
                      style={styles.aiDisclaimerIcon}
                      source={Images.NOTICE}
                    />
                    <Text style={styles.aiDisclaimerTitle}>
                      About Your Data
                    </Text>
                  </View>
                  <Text style={styles.aiDisclaimerText}>
                    <Text style={{ fontFamily: 'Poppins-Medium' }}>
                      Health Records:{' '}
                    </Text>
                    {`Documents you upload are stored securely under the name you give them. They are not scanned, analysed or summarised — they are simply kept for you and the doctors you are linked with.`}
                  </Text>
                  <Text style={styles.aiDisclaimerText}>
                    <Text style={{ fontFamily: 'Poppins-Medium' }}>
                      Health Data:{' '}
                    </Text>
                    {`Vitals (e.g., heart rate, blood pressure, blood sugar) are entered by you. Cuore does not connect to external medical devices.`}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </ViewShot>

      {/* Medical References Modal */}
      <Modal
        visible={showReferencesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReferencesModal(false)}
      >
        <TouchableOpacity
          style={styles.referencesOverlay}
          activeOpacity={1}
          onPress={() => setShowReferencesModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={styles.referencesBox}
          >
            <Text style={styles.referencesModalTitle}>
              {CLINICAL_REFERENCES_LABEL}
            </Text>
            <Text style={styles.referencesModalSubtitle}>
              Status indicators in Health Observations are based on the
              following internationally recognised guidelines:
            </Text>
            <ScrollView
              style={styles.referencesScroll}
              showsVerticalScrollIndicator={false}
            >
              {MEDICAL_REFERENCES.map((ref, index) => (
                <View key={index} style={styles.referenceItem}>
                  <Text style={styles.referenceParameter}>{ref.parameter}</Text>
                  <Text
                    style={[styles.referenceSource, styles.referenceLink]}
                    onPress={() => Linking.openURL(ref.url)}
                  >
                    {ref.source}
                  </Text>
                  <Text style={styles.referenceContext}>{ref.context}</Text>
                </View>
              ))}
              <Text style={styles.referencesFootnote}>
                Cuore organizes user-provided health data into a longitudinal
                timeline and provides general public health context for
                awareness. Trend projections reflect general population research
                patterns and are not medical predictions.{'\n\n'}Cuore does not
                diagnose, treat, or prescribe. All insights, scores, and
                projections are informational and should be interpreted in
                consultation with a qualified healthcare professional.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.referencesCloseBtn}
              onPress={() => setShowReferencesModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.referencesCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>


      <Modal
        transparent={true}
        animationType="fade"
        visible={sharingLoading}
        onRequestClose={() => setSharingLoading(false)}
      >
        <View style={styles.sharingLoaderOverlay}>
          <View style={styles.sharingLoaderContainer}>
            <ActivityIndicator size="large" color="#11418A" />
            <Text style={styles.sharingLoaderText}>Generating PDF...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    padding: 10,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: Platform.OS === 'ios' ? hp(2) : hp(3),
    paddingBottom: hp(1.5),
    zIndex: 1000,
    elevation: 1000,
    pointerEvents: 'box-none',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  // Both header buttons are the same 38x38 circle, so the flex:1 title between
  // them lands dead centre. (The old style put a drop shadow on the touchable
  // itself, which rendered as a grey box behind the bare icon on Android.)
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerBtnAccent: {
    backgroundColor: '#EFF6FF',
  },
  headerBtnDisabled: {
    opacity: 0.45,
  },
  fixedHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 19,
    color: '#111827',
    marginHorizontal: wp(2),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: hp(2),
    marginVertical: hp(0.8),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  name: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'Poppins-Regular',
  },
  detail: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  label: {
    fontSize: 14,
    marginVertical: 2,
    color: '#6B7280',
    width: hp(25),
  },
  bold: {
    fontSize: 14,
    color: '#11418A',
    fontFamily: 'Poppins-Medium',
    fontWeight: 'bold',
  },
  flatHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  flatHistoryFlag: {
    width: 20,
    height: 20,
    marginRight: wp(2),
  },
  sectionTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Poppins-Medium',
  },
  observationsDisclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(1),
    marginTop: hp(0.5),
  },
  observationsDisclaimerIcon: {
    marginRight: hp(1),
    height: hp(1.5),
    width: hp(2),
    resizeMode: 'contain',
    marginHorizontal: hp(0.5),
  },
  observationsDisclaimer: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  progressTitle: {
    fontSize: 12.5,
    fontFamily: 'Poppins-Regular',
  },
  updateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#11418A',
    paddingVertical: hp(1),
    paddingHorizontal: hp(1),
    width: hp(12),
    borderRadius: hp(1),
  },
  updateButtonText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: 'Poppins-Medium',
  },
  columnHeader: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Poppins-Medium',
    width: hp(17),
  },
  cellText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Poppins-Regular',
    width: hp(17),
  },
  observationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  parameter: {
    flex: 2,
    fontSize: 14,
  },
  value: {
    flex: 1.2,
    fontSize: 14,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  recordsTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: hp(1.6),
    marginTop: hp(1.4),
  },
  recordsTileIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordsTileText: {
    flex: 1,
    marginLeft: wp(3),
  },
  recordsTileTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#1F2937',
  },
  recordsTileSub: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 2,
  },
  button: {
    marginTop: hp(1.6),
    backgroundColor: '#11418A',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
  },
  note: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#94A3B8',
    marginTop: hp(1.2),
    fontFamily: 'Poppins-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharingLoaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharingLoaderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: hp(1),
    padding: hp(3),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: wp(40),
  },
  sharingLoaderText: {
    marginTop: hp(1.5),
    fontSize: hp(1.8),
    color: '#111827',
    fontFamily: 'Poppins-Regular',
  },
  datePickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: hp(1.5),
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'Poppins-Regular',
    minHeight: hp(8),
    textAlignVertical: 'top',
    marginTop: hp(0.5),
  },
  // References card
  referencesCard: {
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#EFF6FF',
  },
  referencesCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  referencesInfoIcon: {
    marginRight: hp(1),
  },
  referencesCardText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.15,
    lineHeight: 18,
  },
  referencesCardChevron: {
    fontSize: 22,
    color: '#94A3B8',
    marginLeft: hp(1),
  },
  // References modal
  referencesOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  referencesBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: hp(2.5),
    maxHeight: '80%',
  },
  referencesModalTitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#64748B',
    letterSpacing: 0.15,
    marginBottom: hp(0.5),
  },
  referencesModalSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#64748B',
    marginBottom: hp(2),
    lineHeight: 18,
  },
  referencesScroll: {
    maxHeight: hp(45),
  },
  referenceItem: {
    marginBottom: hp(1.5),
    paddingBottom: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  referenceParameter: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13.5,
    color: '#11418A',
    marginBottom: 2,
  },
  referenceSource: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  referenceLink: {
    color: '#11418A',
    textDecorationLine: 'underline',
  },
  referenceContext: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 17,
    marginTop: 4,
    fontStyle: 'italic',
  },
  referencesFootnote: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: hp(1),
    marginBottom: hp(2),
    lineHeight: 16,
  },
  referencesCloseBtn: {
    backgroundColor: '#11418A',
    borderRadius: 10,
    paddingVertical: hp(1.5),
    alignItems: 'center',
    marginTop: hp(1),
  },
  referencesCloseBtnText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
  // AI disclaimer card
  aiDisclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  aiDisclaimerIcon: {
    height: hp(1.8),
    width: hp(2),
    resizeMode: 'contain',
    marginRight: hp(1),
  },
  aiDisclaimerTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#1E293B',
  },
  aiDisclaimerText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 21,
    marginBottom: hp(1),
    letterSpacing: 0.1,
  },
});

export default Health;
