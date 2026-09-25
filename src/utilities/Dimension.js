/* eslint-disable no-mixed-operators */
import {Dimensions, PixelRatio} from 'react-native';
const DesignHeight = 812;
const DesignWidth = 375;

/* Every size below reads Dimensions.get('window') FRESH on each call rather than once at
 * module load (react-native-responsive-screen's own widthPercentageToDP/heightPercentageToDP,
 * previously re-exported as wp/hp here, cache screenWidth/screenHeight in a module-scope
 * variable — see its index.js). On a slower device the native bridge can still be reporting a
 * 0x0 window when this module first evaluates, which froze every hp()/wp()/vw()/vh() value at
 * 0 for the rest of the app's life — a screen built entirely from these (e.g. CycleTracker)
 * renders with zero-size elements: structurally present, invisible, no crash. `Dimensions.get`
 * itself is not a snapshot; only capturing its result in a top-level const was. */
export function normalize(size: any) {
  const {width: screenWidth} = Dimensions.get('window');
  const scale = screenWidth / 375;
  return PixelRatio.roundToNearestPixel(size * scale);
}

export const wp = (widthPercent: any) => {
  const {width: screenWidth} = Dimensions.get('window');
  const elemWidth = typeof widthPercent === 'number' ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((screenWidth * elemWidth) / 100);
};

export const hp = (heightPercent: any) => {
  const {height: screenHeight} = Dimensions.get('window');
  const elemHeight = typeof heightPercent === 'number' ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((screenHeight * elemHeight) / 100);
};

export const vw = (width: number) => {
  const {width: screenWidth} = Dimensions.get('window');
  // Parse string percentage input and convert it to number.
  const percent = (width / DesignWidth) * 100;
  const elemWidth = parseFloat(`${percent}%`);
  // Use PixelRatio.roundToNearestPixel method in order to round the layout
  // size (dp) to the nearest one that corresponds to an integer number of pixels.
  return PixelRatio.roundToNearestPixel((screenWidth * elemWidth) / 100);
};

export const vh = (height: number) => {
  const {height: screenHeight} = Dimensions.get('window');
  // Parse string percentage input and convert it to number.
  const percent = (height / DesignHeight) * 100;
  const elemHeight = parseFloat(`${percent}%`);

  // Use PixelRatio.roundToNearestPixel method in order to round the layout
  // size (dp) to the nearest one that corresponds to an integer number of pixels.
  return PixelRatio.roundToNearestPixel((screenHeight * elemHeight) / 100);
};
