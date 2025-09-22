import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProviderDashboardScreen from '../screens/provider/ProviderDashboardScreen';
import PatientDetailsScreen from '../screens/provider/PatientDetailsScreen';

export type ProviderStackParamList = {
  'Provider Home': undefined;
  'Patient Details': { patientId: string } | undefined;
};

const Stack = createStackNavigator<ProviderStackParamList>();

const ProviderStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="Provider Home" component={ProviderDashboardScreen} options={{ title: 'Provider Dashboard' }} />
      <Stack.Screen name="Patient Details" component={PatientDetailsScreen} options={{ title: 'Patient Details' }} />
    </Stack.Navigator>
  );
};

export default ProviderStackNavigator;


