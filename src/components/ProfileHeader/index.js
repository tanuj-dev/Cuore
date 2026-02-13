import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  StyleSheet,
} from 'react-native';
import React from 'react';
import { hp, wp, Images } from '../../utilities';

const ProfileHeader = ({ navigation, title }) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <TouchableOpacity
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Image source={Images.BACK_BUTTON} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...(Platform.OS === 'android' && { elevation: 0.5 }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(2),
    marginTop: Platform.OS === 'ios' ? hp(1) : hp(1.5),
  },
  backButton: {
    paddingVertical: hp(0.5),
  },
  backIcon: {
    height: hp(3.5),
    width: wp(4),
    resizeMode: 'contain',
    tintColor: '#1E293B',
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 20,
    color: '#1E293B',
    marginLeft: hp(2),
    flex: 1,
    letterSpacing: 0.2,
  },
});

export default ProfileHeader;
