// CuoreMD spec — a doctor-issued medicine/follow-up/vaccine reminder is a normal Reminder/
// TimelineCard everywhere else in the app (see backend controllers/timelineController.js
// generateTimelineCardsForDay), except it also needs an accept/decline response from the
// patient. These two calls are the only thing that's actually new; the reminder itself
// already shows up on Today via the existing getHomeData pipeline.
import { createAsyncThunk } from '@reduxjs/toolkit';
import { getApiCall, putApiCall } from '../../utilities/Services';

// Every doctor-issued reminder still awaiting this patient's response, so the Today screen
// can mark which of today's cards should show Accept/Decline (matched locally by `sourceId`,
// which every dailySchedule item already carries).
export const getPendingDoctorReminders = createAsyncThunk(
  'reminders/getPendingDoctor',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await getApiCall(
        `/api/v1/timeline/${userId}/reminders/pending-doctor`,
      );
      return response.data?.reminders || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data || 'Failed to load doctor reminders',
      );
    }
  },
);

export const respondToDoctorReminder = createAsyncThunk(
  'reminders/respond',
  async ({ userId, reminderId, status }, { rejectWithValue }) => {
    try {
      const endpoint = `/api/v1/timeline/${userId}/reminders/${reminderId}/respond`;
      const response = await putApiCall(endpoint, { status });
      return { reminderId, status, data: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || 'Failed to respond to reminder',
      );
    }
  },
);
