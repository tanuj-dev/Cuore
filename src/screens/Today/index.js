import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
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
  AppState,
  Linking,
  Modal,
} from 'react-native';
import { Images, hp, wp } from '../../utilities';
import { CLINICAL_REFERENCES_LABEL } from '../../utilities/Constants';
import { Info } from 'lucide-react-native';
import ProgressBarWithImage from '../../components/ProgressBar';
import Reminder from '../../components/Reminder';
import { useDispatch, useSelector } from 'react-redux';
import { getHomeData, getProfile } from '../../redux/slices';
import ReminderEditor from '../../components/ReminderEditor';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from '../../components/Toast';
import moment from 'moment';
import { Fonts } from '../../utilities';
import { logoutUser } from '../../redux/Auth/authThunk';
import SessionExpiredModal from '../../components/SessionExpired';
import { checkReminderThunk } from '../../redux/slices';
import { getNotification } from '../../redux/Home/notificationThunk';
import { dismissAlert } from '../../redux/Home/homeThunk';
import { useCustomAlert } from '../../hooks/useCustomAlert';

// Module-level fetch cache — survives re-mounts within the same JS session
const _fetchTs = {};
const CRITICAL_TTL = 5 * 60 * 1000; // 5 min — home + profile
const isFresh = (key, ttl) =>
  !!_fetchTs[key] && Date.now() - _fetchTs[key] < ttl;
const stamp = key => {
  _fetchTs[key] = Date.now();
};

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

const ALERT_REFERENCES = [
  {
    label: 'Chest Pain / Breathlessness',
    alert: 'Chest discomfort noted. Seek medical review',
    source: 'American Heart Association (AHA)',
    url: 'https://www.heart.org/en/health-topics/heart-attack/warning-signs-of-a-heart-attack',
  },
  {
    label: 'Increased Hunger / Thirst / Urination',
    alert: 'Increased frequency noted. Seek medical review',
    source: 'American Diabetes Association (ADA)',
    url: 'https://diabetes.org/about-diabetes/symptoms',
  },
  {
    label: 'Blood Pressure',
    source: 'American Heart Association (AHA)',
    url: 'https://www.heart.org/en/health-topics/high-blood-pressure',
  },
  {
    label: 'Pulse Rate',
    source: 'American Heart Association (AHA)',
    url: 'https://www.heart.org/en/healthy-living/fitness/fitness-basics/target-heart-rates',
  },
  {
    label: 'Blood Sugar – Fasting',
    source: 'American Diabetes Association (ADA)',
    url: 'https://diabetes.org/living-with-diabetes/treatment-care/checking-your-blood-sugar',
  },
  {
    label: 'Blood Sugar – After Meal',
    source: 'American Diabetes Association (ADA)',
    url: 'https://diabetes.org/living-with-diabetes/treatment-care/checking-your-blood-sugar',
  },
  {
    label: 'Undiagnosed High Sugar',
    source: 'American Diabetes Association (ADA)',
    url: 'https://diabetes.org/about-diabetes/diagnosis',
  },
  {
    label: 'Oxygen Saturation (SpO₂)',
    source: 'World Health Organization (WHO)',
    url: 'https://www.who.int/publications/i/item/WHO-2011-oxygen-therapy-guidelines',
  },
  {
    label: 'hsCRP',
    source: 'American Heart Association (AHA)',
    url: 'https://www.heart.org/en/health-topics/heart-attack/diagnosing-a-heart-attack',
  },
  {
    label: 'Cholesterol (HDL, LDL, Triglycerides)',
    source: 'American Heart Association (AHA)',
    url: 'https://www.heart.org/en/health-topics/cholesterol',
  },
];

import SkeletonBox from '../../components/SkeletonBox';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const TodaySkeleton = () => {
  const { colors: c } = useAppTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.card }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: hp(2),
          paddingVertical: hp(1.5),
          backgroundColor: c.card,
        }}
      >
        <SkeletonBox width={120} height={22} />
        <View style={{ flexDirection: 'row', gap: wp(2) }}>
          <SkeletonBox width={80} height={44} borderRadius={12} />
          <SkeletonBox width={80} height={44} borderRadius={12} />
        </View>
      </View>

      {/* Tabs */}
      <View
        style={{
          paddingHorizontal: hp(2),
          paddingVertical: hp(1.2),
          borderBottomWidth: 2,
          borderBottomColor: c.border,
        }}
      >
        <SkeletonBox width={90} height={18} />
      </View>

      <ScrollView
        scrollEnabled={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: hp(4) }}
      >
        {/* Progress card */}
        <View
          style={{
            marginHorizontal: hp(2),
            marginVertical: hp(1.5),
            backgroundColor: c.card,
            borderRadius: 16,
            padding: hp(2),
          }}
        >
          <SkeletonBox
            width={160}
            height={18}
            style={{ marginBottom: hp(1) }}
          />
          <SkeletonBox
            width={80}
            height={36}
            borderRadius={10}
            style={{ alignSelf: 'flex-end' }}
          />
        </View>

        {/* Progress bar */}
        <View style={{ marginHorizontal: hp(2), marginBottom: hp(1.5) }}>
          <SkeletonBox width="100%" height={60} borderRadius={12} />
        </View>

        {/* Quote */}
        <View style={{ marginHorizontal: hp(2.5), marginBottom: hp(1.5) }}>
          <SkeletonBox width="100%" height={64} borderRadius={12} />
        </View>

        {/* Alert chips */}
        <View
          style={{
            flexDirection: 'row',
            marginHorizontal: hp(2),
            marginBottom: hp(1.5),
            gap: hp(1),
          }}
        >
          {[120, 150, 110].map((w, i) => (
            <SkeletonBox key={i} width={w} height={48} borderRadius={8} />
          ))}
        </View>

        {/* Refs card */}
        <View style={{ marginHorizontal: hp(2), marginBottom: hp(2) }}>
          <SkeletonBox width="100%" height={44} borderRadius={14} />
        </View>

        {/* Task rows */}
        {[1, 2, 3, 4, 5, 6].map(i => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              marginTop: hp(2),
              paddingHorizontal: hp(2),
            }}
          >
            <View style={{ width: hp(9), marginRight: hp(1) }}>
              <SkeletonBox
                width={55}
                height={14}
                borderRadius={6}
                style={{ marginBottom: hp(1) }}
              />
              <SkeletonBox width={24} height={24} borderRadius={12} />
            </View>
            <SkeletonBox
              width={hp(2)}
              height={hp(2)}
              borderRadius={hp(1)}
              style={{ marginTop: hp(1), marginHorizontal: hp(1.5) }}
            />
            <View
              style={{
                flex: 1,
                backgroundColor: c.card,
                borderRadius: 12,
                padding: hp(1.5),
                minHeight: hp(8.5),
              }}
            >
              <SkeletonBox
                width="60%"
                height={15}
                style={{ marginBottom: hp(0.8) }}
              />
              <SkeletonBox
                width="85%"
                height={12}
                borderRadius={6}
                style={{ marginBottom: hp(0.5) }}
              />
              <SkeletonBox width="70%" height={12} borderRadius={6} />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const Today = ({ navigation, route }) => {
  const { colors: c, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const [isVisible, setIsVisible] = useState(false);
  const [showAlertRefsModal, setShowAlertRefsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('Feb 26');
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requestId, setRequestId] = useState(null);
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
    async ({ userId: alertUserId, alertId, itemIndex }) => {
      if (!alertUserId || !alertId) {
        console.log('Missing userId or alertId', { alertUserId, alertId });
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

        console.log('Dismissing alert:', alertId, 'for user:', alertUserId);
        const result = await dispatch(
          dismissAlert({ userId: alertUserId, alertId }),
        ).unwrap();

        if (result.success) {
          console.log('Alert dismissed successfully');
          setToast('Alert dismissed successfully');
          setToastType('success');
        }
      } catch (error) {
        console.log('Error dismissing alert:', error);
        setToast(error.message || 'Failed to dismiss alert');
        setToastType('error');
        dispatch(getHomeData(alertUserId));
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
      ]);
    } catch (err) {
      // Error handling without console.log in production
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (!userId) return;

    // Only fetch what Today actually needs — all other data is fetched by their own screens
    if (!isFresh(`critical-${userId}`, CRITICAL_TTL)) {
      stamp(`critical-${userId}`);
      dispatch(getHomeData(userId));
      dispatch(getProfile(userId));
    }
  }, [dispatch, userId]);

  // Update reminder list when homeData changes
  useEffect(() => {
    if (homeData?.dailySchedule) {
      setReminderList(homeData.dailySchedule);
    }
  }, [homeData?.dailySchedule]);

  // Notification scheduling is handled by the backend via Firebase push notifications.
  // The backend uses the stored fcm_token to send push at the correct time.

  // Auto-refresh every 30 minutes and on new day
  const lastRefreshRef = useRef(Date.now());
  const lastRefreshDateRef = useRef(new Date().toDateString());

  const silentRefresh = useCallback(() => {
    if (!userId) return;
    lastRefreshRef.current = Date.now();
    lastRefreshDateRef.current = new Date().toDateString();
    dispatch(getHomeData(userId));
    dispatch(getProfile(userId));
  }, [dispatch, userId]);

  useEffect(() => {
    if (!userId) return;

    const THIRTY_MINUTES = 30 * 60 * 1000;

    // Interval fires every 30 minutes
    const intervalId = setInterval(() => {
      silentRefresh();
    }, THIRTY_MINUTES);

    // AppState listener: refresh if 30+ min passed OR date changed since last refresh
    const appStateSubscription = AppState.addEventListener(
      'change',
      nextState => {
        if (nextState === 'active') {
          const now = Date.now();
          const todayString = new Date().toDateString();
          const elapsed = now - lastRefreshRef.current;
          const isNewDay = todayString !== lastRefreshDateRef.current;

          if (isNewDay || elapsed >= THIRTY_MINUTES) {
            silentRefresh();
          }
        }
      },
    );

    return () => {
      clearInterval(intervalId);
      appStateSubscription.remove();
    };
  }, [userId, silentRefresh]);

  const handleLoginRedirect = useCallback(async () => {
    setSessionExpired(false);
    await dispatch(logoutUser({ skipRemote: true }));
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

  // Show skeleton only on first load — not on background refetches where data already exists
  if (loading && !data) {
    return <TodaySkeleton />;
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
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.card }}>
      {AlertComponent}
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={c.card}
      />

      <ScrollView
        nestedScrollEnabled
        refreshControl={
          <RefreshControl
            title="Pull to refresh..."
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.primary}
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
                      : Images.DOCTOR_PROFILE
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.warningsScrollContent}
          >
            {localAlerts.map((item, index) => {
              const tone =
                item?.type === 'red'
                  ? {
                      bg: c.alertRedBg,
                      text: c.alertRedText,
                      icon: c.alertRedIcon,
                    }
                  : item?.type === 'yellow'
                  ? {
                      bg: c.alertYellowBg,
                      text: c.alertYellowText,
                      icon: c.alertYellowIcon,
                    }
                  : {
                      bg: c.alertOrangeBg,
                      text: c.alertOrangeText,
                      icon: c.alertOrangeIcon,
                    };
              return (
                <View
                  key={item.id}
                  style={[styles.alertChip, { backgroundColor: tone.bg }]}
                >
                  <Image
                    style={[styles.alertChipIcon, { tintColor: tone.icon }]}
                    source={Images.WARNING}
                  />
                  <Text
                    style={[
                      styles.alertChipText,
                      { color: isDark ? '#FFFFFF' : tone.text },
                    ]}
                    numberOfLines={3}
                    ellipsizeMode="tail"
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
                        height: hp(1.2),
                        width: hp(2),
                        resizeMode: 'contain',
                        borderRadius: hp(1),
                        tintColor: isDark ? '#FFFFFF' : tone.text,
                      }}
                      source={Images.CROSS}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Alert References Card */}
        {/* <TouchableOpacity
          style={styles.alertRefsCard}
          onPress={() => setShowAlertRefsModal(true)}
          activeOpacity={0.8}
        >
          <Info
            size={Math.max(16, hp(1.85))}
            color={c.icon}
            strokeWidth={2}
            style={styles.alertRefsInfoIcon}
          />
          <Text style={styles.alertRefsCardText}>
            {CLINICAL_REFERENCES_LABEL}
          </Text>
          <Text style={styles.alertRefsCardChevron}>›</Text>
        </TouchableOpacity> */}

        {/* Daily Schedule */}
        <View style={styles.scheduleSection}>
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
            removeClippedSubviews={false}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={10}
            windowSize={10}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No items found.</Text>
              </View>
            }
            renderItem={({ item, index: itemIndex }) => {
              const handleNotificationToggle = () => {
                if (isCaregiver) return;

                const isCurrentlyOn = item?.alarm_notified;

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

                // Notify backend — it will schedule/cancel the FCM push notification
                dispatch(
                  getNotification({
                    userId,
                    reminderId: item?.id,
                    time: item?.time,
                    title: item?.title,
                  }),
                );

                // Show toast
                if (isCurrentlyOn) {
                  setToast('Reminder cancelled');
                  setToastType('error');
                } else {
                  setToast(`Reminder set! You'll be notified at ${item?.time}`);
                  setToastType('success');
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
                  <View style={styles.taskTimeColumn}>
                    <Text style={styles.time}>{item?.time}</Text>
                    <View style={styles.notificationRow}>
                      <TouchableOpacity
                        disabled={isCaregiver}
                        onPress={handleNotificationToggle}
                      >
                        <Image
                          style={[
                            styles.notificationIcon,
                            {
                              tintColor: item.alarm_notified
                                ? '#EAB308'
                                : c.icon,
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
                          <Image
                            style={styles.editIcon}
                            source={Images.EDIT}
                          />
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
                    style={styles.taskDotWrap}
                  >
                    <View style={styles.blackDot}>
                      {loadingTaskId === item.id || loadingTaskId === 'all' ? (
                        <ActivityIndicator size="small" color={c.primary} />
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
                    <View style={styles.taskCardBody}>
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
                    ? c.primary
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
                <ActivityIndicator size="small" color={c.onPrimary} />
              ) : (
                reminderList.every(item => item.completed) && (
                  <Text style={[styles.checkAllMark, { color: c.onPrimary }]}>
                    ✔
                  </Text>
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
            Before you sleep, update today's details.
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
      {/* Alert References Modal */}
      <Modal
        visible={showAlertRefsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAlertRefsModal(false)}
      >
        <TouchableOpacity
          style={styles.referencesOverlay}
          activeOpacity={1}
          onPress={() => setShowAlertRefsModal(false)}
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
              Health alerts in Cuore are based on the following internationally
              recognised guidelines:
            </Text>
            <ScrollView
              style={styles.referencesScroll}
              showsVerticalScrollIndicator={false}
            >
              {ALERT_REFERENCES.map((ref, index) => (
                <View key={index} style={styles.referenceItem}>
                  <Text style={styles.referenceParameter}>{ref.label}</Text>
                  {ref.alert ? (
                    <Text style={styles.alertRefAlert}>{ref.alert}</Text>
                  ) : null}
                  <Text
                    style={[styles.referenceSource, styles.referenceLink]}
                    onPress={() => Linking.openURL(ref.url)}
                  >
                    Source: {ref.source}
                  </Text>
                </View>
              ))}
              <Text style={styles.referencesFootnote}>
                Cuore does not diagnose, treat, or prescribe. All alerts and
                insights are informational and should be interpreted in
                consultation with a qualified healthcare professional.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.referencesCloseBtn}
              onPress={() => setShowAlertRefsModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.referencesCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = c =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface },
    scheduleSection: {
      backgroundColor: c.surface,
    },
    warningsScrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: hp(2),
      paddingRight: hp(2),
      paddingLeft: hp(2),
      paddingVertical: hp(0.75),
    },
    alertChip: {
      width: wp(80),
      height: hp(11),
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: hp(1),
      paddingVertical: hp(1),
      paddingHorizontal: hp(1.5),
      paddingRight: hp(4.5),
      position: 'relative',
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    alertChipIcon: {
      resizeMode: 'contain',
      height: hp(2),
      width: wp(4),
      marginRight: hp(2),
    },
    alertChipText: {
      flex: 1,
      minWidth: 0,
      fontFamily: 'Poppins-Medium',
      fontSize: 13,
      lineHeight: 18,
    },
    checkAllMark: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
    },
    header: {
      marginTop: 0,
      paddingHorizontal: hp(2),
      paddingVertical: hp(1.5),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: c.card,
    },
    username: {
      fontFamily: 'Poppins-Regular',
      fontSize: 18,
      color: c.text,
      letterSpacing: -0.4,
      ...Platform.select({
        android: { includeFontPadding: false, textAlignVertical: 'center' },
        default: {},
      }),
    },
    userIcon: {
      // elevation: 1,

      borderRadius: hp(5),
      tintColor: c.primary,
      width: hp(3),
      height: hp(2),
      resizeMode: 'contain',
    },
    tabs: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      backgroundColor: c.surface,
      borderBottomWidth: 2,
      borderBottomColor: c.border,
      paddingVertical: hp(1.2),
      paddingHorizontal: hp(2),
    },
    activeTab: { fontFamily: 'Poppins-Medium', fontSize: 16, color: c.primary },
    inactiveTab: {
      fontFamily: 'Poppins-Medium',
      fontSize: 16,
      color: c.tabInactive,
    },
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
      backgroundColor: c.card,
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
      color: c.text,
      alignSelf: 'center',
      textAlign: 'center',
      letterSpacing: -0.4,
    },
    biomarkerButton: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      backgroundColor: c.bioButtonBg,
      paddingVertical: hp(1.2),
      paddingHorizontal: hp(1.8),
      borderRadius: hp(1.2),
      borderWidth: 1.5,
      borderColor: c.bioButtonBorder,
    },
    biomarkerButtonText: {
      fontFamily: 'Poppins-Medium',
      fontSize: 11.5,
      color: c.bioButtonText,
      textAlign: 'center',
      lineHeight: 14,
    },
    quoteContainer: {
      paddingHorizontal: hp(2.5),
      marginVertical: hp(1.5),
    },
    quote: {
      backgroundColor: c.quoteBg,
      fontFamily: 'Poppins-Medium',
      color: c.quoteText,
      fontSize: 15,
      padding: hp(2),
      borderLeftWidth: 4,
      borderRadius: 12,
      borderColor: c.quoteBorder,
      lineHeight: 22,
      fontStyle: 'italic',
    },
    warnings: {
      marginVertical: 10,
      marginHorizontal: hp(2),
      backgroundColor: c.surface,
      minHeight: hp(12.5),
      paddingVertical: hp(0.75),
      paddingHorizontal: hp(0.5),
      borderRadius: hp(1),
      justifyContent: 'center',
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
      color: c.text,
      letterSpacing: -0.5,
    },
    taskRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: hp(2),
      paddingHorizontal: hp(2),
    },
    taskTimeColumn: {
      width: hp(9),
      flexShrink: 0,
      borderRightWidth: 1,
      minHeight: hp(7),
      marginTop: hp(0.5),
      borderColor: c.border,
    },
    notificationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: hp(1),
      width: '100%',
      gap: hp(0.8),
    },
    taskDotWrap: {
      flexShrink: 0,
    },

    time: {
      fontFamily: 'Poppins-Regular',
      fontSize: 13,
      width: 62,
      color: c.subText,
      letterSpacing: -0.2,
    },
    taskCard: {
      flex: 1,
      minWidth: 0,
      minHeight: hp(8.5),
      borderLeftWidth: 3,
      backgroundColor: c.card,
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
    taskCardBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flex: 1,
      minWidth: 0,
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
      color: c.textSecondary,
      letterSpacing: -0.2,
    },
    taskDescription: {
      marginTop: 5,
      fontSize: 13,
      color: c.subText,
      fontFamily: 'Poppins-Regular',
      lineHeight: 18,
    },
    taskContent: {
      justifyContent: 'center',
      flex: 1,
      minWidth: 0,
    },
    notificationIcon: {
      height: hp(2.5),
      resizeMode: 'contain',
      width: wp(6),
    },
    editIcon: {
      height: hp(2),
      width: hp(2),
      resizeMode: 'contain',
      tintColor: c.navIconTint,
    },
    emptyContainer: {
      alignItems: 'center',
      marginTop: 40,
    },
    emptyText: {
      fontSize: 16,
      fontFamily: 'Poppins-Medium',
      color: c.tabInactive,
    },
    checkIcon: {
      resizeMode: 'contain',
      width: hp(2.2),
      height: hp(2.2),
      marginTop: 10,
      alignSelf: 'center',
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
      color: c.primary,
      textAlign: 'center',
    },
    checkAll: {
      height: hp(3),
      width: wp(6),
      borderWidth: 1,
      borderRadius: hp(0.5),
      marginRight: hp(1),
      borderColor: c.tabInactive,

      alignItems: 'center',
      justifyContent: 'center',
    },
    blackDot: {
      marginTop: hp(1),
      marginHorizontal: hp(1.5),
      borderWidth: 2,
      height: hp(2.2),
      width: hp(2.2),
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: hp(2),
      borderColor: c.taskRingBorder,
      backgroundColor: 'transparent',
    },
    blackDotInner: {
      height: hp(1.15),
      width: hp(1.15),
      borderRadius: hp(2),
      backgroundColor: c.taskRingFill,
    },
    headerButtonsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2),
    },
    addReminderButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.headerChipBlueBg,
      paddingVertical: hp(1.2),
      paddingHorizontal: wp(2.5),
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.headerChipBlueBorder,
      ...Platform.select({
        ios: {
          shadowColor: c.primary,
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 4,
        },
        // elevation + translucent fills on Android reads as a flat, brighter chip;
        // rely on border + bg only to match iOS outline chips
        android: { elevation: 0 },
        default: {},
      }),
    },
    healthButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.headerChipRoseBg,
      paddingVertical: hp(1.2),
      paddingHorizontal: wp(2.5),
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.headerChipRoseBorder,
      ...Platform.select({
        ios: {
          shadowColor: c.danger,
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 4,
        },
        android: { elevation: 0 },
        default: {},
      }),
    },
    buttonIconWrapper: {
      width: hp(3.5),
      height: hp(3.5),
      borderRadius: hp(1.75),
      backgroundColor: c.headerChipIconBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(1.5),
      overflow: 'hidden',
    },
    addIcon: {
      height: hp(2),
      width: hp(2),
      resizeMode: 'contain',
      // add.png is a single-color asset; tint makes it visible on dark chips
      tintColor: c.headerChipBlueText,
    },
    healthIcon: {
      height: hp(2),
      width: hp(2),
      resizeMode: 'contain',
      tintColor: c.headerChipRoseText,
    },
    healthIconFull: {
      width: hp(3.5),
      height: hp(3.5),
      borderRadius: hp(1.75),
      resizeMode: 'cover',
    },
    addReminderText: {
      fontSize: 11.5,
      fontFamily: 'Poppins-Medium',
      color: c.headerChipBlueText,
      textAlign: 'center',
      lineHeight: 14,
      letterSpacing: -0.2,
      ...Platform.select({
        android: { includeFontPadding: false },
        default: {},
      }),
    },
    healthButtonText: {
      fontSize: 11.5,
      fontFamily: 'Poppins-Medium',
      color: c.headerChipRoseText,
      textAlign: 'center',
      lineHeight: 14,
      letterSpacing: -0.2,
      ...Platform.select({
        android: { includeFontPadding: false },
        default: {},
      }),
    },
    updateButton: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.card,
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
      backgroundColor: c.surface,
    },
    loadingText: {
      marginTop: hp(2),
      fontFamily: 'Poppins-Medium',
      color: c.primary,
      fontSize: 16,
    },
    checkAllText: {
      fontFamily: 'Poppins-Medium',
      fontSize: 15,
      color: c.textSecondary,
      letterSpacing: -0.2,
    },
    streakContainer: {
      alignItems: 'center',
      marginVertical: hp(2.5),
      marginHorizontal: hp(2),
      backgroundColor: c.streakBg,
      borderWidth: 1,
      borderColor: c.streakBorder,
      paddingVertical: hp(3),
      paddingHorizontal: hp(2),
      borderRadius: 16,
      overflow: 'hidden',
    },
    fireIcon: {
      marginBottom: hp(1),
    },
    streakTitle: {
      fontFamily: 'Poppins-SemiBold',
      fontSize: 24,
      color: c.streakTitle,
      letterSpacing: -0.6,
      marginBottom: 6,
    },
    streakSubtitle: {
      fontFamily: 'Poppins-Regular',
      fontSize: 14,
      color: c.streakSubtitle,
      textAlign: 'center',
      paddingHorizontal: hp(2.5),
      lineHeight: 20,
    },
    alertRefsCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      marginHorizontal: wp(4),
      marginVertical: hp(1.5),
      borderRadius: 14,
      padding: hp(1.8),
      borderWidth: 1,
      borderColor: c.border,
    },
    alertRefsInfoIcon: {
      marginRight: hp(1),
    },
    alertRefsCardText: {
      flex: 1,
      fontFamily: 'Poppins-Regular',
      fontSize: 12,
      color: c.tabInactive,
      letterSpacing: 0.15,
      lineHeight: 18,
    },
    alertRefsCardChevron: {
      fontFamily: 'Poppins-Medium',
      fontSize: 20,
      color: c.tabInactive,
      marginLeft: 8,
    },
    alertRefAlert: {
      fontFamily: 'Poppins-Regular',
      fontSize: 11.5,
      color: '#DC2626',
      marginBottom: 2,
      fontStyle: 'italic',
    },
    referencesOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    referencesBox: {
      backgroundColor: c.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: hp(2.5),
      maxHeight: '80%',
    },
    referencesModalTitle: {
      fontFamily: 'Poppins-Regular',
      fontSize: 14,
      color: c.subText,
      letterSpacing: 0.15,
      marginBottom: hp(0.5),
    },
    referencesModalSubtitle: {
      fontFamily: 'Poppins-Regular',
      fontSize: 12,
      color: c.subText,
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
      borderBottomColor: c.divider,
    },
    referenceParameter: {
      fontFamily: 'Poppins-Medium',
      fontSize: 13.5,
      color: c.primary,
      marginBottom: 2,
    },
    referenceSource: {
      fontFamily: 'Poppins-Regular',
      fontSize: 12.5,
      color: c.subText,
      lineHeight: 18,
    },
    referenceLink: {
      color: c.primary,
      textDecorationLine: 'underline',
    },
    referencesFootnote: {
      fontFamily: 'Poppins-Regular',
      fontSize: 11,
      color: c.tabInactive,
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
      color: c.card,
    },
  });

export default Today;
