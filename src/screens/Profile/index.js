import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import {hp, wp, Images} from '../../utilities';

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
];

const Profile = ({navigation}) => {
  // Group the options by section
  const groupedSections = profileOptions.reduce((acc, item) => {
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
              // Alert.alert(route);
              navigation.navigate(route);
            } else {
              Alert.alert('Route not found');
            }
          }}
          key={index}
          style={styles.item}>
          <Image
            source={item.icon}
            style={styles.itemIcon}
            resizeMode="contain"
          />
          <Text style={styles.itemText}>{item.title}</Text>
          <Image source={Images.RIGHT_ARROW} style={styles.arrowIcon} />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Logo at the top */}
      <View style={{   padding: hp(2),  elevation: 2,
          // height: hp(7),
          backgroundColor: '#FFFFFF',}}> 
         <View
        style={{
        marginTop:Platform.OS =='ios'&& hp(5),
          justifyContent: 'center',
        
        }}>
        <Image
          source={Images.APP_LOGO}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      </View>
     
      <View style={{padding: wp(4)}}>
        {/* User profile card */}
        <TouchableOpacity
          onPress={() => navigation.navigate('EditProfile')}
          style={styles.profileCard}>
          <Image source={Images.UNCLE} style={styles.profileImage} />
          <Text style={styles.name}>M. Johnson</Text>
          <Image source={Images.RIGHT_ARROW} style={styles.profileArrow} />
        </TouchableOpacity>

        {/* Render sections */}
        {Object.entries(groupedSections).map(([sectionTitle, items]) =>
          renderSection(sectionTitle, items),
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  logo: {
    // backgroundColor:'red',
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
    shadowOffset: {width: 0, height: 1},
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
    // tintColor: 'black',
  },
});

export default Profile;
