import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  PermissionsAndroid,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { hp, wp, Images } from '../../utilities';
import { useSelector, useDispatch } from 'react-redux';
import { getHealthRecord } from '../../redux/slices';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateLastConsulted } from '../../redux/Home/homeThunk';
// import {Ionicons, MaterialIcons, Feather} from '@expo/vector-icons';
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

  const [medications, setMedications] = useState(
    'Amlopress, Metformin, Storvas, Ecosprin',
  );
  // const userId = useSelector(state => state.auth.userId);

  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lastConsulted, setLastConsulted] = useState(new Date());

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleImagePicker = async type => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      maxWidth: 500,
      maxHeight: 500,
    };

    try {
      if (type === 'camera') {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          Alert.alert(
            'Permission required',
            'Camera permission is needed to take photos',
          );
          return;
        }
        launchCamera(options, response => {
          if (response.didCancel) {
            console.log('User cancelled image picker');
          } else if (response.error) {
            console.log('ImagePicker Error: ', response.error);
          } else if (response.assets && response.assets.length > 0) {
            setProfileImage(response.assets[0].uri);
            // return(response.assets[0].uri);
          }
        });
      } else {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert(
            'Permission required',
            'Storage permission is needed to access photos',
          );
          return;
        }
        launchImageLibrary(options, response => {
          if (response.didCancel) {
            console.log('User cancelled image picker');
          } else if (response.error) {
            console.log('ImagePicker Error: ', response.error);
          } else if (response.assets && response.assets.length > 0) {
            setProfileImage(response.assets[0].uri);
            // return(response.assets[0].uri);
          }
        });
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => handleImagePicker('camera'),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => handleImagePicker('gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  };

  // const healthObservationsData = [
  //   { parameter: 'Heart Rate', value: '78 bpm', status: '#22C55E' },
  //   { parameter: 'Blood Pressure', value: '142/92 mmHg', status: '#EF4444' },
  //   { parameter: 'Blood Sugar PP', value: '180 mg/dL', status: '#EF4444' },
  //   { parameter: 'HbA1c', value: '7.2%', status: '#EAB308' },
  //   { parameter: 'TG/HDL Ratio', value: '3.8', status: '#EAB308' },
  //   { parameter: 'HsCRP', value: '2.8 mg/L', status: '#EAB308' },
  //   { parameter: 'Lifestyle Score', value: '65%', status: '#EAB308' },
  // ];

  const healthObservations = useSelector(
    state => state.health?.data?.data?.data?.healthObservations,
  );
  const healthRecords = useSelector(
    state => state.health?.data?.data?.data?.healthRecords,
  );
  const userId = useSelector(state => state.auth?.userId);
  console.log('userId in Health screen:', userId);
  const profile = useSelector(state => state.health?.data?.data?.data?.profile);
  const loading = useSelector(state => state.health?.loading);

  const onDateChange = async (event, selectedDate) => {
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
    console.log(userId, payload, '========');

    // Dispatch with both userId (in URL) and payload (in body)
    const res = await dispatch(updateLastConsulted({ userId, payload }));
    console.log(res, 'res===');
    if (res.payload.success) {
    }
  };

  useEffect(() => {
    if (userId) {
      dispatch(getHealthRecord(userId));
    }
  }, [lastConsulted]);

  useEffect(() => {
    setMedications(profile?.medications.join(', '));
    // setPastHistory(profile?.pastHO ? profile?.pastHO.join(', ') : '');
  }, [profile]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1E64AC" />
      </View>
    );
  }
  const getHealthObservationsData = observations => {
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
          ? `${observations.HsCRP.value} mg/L`
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
  };

  const onRefresh = () => {
    dispatch(getHealthRecord(userId));
  };
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={{ backgroundColor: '#FFFFFF', flex: 1 }}
      >
        {/* Header */}

        <View style={{ flex: 1 }}>
          <View style={{ elevation: 1, backgroundColor: '#FFFFFF' }}>
            <View
              style={{
                flexDirection: 'row',
                // marginTop: Platform.OS == 'ios' && hp(4),
                justifyContent: 'space-between',
                padding: hp(1),

                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                onPress={() => navigation.goBack()}
                style={{}}
              >
                <Image
                  source={Images.BACK_BUTTON} // Replace with actual key in your `images` object
                  style={{
                    resizeMode: 'contain',
                    height: hp(2.5),
                    width: hp(4),
                    // marginLeft: hp(-1.8),
                  }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <View>
                <Text
                  style={{
                    fontFamily: 'Roboto-Regular',
                    fontSize: 20,
                    fontWeight: '400',
                    color: '#1F2937',
                    // marginTop: hp(3),
                    // marginLeft: hp(1),
                  }}
                >
                  Cuore Health
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={Images.SHARE_4} // Replace with actual key in your `images` object
                  style={{
                    resizeMode: 'contain',
                    height: hp(2),
                    width: hp(3),
                    tintColor: 'black',
                    // marginLeft: hp(-1.8),
                  }}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>

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
                    {profile?.age} years{' '}
                    {profile?.smoker === 'Quit >6 months ago'
                      ? 'Past Smoker'
                      : 'Smoker'}
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
                  onPress={() => {
                    const STEP = 3;
                    navigation.navigate('OnBoarding', {
                      STEP,
                      screen: 'Reassess',
                      navigateTo: 'Home',
                    });
                  }}
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
                  <Text style={styles.detail}>
                    {Array.isArray(profile?.medications) &&
                    profile.medications.length > 0
                      ? profile.medications.join(', ')
                      : 'No medications listed'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()}>
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
                  onPress={() => {
                    const STEP = 7;
                    navigation.navigate('OnBoarding', {
                      STEP,
                      screen: 'Reassess',
                      navigateTo: 'Home',
                    });
                  }}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1E64AC',
                    paddingVertical: hp(1),
                    width: hp(12),
                    borderRadius: hp(1),
                  }}
                >
                  <Text
                    style={[
                      styles.progressTitle,
                      { color: '#FFFFFF', fontSize: 12.5 },
                    ]}
                  >
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
                  }}
                >
                  Status
                </Text>
              </View>
              <FlatList
                data={getHealthObservationsData(healthObservations)}
                keyExtractor={(item, index) => index.toString()}
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
                          right: hp(0.3),
                          // alignSelf: 'center',
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
                        ></View>
                      </View>
                    </View>
                  </View>
                )}
              ></FlatList>
            </View>

            <Text></Text>

            {/* Health Records */}
            <TouchableOpacity
              onPress={() => navigation.navigate('HealthRecords')}
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
                  ></Image>
                ) : (
                  <Image
                    source={Images.PRECRIPTION}
                    style={styles.recordImage}
                  />
                )}
              </View>

              <TouchableOpacity
                onPress={showImagePickerOptions}
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
                {/* <Feather name="camera" size={18} color="white" /> */}
                <Text style={styles.buttonText}> Add New Record*</Text>
              </TouchableOpacity>
              <Text style={styles.note}>
                * By uploading health records, you agree to our medical records
                policy and consent to OCR processing for better health insights.
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image
                    style={{
                      height: hp(1.5),
                      width: hp(2),
                      resizeMode: 'contain',
                      marginHorizontal: hp(1),
                    }}
                    source={Images.NOTICE}
                  ></Image>
                  <Text
                    style={{ width: wp(45), fontSize: 12, color: '#6B7280' }}
                  >
                    Accuracy depends on clarity and legibility of handwriting.
                  </Text>
                </View>
              </View>

              <Text style={styles.bold}>History: </Text>
              <Text
                style={{ fontSize: 14, fontWeight: '400', color: '#4B5563' }}
              >
                Cholecystectomy (Gallbladder removal)   Left thigh fracture
              </Text>

              <Text style={[styles.bold, { marginTop: hp(1) }]}>
                Medications:
              </Text>
              <Text
                style={{ fontSize: 14, fontWeight: '400', color: '#4B5563' }}
              >
                Diabetes on metformin   Hypertension (HTN) on Cardace
              </Text>

              <Text style={[styles.label, { marginTop: hp(1) }]}>
                <Text style={styles.bold}>Labs:</Text>
              </Text>
              <Text
                style={{ fontSize: 14, fontWeight: '400', color: '#4B5563' }}
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                style={{ fontSize: 14, fontWeight: '400', color: '#4B5563' }}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    padding: 10,
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
  progressTitle: {
    // marginLeft: hp(1),
    fontFamily: 'Roboto-Regular',
    fontWeight: '800',
    color: '#18202B',
    alignSelf: 'center',
    textAlign: 'center',
  },
});

export default Health;
