// ─────────────────────────────────────────────────────────────────────────────
// The minimized call: a bubble you can put wherever the work is not.
//
// ── WHAT THIS REPLACES ──────────────────────────────────────────────────────
// `ZegoUIKitPrebuiltCallFloatingMinimizedView`. That view had three problems we
// could not reach past, because its positioning and contents are internal:
//
//   * it showed the REMOTE participant only, so a patient had no way to tell
//     whether they were still in frame while the call was minimized;
//   * it placed itself, so it could settle over whatever the patient had
//     minimized the call in order to read;
//   * it was the anchor of the whole minimize mechanism, which is why
//     `zegoMinimize.js` had to mutate the SDK's private route-params object.
//
// Since the room now lives in module state (zegoRoom.js), the bubble is just a
// view. It mounts the same `<ZegoAudioVideoView>` the full screen does — the
// stream is already playing, so moving it costs nothing and drops nothing.
//
// ── THE GESTURE ─────────────────────────────────────────────────────────────
// Drag anywhere; on release it springs to the NEAREST of four corners. Free
// placement sounds kinder but ages badly: a bubble left at an arbitrary offset
// ends up half off the screen after a rotation, or parked on the one button the
// patient needs. Corners are predictable, reachable one-handed, and survive a
// resize. Dragging into the bottom zone leaves the call — without it, people
// end consultations just to get rid of the bubble.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useContext, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { Platform, StatusBar } from 'react-native';
import { ZegoAudioVideoView } from '@zegocloud/zego-uikit-rn';
import { ChevronDown, User } from 'lucide-react-native';

import { CC } from '../screens/CuoreCare/ccTheme';
import { useRoomState } from './useRoomState';
import { useCornerSnap } from './useCornerSnap';
import { getSelfUserID, forceRenderVideoView } from './zegoRoom';

const F = CC.fonts;

/* The SDK draws its own name label over every stream; ours is in the bar below. */
const NoMask = () => null;

const W = 116;
const H = 174;
const MARGIN = 12;
/* Enough room under the call bar that the bubble never lands on it — the bar is
   the fixed way back, so it is the one thing the bubble must not cover. */
const TOP_GAP = 56;
const BOTTOM_GAP = 28;
/* How deep the leave zone reaches up from the bottom. Generous, because it is
   only armed while a finger is down. */
const LEAVE_ZONE = 132;

export default function CallBubble({ doctorName, onRestore, onEnd }) {
  /* CONTEXT, NOT `useSafeAreaInsets()`. The bubble is mounted at the app root,
     outside <NavigationContainer> — and this app has no <SafeAreaProvider> of its
     own, it relies on the one React Navigation installs around its screens. So
     the hook, which throws when no provider is above it, took the whole app down
     the moment the call was minimized. The context returns null instead, and we
     fall back to the platform's own numbers. */
  const ctxInsets = useContext(SafeAreaInsetsContext);
  const insets = ctxInsets || {
    top: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 47,
    bottom: Platform.OS === 'ios' ? 34 : 0,
    left: 0,
    right: 0,
  };
  const room = useRoomState();
  const selfID = getSelfUserID();

  /* Same reason as CallScreen: the bubble's views are new, the streams are still
     bound to the full-screen ones it replaced. */
  useEffect(() => {
    const t = setTimeout(forceRenderVideoView, 120);
    return () => clearTimeout(t);
  }, [room.remoteUserID]);

  const { pan, animatedStyle, dragging, overLeave, corners } = useCornerSnap({
    boxWidth: W,
    boxHeight: H,
    margin: MARGIN,
    // Clears the call bar, which is the fixed way back and the one thing the
    // bubble must never land on.
    topInset: insets.top + TOP_GAP,
    bottomInset: insets.bottom + BOTTOM_GAP,
    leaveZone: LEAVE_ZONE,
    onLeave: onEnd,
  });

  // Exclusive, not simultaneous: a tap that has begun to travel is a drag, and
  // restoring the call mid-drag would be the opposite of what was meant.
  const tap = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(8)
        .onEnd((_e, ok) => {
          if (ok) runOnJS(onRestore)();
        }),
    [onRestore],
  );
  const gesture = useMemo(() => Gesture.Exclusive(pan, tap), [pan, tap]);

  const hasRemoteVideo = !!room.remoteUserID && room.remoteVideoOn;

  return (
    <>
      {/* Snap targets, shown only while a finger is down. Four ghosts so the
          patient can see where it will land before they let go. */}
      {dragging
        ? corners.map(c => (
            <View
              key={`${c.x}-${c.y}`}
              pointerEvents="none"
              style={[styles.target, { left: c.x, top: c.y }]}
            />
          ))
        : null}

      {dragging ? (
        <View pointerEvents="none" style={[styles.leaveZone, { height: LEAVE_ZONE }]}>
          <View style={[styles.leavePill, overLeave && styles.leavePillArmed]}>
            <ChevronDown size={17} color={CC.white} />
            <Text style={styles.leaveText}>Drop here to leave the call</Text>
          </View>
        </View>
      ) : null}

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.bubble, animatedStyle]}>
          {/* The doctor, filling the bubble. Mounted whenever they are in the
              room — their audio rides on this view, so it is never swapped out
              for the camera-off state, only covered by it. */}
          {/* Its own layer with an explicit zIndex: ZegoAudioVideoView is
              `position: absolute` and stacks its parts with zIndex 1 and 2, so a
              sibling that declares none is painted behind the video rather than
              over it. */}
          <View style={styles.videoLayer} pointerEvents="none">
            {room.remoteUserID ? (
              <ZegoAudioVideoView
                userID={room.remoteUserID}
                useVideoViewAspectFill
                showSoundWave={false}
                foregroundBuilder={NoMask}
              />
            ) : null}
          </View>

          {!hasRemoteVideo ? (
            <View style={styles.placeholder}>
              <User size={30} color="#BFD5EC" />
              <Text style={styles.placeholderText} numberOfLines={1}>
                {doctorName || 'Doctor'}
              </Text>
            </View>
          ) : null}

          {/* The grab affordance. Without it a draggable thing looks like a fixed one. */}
          <View pointerEvents="none" style={styles.grip} />

          {/* The patient's OWN camera, inset. The reason this is here at all: with
              the call minimized there is otherwise no way to tell you are still in
              frame — and patients minimize mid-consultation to fetch a report. */}
          {room.cameraOn && selfID ? (
            <View style={styles.selfInset} pointerEvents="none">
              <ZegoAudioVideoView
                userID={selfID}
                useVideoViewAspectFill
                showSoundWave={false}
                foregroundBuilder={NoMask}
              />
            </View>
          ) : null}

          <View pointerEvents="none" style={styles.nameWrap}>
            <Text style={styles.name} numberOfLines={1}>
              {doctorName || 'Doctor'}
            </Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: W,
    height: H,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0C1A2C',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    elevation: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  videoLayer: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1F3557',
  },
  placeholderText: {
    fontFamily: F.PoppinsMedium,
    fontSize: 11,
    color: '#BFD5EC',
    paddingHorizontal: 8,
  },
  grip: {
    position: 'absolute',
    zIndex: 20,
    top: 6,
    alignSelf: 'center',
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  selfInset: {
    position: 'absolute',
    zIndex: 15,
    right: 6,
    bottom: 6,
    width: 38,
    height: 52,
    borderRadius: 9,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: '#1A2637',
  },
  nameWrap: {
    position: 'absolute',
    zIndex: 20,
    left: 6,
    bottom: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(7,12,22,0.62)',
    maxWidth: W - 56,
  },
  name: { fontFamily: F.PoppinsSemiBold, fontSize: 9.5, color: CC.white },
  target: {
    position: 'absolute',
    width: W,
    height: H,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(17,65,138,0.4)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(17,65,138,0.06)',
  },
  leaveZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 44,
    backgroundColor: 'rgba(220,38,38,0.14)',
  },
  leavePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(220,38,38,0.78)',
  },
  leavePillArmed: { backgroundColor: CC.danger },
  leaveText: { fontFamily: F.PoppinsSemiBold, fontSize: 13, color: CC.white },
});
