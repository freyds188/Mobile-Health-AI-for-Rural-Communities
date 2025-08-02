import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { fontFamily } from '../../utils/fonts';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, clearAllData, createTestUser } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const success = await login(email, password);
    if (success) {
      navigation.replace('Main');
    } else {
      Alert.alert('Error', 'Invalid email or password. Please check your credentials or register a new account.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.gradient}
          >
            <View style={styles.header}>
              <Ionicons name="medical" size={80} color="white" />
              <Text style={styles.title}>Health AI Assistant</Text>
              <Text style={styles.subtitle}>Your personal health companion</Text>
            </View>
          </LinearGradient>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to continue</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerButtonText}>
                Don't have an account? Sign Up
              </Text>
            </TouchableOpacity>
            
            {/* Debug buttons - remove in production */}
            <TouchableOpacity
              style={styles.debugButton}
              onPress={clearAllData}
            >
              <Text style={styles.debugButtonText}>
                Clear All Data (Debug)
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.debugButton}
              onPress={createTestUser}
            >
              <Text style={styles.debugButtonText}>
                Create Test User (Debug)
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  gradient: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2E7D32', // Simple green color
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    textAlign: 'center',
    fontFamily: fontFamily.heading,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    opacity: 0.9,
    marginTop: 10,
    textAlign: 'center',
    fontFamily: fontFamily.body,
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: -30,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 20,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: fontFamily.heading,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
    fontFamily: fontFamily.body,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    marginBottom: 20,
    paddingHorizontal: 20,
    height: 60,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 15,
    color: '#2E7D32',
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    fontFamily: fontFamily.body,
  },
  eyeIcon: {
    padding: 8,
    color: '#2E7D32',
  },
  loginButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 15,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: fontFamily.buttonBold,
  },
  registerButton: {
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#f0f8f0',
    borderRadius: 12,
    marginTop: 10,
  },
  registerButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.button,
  },
  debugButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 15,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    marginHorizontal: 20,
  },
  debugButtonText: {
    color: '#ff6f00',
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: fontFamily.body,
  },
});

export default LoginScreen; 