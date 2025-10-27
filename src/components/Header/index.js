import {
  View,
  Text,
  Platform,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import React from 'react';
import { hp, wp, Images } from '../../utilities';

const Header = ({ title, navigation }) => {
  return (
    <View>
      <View
        style={{
          paddingVertical: Platform.OS === 'ios' ? hp(2) : hp(1),
          flexDirection: 'row',
          marginTop: Platform.OS == 'ios' && hp(5),
          alignItems: 'center',
          elevation: 1,
          backgroundColor: '#FFFFFF',
        }}
      >
        <TouchableOpacity
          style={{
            paddingHorizontal: hp(1),
            marginTop: Platform.OS == 'android' && hp(1),
          }}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={Images.BACK_BUTTON} // Replace with actual key in your `images` object
            style={{
              resizeMode: 'contain',
              height: hp(3.5),
              width: wp(4),
              marginLeft: Platform.OS == 'ios' ? hp(2) : hp(0.2),
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Roboto-Regular',
    marginTop: Platform.OS == 'ios' ? hp(1) : hp(3),
    marginLeft: hp(10),
    fontSize: 20,
    fontWeight: '400',
    marginBottom: hp(2),
    alignSelf: 'center',
    color: '#000000',
  },
});

export default Header;
