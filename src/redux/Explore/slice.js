import { createSlice } from '@reduxjs/toolkit';
import { getNourish, getRecipe } from './exploreThunk';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import { getBuilderItems } from './exploreThunk';
import { getKnowledge } from './exploreThunk';

export const nourishSlice = createSlice({
  name: 'nourishment',
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getNourish.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNourish.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getNourish.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});
export const builderSlice = createSlice({
  name: 'builder',
  initialState: {
    itemsByCombo: {}, // key: `${mealTime}_${cuisine}`
    loadingByCombo: {},
    errorByCombo: {},
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getBuilderItems.pending, (state, action) => {
        console.log('Fetching builder items for:', action);
        const { mealTime, cuisine } = action.meta.arg;
        const key = `${mealTime}_${cuisine}`;
        state.loadingByCombo[key] = true;
        state.errorByCombo[key] = null;
      })
      .addCase(getBuilderItems.fulfilled, (state, action) => {
        const { mealTime, cuisine } = action.meta.arg;
        const key = `${mealTime}_${cuisine}`;
        state.loadingByCombo[key] = false;
        state.itemsByCombo[key] = action.payload;
      })
      .addCase(getBuilderItems.rejected, (state, action) => {
        const { mealTime, cuisine } = action.meta.arg;
        const key = `${mealTime}_${cuisine}`;
        state.loadingByCombo[key] = false;
        state.errorByCombo[key] = action.payload;
      });
  },
});
const initialState = {
  data: null,
  loading: false,
  error: null,
};

export const knowledgeSlice = createSlice({
  name: 'knowledge',
  initialState,
  reducers: {
    resetKnowledgeState: state => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getKnowledge.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getKnowledge.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getKnowledge.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch knowledge data';
      });
  },
});
