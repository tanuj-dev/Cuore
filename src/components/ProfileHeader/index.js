import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  StyleSheet,
} from 'react-native';
import React, { useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import { hp, wp, Images } from '../../utilities';

const ProfileHeader = ({ navigation, title }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

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

const createStyles = c => StyleSheet.create({
  wrapper: {
    backgroundColor: c.card,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
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
    tintColor: c.navIconTint,
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 20,
    color: c.text,
    marginLeft: hp(2),
    flex: 1,
    letterSpacing: 0.2,
  },
});

export default ProfileHeader;
