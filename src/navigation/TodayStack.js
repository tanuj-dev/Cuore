// navigation/HomeStack.js
import {createStackNavigator} from '@react-navigation/stack';
import Today from '../screens/Today';
import Nutrition from '../screens/Nutrition';
import Recipe from '../screens/Recipe';
import CalorieIgnite from '../screens/CalorieIgnite';
// Add other related screens

const Stack = createStackNavigator();

export const TodayStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="TodayHome" component={Today} />
    <Stack.Screen name="Nutrition" component={Nutrition} />
    <Stack.Screen name="Recipe" component={Recipe} />
    <Stack.Screen name="CalorieIgnite" component={CalorieIgnite} />
    {/* Add more if needed */}
  </Stack.Navigator>
);
