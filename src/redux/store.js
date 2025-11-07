import { configureStore } from '@reduxjs/toolkit';
import authSlices from './Auth/slice'; // this is the object with both reducers

import { profileSlice } from './Profile/slice';
import {
  onboardingSlice,
  onboardingSliceData,
  reassessmentSlice,
  cuoreScoreSlice,
} from './OnBoardng/slice';
import { fitnessSlice } from './Fitness/slice';

import { homeSlice, getHealth } from './Home/slice';
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
    profile: profileSlice.reducer,
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
    predictData: predictSlice.reducer,
    health: getHealth.reducer,
  },
});

export default store;
