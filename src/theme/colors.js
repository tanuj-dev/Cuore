export const lightColors = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  subText: '#64748B',
  border: '#E2E8F0',
  primary: '#11418A',
  danger: '#EF4444',
  icon: '#64748B',
  tabInactive: '#94A3B8',
};

export const darkColors = {
  background: '#0F172A',
  surface: '#111827',
  card: '#1F2937',
  text: '#F8FAFC',
  subText: '#94A3B8',
  border: '#334155',
  primary: '#60A5FA',
  danger: '#F87171',
  icon: '#CBD5E1',
  tabInactive: '#94A3B8',
};

export const getThemeColors = mode =>
  mode === 'dark' ? darkColors : lightColors;
