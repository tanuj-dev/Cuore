import { Video, Phone, MessageSquare, Stethoscope } from 'lucide-react-native';
import Fonts from '../../utilities/Fonts';

/**
 * CuoreCare shared design tokens. Brand navy (#11418A) stays the primary so the feature
 * still reads as Cuore, but the neutrals are warmed slightly and a small family of friendly
 * accents (coral, teal, amber, violet, sky) is available for icon chips, section cards and
 * hero gradients — Launch Edits 13 Nov: "make Home & CuoreCare vibrant & happier" while
 * staying clinical. Kept local to the feature so it can evolve without touching global theme.
 */
export const CC = {
  primary: '#11418A',
  primarySoft: '#EAF1FD',
  text: '#1E293B',
  subText: '#5F6B7D',
  muted: '#98A2B3',
  border: '#E9E6F0',
  surface: '#F8F7FC',
  card: '#FFFFFF',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  success: '#059669',
  successSoft: '#D1FAE5',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  white: '#FFFFFF',

  // Friendly accents. Each has a soft tint for chip / card backgrounds.
  accentCoral: '#EF6F5A',
  accentCoralSoft: '#FFEDE8',
  accentTeal: '#0E9F8E',
  accentTealSoft: '#DDF6F1',
  accentAmber: '#D98A06',
  accentAmberSoft: '#FFF3D6',
  accentViolet: '#7457D6',
  accentVioletSoft: '#EFEAFE',
  accentSky: '#2B7BE4',
  accentSkySoft: '#E5F0FD',

  // Soft hero wash (top → bottom) and the vivid CTA gradient (left → right).
  heroGradient: ['#E4EDFD', '#F3EEFD', '#FDF1EC'],
  ctaGradient: ['#11418A', '#2B6CC4'],

  radius: 18,
  // Gentle elevation, spread rather than dark.
  shadow: {
    shadowColor: '#1E2A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  fonts: Fonts,
};

// Appointment status → { label, fg, bg }. Keep keys in sync with backend Appointment.STATUS.
export const STATUS_META = {
  requested: { label: 'Requested', fg: '#B45309', bg: '#FEF3C7' },
  accepted: { label: 'Confirmed', fg: '#11418A', bg: '#EAF1FD' },
  scheduled: { label: 'Confirmed', fg: '#11418A', bg: '#EAF1FD' },
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

// Icon COMPONENTS (not name strings, unlike MODE_META.icon above) for the few screens that
// render the icon directly rather than through a name→component lookup. Single source of
// truth — previously duplicated as a local MODE_ICON const in AppointmentCard.js and
// AppointmentDetails.js.
const MODE_ICON_COMPONENT = { video: Video, voice: Phone, chat: MessageSquare, in_person: Stethoscope };
export const modeIcon = mode => MODE_ICON_COMPONENT[mode] || MODE_ICON_COMPONENT.video;

export default CC;
