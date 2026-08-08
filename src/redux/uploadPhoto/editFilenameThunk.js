import { createAsyncThunk } from '@reduxjs/toolkit';
import { putApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

/**
 * Rename a health record. The custom document name is the primary name shown
 * everywhere (patient app and doctor panel), so this is a first-class action.
 * @param {{ recordId: string, name: string }} payload
 */
export const editFilename = createAsyncThunk(
  'uploadPhoto/editFilename',
  async ({ recordId, name, fileName }, { rejectWithValue }) => {
    try {
      const endpoint = `${EndPoints.HEALTH_RECORDS}/${recordId}`;
      const response = await putApiCall(endpoint, { name: name || fileName });

      if (response?.status === 200) {
        return { data: response.data, success: true };
      }
      return rejectWithValue(
        response?.data?.error ||
          response?.data?.message ||
          'Failed to rename record',
      );
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          'Failed to rename record',
      );
    }
  },
);
