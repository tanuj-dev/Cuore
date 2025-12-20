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
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';

import { hp, wp, Images } from '../../utilities';
import { useSelector, useDispatch } from 'react-redux';
import { getHealthRecord } from '../../redux/slices';
import { updateLastConsulted } from '../../redux/Home/homeThunk';
import { shareData } from '../../redux/slices';

// Constants
const HIT_SLOP = { top: 20, bottom: 20, left: 20, right: 20 };
const REASSESS_STEP_3 = 3;
const REASSESS_STEP_7 = 7;
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
  const [profileImage, setProfileImage] = useState(null);
  const [refreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lastConsulted, setLastConsulted] = useState(new Date());
  const viewShotRef = useRef(null);
  const dispatch = useDispatch();

  const healthObservations = useSelector(
    state => state.health?.data?.data?.data?.healthObservations,
  );
  const userId = useSelector(state => state.auth?.userId);
  const role = useSelector(state => state.auth?.role);
  const profile = useSelector(state => state.health?.data?.data?.data?.profile);
  const loading = useSelector(state => state.health?.loading);

  // Memoize derived data
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
      // if (viewShotRef.current) {
      //   const uri = await viewShotRef.current.capture();

      //   const shareOptions = {
      //     title: 'Health Records',
      //     message: 'Check out my health records!',
      //     url: uri,
      //     type: 'image/jpeg',
      //   };

      //   await Share.open(shareOptions);
      // }

      const payload = {
        page: 'CUORE_HEALTH',
      };

      const response = await dispatch(shareData(payload));
      // await Alert.alert(response.data.message);
    } catch (error) {
      // User cancelled sharing - don't show error
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share screenshot');
      }
    }
  }, []);

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
        <ActivityIndicator size="large" color="#1E64AC" />
      </View>
    );
  }

  return (
    <View edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
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
                      source={Images.UNCLE}
                      style={{
                        resizeMode: 'contain',
                        height: hp(5),
                        width: wp(12),
                      }}
                    />
                    <View style={{ marginLeft: hp(3) }}>
                      <Text style={styles.name}>{profile?.name}</Text>
                      <Text style={styles.detail}>
                        {profile?.age} years {smokerText}
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
                    <DateTimePicker
                      disabled={isCaregiver}
                      value={lastConsulted}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                    />
                  )}
                </View>

                {/* Health Observations */}
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
                        Update Biomarkers
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
                        fontWeight: '700',
                        color: '#374151',
                        fontFamily: 'Roboto-Regular',
                      }}
                    >
                      Parameter
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: '#374151',
                        fontFamily: 'Roboto-Regular',
                      }}
                    >
                      Value
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: '#000000',
                        fontFamily: 'Roboto-Regular',
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
                              fontWeight: '500',
                              color: '#000000',
                              fontFamily: 'Roboto-Regular',
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
                              fontWeight: '500',
                              color: '#374151',
                              fontFamily: 'Roboto-Regular',
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
                    }}
                  >
                    {profileImage ? (
                      <Image
                        source={{ uri: profileImage }}
                        style={{
                          width: '100%',
                          height: 150,
                          resizeMode: 'contain',
                          borderRadius: 6,
                        }}
                      />
                    ) : (
                      <Image
                        source={Images.PRECRIPTION}
                        style={styles.recordImage}
                      />
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={handleNavigateToHealthRecords}
                    style={styles.button}
                  >
                    <Image
                      source={Images.CAMERA} // Replace with actual key in your `images` object
                      style={{
                        resizeMode: 'contain',
                        height: hp(2.5),
                        width: hp(4),
                        // marginLeft: hp(-1.8),
                      }}
                      resizeMode="contain"
                    />
                    <Text style={styles.buttonText}> Add New Record*</Text>
                  </TouchableOpacity>
                  <Text style={styles.note}>
                    * By uploading health records, you agree to our medical
                    records policy and consent to OCR processing for better
                    health insights.
                  </Text>
                </TouchableOpacity>

                {/* Summary of Records */}
                <View style={styles.card}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={styles.sectionTitle}>Summary of Records</Text>
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Image
                        style={{
                          height: hp(1.5),
                          width: hp(2),
                          resizeMode: 'contain',
                          marginHorizontal: hp(1),
                        }}
                        source={Images.NOTICE}
                      />
                      <Text
                        style={{
                          width: wp(45),
                          fontSize: 12,
                          color: '#6B7280',
                        }}
                      >
                        Accuracy depends on clarity and legibility of
                        handwriting.
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.bold}>History: </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '400',
                      color: '#4B5563',
                    }}
                  >
                    Cholecystectomy (Gallbladder removal)   Left thigh fracture
                  </Text>

                  <Text style={[styles.bold, { marginTop: hp(1) }]}>
                    Medications:
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '400',
                      color: '#4B5563',
                    }}
                  >
                    Diabetes on metformin   Hypertension (HTN) on Cardace
                  </Text>

                  <Text style={[styles.label, { marginTop: hp(1) }]}>
                    <Text style={styles.bold}>Labs:</Text>
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '400',
                      color: '#4B5563',
                    }}
                  >
                    RBS: 230
                  </Text>
                </View>
                <View style={styles.card}>
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
    paddingTop: Platform.OS === 'ios' ? hp(6) : hp(4),
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
    fontFamily: 'Roboto-Regular',
    fontSize: 20,
    fontWeight: '400',
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
    fontWeight: '600',
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
    fontWeight: '400',
    color: '#1F2937',
    fontFamily: 'Roboto-Regular',
  },
  detail: {
    fontSize: 14,
    fontWeight: '400',

    fontFamily: 'Roboto-Regular',
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
    fontWeight: '700',
    color: '#4B5563',
    fontFamily: 'Roboto-Regular',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Roboto-Regular',
  },

  progressTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: 'Roboto-Regular',
  },
  updateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E64AC',
    paddingVertical: hp(1),
    width: hp(12),
    borderRadius: hp(1),
  },
  updateButtonText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: 'Roboto-Regular',
  },

  columnHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    fontFamily: 'Roboto-Regular',
    width: hp(17),
  },

  cellText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Roboto-Regular',
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
    backgroundColor: '#1E64AC',
    borderRadius: hp(0.4),
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Roboto-Regular',
  },
  note: {
    marginHorizontal: hp(1),
    fontSize: 14,
    color: '#6B7280',
    marginTop: hp(0.5),
    fontFamily: 'Roboto-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Health;
