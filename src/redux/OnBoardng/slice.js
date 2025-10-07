import { createSlice } from '@reduxjs/toolkit';
import {
  onBoarding2,
  onBoarding3,
  onBoarding4,
  onBoarding5,
  onBoarding6,
  onBoarding7,
} from './onBoardingThunk';

const onBoardingTwo = createSlice({
  name: 'basicInfo',
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(onBoarding2.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(onBoarding2.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(onBoarding2.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
      });
  },
});

const onBoardingThree = createSlice({
  name: 'healthHistory',
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(onBoarding3.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(onBoarding3.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(onBoarding3.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
      });
  },
});

const onBoardingFour = createSlice({
  name: 'lifestyle',
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(onBoarding4.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(onBoarding4.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(onBoarding4.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
      });
  },
});
const onBoardingFive = createSlice({
  name: 'eatingExercise',
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(onBoarding5.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(onBoarding5.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(onBoarding5.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
      });
  },
});

const onBoardingSix = createSlice({
  name: 'sleepStress',
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(onBoarding6.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(onBoarding6.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(onBoarding6.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
      });
  },
});
const onBoardingSeven = createSlice({
  name: 'biomarkers',
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(onBoarding7.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(onBoarding7.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(onBoarding7.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
      });
  },
});

export default {
  basicInfo: onBoardingTwo.reducer,
  healthHistory: onBoardingThree.reducer,
  lifestyle: onBoardingFour.reducer,
  eatingExercise: onBoardingFive.reducer,
  biomarkers: onBoardingSeven.reducer,
  sleepStress: onBoardingSix.reducer,
};
