import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useHealthData } from '../contexts/HealthDataContext';

const AnalysisScreen = () => {
  const { user } = useAuth();
  const { getHealthData, getInsights, analyzeHealthData } = useHealthData();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latestInsight, setLatestInsight] = useState<any>(null);
  const [healthData, setHealthData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadAnalysisData();
    }
  }, [user]);

  const loadAnalysisData = () => {
    if (!user) return;

    const userData = getHealthData(user.id);
    const userInsights = getInsights(user.id);
    
    setHealthData(userData);
    
    if (userInsights.length > 0) {
      setLatestInsight(userInsights[userInsights.length - 1]);
    }
  };

  const handleRunAnalysis = async () => {
    if (!user) return;

    setIsAnalyzing(true);
    try {
      const insight = await analyzeHealthData(user.id);
      setLatestInsight(insight);
      Alert.alert('Analysis Complete', 'Your health data has been analyzed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze health data');
    } finally {
      setIsAnalyzing(false);
    }
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

  const calculateAverages = () => {
    if (healthData.length === 0) return null;

    const totalSeverity = healthData.reduce((sum, data) => sum + data.severity, 0);
    const totalSleep = healthData.reduce((sum, data) => sum + data.behavior.sleep, 0);
    const totalStress = healthData.reduce((sum, data) => sum + data.behavior.stress, 0);
    const totalExercise = healthData.reduce((sum, data) => sum + data.behavior.exercise, 0);

    return {
      avgSeverity: (totalSeverity / healthData.length).toFixed(1),
      avgSleep: (totalSleep / healthData.length).toFixed(1),
      avgStress: (totalStress / healthData.length).toFixed(1),
      avgExercise: (totalExercise / healthData.length).toFixed(1),
    };
  };

  const averages = calculateAverages();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="analytics" size={24} color="#667eea" />
        <Text style={styles.headerTitle}>Health Analysis</Text>
        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={handleRunAnalysis}
          disabled={isAnalyzing}
        >
          <Text style={styles.analyzeButtonText}>
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isAnalyzing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Running K-means clustering analysis...</Text>
          </View>
        )}

        {/* Latest Analysis Results */}
        {latestInsight && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="bulb" size={24} color="#667eea" />
              <Text style={styles.cardTitle}>Latest Analysis</Text>
            </View>
            
            <View style={styles.riskSection}>
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

            <View style={styles.patternsSection}>
              <Text style={styles.sectionTitle}>Detected Patterns</Text>
              {latestInsight.patterns.map((pattern: string, index: number) => (
                <View key={index} style={styles.patternItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#2ed573" />
                  <Text style={styles.patternText}>{pattern}</Text>
                </View>
              ))}
            </View>

            <View style={styles.recommendationsSection}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              {latestInsight.recommendations.map((rec: string, index: number) => (
                <View key={index} style={styles.recommendationItem}>
                  <Ionicons name="arrow-forward" size={16} color="#667eea" />
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Health Data Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Health Data Summary</Text>
          {averages ? (
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Avg Severity</Text>
                <Text style={styles.summaryValue}>{averages.avgSeverity}/10</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Avg Sleep</Text>
                <Text style={styles.summaryValue}>{averages.avgSleep}h</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Avg Stress</Text>
                <Text style={styles.summaryValue}>{averages.avgStress}/10</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Avg Exercise</Text>
                <Text style={styles.summaryValue}>{averages.avgExercise}m</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>No health data available</Text>
          )}
        </View>

        {/* K-means Clustering Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Analysis Method</Text>
          <Text style={styles.methodDescription}>
            This analysis uses K-means clustering to categorize your health data into risk levels based on:
          </Text>
          <View style={styles.methodPoints}>
            <Text style={styles.methodPoint}>• Symptom severity patterns</Text>
            <Text style={styles.methodPoint}>• Sleep quality trends</Text>
            <Text style={styles.methodPoint}>• Stress level fluctuations</Text>
            <Text style={styles.methodPoint}>• Exercise consistency</Text>
          </View>
          <Text style={styles.methodNote}>
            Note: This analysis is for informational purposes only and should not replace professional medical advice.
          </Text>
        </View>

        {/* Recent Health Data */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Health Entries</Text>
          {healthData.length > 0 ? (
            healthData.slice(-5).reverse().map((data, index) => (
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
                <View style={styles.behaviorSummary}>
                  <Text style={styles.behaviorText}>
                    Sleep: {data.behavior.sleep}h | Stress: {data.behavior.stress}/10 | Exercise: {data.behavior.exercise}m
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No health data available</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  analyzeButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  riskSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  riskDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  riskText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
  },
  patternsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  patternText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  recommendationsSection: {
    marginBottom: 10,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  methodDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  methodPoints: {
    marginBottom: 15,
  },
  methodPoint: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  methodNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  dataItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  dataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  dataDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  severityText: {
    fontSize: 14,
    color: '#666',
  },
  symptomsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  behaviorSummary: {
    marginTop: 5,
  },
  behaviorText: {
    fontSize: 12,
    color: '#999',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default AnalysisScreen; 