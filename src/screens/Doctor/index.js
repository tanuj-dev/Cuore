import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
  Touchable,
  Alert,
} from 'react-native';
import { Images, hp, wp } from '../../utilities';
import { useDispatch, useSelector } from 'react-redux';
import { getDoctors, searchDoctors } from '../../redux/Profile/profileThunk';
const Doctor = ({ navigation }) => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector(state => state.doctors);
  const doctor = data?.data?.data || [];
  useEffect(() => {
    dispatch(getDoctors());
  }, [dispatch]);

  const [doctors, setDoctors] = useState(doctor);
  const [search, setSearch] = useState('');
  const toggleSelection = id => {
    setDoctors(prev => prev.map(doc => ({ ...doc, selected: doc._id === id })));
  };

  const renderDoctorCard = ({ item }) => (
    <View
      style={{
        flexDirection: 'row',
        flex: 1,

        alignItems: 'center',
        // justifyContent: 'center',
        width: '100%',
      }}
    >
      {item.selected ? (
        <TouchableOpacity onPress={() => toggleSelection(item._id)}>
          <Image source={Images.RIGHT} style={styles.checkbox} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => toggleSelection(item._id)}>
          <View
            style={{
              marginRight: hp(1),
              height: hp(2),
              width: wp(4),
              borderWidth: 1,
              borderColor: '#D1D5DB',
            }}
          ></View>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.card}
        onPress={() => toggleSelection(item.id)}
      >
        <View style={styles.row}>
          <View style={styles.details}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.address}>
              {'Sector: ' +
                item.address?.areaSector +
                '\n' +
                item.address?.city +
                '\n' +
                item.address?.clinicAddress}
            </Text>
          </View>
          <Text style={styles.patientCount}>{item.linkedPatients}</Text>
        </View>
        <View
          style={{
            marginTop: hp(2),
            marginHorizontal: hp(2),
            padding: hp(2),
            borderRadius: hp(1),
            backgroundColor: '#F9FAFB',
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{ color: '#374151', fontSize: 14, fontWeight: 'bold' }}
            >
              Fees:
            </Text>
            <View>
              {String(item.fees || '')
                .split('   ')
                .map((part, index) => (
                  <Text
                    key={index}
                    style={{
                      color: '#6B7280',
                      fontSize: 12,
                      marginTop: hp(0.2), // spacing between each fee line
                      // marginLeft: hp(12), // indent for neat alignment
                    }}
                  >
                    {part.trim()}
                  </Text>
                ))}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView>
      <View style={{ flex: 1, backgroundColor: '' }}>
        <View style={{ elevation: 1, backgroundColor: '#FFFFFF' }}>
          <View
            style={{
              flexDirection: 'row',

              marginTop: Platform.OS == 'ios' && hp(5),

              alignItems: 'center',

              padding: hp(2),
              flexDirection: 'row',
            }}
          >
            <TouchableOpacity
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              onPress={() => navigation.goBack()}
            >
              <Image
                source={Images.BACK_BUTTON}
                style={{
                  height: hp(3),
                  width: wp(4),
                  resizeMode: 'contain',
                  tintColor: '#000000',
                }}
              />
            </TouchableOpacity>

            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontFamily: 'Roboto-Regular',
                fontSize: 20,
                fontWeight: '400',
                color: '#000000',
                marginLeft: hp(7),
              }}
            >
              Cuore-Partnered Doctors
            </Text>
          </View>
        </View>

        <View style={styles.container}>
          <View
            style={{
              margin: hp(2),
              backgroundColor: '#FFFFFF',
              padding: hp(2),
              borderRadius: hp(1),
              borderColor: '#D1D5DB',
              borderWidth: 0.5,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 0,
              },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 0, // Android-specific
            }}
          >
            <Text style={{ alignSelf: 'center', marginBottom: hp(2) }}>
              <Text
                style={{
                  color: 'black',
                  color: '#970505',
                  fontSize: 14,
                  fontStyle: 'italic',
                  alignSelf: 'center',
                  textAlign: 'center',
                }}
              >
                Note:
              </Text>
              <Text
                style={{
                  textAlign: 'center',
                  alignSelf: 'center',
                  color: 'black',
                  color: '#374151',
                  fontSize: 14,
                  fontStyle: 'italic',
                }}
              >
                Cuore doesn’t collect supervision fees — You need to pay your
                doctor directly for remote supervision
              </Text>
            </Text>
            <View style={styles.searchBox}>
              <Image style={styles.searchIcon} source={Images.SEARCH} />
              <TextInput
                //   value={'tanuj'}
                value={search}
                onChangeText={setSearch}
                placeholderTextColor={'#6B7280'}
                placeholder="Search your doctor..."
                style={styles.searchInput}
                onSubmitEditing={async () => {
                  if (search.trim() !== '') {
                    const data = await dispatch(searchDoctors(search)).unwrap();
                    console.log(data);
                    if (data?.success) {
                      setDoctors(data?.data?.data || []);
                    } else {
                      Alert.alert(data?.message);
                    }
                  }
                }}
              />
            </View>

            <View style={styles.tabs}>
              <Text style={styles.inactiveTab}>Linked Patients</Text>
            </View>
            <FlatList
              data={doctors}
              renderItem={renderDoctorCard}
              keyExtractor={item => item.id}
            />
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Confirm Checkout',
                  "Your request has been sent. Someone from the doctor's office will get in touch with you.",
                  [
                    {
                      text: 'ok',
                      style: 'cancel',
                      onPress: () =>
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Home' }],
                        }),
                    },
                  ],
                  { cancelable: true },
                );
              }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Request Supervision</Text>
            </TouchableOpacity>
            {/* <Text
              style={{
                fontSize: 14,
                fontWeight: '400',
                fontFamily: 'Roboto-Regular',
                textAlign: 'center',
                color: '#374151',
                marginTop: hp(3),
              }}
            >
              Your request has been sent. Someone from the doctor's office will
              get in touch with you.
            </Text> */}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#F3F4F6', flex: 1 },
  heading: {
    fontFamily: 'Roboto-Regular',
    fontSize: wp(5),
    fontWeight: 'bold',
    marginBottom: hp(1),
  },
  searchBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: wp(2),
    padding: wp(2),
    marginBottom: hp(2),
    fontFamily: 'Roboto-Regular',
  },
  subText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    color: '#374151',
    marginBottom: hp(1),
    fontFamily: 'Roboto-Regular',
  },
  note: {
    fontFamily: 'Roboto-Regular',
    fontStyle: 'italic',
    color: '#1E64AC',
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
  },
  tabs: {
    marginTop: hp(1),
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: hp(0),
  },
  activeTab: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    fontSize: 16,
    color: '#1E64AC',
    fontFamily: 'Roboto-Regular',
  },
  inactiveTab: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    fontSize: 16,
    color: '#4B5563',
    fontFamily: 'Roboto-Regular',
  },
  card: {
    marginVertical: hp(1.5),
    // width: wp(30),
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp(3),
    padding: wp(3),
    marginBottom: hp(1),
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: wp(4),
    height: wp(5),
    marginRight: wp(2),
    resizeMode: 'contain',
  },
  details: { flex: 1 },
  name: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '700',
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Roboto-Regular',
  },
  address: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Roboto-Regular',
  },
  patientCount: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Roboto-Regular',
  },
  button: {
    backgroundColor: '#1E64AC',
    paddingVertical: hp(1),
    borderRadius: wp(2),
    width: hp(16),
    alignSelf: 'center',
    marginTop: hp(4),
    alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: hp(0.5),
    paddingHorizontal: hp(2),
    borderRadius: hp(0.9),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: hp(1),
    marginBottom: hp(1),
  },
  searchIcon: {
    height: hp(2),
    width: wp(4),
    marginRight: hp(1),
    resizeMode: 'contain',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Roboto-Regular',
  },
  buttonText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Roboto-Regular',
    // lineHeight:20
  },
});

export default Doctor;
