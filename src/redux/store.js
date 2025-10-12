import { configureStore } from '@reduxjs/toolkit';
import authSlices from './Auth/slice'; // this is the object with both reducers
import profileReducer from './Profile/slice';
import {
  onboardingSlice,
  onboardingSliceData,
  reassessmentSlice,
} from './OnBoardng/slice';
import { homeSlice } from './Home/slice';

const store = configureStore({
  reducer: {
    auth: authSlices.auth,
    createAccount: authSlices.createAccount,
    onboarding: onboardingSlice.reducer,
    profile: profileReducer,
    onboardingdata: onboardingSliceData.reducer,
    reassessment: reassessmentSlice.reducer,
    home: homeSlice.reducer,
  },
});

export default store;
