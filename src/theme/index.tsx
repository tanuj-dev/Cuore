import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkPalette, lightPalette, Palette } from './palette';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 } as const;

export const font = {
  h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.4 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.2 },
  h3: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  small: { fontSize: 13, fontWeight: '500' as const },
  tiny: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.4 },
};

const ThemeContext = createContext<Palette>(lightPalette);

/* Follows the OS appearance. A doctor reading at night in a ward should not get a white slab. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const palette = useMemo(() => (scheme === 'dark' ? darkPalette : lightPalette), [scheme]);
  return <ThemeContext.Provider value={palette}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
export type { Palette };
