import React, { useMemo } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { hp, wp } from '../../utilities';

const SessionExpiredModal = ({ visible, onLogin }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const slideAnim = React.useRef(new Animated.Value(hp(100))).current;

  React.useEffect(() => {
    if (visible) {
      // Slide up animation when modal becomes visible
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      // Reset position when hidden
      slideAnim.setValue(hp(100));
    }
  }, [visible, slideAnim]);

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
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
        {/* Top area - transparent, allows system UI access */}
        <View style={styles.topArea} />

        {/* Bottom area with overlay and sheet */}
        <View style={styles.bottomArea}>
          {/* <View style={styles.overlay} /> */}
          <Animated.View
            style={[
              styles.bottomSheet,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.handle} />
            <View style={styles.content}>
              <Text style={styles.icon}>🔒</Text>
              <Text style={styles.title}>Session Expired</Text>
              <Text style={styles.message}>
                Your session has expired. Please log in again to continue using
                the app.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = c => StyleSheet.create({
  container: {
    flex: 1,
  },
  topArea: {
    height: hp(15),
    // Completely transparent - allows system UI gestures to pass through
  },
  bottomArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: c.card,
    borderTopLeftRadius: hp(2.5),
    borderTopRightRadius: hp(2.5),
    paddingTop: hp(2),
    paddingBottom: hp(4),
    paddingHorizontal: wp(5),
    maxHeight: hp(40),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
  },
  handle: {
    width: wp(12),
    height: hp(0.5),
    backgroundColor: c.handleBar,
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
    color: '#DC2626',
    marginBottom: hp(1),
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Roboto-Regular',
    fontSize: hp(1.8),
    color: c.subText,
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
    color: c.card,
    fontSize: hp(1.8),
    fontWeight: '600',
  },
});

export default SessionExpiredModal;
