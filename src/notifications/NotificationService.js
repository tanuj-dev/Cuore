// src/notifications/notifeeSetup.js
import notifee, { AuthorizationStatus } from '@notifee/react-native';

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

  console.log('📢 Notification channel ready');
}
