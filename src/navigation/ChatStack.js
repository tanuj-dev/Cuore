import {createStackNavigator} from '@react-navigation/stack';
import Chat from '../screens/Chat';
import Support from '../screens/Support';

const Stack = createStackNavigator();

export const ChatStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="ChatHome" component={Chat} />
    <Stack.Screen name="Support" component={Support} />
  </Stack.Navigator>
);
