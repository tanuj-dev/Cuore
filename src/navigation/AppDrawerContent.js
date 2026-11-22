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
import { View, Image, StyleSheet, Pressable, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerActions } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import {
  CalendarDays,
  ChevronRight,
  FileText,
  LogOut,
  Pill,
} from 'lucide-react-native';

import images from '../utilities/Images';
import { navigationRef } from './navigationRef';
import { logoutUser } from '../redux/Auth/authThunk';
import { teardownCalls } from '../call/callManager';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { Text } from '../components/ui/Text';
import HeroDiscs from '../components/ui/HeroDiscs';
import { font, radius, spacing, useTheme } from '../theme';

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
  const t = useTheme();
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
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      {/* Header: the same blue gradient hero as the rest of the restyled app. */}
      <Pressable
        onPress={() => go({ tab: 'Profile', screen: 'ProfileMain' })}
        accessibilityRole="button"
        accessibilityLabel="View profile"
        style={[styles.header, { paddingTop: insets.top + spacing.xl }]}
      >
        <LinearGradient
          colors={[t.brandDark, t.brand]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <HeroDiscs />
        <Image
          source={photo ? { uri: photo } : images.PROFILE}
          style={styles.avatar}
        />
        <Text style={[font.h3, styles.name]} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.viewProfile}>
          <Text style={[font.small, styles.viewProfileText]}>View profile</Text>
          <ChevronRight size={14} color="rgba(255,255,255,0.85)" />
        </View>
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[font.small, styles.section, { color: t.textMuted }]}>
          MENU
        </Text>
        {DRAWER_ITEMS.filter(i => !i.cuoreCare || cuoreCareActive).map(item => {
          const Icon = item.icon;
          const current = !item.screen && item.tab === activeTab;
          return (
            <Pressable
              key={item.key}
              onPress={() => go(item)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.item,
                {
                  backgroundColor: current ? t.brandSoft : t.surface,
                  borderColor: t.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <View style={[styles.iconTile, { backgroundColor: t.brandSoft }]}>
                <Icon size={18} color={t.brand} />
              </View>
              <Text
                style={[
                  font.bodyStrong,
                  styles.itemLabel,
                  { color: current ? t.brand : t.text },
                ]}
              >
                {item.label}
              </Text>
              <ChevronRight size={18} color={t.textMuted} />
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Pinned to the bottom, away from the navigation items: it is the one row here that
          does something irreversible rather than taking you somewhere. */}
      <View style={{ paddingBottom: insets.bottom + spacing.lg, paddingHorizontal: spacing.lg }}>
        <Pressable
          onPress={onLogout}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.logout,
            { backgroundColor: t.dangerSoft, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <LogOut size={18} color={t.danger} />
          <Text style={[font.bodyStrong, { color: t.danger }]}>Log out</Text>
        </Pressable>
      </View>

      {AlertComponent}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
    borderBottomRightRadius: radius.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: '#E2E8F0',
  },
  name: { color: '#fff', marginTop: spacing.md },
  viewProfile: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 2 },
  viewProfileText: { color: 'rgba(255,255,255,0.85)' },
  list: { padding: spacing.lg, gap: spacing.sm },
  section: { fontWeight: '700', letterSpacing: 0.8, marginBottom: spacing.xs, marginLeft: spacing.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { flex: 1 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 50,
    borderRadius: radius.md,
  },
});
