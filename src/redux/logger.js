// Redux Store Logger Utility
// This helps you see Redux store state and actions

export const logStoreState = store => {
  const state = store.getState();

  console.log('\n📦 === REDUX STORE STATE === 📦');
  console.log('Auth:', JSON.stringify(state.auth, null, 2));
  console.log('Profile:', JSON.stringify(state.profile, null, 2));
  console.log('Onboarding:', JSON.stringify(state.onboarding, null, 2));
  console.log('Home:', JSON.stringify(state.home, null, 2));
  console.log('Fitness:', JSON.stringify(state.fitness, null, 2));
  console.log('Nourish:', JSON.stringify(state.nourish, null, 2));
  console.log('Predict:', JSON.stringify(state.predictData, null, 2));
  console.log('========================\n');

  return state;
};

// Action logger middleware
export const actionLogger = store => next => action => {
  console.log('🎬 Dispatching action:', action.type);
  console.log('📝 Payload:', action.payload);

  const result = next(action);

  console.log('📊 New state:', store.getState());

  return result;
};

// Simple store subscriber
export const subscribeToStore = (store, callback) => {
  return store.subscribe(() => {
    const state = store.getState();
    callback(state);
  });
};
