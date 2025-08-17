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
import { useAuth } from '../contexts/AuthContext';
import { evaluationService, UserFeedback } from '../services/EvaluationService';

const UserEvaluationScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState({
    usability: 0,
    functionalSuitability: 0,
    reliability: 0,
    comments: '',
    sessionDuration: 0,
    featuresUsed: [] as string[],
    issuesEncountered: [] as string[],
    suggestions: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const features = [
    'Health Data Logging',
    'Risk Assessment',
    'Health History',
    'Chatbot',
    'Dashboard',
    'Profile Management'
  ];

  const issues = [
    'Slow loading times',
    'Difficult to navigate',
    'Unclear instructions',
    'Technical errors',
    'Poor mobile experience',
    'Data not saving',
    'Other'
  ];

  const handleRatingChange = (category: 'usability' | 'functionalSuitability' | 'reliability', rating: number) => {
    setFeedback(prev => ({ ...prev, [category]: rating }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFeedback(prev => ({
      ...prev,
      featuresUsed: prev.featuresUsed.includes(feature)
        ? prev.featuresUsed.filter(f => f !== feature)
        : [...prev.featuresUsed, feature]
    }));
  };

  const handleIssueToggle = (issue: string) => {
    setFeedback(prev => ({
      ...prev,
      issuesEncountered: prev.issuesEncountered.includes(issue)
        ? prev.issuesEncountered.filter(i => i !== issue)
        : [...prev.issuesEncountered, issue]
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    if (feedback.usability === 0 || feedback.functionalSuitability === 0 || feedback.reliability === 0) {
      Alert.alert('Incomplete Evaluation', 'Please provide ratings for all categories');
      return;
    }

    setIsSubmitting(true);
    try {
      await evaluationService.submitUserFeedback({
        userId: user.id,
        ...feedback
      });

      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully. Your input helps us improve the system for rural communities.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingSection = (
    title: string,
    category: 'usability' | 'functionalSuitability' | 'reliability',
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
              name={feedback[category] >= star ? 'star' : 'star-outline'}
              size={32}
              color={feedback[category] >= star ? '#FFD700' : '#CCC'}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.ratingLabel}>
        {feedback[category] === 0 ? 'Select rating' :
         feedback[category] === 1 ? 'Poor' :
         feedback[category] === 2 ? 'Fair' :
         feedback[category] === 3 ? 'Good' :
         feedback[category] === 4 ? 'Very Good' : 'Excellent'}
      </Text>
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
          <Ionicons name="star" size={40} color="#007AFF" />
          <Text style={styles.headerTitle}>System Evaluation</Text>
          <Text style={styles.headerSubtitle}>
            Help us improve healthcare access for rural communities
          </Text>
        </View>

        <View style={styles.content}>
          {/* Rating Sections */}
          {renderRatingSection(
            'Usability',
            'usability',
            'How easy is it to use the system?'
          )}

          {renderRatingSection(
            'Functional Suitability',
            'functionalSuitability',
            'How well does the system meet your healthcare needs?'
          )}

          {renderRatingSection(
            'Reliability',
            'reliability',
            'How reliable and consistent is the system?'
          )}

          {/* Features Used */}
          {renderCheckboxSection(
            'Features Used',
            features,
            feedback.featuresUsed,
            handleFeatureToggle
          )}

          {/* Issues Encountered */}
          {renderCheckboxSection(
            'Issues Encountered',
            issues,
            feedback.issuesEncountered,
            handleIssueToggle
          )}

          {/* Comments */}
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>Additional Comments</Text>
            <TextInput
              style={styles.commentsInput}
              placeholder="Share your experience, suggestions, or concerns..."
              value={feedback.comments}
              onChangeText={(text) => setFeedback(prev => ({ ...prev, comments: text }))}
              multiline
              numberOfLines={4}
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
              {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
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
    minHeight: 120,
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

export default UserEvaluationScreen;
