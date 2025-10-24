import { createSlice } from '@reduxjs/toolkit';
import { getFitness } from './fitnessThunk';

const initialState = {
  data: null,
  loading: false,
  error: null,
};

export const fitnessSlice = createSlice({
  name: 'fitness',
  initialState,
  reducers: {
    resetFitnessState: state => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getFitness.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFitness.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getFitness.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch fitness data';
      });
  },
});

// export const { resetFitnessState } = fitnessSlice.actions;
// export default fitnessSlice.reducer;
