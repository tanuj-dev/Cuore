// Full-screen incoming-call notification for CuoreCare (§7, Android-first).
//
// Rendered by the FCM background handler (index.js) when a data-only `type:incoming_call`
// push arrives while the app is backgrounded/locked. `fullScreenAction` makes Android show it
// as a full-screen call over the lock screen (like WhatsApp); the Accept/Decline actions +
// a looping ring make it feel native. iOS shows the APNs alert instead (a true locked-screen
// CallKit ring needs PushKit — tracked as remaining native work).
import notifee, {
  AndroidImportance,
  AndroidCategory,
  AndroidVisibility,
} from '@notifee/react-native';
import { recordConsultationEvent } from '../redux/CuoreCare/thunks';

// Channel sound is immutable once Android creates the channel, so this id is
// versioned (-v2) to force a fresh channel that adopts the new `iphoneringtone`.
export const CUORECARE_CALL_CHANNEL = 'cuorecare-call-v2';

const callNotifId = appointmentId => `cuorecare-call-${appointmentId}`;

export async function displayIncomingCallNotification(data = {}) {
  const appointmentId = data.appointmentId;
  if (!appointmentId) return;
  const doctorName = data.doctorName || 'Your doctor';
  const mode = data.mode || 'video';

  await notifee.displayNotification({
    id: callNotifId(appointmentId),
    title: `${doctorName} is calling`,
    body: `Tap to join your ${mode} consultation`,
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
      visibility: AndroidVisibility.PUBLIC,
      smallIcon: 'ic_launcher',
      ongoing: true,
      autoCancel: false,
      loopSound: true, // ring loops (channel sound = iphoneringtone)
      timeoutAfter: 45000, // auto-dismiss if unanswered (~missed)
      fullScreenAction: { id: 'default', launchActivity: 'default' },
      pressAction: { id: 'call-open', launchActivity: 'default' },
      actions: [
        { title: 'Decline', pressAction: { id: 'call-decline' } },
        { title: 'Accept', pressAction: { id: 'call-accept', launchActivity: 'default' } },
      ],
    },
    ios: {
      sound: 'default',
      foregroundPresentationOptions: { banner: true, sound: true, list: true },
    },
  });
}

export async function cancelIncomingCallNotification(appointmentId) {
  try {
    if (appointmentId) await notifee.cancelNotification(callNotifId(appointmentId));
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
