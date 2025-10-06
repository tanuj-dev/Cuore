import { configureStore } from '@reduxjs/toolkit';
import authSlices from './Auth/slice'; // this is the object with both reducers
import profileReducer from './Profile/slice';

const store = configureStore({
  reducer: {
    auth: authSlices.auth,
    createAccount: authSlices.createAccount,
    profile: profileReducer,
  },
});

export default store;
