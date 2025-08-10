import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import HealthStackNavigator from './HealthStackNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import RiskAssessmentScreen from '../screens/RiskAssessmentScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Ask AI') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Log Health') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Risk Assessment') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={focused ? 32 : 28} color={color} />;
        },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: 8,
        },
        tabBarStyle: {
          height: 85,
          paddingTop: 8,
          paddingBottom: 12,
          backgroundColor: '#ffffff',
          borderTopWidth: 2,
          borderTopColor: '#e8f5e8',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Ask AI" 
        component={ChatbotScreen}
        options={{
          tabBarLabel: 'Ask AI',
        }}
      />
      <Tab.Screen 
        name="Log Health" 
        component={HealthStackNavigator}
        options={{
          tabBarLabel: 'Log Health',
        }}
      />
      <Tab.Screen 
        name="Risk Assessment" 
        component={RiskAssessmentScreen}
        options={{
          tabBarLabel: 'Risk Assessment',
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