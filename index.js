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
import { claimIncomingCall, releaseIncomingCall } from './src/call/callState';

// ── FCM Background / Quit-state handler ───────────────────────
// MUST be registered before AppRegistry.registerComponent
messaging().setBackgroundMessageHandler(async remoteMessage => {
  const data = remoteMessage?.data || {};

  // Incoming CuoreCare call (§3/§4): the push is data-only, so THIS is the moment the
  // device has to start ringing — not when the user taps anything. displayNotification
  // creates the high-importance call channel if needed and Android plays its looping
  // ringtone + vibration immediately.
  if (data.type === 'incoming_call') {
    // Duplicate pushes (FCM retries, or a socket event that already rang) must not
    // stack a second ringing notification.
    if (claimIncomingCall(data.appointmentId)) {
      await displayIncomingCallNotification(data);
    }
    return;
  }

  // The caller hung up / the backend ended the call before it was answered.
  if (data.type === 'call_cancelled') {
    releaseIncomingCall(data.appointmentId);
    await cancelIncomingCallNotification(data.appointmentId);
    return;
  }

  console.log('📨 FCM Background Message:', remoteMessage);
});

// ── Notifee foreground service (§2) ───────────────────────────
// Required by `asForegroundService: true` on the ongoing-call notification. The task must
// keep running for as long as the service does, so it returns a promise that only settles
// when notifee stops the service.
notifee.registerForegroundService(() => new Promise(() => {}));

// ── Notifee Background / Quit-state handler ───────────────────
// Registered at module level so it runs even when the app is killed.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const data = detail?.notification?.data || {};
  const actionId = detail?.pressAction?.id;

  // Incoming-call actions handled while backgrounded/locked — WITHOUT opening the app.
  if (data.type === 'incoming_call') {
    if (type === EventType.ACTION_PRESS && actionId === 'call-decline') {
      await declineIncomingCall(data.appointmentId);
      await cancelIncomingCallNotification(data.appointmentId);
      releaseIncomingCall(data.appointmentId);
    }
    // Accept / body tap launch the app; App.js getInitialNotification routes + cancels it.
    return;
  }

  // The ongoing-call notification is only ever a way back into the call; the launch is
  // handled by the activity itself.
  if (data.type === 'ongoing_call') return;

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
