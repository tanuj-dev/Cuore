import { createSlice } from '@reduxjs/toolkit';
import { updateBasicInfo } from '../thunks/basicInfoThunk';
import { submitHealthHistory } from '../thunks/healthHistoryThunk';
import { submitLifestyle } from '../thunks/lifestyleThunk';
import { submitEatingExercise } from '../thunks/eatingExerciseThunk';
import { submitSleepStress } from '../thunks/sleepStressThunk';

const basicInfoSlice = createSlice({
  name: 'basicInfo',
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(updateBasicInfo.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBasicInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(updateBasicInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
      });
  },
});

const healthHistorySlice = createSlice({
  name: 'healthHistory',
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(submitHealthHistory.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitHealthHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(submitHealthHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
      });
  },
});

const lifestyleSlice = createSlice({
  name: 'lifestyle',
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(submitLifestyle.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitLifestyle.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(submitLifestyle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
      });
  },
});
const eatingExerciseSlice = createSlice({
  name: 'eatingExercise',
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(submitEatingExercise.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitEatingExercise.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(submitEatingExercise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
      });
  },
});

const sleepStressSlice = createSlice({
  name: 'sleepStress',
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(submitSleepStress.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitSleepStress.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(submitSleepStress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
      });
  },
});
const biomarkersSlice = createSlice({
  name: 'biomarkers',
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(submitBiomarkers.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitBiomarkers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(submitBiomarkers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
      });
  },
});

export default {
  basicInfo: basicInfoSlice.reducer,
  healthHistory: healthHistorySlice.reducer,
  lifestyle: lifestyleSlice.reducer,
  eatingExercise: eatingExerciseSlice.reducer,
  biomarkers: biomarkersSlice.reducer,
  sleepStress: sleepStressSlice.reducer,
};
