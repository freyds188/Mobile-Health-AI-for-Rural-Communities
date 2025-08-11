import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Vibration
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { riskAssessmentService, RiskAssessment, SymptomPattern } from '../services/RiskAssessmentService';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const RiskAssessmentScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🔄 RiskAssessmentScreen: Component rendered, user:', user?.id);

  useEffect(() => {
    if (user) {
      performRiskAssessment();
    }
  }, [user]);

  const performRiskAssessment = async () => {
    if (!user) {
      console.log('⚠️ RiskAssessmentScreen: No user found');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 RiskAssessmentScreen: Starting risk assessment for user:', user.id);
      const result = await riskAssessmentService.performRiskAssessment(user.id);
      console.log('📊 RiskAssessmentScreen: Assessment result:', result);
      setAssessment(result);
      console.log('✅ RiskAssessmentScreen: Risk assessment completed');
    } catch (error) {
      console.error('❌ RiskAssessmentScreen: Risk assessment failed:', error);
      console.error('❌ RiskAssessmentScreen: Error details:', JSON.stringify(error, null, 2));
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      Alert.alert(
        'Assessment Error',
        'Unable to perform risk assessment. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await performRiskAssessment();
    setRefreshing(false);
  };

  const handleSymptomAnalysis = () => {
    console.log('🎯 Navigating to Symptom Analysis from Risk Assessment');
    Vibration.vibrate(50);
    navigation.navigate('Symptom Analysis' as never);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return '#FF4444';
      case 'high': return '#FF8800';
      case 'medium': return '#FFAA00';
      case 'low': return '#00AA00';
      default: return '#666666';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'warning';
      case 'high': return 'alert-circle';
      case 'medium': return 'information-circle';
      case 'low': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#FF4444';
      case 'medium': return '#FF8800';
      case 'low': return '#00AA00';
      default: return '#666666';
    }
  };

  const getRiskLevelText = (probability: number): string => {
    if (probability >= 0.8) return 'High Risk';
    if (probability >= 0.6) return 'Moderate Risk';
    if (probability >= 0.4) return 'Low Risk';
    return 'Minimal Risk';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Analyzing your health patterns...</Text>
        <Text style={styles.loadingSubtext}>This may take a few moments</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={64} color="#FF4444" />
        <Text style={styles.errorTitle}>Assessment Error</Text>
        <Text style={styles.errorText}>
          {error}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          setError(null);
          performRiskAssessment();
        }}>
          <Text style={styles.retryButtonText}>Retry Assessment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!assessment) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="medical" size={64} color="#666" />
        <Text style={styles.errorTitle}>No Assessment Available</Text>
        <Text style={styles.errorText}>
          Complete your risk assessment to see detailed health insights and potential conditions.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={performRiskAssessment}>
          <Text style={styles.retryButtonText}>Start Assessment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  try {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="analytics" size={32} color="#007AFF" />
            <Text style={styles.headerTitle}>Risk Assessment</Text>
            <Text style={styles.headerSubtitle}>
              {formatDate(assessment.timestamp)}
            </Text>
            
            {/* Symptom Analysis Button */}
            <TouchableOpacity
              style={styles.symptomAnalysisButton}
              onPress={handleSymptomAnalysis}
            >
              <Ionicons name="medical" size={24} color="white" />
              <Text style={styles.symptomAnalysisButtonText}>
                Analyze Current Symptoms
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lifestyle Factors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifestyle Assessment</Text>
          <View style={styles.lifestyleCard}>
            <View style={styles.lifestyleMetric}>
              <Text style={styles.lifestyleLabel}>Sleep Quality</Text>
              <View style={styles.lifestyleBar}>
                <View 
                  style={[
                    styles.lifestyleBarFill,
                    { width: `${(assessment.lifestyleFactors.sleepQuality / 10) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.lifestyleValue}>{assessment.lifestyleFactors.sleepQuality.toFixed(1)}/10</Text>
            </View>
            <View style={styles.lifestyleMetric}>
              <Text style={styles.lifestyleLabel}>Stress Level</Text>
              <View style={styles.lifestyleBar}>
                <View 
                  style={[
                    styles.lifestyleBarFill,
                    { width: `${(assessment.lifestyleFactors.stressLevel / 10) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.lifestyleValue}>{assessment.lifestyleFactors.stressLevel.toFixed(1)}/10</Text>
            </View>
            <View style={styles.lifestyleMetric}>
              <Text style={styles.lifestyleLabel}>Exercise Level</Text>
              <View style={styles.lifestyleBar}>
                <View 
                  style={[
                    styles.lifestyleBarFill,
                    { width: `${(assessment.lifestyleFactors.exerciseLevel / 10) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.lifestyleValue}>{assessment.lifestyleFactors.exerciseLevel.toFixed(1)}/10</Text>
            </View>
            <View style={styles.lifestyleMetric}>
              <Text style={styles.lifestyleLabel}>Diet Quality</Text>
              <View style={styles.lifestyleBar}>
                <View 
                  style={[
                    styles.lifestyleBarFill,
                    { width: `${(assessment.lifestyleFactors.dietQuality / 10) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.lifestyleValue}>{assessment.lifestyleFactors.dietQuality.toFixed(1)}/10</Text>
            </View>
          </View>
        </View>

        {/* Trends */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Trends</Text>
          <View style={styles.trendsCard}>
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Symptom Frequency</Text>
              <Text style={[
                styles.trendValue,
                { color: assessment.trends.symptomFrequency === 'increasing' ? '#FF4444' : 
                         assessment.trends.symptomFrequency === 'decreasing' ? '#00AA00' : '#666666' }
              ]}>
                {assessment.trends.symptomFrequency}
              </Text>
            </View>
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Severity Trend</Text>
              <Text style={[
                styles.trendValue,
                { color: assessment.trends.severityTrend === 'increasing' ? '#FF4444' : 
                         assessment.trends.severityTrend === 'decreasing' ? '#00AA00' : '#666666' }
              ]}>
                {assessment.trends.severityTrend}
              </Text>
            </View>
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Risk Progression</Text>
              <Text style={[
                styles.trendValue,
                { color: assessment.trends.riskProgression === 'worsening' ? '#FF4444' : 
                         assessment.trends.riskProgression === 'improving' ? '#00AA00' : '#666666' }
              ]}>
                {assessment.trends.riskProgression}
              </Text>
            </View>
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.recommendationsCard}>
            {assessment.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="checkmark-circle" size={20} color="#00AA00" />
                <Text style={styles.recommendationItemText}>{recommendation}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Next Assessment */}
        <View style={styles.section}>
          <View style={styles.nextAssessmentCard}>
            <Ionicons name="calendar" size={24} color="#007AFF" />
            <View style={styles.nextAssessmentContent}>
              <Text style={styles.nextAssessmentTitle}>Next Assessment</Text>
              <Text style={styles.nextAssessmentDate}>
                {formatDate(assessment.nextAssessmentDate)}
              </Text>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ This assessment is for informational purposes only and should not replace professional medical advice. 
            Always consult with a healthcare provider for proper diagnosis and treatment.
            {'\n\n'}This tool analyzes patterns in your health data to provide general insights and recommendations. 
            It is not a diagnostic tool and cannot predict or diagnose medical conditions.
          </Text>
        </View>
      </ScrollView>
    );
  } catch (renderError) {
    console.error('❌ RiskAssessmentScreen: Render error:', renderError);
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="bug" size={64} color="#FF4444" />
        <Text style={styles.errorTitle}>Rendering Error</Text>
        <Text style={styles.errorText}>
          An error occurred while displaying the assessment. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          setError(null);
          setAssessment(null);
          performRiskAssessment();
        }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 24,
    textAlign: 'center',
    lineHeight: 32,
  },
  loadingSubtext: {
    fontSize: 18,
    color: '#444',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 26,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    padding: 32,
  },
  errorTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 24,
    textAlign: 'center',
    lineHeight: 38,
  },
  errorText: {
    fontSize: 18,
    color: '#444',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 28,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 14,
    marginTop: 32,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  header: {
    backgroundColor: 'white',
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 3,
    borderBottomColor: '#E1E5E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 16,
    lineHeight: 40,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#555',
    marginTop: 8,
    lineHeight: 26,
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
  riskLevelCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  riskLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  riskLevelTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 16,
    lineHeight: 34,
  },
  riskLevelContent: {
    alignItems: 'center',
  },
  riskLevelText: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 16,
    lineHeight: 48,
  },
  riskLevelDescription: {
    fontSize: 18,
    color: '#444',
    textAlign: 'center',
    lineHeight: 28,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 20,
    lineHeight: 36,
  },
  conditionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  conditionName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    lineHeight: 30,
  },
  urgencyBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 18,
  },
  conditionDetails: {
    marginBottom: 20,
  },
  riskIndicator: {
    marginBottom: 16,
  },
  riskLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  riskText: {
    fontSize: 16,
    color: '#444',
    fontWeight: '600',
  },
  riskValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  riskBarContainer: {
    height: 10,
    backgroundColor: '#E1E5E9',
    borderRadius: 5,
    overflow: 'hidden',
  },
  riskBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  severityText: {
    fontSize: 16,
    color: '#444',
    fontWeight: '600',
  },
  severityValue: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  recommendationsContainer: {
    borderTopWidth: 3,
    borderTopColor: '#E1E5E9',
    paddingTop: 20,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    lineHeight: 26,
  },
  recommendationText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 26,
    marginBottom: 8,
  },
  patternCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  patternTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 30,
  },
  riskBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  riskBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 18,
  },
  patternDetails: {
    marginBottom: 16,
  },
  symptomsText: {
    fontSize: 18,
    color: '#444',
    marginBottom: 20,
    lineHeight: 28,
  },
  symptomsList: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  patternMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 28,
  },
  lifestyleCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  lifestyleMetric: {
    marginBottom: 24,
  },
  lifestyleLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 26,
  },
  lifestyleBar: {
    height: 12,
    backgroundColor: '#E1E5E9',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  lifestyleBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  lifestyleValue: {
    fontSize: 16,
    color: '#444',
    textAlign: 'right',
    fontWeight: '600',
  },
  trendsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  trendLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 26,
  },
  trendValue: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
    lineHeight: 26,
  },
  recommendationsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  recommendationItemText: {
    fontSize: 18,
    color: '#1A1A1A',
    lineHeight: 28,
    marginLeft: 16,
    flex: 1,
    fontWeight: '500',
  },
  nextAssessmentCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextAssessmentContent: {
    marginLeft: 20,
  },
  nextAssessmentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 28,
  },
  nextAssessmentDate: {
    fontSize: 18,
    color: '#444',
    marginTop: 6,
    lineHeight: 26,
  },
  disclaimer: {
    backgroundColor: '#FFF3CD',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 8,
    borderLeftColor: '#FFC107',
  },
  disclaimerText: {
    fontSize: 16,
    color: '#856404',
    lineHeight: 26,
    fontWeight: '500',
  },
});

export default RiskAssessmentScreen;

