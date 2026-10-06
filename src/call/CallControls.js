// ─────────────────────────────────────────────────────────────────────────────
// The in-call control bar.
//
// Three rules it exists to keep:
//
//   1. Every target is at least 54px. A patient using this may be unwell, older,
//      or holding the phone one-handed in a waiting room; the SDK's default bar
//      packed six 40px icons edge to edge.
//   2. Ending is SEPARATE and full-width, below the rest. It is the one
//      irreversible control on the screen, and it should never be something a
//      thumb reaching for "switch camera" can catch.
//   3. Muted reads as an ACTIVE state (filled, light) rather than an off one —
//      the convention every call app has converged on — and the icon changes
//      too, so it never depends on colour alone.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Mic, MicOff, Video, VideoOff, SwitchCamera, MessageSquare,
  Volume2, VolumeX, PhoneOff,
} from 'lucide-react-native';

import { CC } from '../screens/CuoreCare/ccTheme';

const F = CC.fonts;

function RoundButton({ label, active, onPress, children, badge }) {
  return (
    <TouchableOpacity
      style={[styles.round, active && styles.roundActive]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
    >
      {children}
      {badge ? <View style={styles.badge} /> : null}
    </TouchableOpacity>
  );
}

export default function CallControls({
  micOn = true,
  cameraOn = true,
  speakerOn = true,
  video = true,
  unreadChat = false,
  onToggleMic,
  onToggleCamera,
  onSwitchCamera,
  onToggleSpeaker,
  onOpenChat,
  onEnd,
}) {
  const ICON = 22;
  const on = CC.white;
  const off = '#0A1B34';

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <RoundButton label={micOn ? 'Mute microphone' : 'Unmute microphone'} active={!micOn} onPress={onToggleMic}>
          {micOn ? <Mic size={ICON} color={on} /> : <MicOff size={ICON} color={off} />}
        </RoundButton>

        {video ? (
          <RoundButton
            label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
            active={!cameraOn}
            onPress={onToggleCamera}
          >
            {cameraOn ? <Video size={ICON} color={on} /> : <VideoOff size={ICON} color={off} />}
          </RoundButton>
        ) : (
          <RoundButton
            label={speakerOn ? 'Speaker is on' : 'Speaker is off'}
            active={speakerOn}
            onPress={onToggleSpeaker}
          >
            {speakerOn ? <Volume2 size={ICON} color={off} /> : <VolumeX size={ICON} color={on} />}
          </RoundButton>
        )}

        {video ? (
          <RoundButton label="Switch camera" onPress={onSwitchCamera}>
            <SwitchCamera size={ICON} color={on} />
          </RoundButton>
        ) : null}

        <RoundButton label="Chat with the doctor" onPress={onOpenChat} badge={unreadChat}>
          <MessageSquare size={ICON} color={on} />
        </RoundButton>

        {video ? (
          <RoundButton
            label={speakerOn ? 'Speaker is on' : 'Speaker is off'}
            active={speakerOn}
            onPress={onToggleSpeaker}
          >
            {speakerOn ? <Volume2 size={ICON} color={off} /> : <VolumeX size={ICON} color={on} />}
          </RoundButton>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.end}
        onPress={onEnd}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="End consultation"
      >
        <PhoneOff size={20} color={CC.white} />
        <Text style={styles.endText}>End consultation</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: 10,
    borderRadius: 26,
    backgroundColor: 'rgba(12,20,34,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  round: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundActive: { backgroundColor: CC.white },
  badge: {
    position: 'absolute',
    top: 9,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: '#0C1422',
  },
  end: {
    marginTop: 12,
    height: 56,
    borderRadius: 20,
    backgroundColor: CC.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  endText: { fontFamily: F.PoppinsSemiBold, fontSize: 15, color: CC.white },
});
