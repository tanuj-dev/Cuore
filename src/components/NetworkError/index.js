import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { hp, wp, Common } from '../../utilities';

const NetworkError = ({ onRetry }) => {
  const [isChecking, setIsChecking] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(hp(100))).current;

  React.useEffect(() => {
    // Slide up animation when component mounts
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [slideAnim]);

  const handleRetry = useCallback(async () => {
    setIsChecking(true);
    try {
      // Use network utility to check both network connection and internet connectivity
      const networkConnected = await Common.checkNetworkConnection();

      if (networkConnected) {
        // Also verify actual internet access
        const internetAccessible = await Common.checkInternetConnectivity(3000);

        if (internetAccessible && onRetry) {
          await onRetry();
        } else if (onRetry) {
          // Network connected but no internet - still call onRetry to update state
          await onRetry();
        }
      } else if (onRetry) {
        // No network connection - call onRetry to update state
        await onRetry();
      }
    } catch (error) {
      console.warn('Error checking connectivity in NetworkError:', error);
      // Still call onRetry to update state
      if (onRetry) {
        await onRetry();
      }
    } finally {
      setIsChecking(false);
    }
  }, [onRetry]);

  return (
    <Modal
      transparent={true}
      animationType="none"
      visible={true}
      onRequestClose={() => {}}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        {/* Top area - completely transparent, allows system UI access */}
        <View style={styles.topArea} pointerEvents="none" />

        {/* Bottom area with overlay and sheet */}
        <View style={styles.bottomArea} pointerEvents="box-none">
          {/* Overlay only covers bottom portion */}
          <View style={styles.overlay} pointerEvents="auto" />
          <Animated.View
            style={[
              styles.bottomSheet,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.handle} />
            <View style={styles.content} pointerEvents="auto">
              <Text style={styles.icon}>📡</Text>
              <Text style={styles.title}>No Internet Connection</Text>
              <Text style={styles.message}>
                Please check your internet connection and try again.
              </Text>

              {isChecking ? (
                <ActivityIndicator
                  size="large"
                  color="#1E64AC"
                  style={styles.loader}
                />
              ) : (
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleRetry}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>Refresh & Connect</Text>
                </TouchableOpacity>
              )}
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
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
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
  loader: {
    marginTop: hp(1),
  },
});

export default NetworkError;
