import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { hp, wp, Images } from '../../utilities';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../redux/Auth/authThunk';
import {
  SafeAreaView,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { getProfile } from '../../redux/slices';
import { getCuoreCareStatus } from '../../redux/CuoreCare/thunks';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { getNativeAppVersion } from '../../utilities/Constants';
import SubscriptionExpiringModal from '../../components/SubscriptionExpiringModal';
import { getApiCall, putApiCall } from '../../utilities/Services';
import HealthDataModal from '../../components/HealthDataModal';
import {
  isPaymentEndDateToday,
  navigateToCheckoutFromTabs,
} from '../../utilities/subscriptionExpiry';

const profileOptions = [
  {
    title: 'Caregiver',
    icon: Images.PERSON1,
    section: 'ACCOUNT & PRIVACY',
  },
  {
    title: 'Doctor',

    icon: Images.CAREGIVER,
    section: 'ACCOUNT & PRIVACY',
  },
  {
    title: 'Health Records',
    icon: Images.HEALTH_RECORD,
    section: 'ACCOUNT & PRIVACY',
  },
  {
    title: 'Connected Health Sources',
    icon: Images.HEALTH_RECORD,
    section: 'ACCOUNT & PRIVACY',
  },
  {
    title: 'Health Data',
    icon: Images.HEALTH_RECORD,
    section: 'ACCOUNT & PRIVACY',
  },

  {
    title: 'Delete Account',
    icon: Images.DELETE_ACCOUNT,
    section: 'GENERAL',
  },
  {
    title: 'Support',
    icon: Images.SUPPORT,
    section: 'GENERAL',
  },
  {
    title: 'Subscription',
    icon: Images.HEALTH_RECORD,
    section: 'GENERAL',
  },
  {
    // Lets a patient withdraw record sharing after granting it at their first upload.
    title: 'Record Sharing',
    icon: Images.HEALTH_RECORD,
    section: 'GENERAL',
  },
  {
    title: 'Terms and Conditions',
    icon: Images.TERMS_AND_CONDITION,
    section: 'GENERAL',
  },
  {
    title: 'Logout',
    icon: Images.EXIT,
    section: 'GENERAL',
  },
];

const Profile = ({ navigation }) => {
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();
  // Group the options by section
  const role = useSelector(state => state.auth.role);
  const isCaregiver = role === 'caregiver';
  const [refreshing, setRefreshing] = useState(false);
  const [showWebViewModal, setShowWebViewModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  // Record-sharing consent. Server-held, so it follows the account rather than the device.
  const [showRecordSharing, setShowRecordSharing] = useState(false);
  const [recordConsent, setRecordConsent] = useState({ granted: false, loaded: false });
  const [savingRecordConsent, setSavingRecordConsent] = useState(false);
  const [showHealthDataModal, setShowHealthDataModal] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [isWebViewLoading, setIsWebViewLoading] = useState(false);
  const [subscriptionExpiryVisible, setSubscriptionExpiryVisible] =
    useState(false);
  const subscriptionExpiryShownRef = useRef(false);

  // Filter out items that caregivers shouldn't see
  const filteredOptions = profileOptions.filter(item => {
    if (isCaregiver) {
      // A caregiver views someone else's record. Connecting their own phone's health data
      // to that account would attribute the caregiver's steps and sleep to the patient.
      return (
        item.title !== 'Delete Account' &&
        item.title !== 'Connected Health Sources'
      );
    }
    return true;
  });

  const groupedSections = filteredOptions.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const routeMap = {
    Caregiver: 'EditCaregiver',
    Doctor: 'EditDoctor',
    'Health Records': 'HealthRecords',
    'Connected Health Sources': 'ConnectedHealth',
    // Opens a modal rather than navigating; intercepted in the row handler below.
    'Health Data': 'HealthDataModal',
    'Delete Account': 'DeleteAccount',
    Support: 'Support',
    Subscription: 'SubscriptionDetails',
    'Record Sharing': 'RecordSharingModal',
    'Terms and Conditions': 'TermsAndConditions',
    // Logout: 'Login', // Typically, logout wouldn't navigate to a screen

    // Add more mappings if needed
  };

  const renderSection = (sectionTitle, items) => (
    <View style={styles.sectionContainer} key={sectionTitle}>
      <Text style={styles.sectionHeader}>{sectionTitle}</Text>

      {items.map((item, index) => (
        <TouchableOpacity
          onPress={() => {
            const route = routeMap[item.title]; // Corrected here

            if (route) {
              if (route === 'SubscriptionDetails') {
                setShowSubscriptionModal(true);
                return;
              }
              if (route === 'TermsAndConditions') {
                setWebViewUrl('https://cuore.health/terms');
                setShowWebViewModal(true);
                return;
              }
              if (route === 'HealthDataModal') {
                setShowHealthDataModal(true);
                return;
              }
              if (route === 'RecordSharingModal') {
                loadRecordConsent();
                setShowRecordSharing(true);
                return;
              }

              // Alert.alert(route);
              navigation.navigate(route);
            } else {
              handleLogout();
            }
          }}
          key={index}
          style={[
            styles.item,
            index === items.length - 1 ? styles.itemLast : null,
          ]}
        >
          <Image
            source={item.icon}
            style={[
              styles.itemIcon,
              {
                tintColor: item.title === 'Logout' ? '#EF4444' : '#64748B',
              },
            ]}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.itemText,
              {
                color: item.title === 'Logout' ? '#EF4444' : '#1E293B',
              },
            ]}
          >
            {item?.title}
          </Text>
          <Image
            source={Images.RIGHT_ARROW}
            style={[
              styles.arrowIcon,
              {
                tintColor: item.title === 'Logout' ? '#EF4444' : '#94A3B8',
              },
            ]}
          />
        </TouchableOpacity>
      ))}
      {sectionTitle === 'GENERAL' ? (
        <View style={styles.appVersionWrap}>
          <Text
            style={styles.appVersionText}
            accessibilityLabel={`App version ${getNativeAppVersion()} on ${Platform.OS}`}
          >
            {`${Platform.OS === 'ios' ? 'iOS' : 'Android'} app · v${getNativeAppVersion()}`}
          </Text>
        </View>
      ) : null}
    </View>
  );

  const handleLogout = async () => {
    alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          console.log('LOGOUT CONFIRMED');
          await dispatch(logoutUser());
          // dispatch(resetCreateAccount());
          // Make sure we navigate on the root navigator, not just the Profile stack
          const rootNavigation = navigation.getParent()?.getParent();
          if (rootNavigation) {
            rootNavigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } else {
            // Fallback: try a simple navigate which bubbles up
            navigation.navigate('Login');
          }
        },
      },
    ]);
  };
  const userID = useSelector(state => state?.auth?.userId);
  const userProfile = useSelector(state => state?.profile?.data?.data);
  const cuoreCareSub = useSelector(state => state?.cuoreCare?.subscription);
  // CuoreCare is the superset / effective tier — when it's active, the subscription card
  // reflects it (plan, store platform, dates) instead of the base premium record.
  const basePayment = userProfile?.payment || {};
  const CUORECARE_PLAN_LABELS = {
    monthly: 'CuoreCare · Monthly',
    quarterly: 'CuoreCare · 3 Months',
    annual: 'CuoreCare · 1 Year',
  };
  const CUORECARE_PLATFORM_LABELS = {
    ios: 'App Store',
    android: 'Google Play',
    razorpay: 'Web',
  };
  // Every platform string either tier can carry, mapped to what a user would recognise.
  // Anything unmapped falls through to a title-cased raw value rather than a guess.
  const PLATFORM_LABELS = {
    ...CUORECARE_PLATFORM_LABELS,
    web_registration: 'Web',
    'App Store': 'App Store',
    'Google Play': 'Google Play',
    Web: 'Web',
  };
  const payment = cuoreCareSub?.active
    ? {
        productId: CUORECARE_PLAN_LABELS[cuoreCareSub.plan] || 'CuoreCare',
        status: 'active',
        platform:
          CUORECARE_PLATFORM_LABELS[cuoreCareSub.platform] || cuoreCareSub.platform,
        startDate: cuoreCareSub.startDate,
        endDate: cuoreCareSub.expiryDate,
      }
    : basePayment;
  const toLabel = value =>
    value
      ? String(value)
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())
      : 'N/A';
  const toDateLong = value =>
    value
      ? new Date(value).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '—';

  const subscriptionStatusKey = (payment?.status || '')
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '_');
  const statusBadgeStyle =
    {
      active: { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
      trialing: { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
      expired: { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
      cancelled: { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' },
      canceled: { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' },
      pending: { bg: '#FEF9C3', text: '#854D0E', border: '#FEF08A' },
    }[subscriptionStatusKey] || {
      bg: '#F1F5F9',
      text: '#475569',
      border: '#E2E8F0',
    };

  const hasPaymentDetails = Boolean(
    payment?.productId || payment?.status || payment?.startDate,
  );
  console.log('userProfile', userProfile);
  console.log('userID', userID);
  useEffect(() => {
    if (userID) {
      dispatch(getProfile(userID));
    }
    // Refresh the CuoreCare entitlement so the subscription card shows the right tier/dates.
    dispatch(getCuoreCareStatus());
  }, [userID, dispatch]);

  useEffect(() => {
    if (isCaregiver || subscriptionExpiryShownRef.current) return;
    const endDate = payment?.endDate;
    if (!isPaymentEndDateToday(endDate, payment?.startDate)) return;
    subscriptionExpiryShownRef.current = true;
    setSubscriptionExpiryVisible(true);
  }, [isCaregiver, payment?.endDate, payment?.startDate]);

  const handleSubscriptionUpdatePayment = useCallback(() => {
    setSubscriptionExpiryVisible(false);
    navigateToCheckoutFromTabs(navigation);
  }, [navigation]);

  const handleSubscriptionExpiryDismiss = useCallback(() => {
    setSubscriptionExpiryVisible(false);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    if (userID) {
      dispatch(getProfile(userID)).then(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  };
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {AlertComponent}
      <SubscriptionExpiringModal
        visible={subscriptionExpiryVisible}
        onUpdatePayment={handleSubscriptionUpdatePayment}
        onDismiss={handleSubscriptionExpiryDismiss}
      />
      <View style={styles.headerSection}>
        <Image
          source={Images.APP_LOGO}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl
            title="Pull to refresh"
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#11418A"
          />
        }
        style={styles.container}
      >
        <View style={styles.contentContainer}>
          <View style={styles.paddingContainer}>
            {/* User profile card */}
            <TouchableOpacity
              disabled={role === 'caregiver'}
              onPress={() => navigation.navigate('EditProfile')}
              style={styles.profileCard}
            >
              {userProfile?.user?.photo_url || userProfile?.user?.photoUrl ? (
                <Image
                  key={
                    userProfile?.user?.photo_url || userProfile?.user?.photoUrl
                  }
                  source={{
                    uri: (
                      userProfile?.user?.photo_url ||
                      userProfile?.user?.photoUrl
                    )?.trim(),
                  }}
                  style={[styles.profileImage, { borderRadius: wp(6) }]}
                  onError={error => {
                    console.log(
                      'Profile image load error:',
                      error.nativeEvent?.error || error,
                    );
                    console.log(
                      'Failed to load image URI:',
                      userProfile?.user?.photo_url ||
                        userProfile?.user?.photoUrl,
                    );
                  }}
                  onLoad={() => {
                    console.log('Profile image loaded successfully');
                  }}
                />
              ) : (
                <Image source={Images.UNCLE} style={styles.profileImage} />
              )}
              <View style={styles.nameWrapper}>
                <Text
                  style={styles.name}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {userProfile?.user?.display_name}
                </Text>
              </View>
              <Image source={Images.RIGHT_ARROW} style={styles.profileArrow} />
            </TouchableOpacity>

            {/* Render sections */}
            {Object.entries(groupedSections).map(([sectionTitle, items]) =>
              renderSection(sectionTitle, items),
            )}
            {/* <TouchableOpacity
            onPress={async () => {
              console.log('Logging out...');
           
            }}
          >
            <Text>login</Text>
          </TouchableOpacity> */}
          </View>
        </View>
      </ScrollView>

      {/* Synced Apple Health / Health Connect readings */}
      <HealthDataModal
        visible={showHealthDataModal}
        onClose={() => setShowHealthDataModal(false)}
      />

      {/* Record sharing — grant or withdraw. Withdrawing hides uploads from doctors on the
          server (utils/recordConsent.js); nothing is deleted and the patient keeps them. */}
      <Modal
        visible={showRecordSharing}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRecordSharing(false)}
      >
        <View style={styles.consentBackdrop}>
          <View style={styles.consentCard}>
            <Text style={styles.consentTitle}>Record sharing</Text>
            <Text style={styles.consentBody}>
              {recordConsent.granted
                ? 'Your uploaded records are visible to the doctor treating you.'
                : 'Your uploaded records are hidden from doctors. You can still see them yourself.'}
            </Text>
            <Text style={styles.consentNote}>
              Turning this off never deletes anything. Prescriptions and case sheets your
              doctor issued stay in their own records either way.
            </Text>
            <View style={styles.consentActions}>
              <TouchableOpacity onPress={() => setShowRecordSharing(false)} style={styles.consentCancel}>
                <Text style={styles.consentCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => toggleRecordConsent(!recordConsent.granted)}
                disabled={savingRecordConsent || !recordConsent.loaded}
                style={[
                  styles.consentAgree,
                  recordConsent.granted && styles.consentRevoke,
                  (savingRecordConsent || !recordConsent.loaded) && { opacity: 0.6 },
                ]}
              >
                {savingRecordConsent ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.consentAgreeText}>
                    {recordConsent.granted ? 'Stop sharing' : 'Share my records'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subscription Modal */}
      <Modal
        visible={showSubscriptionModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowSubscriptionModal(false)}
      >
        <SafeAreaProvider>
          <SafeAreaView style={styles.webViewContainer} edges={['top', 'bottom']}>
            <View style={styles.webViewHeader}>
              <Text style={styles.webViewTitle}>Subscription</Text>
              <TouchableOpacity
                onPress={() => setShowSubscriptionModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.subscriptionScroll}
              contentContainerStyle={styles.subscriptionScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.subscriptionHero}>
                <Text style={styles.subscriptionHeroLabel}>Your plan</Text>
                <Text style={styles.subscriptionPlanName} numberOfLines={2}>
                  {hasPaymentDetails
                    ? toLabel(payment?.productId)
                    : 'No subscription on file'}
                </Text>
                {hasPaymentDetails ? (
                  <View
                    style={[
                      styles.subscriptionStatusPill,
                      {
                        backgroundColor: statusBadgeStyle.bg,
                        borderColor: statusBadgeStyle.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.subscriptionStatusDot,
                        { backgroundColor: statusBadgeStyle.text },
                      ]}
                    />
                    <Text
                      style={[
                        styles.subscriptionStatusText,
                        { color: statusBadgeStyle.text },
                      ]}
                    >
                      {toLabel(payment?.status)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.subscriptionHeroHint}>
                    When you subscribe, your billing period and store platform will
                    show here.
                  </Text>
                )}
              </View>

              {hasPaymentDetails ? (
                <View style={styles.subscriptionDetailsCard}>
                  <Text style={styles.subscriptionDetailsHeading}>
                    Billing details
                  </Text>
                  <View style={styles.subscriptionDivider} />
                  <View style={styles.subscriptionDetailRow}>
                    <Text style={styles.subscriptionDetailLabel}>Platform</Text>
                    <Text style={styles.subscriptionDetailValue}>
                      {/* Never substitute the DEVICE's OS for the purchase platform. A user
                          can buy on Android and read this on an iPad, or have no record at
                          all — guessing produced a confident wrong answer ("iOS") where the
                          truth is simply unknown. Backend now sends null in that case. */}
                      {PLATFORM_LABELS[payment?.platform] ||
                        (payment?.platform ? toLabel(payment.platform) : 'Not recorded')}
                    </Text>
                  </View>
                  <View style={styles.subscriptionDetailRow}>
                    <Text style={styles.subscriptionDetailLabel}>Started</Text>
                    <Text style={styles.subscriptionDetailValue}>
                      {toDateLong(payment?.startDate)}
                    </Text>
                  </View>
                  <View style={styles.subscriptionDetailRowLast}>
                    <Text style={styles.subscriptionDetailLabel}>Renews / ends</Text>
                    <Text style={styles.subscriptionDetailValue}>
                      {toDateLong(payment?.endDate)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </ScrollView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>

      {/* WebView Modal for Terms and Conditions */}
      <Modal
        visible={showWebViewModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowWebViewModal(false)}
      >
        <SafeAreaProvider>
          <SafeAreaView style={styles.webViewContainer} edges={['top', 'bottom']}>
            <View style={styles.webViewHeader}>
              <Text style={styles.webViewTitle}>Terms and Conditions</Text>
              <TouchableOpacity
                onPress={() => setShowWebViewModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            {isWebViewLoading && (
              <ActivityIndicator
                size="large"
                color="#11418A"
                style={styles.webViewLoader}
              />
            )}
            <WebView
              source={{ uri: webViewUrl }}
              onLoadStart={() => setIsWebViewLoading(true)}
              onLoadEnd={() => setIsWebViewLoading(false)}
              style={styles.webView}
            />
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: hp(2),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'flex-start',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    backgroundColor: '#F8FAFC',
  },
  paddingContainer: {
    padding: wp(4),
  },
  logo: {
    resizeMode: 'contain',
    width: wp(20),
    height: hp(3),
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: wp(4.5),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2.5),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 4 },
    }),
  },
  profileImage: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    borderWidth: 2,
    borderColor: '#CBD5E1',
    flexShrink: 0,
  },
  nameWrapper: {
    flex: 1,
    minWidth: 0,
    marginLeft: wp(3),
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  profileArrow: {
    resizeMode: 'contain',
    width: wp(5),
    height: wp(5),
    tintColor: '#64748B',
    flexShrink: 0,
  },
  sectionContainer: {
    marginBottom: hp(2.5),
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 0.5,
  },
  sectionHeader: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#64748B',
    marginTop: hp(1),
    marginBottom: hp(1),
    marginLeft: wp(4),
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  item: {
    backgroundColor: '#FFFFFF',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  appVersionWrap: {
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(4),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  appVersionText: {
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.2,
  },
  itemIcon: {
    width: wp(5.5),
    height: wp(5.5),
  },
  itemText: {
    marginLeft: wp(3.5),
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    flex: 1,
    color: '#1E293B',
    letterSpacing: -0.2,
  },
  arrowIcon: {
    width: wp(4),
    height: wp(4),
    resizeMode: 'contain',
    tintColor: '#94A3B8',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 2 },
    }),
  },
  webViewTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#1E293B',
    flex: 1,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 22,
    fontFamily: 'Poppins-Regular',
    color: '#475569',
  },
  webView: {
    flex: 1,
  },
  webViewLoader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
    zIndex: 1,
  },
  consentBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', paddingHorizontal: wp(6) },
  consentCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: wp(5) },
  consentTitle: { fontSize: hp(2), fontWeight: '700', color: '#0F172A', marginBottom: hp(1) },
  consentBody: { fontSize: hp(1.65), color: '#334155', lineHeight: hp(2.3), marginBottom: hp(1) },
  consentNote: { fontSize: hp(1.5), color: '#64748B', lineHeight: hp(2.1) },
  consentActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: hp(1.5) },
  consentCancel: { paddingVertical: hp(1.2), paddingHorizontal: wp(4) },
  consentCancelText: { color: '#64748B', fontSize: hp(1.7), fontWeight: '600' },
  consentAgree: { backgroundColor: '#11418A', borderRadius: 10, paddingVertical: hp(1.2), paddingHorizontal: wp(5), minWidth: wp(34), alignItems: 'center' },
  consentRevoke: { backgroundColor: '#DC2626' },
  consentAgreeText: { color: '#FFFFFF', fontSize: hp(1.7), fontWeight: '700' },
  subscriptionScroll: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  subscriptionScrollContent: {
    paddingBottom: hp(4),
    paddingTop: hp(1),
  },
  subscriptionHero: {
    marginHorizontal: wp(4),
    marginBottom: hp(2),
    paddingVertical: hp(3),
    paddingHorizontal: wp(5),
    borderRadius: 20,
    backgroundColor: '#11418A',
    shadowColor: '#11418A',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 8,
  },
  subscriptionHeroLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: hp(0.6),
  },
  subscriptionPlanName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: hp(1.5),
  },
  subscriptionHeroHint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 21,
  },
  subscriptionStatusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(0.65),
    paddingHorizontal: wp(3.5),
    borderRadius: 999,
    borderWidth: 1,
  },
  subscriptionStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: wp(2),
  },
  subscriptionStatusText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  subscriptionDetailsCard: {
    marginHorizontal: wp(4),
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  subscriptionDetailsHeading: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#1E293B',
    letterSpacing: -0.2,
  },
  subscriptionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: hp(1.5),
  },
  subscriptionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.1),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  subscriptionDetailRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.1),
  },
  subscriptionDetailLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#64748B',
  },
  subscriptionDetailValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#1E293B',
    maxWidth: '58%',
    textAlign: 'right',
  },
});

export default Profile;
