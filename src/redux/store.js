import { configureStore } from '@reduxjs/toolkit';
import authSlices from './Auth/slice'; // this is the object with both reducers
import profileReducer from './Profile/slice';
import onBoardingSlices from './OnBoardng/slice';

const store = configureStore({
  reducer: {
    auth: authSlices.auth,
    createAccount: authSlices.createAccount,
    onBoard2: onBoardingSlices.basicInfo,
    onBoard3: onBoardingSlices.healthHistory,
    onBoard4: onBoardingSlices.lifestyle,
    onBoard5: onBoardingSlices.eatingExercise,
    onBoard6: onBoardingSlices.biomarkers,
    onBoard7: onBoardingSlices.sleepStress,
    profile: profileReducer,
  },
});

export default store;
