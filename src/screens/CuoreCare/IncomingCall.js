// Full-screen incoming-call UI (patient app) — WhatsApp/FaceTime-style (§1/§7).
// Launched from App.js on a realtime `call:incoming` (the doctor started the consultation).
// Rings (vibration + tone) until the patient accepts/rejects, the doctor cancels, or it
// times out. Accept enters the ZEGO consultation; Reject tells the backend (→ doctor sees it).
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, PhoneOff, Video, MessageSquare } from 'lucide-react-native';

import { CC } from './ccTheme';
import { DoctorAvatar } from './components';
import { startRing, stopRing } from '../../realtime/ringtone';
import { getSocket } from '../../realtime/socket';
import { EV as CC_EV } from '../../realtime/events';
import { recordConsultationEvent } from '../../redux/CuoreCare/thunks';

const F = CC.fonts;
const RING_TIMEOUT_MS = 45000;
const MODE_ICON = { video: Video, voice: Phone, chat: MessageSquare };
const MODE_LABEL = { video: 'video', voice: 'voice', chat: 'chat' };

export default function IncomingCall({ navigation, route }) {
  const { appointmentId, mode = 'video', from = {}, appointment } = route.params || {};
  const answeredRef = useRef(false);
  const pulse = useRef(new Animated.Value(0)).current;

  const ModeIcon = MODE_ICON[mode] || Video;
  const doctorName = from.name || 'Your doctor';

  const dismiss = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const onAccept = () => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    stopRing();
    const doctorId = appointment?.doctorId?._id || appointment?.doctorId;
    navigation.replace('CuoreCareConsultation', {
      appointmentId,
      mode,
      doctorId,
      doctorName,
    });
  };

  const onReject = () => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    stopRing();
    recordConsultationEvent(appointmentId, 'declined'); // best-effort → doctor is notified
    dismiss();
  };

  useEffect(() => {
    startRing();

    // Pulsing halo behind the avatar.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();

    // Auto-dismiss (missed) if unanswered — the backend no-show cron finalises the status.
    const timeout = setTimeout(() => {
      if (!answeredRef.current) {
        answeredRef.current = true;
        stopRing();
        dismiss();
      }
    }, RING_TIMEOUT_MS);

    // Doctor cancelled / call ended before the patient answered → stop ringing + dismiss.
    const s = getSocket();
    const onRemoteEnd = p => {
      if (p && p.appointmentId && p.appointmentId !== appointmentId) return;
      if (answeredRef.current) return;
      answeredRef.current = true;
      stopRing();
      dismiss();
    };
    if (s) {
      s.on(CC_EV.CALL_ENDED, onRemoteEnd);
      s.on(CC_EV.CALL_MISSED, onRemoteEnd);
      s.on(CC_EV.CALL_DECLINED, onRemoteEnd);
    }

    return () => {
      clearTimeout(timeout);
      loop.stop();
      stopRing();
      if (s) {
        s.off(CC_EV.CALL_ENDED, onRemoteEnd);
        s.off(CC_EV.CALL_MISSED, onRemoteEnd);
        s.off(CC_EV.CALL_DECLINED, onRemoteEnd);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  const haloStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={CC.primary} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <Text style={styles.incomingLabel}>Incoming {MODE_LABEL[mode] || mode} consultation</Text>
          <Text style={styles.brand}>CuoreCare</Text>
        </View>

        <View style={styles.center}>
          <View style={styles.avatarWrap}>
            <Animated.View style={[styles.halo, haloStyle]} />
            <DoctorAvatar uri={from.photoUrl} name={doctorName} size={116} />
          </View>
          <Text style={styles.name}>{doctorName}</Text>
          <View style={styles.modeRow}>
            <ModeIcon size={15} color="rgba(255,255,255,0.85)" />
            <Text style={styles.modeText}>is calling you…</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <View style={styles.actionCol}>
            <TouchableOpacity style={[styles.callBtn, styles.reject]} onPress={onReject} activeOpacity={0.85}>
              <PhoneOff size={28} color={CC.white} />
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Decline</Text>
          </View>
          <View style={styles.actionCol}>
            <TouchableOpacity style={[styles.callBtn, styles.accept]} onPress={onAccept} activeOpacity={0.85}>
              <ModeIcon size={28} color={CC.white} />
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Accept</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CC.primary },
  safe: { flex: 1, justifyContent: 'space-between' },
  top: { alignItems: 'center', paddingTop: 28 },
  incomingLabel: { fontFamily: F.PoppinsMedium, fontSize: 13.5, color: 'rgba(255,255,255,0.8)' },
  brand: { fontFamily: F.PoppinsSemiBold, fontSize: 15, color: CC.white, marginTop: 4, letterSpacing: 0.3 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  halo: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  name: { fontFamily: F.PoppinsSemiBold, fontSize: 24, color: CC.white, textAlign: 'center' },
  modeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 7 },
  modeText: { fontFamily: F.PoppinsRegular, fontSize: 14.5, color: 'rgba(255,255,255,0.85)' },

  actions: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 40, paddingBottom: 36 },
  actionCol: { alignItems: 'center', gap: 12 },
  callBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reject: { backgroundColor: CC.danger },
  accept: { backgroundColor: CC.success },
  actionLabel: { fontFamily: F.PoppinsMedium, fontSize: 13, color: 'rgba(255,255,255,0.9)' },
});
