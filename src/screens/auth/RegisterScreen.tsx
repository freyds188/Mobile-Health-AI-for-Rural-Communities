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
// import RNPickerSelect from 'react-native-picker-select';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/DataService';
import { fontFamily } from '../../utils/fonts';

const RegisterScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient' as 'patient' | 'provider' | 'admin',
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    location: '',
    medicalHistory: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { } = useAuth(); // Keep for future use if needed

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    console.log('⚡ FAST Register button pressed');
    console.log('📊 Form data:', {
      name: formData.name,
      email: formData.email,
      password: formData.password ? '[PASSWORD PROVIDED]' : '[NO PASSWORD]',
      confirmPassword: formData.confirmPassword ? '[CONFIRM PASSWORD PROVIDED]' : '[NO CONFIRM PASSWORD]',
      role: formData.role,
      age: formData.age,
      gender: formData.gender
    });
    
    // Enhanced validation with better user feedback
    console.log('🔍 Starting validation checks...');
    
    if (!formData.name.trim()) {
      console.log('❌ Validation failed: Missing name');
      Alert.alert('Missing Name', 'Please enter your full name');
      return;
    }
    console.log('✅ Name validation passed');

    if (!formData.email.trim()) {
      console.log('❌ Validation failed: Missing email');
      Alert.alert('Missing Email', 'Please enter your email address');
      return;
    }
    console.log('✅ Email presence validation passed');

    if (!validateEmail(formData.email)) {
      console.log('❌ Validation failed: Invalid email format');
      Alert.alert('Invalid Email', 'Please enter a valid email address (e.g., user@example.com)');
      return;
    }
    console.log('✅ Email format validation passed');

    if (!formData.password) {
      console.log('❌ Validation failed: Missing password');
      Alert.alert('Missing Password', 'Please create a password');
      return;
    }
    console.log('✅ Password presence validation passed');

    if (formData.password.length < 6) {
      console.log('❌ Validation failed: Weak password, length:', formData.password.length);
      Alert.alert('Weak Password', 'Password must be at least 6 characters long for security');
      return;
    }
    console.log('✅ Password strength validation passed');

    if (!formData.confirmPassword) {
      console.log('❌ Validation failed: Missing password confirmation');
      Alert.alert('Missing Confirmation', 'Please confirm your password');
      return;
    }
    console.log('✅ Password confirmation presence validation passed');

    if (formData.password !== formData.confirmPassword) {
      console.log('❌ Validation failed: Password mismatch');
      Alert.alert('Password Mismatch', 'The passwords you entered do not match. Please check and try again.');
      return;
    }
    console.log('✅ Password match validation passed');

    if (formData.age && (parseInt(formData.age) < 1 || parseInt(formData.age) > 120)) {
      console.log('❌ Validation failed: Invalid age:', formData.age);
      Alert.alert('Invalid Age', 'Please enter a valid age between 1 and 120');
      return;
    }
    console.log('✅ Age validation passed');
    
    console.log('🎯 All validations passed, proceeding to registration...');

    console.log('👤 Attempting registration for:', formData.email);
    
    console.log('⏳ Setting loading state to true...');
    setIsRegistering(true);
    
    try {
      console.log('🚀 Calling dataService.createUser...');
      console.log('📤 User data being sent:', {
        name: formData.name,
        email: formData.email,
        password: '[HIDDEN]',
        role: formData.role,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender,
        location: formData.location,
        medicalHistory: formData.medicalHistory,
      });
      
      // Use dataService directly to create user without auto-login
      const userProfile = await dataService.createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender,
        location: formData.location,
        medicalHistory: formData.medicalHistory,
      });

      console.log('📥 DataService response received:', !!userProfile);
      console.log('👤 User profile created:', userProfile ? 'YES' : 'NO');
      
      if (userProfile) {
        console.log('✅ UserProfile details:', {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role
        });
      }
      
      const success = !!userProfile;

      if (success) {
        // Show visual success state first
        console.log(`✅ Registration successful for ${formData.name}, showing success popup...`);
        setRegistrationSuccess(true);
        
        // Small delay to ensure visual state shows, then show popup
        setTimeout(() => {
          console.log('🎊 About to show Alert.alert popup...');
          
          // Enhanced popup with fallback for web platforms
          try {
          console.log('🎯 Attempting to show Alert.alert...');
          Alert.alert(
            '🎉 Registration Successful!',
            `Welcome to Health AI, ${formData.name}!\n\nYour account has been created successfully. You can now sign in with your email and password.`,
            [
              {
                text: 'Go to Login',
                onPress: () => {
                  console.log('🎯 Go to Login button pressed in success popup');
                  // Reset form for security
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: 'patient',
                    age: '',
                    gender: 'male',
                    location: '',
                    medicalHistory: '',
                  });
                  
                  // Navigate to login screen
                  console.log('🔄 Navigating to Login screen...');
                  setRegistrationSuccess(false); // Reset success state
                  try {
                    navigation.navigate('Login');
                    console.log('✅ Navigation to Login successful');
                  } catch (navError) {
                    console.error('❌ Navigation failed:', navError);
                    // Force navigation using replace
                    navigation.replace('Login');
                  }
                }
              }
            ],
            { cancelable: false } // Prevent dismissing without action
          );
          console.log('✅ Alert.alert called successfully');
        } catch (alertError) {
          console.error('❌ Alert.alert failed:', alertError);
          
          // Fallback: Use browser alert for web or auto-navigate
          console.log('🔄 Using fallback popup method...');
          if (typeof window !== 'undefined' && window.alert) {
            console.log('🌐 Using browser alert...');
            window.alert(`🎉 Registration Successful!\n\nWelcome to Health AI, ${formData.name}!\n\nYour account has been created successfully. You can now sign in with your email and password.\n\nClick OK to go to login screen.`);
          } else {
            console.log('📱 No browser alert available, using console alert...');
            console.log(`🎉 REGISTRATION SUCCESSFUL!\nWelcome ${formData.name}! Your account has been created.`);
          }
          
          // Auto-navigate after fallback
          setTimeout(() => {
            console.log('🔄 Auto-navigating to login screen...');
            setRegistrationSuccess(false); // Reset success state
            try {
              navigation.navigate('Login');
              console.log('✅ Auto-navigation to Login successful');
            } catch (navError) {
              console.error('❌ Auto-navigation failed:', navError);
              // Force navigation using replace
              navigation.replace('Login');
            }
          }, 2000);
        }
        }, 500); // 500ms delay to show visual success state
        
        return; // Exit early on success
      } else {
        Alert.alert(
          '❌ Registration Failed',
          'We couldn\'t create your account. This could be due to:\n\n• Email already in use\n• Database initialization issue\n• Network connection problem\n\nPlease try again or contact support.',
          [
            {
              text: 'Try Again',
              style: 'default'
            },
            {
              text: 'Login Instead',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Registration error occurred:');
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error instanceof Error:', error instanceof Error);
      console.error('❌ Error details:', error);
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      Alert.alert(
        'Registration Error',
        `An unexpected error occurred during registration:\n\n${error instanceof Error ? error.message : String(error)}\n\nPlease try again or check the console for more details.`,
        [
          {
            text: 'OK'
          }
        ]
      );
    } finally {
      console.log('🔄 Setting loading state to false...');
      setIsRegistering(false);
      console.log('✅ Registration process completed (success or failure)');
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
              <Text style={styles.title}>Join Health AI</Text>
              <Text style={styles.subtitle}>Create your account</Text>
            </View>
          </LinearGradient>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Create Account</Text>
            <Text style={styles.formSubtitle}>Fill in your details</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
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
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
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

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Role</Text>
              <View style={styles.selectContainer}>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  style={webSelectStyles}
                >
                  <option value="patient">Patient</option>
                  <option value="provider">Healthcare Provider</option>
                  <option value="admin">Administrator</option>
                </select>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Age (optional)"
                value={formData.age}
                onChangeText={(text) => setFormData({ ...formData, age: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Gender</Text>
              <View style={styles.selectContainer}>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  style={webSelectStyles}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Location (optional)"
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.textAreaContainer}>
              <Text style={styles.textAreaLabel}>Medical History (optional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Any relevant medical history..."
                value={formData.medicalHistory}
                onChangeText={(text) => setFormData({ ...formData, medicalHistory: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {registrationSuccess && (
              <View style={styles.successMessage}>
                <Text style={styles.successMessageText}>
                  🎉 Registration Successful! Redirecting to login...
                </Text>
                <TouchableOpacity
                  style={styles.manualLoginButton}
                  onPress={() => {
                    console.log('🎯 Manual "Go to Login" button pressed');
                    setRegistrationSuccess(false);
                    try {
                      navigation.replace('Login');
                      console.log('✅ Manual navigation successful');
                    } catch (error) {
                      console.error('❌ Manual navigation failed:', error);
                    }
                  }}
                >
                  <Text style={styles.manualLoginButtonText}>
                    👆 Go to Login Now
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.registerButton, 
                isRegistering && styles.registerButtonDisabled,
                registrationSuccess && styles.registerButtonSuccess
              ]}
              onPress={() => {
                console.log('🔘 Create Account button pressed!');
                console.log('🔘 isRegistering state:', isRegistering);
                console.log('🔘 Button disabled state:', isRegistering);
                handleRegister();
              }}
              disabled={isRegistering || registrationSuccess}
            >
              <Text style={styles.registerButtonText}>
                {registrationSuccess ? '✅ Registration Successful!' : 
                 isRegistering ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginButtonText}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>

            {/* Debug/testing button removed for production */}


            
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>
                ← Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const webSelectStyles = {
  fontSize: 18,
  paddingVertical: 15,
  paddingHorizontal: 15,
  borderWidth: 2,
  borderColor: '#e0e0e0',
  borderRadius: 12,
  color: '#333',
  paddingRight: 30,
  backgroundColor: '#f8f9fa',
  width: '100%',
  height: 60,
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
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    textAlign: 'center',
    fontFamily: fontFamily.heading,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
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
    paddingBottom: 30,
  },
  formTitle: {
    fontSize: 24,
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
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
  },
  selectContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    height: 60,
  },
  textAreaContainer: {
    marginBottom: 20,
  },
  textAreaLabel: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    fontSize: 18,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    fontFamily: fontFamily.body,
  },
  registerButton: {
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
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
  successMessage: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4caf50',
    alignItems: 'center',
  },
  successMessageText: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: fontFamily.button,
  },
  manualLoginButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  manualLoginButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: fontFamily.button,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: fontFamily.buttonBold,
  },
  loginButton: {
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#f0f8f0',
    borderRadius: 12,
    marginTop: 10,
  },
  loginButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.button,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 15,
    backgroundColor: '#fff3e0',
    borderRadius: 12,
  },
  backButtonText: {
    color: '#ff6f00',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.button,
  },
  successButton: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#4caf50',
    alignItems: 'center',
  },
  successButtonText: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.button,
  },
  debugButton: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f44336',
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.button,
  },
});

export default RegisterScreen; 