import {createStackNavigator} from '@react-navigation/stack';
import Predict from '../screens/Predict';
import Score from '../screens/Score';
import ScoreMeter from '../screens/ScoreMeter';
import HealthRecords from '../screens/HealthRecords';
import Health from '../screens/Health';

const Stack = createStackNavigator();

export const PredictStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="PredictHome" component={Predict} />
    <Stack.Screen name="Score" component={Score} />
    <Stack.Screen name="ScoreMeter" component={ScoreMeter} />
    <Stack.Screen name="HealthRecords" compomemt={HealthRecords} />
    <Stack.Screen name="Health" compomemt={Health} />
  </Stack.Navigator>
);
