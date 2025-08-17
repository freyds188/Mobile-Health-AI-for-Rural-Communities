import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useHealthData } from '../contexts/HealthDataContext';
import { dataService, AnalyticsData } from '../services/DataService';

const { width: screenWidth } = Dimensions.get('window');

interface DashboardStats {
  totalRecords: number;
  avgSeverity: number;
  currentRiskLevel: 'low' | 'medium' | 'high';
  lastAnalysis?: Date;
  weeklyTrend: 'improving' | 'stable' | 'worsening';
}

interface ChartDataPoint {
  value: number;
  label?: string;
  date?: string;
  color?: string;
}

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { healthData, insights, isLoading: healthLoading, refreshData } = useHealthData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalRecords: 0,
    avgSeverity: 0,
    currentRiskLevel: 'low',
    weeklyTrend: 'stable'
  });
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, healthData, insights]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      console.log('📊 Dashboard: Loading data for user:', user.id);
      console.log('📊 Dashboard: Total health data in context:', healthData.length);
      console.log('🧠 Dashboard: Total insights in context:', insights.length);
      
      // Calculate dashboard stats
      const userHealthData = healthData.filter(data => data.userId === user.id);
      const userInsights = insights.filter(insight => insight.userId === user.id);
      
      console.log('📊 Dashboard: User health data count:', userHealthData.length);
      console.log('🧠 Dashboard: User insights count:', userInsights.length);
      
      const totalRecords = userHealthData.length;
      const avgSeverity = totalRecords > 0 
        ? userHealthData.reduce((sum, data) => sum + data.severity, 0) / totalRecords 
        : 0;
      
      const latestInsight = userInsights.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      const currentRiskLevel = latestInsight?.riskLevel || 'low';
      const lastAnalysis = latestInsight?.timestamp;
      
      // Calculate weekly trend
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentData = userHealthData.filter(data => data.timestamp > oneWeekAgo);
      const olderData = userHealthData.filter(data => data.timestamp <= oneWeekAgo);
      
      let weeklyTrend: 'improving' | 'stable' | 'worsening' = 'stable';
      if (recentData.length > 0 && olderData.length > 0) {
        const recentAvg = recentData.reduce((sum, data) => sum + data.severity, 0) / recentData.length;
        const olderAvg = olderData.reduce((sum, data) => sum + data.severity, 0) / olderData.length;
        const diff = recentAvg - olderAvg;
        
        if (diff > 0.5) weeklyTrend = 'worsening';
        else if (diff < -0.5) weeklyTrend = 'improving';
      }

      setDashboardStats({
        totalRecords,
        avgSeverity,
        currentRiskLevel,
        lastAnalysis,
        weeklyTrend
      });

      // Load system analytics (for admin users or overall insights)
      if (user.role === 'admin' || user.role === 'provider') {
        const systemAnalytics = await dataService.getAnalytics();
        setAnalytics(systemAnalytics);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      await loadDashboardData();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      Alert.alert('Error', 'Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const generateSeverityChartData = () => {
    if (!user) return { labels: [], datasets: [{ data: [] }] };
    
    const userHealthData = healthData
      .filter(data => data.userId === user.id)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-7); // Last 7 entries

    const labels = userHealthData.map((_, index) => `Day ${index + 1}`);
    const data = userHealthData.map(data => data.severity);

    return {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
        strokeWidth: 2
      }]
    };
  };

  const generateSleepChartData = () => {
    if (!user) return { labels: [], datasets: [{ data: [] }] };
    
    const userHealthData = healthData
      .filter(data => data.userId === user.id)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-7); // Last 7 days

    const labels = userHealthData.map(data => 
      data.timestamp.toLocaleDateString('en', { weekday: 'short' })
    );
    const data = userHealthData.map(data => data.behavior.sleep);

    return {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`
      }]
    };
  };

  const generateSymptomDistribution = () => {
    if (!user) return [];
    
    const userHealthData = healthData.filter(data => data.userId === user.id);
    const symptomCounts: { [key: string]: number } = {};
    
    userHealthData.forEach(data => {
      data.symptoms.forEach(symptom => {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      });
    });

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    
    return Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([symptom, count], index) => ({
        name: symptom,
        population: count,
        color: colors[index % colors.length],
        legendFontColor: '#333',
        legendFontSize: 12
      }));
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFD93D';
      case 'low': return '#6BCF7F';
      default: return '#B0B0B0';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return 'trending-up';
      case 'worsening': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return '#6BCF7F';
      case 'worsening': return '#FF6B6B';
      default: return '#B0B0B0';
    }
  };

  // Quick Actions Navigation Functions
  const handleLogSymptoms = () => {
    console.log('🎯 Navigating to Log Health screen from Quick Actions');
    
    // Add haptic feedback for better user experience
    Vibration.vibrate(50);
    
    try {
      console.log('🎯 Navigating to Log Health tab...');
      // Navigate to the Log Health tab which contains the HealthStackNavigator
      navigation.navigate('Log Health' as never);
      
      console.log('✅ Successfully initiated navigation to Log Health screen');
    } catch (error) {
      console.error('❌ Navigation to Log Health failed:', error);
      Alert.alert(
        'Navigation Error', 
        'Could not open health logging screen. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleViewHistory = () => {
    console.log('🎯 Navigating to Health History screen from Quick Actions');
    
    // Add haptic feedback for better user experience
    Vibration.vibrate(50);
    
    try {
      console.log('🎯 Step 1: Navigating to Health tab...');
      navigation.navigate('Health' as never);
      
      setTimeout(() => {
        console.log('🎯 Step 2: Navigating to Health History screen...');
        navigation.navigate('Health History' as never);
      }, 100);
      
      console.log('✅ Successfully initiated navigation to Health History screen');
    } catch (error) {
      console.error('❌ Navigation to Health History failed:', error);
      Alert.alert(
        'Navigation Error', 
        'Could not open health history screen. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAskAI = () => {
    console.log('🎯 Navigating to Ask AI screen from Quick Actions');
    
    // Add haptic feedback for better user experience
    Vibration.vibrate(50);
    
    try {
      navigation.navigate('Ask AI' as never);
      console.log('✅ Successfully navigated to Ask AI screen');
    } catch (error) {
      console.error('❌ Navigation to Ask AI failed:', error);
      Alert.alert(
        'Navigation Error', 
        'Could not open AI assistant. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleViewReports = () => {
    console.log('🎯 Navigating to Reports screen from Quick Actions');
    
    // Add haptic feedback for better user experience
    Vibration.vibrate(50);
    
    try {
      navigation.navigate('Reports' as never);
      console.log('✅ Successfully navigated to Reports screen');
    } catch (error) {
      console.error('❌ Navigation to Reports failed:', error);
      Alert.alert(
        'Navigation Error', 
        'Could not open reports screen. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRiskAssessment = () => {
    console.log('🎯 Navigating to Risk Assessment screen from Quick Actions');
    
    // Add haptic feedback for better user experience
    Vibration.vibrate(50);
    
    try {
      navigation.navigate('Risk Assessment' as never);
      console.log('✅ Successfully navigated to Risk Assessment screen');
    } catch (error) {
      console.error('❌ Navigation to Risk Assessment failed:', error);
      Alert.alert(
        'Navigation Error', 
        'Could not open risk assessment screen. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleEmergencyHelp = () => {
    console.log('🆘 Emergency Help button pressed');
    
    // Add haptic feedback for emergency action
    Vibration.vibrate([100, 50, 100]);
    
    Alert.alert(
      '🆘 Emergency Health Assistance',
      'For medical emergencies, please call your local emergency number immediately.\n\n' +
      '• Emergency: Call 911 (US) or your local emergency number\n' +
      '• Poison Control: Call 1-800-222-1222 (US)\n' +
      '• Crisis Text Line: Text HOME to 741741\n\n' +
      'This app is for health tracking and should not replace professional medical care.',
      [
        { text: 'Call Emergency', onPress: () => console.log('Emergency call requested') },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  const handleSymptomAnalysis = () => {
    console.log('🎯 Navigating to Symptom Analysis screen from Quick Actions');
    
    // Add haptic feedback for better user experience
    Vibration.vibrate(50);
    
    try {
      navigation.navigate('Symptom Analysis' as never);
      console.log('✅ Successfully navigated to Symptom Analysis screen');
    } catch (error) {
      console.error('❌ Navigation to Symptom Analysis failed:', error);
      Alert.alert(
        'Navigation Error', 
        'Could not open symptom analysis. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Please log in to view your dashboard</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Simple Header */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>🏠 Welcome,</Text>
            <Text style={styles.nameText}>{user.name}</Text>
            <Text style={styles.subtitleText}>Your Health Dashboard</Text>
          </View>
        </View>

        {/* Health Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="heart" size={36} color={getRiskLevelColor(dashboardStats.currentRiskLevel)} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Your Health Status</Text>
              <Text style={[styles.statusLevel, { color: getRiskLevelColor(dashboardStats.currentRiskLevel) }]}>
                {dashboardStats.currentRiskLevel.toUpperCase()} RISK
              </Text>
            </View>
          </View>
          <View style={styles.statusStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{dashboardStats.totalRecords}</Text>
              <Text style={styles.statText}>Health Records</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{dashboardStats.avgSeverity.toFixed(1)}/10</Text>
              <Text style={styles.statText}>Average Severity</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtonsGrid}>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleLogSymptoms}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="add-circle" size={32} color="#2E7D32" />
                </View>
                <Text style={styles.actionText}>Log Symptoms</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleRiskAssessment}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="analytics" size={32} color="#2E7D32" />
                </View>
                <Text style={styles.actionText}>Risk Assessment</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('Chatbot' as never)}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="chatbubble" size={32} color="#2E7D32" />
                </View>
                <Text style={styles.actionText}>Chatbot</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.emergencyButton]}
                onPress={handleEmergencyHelp}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="medical" size={32} color="#E53E3E" />
                </View>
                <Text style={[styles.actionText, styles.emergencyText]}>Emergency Help</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Simple Health Overview */}
        {dashboardStats.totalRecords > 0 && (
          <View style={styles.simpleOverview}>
            <Text style={styles.sectionTitle}>Your Health at a Glance</Text>
            
            <View style={styles.overviewRow}>
              <View style={styles.overviewItem}>
                <Ionicons name="bed" size={28} color="#4A90E2" />
                <Text style={styles.overviewLabel}>Sleep</Text>
                <Text style={styles.overviewValue}>
                  {healthData.length > 0 ? 
                    `${(healthData.slice(-3).reduce((sum, data) => sum + data.behavior.sleep, 0) / Math.min(3, healthData.length)).toFixed(1)}h` 
                    : 'No data'}
                </Text>
              </View>
              
              <View style={styles.overviewItem}>
                <Ionicons name="heart" size={28} color="#E74C3C" />
                <Text style={styles.overviewLabel}>Stress</Text>
                <Text style={styles.overviewValue}>
                  {healthData.length > 0 ? 
                    `${(healthData.slice(-3).reduce((sum, data) => sum + data.behavior.stress, 0) / Math.min(3, healthData.length)).toFixed(1)}/10`
                    : 'No data'}
                </Text>
              </View>
              
              <View style={styles.overviewItem}>
                <Ionicons name="walk" size={28} color="#27AE60" />
                <Text style={styles.overviewLabel}>Exercise</Text>
                <Text style={styles.overviewValue}>
                  {healthData.length > 0 ? 
                    `${(healthData.slice(-3).reduce((sum, data) => sum + data.behavior.exercise, 0) / Math.min(3, healthData.length)).toFixed(0)}min`
                    : 'No data'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Today's Health Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb" size={28} color="#FFB000" />
            <Text style={styles.tipTitle}>Today's Health Tip</Text>
          </View>
          <Text style={styles.tipText}>
            {insights.length > 0 && insights[insights.length - 1]?.recommendations[0] 
              ? insights[insights.length - 1].recommendations[0]
              : "Drink plenty of water throughout the day to stay hydrated and maintain good health."}
          </Text>
        </View>

        {/* Recent Activity */}
        {insights.length > 0 && (
          <View style={styles.activityCard}>
            <Text style={styles.sectionTitle}>Recent Health Activity</Text>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Last Health Check</Text>
                <Text style={styles.activityDate}>
                  {insights[insights.length - 1]?.timestamp.toLocaleDateString() || 'No recent activity'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* System Analytics (for admin/provider users) */}
        {analytics && user.role !== 'patient' && (
          <View style={styles.analyticsCard}>
            <Text style={styles.sectionTitle}>System Analytics</Text>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>{analytics.totalUsers}</Text>
                <Text style={styles.analyticsLabel}>Total Users</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>{analytics.totalHealthRecords}</Text>
                <Text style={styles.analyticsLabel}>Health Records</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>{analytics.userEngagement.dailyActiveUsers}</Text>
                <Text style={styles.analyticsLabel}>Daily Active</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>{analytics.riskDistribution.high}%</Text>
                <Text style={styles.analyticsLabel}>High Risk</Text>
              </View>
            </View>
          </View>
        )}

        {/* Empty State */}
        {dashboardStats.totalRecords === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={64} color="#B0B0B0" />
            <Text style={styles.emptyStateTitle}>No Health Data Yet</Text>
            <Text style={styles.emptyStateText}>
              Start tracking your health by adding your first health record or chatting with our AI assistant.
            </Text>
            <TouchableOpacity style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Add Health Data</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8f0',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    padding: 25,
    backgroundColor: '#2E7D32',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  welcomeSection: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 5,
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitleText: {
    fontSize: 16,
    color: '#c8e6c9',
  },
  statsContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 20,
    marginTop: 0,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chartAxisText: {
    fontSize: 10,
    color: '#666',
  },
  pieChartContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  insightsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 20,
    marginTop: 0,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  insightItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#667eea',
    paddingLeft: 12,
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  insightDate: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  confidenceText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  analyticsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 20,
    marginTop: 0,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
  // New Rural-Friendly Styles
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    margin: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e8f5e8',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusInfo: {
    marginLeft: 15,
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  statusLevel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  statText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  quickActions: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
    textAlign: 'center',
  },
  actionButtonsGrid: {
    gap: 15,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#e8f5e8',
    // Add subtle scale effect when pressed
    transform: [{ scale: 1 }],
  },
  actionIconContainer: {
    marginBottom: 10,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
  },
  emergencyButton: {
    borderColor: '#ffebee',
    backgroundColor: '#fff5f5',
  },
  emergencyText: {
    color: '#E53E3E',
    fontWeight: 'bold',
  },
  tipCard: {
    backgroundColor: '#fff9e6',
    borderRadius: 20,
    margin: 20,
    marginTop: 0,
    padding: 25,
    borderWidth: 2,
    borderColor: '#ffe082',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tipTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff8f00',
    marginLeft: 10,
  },
  tipText: {
    fontSize: 18,
    color: '#e65100',
    lineHeight: 26,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    margin: 20,
    marginTop: 0,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e8f5e8',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  activityDate: {
    fontSize: 16,
    color: '#666',
  },
  simpleOverview: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    margin: 20,
    marginTop: 0,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e8f5e8',
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewItem: {
    alignItems: 'center',
    flex: 1,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    marginHorizontal: 5,
  },
  overviewLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    marginBottom: 5,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  symptomAnalysisButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  symptomAnalysisButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
});

export default DashboardScreen;