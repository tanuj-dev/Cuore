import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Linking,
} from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
import { hp, wp, Images } from '../../utilities'; // your responsive helpers
import Profile from '../Profile';
import ProfileHeader from '../../components/ProfileHeader';

const Support = ({ navigation }) => {
  return (
    <View>
      <ProfileHeader navigation={navigation} title="Support" />

      <View style={styles.container}>
        <Text style={styles.heading}>Call our support team</Text>
        <View style={{ alignItems: 'center', marginTop: hp(4) }}>
          <Image
            source={Images.PHONE}
            style={{
              height: hp(4),
              width: wp(7),
              resizeMode: 'contain',
              // tintColor: '#000000',
            }}
          />
          <Text style={[styles.heading, { marginTop: hp(1) }]}>
            support Line
          </Text>
          <TouchableOpacity
            onPress={async () => {
              const url = `tel:${1 - 800 - 123 - 4567}`;
              const supported = await Linking.canOpenURL(url);
              if (supported) {
                Linking.openURL(url);
              } else {
                Alert.alert(
                  'Error',
                  'Phone dialer not supported on this device',
                );
              }
            }}
            style={styles.continueBtn}
          >
            <Text style={styles.continueText}>Call 1-800-123-4567</Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            marginTop: hp(6),
            backgroundColor: '#F9FAFB',
            padding: hp(2),
            borderRadius: hp(1),
          }}
        >
          <Text
            style={{
              fontFamily: 'Roboto-Regular',
              fontWeight: '400',
              fontSize: 14,
              color: '#000000',
            }}
          >
            Support Hours
          </Text>

          <View style={{ marginTop: hp(1) }}>
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontWeight: '400',
                fontSize: 14,
                color: '#4B5563',
              }}
            >
              Monday - Saturday
            </Text>
            <Text
              style={{
                fontFamily: 'Roboto-Regular',
                fontWeight: '400',
                fontSize: 14,
                color: '#4B5563',
              }}
            >
              9:00 AM - 6:00 PM
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: wp(5),
    margin: wp(4),
    backgroundColor: '#fff',
    borderRadius: 12,
    height: hp(80),
  },
  heading: {
    fontFamily: 'Roboto-Regular',
    fontSize: 18,
    fontWeight: '400',
    marginBottom: hp(2),
    color: '#000000',
  },
  roleCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: wp(4),
    marginBottom: hp(2),
    backgroundColor: '#fff',
  },

  continueBtn: {
    width: wp(70),
    backgroundColor: '#1E64AC',
    paddingVertical: hp(1.8),
    borderRadius: 8,
    alignItems: 'center',
    marginTop: hp(4),
  },
  continueText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
  },
});

export default Support;
