// src/notifications/notifeeSetup.js
import notifee, { AuthorizationStatus, AndroidImportance } from '@notifee/react-native';
import { CUORECARE_CALL_CHANNEL } from './incomingCall';

export async function initializeNotifee() {
  // Ask for permission
  const settings = await notifee.requestPermission();

  if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
    console.log('✅ Notification permissions granted');
  } else {
    console.log('🚫 Notification permissions denied');
  }

  // Create notification channel (sound: 'doorbell' = default notification sound on Android)
  await notifee.createChannel({
    id: 'health-schedule',
    name: 'Health Schedule Notifications',
    importance: 4,
    sound: 'doorbell',
  });

  // Dedicated high-importance channel for incoming CuoreCare calls (§7). HIGH importance +
  // the looping ring (res/raw/iphoneringtone) enable the full-screen-intent call UI.
  await notifee.createChannel({
    id: CUORECARE_CALL_CHANNEL,
    name: 'CuoreCare Calls',
    importance: AndroidImportance.HIGH,
    sound: 'iphoneringtone',
    vibration: true,
    vibrationPattern: [300, 800, 300, 800],
  });

  console.log('📢 Notification channels ready');
}
