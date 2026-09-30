// ─────────────────────────────────────────────────────────────────────────────
// The full-screen consultation, built on our own views.
//
// Replaces `<ZegoUIKitPrebuiltCall>`, which drew its own complete call UI into
// the screen. The room now lives in zegoRoom.js and this only renders onto it,
// which is what makes everything below possible at all.
//
// ── THE DOCTOR FILLS THE SCREEN ─────────────────────────────────────────────
// The doctor is almost always on a laptop, so their camera sends 16:9. Fit that
// into a 9:19.5 handset the obvious way and you get a 220px band of doctor in a
// sea of black. On a phone the screen IS the tile, so it covers, centred — which
// is where a webcam already puts a face. `useVideoViewAspectFill` is the SDK's
// switch for exactly this, and `fill` below flips it for the cases where cover
// is wrong: a doctor holding up a report or sharing their screen, where the
// edges of the frame are the content.
//
// ── THE CHROME RESTS, THE EXIT DOES NOT ─────────────────────────────────────
// After IDLE_MS without a touch the controls fade, because a consultation is a
// conversation and the patient is looking at a person. Nothing is REMOVED: the
// doctor's name, the timer and End all stay. A patient who needs to leave should
// never first have to work out how to make the buttons come back.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { ZegoAudioVideoView } from '@zegocloud/zego-uikit-rn';
import { Minimize2, PhoneOff, User, VideoOff, WifiOff } from 'lucide-react-native';

import { CC } from '../screens/CuoreCare/ccTheme';
import CallControls from './CallControls';
import { useRoomState } from './useRoomState';
import { useCallState } from './useCallState';
import { useCornerSnap } from './useCornerSnap';
import {
  joinRoom,
  setMicrophone,
  setCamera,
  switchCamera,
  setSpeaker,
  getSelfUserID,
  forceRenderVideoView,
} from './zegoRoom';

const F = CC.fonts;

/* The SDK paints its own name label over every stream. We render the doctor's name
   in the top bar, so suppressing it is the difference between one label and two. */
const NoMask = () => null;

const IDLE_MS = 8000;
const SELF_W = 104;
const SELF_H = 150;

function fmtDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CallScreen({
  appID,
  userID,
  userName,
  roomID,
  token,
  mode = 'video',
  doctorName,
  connectedAt,
  signalOk = true,
  unreadChat = false,
  fill = true,
  onRequireNewToken,
  onMinimize,
  onEnd,
  onOpenChat,
  onJoinFailed,
}) {
  const insets = useSafeAreaInsets();
  const room = useRoomState();
  /* Reactive, not a prop: `callConnected()` stamps connectedAt AFTER this screen
     has already rendered, and the parent does not re-render when it does — so a
     prop read once at mount left the timer frozen at 00:00 for the whole call. */
  const call = useCallState();
  const startedAt = call.connectedAt || connectedAt;
  const video = mode === 'video';
  const selfID = getSelfUserID() || userID;

  const [joinError, setJoinError] = useState(null);
  const [resting, setResting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const idleTimer = useRef(null);
  const chrome = useSharedValue(1);

  /* Join once, keyed on the ROOM. Not on the token and not on the callbacks:
     re-joining on a prop change would put two logins in one room under one
     userID, and ZEGO resolves that by kicking the older one — which the patient
     experiences as the call dropping by itself. */
  useEffect(() => {
    let cancelled = false;
    if (!appID || !roomID || !userID || !token) return undefined;
    joinRoom({ appID, userID, userName, roomID, token, video, onRequireNewToken }).catch(e => {
      if (cancelled) return;
      const msg = String(e?.message || e || '');
      setJoinError(
        /permission|denied|NotAllowed/i.test(msg)
          ? 'Cuore needs access to your camera and microphone for this consultation. Allow it in Settings, then try again.'
          : 'Could not connect to the consultation room. Check your connection and try again.',
      );
      onJoinFailed?.(e);
    });
    return () => {
      cancelled = true;
    };
    // The room identity is the only dependency that may rebuild the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appID, roomID, userID]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* Arriving here from the minimised bubble means these video views were built a
     moment ago, while the streams are still bound to the bubble's. One frame of
     delay so the native views exist, then re-bind — otherwise both tiles are
     black until the camera is toggled. */
  useEffect(() => {
    const t = setTimeout(forceRenderVideoView, 120);
    return () => clearTimeout(t);
  }, [room.remoteUserID]);

  const wake = useCallback(() => {
    setResting(false);
    chrome.value = withTiming(1, { duration: 160 });
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setResting(true);
      chrome.value = withTiming(0, { duration: 260 });
    }, IDLE_MS);
  }, [chrome]);

  useEffect(() => {
    wake();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [wake]);

  /* The patient's own camera: draggable, springs to the nearest corner. It is the
     thing patients fidget with most — "am I still in frame?" — and a fixed inset
     always ends up over the one part of the doctor they are trying to see. */
  const selfSnap = useCornerSnap({
    boxWidth: SELF_W,
    boxHeight: SELF_H,
    margin: 16,
    topInset: insets.top + 96,
    bottomInset: insets.bottom + 208,
    startCorner: 1,
  });

  const chromeStyle = useAnimatedStyle(() => ({ opacity: chrome.value }));

  const hasRemoteVideo = !!room.remoteUserID && room.remoteVideoOn;
  const waiting = !room.remoteUserID;
  const linkOk = room.connected && signalOk;
  /* Before the room has EVER been up, a dropped link is not a reconnect — it is
     the first connect, and the placeholder already says so. Saying "reconnecting"
     there reads as something having gone wrong when nothing has. */
  const everConnected = useRef(false);
  if (room.connected) everConnected.current = true;
  const showReconnect = !linkOk && everConnected.current;

  if (joinError) {
    return (
      <View style={styles.errorRoot}>
        <VideoOff size={34} color="#FCA5A5" />
        <Text style={styles.errorText}>{joinError}</Text>
        <TouchableOpacity style={styles.errorBtn} onPress={onEnd} activeOpacity={0.85}>
          <Text style={styles.errorBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={wake} accessible={false}>
      <View style={styles.root}>
        {/* ── The doctor ──────────────────────────────────────────────────────
            MOUNTED WHENEVER THERE IS A DOCTOR IN THE ROOM, camera on or off. The
            SDK's view is what is attached to their stream, and their AUDIO rides
            on it — unmounting it because the picture went away would take the
            sound with it, which on a consultation is the failure that matters.
            The camera-off state is therefore painted OVER it, never instead. */}
        {/* ── Layer 0: the video ───────────────────────────────────────────────
            In its own absolutely-filled wrapper with an explicit zIndex, because
            ZegoAudioVideoView is itself `position: absolute` and stacks its parts
            with zIndex 1 and 2 internally. Siblings that declare no zIndex lose to
            it, which is exactly how the entire call chrome ended up painted behind
            the doctor's face — invisible, but still there and still tappable. */}
        <View style={styles.videoLayer} pointerEvents="none">
          {room.remoteUserID ? (
            <ZegoAudioVideoView
              userID={room.remoteUserID}
              useVideoViewAspectFill={fill}
              showSoundWave={false}
              foregroundBuilder={NoMask}
            />
          ) : null}
        </View>

        {!hasRemoteVideo ? (
          <View style={styles.remotePlaceholder}>
            <View style={styles.avatar}>
              {waiting ? (
                <ActivityIndicator size="large" color="#BFD5EC" />
              ) : (
                <User size={46} color="#BFD5EC" />
              )}
            </View>
            <Text style={styles.remoteName}>{doctorName || 'Your doctor'}</Text>
            <Text style={styles.remoteHint}>
              {waiting
                ? 'Waiting for the doctor to join…'
                : 'Camera off — you can still hear each other'}
            </Text>
          </View>
        ) : null}

        {/* Legibility shading: the chrome has to stay readable over whatever the
            camera sends. Real gradients — a flat translucent block reads as two grey
            slabs pasted on the video, with a hard edge exactly where it ends. */}
        <LinearGradient
          pointerEvents="none"
          style={styles.scrimTop}
          colors={['rgba(7,12,22,0.72)', 'rgba(7,12,22,0.28)', 'rgba(7,12,22,0)']}
          locations={[0, 0.55, 1]}
        />
        <LinearGradient
          pointerEvents="none"
          style={styles.scrimBottom}
          colors={['rgba(7,12,22,0)', 'rgba(7,12,22,0.42)', 'rgba(7,12,22,0.82)']}
          locations={[0, 0.45, 1]}
        />

        {/* ── Always on: who you are with, and how long. Never rests, because
            these are the two facts a patient glances up to check. ─────────── */}
        <View style={[styles.topRow, { top: insets.top + 12 }]} pointerEvents="box-none">
          <View style={styles.topLeft}>
            <Text style={styles.doctor} numberOfLines={1}>
              {doctorName || 'Your doctor'}
            </Text>
            <View style={styles.metaRow}>
              <View style={[styles.dot, !linkOk && styles.dotWarn]} />
              <Text style={styles.timer}>
                {startedAt ? fmtDuration(now - startedAt) : '00:00'}
              </Text>
              {showReconnect ? <Text style={styles.reconnect}>Reconnecting…</Text> : null}
            </View>
          </View>

          {/* Minimise is a first-class button, not a gesture you have to know
              about. The old screen hid it in the SDK's top menu bar. */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onMinimize}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Minimise the call and keep talking"
          >
            <Minimize2 size={20} color={CC.white} />
          </TouchableOpacity>
        </View>

        {showReconnect ? (
          <View style={[styles.weakBanner, { top: insets.top + 74 }]} pointerEvents="none">
            <WifiOff size={15} color="#FCD34D" />
            <Text style={styles.weakText}>Your connection is unstable</Text>
          </View>
        ) : null}

        {/* ── The patient's own camera ─────────────────────────────────────── */}
        {video && room.cameraOn && selfID ? (
          <GestureDetector gesture={selfSnap.pan}>
            <Animated.View style={[styles.self, selfSnap.animatedStyle]}>
              <ZegoAudioVideoView
                userID={selfID}
                useVideoViewAspectFill
                showSoundWave={false}
                foregroundBuilder={NoMask}
              />
              <View pointerEvents="none" style={styles.selfGrip} />
              <View pointerEvents="none" style={styles.selfTag}>
                <Text style={styles.selfTagText}>You</Text>
              </View>
            </Animated.View>
          </GestureDetector>
        ) : null}

        {/* ── Controls: they rest, End does not ────────────────────────────── */}
        <Animated.View
          style={[styles.controls, { bottom: insets.bottom + 22 }, chromeStyle]}
          pointerEvents={resting ? 'none' : 'auto'}
        >
          <CallControls
            micOn={room.micOn}
            cameraOn={room.cameraOn}
            speakerOn={room.speakerOn}
            video={video}
            unreadChat={unreadChat}
            onToggleMic={() => {
              wake();
              setMicrophone(!room.micOn);
            }}
            onToggleCamera={() => {
              wake();
              setCamera(!room.cameraOn);
            }}
            onSwitchCamera={() => {
              wake();
              switchCamera();
            }}
            onToggleSpeaker={() => {
              wake();
              setSpeaker(!room.speakerOn);
            }}
            onOpenChat={() => {
              wake();
              onOpenChat?.();
            }}
            onEnd={onEnd}
          />
        </Animated.View>

        {resting ? (
          <>
            <TouchableOpacity
              style={[styles.restingEnd, { bottom: insets.bottom + 34 }]}
              onPress={onEnd}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="End consultation"
            >
              <PhoneOff size={26} color={CC.white} />
            </TouchableOpacity>
            <View style={[styles.restHint, { bottom: insets.bottom + 122 }]} pointerEvents="none">
              <Text style={styles.restHintText}>Tap anywhere for controls</Text>
            </View>
          </>
        ) : null}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070C16' },
  videoLayer: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  remotePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101C2E',
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#1F3557',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remoteName: { fontFamily: F.PoppinsSemiBold, fontSize: 19, color: CC.white, marginTop: 20 },
  remoteHint: {
    fontFamily: F.PoppinsRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.66)',
    marginTop: 7,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  scrimTop: { position: 'absolute', zIndex: 8, left: 0, right: 0, top: 0, height: 150 },
  scrimBottom: { position: 'absolute', zIndex: 8, left: 0, right: 0, bottom: 0, height: 230 },
  topRow: {
    position: 'absolute',
    zIndex: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  topLeft: { flex: 1, minWidth: 0 },
  doctor: { fontFamily: F.PoppinsSemiBold, fontSize: 17, color: CC.white },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#34D399' },
  dotWarn: { backgroundColor: '#FCD34D' },
  timer: {
    fontFamily: F.PoppinsSemiBold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.88)',
    fontVariant: ['tabular-nums'],
  },
  reconnect: { fontFamily: F.PoppinsMedium, fontSize: 12, color: '#FCD34D' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weakBanner: {
    position: 'absolute',
    zIndex: 20,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(245,158,11,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.48)',
  },
  weakText: { fontFamily: F.PoppinsSemiBold, fontSize: 12, color: '#FCD34D' },
  self: {
    position: 'absolute',
    zIndex: 15,
    left: 0,
    top: 0,
    width: SELF_W,
    height: SELF_H,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1A2637',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  selfGrip: {
    position: 'absolute',
    top: 7,
    alignSelf: 'center',
    width: 26,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  selfTag: { position: 'absolute', left: 7, bottom: 6 },
  selfTagText: { fontFamily: F.PoppinsSemiBold, fontSize: 10, color: 'rgba(255,255,255,0.9)' },
  controls: { position: 'absolute', zIndex: 20, left: 0, right: 0 },
  restingEnd: {
    position: 'absolute',
    zIndex: 20,
    alignSelf: 'center',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(220,38,38,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  restHint: { position: 'absolute', zIndex: 20, left: 0, right: 0, alignItems: 'center' },
  restHintText: {
    fontFamily: F.PoppinsRegular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    backgroundColor: 'rgba(12,20,34,0.55)',
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  errorRoot: {
    flex: 1,
    backgroundColor: '#070C16',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 14,
  },
  errorText: {
    fontFamily: F.PoppinsRegular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    lineHeight: 21,
  },
  errorBtn: {
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  errorBtnText: { fontFamily: F.PoppinsSemiBold, fontSize: 14, color: CC.white },
});
