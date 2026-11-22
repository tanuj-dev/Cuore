/* Tokens mirror the CuoreMD web portal (cuore_doctor_pan_web/src/index.css) so the doctor sees
 * one brand across both surfaces. Light and dark are separate palettes, never inverted maths. */
export type Palette = {
  brand: string;
  brandDark: string;
  brandSoft: string;
  heart: string;
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textMuted: string;
  textOnBrand: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  shadow: string;
  overlay: string;
  heroA: string;
  heroB: string;
  accents: Record<'teal' | 'violet' | 'amber' | 'rose' | 'sky' | 'green', { fg: string; bg: string }>;
  isDark: boolean;
};

export const lightPalette: Palette = {
  brand: '#1e64ac',
  brandDark: '#1e3a8a',
  brandSoft: '#dbeafe',
  heart: '#f43f5e',
  bg: '#f4f7fb',
  surface: '#ffffff',
  surface2: '#eef2f7',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  textOnBrand: '#ffffff',
  success: '#15803d',
  successSoft: '#dcfce7',
  warning: '#b45309',
  warningSoft: '#fef3c7',
  danger: '#be123c',
  dangerSoft: '#ffe4e6',
  info: '#1d4ed8',
  infoSoft: '#dbeafe',
  shadow: '#0f172a',
  overlay: 'rgba(15,23,42,0.45)',
  heroA: '#0b2f63',
  heroB: '#1e64ac',
  accents: {
    teal: { fg: '#0f766e', bg: '#ccfbf1' },
    violet: { fg: '#6d28d9', bg: '#ede9fe' },
    amber: { fg: '#b45309', bg: '#fef3c7' },
    rose: { fg: '#be123c', bg: '#ffe4e6' },
    sky: { fg: '#0369a1', bg: '#e0f2fe' },
    green: { fg: '#15803d', bg: '#dcfce7' },
  },
  isDark: false,
};

export const darkPalette: Palette = {
  brand: '#4f93d6',
  brandDark: '#1e3a8a',
  brandSoft: '#16304f',
  heart: '#fb7185',
  bg: '#0b1220',
  surface: '#141c2e',
  surface2: '#1e293b',
  border: '#27344b',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  textOnBrand: '#ffffff',
  success: '#4ade80',
  successSoft: '#12301f',
  warning: '#fbbf24',
  warningSoft: '#3a2a0b',
  danger: '#fb7185',
  dangerSoft: '#3b1420',
  info: '#60a5fa',
  infoSoft: '#16304f',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.6)',
  heroA: '#0a1d3d',
  heroB: '#17487f',
  accents: {
    teal: { fg: '#5eead4', bg: '#0f3330' },
    violet: { fg: '#c4b5fd', bg: '#2a1f4d' },
    amber: { fg: '#fcd34d', bg: '#3a2a0b' },
    rose: { fg: '#fda4af', bg: '#3b1420' },
    sky: { fg: '#7dd3fc', bg: '#0c2f45' },
    green: { fg: '#86efac', bg: '#12301f' },
  },
  isDark: true,
};
