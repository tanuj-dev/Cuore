import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { CC, statusMeta } from './ccTheme';

const F = CC.fonts;

/* ------------------------------- Screen header ----------------------------- */
export function CCHeader({ title, subtitle, onBack, right }) {
  return (
    <View style={s.header}>
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={s.backBtn}
        >
          <ChevronLeft size={24} color={CC.text} />
        </TouchableOpacity>
      ) : (
        <View style={s.backBtn} />
      )}
      <View style={s.headerTitleWrap}>
        <Text style={s.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={s.headerSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={s.headerRight}>{right || <View style={s.backBtn} />}</View>
    </View>
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
  const initials = String(name || 'Dr')
    .replace(/^dr\.?\s*/i, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
  const dim = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return <Image source={{ uri }} style={[s.avatar, dim]} />;
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CC.white,
    borderBottomWidth: 1,
    borderBottomColor: CC.border,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: { fontFamily: F.PoppinsSemiBold, fontSize: 17, color: CC.text },
  headerSubtitle: { fontFamily: F.PoppinsRegular, fontSize: 12, color: CC.subText, marginTop: 1 },
  headerRight: { minWidth: 32, alignItems: 'flex-end' },

  primaryBtn: {
    backgroundColor: CC.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontFamily: F.PoppinsSemiBold, fontSize: 15, color: CC.white },
  secondaryBtn: {
    backgroundColor: CC.white,
    borderRadius: 12,
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
  emptyIcon: { marginBottom: 12 },
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CC.border,
    padding: 14,
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
