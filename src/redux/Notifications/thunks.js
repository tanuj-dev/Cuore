import { createAsyncThunk } from '@reduxjs/toolkit';
import { getApiCall, putApiCall, deleteApiCall } from '../../utilities/Services';

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

/**
 * Remove one notification from the inbox. Deliberately NOT optimistic: the row is only
 * dropped from the list once the server confirms, so a failed delete can't make a row vanish
 * and then reappear on the next refresh.
 *
 * `wasUnread` comes back from the server because the badge has to be decremented and the
 * client can't tell after the fact whether the deleted row counted toward it.
 */
export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (notificationId, { rejectWithValue }) => {
    const res = await deleteApiCall(`/api/v1/notifications/${notificationId}`);
    if (res?.status === 200 && res.data?.status === 'success') {
      return { id: notificationId, wasUnread: !!res.data.wasUnread };
    }
    return rejectWithValue(res?.data || { message: 'Could not delete notification' });
  },
);

/**
 * Empty the inbox. One call, not one per row: deleting thirty notifications one at a time is
 * thirty requests, thirty chances to half-fail, and a list that empties in front of the user in
 * stages.
 */
export const deleteAllNotifications = createAsyncThunk(
  'notifications/deleteAll',
  async (_arg, { rejectWithValue }) => {
    const res = await deleteApiCall('/api/v1/notifications');
    if (res?.status === 200 && res.data?.status === 'success') {
      return { deleted: res.data.deleted || 0 };
    }
    return rejectWithValue(res?.data || { message: 'Could not clear notifications' });
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
