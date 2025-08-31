import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import {Images, hp, wp} from '../../utilities';

const Login = ({navigation}) => {
  const [tab, setTab] = useState('User');
  return (
    <View style={styles.container}>
      <Image source={Images.APP_LOGO} style={styles.logo} />
      <Text style={styles.loginText}>
        Log in with your registered mobile number
      </Text>
      <View style={styles.card}>
        <View style={styles.switchTabs}>
          <TouchableOpacity
            onPress={() => setTab('User')}
            style={tab == 'User' ? styles.activeTab : styles.inactiveTab}>
            <Text
              style={
                tab == 'User' ? styles.activeTabText : styles.inactiveTabText
              }>
              User
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('Caregiver')}
            style={tab == 'Caregiver' ? styles.activeTab : styles.inactiveTab}>
            <Text
              style={
                tab == 'Caregiver'
                  ? styles.activeTabText
                  : styles.inactiveTabText
              }>
              Caregiver
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.countryCodeContainer}>
            <Text style={styles.countryCode}>+91</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="9876543210"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>
        {tab == 'User' && (
          <TouchableOpacity onPress={() => navigation.navigate('NewAccount')}>
            <Text style={styles.signupText}>
              New user? <Text style={styles.signupLink}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate('OtpScreen')}
          style={styles.verifyButton}>
          <Text style={styles.verifyText}>Verify</Text>
        </TouchableOpacity>
      </View>
      {/* <TouchableOpacity
        onPress={() => navigation.navigate('OtpScreen')}
        style={{
          marginTop: hp(9),
          backgroundColor: '#1E64AC',
          padding: hp(1.5),
          alignItems: 'center',
          borderRadius: hp(0.5),
          marginHorizontal: hp(2),
        }}>
        <Text style={styles.verifyText}>Get OTP</Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: hp(10),
    paddingHorizontal: wp(6),
  },
  logo: {
    width: wp(25),
    height: hp(5),
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: hp(2),
  },
  loginText: {
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    fontSize: hp(1.8),
    color: '#4B5563',
    marginBottom: hp(3),
  },
  card: {
    backgroundColor: 'white',
    padding: hp(2),
    borderRadius: hp(1),
  },
  switchTabs: {
    flexDirection: 'row',
    backgroundColor: '#E9ECEF',
    borderRadius: hp(1),
    marginBottom: hp(2),
  },
  activeTab: {
    flex: 1,
    backgroundColor: '#1E64AC',
    paddingVertical: hp(1.2),
    borderRadius: hp(1),
  },
  inactiveTab: {
    flex: 1,
    paddingVertical: hp(1.2),
  },
  activeTabText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: hp(1.8),
  },
  inactiveTabText: {
    fontFamily: 'Roboto-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: hp(1.8),
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: hp(1),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    marginBottom: hp(1.5),
    alignItems: 'center',
  },
  countryCodeContainer: {
    marginRight: wp(2),
  },
  countryCode: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(2),
    color: '#6B7280',
  },
  phoneInput: {
    fontFamily: 'Roboto-Regular',
    flex: 1,
    fontSize: hp(2),
    color: '#6B7280',
  },
  signupText: {
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    fontSize: hp(1.7),
    color: '#4B5563',
    marginBottom: hp(3),
  },
  signupLink: {
    fontFamily: 'Roboto-Regular',
    color: '#1E64AC',
    fontWeight: '500',
  },
  verifyButton: {
    backgroundColor: '#1E64AC',
    borderRadius: hp(1),
    paddingVertical: hp(1.8),
    alignItems: 'center',
  },
  verifyText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontSize: hp(2),
    fontWeight: '600',
  },
});

export default Login;
