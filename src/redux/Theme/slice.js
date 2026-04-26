import { createSlice } from '@reduxjs/toolkit';

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    mode: 'light',
  },
  reducers: {
    setThemeMode: (state, action) => {
      if (action.payload === 'dark' || action.payload === 'light') {
        state.mode = action.payload;
      }
    },
    toggleThemeMode: state => {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
    },
  },
});

export const { setThemeMode, toggleThemeMode } = themeSlice.actions;
export default themeSlice.reducer;
