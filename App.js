import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import store from './src/redux/store';
import Navigator from './src/navigation';

const App = () => {
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      console.log('[Store Changed]', store.getState());
    });

    return () => unsubscribe();
  }, []);

  return (
    <Provider store={store}>
      <Navigator />
    </Provider>
  );
};

export default App;
