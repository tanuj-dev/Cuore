import { getHealthRecord, getHomeData } from './homeThunk';
import { createSlice } from '@reduxjs/toolkit';

export const homeSlice = createSlice({
  name: 'home',
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {
    clearHomeData: state => {
      state.data = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getHomeData.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getHomeData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getHomeData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});
export const getHealth = createSlice({
  name: 'health',
  initialState: {
    loading: false,
    data: null,
    error: null,
  },
  reducers: {
    clearHealthData: state => {
      state.data = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getHealthRecord.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getHealthRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getHealthRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});
// export const { clearHomeData } = homeSlice.actions;
