import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Images, hp, images, wp } from '../../utilities';
import ProgressBarWithImage from '../../components/ProgressBar';
import Modal from 'react-native-modal';
import Reminder from '../../components/Reminder';
import { useDispatch } from 'react-redux';
import EncryptedStorage from 'react-native-encrypted-storage';
import { updateProfile } from '../../redux/slices';
import { useSelector } from 'react-redux';
import { getHomeData } from '../../redux/slices';
import ReminderEditor from '../../components/ReminderEditor';

const routeMap = {
  Breakfast: 'Nutrition',
  'Refresh & Refuel': 'RefrestRefuel',
  'Wake Up': 'CalorieIgnite',
  Medication: 'MidMorningBoost',
};

const Today = ({ navigation, route }) => {
  // const userId = route.params?.userId || null;
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Feb 26');
  const [checked, setChecked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [time, setTime] = useState('');
  const [reminderText, setReminderText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const dispatch = useDispatch();

  const dates = ['Feb 25', 'Feb 26', 'Feb 87'];

  const { data, loading, error } = useSelector(state => state.home);
  const homeData = data ? data : null;

  const userId = useSelector(state => state?.auth?.userId);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(getHomeData(userId)); // or fetchReminders(userId)
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchStoredData = async () => {
      try {
        const tokensRaw = await EncryptedStorage.getItem('auth_tokens');
        const userRaw = await EncryptedStorage.getItem('userid');

        const tokens = tokensRaw ? JSON.parse(tokensRaw) : null;
        const userInfo = userRaw ? JSON.parse(userRaw) : null;

        console.log('🔐 Parsed Auth Tokens:', tokens);
        console.log('👤 Parsed User Info:', userInfo);

        // Optional: destructure if needed
        // const { access_token, refresh_token } = tokens || {};
        // const { user_id, request_id } = userInfo || {};
      } catch (error) {
        console.error('❌ Failed to parse encrypted storage:', error);
      }
    };

    fetchStoredData();
  }, []);
  useEffect(() => {
    if (userId) {
      console.log('Fetching home data for userId:', userId);
      dispatch(getHomeData(userId))
        .unwrap()
        .then(() => console.log('Home data fetched successfully'))
        .catch(err => console.error('Failed to fetch home data:', err));
    }
  }, [dispatch, userId]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.floatingText}>
        {/* <StatusBar hidden={true} /> */}
        {/* <Text style={styles.floatingTextLabel}>Floating Reminder</Text> */}
        <TouchableOpacity
          onPress={() => {
            setIsVisible(true);
            console.log(isVisible, 'isVisible');
          }}
        >
          <Image source={Images.PLUS} style={styles.addIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.username}>M. Johnson</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Health')}>
            <Image source={Images.DOCTOR_PROFILE} style={styles.userIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          {dates.map(date => (
            <TouchableOpacity key={date} onPress={() => setActiveTab(date)}>
              <Text
                style={
                  activeTab === date ? styles.activeTab : styles.inactiveTab
                }
              >
                {date}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            backgroundColor: '#FEF2F2',
          }}
        >
          <Image
            style={{
              height: hp(2),
              resizeMode: 'contain',
              tintColor: '#EF4444',
            }}
            source={Images.NOTICE}
          ></Image>
          <Text style={styles.alert}>2 tasks missed</Text>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressTitle}>Your Progress</Text>
          <TouchableOpacity
            onPress={() => {
              const STEP = 7;
              navigation.navigate('OnBoarding', { STEP, screen: 'Reassess' });
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

          {/* Add progress bar visuals */}
        </View>
        <ProgressBarWithImage
          data={homeData?.progress}
          navigation={navigation}
        ></ProgressBarWithImage>
        <View style={{ paddingHorizontal: hp(3) }}>
          <Text style={styles.quote}>
            {homeData?.motivationalMessage || '“Your health is your wealth.”'}
          </Text>
        </View>

        <View style={styles.warnings}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {homeData?.alerts?.map(item => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: hp(1),
                  padding: hp(2),
                  marginRight: hp(1),
                  backgroundColor: 'yellow',
                  position: 'relative', // ✅ Needed for absolute child positioning
                }}
              >
                <Image
                  style={{
                    resizeMode: 'contain',
                    height: hp(2),
                    width: wp(4),
                    tintColor: '#EAB308',
                    marginRight: hp(0.5),
                  }}
                  source={Images.WARNING}
                />

                <Text style={{ color: item.textStyle, marginRight: hp(2) }}>
                  {item?.text}
                </Text>

                <TouchableOpacity
                  // onPress={() => removeCard(item.id)}
                  style={{
                    position: 'absolute',
                    right: hp(1),
                    top: hp(1),
                    // padding: hp(1),
                  }}
                >
                  <Image
                    style={{
                      backgroundColor: '#F6F0F1',
                      height: hp(1.2),
                      width: hp(2),
                      resizeMode: 'contain',
                      borderRadius: hp(1),
                    }}
                    source={Images.CROSS}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
        <View style={{ backgroundColor: '#F9FAFB' }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Optimize Your Health with Smart Guidance
            </Text>
          </View>

          <FlatList
            data={homeData?.dailySchedule || []}
            keyExtractor={(item, index) => item?.title + index}
            renderItem={({ item }) => (
              <View style={styles.taskRow}>
                <View
                  style={{
                    width: hp(8),
                    borderRightWidth: 1,
                    height: hp(7),
                    // marginRight: 2,
                    marginTop: hp(0.5),
                    borderColor: '#E5E7EB',
                  }}
                >
                  <Text style={styles.time}>{item?.time}</Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: hp(3.5),
                      marginTop: hp(1),
                    }}
                  >
                    <Image
                      style={{
                        height: hp(2),
                        resizeMode: 'contain',
                        marginLeft: -hp(5),
                      }}
                      source={Images?.NOTIFICATION}
                    />

                    {item?.title === 'Wake Up' && (
                      <TouchableOpacity onPress={() => setShowModal(true)}>
                        <Image
                          style={{
                            height: hp(2),
                            resizeMode: 'contain',
                            marginLeft: -hp(4),
                          }}
                          source={Images.EDIT}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View
                  style={{
                    marginTop: hp(1),
                    marginHorizontal: hp(1.5),
                    borderWidth: 0.5,
                    height: hp(2),
                    width: hp(2),
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: hp(2),
                    borderColor: '#101010',
                  }}
                >
                  <View
                    style={{
                      borderWidth: 1,
                      height: hp(1.2),
                      width: hp(1.2),
                      borderRadius: hp(2),
                      backgroundColor: '#000000',
                    }}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.taskCard, { borderLeftColor: item.color }]}
                >
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskIcon}>{item?.icon}</Text>
                  </View>
                  <View
                    style={{ justifyContent: 'center', flexDirection: 'row' }}
                  >
                    <View style={{ justifyContent: 'center' }}>
                      <Text style={styles.taskTitle}>{item?.title}</Text>

                      <Text style={styles.taskDescription}>
                        {item.description}
                      </Text>
                    </View>
                    {item?.completed ? (
                      <Image source={Images.RIGHT} style={styles.checkIcon} />
                    ) : (
                      <Image source={Images.WARNING} style={styles.checkIcon} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginVertical: hp(2),
            }}
          >
            <TouchableOpacity
              onPress={() => setChecked(!checked)}
              style={{
                height: hp(3),
                width: wp(6),
                borderWidth: 1,
                borderRadius: hp(0.5),
                marginRight: hp(1),
                borderColor: '#9CA3AF',
                backgroundColor: checked ? '#1E64AC' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {checked && (
                <Text style={{ color: 'white', fontSize: 12 }}>✔</Text>
              )}
            </TouchableOpacity>

            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                color: '#4B5563',
                fontSize: 15,
                fontWeight: '400',
              }}
            >
              Check Off All Tasks
            </Text>
          </View>
        </View>

        <View
          style={{
            alignItems: 'center',
            marginVertical: hp(3),
            backgroundColor: 'white',
            paddingVertical: hp(2),
            marginHorizontal: hp(1),
            elevation: 1,
          }}
        >
          <Image source={Images.FIRE} />
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              color: '#1E64AC',
              fontSize: 15,
              fontWeight: '400',
            }}
          >
            14-Day Streak
          </Text>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              color: '#1E64AC',
              fontSize: 15,
              fontWeight: '400',
            }}
          >
            Maintain your progress,{' '}
          </Text>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              color: '#1E64AC',
              fontSize: 15,
              fontWeight: '400',
            }}
          >
            log today’s tasks by 12:30 AM
          </Text>
        </View>
        <Reminder
          user_id={homeData?.user?.id}
          setIsVisible={setIsVisible}
          isVisible={isVisible}
        ></Reminder>
        <ReminderEditor showModal={showModal} setShowModal={setShowModal} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    marginTop: Platform.OS == 'ios' && hp(5),
    fontFamily: 'Roboto-Regular',
    padding: hp(1.5),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: { fontFamily: 'Roboto-Regular', fontSize: 17, fontWeight: '400' },
  userIcon: { width: hp(3), height: hp(3.5), resizeMode: 'contain' },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  activeTab: { fontWeight: '500', fontSize: 16, color: '#1E64AC' },
  inactiveTab: { fontSize: 16, color: '#9CA3AF' },
  alert: {
    fontFamily: 'Roboto-Regular',
    color: 'red',
    fontWeight: '400',
    marginLeft: -hp(2), // textAlign: 'center',
    marginVertical: 8,
  },
  progressContainer: {
    padding: hp(1),
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: hp(1.3),
  },
  progressTitle: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    color: '#18202B',
    alignSelf: 'center',
    textAlign: 'center',
  },
  quote: {
    // fontStyle: fontFamily: 'Roboto-Regular', 'italic',
    backgroundColor: '#F9ECF7',
    color: '#1E64AC',
    fontSize: 15,
    padding: hp(1.8),
    borderLeftWidth: 3,
    borderRadius: 8,
    marginVertical: hp(1.5),
    borderColor: '#7D767C',
  },
  warnings: {
    marginVertical: 10,
    marginHorizontal: hp(2),
    backgroundColor: '#FFFFFF',
    padding: hp(0.5),
  },
  consult: {
    fontFamily: 'Roboto-Regular',
    marginLeft: -hp(3),
    // backgroundColor: '#FEEAEA',
    padding: 8,
    fontSize: 15,
    // borderRadius: 6,
    color: '#B91C1C',
  },
  reassess: {
    fontFamily: 'Roboto-Regular',
    marginLeft: -hp(3),
    // backgroundColor: '#fff3cd',
    padding: 8,
    // borderRadius: 6,
    fontSize: 15,
    color: '#A16207',
    // marginTop: 6,
  },
  sectionHeader: {
    paddingHorizontal: hp(2),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '450',
    fontSize: 16,
    color: '#1E64AC',
  },
  addIcon: { width: hp(4), height: hp(4), resizeMode: 'contain' },
  taskRow: {
    // backgroundColor: 'red',
    // marginBottom: hp(2),
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: hp(2),
    paddingHorizontal: hp(2),
  },

  time: {
    fontFamily: 'Roboto-Regular',
    width: 60,
    fontWeight: '400',
    color: '#6B7280',
  },
  taskCard: {
    elevation: 1,
    flex: 1,
    height: hp(7.5),
    borderLeftWidth: 2,
    paddingLeft: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
  },
  taskHeader: { flexDirection: 'row', alignItems: 'center' },
  taskIcon: {
    width: hp(3),
    height: hp(2),
    marginRight: 8,
    resizeMode: 'contain',
    marginTop: 10,
  },
  taskTitle: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    fontSize: 15,
    color: '#9CA3AF',
  },
  taskDescription: {
    marginTop: 4,
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Roboto-Regular',
    width: wp(43),
    // backgroundColor: 'red',
  },
  checkIcon: {
    resizeMode: 'contain',
    width: hp(2),
    height: hp(3),
    marginTop: 10,
    // position: 'absolute',
    // right: 10,
    // bottom: hp(3),
  },
  floatingText: {
    position: 'absolute',
    top: hp(58), // adjust as needed
    left: wp(85),
    right: wp(5),
    zIndex: 999, // ensure it's above everything else
    // backgroundColor: 'red',
    padding: hp(1),
    borderRadius: 8,
    // shadowColor: '#000',
    // shadowOpacity: 0.1,
    // shadowOffset: {width: 0, height: 2},
    // shadowRadius: 4,
    // elevation: 5,
  },
  floatingTextLabel: {
    fontSize: 14,
    color: '#1E64AC',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Today;
