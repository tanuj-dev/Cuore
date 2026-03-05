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
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';

import { hp, wp, Images } from '../../utilities';
import { useSelector, useDispatch } from 'react-redux';
import { getHealthRecord, updateAISummary } from '../../redux/slices';
import { updateLastConsulted } from '../../redux/Home/homeThunk';
import { shareData } from '../../redux/slices';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { postApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

// Constants
const HIT_SLOP = { top: 20, bottom: 20, left: 20, right: 20 };
const REASSESS_STEP_3 = 3;
const REASSESS_STEP_7 = 7;
const FLAT_FEEDBACK_OPTIONS = [
  { id: 'inaccurate', label: 'Inaccurate summary' },
  { id: 'missing', label: 'Missing key information' },
  { id: 'terminology', label: 'Incorrect medical terminology' },
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

  return `${day}/${month}/${year}`; // e.g. 04/Dec/25
};

const Health = ({ navigation }) => {
  const [refreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lastConsulted, setLastConsulted] = useState(new Date());
  const [sharingLoading, setSharingLoading] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editedSummary, setEditedSummary] = useState({
    past_history: '',
    medications: '',
    labs: '',
    imaging: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showFlatFeedbackModal, setShowFlatFeedbackModal] = useState(false);
  const [flatFeedbackSelected, setFlatFeedbackSelected] = useState([]);
  const [flatFeedbackSubmitting, setFlatFeedbackSubmitting] = useState(false);
  const viewShotRef = useRef(null);
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();

  const handleToggleFlatFeedbackOption = useCallback(id => {
    setFlatFeedbackSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  }, []);

  const handleOpenFlatFeedback = useCallback(() => {
    setFlatFeedbackSelected([]);
    setShowFlatFeedbackModal(true);
  }, []);

  const handleCloseFlatFeedback = useCallback(() => {
    setShowFlatFeedbackModal(false);
    setFlatFeedbackSelected([]);
  }, []);

  const handleSubmitFlatFeedback = useCallback(async () => {
    if (flatFeedbackSelected.length === 0) {
      alert('Select an option', 'Please select at least one issue to report.');
      return;
    }
    setFlatFeedbackSubmitting(true);
    try {
      const selectedLabels = FLAT_FEEDBACK_OPTIONS.filter(o =>
        flatFeedbackSelected.includes(o.id),
      ).map(o => o.label);

      const payload = {
        healthRecordId: healthRecordId,
        reasons: selectedLabels,
      };

      const response = await postApiCall(EndPoints.REPORT_SUMMARY, payload);

      if (response?.status === 200 || response?.status === 201) {
        handleCloseFlatFeedback();
        alert(
          'Thank you',
          'Your feedback has been submitted to our support team.',
        );
      } else {
        const message =
          response?.data?.message ||
          'Failed to submit feedback. Please try again.';
        alert('Error', message);
      }
    } catch (err) {
      alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setFlatFeedbackSubmitting(false);
    }
  }, [flatFeedbackSelected, healthRecordId, alert, handleCloseFlatFeedback]);

  const healthObservations = useSelector(
    state => state.health?.data?.data?.data?.healthObservations,
  );
  const healthRecordId = useSelector(
    state => state.health?.data?.data?.data?.healthRecords?.healthRecordId,
  );
  const statusofSummary = useSelector(
    state => state.health?.data?.data?.status,
  );
  console.log(healthRecordId, 'healthRecordId');
  const healtRecords = useSelector(
    state => state.health?.data?.data?.data?.healthRecords,
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

  // Memoize derived data
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
  const smokerText = useMemo(
    () => (profile?.smoker === 'Quit >6 months ago' ? 'Past Smoker' : 'Smoker'),
    [profile?.smoker],
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

      // Format date as YYYY-MM-DD
      const formattedDate = currentDate.toISOString().split('T')[0];

      const payload = {
        lastConsultedDate: formattedDate,
      };

      // Dispatch with both userId (in URL) and payload (in body)
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

      // Check if response is successful and contains PDF data
      if (
        response.payload &&
        response.payload.success &&
        response.payload.data
      ) {
        const pdfData = response.payload.data;

        // Determine if pdfData is a URL string or an object with URL
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
      // User cancelled sharing - don't show error
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

  // Initialize edited summary when entering edit mode
  const handleEnterEditMode = useCallback(() => {
    setEditedSummary({
      past_history: healtRecords?.summary?.past_history?.join(', ') || '',
      medications: healtRecords?.summary?.medications?.join(', ') || '',
      labs: healtRecords?.summary?.labs?.join(', ') || '',
      imaging: healtRecords?.summary?.imaging?.join(', ') || '',
    });
    setIsEditingMode(true);
  }, [healtRecords]);

  // Cancel edit mode
  const handleCancelEdit = useCallback(() => {
    setIsEditingMode(false);
    setEditedSummary({
      past_history: '',
      medications: '',
      labs: '',
      imaging: '',
    });
  }, []);

  // Update a specific field in the edited summary
  const handleUpdateField = useCallback((field, value) => {
    setEditedSummary(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Save edited summary
  const handleSaveSummary = useCallback(async () => {
    try {
      setIsSaving(true);

      // Convert comma-separated strings to arrays
      const summaryData = {
        past_history: editedSummary.past_history
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0),
        medications: editedSummary.medications
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0),
        labs: editedSummary.labs
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0),
        imaging: editedSummary.imaging
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0),
      };

      const response = await dispatch(
        updateAISummary({
          userId,
          summary: summaryData,
        }),
      ).unwrap();

      if (response?.success) {
        alert('Success', 'Summary updated successfully');
        setIsEditingMode(false);
        // Refresh health records
        dispatch(getHealthRecord(userId));
      } else {
        alert('Error', response?.message || 'Failed to update summary');
      }
    } catch (error) {
      console.error('Error saving summary:', error);
      alert('Error', error?.message || 'Failed to update summary');
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, userId, editedSummary, alert]);

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
              style={styles.fixedButton}
            >
              <Image
                source={Images.BACK_BUTTON}
                style={{
                  resizeMode: 'contain',
                  height: hp(2.5),
                  width: hp(4),
                }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <View>
              <Text style={styles.fixedHeaderTitle}>Cuore Health</Text>
            </View>
            <TouchableOpacity
              disabled={isCaregiver}
              hitSlop={HIT_SLOP}
              onPress={handleShareScreenshot}
              style={styles.fixedButton}
            >
              <Image
                source={Images.SHARE_4}
                style={{
                  resizeMode: 'contain',
                  height: hp(2),
                  width: hp(3),
                  tintColor: 'black',
                }}
                resizeMode="contain"
              />
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
              {/* Patient Info */}

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
                    Indicators reflect general public health reference ranges.
                    They are not diagnostic classifications.
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
                              // backgroundColor: 'pink',
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
                              // backgroundColor: 'yellow',
                              marginLeft: hp(2),
                              width: hp(17),
                              fontSize: 14,
                              color: '#374151',
                              fontFamily: 'Poppins-Regular',
                            }}
                          >
                            {item?.value ?? '-'}
                          </Text>
                          <View
                            style={{
                              width: hp(17),
                              // alignItems: 'flex-start',
                              // justifyContent: 'flex-start',
                              // right: hp(0.3),
                              // alignSelf: 'center',
                              // marginleft: hp(2),
                            }}
                          >
                            <View
                              style={{
                                // alignSelf: 'center',

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

                {/* Health Records */}
                <TouchableOpacity
                  onPress={handleNavigateToHealthRecords}
                  style={styles.card}
                >
                  <Text style={styles.sectionTitle}>Health Records</Text>
                  <View
                    style={{
                      borderStyle: 'dotted',
                      borderWidth: 1,
                      padding: hp(1),
                      backgroundColor: '#F9FAFB',
                    }}
                  >
                    <Image
                      source={Images.PRECRIPTION}
                      style={styles.recordImage}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleNavigateToHealthRecords}
                    style={styles.button}
                  >
                    <Image
                      source={Images.CAMERA} // Replace with actual key in your `images` object
                      style={{
                        tintColor: 'white',
                        resizeMode: 'contain',
                        height: hp(2.5),
                        width: hp(4),
                        // marginLeft: hp(-1.8),
                      }}
                      resizeMode="contain"
                    />
                    <Text style={styles.buttonText}>
                      {' '}
                      Add / View Health Records
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.note}>
                    * By uploading records, you consent to AI-assisted OCR
                    processing to organize and summarize your documents.
                  </Text>
                </TouchableOpacity>

                {/* Summary of Records */}
                <View style={styles.card}>
                  <TouchableOpacity
                    onPress={() => setIsSummaryExpanded(!isSummaryExpanded)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={styles.sectionTitle}>
                        Summary of Records
                      </Text>
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Image
                          style={{
                            height: hp(2),
                            width: hp(2),
                            resizeMode: 'contain',
                            marginLeft: hp(1),
                            transform: [
                              { rotate: isSummaryExpanded ? '180deg' : '0deg' },
                            ],
                          }}
                          source={Images.DOWN}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Credit Text */}
                  {/* <Text
                    style={{
                      fontSize: 12,
                      color: '#6B7280',
                      marginTop: hp(1),
                      fontStyle: 'italic',
                    }}
                  >
                    Powered by AI - Summary generated from your health records
                  </Text> */}

                  {isSummaryExpanded && (
                    <View style={{ marginTop: hp(2) }}>
                      <TouchableOpacity
                        style={[
                          styles.flatFeedbackTapRow,
                          statusofSummary &&
                            statusofSummary !== 'solved' &&
                            styles.flatFeedbackTapRowDisabled,
                        ]}
                        onPress={handleOpenFlatFeedback}
                        activeOpacity={0.7}
                        disabled={
                          !!(statusofSummary && statusofSummary !== 'solved')
                        }
                      >
                        <Image
                          source={Images.FLAG}
                          style={[
                            styles.flatHistoryFlag,
                            statusofSummary &&
                              statusofSummary !== 'solved' && {
                                tintColor: '#9CA3AF',
                              },
                          ]}
                          resizeMode="contain"
                        />
                        <Text
                          style={[
                            styles.flatFeedbackTapText,
                            statusofSummary &&
                              statusofSummary !== 'solved' && {
                                color: '#9CA3AF',
                              },
                          ]}
                        >
                          Report Inaccuracy
                        </Text>
                        {statusofSummary && statusofSummary !== 'solved' && (
                          <Text style={styles.flatFeedbackPendingBadge}>
                            Pending review
                          </Text>
                        )}
                      </TouchableOpacity>
                      <Text
                        style={{
                          fontSize: 12,
                          color: '#4B5563',
                          fontFamily: 'Poppins-Regular',
                          fontStyle: 'italic',
                          marginBottom: hp(1),
                        }}
                      >
                        AI-assisted extraction. Accuracy may vary. Please verify
                        with your original report.
                      </Text>
                      {isEditingMode ? (
                        // Edit Mode - Show TextInputs
                        <View>
                          {/* Past History Input */}
                          <View style={{ marginBottom: hp(2) }}>
                            <View style={styles.flatHistoryRow}>
                              <Text style={styles.bold}>
                                History (from uploaded records):
                              </Text>
                            </View>
                            <TextInput
                              style={styles.editInput}
                              value={editedSummary.past_history}
                              onChangeText={text =>
                                handleUpdateField('past_history', text)
                              }
                              placeholder="Enter history items separated by commas"
                              placeholderTextColor="#9CA3AF"
                              multiline
                            />
                          </View>

                          {/* Medications Input */}
                          <View style={{ marginBottom: hp(2) }}>
                            <Text style={styles.bold}>
                              Medications (as listed in records):
                            </Text>
                            <TextInput
                              style={styles.editInput}
                              value={editedSummary.medications}
                              onChangeText={text =>
                                handleUpdateField('medications', text)
                              }
                              placeholder="Enter medications separated by commas"
                              placeholderTextColor="#9CA3AF"
                              multiline
                            />
                          </View>

                          {/* Labs Input */}
                          <View style={{ marginBottom: hp(2) }}>
                            <Text style={styles.bold}>
                              Lab values (as recorded in reports):
                            </Text>
                            <TextInput
                              style={styles.editInput}
                              value={editedSummary.labs}
                              onChangeText={text =>
                                handleUpdateField('labs', text)
                              }
                              placeholder="Enter lab results separated by commas"
                              placeholderTextColor="#9CA3AF"
                              multiline
                            />
                          </View>

                          {/* Imaging Input */}
                          <View style={{ marginBottom: hp(2) }}>
                            <Text style={styles.bold}>
                              Imaging findings (as recorded in reports):
                            </Text>
                            <TextInput
                              style={styles.editInput}
                              value={editedSummary.imaging}
                              onChangeText={text =>
                                handleUpdateField('imaging', text)
                              }
                              placeholder="Enter imaging results separated by commas"
                              placeholderTextColor="#9CA3AF"
                              multiline
                            />
                          </View>

                          {/* Save and Cancel Buttons */}
                          <View style={{ flexDirection: 'row', gap: hp(1) }}>
                            <TouchableOpacity
                              style={{
                                flex: 1,
                                backgroundColor: '#10B981',
                                borderRadius: 8,
                                paddingVertical: hp(1.5),
                                alignItems: 'center',
                              }}
                              onPress={handleSaveSummary}
                              disabled={isSaving}
                              activeOpacity={0.8}
                            >
                              {isSaving ? (
                                <ActivityIndicator
                                  color="#FFFFFF"
                                  size="small"
                                />
                              ) : (
                                <Text
                                  style={{
                                    color: '#FFFFFF',
                                    fontSize: 14,
                                    fontFamily: 'Poppins-Medium',
                                  }}
                                >
                                  Save Changes
                                </Text>
                              )}
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={{
                                flex: 1,
                                backgroundColor: '#6B7280',
                                borderRadius: 8,
                                paddingVertical: hp(1.5),
                                alignItems: 'center',
                              }}
                              onPress={handleCancelEdit}
                              disabled={isSaving}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={{
                                  color: '#FFFFFF',
                                  fontSize: 14,
                                  fontFamily: 'Poppins-Medium',
                                }}
                              >
                                Cancel
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        // View Mode - Show Data
                        <View>
                          {/* Past History */}
                          {healtRecords?.summary?.past_history &&
                            Array.isArray(healtRecords.summary.past_history) &&
                            healtRecords.summary.past_history.length > 0 && (
                              <View>
                                <View style={styles.flatHistoryRow}>
                                  <Text style={styles.bold}>
                                    History (from uploaded records):
                                  </Text>
                                </View>
                                <Text
                                  style={{
                                    fontSize: 14,
                                    color: '#4B5563',
                                    fontFamily: 'Poppins-Regular',
                                    marginTop: hp(0.5),
                                  }}
                                >
                                  {healtRecords.summary.past_history.join(
                                    '   ',
                                  )}
                                </Text>
                              </View>
                            )}

                          {/* Medications */}
                          {healtRecords?.summary?.medications &&
                            Array.isArray(healtRecords.summary.medications) &&
                            healtRecords.summary.medications.length > 0 && (
                              <View style={{ marginTop: hp(1) }}>
                                <Text style={styles.bold}>
                                  Medications (as listed in records):
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 14,
                                    color: '#4B5563',
                                    fontFamily: 'Poppins-Regular',
                                    marginTop: hp(0.5),
                                  }}
                                >
                                  {healtRecords.summary.medications.join('   ')}
                                </Text>
                              </View>
                            )}

                          {/* Labs */}
                          {healtRecords?.summary?.labs &&
                            Array.isArray(healtRecords.summary.labs) &&
                            healtRecords.summary.labs.length > 0 && (
                              <View style={{ marginTop: hp(1) }}>
                                <Text style={styles.bold}>
                                  Lab values (as recorded in reports):
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 14,
                                    color: '#4B5563',
                                    fontFamily: 'Poppins-Regular',
                                    marginTop: hp(0.5),
                                  }}
                                >
                                  {healtRecords.summary.labs.join('   ')}
                                </Text>
                              </View>
                            )}

                          {/* Imaging */}
                          {healtRecords?.summary?.imaging &&
                            Array.isArray(healtRecords.summary.imaging) &&
                            healtRecords.summary.imaging.length > 0 && (
                              <View style={{ marginTop: hp(1) }}>
                                <Text style={styles.bold}>
                                  {' '}
                                  Imaging findings (as recorded in reports):
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 14,
                                    color: '#4B5563',
                                    fontFamily: 'Poppins-Regular',
                                    marginTop: hp(0.5),
                                  }}
                                >
                                  {healtRecords.summary.imaging.join('   ')}
                                </Text>
                              </View>
                            )}

                          {/* Show message if no data */}
                          {(!healtRecords?.summary ||
                            ((!healtRecords.summary.past_history ||
                              healtRecords.summary.past_history.length === 0) &&
                              (!healtRecords.summary.medications ||
                                healtRecords.summary.medications.length ===
                                  0) &&
                              (!healtRecords.summary.labs ||
                                healtRecords.summary.labs.length === 0) &&
                              (!healtRecords.summary.imaging ||
                                healtRecords.summary.imaging.length ===
                                  0))) && (
                            <Text
                              style={{
                                fontSize: 14,
                                color: '#6B7280',
                                fontFamily: 'Poppins-Regular',
                                fontStyle: 'italic',
                                marginTop: hp(1),
                              }}
                            >
                              No summary data available
                            </Text>
                          )}

                          {/* Edit Button */}
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#11418A',
                              borderRadius: 8,
                              paddingVertical: hp(1.5),
                              paddingHorizontal: wp(4),
                              marginTop: hp(2),
                              alignItems: 'center',
                            }}
                            onPress={handleEnterEditMode}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={{
                                color: '#FFFFFF',
                                fontSize: 14,
                                fontFamily: 'Poppins-Medium',
                              }}
                            >
                              Edit Summary
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                {/* <View style={styles.card}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={styles.sectionTitle}>
                      Disease Progression Risk
                    </Text>
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                    
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '400',
                      color: '#4B5563',
                    }}
                  >
                    You may have a 52% chance of developing diabetes and early
                    kidney issues within the next 4 years.
                  </Text>

             
                </View> */}
                <View style={[styles.card, { flexDirection: 'row' }]}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    {/* <Text style={styles.sectionTitle}>
                      Disease Progression Risk
                    </Text> */}
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      {/* <Image
                  style={{
                    height: hp(1.5),
                    width: hp(2),
                    resizeMode: 'contain',
                    marginHorizontal: hp(1),
                  }}
                  source={Images.NOTICE}></Image> */}
                      {/* <Text style={{width: wp(45), fontSize: 12, color: '#6B7280'}}>
                  Accuracy depends on clarity and legibility of handwriting.
                </Text> */}
                    </View>
                  </View>

                  <Image
                    style={{
                      marginRight: hp(1),
                      height: hp(1.5),
                      width: hp(2),
                      resizeMode: 'contain',
                      marginHorizontal: hp(1),
                    }}
                    source={Images.NOTICE}
                  />

                  <Text>
                    This is an AI-generated summary for awareness only. It is
                    not a medical diagnosis or treatment plan. Please verify all
                    information with your healthcare provider.
                  </Text>

                  {/* <Text style={styles.bold}>History: </Text>
           

            <Text style={[styles.bold, {marginTop: hp(1)}]}>Medications:</Text>
            <Text style={{fontSize: 14, fontWeight: '400', color: '#4B5563'}}>
              Diabetes on metformin   Hypertension (HTN) on Cardace
            </Text>

            <Text style={[styles.label, {marginTop: hp(1)}]}>
              <Text style={styles.bold}>Labs:</Text>
            </Text>
            <Text style={{fontSize: 14, fontWeight: '400', color: '#4B5563'}}>
              RBS: 230
            </Text> */}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </ViewShot>
      {/* Flat History feedback popup */}
      <Modal
        visible={showFlatFeedbackModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseFlatFeedback}
      >
        <TouchableOpacity
          style={styles.flatFeedbackOverlay}
          activeOpacity={1}
          onPress={handleCloseFlatFeedback}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={styles.flatFeedbackBox}
          >
            <Text style={styles.flatFeedbackTitle}>Report summary issue</Text>
            <Text style={styles.flatFeedbackSubtitle}>
              Select one or more issues below. Tap outside to close.
            </Text>
            {FLAT_FEEDBACK_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.flatFeedbackOption,
                  flatFeedbackSelected.includes(opt.id) &&
                    styles.flatFeedbackOptionSelected,
                ]}
                onPress={() => handleToggleFlatFeedbackOption(opt.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.flatFeedbackOptionText,
                    flatFeedbackSelected.includes(opt.id) &&
                      styles.flatFeedbackOptionTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
                {flatFeedbackSelected.includes(opt.id) && (
                  <Text style={styles.flatFeedbackCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.flatFeedbackSubmitBtn,
                flatFeedbackSubmitting && styles.flatFeedbackSubmitDisabled,
              ]}
              onPress={handleSubmitFlatFeedback}
              disabled={flatFeedbackSubmitting}
              activeOpacity={0.8}
            >
              {flatFeedbackSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.flatFeedbackSubmitText}>Submit</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.flatFeedbackCancelBtn}
              onPress={handleCloseFlatFeedback}
            >
              <Text style={styles.flatFeedbackCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Loading overlay for PDF sharing */}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: hp(1),
    paddingTop: Platform.OS === 'ios' ? hp(2) : hp(3),
    paddingBottom: hp(1.5),
    zIndex: 1000,
    elevation: 1000,
    pointerEvents: 'box-none',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  fixedButton: {
    // backgroundColor: 'rgba(255, 255, 255, 0.9)',
    // borderRadius: hp(1.5),
    padding: hp(0.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fixedHeaderTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 20,
    color: '#1F2937',
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
    backgroundColor: 'white',
    borderRadius: 10,
    padding: hp(2),
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    // overflow: 'hidden',
    fontSize: 14,
    marginVertical: 2,
    color: '#6B7280',
    // backgroundColor: 'red',
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
  flatFeedbackTapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  flatFeedbackTapRowDisabled: {
    opacity: 0.5,
  },
  flatFeedbackTapText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#11418A',
  },
  flatFeedbackPendingBadge: {
    marginLeft: wp(2),
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: wp(2),
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  flatFeedbackOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  flatFeedbackBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: hp(2.5),
    width: '100%',
    maxWidth: 340,
  },
  flatFeedbackTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#1E293B',
    marginBottom: hp(0.5),
  },
  flatFeedbackSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#64748B',
    marginBottom: hp(2),
  },
  flatFeedbackOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: 10,
    marginBottom: hp(1),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  flatFeedbackOptionSelected: {
    borderColor: '#11418A',
    backgroundColor: '#EFF6FF',
  },
  flatFeedbackOptionText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#475569',
  },
  flatFeedbackOptionTextSelected: {
    fontFamily: 'Poppins-Medium',
    color: '#11418A',
  },
  flatFeedbackCheck: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#11418A',
  },
  flatFeedbackSubmitBtn: {
    backgroundColor: '#11418A',
    paddingVertical: hp(1.5),
    borderRadius: 10,
    alignItems: 'center',
    marginTop: hp(1.5),
  },
  flatFeedbackSubmitDisabled: {
    opacity: 0.7,
  },
  flatFeedbackSubmitText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
  flatFeedbackCancelBtn: {
    alignItems: 'center',
    paddingVertical: hp(1),
    marginTop: hp(0.5),
  },
  flatFeedbackCancelText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#64748B',
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
  recordImage: {
    resizeMode: 'contain',
    width: '100%',
    height: 150,
    borderRadius: 6,
    marginVertical: 10,
  },
  button: {
    marginTop: hp(1),
    backgroundColor: '#11418A',
    borderRadius: hp(1),
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    paddingVertical: hp(2),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
  },
  note: {
    marginHorizontal: hp(1),
    fontSize: 14,
    color: '#6B7280',
    marginTop: hp(0.5),
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
});

export default Health;
