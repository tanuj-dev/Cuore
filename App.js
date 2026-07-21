import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Platform, AppState } from 'react-native';
import axios from 'axios';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import store from './src/redux/store';
import Navigator from './src/navigation';
import { initializeNotifee } from './src/notifications/NotificationService';
import FCMService from './src/notifications/FCMService';
import NetworkError from './src/components/NetworkError';
import SessionExpiredModal from './src/components/SessionExpired';
import AppUpdateModal from './src/components/AppUpdateModal';
import ReduxDebugger from './src/components/ReduxDebugger';
import ApiDebugger from './src/components/ApiDebugger';
import { Common } from './src/utilities';
import Constants, {
  getNativeAppVersion,
  STORE_URL,
} from './src/utilities/Constants';
import Endpoints from './src/utilities/Endpoints';
import { setSessionExpired, setFCMToken } from './src/redux/Auth/slice';
import { logoutUser, sendHeartbeatThunk } from './src/redux/Auth/authThunk';
import notifee, { EventType } from '@notifee/react-native';

const isOutdated = (current, minimum) => {
  const c = current.split('.').map(Number);
  const m = minimum.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((c[i] || 0) < (m[i] || 0)) return true;
    if ((c[i] || 0) > (m[i] || 0)) return false;
  }
  return false;
};

// Navigation ref to access navigation from outside components
export const navigationRef = React.createRef();

// Inner component that has access to Redux
const AppContent = () => {
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStoreUrl, setUpdateStoreUrl] = useState('');
  const sessionExpired = useSelector(state => state.auth?.sessionExpired);
  const userId = useSelector(state => state.auth?.userId);
  const appStateRef = useRef(AppState.currentState);

  const navigateFromNotification = useCallback((screen = 'Today') => {
    const tryNavigate = attempt => {
      if (navigationRef.current?.isReady?.()) {
        navigationRef.current.navigate(screen);
        return;
      }

      if (attempt < 10) {
        setTimeout(() => tryNavigate(attempt + 1), 200);
      }
    };

    tryNavigate(0);
  }, []);

  // Resolve the deep-link target from a notification's data payload.
  // The backend sends data.screen (e.g. 'OnBoarding', 'HealthRecords',
  // 'RenewSubscription', 'Today'); anything unknown falls back to Today.
  const resolveScreen = useCallback(data => {
    const allowed = [
      'Today',
      'OnBoarding',
      'HealthRecords',
      'RenewSubscription',
    ];
    const target = data?.screen;
    return allowed.includes(target) ? target : 'Today';
  }, []);

  // Keep the launcher badge in sync with the notification tray: the badge count
  // mirrors how many notifications are still showing. When the user dismisses
  // them the count drops to 0 — no need to open the app. (The killed/background
  // case is handled by the module-level onBackgroundEvent in index.js.)
  const syncBadgeToTray = useCallback(async () => {
    try {
      const displayed = await notifee.getDisplayedNotifications();
      await notifee.setBadgeCount(displayed.length);
    } catch (e) {
      console.warn('[badge] sync failed:', e?.message);
    }
  }, []);

  useEffect(() => {
    syncBadgeToTray();
    const badgeSub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        syncBadgeToTray();
      }
    });
    return () => badgeSub.remove();
  }, [syncBadgeToTray]);

  useEffect(() => {
    const checkAppVersion = async () => {
      try {
        const res = await axios.get(
          Constants.BASEURL + Endpoints.CHECK_APP_VERSION,
          { timeout: 5000 },
        );
        const platformData =
          Platform.OS === 'ios' ? res.data?.ios : res.data?.android;
        if (
          platformData?.minVersion &&
          isOutdated(getNativeAppVersion(), platformData.minVersion)
        ) {
          setUpdateStoreUrl(platformData.storeUrl || STORE_URL);
          setShowUpdateModal(true);
        }
      } catch (_err) {
        // API unreachable — skip silently
      }
    };
    checkAppVersion();
  }, []);

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
    await dispatch(logoutUser({ skipRemote: true }));
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
    let cancelled = false;
    FCMService.init({
      onToken: token => {
        if (cancelled) return;
        console.log('✅ FCM Token ready — saved to Redux:', token);
        dispatch(setFCMToken(token));
      },
      onForeground: async remoteMessage => {
        if (cancelled) return;
        console.log('📩 FCM Foreground:', remoteMessage);
        // iOS: willPresent in AppDelegate shows the banner automatically.
        // Android: FCM does not show foreground notifications — use Notifee.
        if (Platform.OS === 'android') {
          const id =
            remoteMessage.messageId ||
            `${remoteMessage.notification?.title || ''}-${Date.now()}`;
          await notifee.displayNotification({
            id,
            title: remoteMessage.notification?.title || 'Notification',
            body: remoteMessage.notification?.body || '',
            // Carry the deep-link target so the press handler can route
            data: { screen: resolveScreen(remoteMessage.data) },
            android: {
              channelId: 'health-schedule',
              smallIcon: 'ic_launcher',
              pressAction: { id: 'default' },
            },
          });
        }
      },
      onOpenedFromBg: remoteMessage => {
        if (cancelled) return;
        console.log('🔔 FCM opened from background:', remoteMessage);
        navigateFromNotification(resolveScreen(remoteMessage?.data));
      },
      onOpenedFromQuit: remoteMessage => {
        if (cancelled) return;
        console.log('🚀 FCM opened from quit:', remoteMessage);
        navigateFromNotification(resolveScreen(remoteMessage?.data));
      },
      onRefreshToken: newToken => {
        if (cancelled) return;
        console.log('🔄 FCM Token refreshed — updated in Redux:', newToken);
        dispatch(setFCMToken(newToken));
        // Push the rotated token to the backend immediately so it never holds a
        // dead token while the app stays foregrounded (otherwise it would wait
        // for the next background→foreground heartbeat).
        dispatch(sendHeartbeatThunk());
      },
    }).then(cleanup => {
      if (cancelled) {
        cleanup();
      } else {
        cleanupFCM = cleanup;
      }
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
          navigateFromNotification(resolveScreen(detail.notification?.data));
        }
        if (type === EventType.DISMISSED || type === EventType.DELIVERED) {
          // A notification was added or swiped away — re-sync the badge.
          syncBadgeToTray();
        }
      },
    );

    // Check if app was opened from a notification (background/killed state)
    notifee.getInitialNotification().then(initialNotification => {
      if (initialNotification) {
        console.log('📱 App opened from notification:', initialNotification);
        navigateFromNotification(
          resolveScreen(initialNotification.notification?.data),
        );
      }
    });

    return () => {
      cancelled = true;
      unsubscribeNetInfo();
      unsubscribeNotification();
      cleanupFCM();
    };
  }, [
    checkConnectivity,
    dispatch,
    navigateFromNotification,
    resolveScreen,
    syncBadgeToTray,
  ]);

  useEffect(() => {
    if (!userId) return;

    const sendHeartbeat = () => {
      dispatch(sendHeartbeatThunk());
    };

    // Send heartbeat when app is already active (cold start or login flow complete).
    if (AppState.currentState === 'active') {
      sendHeartbeat();
    }

    const appStateSubscription = AppState.addEventListener(
      'change',
      nextAppState => {
        const wasBackgrounded =
          appStateRef.current === 'background' ||
          appStateRef.current === 'inactive';
        if (wasBackgrounded && nextAppState === 'active') {
          sendHeartbeat();
        }
        appStateRef.current = nextAppState;
      },
    );

    return () => {
      appStateSubscription.remove();
    };
  }, [dispatch, userId]);

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
      <AppUpdateModal visible={showUpdateModal} storeUrl={updateStoreUrl} />
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
