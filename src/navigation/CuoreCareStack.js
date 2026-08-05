import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import CuoreCareHome from '../screens/CuoreCare/Home';
import DoctorList from '../screens/CuoreCare/DoctorList';
import BookAppointment from '../screens/CuoreCare/BookAppointment';
import AppointmentDetails from '../screens/CuoreCare/AppointmentDetails';
import Subscribe from '../screens/CuoreCare/Subscribe';
import History from '../screens/CuoreCare/History';
import PrescriptionView from '../screens/CuoreCare/PrescriptionView';

const Stack = createStackNavigator();

/**
 * CuoreCare tab stack (patient). The immersive consultation screen lives on the ROOT
 * navigator (see navigation/index.js → CuoreCareConsultation) so the call renders full
 * screen over the tab bar and can be reached from a VoIP/notification deep link.
 */
export function CuoreCareStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="CuoreCareHome">
      <Stack.Screen name="CuoreCareHome" component={CuoreCareHome} />
      <Stack.Screen name="CuoreCareDoctors" component={DoctorList} />
      <Stack.Screen name="CuoreCareBook" component={BookAppointment} />
      <Stack.Screen name="CuoreCareAppointment" component={AppointmentDetails} />
      <Stack.Screen name="CuoreCareSubscribe" component={Subscribe} />
      <Stack.Screen name="CuoreCareHistory" component={History} />
      <Stack.Screen name="CuoreCarePrescription" component={PrescriptionView} />
      {/* Same signed-URL PDF viewer, reached with a `certificateId` param instead. */}
      <Stack.Screen name="CuoreCareCertificate" component={PrescriptionView} />
    </Stack.Navigator>
  );
}

export default CuoreCareStack;
