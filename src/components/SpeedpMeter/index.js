// components/GaugeMeter.js
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';

const GaugeMeter = ({ value = 50, size = 250, thickness = 20 }) => {
  const radius = size / 2;
  const strokeWidth = thickness;
  const center = radius;
  const needleLength = radius - strokeWidth;

  const clampValue = Math.max(0, Math.min(value, 100));
  const angle = (clampValue / 100) * 180;
  const theta = (Math.PI * (180 - angle)) / 180;

  const needleX = center + needleLength * Math.cos(theta);
  const needleY = center - needleLength * Math.sin(theta);

  const arcPath = (startAngle, endAngle, color) => {
    const start = polarToCartesian(
      center,
      center,
      radius - strokeWidth / 2,
      endAngle,
    );
    const end = polarToCartesian(
      center,
      center,
      radius - strokeWidth / 2,
      startAngle,
    );
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return (
      <Path
        d={`M ${start.x} ${start.y} A ${radius - strokeWidth / 2} ${
          radius - strokeWidth / 2
        } 0 ${largeArcFlag} 0 ${end.x} ${end.y}`}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
    );
  };

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const angleRad = (Math.PI * angleDeg) / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy - r * Math.sin(angleRad),
    };
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={radius + 40}>
        {/* Color Segments */}
        {arcPath(180, 98, '#FC3A21')} {/* Red */}
        {arcPath(98, 55, '#FF8D10')} {/* Orange */}
        {arcPath(55, 0, '#15D270')} {/* Green */}
        {/* Needle */}
        <Line
          x1={center}
          y1={center}
          x2={needleX}
          y2={needleY}
          stroke="#1E88E5"
          strokeWidth="5"
        />
        <Circle cx={center} cy={center} r="6" fill="#1E88E5" />
        {/* Score */}
        <SvgText
          x={center}
          y={center + 30}
          fontSize="24"
          fill="#1E88E5"
          textAnchor="middle"
          fontFamily="Roboto-Regular"
        >
          {Math.round(clampValue)}
        </SvgText>
        {/* Labels */}
        <SvgText x={0} y={center + 10} fontSize="12" fill="black">
          0
        </SvgText>
        {/* <SvgText x={center - 40} y={center - 80} fontSize="12" fill="black">
          25
        </SvgText>
        <SvgText x={center + 40} y={center - 80} fontSize="12" fill="black">
          75
        </SvgText> */}
        <SvgText x={size - 20} y={center + 10} fontSize="12" fill="black">
          100
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    // marginVertical: 20,
  },
});

export default GaugeMeter;
