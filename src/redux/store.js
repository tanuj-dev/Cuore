import { configureStore } from '@reduxjs/toolkit';
import authSlices from './Auth/slice'; // this is the object with both reducers

import profileReducer from './Profile/slice';
import {
  onboardingSlice,
  onboardingSliceData,
  reassessmentSlice,
  cuoreScoreSlice,
} from './OnBoardng/slice';
import { fitnessSlice } from './Fitness/slice';

import { homeSlice } from './Home/slice';
import {
  nourishSlice,
  builderSlice,
  knowledgeSlice,
  mindSlice,
  tobaccoSlice,
} from './Explore/slice';
import { predictSlice } from './Predict/slice';
const store = configureStore({
  reducer: {
    auth: authSlices.auth,
    createAccount: authSlices.createAccount,
    onboarding: onboardingSlice.reducer,
    profile: profileReducer,
    onboardingdata: onboardingSliceData.reducer,
    reassessment: reassessmentSlice.reducer,
    home: homeSlice.reducer,
    cuoreScore: cuoreScoreSlice.reducer,
    nourish: nourishSlice.reducer,
    builder: builderSlice.reducer,
    fitness: fitnessSlice.reducer,
    knowledge: knowledgeSlice.reducer,
    mind: mindSlice.reducer,
    tobacco: tobaccoSlice.reducer,
    predict: predictSlice.reducer,
  },
});

export default store;
