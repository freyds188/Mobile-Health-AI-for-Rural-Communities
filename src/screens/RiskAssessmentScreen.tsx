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
  Dimensions
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { riskAssessmentService, RiskAssessment, SymptomPattern } from '../services/RiskAssessmentService';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const RiskAssessmentScreen = () => {
  const { user } = useAuth();
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
        </View>
      </View>


      {/* Potential Conditions */}
      {assessment.potentialConditions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Potential Conditions</Text>
          {assessment.potentialConditions.map((condition, index) => (
            <View key={index} style={styles.conditionCard}>
              <View style={styles.conditionHeader}>
                <Text style={styles.conditionName}>{condition.condition}</Text>
                <View style={[
                  styles.urgencyBadge,
                  { backgroundColor: getUrgencyColor(condition.urgency) }
                ]}>
                  <Text style={styles.urgencyText}>{condition.urgency.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.conditionDetails}>
                <View style={styles.riskIndicator}>
                  <View style={styles.riskLabel}>
                    <Text style={styles.riskText}>Risk Level</Text>
                    <Text style={styles.riskValue}>{getRiskLevelText(condition.probability)}</Text>
                  </View>
                  <View style={styles.riskBarContainer}>
                    <View 
                      style={[
                        styles.riskBarFill,
                        { width: `${condition.probability * 100}%` }
                      ]} 
                    />
                  </View>
                </View>
                <Text style={styles.severityText}>
                  Severity: <Text style={styles.severityValue}>{condition.severity}</Text>
                </Text>
              </View>
              {condition.recommendations.length > 0 && (
                <View style={styles.recommendationsContainer}>
                  <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                  {condition.recommendations.map((rec, recIndex) => (
                    <Text key={recIndex} style={styles.recommendationText}>• {rec}</Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Symptom Patterns */}
      {assessment.symptomPatterns.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptom Patterns</Text>
          {assessment.symptomPatterns.slice(0, 5).map((pattern, index) => (
            <View key={index} style={styles.patternCard}>
              <View style={styles.patternHeader}>
                <Text style={styles.patternTitle}>Pattern {index + 1}</Text>
                <View style={[
                  styles.riskBadge,
                  { backgroundColor: getRiskLevelColor(pattern.riskLevel) }
                ]}>
                  <Text style={styles.riskBadgeText}>{pattern.riskLevel.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.patternDetails}>
                <Text style={styles.symptomsText}>
                  Symptoms: <Text style={styles.symptomsList}>{pattern.symptoms.join(', ')}</Text>
                </Text>
                <View style={styles.patternMetrics}>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Severity</Text>
                    <Text style={styles.metricValue}>{pattern.severity}/10</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Frequency</Text>
                    <Text style={styles.metricValue}>{pattern.frequency}x</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Duration</Text>
                    <Text style={styles.metricValue}>{pattern.duration} days</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

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
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  riskLevelCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  riskLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskLevelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  riskLevelContent: {
    alignItems: 'center',
  },
  riskLevelText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  riskLevelDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  conditionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  conditionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  conditionDetails: {
    marginBottom: 12,
  },
  riskIndicator: {
    marginBottom: 8,
  },
  riskLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  riskText: {
    fontSize: 12,
    color: '#666',
  },
  riskValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  riskBarContainer: {
    height: 6,
    backgroundColor: '#E1E5E9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  riskBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  severityText: {
    fontSize: 12,
    color: '#666',
  },
  severityValue: {
    fontWeight: '600',
    color: '#333',
  },
  recommendationsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E1E5E9',
    paddingTop: 12,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  patternCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  patternDetails: {
    marginBottom: 8,
  },
  symptomsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  symptomsList: {
    fontWeight: '600',
    color: '#333',
  },
  patternMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  lifestyleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lifestyleMetric: {
    marginBottom: 16,
  },
  lifestyleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  lifestyleBar: {
    height: 8,
    backgroundColor: '#E1E5E9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  lifestyleBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  lifestyleValue: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  trendsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  recommendationsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationItemText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  nextAssessmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextAssessmentContent: {
    marginLeft: 12,
  },
  nextAssessmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  nextAssessmentDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  disclaimer: {
    backgroundColor: '#FFF3CD',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
});

export default RiskAssessmentScreen;
