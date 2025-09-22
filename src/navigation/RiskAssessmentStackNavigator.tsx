import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text } from 'react-native';

import RiskAssessmentScreen from '../screens/RiskAssessmentScreen';
import RiskAssessmentHistoryScreen from '../screens/RiskAssessmentHistoryScreen';

export type RiskAssessmentStackParamList = {
  'Risk Assessment Main': undefined;
  'Risk Assessment History': undefined;
};

const Stack = createStackNavigator<RiskAssessmentStackParamList>();

const RiskAssessmentStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2E7D32',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
          fontFamily: 'System',
        },
        headerBackTitleVisible: false,
        headerTitleAlign: 'left',
      }}
    >
      <Stack.Screen 
        name="Risk Assessment Main"
        component={RiskAssessmentScreen}
        options={({ navigation }) => ({
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="analytics" size={24} color="#ffffff" style={{ marginRight: 10 }} />
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>Risk Assessment</Text>
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Risk Assessment History')}
              style={{ marginRight: 16, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#ffffff', fontWeight: '600' }}>History</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      />
      <Stack.Screen 
        name="Risk Assessment History"
        component={RiskAssessmentHistoryScreen}
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time" size={24} color="#ffffff" style={{ marginRight: 10 }} />
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>Assessment History</Text>
            </View>
          )
        }}
      />
    </Stack.Navigator>
  );
};

export default RiskAssessmentStackNavigator;

 