import { createAsyncThunk } from '@reduxjs/toolkit';
import { postApiCall, getApiCall, putApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

export const shareData = createAsyncThunk(
  'share/shareData',
  async (data, { rejectWithValue }) => {
    try {
      const response = await postApiCall(EndPoints.SHARE_DATA, data);
      if (response.status === 200) {
        return { data: response.data, success: true };
      } else {
        return rejectWithValue(
          { response: response.data, success: false } || 'Failed to share data',
        );
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to share data');
    }
  },
);

// export const getShareData = createAsyncThunk(
//   'share/getShareData',
//   async (data, { rejectWithValue }) => {
//     try {
//       const response = await getApiCall(EndPoints.GET_SHARE_DATA, data);
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || 'Failed to get share data');
//     }
//   },
// );
