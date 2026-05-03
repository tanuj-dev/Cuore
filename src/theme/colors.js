export const lightColors = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#334155',
  subText: '#64748B',
  border: '#E2E8F0',
  cardBorder: '#E2E8F0',
  primary: '#11418A',
  danger: '#EF4444',
  icon: '#64748B',
  tabInactive: '#94A3B8',
  onPrimary: '#FFFFFF',
  divider: '#F1F5F9',
  mutedSurface: '#F1F5F9',
  handleBar: '#D1D5DB',
  decorationCircle: 'rgba(17,65,138,0.05)',
  decorationCircleSm: 'rgba(17,65,138,0.04)',
  headerChipBlueBg: '#EFF6FF',
  headerChipBlueBorder: '#BFDBFE',
  headerChipBlueText: '#1E40AF',
  headerChipRoseBg: '#FEF2F2',
  headerChipRoseBorder: '#FECACA',
  headerChipRoseText: '#DC2626',
  headerChipIconBg: 'rgba(255, 255, 255, 0.92)',
  taskRingBorder: '#94A3B8',
  taskRingFill: '#11418A',
  quoteBg: '#F5F3FF',
  quoteText: '#7C3AED',
  quoteBorder: '#9333EA',
  alertRedBg: '#FEE4E4',
  alertRedText: '#B91C1C',
  alertRedIcon: '#EF4444',
  alertYellowBg: '#FEFCE8',
  alertYellowText: '#A16207',
  alertYellowIcon: '#CA8A04',
  alertOrangeBg: 'rgba(244, 186, 98, 0.35)',
  alertOrangeText: '#A16207',
  alertOrangeIcon: '#A16207',
  bioButtonBg: '#ECFDF5',
  bioButtonBorder: '#A7F3D0',
  bioButtonText: '#047857',
  streakBg: '#FEF9C3',
  streakBorder: 'rgba(245, 158, 11, 0.35)',
  streakTitle: '#78350F',
  streakSubtitle: '#92400E',
  journeyBadgeText: '#FFFFFF',
  exploreGridImageOverlay: 'transparent',
};

export const darkColors = {
  // 🌑 Base Layers (fixed hierarchy)
  background: '#020617', // deep blue-black (base)
  card: '#0B1220', // slightly elevated
  surface: '#111827', // secondary layer
  mutedSurface: '#1E293B', // higher surface

  // 📝 Text
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  subText: '#94A3B8',

  // 🔲 Borders & Dividers (softer)
  border: 'rgba(148,163,184,0.2)',
  cardBorder: 'rgba(255,255,255,0.28)',
  divider: 'rgba(148,163,184,0.15)',

  // 🎯 Brand Colors
  primary: '#60A5FA',
  onPrimary: '#FFFFFF',
  danger: '#F87171',

  // 🎨 Icons & Tabs
  icon: '#CBD5E1',
  tabInactive: '#94A3B8',

  // ✨ Decorative Elements
  decorationCircle: 'rgba(96,165,250,0.12)',
  decorationCircleSm: 'rgba(96,165,250,0.08)',

  // 🔵 Header Chips (Blue)
  headerChipBlueBg: 'rgba(96,165,250,0.12)',
  headerChipBlueBorder: 'rgba(96,165,250,0.35)',
  headerChipBlueText: '#93C5FD',

  // 🌹 Header Chips (Rose)
  headerChipRoseBg: 'rgba(248,113,113,0.12)',
  headerChipRoseBorder: 'rgba(248,113,113,0.35)',
  headerChipRoseText: '#FCA5A5',

  // 🧩 Icon background
  headerChipIconBg: 'rgba(255,255,255,0.06)',

  // 📊 Task Ring
  taskRingBorder: '#334155',
  taskRingFill: '#60A5FA',

  // 💬 Quote (same family as card — no purple wash on black home)
  quoteBg: '#0B1220',
  quoteText: '#CBD5E1',
  quoteBorder: 'rgba(148,163,184,0.28)',

  // 🚨 Alerts (card-like panels; icon keeps severity hue)
  alertRedBg: '#0B1220',
  alertRedText: '#E2E8F0',
  alertRedIcon: '#F87171',

  alertYellowBg: '#0B1220',
  alertYellowText: '#E2E8F0',
  alertYellowIcon: '#EAB308',

  alertOrangeBg: '#0B1220',
  alertOrangeText: '#E2E8F0',
  alertOrangeIcon: '#FB923C',

  // ✅ Bio / “Update readings” (match blue chips — no bright green slab)
  bioButtonBg: 'rgba(96,165,250,0.12)',
  bioButtonBorder: 'rgba(96,165,250,0.35)',
  bioButtonText: '#93C5FD',

  // 🔥 Streak UI
  streakBg: '#1E293B',
  streakBorder: 'rgba(251,191,36,0.45)',
  streakTitle: '#FBBF24',
  streakSubtitle: '#FDE68A',

  // 🏷️ Misc
  journeyBadgeText: '#FFFFFF',

  // 🎛️ Small UI
  handleBar: '#475569',

  exploreGridImageOverlay: 'rgba(0, 0, 0, 0.45)',
};

/**
 * Light mode: keep palette aligned with `lightColors` + legacy literals below.
 * Dark mode: `darkColors` + overrides. Do not substitute dark values on the light branch.
 */
export const getThemeColors = mode => {
  const base = mode === 'dark' ? darkColors : lightColors;
  const isDark = mode === 'dark';
  const L = lightColors;
  return {
    ...base,
    /** Mono back / edit icons on headers & dark cards */
    navIconTint: isDark ? '#FFFFFF' : '#1E293B',
    /** Onboarding copy (labels, options, helper lines) */
    onboardingSubtitle: isDark ? '#FFFFFF' : L.subText,
    onboardingLabel: isDark ? '#FFFFFF' : L.subText,
    onboardingOption: isDark ? '#FFFFFF' : '#374151',
    onboardingQuestion: isDark ? '#FFFFFF' : L.text,
    onboardingNote: isDark ? '#E2E8F0' : '#6B7280',
    /** Step 1 disclaimer panel */
    disclaimerPanelBg: isDark ? '#111827' : '#FEFCE8',
    disclaimerPanelBorder: isDark ? 'rgba(250,204,21,0.45)' : '#FDE047',
    disclaimerPanelText: isDark ? '#FFFFFF' : '#92400E',
    /** Step 7 awareness callout */
    onboardingWarningBg: isDark ? '#111827' : '#FFFBEB',
    onboardingWarningBorder: isDark ? 'rgba(251,191,36,0.45)' : '#FDE047',
    /** TextInput placeholder — light: `lightColors.subText` (unchanged); dark: tab inactive */
    inputPlaceholder: isDark ? base.tabInactive : L.subText,
  };
};
