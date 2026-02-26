import { createAsyncThunk } from '@reduxjs/toolkit';
import { postApiCallWithBaseUrl } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';
import Constants from '../../utilities/Constants';

const SHARE_BASE_URL = Constants.SHARE_BASE_URL || 'https://cuore-backend-1.onrender.com';

export const shareData = createAsyncThunk(
  'share/shareData',
  async (data, { rejectWithValue }) => {
    try {
      const response = await postApiCallWithBaseUrl(
        SHARE_BASE_URL,
        EndPoints.SHARE_DATA,
        data,
      );
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
