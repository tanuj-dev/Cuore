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
import { Fonts } from '../../utilities';
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
import { dismissAlert } from '../../redux/Home/homeThunk';
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
  'Your Daily Health Win': 'Tobacco',
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
  const doctorProfile = useSelector(state => state.home.data?.doctor);

  // Memoize derived data
  const homeData = useMemo(() => data || null, [data]);

  // Manage alerts locally to avoid re-renders
  const [localAlerts, setLocalAlerts] = useState([]);

  // Update local alerts when homeData changes
  useEffect(() => {
    if (data?.alerts) {
      setLocalAlerts(data.alerts);
    }
  }, [data?.alerts]);

  const formattedDate = useMemo(
    () =>
      homeData?.date
        ? moment(homeData.date, 'YYYY-MM-DD').format('MMM DD YYYY')
        : '',
    [homeData?.date],
  );

  // Handle dismiss alert
  const handleDismissAlert = useCallback(
    async ({ userId, alertId, itemIndex }) => {
      if (!userId || !alertId) {
        console.log('Missing userId or alertId', { userId, alertId });
        return;
      }

      try {
        // Optimistically remove the alert from UI by updating local state
        if (itemIndex !== undefined && localAlerts.length > 0) {
          // Create a new array excluding the alert at the given index
          const updatedAlerts = localAlerts.filter(
            (_, idx) => idx !== itemIndex,
          );
          // Update local alerts state to immediately reflect the change
          setLocalAlerts(updatedAlerts);
        }

        console.log('Dismissing alert:', alertId, 'for user:', userId);
        const result = await dispatch(
          dismissAlert({ userId, alertId }),
        ).unwrap();

        if (result.success) {
          console.log('Alert dismissed successfully');
          setToast('Alert dismissed successfully');
          setToastType('success');
          // Don't refresh the whole page - the optimistic update already handled the UI
          // Just keep the local state updated
        }
      } catch (error) {
        console.log('Error dismissing alert:', error);
        setToast(error.message || 'Failed to dismiss alert');
        setToastType('error');
        // If API fails, refresh data to revert any optimistic changes
        dispatch(getHomeData(userId));
      }
    },
    [dispatch, localAlerts],
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
    console.log(scheduledTime, 'helo there hello');
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
          case 'your daily health win':
            navigation.navigate(targetRoute, { title: 'Tobacco' });
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
        <ActivityIndicator size="large" color="#11418A" />
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
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
    >
      {AlertComponent}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        nestedScrollEnabled
        refreshControl={
          <RefreshControl
            title="Pull to refresh..."
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#11418A"
          />
        }
        scrollEventThrottle={16}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.username}>
            {profileData?.display_name
              ? `Hi, ${profileData.display_name.split(' ')[0]}`
              : 'User'}
          </Text>
          <View style={styles.headerButtonsContainer}>
            <TouchableOpacity
              disabled={isCaregiver}
              onPress={() => setIsVisible(true)}
              style={styles.addReminderButton}
              activeOpacity={0.8}
            >
              <View style={styles.buttonIconWrapper}>
                <Image source={Images.ADD} style={styles.addIcon} />
              </View>
              <Text style={styles.addReminderText}>Add{'\n'}Reminder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.healthButton}
              onPress={() => navigation.navigate('Health')}
              activeOpacity={0.8}
            >
              <View style={styles.buttonIconWrapper}>
                <Image
                  source={
                    doctorProfile?.profileImage || doctorProfile?.photoUrl
                      ? {
                        uri:
                          doctorProfile?.profileImage ||
                          doctorProfile?.photoUrl,
                      }
                      : Images.DEFAULT_DOCTOR
                  }
                  style={
                    doctorProfile?.profileImage || doctorProfile?.photoUrl
                      ? styles.healthIconFull
                      : styles.healthIcon
                  }
                  resizeMode={
                    doctorProfile?.profileImage || doctorProfile?.photoUrl
                      ? 'cover'
                      : 'contain'
                  }
                />
              </View>
              <Text style={styles.healthButtonText}>Cuore{'\n'}Health</Text>
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
          {/* <Text style={styles.progressTitle}>Stability </Text> */}
          <TouchableOpacity
            disabled={isCaregiver}
            onPress={() => {
              navigation.navigate('OnBoarding', {
                STEP: REASSESS_STEP,
                screen: 'Reassess',
                navigateTo: 'Home',
              });
            }}
            style={styles.biomarkerButton}
          >
            <Text style={styles.biomarkerButtonText}>Update{'\n'}Readings</Text>
          </TouchableOpacity>
        </View>

        <ProgressBarWithImage
          data={homeData?.progress}
          navigation={navigation}
        />

        <View style={{ paddingHorizontal: hp(2.5) }}>
          <Text style={styles.quote}>
            {homeData?.motivationalMessage || '“Your health is your wealth.”'}
          </Text>
        </View>

        {/* Alerts Horizontal Scroll */}
        <View style={styles.warnings}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {localAlerts.map((item, index) => (
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
                <TouchableOpacity
                  onPress={() =>
                    handleDismissAlert({
                      userId,
                      alertId: item.alertId,
                      itemIndex: index,
                    })
                  }
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
                        <ActivityIndicator size="small" color="#11418A" />
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
                    ? '#11418A'
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

            <Text style={styles.checkAllText}>Check Off All Tasks</Text>
          </View>
        </View>

        {/* Streak Section */}
        <View style={styles.streakContainer}>
          {/* <Image source={Images.FIRE} style={styles.fireIcon} /> */}
          <Text style={styles.streakTitle}>
            {homeData?.streak}-Day Streak 🔥
          </Text>
          <Text style={styles.streakSubtitle}>
            Maintain your progress,{'\n'}log today's tasks by 12:30 AM
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    marginTop: Platform.OS === 'ios' ? hp(0) : hp(1),
    paddingHorizontal: hp(2),
    paddingVertical: hp(1.5),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  username: {
    fontFamily: 'Poppins-Regular',
    fontSize: 18,
    color: '#1E293B',
    letterSpacing: -0.4,
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
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
    paddingVertical: hp(1.2),
    paddingHorizontal: hp(2),
  },
  activeTab: { fontFamily: 'Poppins-Medium', fontSize: 16, color: '#11418A' },
  inactiveTab: { fontFamily: 'Poppins-Medium', fontSize: 16, color: '#94A3B8' },
  alert: {
    fontFamily: 'Poppins-Medium',
    color: '#DC2626',
    fontSize: 14,
    marginLeft: -hp(2),
    marginVertical: 8,
  },
  progressContainer: {
    paddingHorizontal: hp(2),
    paddingVertical: hp(1.8),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: hp(1.5),
    marginHorizontal: hp(2),
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 2 },
    }),
  },
  progressTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 17,
    color: '#1E293B',
    alignSelf: 'center',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  biomarkerButton: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: hp(1.2),
    paddingHorizontal: hp(1.8),
    borderRadius: hp(1.2),
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  biomarkerButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11.5,
    color: '#047857',
    textAlign: 'center',
    lineHeight: 14,
  },
  quoteContainer: {
    paddingHorizontal: hp(2.5),
    marginVertical: hp(1.5),
  },
  quote: {
    backgroundColor: '#F5F3FF',
    fontFamily: 'Poppins-Medium',
    color: '#7C3AED',
    fontSize: 15,
    padding: hp(2),
    borderLeftWidth: 4,
    borderRadius: 12,
    borderColor: '#9333EA',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  warnings: {
    marginVertical: 10,
    marginHorizontal: hp(2),
    backgroundColor: '#FFFFFF',
    padding: hp(0.5),
  },
  consult: {
    fontFamily: 'Poppins-Medium',
    marginLeft: -hp(3),
    padding: 8,
    fontSize: 14,
    color: '#DC2626',
  },
  reassess: {
    fontFamily: 'Poppins-Medium',
    marginLeft: -hp(3),
    padding: 8,
    fontSize: 14,
    color: '#F59E0B',
  },
  sectionHeader: {
    paddingHorizontal: hp(2),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(2),
  },
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: Platform.OS === 'ios' ? 16 : 18,
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  taskRow: {
    // backgroundColor: 'red',
    // marginBottom: hp(2),
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: hp(2),
    paddingHorizontal: hp(2),
  },

  time: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    width: 62,
    color: '#64748B',
    letterSpacing: -0.2,
  },
  taskCard: {
    flex: 1,
    minHeight: hp(8.5),
    borderLeftWidth: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: hp(1.5),
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 3 },
    }),
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
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#334155',
    width: wp(43),
    letterSpacing: -0.2,
  },
  taskDescription: {
    marginTop: 5,
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Poppins-Regular',
    width: wp(40),
    lineHeight: 18,
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
    fontFamily: 'Poppins-Medium',
    color: '#94A3B8',
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
    fontFamily: 'Poppins-Medium',
    color: '#11418A',
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
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  addReminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(2.5),
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    shadowColor: '#11418A',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 3 },
    }),
  },
  healthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(2.5),
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    shadowColor: '#DC2626',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 3 },
    }),
  },
  buttonIconWrapper: {
    width: hp(3.5),
    height: hp(3.5),
    borderRadius: hp(1.75),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(1.5),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 2 },
    }),
  },
  addIcon: {
    height: hp(2),
    width: hp(2),
    tintColor: '#11418A',
  },
  healthIcon: {
    height: hp(2),
    width: hp(2),
    tintColor: '#DC2626',
  },
  healthIconFull: {
    width: hp(3.5),
    height: hp(3.5),
    borderRadius: hp(1.75),
  },
  addReminderText: {
    fontSize: 11.5,
    fontFamily: 'Poppins-Medium',
    color: '#1E40AF',
    textAlign: 'center',
    lineHeight: 14,
    letterSpacing: -0.2,
  },
  healthButtonText: {
    fontSize: 11.5,
    fontFamily: 'Poppins-Medium',
    color: '#DC2626',
    textAlign: 'center',
    lineHeight: 14,
    letterSpacing: -0.2,
  },
  updateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: hp(1),
    paddingHorizontal: hp(1),
    borderRadius: hp(1),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 3 },
    }),
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
    marginTop: hp(2),
    fontFamily: 'Poppins-Medium',
    color: '#11418A',
    fontSize: 16,
  },
  checkAllText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#334155',
    letterSpacing: -0.2,
  },
  streakContainer: {
    alignItems: 'center',
    marginVertical: hp(2.5),
    marginHorizontal: hp(2),
    backgroundColor: '#FEF9C3',
    paddingVertical: hp(3),
    borderRadius: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 4 },
    }),
  },
  fireIcon: {
    marginBottom: hp(1),
  },
  streakTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#78350F',
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  streakSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    paddingHorizontal: hp(2.5),
    lineHeight: 20,
  },
});

export default Today;
