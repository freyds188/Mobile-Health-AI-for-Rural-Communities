import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// import RNPickerSelect from 'react-native-picker-select';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen = () => {
  const { user, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age?.toString() || '',
    gender: user?.gender || 'male',
    location: user?.location || '',
    medicalHistory: user?.medicalHistory || '',
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
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
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
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="notifications-outline" size={20} color="#667eea" />
            <Text style={styles.actionText}>Notification Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="shield-outline" size={20} color="#667eea" />
            <Text style={styles.actionText}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle-outline" size={20} color="#667eea" />
            <Text style={styles.actionText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text-outline" size={20} color="#667eea" />
            <Text style={styles.actionText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
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
});

export default ProfileScreen; 