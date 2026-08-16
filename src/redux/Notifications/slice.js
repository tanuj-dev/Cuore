import { createSlice } from '@reduxjs/toolkit';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './thunks';

const initialState = {
  items: [],
  unreadCount: 0,
  page: 1,
  total: 0,
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    resetNotifications: () => initialState,
  },
  extraReducers: builder => {
    builder
      .addCase(fetchNotifications.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        const { page, total, unreadCount, notifications } = action.payload;
        state.loading = false;
        state.unreadCount = unreadCount || 0;
        state.total = total || 0;
        state.page = page || 1;
        // Page 1 (initial load / pull-to-refresh) replaces the list; later pages append.
        state.items = (page || 1) > 1 ? [...state.items, ...(notifications || [])] : (notifications || []);
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load notifications';
      })

      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const id = action.payload;
        const note = state.items.find(n => n._id === id);
        if (note && !note.read) {
          note.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })

      .addCase(markAllNotificationsRead.fulfilled, state => {
        state.items.forEach(n => { n.read = true; });
        state.unreadCount = 0;
      });
  },
});

export const { resetNotifications } = notificationsSlice.actions;
export default notificationsSlice;
