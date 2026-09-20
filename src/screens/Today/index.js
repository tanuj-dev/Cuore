import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
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
import { Info, Bell, Trash2, CalendarDays } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchNotifications } from '../../redux/Notifications/thunks';
import { getTodayConsultations } from '../../redux/CuoreCare/thunks';
import ConsultationTimeCard from './ConsultationTimeCard';
import ProgressBarWithImage from '../../components/ProgressBar';
import PendingVisitCards from './PendingVisitCards';
import Reminder from '../../components/Reminder';
import { useDispatch, useSelector } from 'react-redux';
import ProfileSwitcher from '../../components/ProfileSwitcher';
import DrawerMenuButton from '../../components/DrawerMenuButton';
import { getHomeData, getProfile } from '../../redux/slices';
import ReminderEditor from '../../components/ReminderEditor';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from '../../components/Toast';
import moment from 'moment';
import { Fonts } from '../../utilities';
import { logoutUser } from '../../redux/Auth/authThunk';
import SessionExpiredModal from '../../components/SessionExpired';
import { checkReminderThunk, getPendingDoctorReminders, respondToDoctorReminder, deleteReminderThunk } from '../../redux/slices';
import { getNotification } from '../../redux/Home/notificationThunk';
import { dismissAlert, respondCheckin } from '../../redux/Home/homeThunk';
import { fetchCycle } from '../../redux/Cycle/thunks';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import SubscriptionExpiringModal from '../../components/SubscriptionExpiringModal';
import {
  isPaymentEndDateToday,
  navigateToCheckoutFromTabs,
} from '../../utilities/subscriptionExpiry';

// Module-level fetch cache — survives re-mounts within the same JS session
const _fetchTs = {};
let _subscriptionExpiryShown = false;
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

const TodaySkeleton = () => (
  <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
    {/* Header */}
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: hp(2),
        paddingVertical: hp(1.5),
        backgroundColor: '#FFF',
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
        borderBottomColor: '#E2E8F0',
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
          backgroundColor: '#FFF',
          borderRadius: 16,
          padding: hp(2),
        }}
      >
        <SkeletonBox width={160} height={18} style={{ marginBottom: hp(1) }} />
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
              backgroundColor: '#FFF',
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

// ─────────────────────────────────────────────────────────────────────────────

const Today = ({ navigation, route }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showAlertRefsModal, setShowAlertRefsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('Feb 26');
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requestId, setRequestId] = useState(null);
  // Only becomes true after a 401 is CONFIRMED by a second fetch (see effect
  // below). Defaulting false stops a single transient invalid-token blip from
  // hard-logging the user out.
  const [sessionExpired, setSessionExpired] = useState(false);
  const [toast, setToast] = useState(null);
  const [reminderList, setReminderList] = useState([]);
  const [toastType, setToastType] = useState('success');
  const [loadingTaskId, setLoadingTaskId] = useState(null);
  // The reminder currently being deleted, so its row can show progress instead of the bin.
  const [deletingSourceId, setDeletingSourceId] = useState(null);
  const [checkinResponseLoading, setCheckinResponseLoading] = useState({});
  const [doctorImageLoadFailed, setDoctorImageLoadFailed] = useState(false);
  const [subscriptionExpiryVisible, setSubscriptionExpiryVisible] =
    useState(false);
  // CuoreMD spec — doctor-issued medicine/follow-up/vaccine reminders need an accept/decline
  // response. Matched against each dailySchedule item by `sourceId` (see backend
  // timelineController.js getPendingDoctorReminders for why this isn't threaded through
  // getHomeData's own response instead).
  const [pendingDoctorReminderIds, setPendingDoctorReminderIds] = useState(
    () => new Set(),
  );
  /* The pending reminders themselves, not only their ids. The ids answer "does this schedule
   * row need Accept/Decline"; the rows are needed for the pinned follow-up cards above the day,
   * which exist precisely BECAUSE a follow-up months away generates no schedule row at all. */
  const [pendingDoctorReminders, setPendingDoctorReminders] = useState([]);
  const [respondingReminderId, setRespondingReminderId] = useState(null);

  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();

  const { data, loading } = useSelector(state => state.home);
  const userId = useSelector(state => state.auth.userId);
  const role = useSelector(state => state.auth.role);
  const profileData = useSelector(state => state.profile.data?.data?.user);
  const payment = useSelector(state => state.profile?.data?.data?.payment);
  const doctorProfile = useSelector(state => state.home.data?.doctor);
  // Resolved practice identity — see utils/doctorBranding.js on the backend.
  const branding = useSelector(state => state.home.data?.doctor?.branding);
  const doctorImageUri = useMemo(
    () =>
      profileData?.doctor?.photoUrl ||
      profileData?.doctor?.photo_url ||
      profileData?.doctor_profile?.photoUrl ||
      profileData?.doctor_profile?.photo_url ||
      doctorProfile?.profileImage ||
      doctorProfile?.photoUrl ||
      null,
    [profileData, doctorProfile],
  );
  const normalizedDoctorImageUri = useMemo(() => {
    if (typeof doctorImageUri !== 'string') return null;
    const trimmed = doctorImageUri.trim();
    if (!trimmed) return null;
    if (!/^https?:\/\//i.test(trimmed)) return null;
    return trimmed;
  }, [doctorImageUri]);

  useEffect(() => {
    setDoctorImageLoadFailed(false);
  }, [normalizedDoctorImageUri]);

  // In-app notification bell (header) — refreshed every time this tab regains focus,
  // e.g. coming back from the Notifications screen after reading something.
  const unreadNotificationCount = useSelector(state => state.notifications.unreadCount);
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchNotifications({ page: 1 }));
    }, [dispatch]),
  );

  // Today's CuoreCare consultations. Fetched only when the patient actually has access —
  // a free/Essential user with no CuoreCare or EMR entitlement would just get an empty 200,
  // so this avoids a pointless request on every Home focus for the majority of users.
  const ccAccess = useSelector(state => state.cuoreCare?.access);
  const todayConsults = useSelector(state => state.cuoreCare?.todayConsults?.list) || [];
  const hasConsultAccess = !!(ccAccess?.cuoreCare || ccAccess?.emr);
  useFocusEffect(
    useCallback(() => {
      if (hasConsultAccess) dispatch(getTodayConsultations());
    }, [dispatch, hasConsultAccess]),
  );

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

  const isDoctorCheckinAlert = useCallback(text => {
    const normalized = String(text || '').toLowerCase();
    return (
      normalized.includes('check-in requested by doctor') ||
      normalized.includes('check in requested by doctor')
    );
  }, []);

  const handleRespondCheckin = useCallback(
    async (status, alertKey) => {
      if (status !== 'accepted' && status !== 'declined') return;
      setCheckinResponseLoading(prev => ({ ...prev, [alertKey]: status }));
      try {
        await dispatch(respondCheckin({ status })).unwrap();
        setToast(
          status === 'accepted'
            ? 'Check-in accepted successfully'
            : 'Check-in declined successfully',
        );
        setToastType('success');
        if (userId) {
          dispatch(getHomeData(userId));
        }
      } catch (error) {
        setToast(error?.message || 'Failed to respond to check-in');
        setToastType('error');
      } finally {
        setCheckinResponseLoading(prev => ({ ...prev, [alertKey]: null }));
      }
    },
    [dispatch, userId],
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

  useEffect(() => {
    if (isCaregiver || _subscriptionExpiryShown) return;
    const endDate = payment?.endDate;
    if (!isPaymentEndDateToday(endDate, payment?.startDate)) return;
    _subscriptionExpiryShown = true;
    setSubscriptionExpiryVisible(true);
  }, [isCaregiver, payment?.endDate, payment?.startDate]);

  const handleSubscriptionUpdatePayment = useCallback(() => {
    setSubscriptionExpiryVisible(false);
    navigateToCheckoutFromTabs(navigation);
  }, [navigation]);

  const handleSubscriptionExpiryDismiss = useCallback(() => {
    setSubscriptionExpiryVisible(false);
  }, []);

  // Update reminder list when homeData changes
  useEffect(() => {
    if (homeData?.dailySchedule) {
      setReminderList(homeData.dailySchedule);
    }
  }, [homeData?.dailySchedule]);

  // Which of today's reminder/medication cards are doctor-issued and still awaiting a
  // response — fetched once per userId; refetched after a response below.
  const loadPendingDoctorReminders = useCallback(() => {
    if (!userId) return;
    dispatch(getPendingDoctorReminders(userId)).then(res => {
      if (getPendingDoctorReminders.fulfilled.match(res)) {
        const list = res.payload || [];
        setPendingDoctorReminders(list);
        setPendingDoctorReminderIds(new Set(list.map(r => r._id?.toString())));
      }
    });
  }, [dispatch, userId]);

  useEffect(() => {
    loadPendingDoctorReminders();
  }, [loadPendingDoctorReminders]);

  /* Whether to offer the cycle calendar. Fetched on its own rather than threaded through
   * getHomeData: that aggregation is large and shared, and this is one boolean the server already
   * derives (female, 11-51, periods regular or irregular). A failure here is silent by design —
   * the slice does not set an error — because most accounts are simply not eligible, and a patient
   * who was never offered the feature should not be told it failed to load. */
  const cycleTrackingEnabled = useSelector(s => s.cycle?.data?.trackingEnabled) === true;
  /* On FOCUS, not on mount. Today is a tab screen and stays mounted, so a mount-only fetch would
   * miss the one moment this answer changes — finishing the health assessment, which is where the
   * question is asked. The button would then not appear until the app was restarted. */
  useFocusEffect(
    useCallback(() => {
      if (!userId || isCaregiver) return;
      dispatch(fetchCycle());
    }, [dispatch, userId, isCaregiver]),
  );

  /* ACCEPTING A FOLLOW-UP IS AN AGREEMENT TO BOOK, so it ends on the booking screen with the
   * doctor and the prescribed date already chosen — the patient can still pick another day,
   * because the date is the doctor's suggestion and not an appointment.
   *
   * The response is recorded FIRST and navigation only follows a successful one: landing on the
   * booking screen while the reminder is still pending would leave the card waiting for an
   * answer the patient has already given.
   *
   * The doctor is passed by id rather than as an object. BookAppointment needs the doctor's real
   * channel list to show the right modes, and a snapshot taken from a reminder issued weeks ago
   * could easily be stale — so the doctor list resolves it live and hands over the fresh record.
   */
  const handleVisitReminderAccept = async reminder => {
    if (!reminder?._id || respondingReminderId) return;
    const id = String(reminder._id);
    setRespondingReminderId(id);
    try {
      await dispatch(
        respondToDoctorReminder({ userId, reminderId: id, status: 'accepted' }),
      ).unwrap();
      loadPendingDoctorReminders();
      navigation.navigate('CuoreCare', {
        screen: 'CuoreCareDoctors',
        params: {
          // The doctor to book with, and the day to open on.
          bookWithDoctorId: reminder.doctorId?._id || reminder.doctorId || null,
          initialDate: reminder.startDate
            ? moment(reminder.startDate).format('YYYY-MM-DD')
            : null,
        },
      });
    } catch (error) {
      setToastType('error');
      setToast('Could not accept this. Please try again.');
    } finally {
      setRespondingReminderId(null);
    }
  };

  const handleVisitReminderDecline = async reminder => {
    if (!reminder?._id || respondingReminderId) return;
    const id = String(reminder._id);
    setRespondingReminderId(id);
    try {
      await dispatch(
        respondToDoctorReminder({ userId, reminderId: id, status: 'declined' }),
      ).unwrap();
      // The card goes as soon as the server has it — declining IS the removal.
      loadPendingDoctorReminders();
      await dispatch(getHomeData(userId));
    } catch (error) {
      setToastType('error');
      setToast('Could not decline this. Please try again.');
    } finally {
      setRespondingReminderId(null);
    }
  };

  const handleReminderRespond = async (item, status) => {
    if (!item?.sourceId || respondingReminderId) return;
    setRespondingReminderId(item.sourceId);
    try {
      await dispatch(
        respondToDoctorReminder({ userId, reminderId: item.sourceId, status }),
      ).unwrap();
      setPendingDoctorReminderIds(prev => {
        const next = new Set(prev);
        next.delete(item.sourceId);
        return next;
      });
      setToastType('success');
      setToast(
        status === 'accepted' ? 'Reminder accepted' : 'Reminder declined',
      );
      // A decline removes today's card server-side — refresh so it disappears here too.
      if (status === 'declined') dispatch(getHomeData(userId));
    } catch (error) {
      setToastType('error');
      setToast('Could not update this reminder. Please try again.');
    } finally {
      setRespondingReminderId(null);
    }
  };

  /* DELETE A REMINDER THE PATIENT OWNS.
   *
   * Declining a doctor's reminder already removes its card, but that is an answer to the doctor,
   * not a way to clear something off your own day — and it only exists while a response is
   * pending. A medication the patient set up, or one they accepted weeks ago and have since
   * stopped taking, had no way off the schedule at all. This is that: the patient's own choice,
   * not a side effect of responding to somebody else.
   *
   * It removes the reminder and EVERY card it generates, on every date — not just today's. That
   * is what the backend's DELETE does (timelineController.deleteReminder drops the source
   * document and all its TimelineCards), so the confirmation says so plainly rather than letting
   * someone discover it tomorrow.
   *
   * A doctor-prescribed reminder gets different wording. Removing a prescription reminder is not
   * the same act as removing "call the pharmacy", and the confirmation should not pretend it is —
   * it also tells them the doctor is not notified, because they are not, and a patient who stops
   * a medicine should know their doctor will not find out this way. */
  const handleDeleteReminder = item => {
    if (isCaregiver || !item?.sourceId || deletingSourceId) return;

    const isMedication = item.type === 'USER_MEDICATION';
    const fromDoctor = item.source === 'doctor' || item.source === 'partner';
    const noun = isMedication ? 'medication reminder' : 'reminder';

    alert(
      `Remove ${item.title}?`,
      fromDoctor
        ? `This ${noun} was added by your doctor. Removing it deletes every future reminder for it, not just today's, and your doctor is not notified.`
        : `This deletes every future reminder for it, not just today's.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeletingSourceId(item.sourceId);
            try {
              await dispatch(
                deleteReminderThunk({ sourceId: item.sourceId, userId }),
              ).unwrap();
              // The day is rebuilt from the reminders themselves, so refetch rather than
              // splicing locally — the same reason a decline refreshes above.
              await dispatch(getHomeData(userId));
              setToastType('success');
              setToast(`${item.title} removed`);
            } catch (error) {
              setToastType('error');
              setToast('Could not remove this reminder. Please try again.');
            } finally {
              setDeletingSourceId(null);
            }
          },
        },
      ],
    );
  };

  // Notification scheduling is handled by the backend via Firebase push notifications.
  // The backend uses the stored fcm_token to send push at the correct time.

  // Auto-refresh every 30 minutes and on new day
  const lastRefreshRef = useRef(Date.now());
  const lastRefreshDateRef = useRef(new Date().toDateString());
  // Tracks whether we've already re-verified the current 401 suspicion, so a
  // logout only happens after TWO consecutive invalid-token responses.
  const sessionRetryRef = useRef(false);

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

  // Confirm-before-logout: a single "invalid or expired token" 401 is treated
  // as a transient blip and re-verified with ONE more fetch. Only if that
  // second fetch also comes back 401 do we conclude the session is genuinely
  // dead and surface the logout. A healthy response clears the suspicion.
  useEffect(() => {
    if (!userId) return;
    const is401 = data?.message === 'Not authorized, invalid or expired token.';
    if (is401) {
      if (sessionRetryRef.current) {
        // Second consecutive 401 — the session is really invalid.
        setSessionExpired(true);
      } else {
        // First 401 — could be a stale/transient token. Verify once.
        sessionRetryRef.current = true;
        dispatch(getHomeData(userId));
      }
    } else if (data) {
      // A healthy payload arrived — reset and stay logged in.
      sessionRetryRef.current = false;
      setSessionExpired(false);
    }
  }, [data, userId, dispatch]);

  const handleLoginRedirect = useCallback(async () => {
    sessionRetryRef.current = false;
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
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
    >
      {AlertComponent}
      <SubscriptionExpiringModal
        visible={subscriptionExpiryVisible}
        onUpdatePayment={handleSubscriptionUpdatePayment}
        onDismiss={handleSubscriptionExpiryDismiss}
      />
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
          <View style={styles.headerTopRow}>
            {/* Opens the app drawer. First thing in the row, where a menu is looked for. */}
            <DrawerMenuButton />
            <Text style={styles.username} numberOfLines={1}>
              {profileData?.display_name
                ? `Hi, ${profileData.display_name.split(' ')[0]}`
                : 'User'}
            </Text>
            {/* Swap user — the family-plan profile switcher. Renders nothing unless the
                account actually has family members, so a single-person account's header is
                unchanged. */}
            <ProfileSwitcher compact style={styles.headerSwitcher} />
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={styles.notificationButton}
              activeOpacity={0.8}
            >
              {/* NOT `buttonIconWrapper`: that style sets overflow:'hidden' so the Add and
                  My-Health buttons can clip their <Image> into a circle (the doctor avatar).
                  Reusing it here clipped the unread badge's top off, and dropping overflow from
                  the shared style would have rendered that avatar square. Visually identical,
                  minus the clipping. */}
              <View style={styles.bellIconWrapper}>
                <Bell size={hp(2)} color="#11418A" />
              </View>
              {/* The badge is a SIBLING of the circle, not a child.
                  It is meant to overhang the circle's top-right corner, and a child cannot do
                  that reliably: the circle clipped it on iOS (overflow:'hidden', needed by the
                  sibling buttons for their avatars) and an elevated view clips overflowing
                  children on some Android versions. As a sibling of the wrapper it is positioned
                  against the untouched, unclipped TouchableOpacity instead. */}
              {unreadNotificationCount > 0 && (
                <View style={styles.notificationBadge} pointerEvents="none">
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          {/* The branding sits on its OWN full-width line, below the greeting row, rather than
              sharing that row with the profile switcher and the bell. Three flexible things on
              one line meant a real clinic name lost: "Sunrise Multispecialty Clinic" either
              shoved the switcher off the right edge or was itself cut to "Sunris…". A full line
              is also what the spec asked for — "show larger and better for branding". */}
          {/* White-labelling (CuoreMD spec) — "show larger and better for branding".
              Reads `branding`, resolved server-side as clinic → the doctor's own practice
              name → the physician (utils/doctorBranding.js). It used to read `clinic`
              alone, so a solo practitioner with a perfectly good practice name on their
              prescriptions got nothing here at all. Still falls back to NOTHING rather than
              to "Cuore": a line captioned with our own product name where a clinic's belongs
              is not white-labelling. */}
          {!!(branding?.name || doctorProfile?.clinic?.name) && (
            <View style={styles.brandRow}>
              {!!(branding?.logoUrl || doctorProfile?.clinic?.logoUrl) && (
                <Image
                  source={{ uri: branding?.logoUrl || doctorProfile.clinic.logoUrl }}
                  style={styles.brandLogo}
                />
              )}
              <View style={styles.brandTextWrap}>
                <Text style={styles.brandName} numberOfLines={1}>
                  {branding?.name || doctorProfile.clinic.name}
                </Text>
                {!!branding?.doctorName && branding.source !== 'physician' && (
                  <Text style={styles.brandDoctor} numberOfLines={1}>
                    {branding.doctorName}
                    {branding.specialization ? ` · ${branding.specialization}` : ''}
                  </Text>
                )}
              </View>
            </View>
          )}
          <View style={styles.headerBottomRow}>
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
                      normalizedDoctorImageUri && !doctorImageLoadFailed
                        ? { uri: normalizedDoctorImageUri }
                        : Images.DEFAULT_DOCTOR
                    }
                    style={
                      normalizedDoctorImageUri && !doctorImageLoadFailed
                        ? styles.healthIconFull
                        : styles.healthIcon
                    }
                    resizeMode={
                      normalizedDoctorImageUri && !doctorImageLoadFailed
                        ? 'cover'
                        : 'contain'
                    }
                    onError={() => setDoctorImageLoadFailed(true)}
                  />
                </View>
                <Text style={styles.healthButtonText}>My{'\n'}Health</Text>
              </TouchableOpacity>
            </View>
          </View>
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

          {/* CYCLE CALENDAR — "Show calendar in Today next to update readings, tapping leads to
              questions."
              Rendered only when the health assessment says this patient has periods and they are
              regular or irregular (the server decides; see controllers/cycleController.js). For
              everyone else the row is exactly as it was — this is not a control most of the app's
              users should be shown and then told they cannot use. */}
          {cycleTrackingEnabled && (
            <TouchableOpacity
              disabled={isCaregiver}
              onPress={() => navigation.navigate('CycleTracker')}
              style={styles.cycleButton}
              activeOpacity={0.85}
              accessibilityLabel="Cycle calendar"
            >
              <CalendarDays size={hp(2.6)} color="#BE123C" />
              <Text style={styles.cycleButtonText}>Cycle</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Pinned above the day, and above the progress bar: a follow-up the doctor asked for
            is the one thing on this screen with a deadline, and it stays here until the patient
            answers it. Renders nothing when there is nothing pending. */}
        {!isCaregiver && (
          <PendingVisitCards
            reminders={pendingDoctorReminders}
            respondingId={respondingReminderId}
            onAccept={handleVisitReminderAccept}
            onDecline={handleVisitReminderDecline}
          />
        )}

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
            {localAlerts.map((item, index) => {
              const alertKey = item.alertId || item.id || String(index);
              const isRespondable = isDoctorCheckinAlert(item?.text);
              const loadingStatus = checkinResponseLoading[alertKey];
              return (
                <View
                  key={item.id || alertKey}
                  style={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
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
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                  </View>
                  {isRespondable && !isCaregiver && (
                    <View style={styles.checkinActionsRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        disabled={!!loadingStatus}
                        onPress={() =>
                          handleRespondCheckin('accepted', alertKey)
                        }
                        style={[
                          styles.checkinActionBtn,
                          styles.checkinAcceptBtn,
                        ]}
                      >
                        {loadingStatus === 'accepted' ? (
                          <ActivityIndicator size="small" color="#065F46" />
                        ) : (
                          <Text
                            style={[
                              styles.checkinActionText,
                              styles.checkinAcceptText,
                            ]}
                          >
                            Accept
                          </Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        disabled={!!loadingStatus}
                        onPress={() =>
                          handleRespondCheckin('declined', alertKey)
                        }
                        style={[
                          styles.checkinActionBtn,
                          styles.checkinDeclineBtn,
                        ]}
                      >
                        {loadingStatus === 'declined' ? (
                          <ActivityIndicator size="small" color="#991B1B" />
                        ) : (
                          <Text
                            style={[
                              styles.checkinActionText,
                              styles.checkinDeclineText,
                            ]}
                          >
                            Decline
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
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
              );
            })}
          </ScrollView>
        </View>

        {/* Alert References Card */}
        <TouchableOpacity
          style={styles.alertRefsCard}
          onPress={() => setShowAlertRefsModal(true)}
          activeOpacity={0.8}
        >
          <Info
            size={Math.max(16, hp(1.85))}
            color="#94A3B8"
            strokeWidth={2}
            style={styles.alertRefsInfoIcon}
          />
          <Text style={styles.alertRefsCardText}>
            {CLINICAL_REFERENCES_LABEL}
          </Text>
          <Text style={styles.alertRefsCardChevron}>›</Text>
        </TouchableOpacity>

        {/* Today's CuoreCare consultations — shown only when there is one, so Home is
            unchanged for patients without a consultation booked today. */}
        {todayConsults.length > 0 && (
          <View style={styles.consultSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {todayConsults.length === 1 ? 'Your consultation today' : 'Your consultations today'}
              </Text>
            </View>
            {todayConsults.map(appt => (
              <ConsultationTimeCard key={appt.appointmentId || appt._id} appointment={appt} />
            ))}
          </View>
        )}

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
              /* Only cards backed by a reminder document the patient owns. SYSTEM cards
               * (Breakfast, Fitness, Lunch) are generated from the plan and have no source
               * document — the DELETE would 404, and a bin that cannot work is worse than no
               * bin. A caregiver has read-only access, so they never see it either. */
              const isDeletable =
                !isCaregiver &&
                !!item?.sourceId &&
                (item.type === 'USER_MEDICATION' || item.type === 'USER_REMINDER');
              const deletingThis = deletingSourceId === item?.sourceId;
              const isPendingDoctorReminder =
                item?.sourceId && pendingDoctorReminderIds.has(item.sourceId);
              const respondingThis = respondingReminderId === item?.sourceId;

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

                      {isDeletable && (
                        <TouchableOpacity
                          disabled={deletingThis}
                          onPress={() => handleDeleteReminder(item)}
                          // The bin is a small target next to the bell; this widens what the
                          // finger has to hit without moving anything on screen.
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={styles.deleteIconButton}
                        >
                          {deletingThis ? (
                            <ActivityIndicator size="small" color="#6B7280" />
                          ) : (
                            <Trash2 size={hp(1.9)} color="#94A3B8" />
                          )}
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
                        {isPendingDoctorReminder && (
                          <View
                            style={{
                              flexDirection: 'row',
                              marginTop: hp(0.8),
                              gap: wp(2),
                            }}
                          >
                            <TouchableOpacity
                              disabled={respondingThis}
                              onPress={() =>
                                handleReminderRespond(item, 'accepted')
                              }
                              style={{
                                backgroundColor: '#11418A',
                                paddingVertical: hp(0.5),
                                paddingHorizontal: wp(3),
                                borderRadius: 14,
                                opacity: respondingThis ? 0.5 : 1,
                              }}
                            >
                              <Text
                                style={{
                                  color: '#fff',
                                  fontSize: 11,
                                  fontFamily: Fonts.semiBold,
                                }}
                              >
                                Accept
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              disabled={respondingThis}
                              onPress={() =>
                                handleReminderRespond(item, 'declined')
                              }
                              style={{
                                borderWidth: 1,
                                borderColor: '#D1D5DB',
                                paddingVertical: hp(0.5),
                                paddingHorizontal: wp(3),
                                borderRadius: 14,
                                opacity: respondingThis ? 0.5 : 1,
                              }}
                            >
                              <Text
                                style={{
                                  color: '#6B7280',
                                  fontSize: 11,
                                  fontFamily: Fonts.semiBold,
                                }}
                              >
                                Decline
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    marginTop: Platform.OS === 'ios' ? hp(0) : hp(1),
    paddingHorizontal: hp(2),
    paddingVertical: hp(1.5),
    backgroundColor: '#FFFFFF',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // No `marginLeft: 'auto'` — the greeting now carries flex:1, which does the pushing.
  headerSwitcher: { marginRight: 10 },
  // Its own full-width line under the greeting row, so a long clinic name has somewhere to go.
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: hp(1.2) },
  brandLogo: { width: 26, height: 26, borderRadius: 6, marginRight: 7, backgroundColor: '#F1F5F9' },
  brandTextWrap: { flex: 1, minWidth: 0 },
  brandName: { fontSize: 14, color: '#16283F', fontFamily: 'Poppins-SemiBold' },
  brandDoctor: { fontSize: 11, color: '#64748B', fontFamily: 'Poppins-Regular', marginTop: -1 },
  username: {
    fontFamily: 'Poppins-Regular',
    fontSize: 18,
    color: '#1E293B',
    letterSpacing: -0.4,
    /* Takes the slack in the header row, and gives it back first. Without this the greeting
     * sized to its own text and pushed the profile switcher clean off the right edge. */
    flex: 1,
    minWidth: 0,
  },
  userIcon: {
    // elevation: 1,

    borderRadius: hp(5),
    tintColor: '#1E64AC',
    width: hp(3),
    height: hp(2),
    resizeMode: 'contain',
  },
  activeTab: { fontFamily: 'Poppins-Medium', fontSize: 14, color: '#11418A' },
  inactiveTab: { fontFamily: 'Poppins-Medium', fontSize: 14, color: '#94A3B8' },
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
  // Sits beside Update Readings and matches its shape, in the rose the calendar itself uses for
  // period days — so the two buttons read as one row of actions rather than a bolted-on extra.
  cycleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    paddingVertical: hp(1.2),
    paddingHorizontal: hp(1.8),
    borderRadius: hp(1.2),
    borderWidth: 1.5,
    borderColor: '#FECDD3',
  },
  cycleButtonText: {
    fontSize: hp(1.4),
    color: '#BE123C',
    fontFamily: Fonts.semiBold,
    marginTop: hp(0.3),
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
  checkinActionsRow: {
    flexDirection: 'row',
    marginTop: hp(1.2),
    gap: hp(0.8),
  },
  checkinActionBtn: {
    minWidth: wp(18),
    paddingVertical: hp(0.7),
    paddingHorizontal: wp(2.5),
    borderRadius: hp(0.8),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinAcceptBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  checkinDeclineBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  checkinActionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
  },
  checkinAcceptText: {
    color: '#065F46',
  },
  checkinDeclineText: {
    color: '#991B1B',
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
    borderColor: '#E5E7EB',
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
    color: '#64748B',
    letterSpacing: -0.2,
  },
  taskCard: {
    flex: 1,
    minWidth: 0,
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
    color: '#334155',
    letterSpacing: -0.2,
  },
  taskDescription: {
    marginTop: 5,
    fontSize: 13,
    color: '#64748B',
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
  },
  // Sized to match the bell and edit icons beside it, so the action column stays one rhythm.
  deleteIconButton: {
    height: hp(2),
    width: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
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
  notificationButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    /* Offset by the wrapper's own marginRight, because this is now positioned against the
       TouchableOpacity (whose width includes that margin) rather than against the circle. Without
       it the badge drifts left and detaches from the bell's corner. */
    right: wp(1.5) - 2,
    minWidth: hp(1.8),
    height: hp(1.8),
    borderRadius: hp(0.9),
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#F8FAFC',
  },
  notificationBadgeText: {
    fontSize: 9,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
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
    backgroundColor: '#DC2626',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3.5),
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    ...Platform.select({
      android: { elevation: 4 },
      ios: { elevation: 6 },
    }),
  },
  /* Same circle as buttonIconWrapper below, minus overflow:'hidden'.
   *
   * Kept as a separate style rather than dropping overflow from the shared one: the Add and
   * My-Health buttons rely on that clipping to round off their <Image>, and the doctor avatar
   * would render square without it. Nothing inside this wrapper needs clipping, and losing
   * overflow also stops iOS clipping the shadow. The badge is NOT a child of this view — see
   * the note at the call site. */
  bellIconWrapper: {
    width: hp(3.5),
    height: hp(3.5),
    borderRadius: hp(1.75),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(1.5),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
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
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 16,
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
  alertRefsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp(4),
    marginVertical: hp(1.5),
    borderRadius: 14,
    padding: hp(1.8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  alertRefsInfoIcon: {
    marginRight: hp(1),
  },
  alertRefsCardText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.15,
    lineHeight: 18,
  },
  alertRefsCardChevron: {
    fontFamily: 'Poppins-Medium',
    fontSize: 20,
    color: '#94A3B8',
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: hp(2.5),
    maxHeight: '80%',
  },
  referencesModalTitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#64748B',
    letterSpacing: 0.15,
    marginBottom: hp(0.5),
  },
  referencesModalSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#64748B',
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
    borderBottomColor: '#F1F5F9',
  },
  referenceParameter: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13.5,
    color: '#11418A',
    marginBottom: 2,
  },
  referenceSource: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  referenceLink: {
    color: '#11418A',
    textDecorationLine: 'underline',
  },
  referencesFootnote: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: '#94A3B8',
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
    color: '#FFFFFF',
  },
});

export default Today;
