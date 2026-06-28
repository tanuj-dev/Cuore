/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// ── FCM Background / Quit-state handler ───────────────────────
// MUST be registered before AppRegistry.registerComponent
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📨 FCM Background Message:', remoteMessage);
});

// ── Notifee Background / Quit-state handler ───────────────────
// Registered at module level so it runs even when the app is killed. Keeps the
// launcher badge in sync with the notification tray: when the user dismisses a
// notification, drop the badge to however many are still showing (0 once the
// last one is gone) — without the app needing to be opened.
notifee.onBackgroundEvent(async ({ type }) => {
  if (type === EventType.DISMISSED || type === EventType.DELIVERED) {
    try {
      const displayed = await notifee.getDisplayedNotifications();
      await notifee.setBadgeCount(displayed.length);
    } catch (e) {
      console.warn('[badge] background sync failed:', e?.message);
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
