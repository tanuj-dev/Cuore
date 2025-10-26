import { createAsyncThunk } from '@reduxjs/toolkit';
import { postApiCall, getApiCall, putApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';
import EncryptedStorage from 'react-native-encrypted-storage';

// src/store/thunks/getNourishment.ts

export const getNourish = createAsyncThunk(
  'nourishment/get',
  async (mealTime, { rejectWithValue }) => {
    try {
      const encodedMealTime = encodeURIComponent(mealTime); // handles "Lunch/Dinner"
      const response = await getApiCall(
        `/api/nourish/plan?meal_time=${encodedMealTime}`,
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch nourishment:', error);
      return rejectWithValue(
        error.response?.data || { message: 'Unknown error' },
      );
    }
  },
);

export const getRecipe = createAsyncThunk(
  'recipe/getById',
  async (recipeId, { rejectWithValue }) => {
    try {
      const url = `${EndPoints.GET_RECIPE}/${recipeId}`;
      const response = await getApiCall(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recipe:', error);
      return rejectWithValue(
        error.response?.data || { message: 'Unknown error' },
      );
    }
  },
);
export const getBuilderItems = createAsyncThunk(
  'builder/getItems',
  async ({ mealTime, cuisine }, { rejectWithValue }) => {
    try {
      const encodedMealTime = encodeURIComponent(mealTime);
      const encodedCuisine = encodeURIComponent(cuisine);
      const url = `${EndPoints.GET_BUILDER_ITEMS}?meal_time=${encodedMealTime}&cuisine=${encodedCuisine}`;
      const response = await getApiCall(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch builder items:', error);
      return rejectWithValue(
        error.response?.data || { message: 'Unknown error' },
      );
    }
  },
);
export const adjustPortion = createAsyncThunk(
  'portion/adjust',
  async ({ recommendedCalories, cartItems }, { rejectWithValue }) => {
    try {
      const response = await postApiCall(EndPoints.ADJUST_PORTION, {
        recommendedCalories,
        cartItems,
      });
      return response.data;
    } catch (error) {
      console.error('Adjust portion failed:', error);
      return rejectWithValue(error.response?.data || 'Something went wrong');
    }
  },
);

export const getKnowledge = createAsyncThunk(
  'knowledge/get',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await getApiCall(`/api/knowledge/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get knowledge failed:', error);
      return rejectWithValue(error.response?.data || 'Something went wrong');
    }
  },
);
