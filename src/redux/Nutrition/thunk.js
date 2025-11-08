// redux/thunks/searchThunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { getApiCall } from '../../utilities/Services';

export const searchBuilderThunk = createAsyncThunk(
  'builder/search',
  async (query, { rejectWithValue }) => {
    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const response = await getApiCall(
        `/api/builder/search?query=${encodedQuery}`,
      );
      return { status: response.status, data: response.data };
    } catch (error) {
      return rejectWithValue({
        status: error.response?.status || 500,
        data: error.response?.data || { message: 'Unknown error' },
      });
    }
  },
);
