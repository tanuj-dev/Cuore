import {View, Text} from 'react-native';
// import SplashScreen from 'react-native-splash-screen';
import React, {useEffect} from 'react';
import Navigator from './src/navigation';

const App = () => {
  useEffect(() => {
    // SplashScreen.hide();
  }, []);

  return <Navigator />;
};

export default App;
