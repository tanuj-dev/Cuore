import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import EncryptedStorage from 'react-native-encrypted-storage';
import { setUserData } from '../../redux/Auth/slice';
import { hp, wp, Images, Strings } from '../../utilities';

const Splash = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const authState = useSelector(state => state.auth);
  useEffect(() => {
    console.log('Redux auth state:', authState);
  }, [authState]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      console.log('Checking auth tokens in storage...');
      try {
        const tokenData = await EncryptedStorage.getItem('auth_tokens');
        console.log('Token data retrieved:', tokenData);

        if (tokenData) {
          const parsed = JSON.parse(tokenData);
          console.log('Parsed token data:', parsed);

          const access_token = parsed.accessToken;
          console.log('Access Token:', access_token);

          if (!access_token) {
            await EncryptedStorage.removeItem('auth_tokens');
            setTimeout(() => {
              navigation.replace('Login');
            }, 1000);
            return;
          }

          if (parsed.onboardingStatus !== 'complete') {
            console.log('Onboarding not complete, navigating to Onboarding');
            setTimeout(() => {
              navigation.replace('OnBoarding');
            }, 1000);
          } else {
            dispatch(setUserData(parsed));
            setTimeout(() => {
              navigation.replace('Home');
            }, 1000);
          }
        } else {
          setTimeout(() => {
            navigation.replace('Login');
          }, 1000);
        }
      } catch (err) {
        console.log('Error reading token:', err.message);
        setTimeout(() => {
          navigation.replace('Login');
        }, 1000);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Image source={Images.APP_LOGO} style={styles.logo} />
      </View>

      <Text style={styles.title}>Your Everyday Health Companion</Text>
      <Text style={styles.subtitle}>
        Small Steps. Smart Guidance. Better Health
      </Text>

      {checkingAuth && (
        <ActivityIndicator
          size="small"
          color="#2563EB"
          style={{ marginTop: hp(2) }}
        />
      )}
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  logoWrapper: {
    height: wp(32),
    width: wp(32),
    borderRadius: wp(32) / 2,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: hp(3),
  },
  logo: {
    height: wp(20),
    width: wp(27),
    resizeMode: 'contain',
  },
  title: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(2.2),
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: hp(1),
  },
  subtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(1.6),
    color: '#4B5563',
    textAlign: 'center',
  },
});
