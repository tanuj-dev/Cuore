/* eslint-disable no-mixed-operators */
import {Dimensions, PixelRatio} from 'react-native';
import {
  widthPercentageToDP,
  heightPercentageToDP,
} from 'react-native-responsive-screen';
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const DesignHeight = 812;
const DesignWidth = 375;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
// It is based on the screen width of your design layouts e.g Height 600 x Width 375
const scale = SCREEN_WIDTH / 375;

export function normalize(size: any) {
  return PixelRatio.roundToNearestPixel(size * scale);
}
export const wp = widthPercentageToDP;
export const hp = heightPercentageToDP;
export const vw = (width: number) => {
  // Parse string percentage input and convert it to number.
  const percent = (width / DesignWidth) * 100;
  const elemWidth = parseFloat(`${percent}%`);
  // Use PixelRatio.roundToNearestPixel method in order to round the layout
  // size (dp) to the nearest one that corresponds to an integer number of pixels.
  return PixelRatio.roundToNearestPixel((screenWidth * elemWidth) / 100);
};

export const vh = (height: number) => {
  // Parse string percentage input and convert it to number.
  const percent = (height / DesignHeight) * 100;
  const elemHeight = parseFloat(`${percent}%`);

  // Use PixelRatio.roundToNearestPixel method in order to round the layout
  // size (dp) to the nearest one that corresponds to an integer number of pixels.
  return PixelRatio.roundToNearestPixel((screenHeight * elemHeight) / 100);
};

// https://medium.com/building-with-react-native/how-to-develop-responsive-uis-with-react-native-1x03-a448097c9503
// import {Dimensions, PixelRatio} from 'react-native';
// const widthPercentageToDP = widthPercent => {
//   const screenWidth = Dimensions.get('window').width;
//   // Convert string input to decimal number
//   const elemWidth = parseFloat(widthPercent);
//   return PixelRatio.roundToNearestPixel(screenWidth * elemWidth / 100);
// };
// const heightPercentageToDP = heightPercent => {
//   const screenHeight = Dimensions.get('window').height;
//   // Convert string input to decimal number
//   const elemHeight = parseFloat(heightPercent);
// return PixelRatio.roundToNearestPixel(screenHeight * elemHeight / 100);
// };
// export {
//   widthPercentageToDP,
//   heightPercentageToDP
// };
