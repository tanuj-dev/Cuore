import { DefaultTheme, DarkTheme } from '@react-navigation/native';

export function buildNavigationTheme(colors, isDark) {
  const base = isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.card,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };
}
