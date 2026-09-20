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

export default function DrawerNavigator({ tabs }) {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false, // every tab screen draws its own header
        drawerType: 'front', // slides over the content; no layout shift for the tabs
        drawerStyle: { width: '80%', maxWidth: 340 },
        swipeEdgeWidth: 40,
        overlayColor: 'rgba(15, 23, 42, 0.4)',
      }}
      drawerContent={props => <AppDrawerContent {...props} />}
    >
      <Drawer.Screen name="Tabs" component={tabs} />
    </Drawer.Navigator>
  );
}
