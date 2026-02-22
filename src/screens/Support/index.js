import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';
import ProfileHeader from '../../components/ProfileHeader';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const Support = ({ navigation }) => {
  const { alert, AlertComponent } = useCustomAlert();
  return (
    <>
      {AlertComponent}
      <View style={styles.wrapper}>
        <ProfileHeader navigation={navigation} title="Support" />

        <View style={styles.container}>
          <Text style={styles.heading}>Call our support team</Text>
          <View style={styles.centerSection}>
            <View style={styles.iconContainer}>
              <Image source={Images.PHONE} style={styles.phoneIcon} />
            </View>
            <Text style={styles.supportLineText}>Support Line</Text>
            <TouchableOpacity
              onPress={async () => {
                const url = 'tel:+918595220225';
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                  Linking.openURL(url);
                } else {
                  alert('Error', 'Phone dialer not supported on this device');
                }
              }}
              style={styles.continueBtn}
            >
              <Text style={styles.continueText}>📞 Call +91 85952 20225</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.hoursContainer}>
            <Text style={styles.hoursTitle}>Support Hours</Text>

            <View style={styles.hoursContent}>
              <Text style={styles.hoursDay}>Monday - Saturday</Text>
              <Text style={styles.hoursTime}>9:00 AM - 6:00 PM</Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: wp(5),
    margin: wp(4),
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 4 },
    }),
  },
  heading: {
    fontFamily: 'Poppins-Medium',
    fontSize: 20,
    marginBottom: hp(2),
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  centerSection: {
    alignItems: 'center',
    marginTop: hp(3),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  phoneIcon: {
    height: hp(4.5),
    width: wp(9),
    resizeMode: 'contain',
    tintColor: '#11418A',
  },
  supportLineText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 18,
    marginTop: hp(1),
    color: '#475569',
    letterSpacing: -0.3,
  },
  continueBtn: {
    width: wp(70),
    backgroundColor: '#11418A',
    paddingVertical: hp(2),
    borderRadius: 12,
    alignItems: 'center',
    marginTop: hp(3.5),
    shadowColor: '#11418A',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 0.5 },
      ios: { elevation: 6 },
    }),
  },
  continueText: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    fontSize: 15.5,
    letterSpacing: -0.2,
  },
  hoursContainer: {
    marginTop: hp(6),
    backgroundColor: '#F1F5F9',
    padding: hp(2.5),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hoursTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  hoursContent: {
    marginTop: hp(1.5),
  },
  hoursDay: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#64748B',
    marginBottom: hp(0.5),
    letterSpacing: 0.1,
  },
  hoursTime: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#64748B',
    letterSpacing: 0.1,
  },
});

export default Support;
