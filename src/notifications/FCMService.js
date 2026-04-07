/**
 * FCMService.js
 * Full Firebase Cloud Messaging setup for iOS & Android
 *
 * Usage — call FCMService.init() once inside App.js useEffect
 */

import messaging from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';

const FCMService = {
  _initialized: false,
  _cleanup: null,

  async requestPermission() {
    const authStatus = await messaging().requestPermission();

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('✅ FCM Permission granted. Status:', authStatus);
    } else {
      console.log('🚫 FCM Permission denied. Status:', authStatus);
    }

    return enabled;
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Get & return the FCM device token
  // ─────────────────────────────────────────────────────────────
  async getToken() {
    try {
      // iOS needs APNs token registered first
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
      }

      const token = await messaging().getToken();
      console.log('📲 FCM Token:', token);
      return token;
    } catch (error) {
      console.error('❌ Failed to get FCM token:', error);
      return null;
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 3. Listen for token refresh (send new token to your backend)
  // ─────────────────────────────────────────────────────────────
  onTokenRefresh(callback) {
    return messaging().onTokenRefresh(newToken => {
      console.log('🔄 FCM Token refreshed:', newToken);
      callback(newToken);
    });
  },

  // ─────────────────────────────────────────────────────────────
  // 4. Foreground message listener (app is open)
  // ─────────────────────────────────────────────────────────────
  onForegroundMessage(callback) {
    return messaging().onMessage(async remoteMessage => {
      console.log('📩 FCM Foreground message:', remoteMessage);
      callback(remoteMessage);
    });
  },

  // ─────────────────────────────────────────────────────────────
  // 5. Background → app opened via notification tap
  // ─────────────────────────────────────────────────────────────
  onBackgroundOpen(callback) {
    return messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('🔔 FCM Notification opened app (background):', remoteMessage);
      callback(remoteMessage);
    });
  },

  // ─────────────────────────────────────────────────────────────
  // 6. Quit state → app was completely closed and user tapped notification
  // ─────────────────────────────────────────────────────────────
  async checkInitialNotification(callback) {
    const remoteMessage = await messaging().getInitialNotification();
    if (remoteMessage) {
      console.log('🚀 App opened from QUIT state via notification:', remoteMessage);
      callback(remoteMessage);
    }
  },

  // ─────────────────────────────────────────────────────────────
  // 7. All-in-one init — call this once in App.js
  //    Returns cleanup function to unsubscribe listeners
  // ─────────────────────────────────────────────────────────────
  async init({
    onToken,
    onForeground,
    onOpenedFromBg,
    onOpenedFromQuit,
    onRefreshToken,
  } = {}) {
    if (this._initialized) {
      console.log('⚠️ FCMService.init() already called — skipping duplicate');
      return this._cleanup || (() => {});
    }
    this._initialized = true;

    const permitted = await this.requestPermission();
    if (!permitted) {
      this._initialized = false;
      return () => {};
    }

    const token = await this.getToken();
    if (token && onToken) onToken(token);

    const unsubRefresh = this.onTokenRefresh(newToken => {
      if (onRefreshToken) onRefreshToken(newToken);
      if (onToken) onToken(newToken);
    });

    const unsubForeground = this.onForegroundMessage(msg => {
      if (onForeground) {
        onForeground(msg);
      } else {
        Alert.alert(
          msg.notification?.title || 'Notification',
          msg.notification?.body || '',
        );
      }
    });

    const unsubBackground = this.onBackgroundOpen(msg => {
      if (onOpenedFromBg) onOpenedFromBg(msg);
    });

    await this.checkInitialNotification(msg => {
      if (onOpenedFromQuit) onOpenedFromQuit(msg);
    });

    this._cleanup = () => {
      unsubRefresh();
      unsubForeground();
      unsubBackground();
      this._initialized = false;
      this._cleanup = null;
    };

    return this._cleanup;
  },
};

export default FCMService;
