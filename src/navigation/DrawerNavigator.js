// src/navigation/DrawerNavigator.js
// -----------------------------------------------------------------------------
// The drawer that wraps the bottom tabs.
//
// ── WHERE IT SITS, AND WHY ───────────────────────────────────────────────────────────────────
// Root stack "Home" → THIS drawer → "Tabs" → the bottom tabs → each tab's own stack.
//
// The drawer wraps the tabs rather than the whole root stack, so it exists exactly where a
// drawer makes sense — the browsing part of the app — and nowhere it would be harmful. A
// consultation, an incoming call, checkout and the auth screens are all siblings of "Home" on
// the root stack, so an edge swipe can never drag a menu open over a live call.
//
// ── THE COST THIS ADDS ───────────────────────────────────────────────────────────────────────
// One extra level of nesting under "Home". Anything that deep-links INTO a tab now has to name
// "Tabs" on the way through:
//
//     navigate('Home', { screen: 'Tabs', params: { screen: 'CuoreCare', params: { … } } })
//
// The FCM handlers in src/utils/notificationNavigation.js and the two in-app jumps
// (Today/ConsultationTimeCard, CuoreCare/Consultation) were updated for this. A plain
// navigate('Home') or a reset to "Home" is unaffected — the drawer opens on "Tabs" by default.
// -----------------------------------------------------------------------------
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import AppDrawerContent from './AppDrawerContent';

const Drawer = createDrawerNavigator();

/* ── THE SWIPE HAS TO SHARE THE LEFT EDGE ────────────────────────────────────────────────────
 * A left-edge swipe means two different things depending on where you are: open the menu, or go
 * back. The drawer sits above every tab stack, so with the gesture always on it would swallow
 * the back swipe on every pushed screen — Health records, a consultation, a meal plan — and
 * iOS users would lose the gesture they reach for without thinking.
 *
 * So the swipe is enabled only while the focused tab is at the ROOT of its stack, which is
 * exactly when there is nothing to go back to. `route.state` here is the bottom-tab navigator's
 * state, and the focused tab's own `state.index` says whether anything is pushed on top of it.
 * Undefined state means a navigator that has not been touched yet, which is its initial route —
 * hence the `true` default. The hamburger works everywhere regardless.
 */
const tabsAtRoot = route => {
  const tabState = route?.state;
  if (!tabState || typeof tabState.index !== 'number') return true;
  const activeTab = tabState.routes?.[tabState.index];
  const stackState = activeTab?.state;
  if (!stackState || typeof stackState.index !== 'number') return true;
  return stackState.index === 0;
};

export default function DrawerNavigator({ tabs }) {
  return (
    <Drawer.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // every tab screen draws its own header
        drawerType: 'front', // slides over the content; no layout shift for the tabs
        drawerStyle: { width: '80%', maxWidth: 340 },
        swipeEnabled: tabsAtRoot(route),
        swipeEdgeWidth: 40,
        overlayColor: 'rgba(15, 23, 42, 0.4)',
      })}
      drawerContent={props => <AppDrawerContent {...props} />}
    >
      <Drawer.Screen name="Tabs" component={tabs} />
    </Drawer.Navigator>
  );
}
