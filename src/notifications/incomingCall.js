// ─────────────────────────────────────────────────────────────────────────────
// Incoming-call notification for CuoreCare (§3/§4).
//
// This is a *call* notification, not a normal push: dedicated high-importance channel,
// looping ringtone, vibration, Accept/Decline actions and a full-screen intent so Android
// shows it over the lock screen like a phone call. It is rendered by the FCM background
// handler in index.js the moment the data-only push arrives — the ring starts there, NOT
// when the user taps it.
//
// Android sound rules that shaped this file:
//   • On API 26+ the SOUND LIVES ON THE CHANNEL and a channel is IMMUTABLE once created.
//     A channel that was ever created without a resolvable sound stays silent forever, so
//     the id is versioned; bump it whenever the ring changes.
//   • The channel must exist BEFORE displayNotification, including in the headless
//     background/quit context — hence `ensureCallChannel()` is called from the display
//     path instead of relying on App.js having run.
// ─────────────────────────────────────────────────────────────────────────────
import { Platform } from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidCategory,
  AndroidVisibility,
} from '@notifee/react-native';
import { recordConsultationEvent } from '../redux/CuoreCare/thunks';

// v3: created with an explicit, verified ring + vibration + DND bypass. Bump on ring change.
export const CUORECARE_CALL_CHANNEL = 'cuorecare-call-v3';
// res/raw/iphoneringtone.mp3 (Android) — extension omitted, Android resolves by resource name.
export const CUORECARE_RINGTONE = 'iphoneringtone';
export const IOS_CALL_CATEGORY = 'CUORECARE_INCOMING_CALL';

const RING_TIMEOUT_MS = 45000;

const callNotifId = appointmentId => `cuorecare-call-${appointmentId}`;

let channelReady = false;

/** Idempotent; safe to call from the headless background handler. */
export async function ensureCallChannel() {
  if (Platform.OS !== 'android') return;
  if (channelReady) return;
  await notifee.createChannel({
    id: CUORECARE_CALL_CHANNEL,
    name: 'Incoming consultations',
    description: 'Rings when your CuoreCare doctor calls you',
    importance: AndroidImportance.HIGH, // heads-up + sound; required for full-screen intent
    sound: CUORECARE_RINGTONE,
    vibration: true,
    vibrationPattern: [500, 1000, 500, 1000],
    bypassDnd: true, // a call should get through Do Not Disturb
    lights: true,
  });
  channelReady = true;
}

/**
 * iOS Accept/Decline buttons. iOS action buttons come from a *category* registered by the
 * app; the push payload then references it (`aps.category`). Registered once at startup.
 */
export async function registerIosCallCategory() {
  if (Platform.OS !== 'ios') return;
  try {
    await notifee.setNotificationCategories([
      {
        id: IOS_CALL_CATEGORY,
        actions: [
          { id: 'call-accept', title: 'Accept', foreground: true },
          { id: 'call-decline', title: 'Decline', destructive: true, authenticationRequired: false },
        ],
      },
    ]);
  } catch (e) {
    console.warn('[cuorecare][call] iOS category registration failed:', e?.message);
  }
}

export async function displayIncomingCallNotification(data = {}) {
  const appointmentId = data.appointmentId;
  if (!appointmentId) return;
  const doctorName = data.doctorName || 'Your doctor';
  const mode = data.mode || 'video';

  await ensureCallChannel();

  await notifee.displayNotification({
    id: callNotifId(appointmentId),
    title: `${doctorName} is calling`,
    body: `Incoming CuoreCare ${mode} consultation`,
    data: {
      ...data,
      type: 'incoming_call',
      screen: 'IncomingCall',
      appointmentId,
      mode,
      doctorName,
    },
    android: {
      channelId: CUORECARE_CALL_CHANNEL,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC, // show content on the lock screen
      smallIcon: 'ic_launcher',
      color: '#11418A',
      ongoing: true, // not swipeable — it is a call, answer or decline it
      autoCancel: false,
      onlyAlertOnce: false,
      loopSound: true, // keep ringing until answered/declined/timed out
      vibrationPattern: [500, 1000, 500, 1000],
      timeoutAfter: RING_TIMEOUT_MS, // unanswered → dismissed (missed call)
      // Lock screen / heads-up full call UI. On Android 14+ this needs
      // USE_FULL_SCREEN_INTENT to be granted; if it isn't, Android falls back to a
      // heads-up banner that still rings on this channel.
      fullScreenAction: { id: 'call-fullscreen', launchActivity: 'default' },
      pressAction: { id: 'call-open', launchActivity: 'default' },
      actions: [
        { title: 'Decline', pressAction: { id: 'call-decline' } },
        { title: 'Accept', pressAction: { id: 'call-accept', launchActivity: 'default' } },
      ],
    },
    ios: {
      categoryId: IOS_CALL_CATEGORY,
      sound: 'iphoneringtone.mp3',
      critical: false,
      interruptionLevel: 'timeSensitive',
      foregroundPresentationOptions: { banner: true, sound: true, list: true },
    },
  });
}

export async function cancelIncomingCallNotification(appointmentId) {
  try {
    if (appointmentId) {
      await notifee.cancelNotification(callNotifId(appointmentId));
    } else {
      // Unknown id (e.g. a cancel push without one) — clear any call notification.
      const displayed = await notifee.getDisplayedNotifications();
      await Promise.all(
        displayed
          .filter(n => n?.notification?.data?.type === 'incoming_call')
          .map(n => notifee.cancelNotification(n.id)),
      );
    }
  } catch (e) {
    /* ignore */
  }
}

// Best-effort decline from a notification action (works headless — cuoreCareApi reads the
// token from EncryptedStorage). Tells the backend so the doctor sees "declined".
export async function declineIncomingCall(appointmentId) {
  try {
    if (appointmentId) await recordConsultationEvent(appointmentId, 'declined');
  } catch (e) {
    /* ignore */
  }
}
