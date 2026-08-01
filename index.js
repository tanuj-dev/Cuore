/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import {
  displayIncomingCallNotification,
  cancelIncomingCallNotification,
  declineIncomingCall,
} from './src/notifications/incomingCall';

// ── FCM Background / Quit-state handler ───────────────────────
// MUST be registered before AppRegistry.registerComponent
messaging().setBackgroundMessageHandler(async remoteMessage => {
  const data = remoteMessage?.data || {};
  // Incoming CuoreCare call (§7): data-only push → render the full-screen call notification.
  if (data.type === 'incoming_call') {
    await displayIncomingCallNotification(data);
    return;
  }
  console.log('📨 FCM Background Message:', remoteMessage);
});

// ── Notifee Background / Quit-state handler ───────────────────
// Registered at module level so it runs even when the app is killed.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const data = detail?.notification?.data || {};
  const actionId = detail?.pressAction?.id;

  // Incoming-call actions handled while backgrounded/locked.
  if (data.type === 'incoming_call') {
    if (type === EventType.ACTION_PRESS && actionId === 'call-decline') {
      await declineIncomingCall(data.appointmentId);
      await cancelIncomingCallNotification(data.appointmentId);
    }
    // Accept / body tap launch the app; App.js getInitialNotification routes + cancels it.
    return;
  }

  // Otherwise keep the launcher badge in sync with the tray (dismiss/deliver).
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
