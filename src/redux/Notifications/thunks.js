import { createAsyncThunk } from '@reduxjs/toolkit';
import { getApiCall, putApiCall } from '../../utilities/Services';

/**
 * In-app notification center (backend: /api/v1/notifications, models/Notification.js).
 * Uses the general Services.js API client (not utilities/cuoreCareApi.js) — these routes
 * live under the main `/api/v1/...` prefix alongside timeline/users, not `/api/cuorecare/*`.
 */

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    const res = await getApiCall('/api/v1/notifications', `?page=${page}&limit=${limit}`);
    if (res?.status === 200 && res.data?.status === 'success') {
      return res.data; // { page, total, unreadCount, notifications }
    }
    return rejectWithValue(res?.data || { message: 'Could not load notifications' });
  },
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (notificationId, { rejectWithValue }) => {
    const res = await putApiCall(`/api/v1/notifications/${notificationId}/read`, {});
    if (res?.status === 200 && res.data?.status === 'success') {
      return notificationId;
    }
    return rejectWithValue(res?.data || { message: 'Could not mark notification read' });
  },
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_arg, { rejectWithValue }) => {
    const res = await putApiCall('/api/v1/notifications/read-all', {});
    if (res?.status === 200 && res.data?.status === 'success') {
      return true;
    }
    return rejectWithValue(res?.data || { message: 'Could not mark notifications read' });
  },
);
