import Fonts from '../../utilities/Fonts';

/**
 * CuoreCare shared design tokens. Mirrors the palette the base app already uses (see
 * theme/colors.js + Checkout) so the feature feels native to Cuore: #11418A primary on a
 * slate neutral scale, Poppins type. Kept local to the feature so it can evolve without
 * touching global theme.
 */
export const CC = {
  primary: '#11418A',
  primarySoft: '#EFF6FF',
  text: '#1E293B',
  subText: '#64748B',
  muted: '#94A3B8',
  border: '#E2E8F0',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  success: '#059669',
  successSoft: '#D1FAE5',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  white: '#FFFFFF',
  fonts: Fonts,
};

// Appointment status → { label, fg, bg }. Keep keys in sync with backend Appointment.STATUS.
export const STATUS_META = {
  requested: { label: 'Requested', fg: '#B45309', bg: '#FEF3C7' },
  accepted: { label: 'Confirmed', fg: '#11418A', bg: '#EFF6FF' },
  scheduled: { label: 'Confirmed', fg: '#11418A', bg: '#EFF6FF' },
  in_progress: { label: 'In progress', fg: '#059669', bg: '#D1FAE5' },
  completed: { label: 'Completed', fg: '#475569', bg: '#F1F5F9' },
  cancelled: { label: 'Cancelled', fg: '#DC2626', bg: '#FEE2E2' },
  missed: { label: 'Missed', fg: '#DC2626', bg: '#FEE2E2' },
  no_show_patient: { label: 'Missed', fg: '#DC2626', bg: '#FEE2E2' },
  no_show_doctor: { label: 'Doctor no-show', fg: '#DC2626', bg: '#FEE2E2' },
};

export const statusMeta = status =>
  STATUS_META[status] || { label: status || 'Unknown', fg: '#475569', bg: '#F1F5F9' };

// Consultation mode → { label, iconName (lucide) }. `in_person` is a walk-in/OPD visit
// the doctor created directly (no live call) — everything else here assumes video/voice/
// chat by default, so this must be listed explicitly or it silently renders as "Video
// consult".
export const MODE_META = {
  video: { label: 'Video consult', icon: 'Video' },
  voice: { label: 'Voice consult', icon: 'Phone' },
  chat: { label: 'Chat consult', icon: 'MessageSquare' },
  in_person: { label: 'In-person visit', icon: 'Stethoscope' },
};

export const modeMeta = mode => MODE_META[mode] || MODE_META.video;

export default CC;
