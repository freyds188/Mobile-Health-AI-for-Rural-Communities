import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as SecureStore from 'expo-secure-store';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'provider' | 'admin';
  age?: number;
  gender?: 'male' | 'female' | 'other';
  location?: string;
  medicalHistory?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  clearAllData: () => Promise<void>; // Debug function
  createTestUser: () => Promise<void>; // Debug function
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debug function to clear all stored data (for testing)
  const clearAllData = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('users');
      setUser(null);
      console.log('All data cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  // Debug function to create a test user
  const createTestUser = async () => {
    try {
      const testUser: User = {
        id: 'test-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'patient',
        age: 25,
        gender: 'male',
        location: 'Test City',
        medicalHistory: 'No significant history'
      };

      const users = [testUser];
      await AsyncStorage.setItem('users', JSON.stringify(users));
      console.log('Test user created');
    } catch (error) {
      console.error('Error creating test user:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('Attempting login with email:', email);
      
      // Check if user exists in storage
      const storedUserData = await AsyncStorage.getItem('users');
      console.log('Stored users data:', storedUserData);
      
      const users = storedUserData ? JSON.parse(storedUserData) : [];
      console.log('Parsed users:', users);
      
      // Find user by email
      const user = users.find((u: User) => u.email === email);
      console.log('Found user:', user);
      
      if (user) {
        // In a real app, you would verify the password here
        await AsyncStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        console.log('Login successful');
        return true;
      } else {
        console.log('User not found');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id'> & { password: string }): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('Attempting registration with email:', userData.email);
      
      // Check if user already exists
      const storedUserData = await AsyncStorage.getItem('users');
      const users = storedUserData ? JSON.parse(storedUserData) : [];
      
      const existingUser = users.find((u: User) => u.email === userData.email);
      if (existingUser) {
        console.log('User already exists');
        return false; // User already exists
      }
      
      const newUser: User = {
        id: Date.now().toString(),
        email: userData.email,
        name: userData.name,
        role: userData.role,
        age: userData.age,
        gender: userData.gender,
        location: userData.location,
        medicalHistory: userData.medicalHistory
      };

      console.log('Creating new user:', newUser);

      // Add new user to users array
      const updatedUsers = [...users, newUser];
      await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
      
      // Set current user
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      console.log('Registration successful');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...userData };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    clearAllData,
    createTestUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 