import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Images, hp, wp } from '../../utilities';
import ProgressBarWithImage from '../../components/ProgressBar';
import Reminder from '../../components/Reminder';
import { useDispatch, useSelector } from 'react-redux';
import EncryptedStorage from 'react-native-encrypted-storage';
import { getHomeData } from '../../redux/slices';
import ReminderEditor from '../../components/ReminderEditor';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from '../../components/Toast';
import moment from 'moment';
import { getOnboardingThunk } from '../../redux/slices';
import { logout } from '../../redux/Auth/slice';
import {
  scheduleNotificationAfterSeconds,
  scheduleNotificationAtTime,
  cancelNotification,
  showImmediateNotification,
} from '../../notifications/NotificationScheduler';
import { getNourish, getBuilderItems } from '../../redux/slices';
import SessionExpiredModal from '../../components/SessionExpired';
import handleLoginRedirect from '../../utilities/Common';
import {
  getFitness,
  getKnowledge,
  getMind,
  getTobacco,
  getPredict,
  getCuoreScoreThunk,
} from '../../redux/slices';
import ApiErrorFallback from '../../components/ApiError';
import { black } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';

const routeMap = {
  Breakfast: 'Nutrition',
  'Refresh & Refuel': 'RefrestRefuel',
  'Wake Up': 'CalorieIgnite',
  Medication: 'MidMorningBoost',
};

const Today = ({ navigation, route }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Feb 26');
  const [checked, setChecked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [alarmTime, setAlarmTime] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(true);
  const [toast, setToast] = useState(null);

  const dispatch = useDispatch();
  const dates = ['Feb 25', 'Feb 26', 'Feb 87'];

  const { data, loading, error } = useSelector(state => state.home);
  const homeData = data ? data : null;
  const userId = useSelector(state => state.auth.userId);
  const sessionExpiredMessage =
    data?.message == 'Not authorized, invalid or expired token.';

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(getHomeData(userId));
      await dispatch(getMind(userId));
      await dispatch(getTobacco(userId));

      const combos = [
        { mealTime: 'Breakfast', cuisine: 'Indian' },
        { mealTime: 'Breakfast', cuisine: 'Global' },
        { mealTime: 'Lunch', cuisine: 'Indian' },
        { mealTime: 'Lunch', cuisine: 'Global' },
      ];
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
      } catch (error) {
        console.error('❌ Failed to parse encrypted storage:', error);
      }
    };

    fetchStoredData();
  }, []);

  useEffect(() => {
    if (userId) {
      dispatch(getHomeData(userId));
      dispatch(getPredict(userId));
      dispatch(getKnowledge(userId));
      dispatch(getMind(userId));
      dispatch(getTobacco(userId));
      dispatch(getCuoreScoreThunk(userId));
      const res = dispatch(getFitness());
      console.log('Fitness Data Response:', res);
      const combos = [
        { mealTime: 'Breakfast', cuisine: 'Indian' },
        { mealTime: 'Breakfast', cuisine: 'Global' },
        { mealTime: 'Lunch', cuisine: 'Indian' },
        { mealTime: 'Lunch', cuisine: 'Global' },
      ];

      combos.forEach(combo => {
        dispatch(getBuilderItems(combo));
      });
      // dispatch(getNourish('Breakfast'));
    }
  }, [dispatch, userId]);

  const handleTest = async () => {
    await scheduleNotificationAfterSeconds(
      'todayTest',
      '🔥 Today Reminder',
      'This notification appears in 5 seconds!',
      5,
    );
  };

  useEffect(() => {
    dispatch(getOnboardingThunk());
  }, []);

  const handleScheduleAtTime = async (time, title, body) => {
    // Parse the time string (e.g., "8:00 AM") to get hours and minutes
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    console.log(`Parsed time - Hours: ${hours}, Minutes: ${minutes}`);

    // Create a Date object for today at the specified time
    const now = new Date();
    const scheduledTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
      0,
    );

    // If the scheduled time has already passed today, set it for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    console.log(
      `Scheduling "${title}" at ${scheduledTime.toLocaleTimeString()}`,
    );

    await scheduleNotificationAtTime(
      `reminder-${time.replace(/[: ]/g, '-')}`, // Unique ID
      title,
      body,
      hours,
      minutes,
    );
    setToast(`Alarm set for ${moment(scheduledTime).format('hh:mm A')}`);
    setAlarmTime(true);
  };
  const handleCancel = async id => {
    await cancelNotification(id);
    setToast('Alarm cancelled');
    setAlarmTime(false);
  };

  // ✅ Show loader if fetching data
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F9FAFB',
        }}
      >
        <ActivityIndicator size="large" color="#1E64AC" />
        <Text style={{ marginTop: 10, color: '#1E64AC', fontSize: 16 }}>
          Loading your data...
        </Text>
      </View>
    );
  }

  const handleLoginRedirect = async () => {
    setSessionExpired(false);
    console.log(await EncryptedStorage.getItem('auth_tokens'));
    await EncryptedStorage.removeItem('auth_tokens');
    // await EncryptedStorage.removeItem('userid');
    dispatch(logout());
    navigation.replace('Login'); // or navigate, depending on your flow
  };

  if (sessionExpiredMessage && sessionExpired) {
    return (
      <SessionExpiredModal
        visible={sessionExpired}
        onLogin={handleLoginRedirect}
      />
    );
  }
  //  else if (!data) {
  //   return (
  //     <ApiErrorFallback
  //       message="No data available at the moment."
  //       onRetry={as() => {
  //         if (userId) {
  //           dispatch(getHomeData(userId));
  //         }
  //       }}
  //     />
  //   );
  // }

  const titleToRouteMap = {
    'Wake Up': 'Mind',
    Breakfast: 'Nutrition',
    Fitness: 'Fitness',
    Lunch: 'Nutrition',
    'Short Nap or Walk': 'Fitness',
    Dinner: 'Nutrition',
    Sleep: 'Mind',
    'Check Fasting Sugar': 'OnBoarding',
    'Refresh & Refuel': 'RefreshRefuel',
    'Mid-Morning Boost': 'MidMorningBoost',
    'Check BP': 'OnBoarding',
    'Quiet Mind Restful Night': 'Mind',
    'Calorie Ignite': 'CalorieIgnite',
    'After-Dinner Walk': 'Fitness',
  };
  const titlesWithPayload = [
    'Fitness',
    'Breakfast',
    'Dinner',
    'Check Fasting Sugar',
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <View style={styles.floatingText}>
        <TouchableOpacity onPress={() => setIsVisible(true)}>
          <Image source={Images.PLUS} style={styles.addIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView
        nestedScrollEnabled
        refreshControl={
          <RefreshControl
            title="Pull to refresh..."
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.username}>Tanuj Prajapati</Text>
          <TouchableOpacity
            style={
              {
                // shadowColor: '#000',
                // shadowOpacity: 0.1,
                // shadowOffset: { width: 0, height: 2 },
                // shadowRadius: 4,
                // elevation: 1,
              }
            }
            onPress={() => navigation.navigate('Health')}
          >
            <Image source={Images.DOCTOR_PROFILE} style={styles.userIcon} />
          </TouchableOpacity>
        </View>

        {/* Dates Tabs */}
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

        {/* Alerts */}
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
          />
          <Text style={styles.alert}>2 tasks missed</Text>
        </View>

        {/* Progress Section */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressTitle}>Your Progress</Text>
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

        <ProgressBarWithImage
          data={homeData?.progress}
          navigation={navigation}
        />

        <View style={{ paddingHorizontal: hp(3) }}>
          <Text style={styles.quote}>
            {homeData?.motivationalMessage || '“Your health is your wealth.”'}
          </Text>
        </View>

        {/* Alerts Horizontal Scroll */}
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
                  backgroundColor:
                    item?.type == 'red'
                      ? '#FEE4E4'
                      : item?.type == 'yellow'
                      ? '#FFFFC5'
                      : '#f4ba62ff',
                  position: 'relative',
                }}
              >
                <Image
                  style={{
                    resizeMode: 'contain',
                    height: hp(2),
                    width: wp(4),
                    tintColor:
                      item?.type == 'red'
                        ? '#'
                        : item?.type == 'yellow'
                        ? '#FFCE1B'
                        : '#A16207',
                    marginRight: hp(0.5),
                  }}
                  source={Images.WARNING}
                />
                <Text
                  style={{
                    color:
                      item?.type == 'red'
                        ? '#B91C1C'
                        : item?.type == 'yellow'
                        ? '#A16207'
                        : '#A16207',
                    marginRight: hp(2),
                  }}
                >
                  {item?.text}
                </Text>
                <TouchableOpacity
                  style={{ position: 'absolute', right: hp(1), top: hp(1) }}
                >
                  <Image
                    style={{
                      // backgroundColor: '#F6F0F1',
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

        {/* Daily Schedule */}
        <View style={{ backgroundColor: '#F9FAFB' }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Optimize Your Health with Smart Guidance
            </Text>
          </View>
          {toast && (
            <Toast
              message={toast}
              type="success"
              onHide={() => setToast(null)}
            />
          )}

          <FlatList
            data={homeData?.dailySchedule || []}
            keyExtractor={(item, index) => (item?.title || 'task') + index}
            renderItem={({ item, index }) => (
              <View key={item?.id || index} style={styles.taskRow}>
                <View
                  style={{
                    width: hp(9),
                    borderRightWidth: 1,
                    height: hp(7),
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
                    <TouchableOpacity
                      onPress={() => {
                        handleScheduleAtTime(
                          item?.time,
                          item?.title,
                          item?.description,
                        );
                        // console.log(
                        //   item,
                        //   'Scheduling notification for this item',
                        // );
                        // handleTest();
                      }}
                    >
                      <Image
                        style={{
                          height: hp(2),
                          resizeMode: 'contain',
                          marginLeft: -hp(6),
                        }}
                        source={Images?.NOTIFICATION}
                      />
                    </TouchableOpacity>

                    {item?.editable === true &&
                      ['wake up', 'fitness'].includes(
                        item.title?.toLowerCase(),
                      ) && (
                        <TouchableOpacity
                          onPress={() => {
                            setRequestId(item);
                            setShowModal(true);
                          }}
                        >
                          <Image
                            style={{
                              height: hp(2),
                              width: hp(2),
                              resizeMode: 'contain',
                            }}
                            source={Images.EDIT}
                          />
                        </TouchableOpacity>
                      )}
                  </View>
                </View>

                {/* check black dot */}
                <View style={styles.blackDot}>
                  <View style={styles.blackDotInner} />
                </View>

                <TouchableOpacity
                  onPress={() => {
                    const route = titleToRouteMap[item.title];
                    if (route) {
                      if (titlesWithPayload.includes(item.title)) {
                        navigation.navigate(route, {
                          STEP: 7,
                          screen: 'Reassess',
                          navigateTo: 'Home',
                        });
                      } else {
                        navigation.navigate(route);
                      }
                    }
                  }}
                  style={[styles.taskCard, { borderLeftColor: item?.color }]}
                >
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskIcon}>{item?.icon}</Text>
                  </View>
                  <View
                    style={{ justifyContent: 'center', flexDirection: 'row' }}
                  >
                    <View style={{ justifyContent: 'center' }}>
                      <Text style={styles.taskTitle}>
                        {item?.title?.length > 20
                          ? item.title.slice(0, 35) + '...'
                          : item.title}
                      </Text>
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

          {/* Check off all tasks */}
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
              style={[
                styles.checkAll,
                { backgroundColor: checked ? '#1E64AC' : 'transparent' },
              ]}
            >
              {checked && (
                <Text style={{ color: '#FFFFFF', fontSize: 12 }}>✔</Text>
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

        {/* Streak Section */}
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
          existingReminders={
            homeData?.dailySchedule?.filter(item => item?.editable == true) ||
            []
          }
          user_id={homeData?.user?.id}
          setIsVisible={setIsVisible}
          isVisible={isVisible}
        />
        <ReminderEditor
          requestId={requestId}
          showModal={showModal}
          setShowModal={setShowModal}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    marginTop: Platform.OS == 'ios' ? hp(5) : hp(2),
    fontFamily: 'Roboto-Regular',
    padding: hp(1.5),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    fontWeight: '800',
    color: '#4B5563',
  },
  userIcon: {
    // elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderRadius: hp(5),
    tintColor: '#1E64AC',
    width: hp(3),
    height: hp(3.5),
    resizeMode: 'contain',
  },
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
    // marginLeft: hp(1),
    fontFamily: 'Roboto-Regular',
    fontWeight: '800',
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
    width: 62,
    fontWeight: '400',
    color: '#6B7280',
  },
  taskCard: {
    elevation: 1,
    flex: 1,
    height: hp(7.5),
    borderLeftWidth: 2,
    // paddingLeft: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    // marginLeft: hp(2),
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
    width: wp(43),
  },
  taskDescription: {
    marginTop: 4,
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Roboto-Regular',
    width: wp(40),
    // backgroundColor: 'red',
  },
  checkIcon: {
    resizeMode: 'contain',
    width: hp(2),
    height: hp(3),
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
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
    // padding: hp(1),
    // borderRadius: 8,
    // shadowColor: '#000',
    // shadowOpacity: 0.1,
    // shadowOffset: { width: 0, height: 2 },
    // shadowRadius: 4,
    // elevation: 1,
  },
  floatingTextLabel: {
    fontSize: 14,
    color: '#1E64AC',
    fontWeight: '600',
    textAlign: 'center',
  },
  checkAll: {
    height: hp(3),
    width: wp(6),
    borderWidth: 1,
    borderRadius: hp(0.5),
    marginRight: hp(1),
    borderColor: '#9CA3AF',

    alignItems: 'center',
    justifyContent: 'center',
  },
  blackDot: {
    marginTop: hp(1),
    marginHorizontal: hp(1.5),
    borderWidth: 0.5,
    height: hp(2),
    width: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: hp(2),
    borderColor: '#101010',
  },
  blackDotInner: {
    borderWidth: 1,
    height: hp(1.2),
    width: hp(1.2),
    borderRadius: hp(2),
    backgroundColor: '#000000',
  },
});

export default Today;
