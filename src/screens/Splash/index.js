import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {hp, wp, Images} from '../../utilities'; // adjust path accordingly

const Splash = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login'); // use replace to avoid going back to Splash
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Image source={Images.APP_LOGO} style={styles.logo} />
      </View>

      <Text style={styles.title}>Your Everyday Health Companion</Text>
      <Text style={styles.subtitle}>
        Small Steps. Smart Guidance. Better Health
      </Text>
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
    shadowOffset: {width: 0, height: 2},
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
