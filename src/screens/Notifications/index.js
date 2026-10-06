import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, BellOff, Trash2 } from 'lucide-react-native';
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={onMarkAllRead} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          {items.length > 0 && (
            <TouchableOpacity
              onPress={onDeleteAll}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              accessibilityLabel="Delete all notifications"
            >
              <Text style={styles.deleteAllText}>Delete all</Text>
            </TouchableOpacity>
          )}
          {unreadCount === 0 && items.length === 0 && <View style={styles.headerSpacer} />}
        </View>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#11418A" />
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
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#11418A" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, !item.read && styles.rowUnread]}
              onPress={() => onPressItem(item)}
              activeOpacity={0.8}
            >
              {!item.read && <View style={styles.dot} />}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
  },
  title: { fontSize: 17, fontFamily: F.PoppinsSemiBold, color: '#1E293B' },
  markAllText: { fontSize: 13, fontFamily: F.PoppinsMedium, color: '#11418A' },
  // The two header actions sit together on the right. Destructive one last, so a tap aimed at
  // "Mark all read" cannot land on "Delete all" by being a few pixels off.
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: wp(3) },
  deleteAllText: { fontSize: 13, fontFamily: F.PoppinsMedium, color: '#DC2626' },
  headerSpacer: { width: wp(20) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: wp(10) },
  emptyTitle: { fontSize: 15, fontFamily: F.PoppinsSemiBold, color: '#1E293B', marginTop: hp(1.5) },
  emptyMsg: { fontSize: 13, fontFamily: F.PoppinsRegular, color: '#64748B', textAlign: 'center', marginTop: hp(0.5) },
  list: { paddingHorizontal: wp(4), paddingBottom: hp(3) },
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#11418A',
    marginRight: wp(2.5),
    marginTop: 6,
  },
  rowTitle: { fontSize: 14, fontFamily: F.PoppinsSemiBold, color: '#1E293B' },
  rowBody: { fontSize: 13, fontFamily: F.PoppinsRegular, color: '#475569', marginTop: 2 },
  rowTime: { fontSize: 11, fontFamily: F.PoppinsRegular, color: '#94A3B8', marginTop: 4 },
});
