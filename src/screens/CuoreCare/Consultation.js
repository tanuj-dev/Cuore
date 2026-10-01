import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  BackHandler,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
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
  endCall,
} from '../../call/callManager';
import CallScreen from '../../call/CallScreen';
import { forceRenderVideoView } from '../../call/zegoRoom';

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
  /* Chat during a video/voice consultation. `chatEverOpened` exists because
     ChatConsultation owns a ZIM session: mounting logs in, unmounting logs out and
     destroys it. So it is mounted on first open and then only HIDDEN — the same
     rule the call itself follows. Not mounted up front, because a consultation
     where chat is never opened should not pay for a ZIM login. */
  const [chatOpen, setChatOpen] = useState(false);
  const [chatEverOpened, setChatEverOpened] = useState(false);
  const leftRef = useRef(false);
  // Set while we are handing the call over to the floating window, so the unmount
  // cleanup below does NOT report the patient as having left the consultation.
  const minimizingRef = useRef(false);

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

  /* THE APP ID COMES FROM THE SERVER, with the bundled constant only as a fallback.
   *
   * /join already returns the appId the token was minted under, and the two MUST match — a
   * client on one AppID cannot use a token issued for another. Reading the constant meant that
   * moving to a different ZEGO project (as on 21 Sept 2026, when the old project ran out of
   * credit) needed a new app release before anyone on the old build could call again. Taking it
   * from the same response as the token means the backend can move projects on its own and every
   * installed build follows on its next join. */
  const appId = Number(joinData?.appId) || ZEGO_APP_ID;
  const isAvCall = effectiveMode === 'video' || effectiveMode === 'voice';

  // Once the room is up, publish the connected state — that is what starts the
  // Android foreground service and arms PiP.
  useEffect(() => {
    if (phase !== 'ready' || !isAvCall) return;
    callConnected({
      appointmentId,
      mode: effectiveMode,
      doctorName,
      joinData,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isAvCall, appointmentId, effectiveMode, joinData]);

  /* ------------------------- Minimize ------------------------------------- */
  /* Now a plain navigation. The room lives in call/zegoRoom.js and does not care
     that this screen has gone, so there is nothing to tell the SDK and nothing to
     keep mounted — which is the whole reason zegoMinimize.js could be retired. */
  const minimize = useCallback(() => {
    if (phase !== 'ready' || !isAvCall) return false;
    minimizingRef.current = true;
    callMinimized();
    if (navigation.canGoBack()) navigation.goBack();
    return true;
  }, [phase, isAvCall, navigation]);

  // Android hardware back → minimize into the floating bubble, never hang up.
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
    // A Socket.IO room is a property of the CONNECTION, not of the client — so a reconnect
    // (a lift blackout, a network handover, the app backgrounding) silently drops us out of
    // the appointment room, and `appointment:subscribe` was a one-shot emit at mount. The
    // socket comes back, `connected` is true again, and yet call:ended / participant:left for
    // this consultation never arrive: the patient sits on a black call screen that nothing can
    // ever end, which is exactly the "video keeps going but I can't do anything" report.
    // Re-joining the room on every connect is idempotent server-side.
    const onConnect = () => {
      setSocketOk(true);
      subscribeAppointment(appointmentId);
    };
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

  /* THE DOCTOR OPENS THE ROOM, SO THE PATIENT HAS TO BE TOLD WHEN THEY DO.
   *
   * A live consultation can no longer be started by the patient — the server answers
   * DOCTOR_NOT_JOINED until the doctor is in, so that an early arrival cannot ring a doctor who
   * is still with the previous patient. That makes "you'll be called" the only way in, and it
   * therefore has to actually happen while the app is open. It did not: the backend has emitted
   * `call:incoming` to the patient's own room since this feature shipped and nothing in the app
   * ever subscribed to it — the name was declared in realtime/events.js and used nowhere. Only
   * the FCM push was wired, and that reaches a BACKGROUNDED app; a patient sitting on this
   * waiting screen was told nothing at all.
   *
   * Both signals are accepted because they travel differently: `call:incoming` goes to the
   * patient's personal room, so it survives a reconnect that silently dropped the appointment
   * subscription (see the note above), while `participant:joined` goes to the appointment room.
   * Either means the same thing, and re-joining is idempotent.
   *
   * Only ever armed while we are actually blocked on the doctor, and only fired by a socket
   * event — never on a timer — so a join that keeps failing cannot turn into a retry loop. */
  useEffect(() => {
    if (phase !== 'error' || err?.code !== 'DOCTOR_NOT_JOINED') return undefined;
    const s = getSocket();
    if (!s) return undefined;

    const isThis = p => !p || !p.appointmentId || p.appointmentId === appointmentId;
    const onCalled = p => {
      if (isThis(p)) join();
    };
    const onParticipant = p => {
      if (isThis(p) && p?.role === 'doctor') join();
    };

    s.on(CC_EV.CALL_INCOMING, onCalled);
    s.on(CC_EV.PARTICIPANT_JOINED, onParticipant);
    return () => {
      s.off(CC_EV.CALL_INCOMING, onCalled);
      s.off(CC_EV.PARTICIPANT_JOINED, onParticipant);
    };
  }, [phase, err?.code, appointmentId, join]);

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
        <StatusBar barStyle="dark-content" backgroundColor={CC.surface} />
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
    } else if (code === 'DOCTOR_NOT_JOINED') {
      /* Not a failure — the consultation simply has not been opened yet. A live call is the
         doctor's to start, so that a patient arriving early cannot ring a doctor who is still
         with the previous one. Retry stays available because the doctor may join at any moment
         and a patient watching this screen should not have to back out and come in again; the
         incoming-call notification will also reach them the instant the doctor does. */
      Icon = Clock;
      title = 'Waiting for your doctor';
      message =
        err?.message ||
        "Your doctor hasn't started the consultation yet. You'll be called as soon as they do.";
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
            screen: 'Tabs', // the drawer level around the bottom tabs
            params: {
              screen: 'CuoreCare',
              params: { screen: 'CuoreCareSubscribe', initial: false },
            },
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
        <StatusBar barStyle="dark-content" backgroundColor={CC.surface} />
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
        appID={appId}
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

  /* video / voice → our own call screen, on the room in call/zegoRoom.js.
   *
   * What used to be here was `<ZegoUIKitPrebuiltCall>` plus a config object: the
   * SDK painted the whole call and the only things we could reach were a
   * minimise button in its top bar and two overlays laid on top. The room's life
   * was also tied to this component being mounted, which is why minimising had
   * to be smuggled past the SDK (see the comment at the top of call/zegoRoom.js).
   * Now the room outlives the screen, so minimising is just navigating away. */
  return (
    <View style={styles.callContainer}>
      <View style={[styles.pane, chatOpen && styles.hidden]}>
      <CallScreen
        appID={appId}
        userID={joinData.userId}
        userName={patientName}
        roomID={joinData.roomId}
        token={joinData.rtcToken}
        mode={effectiveMode}
        doctorName={doctorName}
        connectedAt={getCallState().connectedAt}
        /* The app socket, not the media link. Losing it does not interrupt the
           video but does mean we would miss the doctor ending the consultation,
           so it counts toward "unstable" alongside the room's own state. */
        signalOk={socketOk}
        onRequireNewToken={handleRequireNewToken}
        onJoinFailed={() => endCall('join_failed')}
        onMinimize={minimize}
        onEnd={leave}
        onOpenChat={() => {
          setChatEverOpened(true);
          setChatOpen(true);
        }}
      />
      </View>

      {/* Chat over the call. There is no chat ROUTE to navigate to — chat-mode
          consultations render this component as the whole screen — and navigating
          away would take the call screen with it anyway. */}
      {chatEverOpened && (
        <View style={[styles.pane, !chatOpen && styles.hidden]}>
          <ChatConsultation
            appID={appId}
            userId={joinData.userId}
            userName={patientName}
            zimToken={joinData.zimToken}
            peerId={doctorId ? zegoDoctorUserId(doctorId) : null}
            doctorName={doctorName}
            onLeave={() => {
              setChatOpen(false);
              // The call's video views were display:none while chat was up, so the
              // streams need pointing back at them — same rebind as on restore.
              setTimeout(forceRenderVideoView, 120);
            }}
            onRenewToken={async () => {
              const r = await refreshConsultationToken(appointmentId);
              return r.ok ? r.data.zimToken : '';
            }}
          />
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
  /* Call and chat are siblings that take turns holding the frame, rather than one
     being laid over the other: an absolutely-positioned chat left its
     KeyboardAvoidingView measuring a frame the keyboard is not sized against, and
     the composer ended up half behind the keyboard. */
  pane: { flex: 1 },
  hidden: { display: 'none' },
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
    // Same reasoning as the chrome layers in call/CallScreen.js: the ZEGO video
    // view stacks itself with zIndex, so anything meant to cover it must say so.
    zIndex: 30,
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
