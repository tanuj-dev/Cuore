import React, { useEffect } from 'react';
import { View, Image, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
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

import { ExploreStack } from './ExploreStack';
import { CuoreCareStack } from './CuoreCareStack';
import CuoreCareConsultation from '../screens/CuoreCare/Consultation';
import CuoreCareIncomingCall from '../screens/CuoreCare/IncomingCall';
import { Stethoscope } from 'lucide-react-native';
import { getCuoreCareStatus } from '../redux/CuoreCare/thunks';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/* -------------------- BOTTOM TABS -------------------- */
function BottomTabNavigator() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  // CuoreCare tab is gated on an active CuoreCare (superset) subscription.
  // Load the entitlement on entry so the tab shows/hides correctly even before
  // the user opens it. Non-subscribers (Essentials/free) never see the tab.
  const cuoreCareActive = useSelector(
    state => state?.cuoreCare?.subscription?.active,
  );
  useEffect(() => {
    dispatch(getCuoreCareStatus());
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
      style={{ flex: 1, backgroundColor: 'white' }}
      edges={['bottom']}
    >
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            height: 50,
            marginBottom: Platform.OS === 'ios' ? 0 : 0,
          },
          tabBarActiveTintColor: '#11418A',
        }}
      >
        <Tab.Screen
          name="Today"
          component={TodayStack}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Image
                source={images.HOME}
                style={{
                  width: size,
                  height: size,
                  tintColor: color,
                  resizeMode: 'contain',
                }}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Explore"
          component={ExploreStack}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Image
                source={images.EXPLORE}
                style={{
                  width: size,
                  height: size,
                  tintColor: color,
                  resizeMode: 'contain',
                }}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Trend"
          component={PredictStack}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Image
                source={images.PREDICT}
                style={{
                  width: size,
                  height: size,
                  tintColor: color,
                  resizeMode: 'contain',
                }}
              />
            ),
          }}
        />

        {/* Notes is an Essentials-tier feature. CuoreCare subscribers get the
            CuoreCare tab instead, so hide Notes when CuoreCare is active. */}
        {!cuoreCareActive && (
          <Tab.Screen
            name="Notes"
            component={Notes}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Image
                  source={images.CHAT}
                  style={{
                    width: size,
                    height: size,
                    tintColor: color,
                    resizeMode: 'contain',
                  }}
                />
              ),
            }}
          />
        )}

        {cuoreCareActive && (
          <Tab.Screen
            name="CuoreCare"
            component={CuoreCareStack}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Stethoscope size={size} color={color} />
              ),
            }}
          />
        )}

        {/* ✅ PROFILE TAB WITH USER IMAGE */}
        <Tab.Screen
          name="Profile"
          component={ProfileStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <View
                style={{
                  borderWidth: focused ? 2 : 0,
                  borderColor: '#11418A',
                  borderRadius: 18,
                  padding: 2,
                }}
              >
                <Image
                  source={profileImageSource}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                  }}
                />
              </View>
            ),
          }}
        />
      </Tab.Navigator>
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

/* -------------------- ROOT NAVIGATOR -------------------- */

export default function Navigator() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="OtpScreen" component={OtpScreen} />
        <Stack.Screen name="NewAccount" component={NewAccount} />
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="OnBoarding" component={OnBoarding} />
        <Stack.Screen name="Home" component={BottomTabNavigator} />
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
      </Stack.Navigator>
    </SafeAreaView>
  );
}
