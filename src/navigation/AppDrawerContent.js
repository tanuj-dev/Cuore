// src/navigation/AppDrawerContent.js
// -----------------------------------------------------------------------------
// What the drawer shows. Kept separate from DrawerNavigator.js so the MENU can be
// rewritten without touching the navigation wiring underneath it.
//
// The menu is DRAWER_ITEMS — the owner's list: Records, Bookings, Prescriptions, and Logout.
// Changing it should mean editing that array and nothing else: every entry is either
//
//   { tab: 'CuoreCare' }                        → switch to that bottom tab
//   { tab: 'Profile', screen: 'HealthRecords' } → that tab, then that screen inside its stack
//   { root: 'Notifications' }                   → a screen on the ROOT stack, outside the tabs
//
// and `go()` below is what turns any of those into the right nested navigate. Nothing else
// in the drawer needs to know how the navigators are nested. Logout is not one of these —
// it ends the session rather than going anywhere, so it sits on its own at the bottom.
// -----------------------------------------------------------------------------
import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerActions } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarDays, FileText, LogOut, Pill } from 'lucide-react-native';

import images from '../utilities/Images';
import { hp } from '../utilities';
import { navigationRef } from './navigationRef';
import { logoutUser } from '../redux/Auth/authThunk';
import { teardownCalls } from '../call/callManager';
import { useCustomAlert } from '../hooks/useCustomAlert';

const BRAND = '#11418A';

const DRAWER_ITEMS = [
  {
    key: 'records',
    label: 'Records',
    icon: FileText,
    tab: 'Profile',
    screen: 'HealthRecords',
  },
  // Bookings and Prescriptions both live in the CuoreCare tab, which only exists for an
  // entitled account (see BottomTabNavigator) — `cuoreCare` marks them so they are hidden
  // rather than left as dead taps for everyone else.
  {
    key: 'bookings',
    label: 'Bookings',
    icon: CalendarDays,
    tab: 'CuoreCare',
    screen: 'CuoreCareHome',
    cuoreCare: true,
  },
  {
    key: 'prescriptions',
    label: 'Prescriptions',
    icon: Pill,
    tab: 'CuoreCare',
    screen: 'CuoreCareHistory',
    cuoreCare: true,
  },
];

export default function AppDrawerContent({ navigation, state }) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();

  const profile = useSelector(s => s?.profile?.data?.data?.user);
  const photo = profile?.photo_url || profile?.photoUrl;
  const name = profile?.display_name || 'Your account';

  // The CuoreCare tab only exists for entitled accounts (see BottomTabNavigator), so an entry
  // pointing at it would be a dead tap for everyone else. Same source of truth, not a copy of
  // the rule.
  const cuoreCareActive = useSelector(
    s => s?.cuoreCare?.access?.cuoreCare || s?.cuoreCare?.access?.emr,
  );

  /* One place that knows the shape of the tree: Home → Drawer → "Tabs" → the bottom tabs →
   * each tab's own stack. A drawer item only ever says WHERE it wants to go. */
  const go = useCallback(
    item => {
      navigation.dispatch(DrawerActions.closeDrawer());
      if (item.root) {
        navigation.navigate(item.root);
        return;
      }
      navigation.navigate('Tabs', {
        screen: item.tab,
        /* `initial: false` is load-bearing. Without it, a drawer jump straight to a screen
           inside a tab's stack makes THAT screen the stack's first route: back then leaves the
           tab entirely (you land on Today), and the tab keeps reopening on it afterwards. With
           it, the tab's own root sits underneath, so back goes where it reads like it should —
           Health records → Profile — and the tab is left where the user left it. */
        ...(item.screen ? { params: { screen: item.screen, initial: false } } : {}),
      });
    },
    [navigation],
  );

  /* Logout. Same two steps the Profile screen's own Logout does — clear the session, then send
   * the ROOT navigator to Login — plus teardownCalls(), because a live consultation must not
   * outlive the account that is in it. Reset goes through navigationRef rather than walking
   * `getParent()` twice: the drawer sits one level deeper than Profile does, and a hard-coded
   * number of parents is exactly the kind of thing that breaks the next time the tree changes.
   */
  const onLogout = useCallback(() => {
    alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          navigation.dispatch(DrawerActions.closeDrawer());
          try {
            teardownCalls();
          } catch (_) {
            /* never let a call-teardown problem trap someone in a session they asked to leave */
          }
          await dispatch(logoutUser());
          navigationRef.current?.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  }, [alert, dispatch, navigation]);

  // Which tab is showing, so the matching row reads as current. Read off the drawer's own
  // state rather than tracked separately — there is only one truth about where we are.
  const activeTab = (() => {
    const tabsRoute = state?.routes?.find(r => r.name === 'Tabs');
    const tabState = tabsRoute?.state;
    if (!tabState || typeof tabState.index !== 'number') return null;
    return tabState.routes?.[tabState.index]?.name || null;
  })();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <TouchableOpacity
        style={styles.profileRow}
        activeOpacity={0.8}
        onPress={() => go({ tab: 'Profile', screen: 'ProfileMain' })}
      >
        <Image
          source={photo ? { uri: photo } : images.PROFILE}
          style={styles.avatar}
        />
        <View style={styles.profileText}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.subtle} numberOfLines={1}>
            View profile
          </Text>
        </View>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {DRAWER_ITEMS.filter(i => !i.cuoreCare || cuoreCareActive).map(item => {
          const Icon = item.icon;
          const current = !item.screen && item.tab === activeTab;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.item, current && styles.itemActive]}
              activeOpacity={0.7}
              onPress={() => go(item)}
            >
              <Icon size={hp(2.2)} color={current ? BRAND : '#475569'} />
              <Text style={[styles.itemLabel, current && styles.itemLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Pinned to the bottom, away from the navigation items: it is the one row here that
          does something irreversible rather than taking you somewhere. */}
      <TouchableOpacity
        style={[styles.logout, { paddingBottom: insets.bottom + 14 }]}
        activeOpacity={0.7}
        onPress={onLogout}
      >
        <LogOut size={hp(2.2)} color="#DC2626" />
        <Text style={styles.logoutLabel}>Logout</Text>
      </TouchableOpacity>

      {AlertComponent}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#E2E8F0' },
  profileText: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  subtle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  list: { paddingTop: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 14,
  },
  itemActive: { backgroundColor: '#EEF3FC' },
  itemLabel: { fontSize: 15, color: '#334155' },
  itemLabelActive: { color: BRAND, fontWeight: '600' },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
  },
  logoutLabel: { fontSize: 15, color: '#DC2626', fontWeight: '600' },
});
