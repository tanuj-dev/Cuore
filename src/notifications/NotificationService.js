// src/notifications/NotificationService.js
import { Platform } from 'react-native';
import notifee, {
  AuthorizationStatus,
  AndroidImportance,
  AndroidVisibility,
} from '@notifee/react-native';
import {
  CUORECARE_CALL_CHANNEL,
  ensureCallChannel,
  registerIosCallCategory,
} from './incomingCall';
import { ensureOngoingCallChannel } from '../call/ongoingCall';

export const MEDICINE_ALARM_CHANNEL = 'medicine-alarm';

// Channels replaced by cuorecare-call-v3. A channel's sound is immutable once Android has
// created it, so older versions are removed instead of edited (otherwise a device that saw
// an early build keeps its silent/legacy ring forever).
const LEGACY_CALL_CHANNELS = ['cuorecare-call', 'cuorecare-call-v2'];

export async function initializeNotifee() {
  // Ask for permission (Android 13+ POST_NOTIFICATIONS / iOS alerts)
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

  // Medicine reminders (Launch edits, 5 Nov: "can the reminder sound be louder — currently it
  // depends on the notification sound"). Their own channel with a dedicated, loud alarm tone
  // (res/raw/cuore_med_alarm.wav) and a strong vibration, instead of the shared default sound.
  // The server sends USER_MEDICATION pushes on this channel id (config/firebaseService.js).
  // A channel's sound is fixed once created, hence a NEW id rather than changing an old one.
  await notifee.createChannel({
    id: MEDICINE_ALARM_CHANNEL,
    name: 'Medicine reminders',
    description: 'Loud alarm for medicine times',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: 'cuore_med_alarm',
    vibration: true,
    vibrationPattern: [300, 700, 300, 700, 300, 700],
    lights: true,
  });

  // Dedicated high-importance channel for incoming CuoreCare calls (§4): looping ringtone,
  // vibration, DND bypass and full-screen-intent support.
  await ensureCallChannel();
  // Silent low-importance channel for the ongoing-call foreground service (§2).
  await ensureOngoingCallChannel();
  // iOS Accept/Decline buttons on the incoming-call notification (§3).
  await registerIosCallCategory();

  if (Platform.OS === 'android') {
    await Promise.all(
      LEGACY_CALL_CHANNELS.map(id => notifee.deleteChannel(id).catch(() => {})),
    );
  }

  console.log('📢 Notification channels ready:', CUORECARE_CALL_CHANNEL);
}
