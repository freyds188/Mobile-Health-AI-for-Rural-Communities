import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useHealthData } from '../contexts/HealthDataContext';
import { fontFamily } from '../utils/fonts';

const DashboardScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const { getHealthData, getInsights, analyzeHealthData } = useHealthData();
  const [recentData, setRecentData] = useState<any[]>([]);
  const [latestInsight, setLatestInsight] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    const userData = getHealthData(user.id);
    const userInsights = getInsights(user.id);
    
    setRecentData(userData.slice(-3).reverse());
    
    if (userInsights.length > 0) {
      setLatestInsight(userInsights[userInsights.length - 1]);
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
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return '#ff4757';
      case 'medium':
        return '#ffa502';
      case 'low':
        return '#2ed573';
      default:
        return '#747d8c';
    }
  };

  const getRiskLevelText = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'High Risk';
      case 'medium':
        return 'Medium Risk';
      case 'low':
        return 'Low Risk';
      default:
        return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name || 'User'}!</Text>
          <Text style={styles.subtitle}>Welcome to your health dashboard</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Health Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="heart" size={24} color="#667eea" />
            <Text style={styles.cardTitle}>Health Status</Text>
          </View>
          {latestInsight ? (
            <View style={styles.healthStatus}>
              <View style={styles.riskIndicator}>
                <View
                  style={[
                    styles.riskDot,
                    { backgroundColor: getRiskLevelColor(latestInsight.riskLevel) },
                  ]}
                />
                <Text style={styles.riskText}>
                  {getRiskLevelText(latestInsight.riskLevel)}
                </Text>
              </View>
              <Text style={styles.confidenceText}>
                Confidence: {Math.round(latestInsight.confidence * 100)}%
              </Text>
            </View>
          ) : (
            <Text style={styles.noDataText}>No health analysis available</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Chatbot')}
            >
              <Ionicons name="chatbubbles" size={24} color="#667eea" />
              <Text style={styles.actionText}>Chat with AI</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Health Data')}
            >
              <Ionicons name="fitness" size={24} color="#667eea" />
              <Text style={styles.actionText}>Log Health Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Analysis')}
            >
              <Ionicons name="analytics" size={24} color="#667eea" />
              <Text style={styles.actionText}>View Analysis</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person" size={24} color="#667eea" />
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Health Data */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Health Data</Text>
          {recentData.length > 0 ? (
            recentData.map((data, index) => (
              <View key={index} style={styles.dataItem}>
                <View style={styles.dataHeader}>
                  <Text style={styles.dataDate}>
                    {new Date(data.timestamp).toLocaleDateString()}
                  </Text>
                  <Text style={styles.severityText}>
                    Severity: {data.severity}/10
                  </Text>
                </View>
                <Text style={styles.symptomsText}>
                  Symptoms: {data.symptoms.join(', ')}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No recent health data</Text>
          )}
        </View>

        {/* User Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Information</Text>
          <View style={styles.userInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{user?.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role:</Text>
              <Text style={styles.infoValue}>{user?.role}</Text>
            </View>
            {user?.age && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Age:</Text>
                <Text style={styles.infoValue}>{user.age}</Text>
              </View>
            )}
            {user?.location && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>{user.location}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#2E7D32',
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: fontFamily.heading,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 2,
    opacity: 0.9,
    fontFamily: fontFamily.body,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 1,
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
    marginLeft: 12,
    fontFamily: fontFamily.headingMedium,
  },
  healthStatus: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  riskDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  riskText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: fontFamily.headingMedium,
  },
  confidenceText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    fontFamily: fontFamily.bodyMedium,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#f0f8f0',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e8f5e8',
  },
  actionText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
    fontFamily: fontFamily.button,
  },
  dataItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dataDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: fontFamily.bodySemiBold,
  },
  severityText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    fontFamily: fontFamily.bodyMedium,
  },
  symptomsText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    fontFamily: fontFamily.body,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
    fontFamily: fontFamily.body,
  },
  userInfo: {
    marginTop: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    fontFamily: fontFamily.bodyMedium,
  },
});

export default DashboardScreen; 