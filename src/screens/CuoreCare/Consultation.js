import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import {
  ZegoUIKitPrebuiltCall,
  ZegoMenuBarButtonName,
  ONE_ON_ONE_VIDEO_CALL_CONFIG,
  ONE_ON_ONE_VOICE_CALL_CONFIG,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { Clock, CalendarX, CreditCard, WifiOff, RefreshCw, ChevronLeft } from 'lucide-react-native';

import { CC } from './ccTheme';
import { fmtTime, fmtDayLabel } from './ccFormat';
import { ZEGO_APP_ID, zegoDoctorUserId } from '../../utilities/cuoreCareConfig';
import ChatConsultation from './ChatConsultation';
import {
  joinConsultation,
  refreshConsultationToken,
  recordConsultationEvent,
} from '../../redux/CuoreCare/thunks';
import {
  getSocket,
  subscribeAppointment,
  unsubscribeAppointment,
} from '../../realtime/socket';
import { EV as CC_EV } from '../../realtime/events';
import { getCallState } from '../../call/callState';
import {
  callConnecting,
  callConnected,
  callMinimized,
  restoreCall,
  endCall,
} from '../../call/callManager';
import { minimizeZegoCall, primeRouteParams } from '../../call/zegoMinimize';

const F = CC.fonts;

export default function Consultation({ navigation, route }) {
  const {
    appointmentId,
    mode: paramMode,
    doctorId: paramDoctorId,
    doctorName: paramDoctorName,
    // Set when the user restores a MINIMIZED call: the ZEGO room is still connected, so
    // we must not run /join again — we only need the screen back.
    resume: paramResume,
  } = route.params || {};

  const profileUser = useSelector(state => state.profile?.data?.data?.user);
  const currentAppt = useSelector(state => state.cuoreCare.current?.data);
  const patientName = profileUser?.display_name || profileUser?.name || 'Patient';

  const [phase, setPhase] = useState('joining'); // joining | ready | error
  const [joinData, setJoinData] = useState(null);
  const [err, setErr] = useState(null);
  const [remoteEnded, setRemoteEnded] = useState(false); // doctor/system ended the call
  const [socketOk, setSocketOk] = useState(true); // false → show "Reconnecting…"
  const leftRef = useRef(false);
  // Set while we are handing the call over to the floating window, so the unmount
  // cleanup below does NOT report the patient as having left the consultation.
  const minimizingRef = useRef(false);
  const callRef = useRef(null);

  // Resolve the doctor id for the ZIM chat peer (d_<doctorId>) from whatever we have.
  const doctorRaw = paramDoctorId || currentAppt?.doctorId;
  const doctorId = doctorRaw?._id || doctorRaw;
  const doctorName =
    paramDoctorName || currentAppt?.doctorId?.displayName || 'CuoreCare doctor';

  const join = useCallback(async () => {
    // Restoring a minimized call: reuse the cached ZEGO credentials.
    const cached = getCallState();
    if (paramResume && cached.joinData && cached.appointmentId === appointmentId) {
      setJoinData(cached.joinData);
      setPhase('ready');
      return;
    }
    setPhase('joining');
    setErr(null);
    callConnecting({
      appointmentId,
      mode: paramMode,
      doctorId,
      doctorName,
    });
    const res = await joinConsultation(appointmentId);
    if (res.ok) {
      setJoinData(res.data);
      setPhase('ready');
    } else {
      setErr(res.error);
      setPhase('error');
      endCall('join_failed');
    }
    // doctorId/doctorName are display-only here; excluded to keep join() stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, paramMode, paramResume]);

  useEffect(() => {
    join();
  }, [join]);

  const recordLeft = useCallback(() => {
    if (leftRef.current) return;
    leftRef.current = true;
    // Best-effort audit; ignore result.
    recordConsultationEvent(appointmentId, 'left');
  }, [appointmentId]);

  const leave = useCallback(() => {
    recordLeft();
    endCall('local_hangup');
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation, recordLeft]);

  const handleRequireNewToken = useCallback(async () => {
    const r = await refreshConsultationToken(appointmentId);
    return r.ok ? r.data.rtcToken : '';
  }, [appointmentId]);

  // Record "left" if the screen unmounts mid-call — but NOT when we are only minimizing
  // (the ZEGO room stays connected behind the floating window).
  useEffect(
    () => () => {
      if (!minimizingRef.current) recordLeft();
    },
    [recordLeft],
  );

  const effectiveMode = joinData?.mode || paramMode || 'video';
  const isAvCall = effectiveMode === 'video' || effectiveMode === 'voice';

  // Once the room is up: publish the connected state (starts the Android foreground
  // service + arms PiP) and hand ZEGO the params it needs to restore this call from the
  // floating window.
  useEffect(() => {
    if (phase !== 'ready' || !isAvCall) return;
    callConnected({
      appointmentId,
      mode: effectiveMode,
      doctorName,
      joinData,
    });
    primeRouteParams({
      roomID: joinData?.roomId,
      onCallEnd: () => {
        // Remote hang-up while minimized — ZEGO tells us through this callback.
        recordLeft();
        endCall('remote_ended');
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isAvCall, appointmentId, effectiveMode, joinData]);

  /* ------------------------- Minimize (back press) ------------------------- */
  const minimize = useCallback(() => {
    if (phase !== 'ready' || !isAvCall) return false;
    minimizingRef.current = true;
    const ok = minimizeZegoCall(callRef);
    if (!ok) minimizingRef.current = false;
    return ok;
  }, [phase, isAvCall]);

  // Android hardware back → minimize into the floating window, never hang up.
  // Registered here (after ZEGO's own back handler, which swallows the event) so RN's
  // last-registered-first dispatch reaches us first.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase === 'ready' && isAvCall) {
        minimize();
        return true; // handled: the call keeps running, minimized
      }
      return false;
    });
    return () => sub.remove();
  }, [phase, isAvCall, minimize]);

  // Realtime call lifecycle (§5/§8): react to the doctor ending/leaving + connection drops.
  useEffect(() => {
    const s = getSocket();
    if (!s) return undefined;
    subscribeAppointment(appointmentId);
    setSocketOk(!!s.connected);

    const isThis = p => !p || !p.appointmentId || p.appointmentId === appointmentId;
    const onEnded = p => {
      if (isThis(p)) setRemoteEnded(true);
    };
    const onLeft = p => {
      if (isThis(p) && p?.role === 'doctor') setRemoteEnded(true);
    };
    const onConnect = () => setSocketOk(true);
    const onDisconnect = () => setSocketOk(false);

    s.on(CC_EV.CALL_ENDED, onEnded);
    s.on(CC_EV.CALL_MISSED, onEnded);
    s.on(CC_EV.PARTICIPANT_LEFT, onLeft);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    return () => {
      unsubscribeAppointment(appointmentId);
      s.off(CC_EV.CALL_ENDED, onEnded);
      s.off(CC_EV.CALL_MISSED, onEnded);
      s.off(CC_EV.PARTICIPANT_LEFT, onLeft);
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, [appointmentId]);

  // When the other side ends the call, show a brief notice then leave — never stuck (§5).
  useEffect(() => {
    if (!remoteEnded) return undefined;
    const t = setTimeout(() => leave(), 1600);
    return () => clearTimeout(t);
  }, [remoteEnded, leave]);

  /* ------------------------------- Joining ------------------------------- */
  if (phase === 'joining') {
    return (
      <SafeAreaView style={styles.stateSafe}>
        <View style={styles.stateCenter}>
          <ActivityIndicator size="large" color={CC.primary} />
          <Text style={styles.stateTitle}>Connecting…</Text>
          <Text style={styles.stateMsg}>Preparing your secure consultation room</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* -------------------------------- Error -------------------------------- */
  if (phase === 'error') {
    const code = err?.code;
    let Icon = WifiOff;
    let title = 'Could not join';
    let message = err?.message || 'Something went wrong. Please try again.';
    let showRetry = true;
    let primary = null;

    if (code === 'TOO_EARLY') {
      Icon = Clock;
      title = 'Room not open yet';
      message = err?.opensAt
        ? `You can join from ${fmtDayLabel(err.opensAt)} at ${fmtTime(err.opensAt)}.`
        : 'The consultation room is not open yet.';
    } else if (code === 'WINDOW_CLOSED') {
      Icon = CalendarX;
      title = 'Consultation ended';
      message = 'The join window for this consultation has closed.';
      showRetry = false;
    } else if (code === 'CUORECARE_SUBSCRIPTION_REQUIRED') {
      Icon = CreditCard;
      title = 'Subscription required';
      message = 'An active CuoreCare subscription is required to join.';
      showRetry = false;
      primary = {
        label: 'View plans',
        onPress: () =>
          navigation.replace('Home', {
            screen: 'CuoreCare',
            params: { screen: 'CuoreCareSubscribe' },
          }),
      };
    } else if (code === 'CUORECARE_ACCESS_REQUIRED') {
      // Distinct from a lapsed subscription: this account has no admin-granted
      // entitlement for this feature with this doctor. There's no self-serve fix (no
      // "View plans" CTA) — the doctor/admin needs to grant it.
      Icon = CreditCard;
      title = 'Not available yet';
      message = "This consultation type hasn't been enabled for your account with this doctor.";
      showRetry = false;
    } else if (code === 'ZEGO_NOT_CONFIGURED' || err?.httpStatus === 503) {
      title = 'Service unavailable';
      message = 'The consultation service is being set up. Please try again shortly.';
    }

    return (
      <SafeAreaView style={styles.stateSafe}>
        <TouchableOpacity style={styles.errBack} onPress={leave} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronLeft size={26} color={CC.text} />
        </TouchableOpacity>
        <View style={styles.stateCenter}>
          <View style={styles.stateIcon}>
            <Icon size={34} color={CC.primary} />
          </View>
          <Text style={styles.stateTitle}>{title}</Text>
          <Text style={styles.stateMsg}>{message}</Text>
          <View style={styles.stateActions}>
            {showRetry && (
              <TouchableOpacity style={styles.retryBtn} onPress={join}>
                <RefreshCw size={17} color={CC.white} />
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            )}
            {primary && (
              <TouchableOpacity style={styles.retryBtn} onPress={primary.onPress}>
                <Text style={styles.retryText}>{primary.label}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.ghostBtn} onPress={leave}>
              <Text style={styles.ghostText}>Go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  /* -------------------------------- Ready -------------------------------- */

  if (effectiveMode === 'chat') {
    return (
      <ChatConsultation
        appID={ZEGO_APP_ID}
        userId={joinData.userId}
        userName={patientName}
        zimToken={joinData.zimToken}
        peerId={doctorId ? zegoDoctorUserId(doctorId) : null}
        doctorName={doctorName}
        onLeave={leave}
        onRenewToken={async () => {
          const r = await refreshConsultationToken(appointmentId);
          return r.ok ? r.data.zimToken : '';
        }}
      />
    );
  }

  // video / voice → ZEGO Prebuilt Call Kit (token auth via server-minted rtcToken)
  const baseConfig =
    effectiveMode === 'voice' ? ONE_ON_ONE_VOICE_CALL_CONFIG : ONE_ON_ONE_VIDEO_CALL_CONFIG;

  return (
    <View style={styles.callContainer}>
      <ZegoUIKitPrebuiltCall
        ref={callRef}
        appID={ZEGO_APP_ID}
        appSign={''}
        userID={joinData.userId}
        userName={patientName}
        callID={joinData.roomId}
        token={joinData.rtcToken}
        onRequireNewToken={handleRequireNewToken}
        config={{
          ...baseConfig,
          // A visible minimize control, in addition to the hardware back button.
          topMenuBarConfig: {
            ...(baseConfig.topMenuBarConfig || {}),
            isVisible: true,
            buttons: [ZegoMenuBarButtonName.minimizingButton],
          },
          onHangUp: leave,
          onHangUpConfirmation: undefined,
          // Fired by the SDK's floating window once it has taken over the room. The room
          // stays connected; we just leave this screen.
          onWindowMinimized: () => {
            minimizingRef.current = true;
            callMinimized();
            if (navigation.canGoBack()) navigation.goBack();
          },
          // Fired when the user taps the floating window.
          onWindowMaximized: () => {
            restoreCall();
          },
        }}
      />

      {!socketOk && !remoteEnded && (
        <View style={styles.reconnectBanner} pointerEvents="none">
          <ActivityIndicator size="small" color={CC.white} />
          <Text style={styles.reconnectText}>Reconnecting…</Text>
        </View>
      )}

      {remoteEnded && (
        <View style={styles.endedOverlay}>
          <Text style={styles.endedTitle}>Consultation ended</Text>
          <Text style={styles.endedSub}>Returning to your appointment…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  callContainer: { flex: 1, backgroundColor: '#000' },
  reconnectBanner: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  reconnectText: { fontFamily: F.PoppinsMedium, fontSize: 13, color: CC.white },
  endedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  endedTitle: { fontFamily: F.PoppinsSemiBold, fontSize: 20, color: CC.white, textAlign: 'center' },
  endedSub: { fontFamily: F.PoppinsRegular, fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 8, textAlign: 'center' },
  stateSafe: { flex: 1, backgroundColor: CC.surface },
  errBack: { position: 'absolute', top: 52, left: 16, zIndex: 2 },
  stateCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  stateIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: CC.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  stateTitle: { fontFamily: F.PoppinsSemiBold, fontSize: 19, color: CC.text, marginTop: 8, textAlign: 'center' },
  stateMsg: {
    fontFamily: F.PoppinsRegular,
    fontSize: 14,
    color: CC.subText,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  stateActions: { marginTop: 28, alignSelf: 'stretch', gap: 12 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CC.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  retryText: { fontFamily: F.PoppinsSemiBold, fontSize: 15, color: CC.white },
  ghostBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  ghostText: { fontFamily: F.PoppinsMedium, fontSize: 14, color: CC.subText },
});
