// ─────────────────────────────────────────────────────────────────────────────
// The minimized ("PiP-style") call window that floats above the whole app.
//
// The video itself is ZEGO's own `ZegoUIKitPrebuiltCallFloatingMinimizedView`: it is the
// component the SDK's minimize mechanism drives, it renders the ACTIVE REMOTE
// participant's stream, it is draggable, and tapping it maximizes the call. Mounting it
// persistently is what keeps the room alive while the consultation screen is unmounted.
//
// On top of it we add the chrome the SDK does not provide: a call pill with the doctor's
// name, a live timer, an explicit "Return to call" target and an End button — so there is
// always an obvious, non-gestural way back to the full-screen call.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { ZegoUIKitPrebuiltCallFloatingMinimizedView } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { Maximize2, PhoneOff, Video, Phone } from 'lucide-react-native';

import { CC } from '../screens/CuoreCare/ccTheme';
import { useCallState } from './useCallState';
import { CallStatus } from './callState';
import { restoreCall, endCall } from './callManager';

const F = CC.fonts;

const MINI_WIDTH = 104;
const MINI_HEIGHT = 168;

function fmtDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function CallPill({ doctorName, mode, connectedAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ModeIcon = mode === 'voice' ? Phone : Video;
  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;

  return (
    <View style={[styles.pillWrap, { top: topInset + 6 }]} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.pill}
        activeOpacity={0.85}
        onPress={restoreCall}
        accessibilityRole="button"
        accessibilityLabel="Return to the full screen consultation"
      >
        <ModeIcon size={15} color={CC.white} />
        <Text style={styles.pillText} numberOfLines={1}>
          {doctorName || 'Consultation'}
        </Text>
        <Text style={styles.pillTimer}>
          {connectedAt ? fmtDuration(now - connectedAt) : '00:00'}
        </Text>
        <View style={styles.pillDivider} />
        <Maximize2 size={15} color={CC.white} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.endBtn}
        activeOpacity={0.85}
        onPress={() => endCall('local_hangup', { fromFloating: true })}
        accessibilityRole="button"
        accessibilityLabel="End consultation"
      >
        <PhoneOff size={16} color={CC.white} />
      </TouchableOpacity>
    </View>
  );
}

export default function CallFloatingWindow() {
  const { status, minimized, pip, doctorName, mode, connectedAt } = useCallState();

  // In system PiP the whole window IS the call, so no in-app chrome.
  const showChrome = minimized && !pip && status !== CallStatus.IDLE;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Persistent by design — the SDK drives its own visibility. */}
      <ZegoUIKitPrebuiltCallFloatingMinimizedView
        width={MINI_WIDTH}
        height={MINI_HEIGHT}
        borderRadius={14}
        showSoundWaveInAudioMode
      />
      {showChrome && (
        <CallPill doctorName={doctorName} mode={mode} connectedAt={connectedAt} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pillWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CC.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  pillText: { flex: 1, fontFamily: F.PoppinsMedium, fontSize: 13, color: CC.white },
  pillTimer: {
    fontFamily: F.PoppinsSemiBold,
    fontSize: 13,
    color: CC.white,
    fontVariant: ['tabular-nums'],
  },
  pillDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  endBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: CC.danger,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});
