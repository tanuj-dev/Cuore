// ─────────────────────────────────────────────────────────────────────────────
// "Consultation in progress" notification — Android FOREGROUND SERVICE.
//
// This is what actually keeps a CuoreCare call alive when the user leaves the app.
// From Android 14 (API 34) an app may only keep using the camera/microphone in the
// background while a foreground service with the matching service types is running;
// without it the OS silently cuts the capture and the call dies. Notifee runs the
// service for us (`asForegroundService`) — index.js registers the long-running task.
//
// The notification is also the user's way back: tapping it reopens the full-screen call.
// iOS has no equivalent (background audio is granted by the `audio` UIBackgroundMode in
// Info.plist), so this is a no-op there.
// ─────────────────────────────────────────────────────────────────────────────
import { Platform } from 'react-native';
import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  AndroidForegroundServiceType,
} from '@notifee/react-native';

export const ONGOING_CALL_CHANNEL = 'cuorecare-ongoing-call';
export const ONGOING_CALL_NOTIFICATION_ID = 'cuorecare-ongoing-call';

let running = false;

export async function ensureOngoingCallChannel() {
  if (Platform.OS !== 'android') return;
  await notifee.createChannel({
    id: ONGOING_CALL_CHANNEL,
    name: 'Ongoing consultation',
    description: 'Keeps your CuoreCare consultation running while you use other apps',
    importance: AndroidImportance.LOW, // silent — the call itself is the alert
    vibration: false,
    badge: false,
  });
}

export async function startOngoingCallNotification({
  appointmentId,
  doctorName = 'your doctor',
  mode = 'video',
} = {}) {
  if (Platform.OS !== 'android') return;
  try {
    await ensureOngoingCallChannel();
    const types = [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE];
    if (mode === 'video') {
      types.push(AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CAMERA);
    }
    await notifee.displayNotification({
      id: ONGOING_CALL_NOTIFICATION_ID,
      title: 'CuoreCare consultation in progress',
      body: `Tap to return to your call with ${doctorName}`,
      data: { type: 'ongoing_call', appointmentId: appointmentId || '', mode },
      android: {
        channelId: ONGOING_CALL_CHANNEL,
        category: AndroidCategory.CALL,
        visibility: AndroidVisibility.PUBLIC,
        smallIcon: 'ic_launcher',
        ongoing: true,
        autoCancel: false,
        onlyAlertOnce: true,
        asForegroundService: true,
        foregroundServiceTypes: types,
        pressAction: { id: 'call-return', launchActivity: 'default' },
      },
    });
    running = true;
  } catch (e) {
    // Never let a notification failure end a working call.
    console.warn('[cuorecare][ongoing] start failed:', e?.message);
  }
}

export async function stopOngoingCallNotification() {
  if (Platform.OS !== 'android') return;
  try {
    if (running) await notifee.stopForegroundService();
  } catch (e) {
    /* ignore */
  }
  try {
    await notifee.cancelNotification(ONGOING_CALL_NOTIFICATION_ID);
  } catch (e) {
    /* ignore */
  }
  running = false;
}

export function isOngoingCallNotificationRunning() {
  return running;
}
