import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import React from 'react';
import { hp, wp, Images } from '../../utilities';

const ProfileHeader = ({ navigation, title }) => {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        elevation: 1,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          padding: hp(2),
          flexDirection: 'row',
          marginTop: Platform.OS == 'ios' ? hp(5) : hp(1.5),
        }}
      >
        <TouchableOpacity
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={Images.BACK_BUTTON}
            style={{
              height: hp(3),
              width: wp(4),
              resizeMode: 'contain',
              tintColor: '#000000',
            }}
          />
        </TouchableOpacity>

        <Text
          style={{
            fontFamily: 'Roboto-Regular',
            fontSize: 20,
            fontWeight: '400',
            color: '#000000',
            marginLeft: hp(2),
          }}
        >
          {title}
        </Text>
      </View>
    </View>
  );
};

export default ProfileHeader;
