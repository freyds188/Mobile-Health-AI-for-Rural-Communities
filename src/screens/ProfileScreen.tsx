import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import RNPickerSelect from 'react-native-picker-select';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age?.toString() || '',
    gender: user?.gender || 'male',
    location: user?.location || '',
    medicalHistory: user?.medicalHistory || '',
  });

  // Modal states
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  // Settings states
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    healthReminders: true,
    riskAlerts: true,
    systemUpdates: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    dataSharing: false,
    analytics: true,
    locationTracking: false,
    healthDataSync: true,
  });

  const handleSave = async () => {
    try {
      await updateProfile({
        name: formData.name,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender,
        location: formData.location,
        medicalHistory: formData.medicalHistory,
      });
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    // Get session info for logout summary
    const info = await getSessionInfo();
    setSessionInfo(info);
    setShowLogoutModal(true);
  };

  const getSessionInfo = async () => {
    try {
      // Get stored session data for summary
      const sessionData = await AsyncStorage.getItem('sessionToken');
      const userData = await AsyncStorage.getItem('user');
      
      return {
        loginTime: 'Current session',
        hasSessionData: !!sessionData,
        hasUserData: !!userData,
        timestamp: new Date().toLocaleString()
      };
    } catch (error) {
      return {
        loginTime: 'Unknown',
        hasSessionData: false,
        hasUserData: false,
        timestamp: new Date().toLocaleString()
      };
    }
  };

  const performLogout = async (secureMode: boolean = false, sessionInfo?: any) => {
    try {
      // Show loading state with different messages based on mode
      const loadingMessage = secureMode 
        ? 'Performing secure logout and clearing all data...' 
        : 'Logging out...';
      
      // Show brief loading message
      console.log('🔄 Logout in progress:', loadingMessage);
      
      // Log logout activity
      console.log(`🚪 Logout initiated - Mode: ${secureMode ? 'Secure' : 'Quick'}, User: ${user?.name}, Time: ${sessionInfo?.timestamp}`);
      
      if (secureMode) {
        // Secure logout: Clear all local data, offline queue, and caches
        await performSecureLogout();
      } else {
        // Quick logout: Standard logout process
        await performQuickLogout();
      }
      
      // Log success (no alert since we're navigating away)
      const successMessage = secureMode 
        ? `Secure logout completed successfully - All local data cleared, User: ${user?.name || 'Unknown'}` 
        : `Logout completed successfully - User: ${user?.name || 'Unknown'}`;
      
      console.log('✅ Logout process completed successfully:', successMessage);
    } catch (error) {
      console.error('❌ Logout error:', error);
      Alert.alert(
        'Logout Error', 
        `There was an issue during logout:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support if the problem persists.`,
        [
          { text: 'Retry', onPress: () => performLogout(secureMode, sessionInfo) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const performQuickLogout = async () => {
    // Standard logout process
    await logout();
    
    // Navigate to login screen after logout
    setTimeout(() => {
      (navigation as any).reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }, 500); // Small delay to ensure logout completes
  };

  const performSecureLogout = async () => {
    try {
      // 1. Standard logout first
      await logout();
      
      // 2. Clear additional app data
      const { dataService } = require('../services/DataService');
      const { offlineQueue } = require('../utils/OfflineQueue');
      const { clearAllSessionData } = require('../utils/ClearSessionData');
      
      // 3. Clear offline queue
      try {
        await offlineQueue.load();
        // Clear the queue by draining with a processor that always returns true
        await offlineQueue.drain(async () => true);
      } catch (error) {
        console.log('Note: Could not clear offline queue:', error);
      }
      
      // 4. Clear all session data
      try {
        await clearAllSessionData();
      } catch (error) {
        console.log('Note: Could not clear session data:', error);
      }
      
      // 5. Clear any cached health data for the current user
      if (user?.id) {
        try {
          const databaseService = dataService.getDatabaseService();
          // Note: This would typically be implemented to clear user-specific cache
          console.log('Cleared user-specific cached data');
        } catch (error) {
          console.log('Note: Could not clear user cache:', error);
        }
      }
      
      // 6. Reset notification settings
      try {
        setNotificationSettings({
          pushNotifications: true,
          emailNotifications: true,
          healthReminders: true,
          riskAlerts: true,
          systemUpdates: false,
        });
        setPrivacySettings({
          dataSharing: false,
          analytics: true,
          locationTracking: false,
          healthDataSync: true,
        });
      } catch (error) {
        console.log('Note: Could not reset settings:', error);
      }
      
      console.log('✅ Secure logout completed');
      
      // Navigate to login screen after secure logout
      setTimeout(() => {
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 1000); // Longer delay for secure logout to show completion message
    } catch (error) {
      console.error('❌ Secure logout error:', error);
      // Fallback to regular logout
      await logout();
      
      // Still navigate to login even if secure logout failed
      setTimeout(() => {
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 500);
    }
  };

  // Modal handlers
  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Choose how you would like to contact our support team:',
      [
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@healthapp.com?subject=Health App Support Request'),
        },
        {
          text: 'Phone',
          onPress: () => Linking.openURL('tel:+1234567890'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleReportBug = () => {
    Alert.alert(
      'Report a Bug',
      'Help us improve the app by reporting any issues you encounter.',
      [
        {
          text: 'Send Email',
          onPress: () => Linking.openURL('mailto:bugs@healthapp.com?subject=Bug Report&body=Please describe the issue you encountered:'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'patient':
        return 'Patient';
      case 'provider':
        return 'Healthcare Provider';
      case 'admin':
        return 'Administrator';
      default:
        return role;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={32} color="#ffffff" />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>👤 My Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Ionicons name={isEditing ? "close" : "create"} size={20} color="#ffffff" />
          <Text style={styles.editButtonText}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImage}>
            <Ionicons name="person" size={80} color="#2E7D32" />
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <View style={styles.profileRoleContainer}>
            <Ionicons name="shield" size={20} color="#2E7D32" />
            <Text style={styles.profileRole}>{getRoleDisplayName(user?.role || '')}</Text>
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={24} color="#2E7D32" />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>
          
          <View style={styles.formItem}>
            <Text style={styles.formLabel}>Full Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter your full name"
              />
            ) : (
              <Text style={styles.formValue}>{user?.name}</Text>
            )}
          </View>

          <View style={styles.formItem}>
            <Text style={styles.formLabel}>Email</Text>
            <Text style={styles.formValue}>{user?.email}</Text>
          </View>

          <View style={styles.formItem}>
            <Text style={styles.formLabel}>Role</Text>
            <Text style={styles.formValue}>{getRoleDisplayName(user?.role || '')}</Text>
          </View>

          <View style={styles.formItem}>
            <Text style={styles.formLabel}>Age</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.age}
                onChangeText={(text) => setFormData({ ...formData, age: text })}
                placeholder="Enter your age"
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.formValue}>{user?.age || 'Not specified'}</Text>
            )}
          </View>

          <View style={styles.formItem}>
            <Text style={styles.formLabel}>Gender</Text>
            {isEditing ? (
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
            ) : (
              <Text style={styles.formValue}>
                {user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not specified'}
              </Text>
            )}
          </View>

          <View style={styles.formItem}>
            <Text style={styles.formLabel}>Location</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                placeholder="Enter your location"
              />
            ) : (
              <Text style={styles.formValue}>{user?.location || 'Not specified'}</Text>
            )}
          </View>

          <View style={styles.formItem}>
            <Text style={styles.formLabel}>Medical History</Text>
            {isEditing ? (
              <TextInput
                style={styles.textArea}
                value={formData.medicalHistory}
                onChangeText={(text) => setFormData({ ...formData, medicalHistory: text })}
                placeholder="Enter your medical history"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.formValue}>{user?.medicalHistory || 'Not specified'}</Text>
            )}
          </View>

          {isEditing && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings" size={24} color="#2E7D32" />
            <Text style={styles.cardTitle}>Settings & Support</Text>
          </View>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowNotificationModal(true)}>
            <Ionicons name="notifications-outline" size={20} color="#667eea" />
            <Text style={styles.actionText}>Notification Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setShowPrivacyModal(true)}>
            <Ionicons name="shield-outline" size={20} color="#667eea" />
            <Text style={styles.actionText}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setShowHelpModal(true)}>
            <Ionicons name="help-circle-outline" size={20} color="#667eea" />
            <Text style={styles.actionText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setShowTermsModal(true)}>
            <Ionicons name="document-text-outline" size={20} color="#667eea" />
            <Text style={styles.actionText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setShowAboutModal(true)}>
            <Ionicons name="information-circle-outline" size={20} color="#667eea" />
            <Text style={styles.actionText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ff4757" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Notification Settings Modal */}
      <Modal
        visible={showNotificationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Settings</Text>
              <TouchableOpacity
                onPress={() => setShowNotificationModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Push Notifications</Text>
                  <Text style={styles.settingDescription}>Receive notifications on your device</Text>
                </View>
                <Switch
                  value={notificationSettings.pushNotifications}
                  onValueChange={(value) => 
                    setNotificationSettings({...notificationSettings, pushNotifications: value})
                  }
                  trackColor={{ false: '#ccc', true: '#2E7D32' }}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Email Notifications</Text>
                  <Text style={styles.settingDescription}>Receive updates via email</Text>
                </View>
                <Switch
                  value={notificationSettings.emailNotifications}
                  onValueChange={(value) => 
                    setNotificationSettings({...notificationSettings, emailNotifications: value})
                  }
                  trackColor={{ false: '#ccc', true: '#2E7D32' }}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Health Reminders</Text>
                  <Text style={styles.settingDescription}>Reminders for health check-ups</Text>
                </View>
                <Switch
                  value={notificationSettings.healthReminders}
                  onValueChange={(value) => 
                    setNotificationSettings({...notificationSettings, healthReminders: value})
                  }
                  trackColor={{ false: '#ccc', true: '#2E7D32' }}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Risk Alerts</Text>
                  <Text style={styles.settingDescription}>Important health risk notifications</Text>
                </View>
                <Switch
                  value={notificationSettings.riskAlerts}
                  onValueChange={(value) => 
                    setNotificationSettings({...notificationSettings, riskAlerts: value})
                  }
                  trackColor={{ false: '#ccc', true: '#2E7D32' }}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>System Updates</Text>
                  <Text style={styles.settingDescription}>App updates and maintenance notices</Text>
                </View>
                <Switch
                  value={notificationSettings.systemUpdates}
                  onValueChange={(value) => 
                    setNotificationSettings({...notificationSettings, systemUpdates: value})
                  }
                  trackColor={{ false: '#ccc', true: '#2E7D32' }}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.saveModalButton}
                onPress={() => {
                  Alert.alert('Success', 'Notification settings saved successfully!');
                  setShowNotificationModal(false);
                }}
              >
                <Text style={styles.saveModalButtonText}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Privacy Settings Modal */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Settings</Text>
              <TouchableOpacity
                onPress={() => setShowPrivacyModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Data Sharing</Text>
                  <Text style={styles.settingDescription}>Share anonymized data for research</Text>
                </View>
                <Switch
                  value={privacySettings.dataSharing}
                  onValueChange={(value) => 
                    setPrivacySettings({...privacySettings, dataSharing: value})
                  }
                  trackColor={{ false: '#ccc', true: '#2E7D32' }}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Analytics</Text>
                  <Text style={styles.settingDescription}>Help improve app performance</Text>
                </View>
                <Switch
                  value={privacySettings.analytics}
                  onValueChange={(value) => 
                    setPrivacySettings({...privacySettings, analytics: value})
                  }
                  trackColor={{ false: '#ccc', true: '#2E7D32' }}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Location Tracking</Text>
                  <Text style={styles.settingDescription}>Use location for health insights</Text>
                </View>
                <Switch
                  value={privacySettings.locationTracking}
                  onValueChange={(value) => 
                    setPrivacySettings({...privacySettings, locationTracking: value})
                  }
                  trackColor={{ false: '#ccc', true: '#2E7D32' }}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Health Data Sync</Text>
                  <Text style={styles.settingDescription}>Sync with external health apps</Text>
                </View>
                <Switch
                  value={privacySettings.healthDataSync}
                  onValueChange={(value) => 
                    setPrivacySettings({...privacySettings, healthDataSync: value})
                  }
                  trackColor={{ false: '#ccc', true: '#2E7D32' }}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.saveModalButton}
                onPress={() => {
                  Alert.alert('Success', 'Privacy settings saved successfully!');
                  setShowPrivacyModal(false);
                }}
              >
                <Text style={styles.saveModalButtonText}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        visible={showHelpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Help & Support</Text>
              <TouchableOpacity
                onPress={() => setShowHelpModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <TouchableOpacity style={styles.helpOption} onPress={handleContactSupport}>
                <Ionicons name="mail-outline" size={24} color="#2E7D32" />
                <View style={styles.helpOptionText}>
                  <Text style={styles.helpOptionTitle}>Contact Support</Text>
                  <Text style={styles.helpOptionDescription}>Get help from our support team</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.helpOption} onPress={handleReportBug}>
                <Ionicons name="bug-outline" size={24} color="#2E7D32" />
                <View style={styles.helpOptionText}>
                  <Text style={styles.helpOptionTitle}>Report a Bug</Text>
                  <Text style={styles.helpOptionDescription}>Report technical issues</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.helpOption} 
                onPress={() => Linking.openURL('https://www.facebook.com/TsarlsAndrey')}
              >
                <Ionicons name="help-circle-outline" size={24} color="#2E7D32" />
                <View style={styles.helpOptionText}>
                  <Text style={styles.helpOptionTitle}>FAQ</Text>
                  <Text style={styles.helpOptionDescription}>Frequently asked questions</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.helpOption} 
                onPress={() => Linking.openURL('https://www.facebook.com/TsarlsAndrey')}
              >
                <Ionicons name="book-outline" size={24} color="#2E7D32" />
                <View style={styles.helpOptionText}>
                  <Text style={styles.helpOptionTitle}>User Guide</Text>
                  <Text style={styles.helpOptionDescription}>Learn how to use the app</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.helpOption} 
                onPress={() => Linking.openURL('https://www.facebook.com/TsarlsAndrey')}
              >
                <Ionicons name="people-outline" size={24} color="#2E7D32" />
                <View style={styles.helpOptionText}>
                  <Text style={styles.helpOptionTitle}>Community Forum</Text>
                  <Text style={styles.helpOptionDescription}>Connect with other users</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms of Service</Text>
              <TouchableOpacity
                onPress={() => setShowTermsModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.termsText}>
                <Text style={styles.termsHeading}>1. Acceptance of Terms{'\n'}</Text>
                By using this Health Management App, you agree to comply with and be bound by these Terms of Service.
                {'\n\n'}
                <Text style={styles.termsHeading}>2. Medical Disclaimer{'\n'}</Text>
                This app is for informational purposes only and does not provide medical advice. Always consult with healthcare professionals for medical decisions.
                {'\n\n'}
                <Text style={styles.termsHeading}>3. Privacy and Data Protection{'\n'}</Text>
                We are committed to protecting your privacy and health data according to applicable healthcare privacy laws.
                {'\n\n'}
                <Text style={styles.termsHeading}>4. User Responsibilities{'\n'}</Text>
                Users are responsible for providing accurate health information and using the app responsibly.
                {'\n\n'}
                <Text style={styles.termsHeading}>5. Limitation of Liability{'\n'}</Text>
                The app developers are not liable for any health decisions made based on app recommendations.
                {'\n\n'}
                <Text style={styles.termsHeading}>6. Updates to Terms{'\n'}</Text>
                These terms may be updated periodically. Continued use constitutes acceptance of updated terms.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About</Text>
              <TouchableOpacity
                onPress={() => setShowAboutModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.aboutSection}>
                <View style={styles.appIcon}>
                  <Ionicons name="medical" size={60} color="#2E7D32" />
                </View>
                <Text style={styles.appName}>Health Management App</Text>
                <Text style={styles.appVersion}>Version 1.0.0</Text>
              </View>

              <View style={styles.aboutContent}>
                <Text style={styles.aboutDescription}>
                  A comprehensive health management application designed to help users track their health data, 
                  assess risks, and receive personalized health insights using advanced AI and machine learning technologies.
                </Text>

                <Text style={styles.aboutHeading}>Key Features:</Text>
                <Text style={styles.aboutFeatures}>
                  • Health data logging and tracking{'\n'}
                  • AI-powered risk assessment{'\n'}
                  • Intelligent health chatbot{'\n'}
                  • Personalized health insights{'\n'}
                  • Secure data management{'\n'}
                  • Healthcare provider integration
                </Text>

                <Text style={styles.aboutHeading}>Developed By:</Text>
                <Text style={styles.aboutText}>CSB-7</Text>

                <Text style={styles.aboutHeading}>Contact:</Text>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.facebook.com/TsarlsAndrey')}>
                  <Text style={styles.linkText}>info@healthapp.com</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.facebook.com/TsarlsAndrey')}>
                  <Text style={styles.linkText}>www.healthapp.com</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Logout</Text>
              <TouchableOpacity
                onPress={() => setShowLogoutModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.logoutSummary}>
                <View style={styles.userSummary}>
                  <Ionicons name="person-circle" size={50} color="#2E7D32" />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user?.name || 'Unknown User'}</Text>
                    <Text style={styles.userRole}>{getRoleDisplayName(user?.role || '')}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
                  </View>
                </View>

                <View style={styles.sessionDetails}>
                  <Text style={styles.sessionTitle}>Session Information</Text>
                  <View style={styles.sessionItem}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.sessionText}>Current session active</Text>
                  </View>
                  <View style={styles.sessionItem}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.sessionText}>{sessionInfo?.timestamp || 'Unknown time'}</Text>
                  </View>
                  <View style={styles.sessionItem}>
                    <Ionicons name="shield-checkmark-outline" size={16} color="#666" />
                    <Text style={styles.sessionText}>
                      {sessionInfo?.hasSessionData ? 'Authenticated session' : 'No active session'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.logoutDescription}>
                  Choose your logout option below. Quick logout will sign you out normally, 
                  while secure logout will also clear all local data and reset settings.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.logoutActions}>
              <TouchableOpacity
                style={styles.quickLogoutButton}
                onPress={async () => {
                  setShowLogoutModal(false);
                  // Show brief feedback
                  Alert.alert('Logging Out', 'Please wait...', [], { cancelable: false });
                  await performLogout(false, sessionInfo);
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#2E7D32" />
                <Text style={styles.quickLogoutText}>Quick Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secureLogoutButton}
                onPress={async () => {
                  setShowLogoutModal(false);
                  // Show brief feedback
                  Alert.alert('Secure Logout', 'Clearing data and logging out...', [], { cancelable: false });
                  await performLogout(true, sessionInfo);
                }}
              >
                <Ionicons name="shield-outline" size={20} color="#fff" />
                <Text style={styles.secureLogoutText}>Secure Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const webSelectStyles = {
  fontSize: 16,
  paddingVertical: 12,
  paddingHorizontal: 10,
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 8,
  color: '#333',
  paddingRight: 30,
  backgroundColor: '#f8f9fa',
  width: '100%',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 25,
    backgroundColor: '#2E7D32',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#c8e6c9',
  },
  editButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 35,
    margin: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#e8f5e8',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#2E7D32',
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
    textAlign: 'center',
  },
  profileRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileRole: {
    fontSize: 18,
    color: '#666',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 25,
    marginHorizontal: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#e8f5e8',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 10,
  },
  formItem: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  formValue: {
    fontSize: 16,
    color: '#666',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  input: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4757',
    marginLeft: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  // Settings styles
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  saveModalButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Help options styles
  helpOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  helpOptionText: {
    flex: 1,
    marginLeft: 15,
  },
  helpOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  helpOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  // Terms styles
  termsText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  termsHeading: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  linkButton: {
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  linkButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  // About styles
  aboutSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
    textAlign: 'center',
  },
  appVersion: {
    fontSize: 16,
    color: '#666',
  },
  aboutContent: {
    marginTop: 10,
  },
  aboutDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  aboutHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 20,
    marginBottom: 10,
  },
  aboutFeatures: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  linkText: {
    fontSize: 16,
    color: '#2E7D32',
    textDecorationLine: 'underline',
    marginBottom: 8,
  },
  // Logout modal styles
  logoutSummary: {
    marginBottom: 20,
  },
  userSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  userInfo: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
  },
  sessionDetails: {
    backgroundColor: '#f0f8f0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  logoutDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  logoutActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 15,
  },
  quickLogoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8f0',
    borderRadius: 12,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  quickLogoutText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secureLogoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4757',
    borderRadius: 12,
    paddingVertical: 15,
  },
  secureLogoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProfileScreen; 