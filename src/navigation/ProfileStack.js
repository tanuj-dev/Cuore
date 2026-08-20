// ⚠️ THIS FILE IS NOT USED. Nothing imports it.
//
// The navigator that actually runs is the `function ProfileStack()` defined inline in
// navigation/index.js, and the same is true of every other file in this folder (ChatStack,
// CuoreCareStack, ExploreStack, PredictStack, TodayStack) — all six are dead. Registering a
// screen here does nothing: it produces "The action 'NAVIGATE' ... was not handled by any
// navigator" at runtime, with no build error to warn you.
//
// Add screens to navigation/index.js. This file is kept in sync only so it is not actively
// misleading; it is a candidate for deletion.
import {createStackNavigator} from '@react-navigation/stack';
import Profile from '../screens/Profile';
import EditProfile from '../screens/EditProfile';
import EditDoctor from '../screens/EditDoctor';
import EditCaregiver from '../screens/EditCaregiver';
import DeleteAccount from '../screens/DeleteAccount';
import TermsAndCondtion from '../screens/TermsAndCondtion';
import RenewSubscription from '../screens/RenewSubscription';
import PaymentDetails from '../screens/PaymentDetails';
import HealthRecords from '../screens/HealthRecords';
import SelectPersona from '../screens/SelectPersona';
import FamilyMembers from '../screens/FamilyMembers';

const Stack = createStackNavigator();

export const ProfileStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="ProfileHome" component={Profile} />
    <Stack.Screen name="EditProfile" component={EditProfile} />
    <Stack.Screen name="EditDoctor" component={EditDoctor} />
    <Stack.Screen name="EditCaregiver" component={EditCaregiver} />
    <Stack.Screen name="DeleteAccount" component={DeleteAccount} />
    <Stack.Screen name="TermsAndCondtion" component={TermsAndCondtion} />
    <Stack.Screen name="RenewSubscription" component={RenewSubscription} />
    <Stack.Screen name="PaymentDetails" component={PaymentDetails} />
    <Stack.Screen name="HealthRecords" component={HealthRecords} />
    <Stack.Screen name="SelectPersona" component={SelectPersona} />
    <Stack.Screen name="FamilyMembers" component={FamilyMembers} />
  </Stack.Navigator>
);
