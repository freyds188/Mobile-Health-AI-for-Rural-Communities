import React, { createContext, useContext, useState, useEffect } from 'react';
import { dataService, UserProfile } from '../services/DataService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, createDemoUser, seedSampleData } from '../utils/InitializeApp';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'provider' | 'admin' | 'chw';
  age?: number;
  gender?: 'male' | 'female' | 'other';
  location?: string;
  medicalHistory?: string;
}

interface AuthContextType {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  isSessionValid: () => Promise<boolean>;
  createTestUser: () => Promise<void>;
  clearStoredSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const clearStoredSession = async () => {
    try {
      console.log('🧹 AuthContext: Clearing stored session data...');
      await AsyncStorage.removeItem('sessionToken');
      await AsyncStorage.removeItem('user');
      setUser(null);
      setSessionToken(null);
      console.log('✅ AuthContext: Stored session data cleared');
    } catch (error) {
      console.error('❌ AuthContext: Error clearing stored session:', error);
    }
  };

  const initializeAuth = async () => {
    try {
      console.log('🚀 AuthContext: Starting authentication initialization...');
      
      // Clear any existing session data to ensure clean login experience
      await clearStoredSession();
      
      // Set a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Initialization timeout')), 5000); // 5 second timeout for web
      });
      
      const initPromise = (async () => {
        // Initialize the entire app
        console.log('🔧 AuthContext: Initializing app services...');
        const initSuccess = await initializeApp();
        
        if (!initSuccess) {
          console.warn('⚠️ AuthContext: App initialization failed, continuing with minimal functionality');
          // Don't return false, continue with basic functionality
        }
        
        console.log('✅ AuthContext: App services initialized successfully');
        
        // Check for existing session with timeout
        console.log('🔍 AuthContext: Checking for existing session...');
        try {
          // Use Promise.race to add timeout to session operations
          const sessionPromise = (async () => {
            const storedToken = await AsyncStorage.getItem('sessionToken');
            const storedUser = await AsyncStorage.getItem('user');
            
            if (storedToken && storedUser) {
              console.log('📱 AuthContext: Found stored session, validating...');
              
              // Always validate session regardless of platform
              try {
                const isValid = await dataService.validateSession(storedToken);
                if (isValid) {
                  console.log('✅ AuthContext: Session is valid, restoring user');
                  setSessionToken(storedToken);
                  setUser(JSON.parse(storedUser));
                } else {
                  console.log('❌ AuthContext: Session invalid, cleaning up');
                  // Clean up invalid session
                  await AsyncStorage.removeItem('sessionToken');
                  await AsyncStorage.removeItem('user');
                }
              } catch (validationError) {
                console.warn('⚠️ AuthContext: Session validation failed, cleaning up:', validationError);
                // Clean up on validation error
                await AsyncStorage.removeItem('sessionToken');
                await AsyncStorage.removeItem('user');
              }
            } else {
              console.log('📱 AuthContext: No stored session found');
            }
          })();
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Session check timeout')), 3000);
          });
          
          await Promise.race([sessionPromise, timeoutPromise]);
        } catch (sessionError) {
          console.warn('⚠️ AuthContext: Session check failed:', sessionError);
          // Continue without session - this is acceptable for smooth UX
        }
        
        return true;
      })();
      
      // Race between initialization and timeout
      await Promise.race([initPromise, timeoutPromise]);
      
      console.log('🎯 AuthContext: Initialization completed successfully');
      setIsLoading(false);
    } catch (error) {
      console.error('❌ AuthContext: Initialization failed:', error);
      console.log('🔄 AuthContext: Continuing with fallback mode...');
      
      // Continue in fallback mode
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 AuthContext: Starting login process');
      setIsLoading(true);
      
      console.log('📡 AuthContext: Calling dataService.authenticateUser');
      const result = await dataService.authenticateUser(email, password, 'mobile-app');
      console.log('📊 AuthContext: Authentication result:', !!result);
      
      if (result) {
        const userData: User = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          age: result.user.age,
          gender: result.user.gender,
          location: result.user.location,
          medicalHistory: result.user.medicalHistory
        };
        
        console.log('👤 AuthContext: Setting user data');
        setUser(userData);
        setSessionToken(result.sessionToken);
        
        // Store session info
        await AsyncStorage.setItem('sessionToken', result.sessionToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        console.log('✅ AuthContext: Login successful');
        return true;
      }
      
      console.log('❌ AuthContext: Login failed - no result');
      return false;
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id'> & { password: string }): Promise<boolean> => {
    try {
      console.log('📝 AuthContext: Starting registration process');
      setIsLoading(true);
      
      console.log('👤 AuthContext: Creating user profile');
      const userProfile = await dataService.createUser(userData);
      console.log('📊 AuthContext: User creation result:', !!userProfile);
      
      if (userProfile) {
        console.log('🔐 AuthContext: Auto-login after registration');
        // Auto-login after registration
        const loginSuccess = await login(userData.email, userData.password);
        
        if (loginSuccess) {
          // Add some sample health data for new users
          try {
            console.log('🌱 AuthContext: Adding sample data');
            await seedSampleData(userProfile.id);
          } catch (error) {
            console.log('Note: Could not add sample data:', error instanceof Error ? error.message : String(error));
          }
        }
        
        console.log('✅ AuthContext: Registration completed, login success:', loginSuccess);
        return loginSuccess;
      }
      
      console.log('❌ AuthContext: Registration failed - no user profile');
      return false;
    } catch (error) {
      console.error('❌ AuthContext: Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (sessionToken && user) {
        await dataService.logout(sessionToken, user.id);
      }
      
      // Clear local state and storage
      setUser(null);
      setSessionToken(null);
      await AsyncStorage.removeItem('sessionToken');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      // In a real implementation, you'd call dataService.updateUser
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const isSessionValid = async (): Promise<boolean> => {
    if (!sessionToken) return false;
    
    try {
      const isValid = await dataService.validateSession(sessionToken);
      if (!isValid) {
        // Clean up invalid session
        await logout();
      }
      return isValid;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  };

  const createTestUser = async () => {
    try {
      console.log('Creating test user account...');
      
      // Try to create demo user through the utility
      const demoSuccess = await createDemoUser();
      
      if (demoSuccess) {
        console.log('✅ Demo user created successfully! You can now login with:');
        console.log('📧 Email: demo@healthai.com');
        console.log('🔐 Password: demo123');
      } else {
        // Fallback to regular registration
        const testUserData = {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'patient' as const,
          age: 30,
          gender: 'male' as const,
          location: 'Test City',
          medicalHistory: 'No significant medical history'
        };

        const success = await register(testUserData);
        if (success) {
          console.log('✅ Test user created successfully!');
          console.log('📧 Email: test@example.com');
          console.log('🔐 Password: password123');
        }
      }
    } catch (error) {
      console.error('Error creating test user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    sessionToken,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    isSessionValid,
    createTestUser,
    clearStoredSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};