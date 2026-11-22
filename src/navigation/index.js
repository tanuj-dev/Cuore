import React, { useEffect } from 'react';
import { View, Image, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';

import images from '../utilities/Images';

// Screens
import Login from '../screens/Login';
import Signup from '../screens/Signup';
import OtpScreen from '../screens/OtpScreen';
import NewAccount from '../screens/NewAccount';
import Splash from '../screens/Splash';
import OnBoarding from '../screens/OnBoarding';
import Score from '../screens/Score';
import ScoreMeter from '../screens/ScoreMeter';
import Today from '../screens/Today';
import Predict from '../screens/Predict';
import Explore from '../screens/Explore';
import Profile from '../screens/Profile';
import FamilyMembers from '../screens/FamilyMembers';
import CycleTracker from '../screens/CycleTracker';
import Tobacco from '../screens/CuoreTobacco';
import Mind from '../screens/CuoreMind';
import Fitness from '../screens/Fitness';
import FitnessDetails from '../screens/FitnessDetails';
import MindDetails from '../screens/MindDetails';
import EditCaregive from '../screens/EditCaregiver';
import EditDoctor from '../screens/EditDoctor';
import SelectPersona from '../screens/SelectPersona';
import HealthRecords from '../screens/HealthRecords';
import Support from '../screens/Support';
import DeleteAccount from '../screens/DeleteAccount';
import ConnectedHealth from '../screens/ConnectedHealth';
import TermsAndCondtion from '../screens/TermsAndCondtion';
import RenewSubscription from '../screens/RenewSubscription';
import EditProfile from '../screens/EditProfile';
import CuoreKnowledge from '../screens/CuoreKnowledge';
import KnowledgeDetails from '../screens/KnowledgeDetails';
import Nutrition from '../screens/Nutrition';
import PaymentDetails from '../screens/PaymentDetails';
import Checkout from '../screens/Checkout';
import CalorieIgnite from '../screens/CalorieIgnite';
import MidMorningBoost from '../screens/MidMorningBoost';
import RefreshRefuel from '../screens/RefreshRefuel';
import MealBuilder from '../screens/MealBuilder';
import MealBuilder1 from '../screens/MealBuilder1';
import MealBuilder2 from '../screens/MealBuilder2';
import Recipe from '../screens/Recipe';
import Doctor from '../screens/Doctor';
import Health from '../screens/Health';
import Search from '../screens/Search/search';
import Notes from '../screens/Notes';
import Notifications from '../screens/Notifications';

import DrawerNavigator from './DrawerNavigator';
import { ExploreStack } from './ExploreStack';
import { CuoreCareStack } from './CuoreCareStack';
import CuoreCareConsultation from '../screens/CuoreCare/Consultation';
import CuoreCareIncomingCall from '../screens/CuoreCare/IncomingCall';
import {
  Compass,
  House,
  NotebookPen,
  Stethoscope,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '../theme';
import { getCuoreCareStatus, getCuoreCareAccess } from '../redux/CuoreCare/thunks';
import { hydrateCuoreCareAccess } from '../redux/CuoreCare/slice';
import { loadCachedAccess } from '../utilities/cuoreCareAccessCache';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/* -------------------- BOTTOM TABS -------------------- */
function BottomTabNavigator() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  // CuoreCare tab is gated on the centralized access object — true for a real CuoreCare
  // subscription (superset), an admin-granted per-doctor entitlement for an
  // Essential-tier user, OR a walk-in patient whose doctor has EMR enabled for them
  // (access.emr). The tab now hosts both telemedicine (booking/video/voice/chat) and
  // EMR (prescriptions/vaccinations/bills) content — CuoreCareHome decides which of those
  // to actually show based on which specific feature keys are true, so showing the tab
  // itself only needs "does this patient have ANY reason to be in here at all". Load both
  // on entry so the tab shows/hides correctly even before the user opens it; `subscription`
  // still separately drives the paywall/Profile card.
  const cuoreCareActive = useSelector(
    state => state?.cuoreCare?.access?.cuoreCare || state?.cuoreCare?.access?.emr,
  );
  // Until either the cached or the live answer is in, render neither Notes nor CuoreCare —
  // defaulting to "no access" is what made Notes flash before swapping to CuoreCare.
  const cuoreCareResolved = useSelector(
    state => state?.cuoreCare?.access?.checked || state?.cuoreCare?.access?.fromCache,
  );
  useEffect(() => {
    loadCachedAccess().then(cached => {
      if (cached) dispatch(hydrateCuoreCareAccess(cached));
    });
    dispatch(getCuoreCareStatus());
    dispatch(getCuoreCareAccess());
  }, [dispatch]);

  // ✅ PROFILE IMAGE FROM REDUX
  const profileImage = useSelector(
    state =>
      state?.profile?.data?.data?.user?.photo_url ||
      state?.profile?.data?.data?.user?.photoUrl,
  );

  const profileImageSource = profileImage
    ? { uri: profileImage }
    : images.PROFILE;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.bg }}
      edges={['bottom']}
    >
      {/* CuoreMD's floating rounded bar, kept in the layout rather than absolutely positioned
          so it never covers the bottom of a screen that has not been restyled yet. */}
      <Tab.Navigator
        screenLayout={tabScreenLayout}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: t.brand,
          tabBarInactiveTintColor: t.textMuted,
          tabBarLabelStyle: {
            fontSize: 10.5,
            fontFamily: 'Poppins-SemiBold',
            marginTop: 2,
          },
          tabBarStyle: {
            marginHorizontal: 16,
            marginBottom: insets.bottom > 0 ? 4 : 10,
            marginTop: 6,
            height: 66,
            paddingTop: 8,
            paddingBottom: 8,
            borderRadius: 26,
            borderTopWidth: 0,
            backgroundColor: t.surface,
            shadowColor: '#0f172a',
            shadowOpacity: 0.12,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 6 },
            elevation: 12,
          },
          // The selected tab sits in a soft brand pill, not just a tinted icon.
          tabBarActiveBackgroundColor: t.brandSoft,
          tabBarItemStyle: { borderRadius: 18, marginHorizontal: 1, overflow: 'hidden' },
          sceneStyle: { backgroundColor: t.bg },
        }}
      >
        <Tab.Screen
          name="Today"
          component={TodayStack}
          options={{ tabBarIcon: ({ color }) => <House size={22} color={color} /> }}
        />

        <Tab.Screen
          name="Explore"
          component={ExploreStack}
          options={{ tabBarIcon: ({ color }) => <Compass size={22} color={color} /> }}
        />

        <Tab.Screen
          name="Trend"
          component={PredictStack}
          options={{
            tabBarIcon: ({ color }) => <TrendingUp size={22} color={color} />,
          }}
        />

        {/* Notes is an Essentials-tier feature. CuoreCare subscribers get the
            CuoreCare tab instead, so hide Notes when CuoreCare is active. */}
        {cuoreCareResolved && !cuoreCareActive && (
          <Tab.Screen
            name="Notes"
            component={Notes}
            options={{
              tabBarIcon: ({ color }) => <NotebookPen size={22} color={color} />,
            }}
          />
        )}

        {cuoreCareResolved && cuoreCareActive && (
          <Tab.Screen
            name="CuoreCare"
            component={CuoreCareStack}
            options={{
              tabBarIcon: ({ color }) => <Stethoscope size={22} color={color} />,
            }}
          />
        )}

        <Tab.Screen
          name="Profile"
          component={ProfileStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <View
                style={{
                  borderWidth: 2,
                  borderColor: focused ? t.brand : 'transparent',
                  borderRadius: 16,
                  padding: 1,
                }}
              >
                <Image
                  source={profileImageSource}
                  style={{ width: 24, height: 24, borderRadius: 12 }}
                />
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

/* Screens inside the tabs that handle the top safe area themselves (their own SafeAreaView or
 * insets.top). Wrapping them as well doubled the gap above their header. Every other screen in a
 * tab gets a white top frame here, as the old root frame gave it. A screen restyled to draw its
 * own hero must be listed. */
const SELF_INSET = new Set([
  'TodayMain', 'ExploreMain', 'Predict', 'ProfileMain', 'Notes', 'CuoreCareHome',
  'CalorieIgnite', 'CuoreCareAppointment', 'CuoreCareBook', 'CuoreCareCertificate',
  'CuoreCareCheckout', 'CuoreCareDoctors', 'CuoreCareHistory', 'CuoreCarePrescription',
  'CuoreCareSubscribe', 'CuoreKnowledge', 'CycleTracker', 'Doctor', 'EditProfile',
  'FamilyMembers', 'Fitness', 'Health', 'KnowledgeDetails', 'MidMorningBoost', 'Mind', 'RefreshRefuel',
  'Tobacco', 'Nutrition', 'MealBuilder', 'MindDetails', 'FitnessDetails', 'Recipe',
  'MealBuilder1', 'MealBuilder2', 'HealthRecords', 'Support', 'DeleteAccount', 'EditCaregiver', 'EditDoctor', 'ConnectedHealth',
  'Score', 'Search',
]);
// A stack that has not navigated yet reports no focused child: that is its first screen.
const TAB_FIRST_SCREEN = {
  Today: 'TodayMain',
  Explore: 'ExploreMain',
  Trend: 'Predict',
  Profile: 'ProfileMain',
  CuoreCare: 'CuoreCareHome',
};

function tabScreenLayout({ children, route }) {
  const focused =
    getFocusedRouteNameFromRoute(route) ?? TAB_FIRST_SCREEN[route.name] ?? route.name;
  // Always the SAME wrapper element, only its edges change. Returning bare children for
  // self-inset screens and a SafeAreaView for the rest swapped the element type whenever the
  // focused screen crossed between the two groups, which remounted the whole tab stack and
  // threw the user back to its first screen (My Health "did nothing" from Today).
  const selfInset = SELF_INSET.has(focused);
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: selfInset ? 'transparent' : 'white' }}
      edges={selfInset ? [] : ['top']}
    >
      {children}
    </SafeAreaView>
  );
}

/* -------------------- STACKS -------------------- */

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={Profile} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="HealthRecords" component={HealthRecords} />
      <Stack.Screen name="ConnectedHealth" component={ConnectedHealth} />
      <Stack.Screen name="Support" component={Support} />
      <Stack.Screen name="EditCaregiver" component={EditCaregive} />
      <Stack.Screen name="EditDoctor" component={EditDoctor} />
      <Stack.Screen name="SelectPersona" component={SelectPersona} />
      <Stack.Screen name="FamilyMembers" component={FamilyMembers} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccount} />
      <Stack.Screen name="TermsAndConditions" component={TermsAndCondtion} />
      <Stack.Screen name="RenewSubscription" component={RenewSubscription} />
      <Stack.Screen name="Doctor" component={Doctor} />
    </Stack.Navigator>
  );
}

function PredictStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Predict" component={Predict} />
      <Stack.Screen name="HealthRecords" component={HealthRecords} />
      <Stack.Screen name="Health" component={Health} />
      <Stack.Screen name="Score" component={Score} />
    </Stack.Navigator>
  );
}

function TodayStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TodayMain" component={Today} />
      {/* Cycle calendar, opened from the button beside Update Readings. Lives in this stack
          because that is its only entry point — Today is where the spec puts it. */}
      <Stack.Screen name="CycleTracker" component={CycleTracker} />
      <Stack.Screen name="CalorieIgnite" component={CalorieIgnite} />
      <Stack.Screen name="MidMorningBoost" component={MidMorningBoost} />
      <Stack.Screen name="RefreshRefuel" component={RefreshRefuel} />
      <Stack.Screen name="Health" component={Health} />
      <Stack.Screen name="HealthRecords" component={HealthRecords} />
      <Stack.Screen name="Score" component={Score} />
      <Stack.Screen name="Nutrition" component={Nutrition} />
      <Stack.Screen name="Mind" component={Mind} />
      <Stack.Screen name="Fitness" component={Fitness} />
      <Stack.Screen name="FitnessDetails" component={FitnessDetails} />
      <Stack.Screen name="MindDetails" component={MindDetails} />
      <Stack.Screen name="MealBuilder" component={MealBuilder} />
      <Stack.Screen name="MealBuilder1" component={MealBuilder1} />
      <Stack.Screen name="MealBuilder2" component={MealBuilder2} />
      <Stack.Screen name="Recipe" component={Recipe} />
      <Stack.Screen name="Search" component={Search} />
      <Stack.Screen name="Tobacco" component={Tobacco} />
    </Stack.Navigator>
  );
}

/* -------------------- DRAWER AROUND THE TABS -------------------- */

/* The tabs are handed to the drawer rather than imported by it: DrawerNavigator would
 * otherwise have to import this file, which imports DrawerNavigator. Defined at module scope so
 * the "Home" route keeps the SAME component identity across renders — an inline arrow here would
 * remount the whole tab tree, and with it every stack inside it, on each render of the root
 * navigator. */
function HomeDrawer() {
  return <DrawerNavigator tabs={BottomTabNavigator} />;
}

/* -------------------- ROOT NAVIGATOR -------------------- */

/* Screens restyled in the CuoreMD style paint their own hero under the status bar and handle
 * insets themselves. Every other screen still gets the white safe-area frame it was built for. */
// 'Home' (drawer + tabs) handles its own insets: the tab bar takes the bottom one and
// tabScreenLayout below takes the top one for each screen inside the tabs.
const EDGE_TO_EDGE = new Set(['Login', 'OtpScreen', 'NewAccount', 'Home', 'Notifications']);

function rootScreenLayout({ children, route }) {
  if (EDGE_TO_EDGE.has(route.name)) return children;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {children}
    </SafeAreaView>
  );
}

export default function Navigator() {
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
        screenLayout={rootScreenLayout}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="OtpScreen" component={OtpScreen} />
        <Stack.Screen name="NewAccount" component={NewAccount} />
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="OnBoarding" component={OnBoarding} />
        {/* "Home" is now the drawer; the bottom tabs live inside it as "Tabs". Anything
            deep-linking into a tab has to name that level — see DrawerNavigator.js. */}
        <Stack.Screen name="Home" component={HomeDrawer} />
        <Stack.Screen name="Score" component={Score} />
        <Stack.Screen name="ScoreMeter" component={ScoreMeter} />
        <Stack.Screen name="PaymentDetails" component={PaymentDetails} />
        <Stack.Screen name="Checkout" component={Checkout} />
        <Stack.Screen
          name="CuoreCareConsultation"
          component={CuoreCareConsultation}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="CuoreCareIncomingCall"
          component={CuoreCareIncomingCall}
          options={{
            gestureEnabled: false,
            presentation: 'transparentModal',
            animationEnabled: true,
          }}
        />
        <Stack.Screen name="Tobacco" component={Tobacco} />
        <Stack.Screen name="Mind" component={Mind} />
        <Stack.Screen name="Fitness" component={Fitness} />
        <Stack.Screen name="FitnessDetails" component={FitnessDetails} />
        <Stack.Screen name="MindDetails" component={MindDetails} />
        <Stack.Screen name="CuoreKnowledge" component={CuoreKnowledge} />
        <Stack.Screen name="KnowledgeDetails" component={KnowledgeDetails} />
        <Stack.Screen name="Doctor" component={Doctor} />
        <Stack.Screen name="Health" component={Health} />
        <Stack.Screen name="Notifications" component={Notifications} />
      </Stack.Navigator>
    </View>
  );
}
