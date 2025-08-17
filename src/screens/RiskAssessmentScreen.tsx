import React, { useState } from 'react';
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
import { riskAssessmentService, RiskAssessment } from '../services/RiskAssessmentService';
import { DatabaseInitializationHelper } from '../utils/DatabaseInitializationHelper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Available symptoms for selection
const AVAILABLE_SYMPTOMS = {
  'Respiratory': [
    'Cough', 'Sore throat', 'Runny nose', 'Congestion', 'Fever',
    'Shortness of breath', 'Chest discomfort', 'Wheezing', 'Chest tightness'
  ],
  'Cardiovascular': [
    'Chest pain', 'Dizziness', 'Irregular heartbeat', 'Swelling in legs',
    'Fatigue', 'Shortness of breath'
  ],
  'Neurological': [
    'Headache', 'Severe headache', 'Nausea', 'Sensitivity to light',
    'Sensitivity to sound', 'Dizziness', 'Confusion'
  ],
  'Gastrointestinal': [
    'Stomach pain', 'Nausea', 'Vomiting', 'Loss of appetite', 'Bloating',
    'Abdominal pain', 'Diarrhea', 'Constipation', 'Gas'
  ],
  'Musculoskeletal': [
    'Joint pain', 'Stiffness', 'Swelling', 'Lower back pain',
    'Muscle spasms', 'Pain radiating to legs', 'Reduced range of motion'
  ],
  'Mental Health': [
    'Excessive worry', 'Restlessness', 'Difficulty concentrating',
    'Sleep problems', 'Persistent sadness', 'Loss of interest',
    'Appetite changes', 'Sleep changes'
  ],
  'General': [
    'Fatigue', 'Weight gain', 'Increased thirst', 'Frequent urination',
    'Blurred vision', 'Slow healing', 'Insomnia', 'Excessive daytime sleepiness',
    'Snoring', 'Restless sleep'
  ]
};

const RiskAssessmentScreen = () => {
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const performSymptomAnalysis = async () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert(
        'No Symptoms Selected',
        'Please select at least one symptom to analyze.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!user) {
      console.log('⚠️ RiskAssessmentScreen: No user found');
      return;
    }

    setAnalyzing(true);
    try {
      console.log('🔍 RiskAssessmentScreen: Starting symptom analysis for user:', user.id);
      console.log('🔍 RiskAssessmentScreen: Selected symptoms:', selectedSymptoms);
      
      const result = await riskAssessmentService.performRiskAssessment(user.id, selectedSymptoms);
      console.log('📊 RiskAssessmentScreen: Assessment result:', result);
      setAssessment(result);
      console.log('✅ RiskAssessmentScreen: Symptom analysis completed');
    } catch (error) {
      console.error('❌ RiskAssessmentScreen: Symptom analysis failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      Alert.alert(
        'Analysis Error',
        'Unable to analyze symptoms. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setAnalyzing(false);
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

  const initializeDatabase = async () => {
    try {
      console.log('🔧 RiskAssessmentScreen: Initializing database...');
      const success = await DatabaseInitializationHelper.forceInitializeDatabase(3);
      
      if (success) {
        Alert.alert(
          'Database Initialized',
          'Database has been successfully initialized. You can now try the risk assessment again.',
          [
            {
              text: 'OK',
              onPress: () => {
                setError(null);
                performSymptomAnalysis();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Database Initialization Failed',
          'Unable to initialize the database. Please try refreshing the page or contact support.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ RiskAssessmentScreen: Database initialization failed:', error);
      Alert.alert(
        'Initialization Error',
        'An error occurred while initializing the database.',
        [{ text: 'OK' }]
      );
    }
  };

  if (analyzing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Analyzing your symptoms...</Text>
        <Text style={styles.loadingSubtext}>The AI is processing your selected symptoms</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={64} color="#FF4444" />
        <Text style={styles.errorTitle}>Analysis Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        
        {/* Database initialization button for database-related errors */}
        {error.includes('Database not initialized') && (
          <TouchableOpacity style={styles.initializeDbButton} onPress={initializeDatabase}>
            <Text style={styles.initializeDbButtonText}>🔧 Initialize Database</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          setError(null);
          performSymptomAnalysis();
        }}>
          <Text style={styles.retryButtonText}>Retry Analysis</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (assessment) {
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
  riskLevelCard: {
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 16,
    lineHeight: 30,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  symptomButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E1E5E9',
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
  },
  symptomButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  symptomButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    flex: 1,
  },
  symptomButtonTextSelected: {
    color: 'white',
  },
  checkmark: {
    marginLeft: 8,
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  analyzeButtonSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  newAssessmentButton: {
    backgroundColor: '#28A745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  newAssessmentButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  conditionsSummary: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  conditionsSummaryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1976D2',
    textAlign: 'center',
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
  conditionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  conditionNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 12,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
  conditionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  metricItem: {
    alignItems: 'center',
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
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  noConditionsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  noConditionsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 32,
  },
  noConditionsText: {
    fontSize: 18,
    color: '#444',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 28,
  },
  initializeDbButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  initializeDbButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RiskAssessmentScreen;

