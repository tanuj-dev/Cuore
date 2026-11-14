import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Platform, AppState } from 'react-native';
import axios from 'axios';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
// Required once, at the root, for the drawer's edge swipe to receive touches. Without it the
// drawer still opens from the hamburger but never from a gesture — and on Android nothing in
// the gesture-handler tree works at all.
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import {
  syncHealthThunk,
  getHealthStatusThunk,
} from './src/redux/Health/healthThunks';
import notifee, { EventType } from '@notifee/react-native';
import { connectSocket, disconnectSocket, getSocket } from './src/realtime/socket';
import { EV as CC_EV } from './src/realtime/events';
import { cancelIncomingCallNotification } from './src/notifications/incomingCall';
import { navigationRef as rootNavigationRef } from './src/navigation/navigationRef';
import CallFloatingWindow from './src/call/CallFloatingWindow';
import {
  handleIncomingCall as onIncomingCall,
  acceptCall,
  declineCall,
  dismissIncomingCall,
  remoteEndedCall,
  restoreCall,
  setPipMode,
  teardownCalls,
} from './src/call/callManager';
import { onPipModeChanged } from './src/call/pip';
import { resolveScreen, navigateFromNotification as navigateFromNotificationData } from './src/utils/notificationNavigation';
import { markNotificationRead } from './src/redux/Notifications/thunks';
import { initDeepLinks, onNavigationStateChange as onDeepLinkNavState } from './src/utils/deepLinks';

const isOutdated = (current, minimum) => {
  const c = current.split('.').map(Number);
  const m = minimum.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((c[i] || 0) < (m[i] || 0)) return true;
    if ((c[i] || 0) > (m[i] || 0)) return false;
  }
  return false;
};

// Navigation ref to access navigation from outside components.
// Defined in src/navigation/navigationRef.js so notification handlers and the call
// manager can navigate without importing App.js; re-exported here for compatibility.
export const navigationRef = rootNavigationRef;

// Inner component that has access to Redux
const AppContent = () => {
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStoreUrl, setUpdateStoreUrl] = useState('');
  const sessionExpired = useSelector(state => state.auth?.sessionExpired);
  const userId = useSelector(state => state.auth?.userId);
  const appStateRef = useRef(AppState.currentState);

  // Deep-link resolution + nested-navigate logic lives in src/utils/notificationNavigation.js
  // now, shared verbatim with the in-app Notifications screen so a tap on the OS banner and
  // a tap on the in-app list can never drift apart. This wrapper just binds navigationRef and,
  // when the payload carries a notificationId (attached server-side by
  // utils/notificationService.js), marks that row read — so opening a notification either
  // way converges on the same read state.
  const navigateFromNotification = useCallback((screen = 'Today', data = {}) => {
    if (data?.notificationId) {
      dispatch(markNotificationRead(data.notificationId));
    }
    navigateFromNotificationData(navigationRef, screen, data);
  }, [dispatch]);

  // A realtime `call:incoming` (the doctor started the consultation). The call manager
  // owns the ring, the notification and the navigation so every entry point — socket,
  // FCM, notification tap — behaves identically and never rings twice.
  const handleIncomingCall = useCallback(payload => {
    onIncomingCall(payload, 'socket');
  }, []);

  // Accept from a background/lock-screen call notification → straight into the consultation.
  const openConsultationDirect = useCallback((data = {}) => {
    acceptCall({
      appointmentId: data.appointmentId,
      mode: data.mode || 'video',
      doctorName: data.doctorName,
    });
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
    // A call must never outlive the session (ring, foreground service, ZEGO room).
    teardownCalls();
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
        // Incoming call: ring immediately from whichever transport arrives first. The
        // manager de-duplicates against the socket event, so the ringtone starts once.
        if (remoteMessage.data?.type === 'incoming_call') {
          onIncomingCall(remoteMessage.data, 'fcm');
          return;
        }
        // Caller hung up before we answered.
        if (remoteMessage.data?.type === 'call_cancelled') {
          dismissIncomingCall(remoteMessage.data.appointmentId, 'remote_cancelled');
          return;
        }
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
            // Carry the deep-link target (and CuoreCare ids) so the press handler can route
            data: {
              screen: resolveScreen(remoteMessage.data),
              appointmentId: remoteMessage.data?.appointmentId,
              prescriptionId: remoteMessage.data?.prescriptionId,
              // Forward the inbox row id too. Without it an Android FOREGROUND tap was the
              // only path that did not mark the notification read, because this re-built
              // payload dropped it — background and quit taps get the FCM data verbatim.
              notificationId: remoteMessage.data?.notificationId,
            },
            android: {
              // Medicine times use the loud medicine-alarm channel (see NotificationService).
              channelId:
                remoteMessage.data?.type === 'USER_MEDICATION'
                  ? 'medicine-alarm'
                  : 'health-schedule',
              smallIcon: 'ic_launcher',
              pressAction: { id: 'default' },
            },
          });
        }
      },
      onOpenedFromBg: remoteMessage => {
        if (cancelled) return;
        console.log('🔔 FCM opened from background:', remoteMessage);
        navigateFromNotification(
          resolveScreen(remoteMessage?.data),
          remoteMessage?.data,
        );
      },
      onOpenedFromQuit: remoteMessage => {
        if (cancelled) return;
        console.log('🚀 FCM opened from quit:', remoteMessage);
        navigateFromNotification(
          resolveScreen(remoteMessage?.data),
          remoteMessage?.data,
        );
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
        const nData = detail?.notification?.data || {};
        const actionId = detail?.pressAction?.id;

        // Incoming-call notification actions (foreground).
        if (nData.type === 'incoming_call') {
          if (type === EventType.ACTION_PRESS && actionId === 'call-decline') {
            declineCall(nData.appointmentId);
          } else if (type === EventType.ACTION_PRESS && actionId === 'call-accept') {
            openConsultationDirect(nData);
          } else if (type === EventType.PRESS) {
            cancelIncomingCallNotification(nData.appointmentId);
            navigateFromNotification('IncomingCall', nData);
          }
          return;
        }

        // Ongoing-call notification → back to the full-screen call.
        if (nData.type === 'ongoing_call') {
          if (type === EventType.PRESS) restoreCall();
          return;
        }

        if (type === EventType.PRESS) {
          console.log(
            '📱 Notification pressed (foreground):',
            detail.notification,
          );
          navigateFromNotification(
            resolveScreen(detail.notification?.data),
            detail.notification?.data,
          );
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
        const nData = initialNotification.notification?.data || {};
        const actionId = initialNotification.pressAction?.id;
        if (nData.type === 'incoming_call') {
          cancelIncomingCallNotification(nData.appointmentId);
          if (actionId === 'call-accept') {
            // Answered straight from the lock screen / tray: join the room directly.
            openConsultationDirect(nData);
          } else {
            navigateFromNotification('IncomingCall', nData);
          }
          return;
        }
        if (nData.type === 'ongoing_call') {
          restoreCall();
          return;
        }
        navigateFromNotification(
          resolveScreen(initialNotification.notification?.data),
          initialNotification.notification?.data,
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
    openConsultationDirect,
    syncBadgeToTray,
  ]);

  useEffect(() => {
    if (!userId) return;

    const onForeground = async () => {
      dispatch(sendHeartbeatThunk());

      // Apple Health / Health Connect sync. Deliberately shares this listener rather than
      // adding its own: appStateRef is mutated here, so a second listener would race this
      // one and whichever ran first would swallow the background -> active transition.
      //
      // Status FIRST. On a cold start the slice defaults to connected:false, and
      // syncHealthThunk refuses to run when it believes the user is not connected -- so
      // without this the sync would only ever happen after a visit to the settings screen.
      await dispatch(getHealthStatusThunk());

      // Then sync unconditionally: the thunk owns every guard. It rejects silently when
      // the user is not connected, when a sync is already in flight, and when the last one
      // was under 4h ago. Nothing here needs to know any of that.
      dispatch(syncHealthThunk({}));
    };

    // Run when the app is already active (cold start or login flow complete).
    if (AppState.currentState === 'active') {
      onForeground();
    }

    const appStateSubscription = AppState.addEventListener(
      'change',
      nextAppState => {
        const wasBackgrounded =
          appStateRef.current === 'background' ||
          appStateRef.current === 'inactive';
        if (wasBackgrounded && nextAppState === 'active') {
          onForeground();
        }
        appStateRef.current = nextAppState;
      },
    );

    return () => {
      appStateSubscription.remove();
    };
  }, [dispatch, userId]);

  // ── CuoreCare realtime socket ──────────────────────────────────────────────
  // Connect on login, disconnect on logout. A `call:incoming` (doctor started the call)
  // launches the full-screen incoming-call screen even if the app is foregrounded elsewhere.
  useEffect(() => {
    if (!userId) {
      disconnectSocket();
      return undefined;
    }
    let cancelled = false;
    // App-wide call teardown: these must be handled even when the consultation screen is
    // unmounted (call minimized into the floating window, or app in the background).
    const onRemoteEnd = p => remoteEndedCall(p?.appointmentId);
    const onCallCancelled = p => dismissIncomingCall(p?.appointmentId, 'remote_cancelled');
    (async () => {
      const s = await connectSocket();
      if (!s || cancelled) return;
      s.on(CC_EV.CALL_INCOMING, handleIncomingCall);
      s.on(CC_EV.CALL_ENDED, onRemoteEnd);
      s.on(CC_EV.CALL_MISSED, onCallCancelled);
      s.on(CC_EV.CALL_DECLINED, onCallCancelled);
    })();
    return () => {
      cancelled = true;
      const s = getSocket();
      if (s) {
        s.off(CC_EV.CALL_INCOMING, handleIncomingCall);
        s.off(CC_EV.CALL_ENDED, onRemoteEnd);
        s.off(CC_EV.CALL_MISSED, onCallCancelled);
        s.off(CC_EV.CALL_DECLINED, onCallCancelled);
      }
      disconnectSocket();
    };
  }, [userId, handleIncomingCall]);

  // ── Android Picture-in-Picture ─────────────────────────────────────────────
  // MainActivity enters PiP on Home/recents while a call is live; this keeps the call
  // state (and the in-app chrome) in sync with the system window.
  useEffect(() => onPipModeChanged(setPipMode), []);

  // ── Deep links (cuore:// and https://cuore.health/app/*) ─────────────────
  // Cold start and warm URLs are parked in src/utils/deepLinks.js and opened once the user
  // is signed in and on Home (see onStateChange below), never over Splash or Login.
  useEffect(() => initDeepLinks(), []);

  const handleRetry = useCallback(async () => {
    await checkConnectivity();
  }, [checkConnectivity]);

  return (
    <GestureHandlerRootView style={styles.appContainer}>
      <NavigationContainer
        ref={navigationRef}
        onReady={onDeepLinkNavState}
        onStateChange={onDeepLinkNavState}
      >
        <Navigator />
      </NavigationContainer>
      {/* Minimized call window — lives above the whole app so the consultation keeps
          running while the user browses the rest of Cuore. */}
      <CallFloatingWindow />
      {!isConnected && <NetworkError onRetry={handleRetry} />}
      <SessionExpiredModal
        visible={sessionExpired}
        onLogin={handleSessionExpired}
      />
      <AppUpdateModal visible={showUpdateModal} storeUrl={updateStoreUrl} />
      {/* Redux Store Debugger - Remove in production */}
      {/* {__DEV__ && <ReduxDebugger />} */}
      {__DEV__ && <ApiDebugger />}
    </GestureHandlerRootView>
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
