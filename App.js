import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import store from './src/redux/store';
import Navigator from './src/navigation';
import { initializeNotifee } from './src/notifications/NotificationService';
import FCMService from './src/notifications/FCMService';
import NetworkError from './src/components/NetworkError';
import SessionExpiredModal from './src/components/SessionExpired';
import ReduxDebugger from './src/components/ReduxDebugger';
import ApiDebugger from './src/components/ApiDebugger';
import { Common } from './src/utilities';
import { setSessionExpired, logout, setFCMToken } from './src/redux/Auth/slice';
import EncryptedStorage from 'react-native-encrypted-storage';
import notifee, { EventType } from '@notifee/react-native';


// Navigation ref to access navigation from outside components
export const navigationRef = React.createRef();

// Inner component that has access to Redux
const AppContent = () => {
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(true);
  const sessionExpired = useSelector(state => state.auth?.sessionExpired);

  // Log entire Redux store state
  useEffect(() => {
    console.log('=== REDUX STORE STATE ===');
    console.log(JSON.stringify(store.getState(), null, 2));
    console.log('========================');
  }, []);

  // Log store changes on every update (useful for debugging)
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      console.log('Store Updated:', store.getState());
    });
    return () => unsubscribe();
  }, []);

  const checkConnectivity = useCallback(async () => {
    try {
      const hasNetwork = await Common.checkNetworkConnection();
      if (!hasNetwork) {
        setIsConnected(false);
        return;
      }
      // Verify actual internet (not just interface up) so modal only dismisses when we can reach the web
      const hasInternet = await Common.checkInternetConnectivity(4000);
      setIsConnected(hasInternet);
    } catch (error) {
      console.warn('Error checking connectivity:', error);
      setIsConnected(false);
    }
  }, []);

  const handleSessionExpired = useCallback(async () => {
    console.log('Session expired - clearing tokens and navigating to login');
    // Clear tokens
    try {
      await EncryptedStorage.removeItem('auth_tokens');
    } catch (error) {
      console.warn('Error clearing tokens:', error);
    }

    // Dispatch logout to clear Redux state
    dispatch(logout());
    dispatch(setSessionExpired(false));

    // Navigate to Login using navigation ref
    if (navigationRef.current) {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [dispatch]);

  useEffect(() => {
    // Set up session expired callback for axios interceptor
    Common.setSessionExpiredCallback(() => {
      dispatch(setSessionExpired(true));
    });

    // Initialize Notifee for local notifications
    initializeNotifee();

    // ── Firebase Cloud Messaging (Push Notifications) ──────────
    let cleanupFCM = () => {};
    FCMService.init({
      onToken: token => {
        console.log('✅ FCM Token ready — saved to Redux:', token);
        dispatch(setFCMToken(token));
      },
      onForeground: async remoteMessage => {
        console.log('📩 FCM Foreground:', remoteMessage);
        // FCM does NOT show notifications automatically in foreground
        // We manually display it using notifee
        await notifee.displayNotification({
          title: remoteMessage.notification?.title || 'Notification',
          body: remoteMessage.notification?.body || '',
          android: {
            channelId: 'health-schedule',
            smallIcon: 'ic_launcher',
            pressAction: { id: 'default' },
          },
        });
      },
      onOpenedFromBg: remoteMessage => {
        console.log('🔔 FCM opened from background:', remoteMessage);
        if (navigationRef.current) {
          navigationRef.current.navigate('Today');
        }
      },
      onOpenedFromQuit: remoteMessage => {
        console.log('🚀 FCM opened from quit:', remoteMessage);
        setTimeout(() => {
          if (navigationRef.current) {
            navigationRef.current.navigate('Today');
          }
        }, 500);
      },
      onRefreshToken: newToken => {
        console.log('🔄 FCM Token refreshed — updated in Redux:', newToken);
        dispatch(setFCMToken(newToken));
      },
    }).then(cleanup => {
      cleanupFCM = cleanup;
    });

    // Check initial connectivity
    checkConnectivity();

    // Subscribe to network state changes for real-time updates
    const unsubscribeNetInfo = Common.subscribeToNetworkChanges(state => {
      setIsConnected(state.isConnected ?? false);
    });

    // Handle notification press events (foreground)
    const unsubscribeNotification = notifee.onForegroundEvent(
      ({ type, detail }) => {
        if (type === EventType.PRESS) {
          console.log(
            '📱 Notification pressed (foreground):',
            detail.notification,
          );
          // Navigate to home page (Today screen)
          if (navigationRef.current) {
            navigationRef.current.navigate('Today');
          }
        }
      },
    );

    // Handle notification press events (background/killed state)
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log(
          '📱 Notification pressed (background):',
          detail.notification,
        );
        // Navigation will happen when app opens
      }
    });

    // Check if app was opened from a notification (background/killed state)
    notifee.getInitialNotification().then(initialNotification => {
      if (initialNotification) {
        console.log('📱 App opened from notification:', initialNotification);
        // Navigate to home page after navigation is ready
        setTimeout(() => {
          if (navigationRef.current) {
            navigationRef.current.navigate('Today');
          }
        }, 500);
      }
    });

    return () => {
      unsubscribeNetInfo();
      unsubscribeNotification();
      cleanupFCM();
    };
  }, [checkConnectivity, dispatch]);

  const handleRetry = useCallback(async () => {
    await checkConnectivity();
  }, [checkConnectivity]);

  return (
    <View style={styles.appContainer}>
      <NavigationContainer ref={navigationRef}>
        <Navigator />
      </NavigationContainer>
      {!isConnected && <NetworkError onRetry={handleRetry} />}
      <SessionExpiredModal
        visible={sessionExpired}
        onLogin={handleSessionExpired}
      />
      {/* Redux Store Debugger - Remove in production */}
      {/* {__DEV__ && <ReduxDebugger />} */}
      {__DEV__ && <ApiDebugger />}
    </View>
  );
};

const App = () => {
  return (
    <View style={styles.appContainer}>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </View>
  );
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default App;
