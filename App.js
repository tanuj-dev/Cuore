import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { View, Platform, AppState, StatusBar } from 'react-native';
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
import ApiDebugger from './src/components/ApiDebugger';
import { Common } from './src/utilities';
import Constants, { APP_VERSION, STORE_URL } from './src/utilities/Constants';
import Endpoints from './src/utilities/Endpoints';
import { setSessionExpired, setFCMToken } from './src/redux/Auth/slice';
import { setThemeMode } from './src/redux/Theme/slice';
import { logoutUser, sendHeartbeatThunk } from './src/redux/Auth/authThunk';
import notifee, { EventType } from '@notifee/react-native';
import { useAppTheme } from './src/hooks/useAppTheme';
import { buildNavigationTheme } from './src/theme/navigationTheme';
import {
  loadStoredThemeMode,
  persistThemeMode,
} from './src/theme/themeStorage';

const isOutdated = (current, minimum) => {
  const c = current.split('.').map(Number);
  const m = minimum.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((c[i] || 0) < (m[i] || 0)) return true;
    if ((c[i] || 0) > (m[i] || 0)) return false;
  }
  return false;
};

export const navigationRef = React.createRef();

const AppContent = () => {
  const dispatch = useDispatch();
  const { colors, isDark, mode } = useAppTheme();
  const navigationTheme = useMemo(
    () => buildNavigationTheme(colors, isDark),
    [colors, isDark],
  );

  const [isConnected, setIsConnected] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStoreUrl, setUpdateStoreUrl] = useState('');
  const sessionExpired = useSelector(state => state.auth?.sessionExpired);
  const userId = useSelector(state => state.auth?.userId);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    let cancelled = false;
    loadStoredThemeMode().then(stored => {
      if (!cancelled && stored) {
        dispatch(setThemeMode(stored));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  useEffect(() => {
    persistThemeMode(mode);
  }, [mode]);

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
          isOutdated(APP_VERSION, platformData.minVersion)
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

  useEffect(() => {
    console.log('=== REDUX STORE STATE ===');
    console.log(JSON.stringify(store.getState(), null, 2));
    console.log('========================');
  }, []);

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

    if (navigationRef.current) {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [dispatch]);

  useEffect(() => {
    Common.setSessionExpiredCallback(() => {
      dispatch(setSessionExpired(true));
    });

    initializeNotifee();

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
        if (Platform.OS === 'android') {
          const id =
            remoteMessage.messageId ||
            `${remoteMessage.notification?.title || ''}-${Date.now()}`;
          await notifee.displayNotification({
            id,
            title: remoteMessage.notification?.title || 'Notification',
            body: remoteMessage.notification?.body || '',
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
        navigateFromNotification('Today');
      },
      onOpenedFromQuit: remoteMessage => {
        if (cancelled) return;
        console.log('🚀 FCM opened from quit:', remoteMessage);
        navigateFromNotification('Today');
      },
      onRefreshToken: newToken => {
        if (cancelled) return;
        console.log('🔄 FCM Token refreshed — updated in Redux:', newToken);
        dispatch(setFCMToken(newToken));
      },
    }).then(cleanup => {
      if (cancelled) {
        cleanup();
      } else {
        cleanupFCM = cleanup;
      }
    });

    checkConnectivity();

    const unsubscribeNetInfo = Common.subscribeToNetworkChanges(state => {
      setIsConnected(state.isConnected ?? false);
    });

    const unsubscribeNotification = notifee.onForegroundEvent(
      ({ type, detail }) => {
        if (type === EventType.PRESS) {
          console.log(
            '📱 Notification pressed (foreground):',
            detail.notification,
          );
          navigateFromNotification('Today');
        }
      },
    );

    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log(
          '📱 Notification pressed (background):',
          detail.notification,
        );
      }
    });

    notifee.getInitialNotification().then(initialNotification => {
      if (initialNotification) {
        console.log('📱 App opened from notification:', initialNotification);
        navigateFromNotification('Today');
      }
    });

    return () => {
      cancelled = true;
      unsubscribeNetInfo();
      unsubscribeNotification();
      cleanupFCM();
    };
  }, [checkConnectivity, dispatch, navigateFromNotification]);

  useEffect(() => {
    if (!userId) return;

    const sendHeartbeat = () => {
      dispatch(sendHeartbeatThunk());
    };

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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <Navigator />
      </NavigationContainer>
      {!isConnected && <NetworkError onRetry={handleRetry} />}
      <SessionExpiredModal
        visible={sessionExpired}
        onLogin={handleSessionExpired}
      />
      <AppUpdateModal visible={showUpdateModal} storeUrl={updateStoreUrl} />
      {__DEV__ && <ApiDebugger />}
    </View>
  );
};

const App = () => (
  <Provider store={store}>
    <AppContent />
  </Provider>
);

export default App;
