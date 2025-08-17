import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utility to clear all stored session data
 * This can be used to force a fresh login experience
 */
export const clearAllSessionData = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing all session data...');
    
    // Clear all authentication-related data
    await AsyncStorage.removeItem('sessionToken');
    await AsyncStorage.removeItem('user');
    
    // Clear any other potential session data
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userProfile');
    await AsyncStorage.removeItem('loginState');
    
    console.log('✅ All session data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing session data:', error);
    throw error;
  }
};

/**
 * Check if there's any stored session data
 */
export const hasStoredSessionData = async (): Promise<boolean> => {
  try {
    const sessionToken = await AsyncStorage.getItem('sessionToken');
    const user = await AsyncStorage.getItem('user');
    const authToken = await AsyncStorage.getItem('authToken');
    const userProfile = await AsyncStorage.getItem('userProfile');
    const loginState = await AsyncStorage.getItem('loginState');
    
    return !!(sessionToken || user || authToken || userProfile || loginState);
  } catch (error) {
    console.error('❌ Error checking session data:', error);
    return false;
  }
};

/**
 * Get a summary of stored session data (for debugging)
 */
export const getSessionDataSummary = async (): Promise<string> => {
  try {
    const sessionToken = await AsyncStorage.getItem('sessionToken');
    const user = await AsyncStorage.getItem('user');
    const authToken = await AsyncStorage.getItem('authToken');
    const userProfile = await AsyncStorage.getItem('userProfile');
    const loginState = await AsyncStorage.getItem('loginState');
    
    const summary = {
      sessionToken: sessionToken ? `${sessionToken.substring(0, 10)}...` : 'none',
      user: user ? 'present' : 'none',
      authToken: authToken ? `${authToken.substring(0, 10)}...` : 'none',
      userProfile: userProfile ? 'present' : 'none',
      loginState: loginState || 'none'
    };
    
    return JSON.stringify(summary, null, 2);
  } catch (error) {
    console.error('❌ Error getting session data summary:', error);
    return 'Error retrieving session data';
  }
};
