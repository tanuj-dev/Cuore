import { useWindowDimensions } from 'react-native';

/* One place that decides "phone or tablet". Layouts ask this instead of comparing widths
 * themselves, so the whole app changes shape at the same breakpoint. */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 720;
  const isLandscape = width > height;
  // Cap content width on big screens so lines of text stay readable.
  const contentMaxWidth = isTablet ? 960 : width;
  const columns = width >= 1000 ? 3 : width >= 560 ? 2 : 1;
  return { width, height, isTablet, isLandscape, contentMaxWidth, columns };
}
