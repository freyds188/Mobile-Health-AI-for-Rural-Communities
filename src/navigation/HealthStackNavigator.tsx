import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text } from 'react-native';

// Screens
import HealthDataScreen from '../screens/HealthDataScreen';
import HealthLogHistoryScreen from '../screens/HealthLogHistoryScreen';

export type HealthStackParamList = {
  'Log Health Main': undefined;
  'Health History': undefined;
};

const Stack = createStackNavigator<HealthStackParamList>();

const HealthStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2E7D32',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
          height: 100, // Increased header height for better visual balance
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
          fontFamily: 'System',
        },
        headerBackTitleVisible: false,
        headerTitleAlign: 'left', // Align title to left for better balance
      }}
    >
      <Stack.Screen 
        name="Log Health Main" 
        component={HealthDataScreen}
        options={({ navigation }) => ({
          headerTitle: () => (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              marginLeft: 10,
            }}>
              <Ionicons name="add-circle" size={28} color="#ffffff" style={{ marginRight: 12 }} />
              <View>
                <Text style={{
                  color: '#ffffff',
                  fontSize: 20,
                  fontWeight: 'bold',
                  fontFamily: 'System',
                }}>
                  📝 Log Your Health
                </Text>
                <Text style={{
                  color: '#E8F5E8',
                  fontSize: 14,
                  fontWeight: '400',
                  marginTop: 2,
                }}>
                  Track your symptoms and wellness
                </Text>
              </View>
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Health History')}
              style={{ 
                marginRight: 20,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 25,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="time" size={20} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={{
                color: '#ffffff',
                fontSize: 14,
                fontWeight: '600',
              }}>
                History
              </Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="Health History" 
        component={HealthLogHistoryScreen}
        options={({ navigation }) => ({
          headerTitle: () => (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              marginLeft: 10,
            }}>
              <Ionicons name="time" size={28} color="#ffffff" style={{ marginRight: 12 }} />
              <View>
                <Text style={{
                  color: '#ffffff',
                  fontSize: 20,
                  fontWeight: 'bold',
                  fontFamily: 'System',
                }}>
                  📋 Health History
                </Text>
                <Text style={{
                  color: '#E8F5E8',
                  fontSize: 14,
                  fontWeight: '400',
                  marginTop: 2,
                }}>
                  Your health tracking timeline
                </Text>
              </View>
            </View>
          ),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ 
                marginLeft: 20,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 25,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={{
                color: '#ffffff',
                fontSize: 14,
                fontWeight: '600',
              }}>
                Back
              </Text>
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

export default HealthStackNavigator;
