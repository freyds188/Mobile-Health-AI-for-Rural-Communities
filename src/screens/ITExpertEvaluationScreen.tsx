import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { evaluationService, ITExpertEvaluation } from '../services/EvaluationService';

const ITExpertEvaluationScreen = ({ navigation }: any) => {
  const [evaluation, setEvaluation] = useState({
    evaluatorId: 'expert_' + Date.now(),
    functionalSuitability: 0,
    performanceEfficiency: 0,
    reliability: 0,
    usability: 0,
    maintainability: 0,
    technicalComments: '',
    performanceMetrics: {
      responseTime: 500,
      accuracy: 85,
      uptime: 99.5,
      errorRate: 0.5,
    },
    recommendations: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const technicalAreas = [
    'Database Performance',
    'API Response Times',
    'Machine Learning Accuracy',
    'Security Implementation',
    'Code Quality',
    'Scalability',
    'Error Handling',
    'Documentation'
  ];

  const recommendations = [
    'Optimize database queries',
    'Implement caching strategies',
    'Improve error handling',
    'Enhance security measures',
    'Add comprehensive logging',
    'Improve code documentation',
    'Implement automated testing',
    'Optimize for mobile performance',
    'Add performance monitoring',
    'Improve user interface'
  ];

  const handleRatingChange = (
    category: 'functionalSuitability' | 'performanceEfficiency' | 'reliability' | 'usability' | 'maintainability',
    rating: number
  ) => {
    setEvaluation(prev => ({ ...prev, [category]: rating }));
  };

  const handleMetricChange = (metric: keyof typeof evaluation.performanceMetrics, value: number) => {
    setEvaluation(prev => ({
      ...prev,
      performanceMetrics: {
        ...prev.performanceMetrics,
        [metric]: value
      }
    }));
  };

  const handleRecommendationToggle = (recommendation: string) => {
    setEvaluation(prev => ({
      ...prev,
      recommendations: prev.recommendations.includes(recommendation)
        ? prev.recommendations.filter(r => r !== recommendation)
        : [...prev.recommendations, recommendation]
    }));
  };

  const handleSubmit = async () => {
    if (evaluation.functionalSuitability === 0 || 
        evaluation.performanceEfficiency === 0 || 
        evaluation.reliability === 0 || 
        evaluation.usability === 0 || 
        evaluation.maintainability === 0) {
      Alert.alert('Incomplete Evaluation', 'Please provide ratings for all categories');
      return;
    }

    setIsSubmitting(true);
    try {
      await evaluationService.submitITExpertEvaluation(evaluation);

      Alert.alert(
        'Evaluation Submitted',
        'Thank you for your technical evaluation. Your expertise helps improve the system for rural healthcare.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit evaluation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingSection = (
    title: string,
    category: 'functionalSuitability' | 'performanceEfficiency' | 'reliability' | 'usability' | 'maintainability',
    description: string
  ) => (
    <View style={styles.ratingSection}>
      <Text style={styles.ratingTitle}>{title}</Text>
      <Text style={styles.ratingDescription}>{description}</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRatingChange(category, star)}
            style={styles.starButton}
          >
            <Ionicons
              name={evaluation[category] >= star ? 'star' : 'star-outline'}
              size={32}
              color={evaluation[category] >= star ? '#FFD700' : '#CCC'}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.ratingLabel}>
        {evaluation[category] === 0 ? 'Select rating' :
         evaluation[category] === 1 ? 'Poor' :
         evaluation[category] === 2 ? 'Fair' :
         evaluation[category] === 3 ? 'Good' :
         evaluation[category] === 4 ? 'Very Good' : 'Excellent'}
      </Text>
    </View>
  );

  const renderMetricSection = () => (
    <View style={styles.metricSection}>
      <Text style={styles.sectionTitle}>Performance Metrics</Text>
      
      <View style={styles.metricItem}>
        <Text style={styles.metricLabel}>Response Time (ms)</Text>
        <TextInput
          style={styles.metricInput}
          value={evaluation.performanceMetrics.responseTime.toString()}
          onChangeText={(text) => handleMetricChange('responseTime', parseInt(text) || 0)}
          keyboardType="numeric"
          placeholder="500"
        />
      </View>

      <View style={styles.metricItem}>
        <Text style={styles.metricLabel}>Accuracy (%)</Text>
        <TextInput
          style={styles.metricInput}
          value={evaluation.performanceMetrics.accuracy.toString()}
          onChangeText={(text) => handleMetricChange('accuracy', parseInt(text) || 0)}
          keyboardType="numeric"
          placeholder="85"
        />
      </View>

      <View style={styles.metricItem}>
        <Text style={styles.metricLabel}>Uptime (%)</Text>
        <TextInput
          style={styles.metricInput}
          value={evaluation.performanceMetrics.uptime.toString()}
          onChangeText={(text) => handleMetricChange('uptime', parseFloat(text) || 0)}
          keyboardType="numeric"
          placeholder="99.5"
        />
      </View>

      <View style={styles.metricItem}>
        <Text style={styles.metricLabel}>Error Rate (%)</Text>
        <TextInput
          style={styles.metricInput}
          value={evaluation.performanceMetrics.errorRate.toString()}
          onChangeText={(text) => handleMetricChange('errorRate', parseFloat(text) || 0)}
          keyboardType="numeric"
          placeholder="0.5"
        />
      </View>
    </View>
  );

  const renderCheckboxSection = (
    title: string,
    items: string[],
    selectedItems: string[],
    onToggle: (item: string) => void
  ) => (
    <View style={styles.checkboxSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.checkboxContainer}>
        {items.map(item => (
          <TouchableOpacity
            key={item}
            style={styles.checkboxItem}
            onPress={() => onToggle(item)}
          >
            <Ionicons
              name={selectedItems.includes(item) ? 'checkbox' : 'square-outline'}
              size={24}
              color={selectedItems.includes(item) ? '#007AFF' : '#666'}
            />
            <Text style={styles.checkboxText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Ionicons name="settings" size={40} color="#007AFF" />
          <Text style={styles.headerTitle}>IT Expert Evaluation</Text>
          <Text style={styles.headerSubtitle}>
            Technical assessment of the healthcare AI system
          </Text>
        </View>

        <View style={styles.content}>
          {/* Rating Sections */}
          {renderRatingSection(
            'Functional Suitability',
            'functionalSuitability',
            'How well does the system meet functional requirements?'
          )}

          {renderRatingSection(
            'Performance Efficiency',
            'performanceEfficiency',
            'How efficient is the system in terms of resource usage?'
          )}

          {renderRatingSection(
            'Reliability',
            'reliability',
            'How reliable and consistent is the system?'
          )}

          {renderRatingSection(
            'Usability',
            'usability',
            'How user-friendly is the system interface?'
          )}

          {renderRatingSection(
            'Maintainability',
            'maintainability',
            'How easy is it to maintain and update the system?'
          )}

          {/* Performance Metrics */}
          {renderMetricSection()}

          {/* Technical Areas */}
          {renderCheckboxSection(
            'Technical Areas Evaluated',
            technicalAreas,
            technicalAreas, // All areas are evaluated by default
            () => {} // No toggle for this section
          )}

          {/* Recommendations */}
          {renderCheckboxSection(
            'Recommendations',
            recommendations,
            evaluation.recommendations,
            handleRecommendationToggle
          )}

          {/* Technical Comments */}
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>Technical Comments</Text>
            <TextInput
              style={styles.commentsInput}
              placeholder="Provide detailed technical feedback, observations, or suggestions..."
              value={evaluation.technicalComments}
              onChangeText={(text) => setEvaluation(prev => ({ ...prev, technicalComments: text }))}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Technical Evaluation'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#E1E5E9',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 16,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    padding: 20,
  },
  ratingSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  ratingDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starButton: {
    padding: 8,
  },
  ratingLabel: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  metricSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  metricInput: {
    borderWidth: 2,
    borderColor: '#E1E5E9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    width: 100,
    textAlign: 'center',
  },
  checkboxSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  checkboxContainer: {
    gap: 12,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  commentsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  commentsInput: {
    borderWidth: 2,
    borderColor: '#E1E5E9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 150,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ITExpertEvaluationScreen;
