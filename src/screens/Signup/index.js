import { View, Text } from 'react-native';
import React from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';

const Signup = () => {
  const { colors: c } = useAppTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.background, padding: 16 }}>
      <Text style={{ color: c.text }}>Signup</Text>
    </View>
  );
};

export default Signup;
