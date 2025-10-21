import { View, Text, ActivityIndicator } from 'react-native';
import React from 'react';

const Loader = ({}) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
      }}
    >
      <ActivityIndicator size="large" color="#1E64AC" />
      <Text style={{ marginTop: 10, color: '#1E64AC', fontSize: 16 }}>
        Loading your data...
      </Text>
    </View>
  );
};

export default Loader;
