import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';
import { CC, statusMeta } from './ccTheme';

const F = CC.fonts;

/* ------------------------------- Screen header -----------------------------
   The CuoreMD blue hero (shared HeroHeader), so every CuoreCare sub-screen opens like the
   rest of the app. The hero paints under the status bar itself, so screens using it must not
   add a top safe-area edge, and the clock is switched to light while the screen is focused. */
export function CCHeader({ title, subtitle, onBack, right }) {
  useLightStatusBar();
  return (
    <HeroHeader title={title} subtitle={subtitle} onBack={onBack} right={right} />
  );
}

/* --------------------------------- Buttons --------------------------------- */
export function PrimaryButton({ label, onPress, disabled, loading, style, icon }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[s.primaryBtn, (disabled || loading) && s.btnDisabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={CC.white} />
      ) : (
        <View style={s.btnRow}>
          {icon}
          <Text style={[s.primaryBtnText, icon && { marginLeft: 8 }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function SecondaryButton({ label, onPress, disabled, style, tone = 'default', icon }) {
  const danger = tone === 'danger';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        s.secondaryBtn,
        danger && { borderColor: CC.danger },
        disabled && s.btnDisabled,
        style,
      ]}
    >
      <View style={s.btnRow}>
        {icon}
        <Text
          style={[
            s.secondaryBtnText,
            danger && { color: CC.danger },
            icon && { marginLeft: 8 },
          ]}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/* -------------------------------- Status pill ------------------------------ */
export function StatusPill({ status, style }) {
  const meta = statusMeta(status);
  return (
    <View style={[s.pill, { backgroundColor: meta.bg }, style]}>
      <Text style={[s.pillText, { color: meta.fg }]}>{meta.label}</Text>
    </View>
  );
}

/* ------------------------------- Doctor avatar ----------------------------- */
export function DoctorAvatar({ uri, name, size = 48 }) {
  const [failedUri, setFailedUri] = React.useState(null);
  const initials = String(name || 'Dr')
    .replace(/^dr\.?\s*/i, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
  const dim = { width: size, height: size, borderRadius: size / 2 };
  // Only an absolute http(s) URL is tried, and one that fails to load falls back to the
  // initials: a dead link used to leave a blank grey circle on the doctor list.
  const url = typeof uri === 'string' ? uri.trim() : '';
  const usable = /^https?:\/\//i.test(url) && failedUri !== url;
  if (usable) {
    return <Image source={{ uri: url }} style={[s.avatar, dim]} onError={() => setFailedUri(url)} />;
  }
  return (
    <View style={[s.avatar, s.avatarFallback, dim]}>
      <Text style={[s.avatarInitials, { fontSize: size * 0.36 }]}>{initials || 'DR'}</Text>
    </View>
  );
}

/* -------------------------------- Empty state ------------------------------ */
export function EmptyState({ icon, title, message, action }) {
  return (
    <View style={s.empty}>
      {!!icon && <View style={s.emptyIcon}>{icon}</View>}
      <Text style={s.emptyTitle}>{title}</Text>
      {!!message && <Text style={s.emptyMessage}>{message}</Text>}
      {!!action && <View style={{ marginTop: 16, alignSelf: 'stretch' }}>{action}</View>}
    </View>
  );
}

/* ---------------------------------- Card ----------------------------------- */
export function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[s.card, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[s.card, style]}>{children}</View>;
}

const s = StyleSheet.create({
  primaryBtn: {
    backgroundColor: CC.primary,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontFamily: F.PoppinsSemiBold, fontSize: 15, color: CC.white },
  secondaryBtn: {
    backgroundColor: CC.white,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: CC.border,
  },
  secondaryBtnText: { fontFamily: F.PoppinsMedium, fontSize: 14, color: CC.text },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.5 },

  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontFamily: F.PoppinsMedium, fontSize: 11, letterSpacing: 0.2 },

  avatar: { backgroundColor: CC.surface },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: CC.primarySoft },
  avatarInitials: { fontFamily: F.PoppinsSemiBold, color: CC.primary },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  // Icon sits in a soft tinted circle so an empty list reads as friendly, not broken.
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: CC.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontFamily: F.PoppinsSemiBold, fontSize: 16, color: CC.text, textAlign: 'center' },
  emptyMessage: {
    fontFamily: F.PoppinsRegular,
    fontSize: 13,
    color: CC.subText,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },

  card: {
    backgroundColor: CC.card,
    borderRadius: CC.radius,
    borderWidth: 1,
    borderColor: CC.border,
    padding: 14,
    ...CC.shadow,
  },
});

export default {
  CCHeader,
  PrimaryButton,
  SecondaryButton,
  StatusPill,
  DoctorAvatar,
  EmptyState,
  Card,
};
