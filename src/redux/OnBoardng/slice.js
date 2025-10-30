import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';

import { submitOnboarding } from './onBoardingThunk';
import { getOnboardingThunk } from './onBoardingThunk';
import { createReassessment } from './onBoardingThunk';
import { getCuoreScoreThunk } from './onBoardingThunk';

export const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(submitOnboarding.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitOnboarding.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(submitOnboarding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

const onBoardingDataInitialState = {
  data: null,
  loading: false,
  error: null,
};

export const onboardingSliceData = createSlice({
  name: 'onboarding',
  initialState: onBoardingDataInitialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getOnboardingThunk.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOnboardingThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getOnboardingThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

const initialState = {
  loading: false,
  data: null,
  error: null,
};

export const reassessmentSlice = createSlice({
  name: 'reassessment',
  initialState,
  reducers: {
    resetReassessment: state => {
      state.loading = false;
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createReassessment.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReassessment.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(createReassessment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export const cuoreScoreSlice = createSlice({
  name: 'cuoreScore',
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getCuoreScoreThunk.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCuoreScoreThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getCuoreScoreThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

// export default cuoreScoreSlice.reducer;

// export default onboardingSlice.reducer;
// export default onboardingdata.reducer;
