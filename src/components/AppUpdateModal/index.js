import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Linking,
} from 'react-native';
import { hp, wp } from '../../utilities';

const AppUpdateModal = ({ visible, storeUrl }) => {
  const slideAnim = React.useRef(new Animated.Value(hp(100))).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      slideAnim.setValue(hp(100));
    }
  }, [visible, slideAnim]);

  const handleUpdate = () => {
    if (storeUrl) {
      Linking.canOpenURL(storeUrl)
        .then(supported => {
          if (supported) {
            Linking.openURL(storeUrl);
          } else {
            // Fallback to https Play Store URL if market:// scheme unavailable
            Linking.openURL(
              'https://play.google.com/store/apps/details?id=com.cuore',
            );
          }
        })
        .catch(() => {
          Linking.openURL(
            'https://play.google.com/store/apps/details?id=com.cuore',
          );
        });
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      animationType="none"
      visible={visible}
      onRequestClose={() => {}}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <View style={styles.topArea} />
        <View style={styles.bottomArea}>
          <Animated.View
            style={[
              styles.bottomSheet,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.handle} />
            <View style={styles.content}>
              <Text style={styles.icon}>🔄</Text>
              <Text style={styles.title}>Update Required</Text>
              <Text style={styles.message}>
                A new version of Cuore is available. Please update to continue
                using the app.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={handleUpdate}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Update Now</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topArea: {
    height: hp(15),
  },
  bottomArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: hp(2.5),
    borderTopRightRadius: hp(2.5),
    paddingTop: hp(2),
    paddingBottom: hp(4),
    paddingHorizontal: wp(5),
    maxHeight: hp(40),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
  },
  handle: {
    width: wp(12),
    height: hp(0.5),
    backgroundColor: '#D1D5DB',
    borderRadius: hp(0.25),
    alignSelf: 'center',
    marginBottom: hp(2),
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    fontSize: hp(5),
    marginBottom: hp(1.5),
  },
  title: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(2.2),
    fontWeight: '700',
    color: '#11418A',
    marginBottom: hp(1),
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(1.8),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: hp(3),
    lineHeight: hp(2.5),
    paddingHorizontal: wp(2),
  },
  button: {
    backgroundColor: '#1E64AC',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(8),
    borderRadius: hp(1),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
});

export default AppUpdateModal;
