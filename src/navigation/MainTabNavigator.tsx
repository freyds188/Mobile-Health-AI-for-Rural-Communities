import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import ProviderDashboardScreen from '../screens/provider/ProviderDashboardScreen';
import ProviderStackNavigator from './ProviderStackNavigator';
import { useAuth } from '../contexts/AuthContext';
import RiskAssessmentStackNavigator from './RiskAssessmentStackNavigator';
import ChatbotScreen from '../screens/ChatbotScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HealthStackNavigator from './HealthStackNavigator';
import PatientInboxScreen from '../screens/PatientInboxScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const { user } = useAuth();
  const isProvider = user?.role === 'provider' || user?.role === 'admin';
  const isCHW = user?.role === 'chw';
  const isPatient = user?.role === 'patient';
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Log Health') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Risk Assessment') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Chatbot') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'CHW') {
            iconName = focused ? 'clipboard' : 'clipboard-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E1E5E9',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={isProvider ? ProviderStackNavigator : DashboardScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      {isCHW && (
        <Tab.Screen 
          name="CHW" 
          component={require('./CHWStackNavigator').default}
          options={{
            tabBarLabel: 'CHW',
          }}
        />
      )}
      <Tab.Screen 
        name="Log Health" 
        component={HealthStackNavigator}
        options={{
          tabBarLabel: 'Log Health',
        }}
      />
      <Tab.Screen 
        name="Risk Assessment" 
        component={RiskAssessmentStackNavigator}
        options={{
          tabBarLabel: 'Risk Assessment',
        }}
      />
      {isPatient && (
        <Tab.Screen 
          name="Inbox" 
          component={PatientInboxScreen}
          options={{
            tabBarLabel: 'Inbox',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'mail' : 'mail-outline'} size={size} color={color} />
            )
          }}
        />
      )}
      <Tab.Screen 
        name="Chatbot" 
        component={ChatbotScreen}
        options={{
          tabBarLabel: 'Chatbot',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator; 