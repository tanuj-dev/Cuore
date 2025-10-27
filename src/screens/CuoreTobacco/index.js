import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import React, { useState } from 'react';
import { hp, wp, color, Images } from '../../utilities';
import Header from '../../components/Header';
import ToastMessage from '../../components/Toast';
import { useSelector, useDispatch } from 'react-redux';
import {
  getTobacco,
  updateTobaccoProfile,
  logTobaccoUsage,
} from '../../redux/slices';

const Tobacco = ({ navigation }) => {
  const [yesterdayCount, setYesterdayCount] = useState(0);
  const [cigarettesPerDay, setCigarettesPerDay] = useState(0);
  const [yearsOfSmoking, setYearsOfSmoking] = useState(0);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const data = useSelector(state => state.tobacco.data?.data);
  const dailyChalanges = useSelector(
    state => state.tobacco.data?.data.allChallenges,
  );
  const userId = useSelector(state => state.auth.userId);
  const profileData = data?.profile;
  const stats = data?.stats;
  console.log('Tobacco Profile Data from Redux:', profileData);

  const dispatch = useDispatch();
  const handleSubmit = async () => {
    setLoading(true);
    const payload = {
      cigarettesPerDay: cigarettesPerDay,
      yearsOfSmoking: yearsOfSmoking,
    };
    const res = await dispatch(
      updateTobaccoProfile({ userId, payload }),
    ).unwrap();
    if (res.status === 'success') {
      setCigarettesPerDay('');
      setYearsOfSmoking('');
      setToast('Profile updated successfully');
      dispatch(getTobacco(userId));
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  const handleLogUsage = async () => {
    setLoading(true);
    const count = yesterdayCount;
    const res = await dispatch(logTobaccoUsage({ userId, count })).unwrap();
    if (res.status === 'success') {
      setToast('Tobacco usage logged successfully');
      dispatch(getTobacco(userId));
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (userId) {
      dispatch(getTobacco(userId));
    }
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, [dispatch, userId]);

  // const nudge = dailyChalanges?.find(challenge => challenge.isCurrent)?.nudge;

  return (
    <>
      <View style={{ backgroundColor: 'white', flex: 1 }}>
        <Header title={'Cuore Tobacco'} navigation={navigation}></Header>

        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.box}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                style={{ resizeMode: 'contain', width: wp(5), height: hp(3) }}
                source={Images.WATCH}
              ></Image>
              <Text style={styles.daysText}>
                {profileData?.tobaccoFreeDays} days tobacco-free
              </Text>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.label}>
                Enter number of tobacco products or cigarettes used yesterday
              </Text>
              <TextInput
                style={styles.inputSmall}
                keyboardType="numeric"
                value={yesterdayCount}
                onChangeText={setYesterdayCount}
              />
            </View>
            <TouchableOpacity
              style={{
                alignSelf: 'flex-end',
                padding: hp(1),
                backgroundColor: '#1E64AC',
                borderRadius: wp(2),
                position: 'absolute',
                top: hp(17.5),
                right: wp(4),
                // marginTop: hp(6),
              }}
              onPress={handleLogUsage}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#1E64AC" />
              ) : (
                <Text style={[styles.reassessText, { color: 'white' }]}>
                  Submit
                </Text>
              )}
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.levelText}>
                Level {profileData?.currentLevel}
              </Text>
              <Image
                style={{ resizeMode: 'contain', width: wp(9), height: hp(3.5) }}
                source={Images.TROPHY}
              ></Image>
            </View>
          </View>

          <View style={styles.quoteBox}>
            <Text style={styles.quote}>{data?.encouragement}</Text>
          </View>

          <View
            style={[styles.box, { backgroundColor: '#F5F5F5', elevation: 1 }]}
          >
            <Text
              style={[
                styles.sectionTitle,
                {
                  fontFamily: 'Roboto-Regular',
                  fontSize: 20,
                  fontWeight: '400',
                  color: '#1E64AC',
                },
              ]}
            >
              Next Level Challenge
            </Text>
            <Text
              style={[
                styles.subText,
                {
                  fontFamily: 'Roboto-Regular',
                  fontSize: 18,
                  fontWeight: '400',
                  color: '#000000',
                  paddingVertical: hp(1),
                },
              ]}
            >
              {dailyChalanges
                ? dailyChalanges[data?.currentLevel]?.challengeText
                : null}
            </Text>
            <Text
              style={[
                styles.detailText,
                {
                  fontFamily: 'Roboto-Regular',
                  fontSize: 16,
                  fontWeight: '400',
                  color: '#000000',
                },
              ]}
            >
              {dailyChalanges
                ? dailyChalanges[data?.currentLevel]?.challengeText2
                : null}
            </Text>
          </View>

          <View style={styles.profileBox}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  fontFamily: 'Roboto-Regular',
                  fontSize: 18,
                  fontWeight: '400',
                  color: '#000000',
                },
              ]}
            >
              Your Smoking Profile
            </Text>

            <Text
              style={[
                styles.inputLabel,
                {
                  fontFamily: 'Roboto-Regular',
                  marginBottom: hp(1),
                  fontSize: 14,
                  fontWeight: '400',
                  color: '#374151',
                },
              ]}
            >
              Cigarettes per day
            </Text>
            <TextInput
              placeholderTextColor={'#6B7280'}
              placeholder="Enter the count"
              style={styles.input}
              keyboardType="numeric"
              value={cigarettesPerDay}
              onChangeText={setCigarettesPerDay}
            />

            <Text
              style={[
                styles.inputLabel,
                { marginVertical: hp(2), color: '#374151' },
              ]}
            >
              Years of smoking
            </Text>
            <TextInput
              placeholder="Num of years"
              placeholderTextColor={'#6B7280'}
              style={styles.input}
              keyboardType="numeric"
              value={yearsOfSmoking}
              onChangeText={setYearsOfSmoking}
            />

            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.reassessButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.reassessText}>Submit</Text>
              )}
            </TouchableOpacity>

            {toast && (
              <ToastMessage
                message={toast}
                type="success"
                onHide={() => setToast(null)}
                top={50}
              />
            )}
          </View>

          <View style={styles.gridContainer}>
            <View style={styles.gridBox}>
              <Image
                style={{
                  resizeMode: 'contain',
                  width: wp(5),
                  height: hp(4),
                  alignSelf: 'flex-start',
                }}
                source={Images.SOIL_WATCH}
              ></Image>
              <Text style={styles.gridLabel}>Years Lost</Text>
              <Text style={styles.gridValueRed}>{stats?.yearsLost}</Text>
            </View>

            <View style={styles.gridBox}>
              <Image
                style={{
                  resizeMode: 'contain',
                  width: wp(5),
                  height: hp(4),
                  alignSelf: 'flex-start',
                }}
                source={Images.COIN}
              ></Image>
              <Text style={styles.gridLabel}>Money Spent</Text>
              <Text style={styles.gridValue}>{stats?.moneySpent}</Text>
            </View>
          </View>

          <Text
            style={[
              styles.sectionTitle,
              {
                fontFamily: 'Roboto-Regular',
                fontSize: 18,
                fontWeight: '500',
                color: '#1E64AC',
              },
            ]}
          >
            Benefits of Quitting Now
          </Text>

          <View style={styles.gridContainer}>
            <View style={styles.gridBox}>
              <Image
                style={{
                  resizeMode: 'contain',
                  width: wp(5),
                  height: hp(4),
                  alignSelf: 'flex-start',
                }}
                source={Images.HEART}
              ></Image>
              <Text style={styles.gridLabel}>Years Saved</Text>
              <Text style={styles.gridValue}>{stats?.yearsSaved}</Text>
            </View>

            <View style={styles.gridBox}>
              <Image
                style={{
                  resizeMode: 'contain',
                  width: wp(5),
                  height: hp(4),
                  alignSelf: 'flex-start',
                }}
                source={Images.PIGIBACK}
              ></Image>
              <Text style={styles.gridLabel}>Money Saved</Text>
              <Text style={styles.gridValue}>{stats?.moneySaved}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: wp(4),
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontFamily: 'Roboto-Regular',
    marginTop: hp(1),
    marginLeft: hp(12),
    fontSize: 20,
    fontWeight: '400',
    marginBottom: hp(2),
    alignSelf: 'center',
    color: '#000000',
  },
  box: {
    backgroundColor: '#F5F5F5',
    padding: wp(4),
    borderRadius: wp(2),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  daysText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    marginLeft: hp(1),
    fontWeight: '400',
    // marginBottom: hp(1.5),
    color: '#000000',
  },
  inputRow: {
    // backgroundColor:'red'
    paddingVertical: hp(4),
    // width: wp(80),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
    flexWrap: 'wrap',
  },
  label: {
    fontFamily: 'Roboto-Regular',
    flex: 1,
    fontWeight: '400',
    fontSize: 15,
    color: '#374151',
    marginRight: wp(3),
  },
  inputSmall: {
    backgroundColor: '#F3DCDC',
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    width: wp(17),
    textAlign: 'center',
    fontWeight: '600',
    color: '#000',
  },
  levelText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#000000',
    fontWeight: '400',
  },
  quoteBox: {
    borderLeftWidth: 3,
    borderColor: '#7D7D7E',
    backgroundColor: '#F3E7F3',
    padding: wp(4),
    borderRadius: wp(2),
    marginBottom: hp(2),
  },
  quote: {
    fontFamily: 'Roboto-Regular',
    fontSize: 15,
    color: '#374151',
    fontWeight: '400',
  },
  sectionTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(2),
    fontWeight: '600',
    color: '#1D4ED8',
    marginBottom: hp(1),
  },
  subText: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(1.7),
    fontWeight: '500',
    color: '#111827',
    marginBottom: hp(0.5),
  },
  detailText: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(1.6),
    color: '#4B5563',
  },
  profileBox: {
    backgroundColor: '#D5DADF',
    padding: wp(4),
    borderRadius: wp(2),
    marginBottom: hp(2),
  },
  inputLabel: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(1.6),
    color: '#111827',
    marginTop: hp(1.2),
    marginBottom: hp(0.5),
  },
  input: {
    fontFamily: 'Roboto-Regular',
    backgroundColor: '#fff',
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.2),
    color: '#000000',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  gridBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: wp(4),
    borderRadius: wp(2),
    marginRight: wp(2),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gridIcon: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(2.5),
    marginBottom: hp(0.5),
  },
  gridLabel: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#374151',
    paddingVertical: hp(1),
    fontWeight: 400,
  },
  gridValue: {
    fontFamily: 'Roboto-Regular',
    fontSize: 20,
    fontWeight: '400',
    color: '#000000',
  },
  gridValueRed: {
    fontFamily: 'Roboto-Regular',
    fontSize: 20,
    fontWeight: '400',
    color: '#DC2626',
  },
  reassessButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E64AC',
    // padding: hp(1.2),
    borderRadius: wp(2),
    marginVertical: hp(2),
    width: '100%',
    paddingVertical: hp(1.2),
  },
  reassessText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    // marginLeft: wp(1),
  },
});

export default Tobacco;
