import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import EncryptedStorage from 'react-native-encrypted-storage';
import { setUserData } from '../../redux/Auth/slice';
import { hp, wp, Images } from '../../utilities';

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
              // navigation.replace('Login');
            }, 3000);
            return;
          }

          if (parsed.onboardingStatus !== 'complete') {
            console.log('Onboarding not complete, navigating to Onboarding');
            setTimeout(() => {
              navigation.replace('Login');
            }, 3000);
          } else {
            dispatch(setUserData(parsed));
            setTimeout(() => {
              navigation.replace('Home');
            }, 3000);
          }
        } else {
          setTimeout(() => {
            navigation.replace('Login');
          }, 3000);
        }
      } catch (err) {
        console.log('Error reading token:', err.message);
        setTimeout(() => {
          navigation.replace('Login');
        }, 3000);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkLoginStatus();
  }, [dispatch, navigation]);

  return (
    <View style={styles.container}>
      {/* Content overlay - renders immediately */}
      <View style={styles.contentContainer}>
        <View style={styles.logoShadowWrapper}>
          <View style={styles.logoWrapper}>
            <Image
              source={Images.CUORE}
              style={styles.centeredLogo}
              defaultSource={Images.CUORE}
            />
          </View>
        </View>

        <Text style={styles.title}>Your Everyday Health Companion</Text>
        <Text style={styles.subtitle}>
          Small Steps. Smart Guidance. Better Health
        </Text>

        {checkingAuth && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator
              size="large"
              color="#2563EB"
              style={styles.loader}
            />
          </View>
        )}
      </View>
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
    zIndex: 1,
  },
  logoShadowWrapper: {
    height: wp(50),
    width: wp(50),
    marginBottom: hp(4),
    justifyContent: 'center',
    alignItems: 'center',
    // iOS shadow - applied to wrapper so it's not clipped
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    // Android shadow
    elevation: 8,
  },
  logoWrapper: {
    height: wp(35),
    width: wp(35),
    borderRadius: wp(25),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(3),
    overflow: 'hidden', // This is fine now since shadow is on parent
    elevation: 8,
  },

  centeredLogo: {
    height: hp(50),
    width: wp(50),
    resizeMode: 'contain',
  },
  title: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(2),
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: hp(1.5),
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(1.8),
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: hp(2.5),
    paddingHorizontal: wp(5),
  },
  loaderContainer: {
    marginTop: hp(4),
    padding: wp(3),
    borderRadius: wp(2),
  },
  loader: {
    transform: [{ scale: 1.2 }],
  },
});
