import { createSlice } from '@reduxjs/toolkit';
import { getPredict } from './predictThunk';

export const predictSlice = createSlice({
  name: 'predict',
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getPredict.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPredict.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getPredict.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});
