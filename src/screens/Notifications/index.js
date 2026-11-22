import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeroHeader from '../../components/ui/HeroHeader';
import { useLightStatusBar } from '../../hooks/useLightStatusBar';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { Bell, BellOff, Trash2 } from 'lucide-react-native';
import moment from 'moment';
import { hp, wp, Fonts } from '../../utilities';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../../redux/Notifications/thunks';
import { resolveScreen, navigateFromNotification } from '../../utils/notificationNavigation';
import { navigationRef } from '../../navigation/navigationRef';

const F = Fonts;

export default function Notifications({ navigation }) {
  const insets = useSafeAreaInsets();
  useLightStatusBar();
  const dispatch = useDispatch();
  const { items, unreadCount, loading } = useSelector(state => state.notifications);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh every time this screen comes into focus — e.g. after tapping the bell again,
  // or coming back from wherever a notification tap navigated to.
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchNotifications({ page: 1 }));
    }, [dispatch]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchNotifications({ page: 1 }));
    setRefreshing(false);
  }, [dispatch]);

  // Tapping a row uses the exact same resolver + navigator the real OS push uses (App.js),
  // so an in-app tap and a push tap always land on the same screen with the same params.
  const onPressItem = item => {
    if (!item.read) dispatch(markNotificationRead(item._id));
    navigateFromNotification(navigationRef, resolveScreen(item.data), item.data);
  };

  const onMarkAllRead = () => {
    if (unreadCount > 0) dispatch(markAllNotificationsRead());
  };

  // Deleting is irreversible and the rows sit under a tappable area, so it asks first rather
  // than acting on the tap. Only the inbox entry goes — the appointment, prescription or
  // certificate it points at is untouched, which is what the confirm text says.
  const onDeleteItem = item => {
    Alert.alert(
      'Delete notification',
      'This removes it from your notifications. The appointment or document it refers to is not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await dispatch(deleteNotification(item._id));
            if (res.meta.requestStatus === 'rejected') {
              Alert.alert(
                'Could not delete',
                res.payload?.message || 'Please check your connection and try again.',
              );
            }
          },
        },
      ],
    );
  };

  /* DELETE ALL. Irreversible and it clears rows the user cannot see on screen (the inbox is
   * paginated), so the confirmation says how many and says plainly that nothing the
   * notifications point at is affected — the same promise the single delete makes. */
  const onDeleteAll = () => {
    if (!items.length) return;
    Alert.alert(
      'Delete all notifications',
      'This empties your notifications. The appointments and documents they refer to are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: async () => {
            const res = await dispatch(deleteAllNotifications());
            if (res.meta.requestStatus === 'rejected') {
              Alert.alert(
                'Could not clear notifications',
                res.payload?.message || 'Please check your connection and try again.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    // Edge to edge (see EDGE_TO_EDGE in navigation): the blue hero paints under the status bar.
    <View style={styles.safe}>
      <HeroHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
        onBack={() => navigation.goBack()}
        bottom={20}
      >
        {items.length > 0 ? (
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={onMarkAllRead}
                style={styles.headerPill}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={styles.headerPillText}>Mark all read</Text>
              </TouchableOpacity>
            )}
            {/* Destructive one last, so a tap aimed at "Mark all read" cannot land on it. */}
            <TouchableOpacity
              onPress={onDeleteAll}
              style={styles.headerPill}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              accessibilityLabel="Delete all notifications"
            >
              <Text style={styles.headerPillText}>Delete all</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </HeroHeader>

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E64AC" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <BellOff size={40} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyMsg}>We'll let you know when there's something new.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item._id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + hp(3) }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E64AC" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, !item.read && styles.rowUnread]}
              onPress={() => onPressItem(item)}
              activeOpacity={0.8}
            >
              <View style={styles.iconTile}>
                <Bell size={17} color="#1E64AC" />
                {!item.read && <View style={styles.dot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowBody} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.rowTime}>{moment(item.createdAt).fromNow()}</Text>
              </View>
              {/* Nested touchable: RN does not bubble a handled press to the parent, so this
                  deletes without also firing the row's navigate-to-screen press. */}
              <TouchableOpacity
                onPress={() => onDeleteItem(item)}
                style={styles.deleteBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel={`Delete notification: ${item.title}`}
              >
                <Trash2 size={17} color="#94A3B8" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7FB' },
  headerActions: { flexDirection: 'row', gap: wp(2.5), marginTop: hp(1.8), marginLeft: 52 },
  headerPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  headerPillText: { fontSize: 12.5, fontFamily: F.PoppinsMedium, color: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: wp(10) },
  emptyTitle: { fontSize: 15, fontFamily: F.PoppinsSemiBold, color: '#1E293B', marginTop: hp(1.5) },
  emptyMsg: { fontSize: 13, fontFamily: F.PoppinsRegular, color: '#64748B', textAlign: 'center', marginTop: hp(0.5) },
  list: { paddingHorizontal: wp(4), paddingTop: hp(2) },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: wp(3.5),
    marginBottom: hp(1.2),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowUnread: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  deleteBtn: { paddingLeft: wp(2.5), paddingTop: hp(0.2) },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  // Unread marker on the tile's corner.
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E64AC',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  rowTitle: { fontSize: 14, fontFamily: F.PoppinsSemiBold, color: '#1E293B' },
  rowBody: { fontSize: 13, fontFamily: F.PoppinsRegular, color: '#475569', marginTop: 2 },
  rowTime: { fontSize: 11, fontFamily: F.PoppinsRegular, color: '#94A3B8', marginTop: 4 },
});
