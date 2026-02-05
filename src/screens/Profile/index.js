import React, { use, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  RefreshControl,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';
// import { useSelector } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/Auth/slice';
import EncryptedStorage from 'react-native-encrypted-storage';
import { resetCreateAccount } from '../../redux/Auth/slice';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    title: 'Select Persona',
    icon: Images.SELECT_PERSONA,
    section: 'ACCOUNT & PRIVACY',
  },
  {
    title: 'Health Records',
    icon: Images.HEALTH_RECORD,
    section: 'ACCOUNT & PRIVACY',
  },

  {
    title: 'Renew Subscription',
    icon: Images.RENEW_SUBSCRIPTION,
    section: 'GENERAL',
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

  // Filter out items that caregivers shouldn't see
  const filteredOptions = profileOptions.filter(item => {
    if (isCaregiver) {
      return (
        item.title !== 'Select Persona' &&
        item.title !== 'Delete Account' &&
        item.title !== 'Renew Subscription'
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
    'Select Persona': 'SelectPersona',
    'Health Records': 'HealthRecords',
    'Renew Subscription': 'Checkout',
    'Delete Account': 'DeleteAccount',
    Support: 'Support',
    'Terms and Conditions': 'TermsAndConditions',
    // Logout: 'Login', // Typically, logout wouldn't navigate to a screen

    // Add more mappings if needed
  };

  const renderSection = (sectionTitle, items) => (
    <View style={styles.sectionContainer} key={sectionTitle}>
      <Text style={styles.sectionHeader}>{sectionTitle}</Text>

      {items.map((item, index) => (
        <TouchableOpacity
          disabled={item.title === 'Select Persona' ? true : false}
          onPress={() => {
            const route = routeMap[item.title]; // Corrected here

            if (route) {
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
                tintColor:
                  item.title === 'Logout'
                    ? '#FF3D00'
                    : item.title === 'Select Persona'
                    ? '#6B7280'
                    : '#000000',
              },
            ]}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.itemText,
              {
                color:
                  item.title === 'Logout'
                    ? '#FF3D00'
                    : item.title === 'Select Persona'
                    ? '#6B7280'
                    : '#000000',
              },
            ]}
          >
            {item?.title}
          </Text>
          <Image
            source={Images.RIGHT_ARROW}
            style={[
              styles.arrowIcon,
              { tintColor: item.title === 'Logout' ? '#FF3D00' : '#000000' },
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
          console.log(
            'Existing auth_tokens before logout:',
            await EncryptedStorage.getItem('auth_tokens'),
          );
          await EncryptedStorage.removeItem('auth_tokens');
          // await EncryptedStorage.removeItem('userid');
          dispatch(logout());
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
  console.log('userProfile', userProfile);
  console.log('userID', userID);
  useEffect(() => {
    if (userID) {
      dispatch(getProfile(userID));
    }
  }, [userID]);

  const onRefresh = () => {
    setRefreshing(true);
    if (userID) {
      dispatch(getProfile(userID)).then(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  };
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      {AlertComponent}
      <ScrollView
        refreshControl={
          <RefreshControl
            title="Pull to refresh"
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        style={styles.container}
      >
        <View style={{ backgroundColor: '#FAFAFA' }}>
          {/* Logo at the top */}
          <View
            style={{
              padding: hp(2),
              elevation: 2,
              // height: hp(7),
              backgroundColor: '#FFFFFF',
            }}
          >
            <View
              style={{
                justifyContent: 'center',
              }}
            >
              <Image
                source={Images.APP_LOGO}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={{ padding: wp(4) }}>
            {/* User profile card */}
            <TouchableOpacity
              disabled={role === 'caregiver'}
              onPress={() => navigation.navigate('EditProfile')}
              style={styles.profileCard}
            >
              {userProfile?.user?.photo_url || userProfile?.user?.photoUrl ? (
                <Image
                  key={userProfile?.user?.photo_url || userProfile?.user?.photoUrl}
                  source={{ 
                    uri: (userProfile?.user?.photo_url || userProfile?.user?.photoUrl)?.trim()
                  }}
                  style={[styles.profileImage, { borderRadius: wp(6) }]}
                  onError={(error) => {
                    console.log('Profile image load error:', error.nativeEvent?.error || error);
                    console.log('Failed to load image URI:', userProfile?.user?.photo_url || userProfile?.user?.photoUrl);
                  }}
                  onLoad={() => {
                    console.log('Profile image loaded successfully');
                  }}
                />
              ) : (
                <Image source={Images.UNCLE} style={styles.profileImage} />
              )}
              <Text style={styles.name}>{userProfile?.user?.display_name}</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  logo: {
    // backgroundColor:'red',
    resizeMode: 'contain',
    width: wp(20),
    height: hp(3),
    // marginBottom: hp(2),
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(3),
    padding: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  profileImage: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
  },
  name: {
    fontFamily: 'Roboto-Regular',
    marginLeft: wp(3),
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
    color: '#000000',
  },
  profileArrow: {
    resizeMode: 'contain',
    width: wp(4),
    height: wp(4),
  },
  sectionContainer: {
    marginBottom: hp(2),
  },
  sectionHeader: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
    marginTop: hp(1),
    marginBottom: hp(2),
    marginLeft: hp(2),
  },
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(2),
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    // marginBottom: hp(0.8),
  },
  itemIcon: {
    width: wp(5),
    height: wp(5),
    tintColor: '#000000',
  },
  itemText: {
    marginLeft: wp(4),
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
    color: '#000000',
  },
  arrowIcon: {
    width: wp(4),
    height: wp(4),
    resizeMode: 'contain',
    tintColor: 'black',
  },
});

export default Profile;
