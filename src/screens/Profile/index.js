import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAIAssistant } from '../../components/AIAssistant';
import { WebView } from 'react-native-webview';
import { hp, wp, Images } from '../../utilities';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../redux/Auth/authThunk';
import {
  SafeAreaView,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { getProfile } from '../../redux/slices';
import { useCustomAlert } from '../../hooks/useCustomAlert';

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
  const { isEnabled: aiEnabled, toggleEnabled: toggleAI } = useAIAssistant();
  // Group the options by section
  const role = useSelector(state => state.auth.role);
  const isCaregiver = role === 'caregiver';
  const [refreshing, setRefreshing] = useState(false);
  const [showWebViewModal, setShowWebViewModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [isWebViewLoading, setIsWebViewLoading] = useState(false);

  // Filter out items that caregivers shouldn't see
  const filteredOptions = profileOptions.filter(item => {
    if (isCaregiver) {
      return item.title !== 'Delete Account';
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
    'Delete Account': 'DeleteAccount',
    Support: 'Support',
    Subscription: 'SubscriptionDetails',
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

              // Alert.alert(route);
              navigation.navigate(route);
            } else {
              handleLogout();
            }
          }}
          key={index}
          style={styles.item}
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
  const payment = userProfile?.payment || {};
  const toLabel = value =>
    value
      ? String(value)
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())
      : 'N/A';
  const toDate = value =>
    value ? new Date(value).toLocaleDateString() : 'N/A';
  console.log('userProfile', userProfile);
  console.log('userID', userID);
  useEffect(() => {
    if (userID) {
      dispatch(getProfile(userID));
    }
  }, [userID, dispatch]);

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

            {/* AI Assistant toggle section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>AI ASSISTANT</Text>
              <View style={styles.item}>
                {/* Gradient sparkle icon */}
                <View style={aiStyles.iconCircle}>
                  <Text style={aiStyles.iconText}>✦</Text>
                </View>
                <View style={aiStyles.labelCol}>
                  <Text style={aiStyles.label}>Cuore AI</Text>
                  <Text style={aiStyles.sub}>
                    {aiEnabled ? 'Floating assistant is active' : 'Floating assistant is off'}
                  </Text>
                </View>
                <Switch
                  value={aiEnabled}
                  onValueChange={toggleAI}
                  trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                  thumbColor={aiEnabled ? '#1D6FE8' : '#94A3B8'}
                  ios_backgroundColor="#CBD5E1"
                />
              </View>
            </View>

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
            <View style={styles.subscriptionContent}>
              <View style={styles.subscriptionCard}>
                <Text style={styles.subscriptionTitle}>Current Plan</Text>
                <Text style={styles.subscriptionRow}>
                  Plan: {toLabel(payment?.productId)}
                </Text>
                <Text style={styles.subscriptionRow}>
                  Status: {toLabel(payment?.status)}
                </Text>
                <Text style={styles.subscriptionRow}>
                  Platform: {toLabel(payment?.platform)}
                </Text>
                <Text style={styles.subscriptionRow}>
                  Start Date: {toDate(payment?.startDate)}
                </Text>
                <Text style={styles.subscriptionRow}>
                  End Date: {toDate(payment?.endDate)}
                </Text>
              </View>
            </View>
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
  subscriptionContent: {
    padding: wp(4),
  },
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: wp(4),
  },
  subscriptionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#1E293B',
    marginBottom: hp(1.2),
  },
  subscriptionRow: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#475569',
    marginBottom: hp(0.8),
  },
});

const aiStyles = StyleSheet.create({
  iconCircle: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  iconText: {
    fontSize: 16,
    color: '#4F46E5',
  },
  labelCol: {
    flex: 1,
    marginLeft: wp(3.5),
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#1E293B',
    letterSpacing: -0.2,
  },
  sub: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
});

export default Profile;
