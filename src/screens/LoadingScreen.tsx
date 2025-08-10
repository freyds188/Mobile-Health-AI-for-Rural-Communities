import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const LoadingScreen = ({ navigation }: any) => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        navigation.replace('Main');
      } else {
        navigation.replace('Login');
      }
    }
  }, [user, isLoading, navigation]);

  // Emergency timeout - if loading takes too long, force navigation to login
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ LoadingScreen: Emergency timeout triggered, forcing navigation to login');
        navigation.replace('Login');
      }
    }, 15000); // 15 second emergency timeout

    return () => clearTimeout(emergencyTimeout);
  }, [isLoading, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Ionicons name="medical" size={100} color="white" />
          <Text style={styles.title}>Health AI Assistant</Text>
          <Text style={styles.subtitle}>
            {isLoading ? 'Loading your health data...' : 'Initializing...'}
          </Text>
          <ActivityIndicator size="large" color="white" style={styles.spinner} />
          <Text style={styles.debugText}>
            {isLoading ? 'Initializing services...' : 'Ready to navigate'}
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    opacity: 0.8,
    marginBottom: 30,
  },
  spinner: {
    marginTop: 20,
  },
  debugText: {
    fontSize: 14,
    color: 'white',
    opacity: 0.7,
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default LoadingScreen; 