import { createAsyncThunk } from '@reduxjs/toolkit';
import { postApiCall, getApiCall, putApiCall } from '../../utilities/Services';
import EndPoints from '../../utilities/Endpoints';

export const getPresRecordsThunk = createAsyncThunk(
    'getPresRecords',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getApiCall(EndPoints.GET_PRESCRIPTION);
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