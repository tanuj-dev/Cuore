import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { hp, wp } from '../../utilities';

const SubscriptionExpiringModal = ({
  visible,
  onUpdatePayment,
  onDismiss,
}) => {
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

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onDismiss}
        />
        <View style={styles.bottomArea}>
          <Animated.View
            style={[
              styles.bottomSheet,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.handle} />
            <View style={styles.content}>
              <Text style={styles.icon}>📅</Text>
              <Text style={styles.title}>Subscription ending today</Text>
              <Text style={styles.message}>
                Your plan ends today. Update your payment to keep full access
                to Cuore.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onUpdatePayment}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Update payment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onDismiss}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Later</Text>
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
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  bottomArea: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: hp(2.5),
    borderTopRightRadius: hp(2.5),
    paddingTop: hp(2),
    paddingBottom: hp(4),
    paddingHorizontal: wp(5),
    maxHeight: hp(48),
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
    color: '#B45309',
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
  primaryButton: {
    backgroundColor: '#1E64AC',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(8),
    borderRadius: hp(1),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Roboto-Regular',
    color: '#FFFFFF',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: hp(1.2),
    paddingVertical: hp(1.2),
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'Roboto-Regular',
    color: '#64748B',
    fontSize: hp(1.75),
    fontWeight: '500',
  },
});

export default SubscriptionExpiringModal;
