/**
 * CuoreCare — VoIP call-invitation (ringing) integration.  ⚠️ SCAFFOLD, GATED OFF.
 * ---------------------------------------------------------------------------------
 * Layer 1 (shipped): scheduled in-app join. The patient opens the app at the appointment
 * time and taps "Join" (AppointmentDetails → Consultation → ZegoUIKitPrebuiltCall). The
 * backend already pushes an FCM "Your doctor has joined" notification that deep-links
 * straight to the appointment (see App.js navigateFromNotification), so the patient gets a
 * timely nudge today without any of the native VoIP machinery below.
 *
 * Layer 2 (this file): full ZEGO Call Invitation so the doctor can *ring* the patient with
 * a native full-screen incoming-call UI (iOS CallKit / Android ConnectionService), even
 * when the app is backgrounded or killed, via ZPNs offline push.
 *
 * This is intentionally DISABLED (`CUORECARE_VOIP_ENABLED = false`) because lighting it up
 * requires work OUTSIDE the patient app that does not exist yet:
 *
 *   1. BACKEND: an endpoint that mints a *persistent* (identity-bound, not per-appointment)
 *      ZIM token for the patient's push identity, so the app can log the signaling plugin
 *      in at startup. Our current zimToken only comes from POST /join (per appointment).
 *   2. DOCTOR PORTAL: send a ZEGO call invitation to the patient's push identity when the
 *      doctor starts the consultation (the web portal currently only joins the room).
 *   3. ZEGO CONSOLE: enable ZPNs; upload an APNs VoIP certificate (iOS) and configure
 *      FCM (Android) so offline pushes can ring the device.
 *   4. NATIVE iOS: PushKit + CallKit wiring in AppDelegate; the `voip` background mode is
 *      already declared in Info.plist by this change.
 *   5. NATIVE ANDROID: ConnectionService + a full-screen-intent incoming-call Activity;
 *      the foreground-service / full-screen-intent permissions are already declared.
 *
 * When all five are in place: set CUORECARE_VOIP_ENABLED = true, register
 * `ZegoUIKitPrebuiltCallWaitingScreen` / `ZegoUIKitPrebuiltCallInCallScreen` on a
 * native-stack navigator, render <ZegoCallInvitationDialog/> inside the NavigationContainer,
 * and call initCuoreCareCallInvitation(...) right after a successful login (and
 * uninitCuoreCareCallInvitation() on logout). Verify the exact init signature against the
 * installed @zegocloud/zego-uikit-prebuilt-call-rn version before shipping.
 */
import { ZEGO_APP_ID } from '../../utilities/cuoreCareConfig';

// ⚠️ PACKAGES REMOVED (2026-08-01): `zego-zpns-react-native` and
// `@zegocloud/zego-uikit-signaling-plugin-rn` were UNINSTALLED because ZPNs ships an iOS
// `+load` swizzler (RCTZPNsSwizzler) that does objc_getClass("AppDelegate") and asserts —
// which aborts at launch on RN 0.81's Swift AppDelegate (runtime name "Cuore.AppDelegate").
// They are only needed for VoIP ringing (offline push + invitations), which is not built
// yet. Before activating this file, reinstall BOTH packages and complete the native push
// integration (PushKit/CallKit on iOS, ConnectionService on Android) so the swizzler has a
// discoverable AppDelegate — e.g. expose the Swift AppDelegate to ObjC via @objc(AppDelegate)
// or move push handling to an ObjC AppDelegate.

// Master switch. Keep false until every prerequisite above is done AND the two packages
// above are reinstalled — otherwise the requires below cannot resolve.
export const CUORECARE_VOIP_ENABLED = false;

let initialized = false;

/**
 * Initialize ZEGO call invitation (ringing). No-ops while disabled. Fail-soft: any native
 * error is swallowed so a partial setup can never crash or block the app.
 *
 * @param {{ userId: string, userName: string, zimToken?: string }} params
 */
export async function initCuoreCareCallInvitation({ userId, userName, zimToken } = {}) {
  if (!CUORECARE_VOIP_ENABLED) return false;
  if (initialized) return true;
  if (!userId) return false;

  try {
    // Lazy require so the (native) modules are only touched when the feature is enabled.
    const ZegoUIKitPrebuiltCallService = require('@zegocloud/zego-uikit-prebuilt-call-rn').default;
    const { ONE_ON_ONE_VIDEO_CALL_CONFIG } = require('@zegocloud/zego-uikit-prebuilt-call-rn');
    const ZIM = require('zego-zim-react-native').default;
    const ZPNs = require('zego-zpns-react-native').default;

    await ZegoUIKitPrebuiltCallService.init(
      ZEGO_APP_ID,
      '', // appSign — empty when authenticating the signaling plugin with a ZIM token
      userId,
      userName || userId,
      [ZIM, ZPNs],
      {
        token: zimToken, // persistent identity ZIM token (see prerequisite #1)
        requireConfig: () => ({ ...ONE_ON_ONE_VIDEO_CALL_CONFIG }),
        androidNotificationConfig: {
          channelID: 'CuoreCareCall',
          channelName: 'CuoreCare Consultation Calls',
        },
      },
    );
    initialized = true;
    return true;
  } catch (e) {
    console.warn('[CuoreCare][VoIP] init failed (feature not fully configured):', e?.message);
    return false;
  }
}

export async function uninitCuoreCareCallInvitation() {
  if (!initialized) return;
  try {
    const ZegoUIKitPrebuiltCallService = require('@zegocloud/zego-uikit-prebuilt-call-rn').default;
    await ZegoUIKitPrebuiltCallService.uninit();
  } catch (e) {
    console.warn('[CuoreCare][VoIP] uninit failed:', e?.message);
  } finally {
    initialized = false;
  }
}

export default { CUORECARE_VOIP_ENABLED, initCuoreCareCallInvitation, uninitCuoreCareCallInvitation };
