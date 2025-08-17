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
  ActivityIndicator,
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
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, isLoading, createTestUser, register, clearStoredSession } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    console.log('🔐 Login button pressed');
    
    // Enhanced validation
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please fill in both email and password fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return;
    }

    console.log('📧 Attempting login with email:', email);
    
    try {
      const success = await login(email, password);
      console.log('🎯 Login result:', success);
      
      if (success) {
        // Show brief success message and auto-navigate
        console.log('✅ Login successful, navigating to main app...');
        setLoginSuccess(true);
        
        // Add a small delay for better UX, then auto-navigate
        setTimeout(() => {
          navigation.replace('Main');
        }, 1000); // Slightly longer to show success state
        
        return; // Exit early on success
      } else {
        Alert.alert(
          '❌ Login Failed',
          'Invalid email or password. Please check your credentials and try again.',
          [
            {
              text: 'Try Again',
              style: 'default'
            },
            {
              text: 'Create Account',
              onPress: () => navigation.navigate('Register')
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert(
        'Login Error',
        'An unexpected error occurred during login. Please try again.',
        [
          {
            text: 'OK'
          }
        ]
      );
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
            
            {/* Debug info */}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={(text) => {
                  console.log('📧 Email input changed:', text);
                  setEmail(text);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading && !loginSuccess}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                  console.log('🔐 Password input changed, length:', text.length);
                  setPassword(text);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading && !loginSuccess}
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
              style={[
                styles.loginButton, 
                isLoading && styles.loginButtonDisabled,
                loginSuccess && styles.loginButtonSuccess
              ]}
              onPress={handleLogin}
              disabled={isLoading || loginSuccess}
            >
              <View style={styles.buttonContent}>
                {isLoading && <ActivityIndicator size="small" color="white" style={styles.buttonLoader} />}
                {loginSuccess && <Ionicons name="checkmark-circle" size={20} color="white" style={styles.buttonIcon} />}
                <Text style={styles.loginButtonText}>
                  {loginSuccess ? 'Success! Redirecting...' : isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerButtonText}>
                Don't have an account? Sign Up
              </Text>
            </TouchableOpacity>

            {/* Quick Demo Access */}
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => {
                setEmail('demo@healthai.com');
                setPassword('demo123');
              }}
            >
              <Text style={styles.testButtonText}>
                🚀 Fill Demo Credentials
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createTestUserButton}
              onPress={async () => {
                console.log('🧪 Creating fresh test user...');
                try {
                  const { dataService } = await import('../../services/DataService');
                  
                  // Clear old users first
                  const dbService = dataService.getDatabaseService();
                  await dbService.clearWebStorageUsers();
                  
                  // Create a test user with known credentials
                  const testEmail = 'test@example.com';
                  const testPassword = 'test123';
                  
                  const userProfile = await dataService.createUser({
                    name: 'Test User',
                    email: testEmail,
                    password: testPassword,
                    role: 'patient',
                    age: 25,
                    gender: 'male',
                    location: 'Test City',
                    medicalHistory: 'Test medical history'
                  });
                  
                  if (userProfile) {
                    setEmail(testEmail);
                    setPassword(testPassword);
                    Alert.alert(
                      '✅ Test User Created!',
                      `Fresh test user created and credentials filled in:\n\nEmail: ${testEmail}\nPassword: ${testPassword}\n\nNow try logging in!`
                    );
                  } else {
                    Alert.alert('❌ Failed', 'Could not create test user');
                  }
                } catch (error) {
                  console.error('🧪 Test user creation error:', error);
                  Alert.alert('❌ Error', String(error));
                }
              }}
            >
              <Text style={styles.createTestUserButtonText}>
                🧪 Create Fresh Test User
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                console.log('🔄 Reset button pressed');
                setEmail('');
                setPassword('');
                setLoginSuccess(false);
                console.log('✅ Login form reset');
              }}
            >
              <Text style={styles.resetButtonText}>
                🔄 Reset Form
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.debugAuthButton}
              onPress={async () => {
                if (!email || !password) {
                  Alert.alert('Debug Test', 'Please enter email and password first');
                  return;
                }
                
                console.log('🧪 Testing authentication directly...');
                try {
                  const { dataService } = await import('../../services/DataService');
                  const result = await dataService.authenticateUser(email, password);
                  
                  Alert.alert(
                    '🧪 Auth Test Result',
                    result ? `✅ SUCCESS!\nUser: ${result.user.name}\nEmail: ${result.user.email}` : '❌ FAILED - Check console for details'
                  );
                } catch (error) {
                  console.error('🧪 Auth test error:', error);
                  Alert.alert('🧪 Auth Test Error', String(error));
                }
              }}
            >
              <Text style={styles.debugAuthButtonText}>
                🧪 Test Auth Directly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.clearSessionButton}
              onPress={async () => {
                console.log('🧹 Clearing stored session data...');
                try {
                  await clearStoredSession();
                  Alert.alert(
                    '✅ Session Cleared',
                    'All stored session data has been cleared. You will need to log in again.',
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          setEmail('');
                          setPassword('');
                          setLoginSuccess(false);
                        }
                      }
                    ]
                  );
                } catch (error) {
                  console.error('❌ Error clearing session:', error);
                  Alert.alert('❌ Error', 'Failed to clear session data');
                }
              }}
            >
              <Text style={styles.clearSessionButtonText}>
                🧹 Clear Session Data
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.inspectButton}
              onPress={() => {
                if (typeof window !== 'undefined' && window.localStorage) {
                  const storedData = window.localStorage.getItem('health_ai_web_storage');
                  if (storedData) {
                    const parsed = JSON.parse(storedData);
                    const users = parsed.users || [];
                    console.log('🔍 Stored users:', users);
                    
                    const userInfo = users.map((u: any) => 
                      `📧 ${u.email}\n🔐 Hash: ${u.password_hash?.substring(0, 20)}...\n🧂 Salt: ${u.salt?.substring(0, 20)}...`
                    ).join('\n\n');
                    
                    Alert.alert('🔍 Stored Users', userInfo || 'No users found');
                  } else {
                    Alert.alert('🔍 Storage', 'No stored data found');
                  }
                } else {
                  Alert.alert('🔍 Storage', 'Web storage not available');
                }
              }}
            >
              <Text style={styles.inspectButtonText}>
                🔍 Inspect Stored Users
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fullTestButton}
              onPress={async () => {
                if (!email || !password) {
                  Alert.alert('Test Error', 'Please enter email and password first');
                  return;
                }
                
                console.log('🧪 FULL CHAIN TEST: Starting complete authentication test');
                try {
                  // Step 1: Test direct database authentication
                  console.log('🧪 Step 1: Testing database authentication...');
                  const { dataService } = await import('../../services/DataService');
                  const dbService = dataService.getDatabaseService();
                  const dbResult = await dbService.authenticateUser(email, password);
                  console.log('🧪 Database result:', !!dbResult);
                  
                  if (!dbResult) {
                    Alert.alert('🧪 Test Failed', 'Database authentication failed - user not found or wrong password');
                    return;
                  }
                  
                  // Step 2: Test DataService authentication
                  console.log('🧪 Step 2: Testing DataService authentication...');
                  const dataResult = await dataService.authenticateUser(email, password);
                  console.log('🧪 DataService result:', !!dataResult);
                  
                  if (!dataResult) {
                    Alert.alert('🧪 Test Failed', 'DataService authentication failed');
                    return;
                  }
                  
                  // Step 3: Test AuthContext login
                  console.log('🧪 Step 3: Testing AuthContext login...');
                  const authResult = await login(email, password);
                  console.log('🧪 AuthContext result:', authResult);
                  
                  if (authResult) {
                    Alert.alert('🧪 FULL SUCCESS!', 'All authentication layers passed! You should be logged in now.');
                  } else {
                    Alert.alert('🧪 AuthContext Failed', 'Database and DataService worked, but AuthContext failed');
                  }
                  
                } catch (error) {
                  console.error('🧪 Full test error:', error);
                  Alert.alert('🧪 Test Error', String(error));
                }
              }}
            >
              <Text style={styles.fullTestButtonText}>
                🧪 Full Chain Test
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
  debugInfo: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
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
  loginButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLoader: {
    marginRight: 8,
  },
  buttonIcon: {
    marginRight: 8,
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
  testButton: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  testButtonText: {
    color: '#2196f3',
    fontSize: 14,
    fontWeight: '600',
  },
  createTestUserButton: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#e1f5fe',
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#0277bd',
  },
  createTestUserButtonText: {
    color: '#0277bd',
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#ffebee',
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  resetButtonText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '600',
  },
  debugAuthButton: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  debugAuthButtonText: {
    color: '#4caf50',
    fontSize: 14,
    fontWeight: '600',
  },
  inspectButton: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  inspectButtonText: {
    color: '#ff9800',
    fontSize: 14,
    fontWeight: '600',
  },
  fullTestButton: {
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#f3e5f5',
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#9c27b0',
  },
  fullTestButtonText: {
    color: '#9c27b0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createTestButton: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  createTestButtonText: {
    color: '#ff9800',
    fontSize: 14,
    fontWeight: '600',
  },
  testRegisterButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    alignItems: 'center',
  },
  testRegisterButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  clearSessionButton: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#ffebee',
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  clearSessionButtonText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '600',
  },
  debugTestButton: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f3e5f5',
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#9c27b0',
  },
  debugTestButtonText: {
    color: '#9c27b0',
    fontSize: 14,
    fontWeight: '600',
  },
  mlTrainingButton: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  mlTrainingButtonText: {
    color: '#4caf50',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen; 