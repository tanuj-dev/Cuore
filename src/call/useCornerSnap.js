// ─────────────────────────────────────────────────────────────────────────────
// Drag a small floating box anywhere; spring it to the nearest corner on release.
//
// Both floating things in a consultation behave this way — the minimized call
// bubble and the patient's own camera inside the full-screen call — so the
// gesture lives here once. They differ only in size, bounds and whether there is
// a "drop to leave" zone at the bottom.
//
// Why corners rather than free placement: free placement sounds kinder but ages
// badly. A box left at an arbitrary offset ends up half off the screen after a
// rotation or a keyboard, or parked exactly on the control the patient needs.
// Corners are predictable, reachable one-handed, and survive a resize — every
// recomputation of `corners` re-clamps whatever is already on screen.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const SPRING = { damping: 18, stiffness: 190, mass: 0.7 };

export function useCornerSnap({
  boxWidth,
  boxHeight,
  margin = 12,
  topInset = 0,
  bottomInset = 0,
  /* Height of the "drop here to leave" band at the bottom. 0 disables it. */
  leaveZone = 0,
  onLeave,
  /* Which corner it starts in: 0 TL, 1 TR, 2 BL, 3 BR. */
  startCorner = 3,
}) {
  const { width, height } = useWindowDimensions();
  const [dragging, setDragging] = useState(false);
  const [overLeave, setOverLeave] = useState(false);

  const corners = useMemo(() => {
    const left = margin;
    const right = Math.max(margin, width - boxWidth - margin);
    const top = topInset;
    const bottom = Math.max(top, height - bottomInset - boxHeight);
    return [
      { x: left, y: top },
      { x: right, y: top },
      { x: left, y: bottom },
      { x: right, y: bottom },
    ];
  }, [width, height, boxWidth, boxHeight, margin, topInset, bottomInset]);

  const x = useSharedValue(corners[startCorner].x);
  const y = useSharedValue(corners[startCorner].y);
  const lift = useSharedValue(0);
  const leaveY = leaveZone > 0 ? height - bottomInset - leaveZone : Infinity;

  /* A rotation, a split-screen resize or a font-size change moves the corners.
     Anything already parked has to come with them, or it is stranded off-screen
     with no way to reach it. */
  useEffect(() => {
    const maxX = Math.max(margin, width - boxWidth - margin);
    const maxY = Math.max(topInset, height - bottomInset - boxHeight);
    x.value = withSpring(Math.min(Math.max(x.value, margin), maxX), SPRING);
    y.value = withSpring(Math.min(Math.max(y.value, topInset), maxY), SPRING);
  }, [width, height, boxWidth, boxHeight, margin, topInset, bottomInset, x, y]);

  const settle = useCallback(
    (px, py) => {
      'worklet';
      let best = corners[0];
      let bestD = Infinity;
      for (let i = 0; i < corners.length; i += 1) {
        const c = corners[i];
        const d = (c.x - px) * (c.x - px) + (c.y - py) * (c.y - py);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      x.value = withSpring(best.x, SPRING);
      y.value = withSpring(best.y, SPRING);
    },
    [corners, x, y],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          lift.value = withTiming(1, { duration: 120 });
          runOnJS(setDragging)(true);
        })
        .onUpdate(e => {
          x.value = Math.min(Math.max(e.absoluteX - boxWidth / 2, margin), width - boxWidth - margin);
          y.value = Math.min(
            Math.max(e.absoluteY - boxHeight / 2, topInset - 8),
            height - bottomInset - boxHeight + 8,
          );
          if (leaveZone > 0) runOnJS(setOverLeave)(e.absoluteY > leaveY);
        })
        .onEnd(e => {
          lift.value = withTiming(0, { duration: 140 });
          runOnJS(setDragging)(false);
          if (leaveZone > 0) runOnJS(setOverLeave)(false);
          if (leaveZone > 0 && e.absoluteY > leaveY && onLeave) {
            runOnJS(onLeave)();
            return;
          }
          settle(x.value, y.value);
        }),
    [
      width, height, boxWidth, boxHeight, margin, topInset, bottomInset,
      leaveZone, leaveY, onLeave, settle, x, y, lift,
    ],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: 1 + lift.value * 0.06 },
    ],
  }));

  return { pan, animatedStyle, dragging, overLeave, corners };
}

export default useCornerSnap;
