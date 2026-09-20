// src/navigation/AppDrawerContent.js
// -----------------------------------------------------------------------------
// What the drawer shows. Kept separate from DrawerNavigator.js so the MENU can be
// rewritten without touching the navigation wiring underneath it.
//
// ⚠️ THE ITEM LIST BELOW IS PROVISIONAL. It mirrors what the app already reaches from the
// tabs and the Profile screen so the drawer is usable while the final list is decided.
// Changing it should mean editing DRAWER_SECTIONS and nothing else: every entry is either
//
//   { tab: 'Explore' }                     → switch to that bottom tab
//   { tab: 'Profile', screen: 'Support' }  → that tab, then that screen inside its stack
//   { root: 'Notifications' }              → a screen on the ROOT stack, outside the tabs
//
// and `go()` below is what turns any of those into the right nested navigate. Nothing else
// in the drawer needs to know how the navigators are nested.
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
import { useSelector } from 'react-redux';
import {
  Bell,
  FileText,
  HeartPulse,
  LifeBuoy,
  ScrollText,
  Stethoscope,
  User,
  Users,
} from 'lucide-react-native';

import images from '../utilities/Images';
import { hp } from '../utilities';

const BRAND = '#11418A';

const DRAWER_SECTIONS = [
  {
    title: null,
    items: [
      { key: 'today', label: 'Today', icon: HeartPulse, tab: 'Today' },
      { key: 'records', label: 'Health records', icon: FileText, tab: 'Profile', screen: 'HealthRecords' },
      { key: 'family', label: 'Family members', icon: Users, tab: 'Profile', screen: 'FamilyMembers' },
      { key: 'notifications', label: 'Notifications', icon: Bell, root: 'Notifications' },
    ],
  },
  {
    title: 'Care',
    items: [
      { key: 'cuorecare', label: 'CuoreCare', icon: Stethoscope, tab: 'CuoreCare' },
      { key: 'doctor', label: 'My doctor', icon: User, tab: 'Profile', screen: 'Doctor' },
    ],
  },
  {
    title: 'Account',
    items: [
      { key: 'support', label: 'Support', icon: LifeBuoy, tab: 'Profile', screen: 'Support' },
      { key: 'terms', label: 'Terms & conditions', icon: ScrollText, tab: 'Profile', screen: 'TermsAndConditions' },
    ],
  },
];

export default function AppDrawerContent({ navigation, state }) {
  const insets = useSafeAreaInsets();

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
        ...(item.screen ? { params: { screen: item.screen } } : {}),
      });
    },
    [navigation],
  );

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
        contentContainerStyle={{ paddingBottom: insets.bottom + hp(2) }}
        showsVerticalScrollIndicator={false}
      >
        {DRAWER_SECTIONS.map(section => {
          const items = section.items.filter(
            i => i.tab !== 'CuoreCare' || cuoreCareActive,
          );
          if (!items.length) return null;
          return (
            <View key={section.title || 'main'} style={styles.section}>
              {!!section.title && (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              )}
              {items.map(item => {
                const Icon = item.icon;
                const current = !item.screen && !item.root && item.tab === activeTab;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.item, current && styles.itemActive]}
                    activeOpacity={0.7}
                    onPress={() => go(item)}
                  >
                    <Icon
                      size={hp(2.2)}
                      color={current ? BRAND : '#475569'}
                    />
                    <Text
                      style={[styles.itemLabel, current && styles.itemLabelActive]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
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
  section: { paddingTop: 14 },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#94A3B8',
    paddingHorizontal: 18,
    paddingBottom: 6,
  },
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
});
