import {
  View,
  Text,
  Platform,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import React, { useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import { hp, wp, Images } from '../../utilities';
import { SafeAreaView } from 'react-native-safe-area-context';

const Header = ({ title, navigation }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFFFFF' }}>
      <View
        style={{
          flexDirection: 'row',

          alignItems: 'center',

          backgroundColor: '#FFFFFF',
        }}
      >
        <TouchableOpacity
          style={{
            hitSlop: { top: 20, bottom: 20, left: 20, right: 20 },
            paddingHorizontal: hp(1),
            // marginTop: Platform.OS == 'android' && hp(1),
          }}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={Images.BACK_BUTTON} // Replace with actual key in your `images` object
            style={{
              resizeMode: 'contain',
              height: hp(3.5),
              width: wp(4),
              marginLeft: Platform.OS == 'ios' ? hp(2) : hp(1),
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>
    </SafeAreaView>
  );
};

const createStyles = c => StyleSheet.create({
  title: {
    fontFamily: 'Roboto-Regular',
    marginTop: Platform.OS == 'ios' ? hp(1) : hp(1),
    marginLeft: hp(10),
    fontSize: 20,
    fontWeight: '400',
    marginBottom: hp(2),
    alignSelf: 'center',
    color: '#000000',
  },
});

export default Header;
