import { createAsyncThunk } from '@reduxjs/toolkit';
import { postApiCall, getApiCall, putApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

export const uploadPhoto = createAsyncThunk(
  'uploadPhoto/uploadPhoto',
  async (data, { rejectWithValue }) => {
    try {
      const response = await postApiCall(EndPoints.UPLOAD_PHOTO, data);
      if (response.status === 200) {
        return { data: response.data, success: true };
      } else {
        return rejectWithValue(
          { response: response.data, success: false } || 'Failed to upload photo',
        );
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to upload photo');
    }
  }
)