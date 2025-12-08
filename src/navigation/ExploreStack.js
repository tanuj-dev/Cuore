import { createStackNavigator } from '@react-navigation/stack';
import Explore from '../screens/Explore';
import CuoreKnowledge from '../screens/CuoreKnowledge';
import KnowledgeDetails from '../screens/KnowledgeDetails';
import Tobacco from '../screens/CuoreTobacco';
import Mind from '../screens/CuoreMind';
import MindDetails from '../screens/MindDetails';
import Recipe from '../screens/Recipe';
import Nutrition from '../screens/Nutrition';
import Fitness from '../screens/Fitness';
import FitnessDetails from '../screens/FitnessDetails';
import MealBuilder from '../screens/MealBuilder';
import MealBuilder1 from '../screens/MealBuilder1';
import MealBuilder2 from '../screens/MealBuilder2';
import Health from '../screens/Health';
import HealthRecords from '../screens/HealthRecords';
import OnBoarding from '../screens/OnBoarding';
import Search from '../screens/Search/search';

const Stack = createStackNavigator();

export function ExploreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExploreMain" component={Explore} />
      <Stack.Screen name="Tobacco" component={Tobacco} />
      <Stack.Screen name="Mind" component={Mind} />
      <Stack.Screen name="MindDetails" component={MindDetails} />
      <Stack.Screen name="Recipe" component={Recipe} />
      <Stack.Screen name="CuoreKnowledge" component={CuoreKnowledge} />
      <Stack.Screen name="KnowledgeDetails" component={KnowledgeDetails} />
      <Stack.Screen name="Nutrition" component={Nutrition} />
      <Stack.Screen name="Fitness" component={Fitness} />
      <Stack.Screen name="FitnessDetails" component={FitnessDetails} />
      <Stack.Screen name="MealBuilder" component={MealBuilder} />
      <Stack.Screen name="MealBuilder1" component={MealBuilder1} />
      <Stack.Screen name="MealBuilder2" component={MealBuilder2} />
      <Stack.Screen name="Health" component={Health} />
      <Stack.Screen name="HealthRecords" component={HealthRecords} />
      {/* <Stack.Screen name="OnBoarding" component={OnBoarding} /> */}
      <Stack.Screen name="Search" component={Search} />
    </Stack.Navigator>
  );
}
