import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import images from '../utilities/Images';
import { hp, wp } from '../utilities';

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
import Chat from '../screens/Chat';
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
import { ExploreStack } from './ExploreStack';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabNavigator() {
  const insets = useSafeAreaInsets();
  console.log('Safe area insets:', insets);
  // 🔹 Detect navigation mode:
  // Gesture navigation devices have a bottom inset > 0.
  // 3-button navigation phones usually have bottom inset == 0.
  const extraMarginBottom =
    Platform.OS === 'android' && insets.bottom === (0 || 48) ? 30 : 0;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          // 🔹 Add bottom margin only for Android 3-button navigation
          marginBottom: extraMarginBottom,
          height: 70,
          paddingBottom: Platform.OS === 'ios' ? 10 : null,
        },
        headerShown: false,
        tabBarActiveTintColor: '#1E64AC',
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
          unmountOnBlur: true,
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
        name="Predict"
        component={PredictStack}
        options={{
          unmountOnBlur: true,
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
      <Tab.Screen
        name="Chat"
        component={Chat}
        options={{
          unmountOnBlur: true,
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
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          unmountOnBlur: true,
          tabBarIcon: ({ color, size }) => (
            <Image
              source={images.PROFILE}
              style={{
                width: size,
                height: 30,
                borderRadius: 20,
                tintColor: color,
                resizeMode: 'contain',
              }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// 🔹 Stacks
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={Profile} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="HealthRecords" component={HealthRecords} />
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
      <Stack.Screen name="OnBoarding" component={OnBoarding} />
    </Stack.Navigator>
  );
}

function TodayStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TodayMain" component={Today} />
      <Stack.Screen name="CalorieIgnite" component={CalorieIgnite} />
      <Stack.Screen name="MidMorningBoost" component={MidMorningBoost} />
      <Stack.Screen name="RefrestRefuel" component={RefreshRefuel} />
      <Stack.Screen name="Health" component={Health} />
      <Stack.Screen name="OnBoarding" component={OnBoarding} />
      <Stack.Screen name="HealthRecords" component={HealthRecords} />
    </Stack.Navigator>
  );
}

export default function Navigator() {
  return (
    <NavigationContainer>
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
        <Stack.Screen name="Score" component={Score} />
        <Stack.Screen name="Home" component={BottomTabNavigator} />
        <Stack.Screen name="PaymentDetails" component={PaymentDetails} />
        <Stack.Screen name="Checkout" component={Checkout} />
        <Stack.Screen name="Tobacco" component={Tobacco} />
        <Stack.Screen name="Mind" component={Mind} />
        <Stack.Screen name="Fitness" component={Fitness} />
        <Stack.Screen name="FitnessDetails" component={FitnessDetails} />
        <Stack.Screen name="MindDetails" component={MindDetails} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="EditCaregiver" component={EditCaregive} />
        <Stack.Screen name="EditDoctor" component={EditDoctor} />
        <Stack.Screen name="SelectPersona" component={SelectPersona} />
        <Stack.Screen name="HealthRecords" component={HealthRecords} />
        <Stack.Screen name="Support" component={Support} />
        <Stack.Screen name="DeleteAccount" component={DeleteAccount} />
        <Stack.Screen name="TermsAndConditions" component={TermsAndCondtion} />
        <Stack.Screen name="RenewSubscription" component={RenewSubscription} />
        <Stack.Screen name="CuoreKnowledge" component={CuoreKnowledge} />
        <Stack.Screen name="KnowledgeDetails" component={KnowledgeDetails} />
        <Stack.Screen name="Nutrition" component={Nutrition} />
        <Stack.Screen name="CalorieIgnite" component={CalorieIgnite} />
        <Stack.Screen name="MidMorningBoost" component={MidMorningBoost} />
        <Stack.Screen name="RefrestRefuel" component={RefreshRefuel} />
        <Stack.Screen name="MealBuilder" component={MealBuilder} />
        <Stack.Screen name="MealBuilder1" component={MealBuilder1} />
        <Stack.Screen name="MealBuilder2" component={MealBuilder2} />
        <Stack.Screen name="Recipe" component={Recipe} />
        <Stack.Screen name="Doctor" component={Doctor} />
        <Stack.Screen name="Health" component={Health} />
        <Stack.Screen name="ScoreMeter" component={ScoreMeter} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
