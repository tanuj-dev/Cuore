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
  </Stack.Navigator>
);
