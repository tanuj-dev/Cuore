import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  StatusBar,
  Platform,
} from 'react-native';
import { Images, hp, wp } from '../../utilities';
import ProgressBarWithImage from '../../components/ProgressBar';
import Reminder from '../../components/Reminder';
import { useDispatch, useSelector } from 'react-redux';
import EncryptedStorage from 'react-native-encrypted-storage';
import { getHomeData, getProfile } from '../../redux/slices';
import ReminderEditor from '../../components/ReminderEditor';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from '../../components/Toast';
import moment from 'moment';
import { getOnboardingThunk } from '../../redux/slices';
import { logout } from '../../redux/Auth/slice';
import {
  scheduleNotificationAtTime,
  cancelNotification,
} from '../../notifications/NotificationScheduler';
import { getBuilderItems } from '../../redux/slices';
import SessionExpiredModal from '../../components/SessionExpired';
import {
  getFitness,
  getKnowledge,
  getMind,
  getTobacco,
  getPredict,
  getCuoreScoreThunk,
} from '../../redux/slices';
import { checkReminderThunk } from '../../redux/slices';
import { getNotification } from '../../redux/Home/notificationThunk';
import { useCustomAlert } from '../../hooks/useCustomAlert';

// Constants extracted outside component
const MEAL_COMBOS = [
  { mealTime: 'Breakfast', cuisine: 'Indian' },
  { mealTime: 'Breakfast', cuisine: 'Global' },
  { mealTime: 'Lunch', cuisine: 'Indian' },
  { mealTime: 'Lunch', cuisine: 'Global' },
];

const TITLE_TO_ROUTE_MAP = {
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
  Meditation: 'DefaultScreen',
  'Hydration Check': 'Fitness',
  'Optional Snack': 'Fitness',
};

const TITLES_WITH_PAYLOAD = [
  'Fitness',
  'Lunch',
  'Dinner',
  'Short Nap or Walk',
  'After-Dinner Walk',
  'Check Fasting Sugar',
];

const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const REASSESS_STEP = 7;

const Today = ({ navigation, route }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Feb 26');
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [, setAlarmTime] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(true);
  const [toast, setToast] = useState(null);
  const [reminderList, setReminderList] = useState([]);
  const [toastType, setToastType] = useState('success');
  const [loadingTaskId, setLoadingTaskId] = useState(null);

  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();

  const { data, loading } = useSelector(state => state.home);
  const userId = useSelector(state => state.auth.userId);
  const role = useSelector(state => state.auth.role);
  const profileData = useSelector(state => state.profile.data?.data?.user);

  // Memoize derived data
  const homeData = useMemo(() => data || null, [data]);

  const formattedDate = useMemo(
    () =>
      homeData?.date
        ? moment(homeData.date, 'YYYY-MM-DD').format('MMM DD YYYY')
        : '',
    [homeData?.date],
  );

  const dates = useMemo(() => [formattedDate], [formattedDate]);

  const isCaregiver = useMemo(() => role === 'caregiver', [role]);

  const sessionExpiredMessage = useMemo(
    () => data?.message === 'Not authorized, invalid or expired token.',
    [data?.message],
  );

  const editableReminders = useMemo(
    () =>
      homeData?.dailySchedule?.filter(item => item?.editable === true) || [],
    [homeData?.dailySchedule],
  );

  const onRefresh = useCallback(async () => {
    if (!userId) return;

    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(getProfile(userId)),
        dispatch(getHomeData(userId)),
        dispatch(getMind(userId)),
        dispatch(getTobacco(userId)),
      ]);
    } catch (err) {
      // Error handling without console.log in production
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (!userId) return;

    // Dispatch all data fetching in parallel
    dispatch(getHomeData(userId));
    dispatch(getProfile(userId));
    dispatch(getPredict(userId));
    dispatch(getKnowledge(userId));
    dispatch(getMind(userId));
    dispatch(getTobacco(userId));
    dispatch(getCuoreScoreThunk(userId));
    dispatch(getFitness());
    dispatch(getOnboardingThunk());

    // Dispatch meal builder items
    MEAL_COMBOS.forEach(combo => {
      dispatch(getBuilderItems(combo));
    });
  }, [dispatch, userId]);

  // Update reminder list when homeData changes
  useEffect(() => {
    if (homeData?.dailySchedule) {
      setReminderList(homeData.dailySchedule);
    }
  }, [homeData?.dailySchedule]);

  const handleScheduleAtTime = useCallback(async (time, title, body) => {
    // Parse the time string (e.g., "8:00 AM") to get hours and minutes
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

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

    await scheduleNotificationAtTime(
      `reminder-${time.replace(/[: ]/g, '-')}`, // Unique ID
      title,
      body,
      hours,
      minutes,
    );
    setToast(
      `we will notify you at ${moment(scheduledTime).format('hh:mm A')}`,
    );
    setToastType('success');
    setAlarmTime(true);
  }, []);

  const handleCancel = useCallback(async id => {
    await cancelNotification(id);
    setToast('Alarm cancelled');
    setToastType('error');
    setAlarmTime(false);
  }, []);

  const handleLoginRedirect = useCallback(async () => {
    setSessionExpired(false);
    await EncryptedStorage.removeItem('auth_tokens');
    dispatch(logout());
    const rootNavigation = navigation.getParent();
    if (rootNavigation) {
      rootNavigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } else {
      navigation.navigate('Login');
    }
  }, [dispatch, navigation]);

  const handleNavigationPress = useCallback(
    item => {
      const targetRoute = TITLE_TO_ROUTE_MAP[item.title];
      if (!targetRoute) {
        setIsVisible(prev => !prev);
        return;
      }

      const title = item.title?.toLowerCase();
      const hasPayload = TITLES_WITH_PAYLOAD.includes(item.title);

      if (hasPayload) {
        switch (title) {
          case 'check fasting sugar':
            navigation.navigate(targetRoute, {
              STEP: REASSESS_STEP,
              screen: 'Reassess',
              navigateTo: 'Home',
            });
            break;

          case 'fitness': {
            const fitnessDayKey = DAY_KEYS[new Date().getDay()];
            navigation.navigate(targetRoute, {
              initialTab: fitnessDayKey,
            });
            break;
          }

          case 'lunch':
          case 'dinner':
            navigation.navigate(targetRoute, { mealTime: 'LunchDinner' });
            break;

          default:
            if (
              title === 'short nap or walk' ||
              title === 'after-dinner walk'
            ) {
              const walkDayKey = DAY_KEYS[new Date().getDay()];
              navigation.navigate(targetRoute, {
                initialTab: walkDayKey,
              });
            }
            break;
        }
      } else {
        if (targetRoute && targetRoute !== 'Fitness') {
          navigation.navigate(targetRoute);
        }
      }
    },
    [navigation],
  );

  // ✅ Show loader if fetching data
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E64AC" />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </View>
    );
  }

  if (sessionExpiredMessage && sessionExpired) {
    return (
      <SessionExpiredModal
        visible={sessionExpired}
        onLogin={handleLoginRedirect}
      />
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
    >
      {AlertComponent}
      <StatusBar barStyle="dark-content" backgroundColor="#000" />
      {/* <View style={styles.floatingText}>
        <TouchableOpacity disabled={isCaregiver} onPress={() => setIsVisible(true)}>
          <Image source={Images.PLUS} style={styles.addIcon} />
        </TouchableOpacity>
      </View> */}

      <ScrollView
        nestedScrollEnabled
        refreshControl={
          <RefreshControl
            title="Pull to refresh..."
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        scrollEventThrottle={16} // 🟢 ensures frequent updates
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.username}>
            {profileData?.display_name
              ? `Hi, ${profileData.display_name.split(' ')[0]}`
              : 'User'}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <TouchableOpacity
              disabled={isCaregiver}
              onPress={() => setIsVisible(true)}
              style={[
                styles.updateButton,
                {
                  flexDirection: 'row',
                  marginHorizontal: wp(2),
                  paddingHorizontal: wp(1),
                  backgroundColor: '#f0f6ff',
                  // width: wp(35),
                },
              ]}
            >
              <Image
                source={Images.ADD}
                style={[styles.userIcon, { height: hp(1.5), width: hp(1.5) }]}
              />
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: 'Roboto-ExtraBold',
                  color: '#2951a8',
                  marginLeft: 4,
                  textAlign: 'center',
                }}
              >
                Add{'\n'}Reminder
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              // disabled={isCaregiver}
              style={[
                styles.updateButton,
                {
                  flexDirection: 'row',
                  marginHorizontal: wp(2),
                  paddingHorizontal: wp(1),
                  backgroundColor: '#f7edee',
                  // width: wp(35),
                },
              ]}
              onPress={() => navigation.navigate('Health')}
            >
              <Image
                source={Images.DOCTOR_PROFILE}
                style={[styles.userIcon, { tintColor: '#9e4043' }]}
              />
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: 'Roboto-ExtraBold',
                  color: '#9e4043',
                  textAlign: 'center',
                  marginLeft: 4,
                }}
              >
                Cuore{'\n'}Health
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dates Tabs */}
        <View style={styles.tabs}>
          {dates.map(date => (
            <TouchableOpacity
              key={date}
              disabled={isCaregiver}
              onPress={() => setActiveTab(date)}
            >
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
        {/* <View
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
        </View> */}

        {/* Progress Section */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressTitle}>Your Progress</Text>
          <TouchableOpacity
            disabled={isCaregiver}
            onPress={() => {
              navigation.navigate('OnBoarding', {
                STEP: REASSESS_STEP,
                screen: 'Reassess',
                navigateTo: 'Home',
              });
            }}
            style={[styles.updateButton, { backgroundColor: '#f1fcfb' }]}
          >
            <Text
              style={[
                styles.progressTitle,
                { color: '#376858', fontSize: 12.5 },
              ]}
            >
              Update{'\n'}Biomarkers
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
                    item?.type === 'red'
                      ? '#FEE4E4'
                      : item?.type === 'yellow'
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
                      item?.type === 'red'
                        ? '#EF4444'
                        : item?.type === 'yellow'
                        ? '#FFCE1B'
                        : '#A16207',
                    marginRight: hp(0.5),
                  }}
                  source={Images.WARNING}
                />
                <Text
                  style={{
                    color:
                      item?.type === 'red'
                        ? '#B91C1C'
                        : item?.type === 'yellow'
                        ? '#A16207'
                        : '#A16207',
                    marginRight: hp(2),
                  }}
                >
                  {item?.text}
                </Text>
                {/* <TouchableOpacity
                  disabled={isCaregiver}
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
                </TouchableOpacity> */}
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

          <FlatList
            data={reminderList}
            keyExtractor={(item, index) =>
              `${item?.id || item?.title || 'task'}-${index}`
            }
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={10}
            windowSize={10}
            getItemLayout={(_, index) => ({
              length: hp(8) + hp(2),
              offset: (hp(8) + hp(2)) * index,
              index,
            })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No items found.</Text>
              </View>
            }
            renderItem={({ item, index: itemIndex }) => {
              const handleNotificationToggle = () => {
                if (isCaregiver) return;

                const isCurrentlyOn = item?.alarm_notified;
                const notificationId = `reminder-${item?.time.replace(
                  /[: ]/g,
                  '-',
                )}`;

                // Optimistically update local state
                setReminderList(prev =>
                  prev.map(reminder =>
                    reminder.id === item.id
                      ? {
                          ...reminder,
                          alarm_notified: !reminder.alarm_notified,
                        }
                      : reminder,
                  ),
                );

                // Fire API/background work
                dispatch(
                  getNotification({
                    userId,
                    reminderId: item?.id,
                    time: item?.time,
                  }),
                );

                // If turning ON, schedule notification; if turning OFF, cancel it
                if (isCurrentlyOn) {
                  handleCancel(notificationId);
                } else {
                  handleScheduleAtTime(
                    item?.time,
                    item?.title,
                    item?.description,
                  );
                }
              };

              const handleEditPress = () => {
                if (isCaregiver) return;
                setRequestId(item);
                setShowModal(true);
              };

              const handleCompleteToggle = async () => {
                if (isCaregiver) return;

                // Set loading state for this specific task
                setLoadingTaskId(item.id);

                // Optimistically update local state
                setReminderList(prev =>
                  prev.map(reminder =>
                    reminder.id === item.id
                      ? { ...reminder, completed: !reminder.completed }
                      : reminder,
                  ),
                );

                // Dispatch backend update
                try {
                  await dispatch(
                    checkReminderThunk({
                      id: item.id,
                      userId,
                      body: { complete: !item.completed },
                    }),
                  ).unwrap();
                } catch (error) {
                  // Revert optimistic update on error
                  setReminderList(prev =>
                    prev.map(reminder =>
                      reminder.id === item.id
                        ? { ...reminder, completed: item.completed }
                        : reminder,
                    ),
                  );
                  console.error('Failed to update task:', error);
                } finally {
                  // Clear loading state
                  setLoadingTaskId(null);
                }
              };

              const isEditable =
                item?.editable === true &&
                ['wake up', 'fitness'].includes(item.title?.toLowerCase());

              return (
                <View key={item?.id || itemIndex} style={styles.taskRow}>
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
                        disabled={isCaregiver}
                        onPress={handleNotificationToggle}
                      >
                        <Image
                          style={[
                            styles.notificationIcon,
                            {
                              tintColor: item.alarm_notified
                                ? '#FFCE1B'
                                : '#6B7280',
                            },
                          ]}
                          source={Images.NOTIFICATION}
                        />
                      </TouchableOpacity>

                      {isEditable && (
                        <TouchableOpacity
                          disabled={isCaregiver}
                          onPress={handleEditPress}
                        >
                          <Image style={styles.editIcon} source={Images.EDIT} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* check black dot */}
                  <TouchableOpacity
                    disabled={
                      isCaregiver ||
                      loadingTaskId === item.id ||
                      loadingTaskId === 'all'
                    }
                    onPress={handleCompleteToggle}
                  >
                    <View style={styles.blackDot}>
                      {loadingTaskId === item.id || loadingTaskId === 'all' ? (
                        <ActivityIndicator size="small" color="#1E64AC" />
                      ) : (
                        item.completed && <View style={styles.blackDotInner} />
                      )}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleNavigationPress(item)}
                    style={[styles.taskCard, { borderLeftColor: item?.color }]}
                  >
                    <View style={styles.taskHeader}>
                      <Text style={styles.taskIcon}>{item?.icon}</Text>
                    </View>
                    <View
                      style={{
                        justifyContent: 'space-between',
                        flexDirection: 'row',
                        flex: 1,
                      }}
                    >
                      <View style={styles.taskContent}>
                        <Text style={styles.taskTitle} numberOfLines={1}>
                          {item?.title?.length > 35
                            ? `${item.title.slice(0, 35)}...`
                            : item.title}
                        </Text>
                        <Text style={styles.taskDescription} numberOfLines={2}>
                          {item.description}
                        </Text>
                      </View>
                      {item?.completed && (
                        <Image source={Images.RIGHT} style={styles.checkIcon} />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            }}
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
              disabled={isCaregiver || loadingTaskId === 'all'}
              style={[
                styles.checkAll,
                {
                  backgroundColor: reminderList.every(item => item.completed)
                    ? '#1E64AC'
                    : 'transparent',
                },
              ]}
              onPress={() => {
                const allCompleted = reminderList.every(item => item.completed);
                const actionText = allCompleted
                  ? 'Are you sure you want to uncheck all tasks?'
                  : 'Are you sure you want to check off all tasks?';

                alert('Confirm', actionText, [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'OK',
                    onPress: async () => {
                      // Set loading state for all tasks
                      setLoadingTaskId('all');

                      // Optimistically update all tasks
                      const newCompletedState = !allCompleted;
                      setReminderList(prev =>
                        prev.map(reminder => ({
                          ...reminder,
                          completed: newCompletedState,
                        })),
                      );

                      try {
                        await dispatch(
                          checkReminderThunk({
                            id: reminderList.id,
                            userId,
                            body: {
                              completeAll: true,
                              complete: newCompletedState,
                            },
                          }),
                        ).unwrap();
                      } catch (error) {
                        // Revert optimistic update on error
                        setReminderList(prev =>
                          prev.map(reminder => ({
                            ...reminder,
                            completed: allCompleted,
                          })),
                        );
                        console.error('Failed to update all tasks:', error);
                      } finally {
                        // Clear loading state
                        setLoadingTaskId(null);
                      }
                    },
                  },
                ]);
              }}
            >
              {loadingTaskId === 'all' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                reminderList.every(item => item.completed) && (
                  <Text style={{ color: '#FFFFFF', fontSize: 12 }}>✔</Text>
                )
              )}
            </TouchableOpacity>

            <Text
              style={{
                fontFamily: 'Roboto-Medium',
                color: '#4B5563',
                fontSize: 15,
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
              fontFamily: 'Roboto-SemiBold',
              color: '#1E64AC',
              fontSize: 15,
            }}
          >
            {homeData?.streak}-Day Streak
          </Text>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              color: '#1E64AC',
              fontSize: 15,
            }}
          >
            Maintain your progress,{' '}
          </Text>
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              color: '#1E64AC',
              fontSize: 15,
            }}
          >
            log today's tasks by 12:30 AM
          </Text>
        </View>

        <Reminder
          scheduleReminder={editableReminders}
          user_id={homeData?.user?.id}
          setIsVisible={setIsVisible}
          isVisible={isVisible}
        />
        <ReminderEditor
          requestId={requestId}
          showModal={showModal}
          setShowModal={setShowModal}
          setExistingReminder={setReminderList}
        />
      </ScrollView>
      {toast && (
        <View style={styles.toastContainer}>
          <Toast
            message={toast}
            type={toastType}
            onHide={() => setToast(null)}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    marginTop: Platform.OS === 'ios' ? hp(0) : hp(2),
    padding: hp(1.5),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    fontFamily: 'Roboto-ExtraBold',
    fontSize: 17,
    color: '#4B5563',
  },
  userIcon: {
    // elevation: 1,

    borderRadius: hp(5),
    tintColor: '#1E64AC',
    width: hp(3),
    height: hp(2),
    resizeMode: 'contain',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    // marginVertical: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    // paddingBottom: 8,
    paddingVertical: 8,
    marginHorizontal: hp(2),
  },
  activeTab: { fontFamily: 'Roboto-SemiBold', fontSize: 16, color: '#1E64AC' },
  inactiveTab: { fontFamily: 'Roboto-Regular', fontSize: 16, color: '#9CA3AF' },
  alert: {
    fontFamily: 'Roboto-Regular',
    color: 'red',
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
    fontFamily: 'Roboto-ExtraBold',
    color: '#18202B',
    alignSelf: 'center',
    textAlign: 'center',
  },
  quote: {
    // fontStyle: fontFamily: 'Roboto-Regular', 'italic',
    backgroundColor: '#F9ECF7',
    fontFamily: 'Roboto-Medium',
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
    fontFamily: 'Roboto-Medium',
    marginLeft: -hp(3),
    // backgroundColor: '#FEEAEA',
    padding: 8,
    fontSize: 15,
    // borderRadius: 6,
    color: '#B91C1C',
  },
  reassess: {
    fontFamily: 'Roboto-Medium',
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
    fontFamily: 'Roboto-SemiBold',
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
    color: '#6B7280',
  },
  taskCard: {
    elevation: 1,
    flex: 1,
    height: hp(8),
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
    fontFamily: 'Roboto-Medium',
    fontSize: 15,
    color: '#9CA3AF',
    width: wp(43),
  },
  taskDescription: {
    marginTop: 4,
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Roboto-Light',
    width: wp(40),
  },
  taskContent: {
    justifyContent: 'center',
  },
  notificationIcon: {
    height: hp(2.5),
    resizeMode: 'contain',
    marginLeft: -hp(6),
    width: wp(10),
  },
  editIcon: {
    height: hp(2),
    width: hp(2),
    resizeMode: 'contain',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#6B7280',
  },
  checkIcon: {
    resizeMode: 'contain',
    width: hp(2),
    height: hp(3),
    marginTop: 10,
    // justifyContent: 'center',
    // alignItems: 'flex-end',
    // alignSelf: 'flex-end',
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
    fontFamily: 'Roboto-SemiBold',
    color: '#1E64AC',
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
  updateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: hp(1),
    // paddingHorizontal: hp(2),
    paddingLeft: hp(1),
    paddingRight: hp(1),
    // width: hp(12),
    borderRadius: hp(1),
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  toastContainer: {
    position: 'absolute',
    top: hp(10),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999, // for Android
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 10,
    fontFamily: 'Roboto-Medium',
    color: '#1E64AC',
    fontSize: 16,
  },
});

export default Today;
