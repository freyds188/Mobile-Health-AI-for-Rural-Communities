import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import HealthStackNavigator from './HealthStackNavigator';
import RiskAssessmentScreen from '../screens/RiskAssessmentScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UserEvaluationScreen from '../screens/UserEvaluationScreen';
import ITExpertEvaluationScreen from '../screens/ITExpertEvaluationScreen';
import ModelTrainingScreen from '../screens/ModelTrainingScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Health') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'Risk Assessment') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Chatbot') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Evaluation') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'Training') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
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
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Health" 
        component={HealthStackNavigator}
        options={{
          tabBarLabel: 'Health',
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
        name="Chatbot" 
        component={ChatbotScreen}
        options={{
          tabBarLabel: 'Chatbot',
        }}
      />
      <Tab.Screen 
        name="Evaluation" 
        component={UserEvaluationScreen}
        options={{
          tabBarLabel: 'Evaluation',
        }}
      />
      <Tab.Screen 
        name="Training" 
        component={ModelTrainingScreen}
        options={{
          tabBarLabel: 'Training',
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