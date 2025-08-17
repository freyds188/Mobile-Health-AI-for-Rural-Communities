import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { HealthDataProvider } from './src/contexts/HealthDataContext';
import { ChatbotProvider } from './src/contexts/ChatbotContext';
import { useAppFonts } from './src/utils/fonts';
import { View, Text } from 'react-native';
import ErrorBoundary from './src/components/ErrorBoundary';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import LoadingScreen from './src/screens/LoadingScreen';
import SymptomInputScreen from './src/screens/SymptomInputScreen';

export type RootStackParamList = {
  Loading: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  'Symptom Analysis': undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const fontsLoaded = useAppFonts();

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2E7D32' }}>
        <Text style={{ color: 'white', fontSize: 18, fontFamily: 'System' }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <HealthDataProvider>
          <ChatbotProvider>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName="Loading"
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="Loading" component={LoadingScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Main" component={MainTabNavigator} />
              </Stack.Navigator>
            </NavigationContainer>
            <StatusBar style="auto" />
          </ChatbotProvider>
        </HealthDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
} 