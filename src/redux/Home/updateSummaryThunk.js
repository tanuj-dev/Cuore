import { createAsyncThunk } from '@reduxjs/toolkit';
import { putApiCall } from '../../utilities/Services';
import Endpoints from '../../utilities/Endpoints';

export const updateAISummary = createAsyncThunk(
    'health/updateAISummary',
    async ({ userId, summary }, { rejectWithValue }) => {
        console.log('Updating AI summary for userId:', userId);
        console.log('Summary data:', summary);
        try {
            const endpoint = Endpoints.EDIT_AI_SUMMARY;
            const body = {
                userId,
                summary: {
                    past_history: summary.past_history || [],
                    medications: summary.medications || [],
                    labs: summary.labs || [],
                    imaging: summary.imaging || [],
                },
            };

            console.log('PUT request body:', body);
            const response = await putApiCall(endpoint, body);
            console.log('Update AI Summary API Response:', response);

            if (response?.status === 200) {
                return { data: response.data, success: true };
            } else {
                return rejectWithValue({
                    data: response.data,
                    success: false,
                    message: response?.data?.message || 'Failed to update summary',
                });
            }
        } catch (error) {
            console.error('Update AI Summary Error:', error);
            return rejectWithValue(
                error.response?.data || 'Failed to update AI summary',
            );
        }
    },
);
