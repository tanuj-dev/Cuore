import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getThemeColors } from '../theme/colors';

export function useAppTheme() {
  const mode = useSelector(state => state.theme?.mode || 'light');
  const colors = useMemo(() => getThemeColors(mode), [mode]);
  const isDark = mode === 'dark';
  return { mode, colors, isDark };
}
