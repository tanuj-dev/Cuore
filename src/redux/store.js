import { configureStore } from '@reduxjs/toolkit';
import authSlices from './Auth/slice'; // this is the object with both reducers
import { userDataSlice } from './Auth/slice';
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
} from './Explore/slice';
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
    userData: userDataSlice.reducer,
  },
});

export default store;
