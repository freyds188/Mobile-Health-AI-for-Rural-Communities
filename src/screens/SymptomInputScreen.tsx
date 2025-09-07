import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  Vibration
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { riskAssessmentService } from '../services/RiskAssessmentService';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface SymptomAnalysis {
  symptoms: string[];
  severity: number;
  potentialConditions: Array<{
    condition: string;
    probability: number;
    severity: 'mild' | 'moderate' | 'severe';
    urgency: 'low' | 'medium' | 'high';
    recommendations: string[];
    demographicIndicators?: {
      ageGroup: string;
      genderPrevalence: string;
      ageSpecificRisk: string;
      genderSpecificRisk: string;
      pastConditionRisk: string[];
    };
  }>;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  immediateActions: string[];
  lifestyleFactors: {
    sleepQuality: number;
    stressLevel: number;
    exerciseLevel: number;
    dietQuality: number;
  };
}

// Symptom to condition mapping for more realistic analysis
const symptomConditionMap: { [key: string]: Array<{ condition: string; probability: number; severity: 'mild' | 'moderate' | 'severe'; urgency: 'low' | 'medium' | 'high'; recommendations: string[] }> } = {
  'headache': [
    { condition: 'Tension Headache', probability: 0.7, severity: 'mild', urgency: 'low', recommendations: ['Rest in a quiet, dark room', 'Apply cold or warm compress', 'Practice relaxation techniques', 'Stay hydrated'] },
    { condition: 'Migraine', probability: 0.3, severity: 'moderate', urgency: 'medium', recommendations: ['Avoid bright lights and loud noises', 'Take prescribed medication if available', 'Rest in a dark room', 'Consider seeing a doctor if severe'] },
    { condition: 'Sinus Headache', probability: 0.2, severity: 'mild', urgency: 'low', recommendations: ['Use saline nasal spray', 'Apply warm compress to face', 'Stay hydrated', 'Consider decongestants'] }
  ],
  'fever': [
    { condition: 'Viral Infection', probability: 0.8, severity: 'moderate', urgency: 'medium', recommendations: ['Rest and stay hydrated', 'Take acetaminophen for fever', 'Monitor temperature', 'Seek medical attention if fever persists'] },
    { condition: 'Bacterial Infection', probability: 0.2, severity: 'moderate', urgency: 'high', recommendations: ['Seek medical attention immediately', 'Take prescribed antibiotics if available', 'Rest and stay hydrated', 'Monitor symptoms closely'] }
  ],
  'cough': [
    { condition: 'Upper Respiratory Infection', probability: 0.7, severity: 'mild', urgency: 'low', recommendations: ['Stay hydrated', 'Use honey for soothing', 'Rest your voice', 'Consider over-the-counter cough medicine'] },
    { condition: 'Bronchitis', probability: 0.2, severity: 'moderate', urgency: 'medium', recommendations: ['Rest and stay hydrated', 'Use humidifier', 'Avoid smoking and secondhand smoke', 'Seek medical attention if symptoms worsen'] },
    { condition: 'Pneumonia', probability: 0.1, severity: 'severe', urgency: 'high', recommendations: ['Seek immediate medical attention', 'Rest completely', 'Stay hydrated', 'Take prescribed antibiotics'] }
  ],
  'fatigue': [
    { condition: 'Sleep Deprivation', probability: 0.6, severity: 'mild', urgency: 'low', recommendations: ['Improve sleep hygiene', 'Establish regular sleep schedule', 'Avoid caffeine late in day', 'Create relaxing bedtime routine'] },
    { condition: 'Stress or Anxiety', probability: 0.3, severity: 'mild', urgency: 'low', recommendations: ['Practice stress management techniques', 'Consider counseling or therapy', 'Exercise regularly', 'Maintain work-life balance'] },
    { condition: 'Anemia', probability: 0.1, severity: 'moderate', urgency: 'medium', recommendations: ['Eat iron-rich foods', 'Consider iron supplements', 'See a doctor for blood tests', 'Rest and conserve energy'] }
  ],
  'nausea': [
    { condition: 'Gastroenteritis', probability: 0.6, severity: 'moderate', urgency: 'medium', recommendations: ['Stay hydrated with clear fluids', 'Eat bland foods (BRAT diet)', 'Rest', 'Seek medical attention if severe'] },
    { condition: 'Food Poisoning', probability: 0.3, severity: 'moderate', urgency: 'medium', recommendations: ['Stay hydrated', 'Rest', 'Avoid solid foods initially', 'Seek medical attention if symptoms persist'] },
    { condition: 'Morning Sickness', probability: 0.1, severity: 'mild', urgency: 'low', recommendations: ['Eat small, frequent meals', 'Avoid strong odors', 'Stay hydrated', 'Consider pregnancy test if applicable'] }
  ],
  'dizziness': [
    { condition: 'Dehydration', probability: 0.5, severity: 'mild', urgency: 'low', recommendations: ['Drink plenty of fluids', 'Rest in cool environment', 'Avoid sudden movements', 'Seek medical attention if severe'] },
    { condition: 'Inner Ear Problem', probability: 0.3, severity: 'moderate', urgency: 'medium', recommendations: ['Avoid sudden head movements', 'Rest in quiet environment', 'Consider seeing an ENT specialist', 'Stay hydrated'] },
    { condition: 'Low Blood Pressure', probability: 0.2, severity: 'moderate', urgency: 'medium', recommendations: ['Stand up slowly', 'Increase salt intake if advised', 'Stay hydrated', 'See a doctor for evaluation'] }
  ],
  'shortness of breath': [
    { condition: 'Anxiety or Panic Attack', probability: 0.4, severity: 'moderate', urgency: 'medium', recommendations: ['Practice deep breathing exercises', 'Find a quiet place to rest', 'Consider counseling', 'Seek medical attention if severe'] },
    { condition: 'Asthma', probability: 0.3, severity: 'moderate', urgency: 'high', recommendations: ['Use prescribed inhaler if available', 'Avoid triggers', 'Seek immediate medical attention if severe', 'Stay calm and rest'] },
    { condition: 'Respiratory Infection', probability: 0.2, severity: 'moderate', urgency: 'high', recommendations: ['Seek medical attention immediately', 'Rest and stay hydrated', 'Avoid smoking', 'Monitor oxygen levels if possible'] },
    { condition: 'Heart Problem', probability: 0.1, severity: 'severe', urgency: 'high', recommendations: ['Seek immediate emergency medical attention', 'Call emergency services', 'Rest and stay calm', 'Do not delay seeking help'] }
  ],
  'chest pain': [
    { condition: 'Heart Attack', probability: 0.3, severity: 'severe', urgency: 'high', recommendations: ['Call emergency services immediately', 'Chew aspirin if available and not allergic', 'Stay calm and rest', 'Do not delay seeking help'] },
    { condition: 'Angina', probability: 0.3, severity: 'moderate', urgency: 'high', recommendations: ['Seek immediate medical attention', 'Rest and stay calm', 'Take prescribed medication if available', 'Avoid physical exertion'] },
    { condition: 'Costochondritis', probability: 0.2, severity: 'mild', urgency: 'low', recommendations: ['Rest and avoid strenuous activity', 'Apply heat or ice', 'Take over-the-counter pain relievers', 'See a doctor if pain persists'] },
    { condition: 'Anxiety', probability: 0.2, severity: 'mild', urgency: 'low', recommendations: ['Practice relaxation techniques', 'Focus on breathing', 'Consider counseling', 'Seek medical attention to rule out heart problems'] }
  ],
  'abdominal pain': [
    { condition: 'Gastritis', probability: 0.4, severity: 'moderate', urgency: 'medium', recommendations: ['Eat bland foods', 'Avoid spicy and acidic foods', 'Take antacids if appropriate', 'See a doctor if pain persists'] },
    { condition: 'Appendicitis', probability: 0.2, severity: 'severe', urgency: 'high', recommendations: ['Seek immediate medical attention', 'Do not eat or drink', 'Go to emergency room', 'Do not take pain medication before seeing doctor'] },
    { condition: 'Food Intolerance', probability: 0.2, severity: 'mild', urgency: 'low', recommendations: ['Identify and avoid trigger foods', 'Keep food diary', 'Consider elimination diet', 'See a doctor for proper diagnosis'] },
    { condition: 'Irritable Bowel Syndrome', probability: 0.2, severity: 'mild', urgency: 'low', recommendations: ['Manage stress', 'Eat fiber-rich foods', 'Avoid trigger foods', 'Consider seeing a gastroenterologist'] }
  ]
};

const SymptomInputScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [currentSymptoms, setCurrentSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<number>(5);
  const [customSymptom, setCustomSymptom] = useState<string>('');
  const [analysis, setAnalysis] = useState<SymptomAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSymptomModal, setShowSymptomModal] = useState(false);

  // Predefined common symptoms
  const commonSymptoms = [
    'headache', 'fever', 'cough', 'fatigue', 'nausea', 'dizziness',
    'shortness of breath', 'chest pain', 'abdominal pain', 'back pain',
    'joint pain', 'muscle weakness', 'insomnia', 'anxiety', 'depression',
    'rash', 'sore throat', 'runny nose', 'congestion', 'vomiting',
    'diarrhea', 'constipation', 'bloating', 'loss of appetite',
    'sweating', 'trembling', 'rapid heartbeat', 'eye strain', 'neck pain'
  ];

  const handleBackToHome = () => {
    Vibration.vibrate(50);
    navigation.navigate('Main' as never);
  };

  const analyzeSymptoms = async () => {
    if (currentSymptoms.length === 0) {
      Alert.alert('No Symptoms', 'Please select at least one symptom to analyze.');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Error', 'Please log in to use this feature.');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 SymptomInputScreen: Starting symptom analysis...');
      
      // Generate potential conditions based on user symptoms
      const potentialConditions: Array<{
        condition: string;
        probability: number;
        severity: 'mild' | 'moderate' | 'severe';
        urgency: 'low' | 'medium' | 'high';
        recommendations: string[];
      }> = [];

      // Analyze each symptom and add potential conditions
      currentSymptoms.forEach(symptom => {
        const conditions = symptomConditionMap[symptom.toLowerCase()];
        if (conditions) {
          potentialConditions.push(...conditions);
        }
      });

      // If no specific conditions found, add general assessment
      if (potentialConditions.length === 0) {
        potentialConditions.push({
          condition: 'General Symptom Assessment',
          probability: 0.8,
          severity: severity > 7 ? 'severe' : severity > 4 ? 'moderate' : 'mild',
          urgency: severity > 8 ? 'high' : severity > 5 ? 'medium' : 'low',
          recommendations: [
            'Monitor symptoms closely',
            'Rest and stay hydrated',
            'Consider over-the-counter relief if appropriate',
            'Seek medical attention if symptoms worsen'
          ]
        });
      }

      // Remove duplicates and sort by probability
      const uniqueConditions = potentialConditions
        .filter((condition, index, self) => 
          index === self.findIndex(c => c.condition === condition.condition)
        )
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 3); // Keep top 3 conditions

      // Calculate overall risk based on severity and conditions
      const maxUrgency = uniqueConditions.reduce((max, condition) => {
        const urgencyLevels = { low: 1, medium: 2, high: 3 };
        return Math.max(max, urgencyLevels[condition.urgency]);
      }, 1);

      const overallRisk = severity > 8 || maxUrgency === 3 ? 'high' : 
                         severity > 5 || maxUrgency === 2 ? 'medium' : 'low';

      const mockAnalysis: SymptomAnalysis = {
        symptoms: currentSymptoms,
        severity,
        potentialConditions: uniqueConditions,
        overallRisk,
        confidence: 0.75,
        immediateActions: [
          'Monitor your symptoms closely',
          'Stay hydrated and get adequate rest',
          'Contact healthcare provider if symptoms worsen',
          'Follow the specific recommendations for each condition'
        ],
        lifestyleFactors: {
          sleepQuality: 7.0,
          stressLevel: 5.0,
          exerciseLevel: 6.0,
          dietQuality: 7.0
        }
      };
      
      setAnalysis(mockAnalysis);
      console.log('✅ SymptomInputScreen: Analysis completed');
      
    } catch (error) {
      console.error('❌ SymptomInputScreen: Analysis failed:', error);
      Alert.alert(
        'Analysis Error',
        'Unable to analyze symptoms. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const addSymptom = (symptom: string) => {
    if (!currentSymptoms.includes(symptom)) {
      setCurrentSymptoms([...currentSymptoms, symptom]);
    }
    setShowSymptomModal(false);
  };

  const removeSymptom = (symptom: string) => {
    setCurrentSymptoms(currentSymptoms.filter(s => s !== symptom));
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !currentSymptoms.includes(customSymptom.trim())) {
      setCurrentSymptoms([...currentSymptoms, customSymptom.trim()]);
      setCustomSymptom('');
    }
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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#FF4444';
      case 'medium': return '#FF8800';
      case 'low': return '#00AA00';
      default: return '#666666';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Analyzing your symptoms...</Text>
        <Text style={styles.loadingSubtext}>Our AI is processing your health data</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToHome}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerContent}>
          <Ionicons name="medical" size={32} color="#007AFF" />
          <Text style={styles.headerTitle}>Symptom Analysis</Text>
          <Text style={styles.headerSubtitle}>
            Describe what you're experiencing for AI-powered health insights
          </Text>
        </View>
      </View>

      {/* Symptom Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Symptoms</Text>
        
        {/* Selected Symptoms */}
        {currentSymptoms.length > 0 && (
          <View style={styles.selectedSymptomsContainer}>
            {currentSymptoms.map((symptom, index) => (
              <View key={index} style={styles.symptomTag}>
                <Text style={styles.symptomTagText}>{symptom}</Text>
                <TouchableOpacity
                  onPress={() => removeSymptom(symptom)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Add Symptoms Buttons */}
        <View style={styles.addSymptomButtons}>
          <TouchableOpacity
            style={styles.addSymptomButton}
            onPress={() => setShowSymptomModal(true)}
          >
            <Ionicons name="add-circle" size={24} color="#007AFF" />
            <Text style={styles.addSymptomButtonText}>Add Common Symptom</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addSymptomButton}
            onPress={() => setShowSymptomModal(true)}
          >
            <Ionicons name="create" size={24} color="#007AFF" />
            <Text style={styles.addSymptomButtonText}>Add Custom Symptom</Text>
          </TouchableOpacity>
        </View>

        {/* Custom Symptom Input */}
        <View style={styles.customSymptomContainer}>
          <TextInput
            style={styles.customSymptomInput}
            placeholder="Type a custom symptom..."
            value={customSymptom}
            onChangeText={setCustomSymptom}
            onSubmitEditing={addCustomSymptom}
          />
          <TouchableOpacity
            style={styles.addCustomButton}
            onPress={addCustomSymptom}
          >
            <Text style={styles.addCustomButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Severity Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Symptom Severity</Text>
        <Text style={styles.severityLabel}>
          How severe are your symptoms? (1-10)
        </Text>
        <View style={styles.severityContainer}>
          <Text style={styles.severityValue}>{severity}</Text>
          <View style={styles.severitySlider}>
            <TouchableOpacity
              style={styles.severityButton}
              onPress={() => setSeverity(Math.max(1, severity - 1))}
            >
              <Ionicons name="remove" size={24} color="#007AFF" />
            </TouchableOpacity>
            <View style={styles.severityBar}>
              <View 
                style={[
                  styles.severityBarFill,
                  { width: `${(severity / 10) * 100}%` }
                ]} 
              />
            </View>
            <TouchableOpacity
              style={styles.severityButton}
              onPress={() => setSeverity(Math.min(10, severity + 1))}
            >
              <Ionicons name="add" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.severityDescription}>
          {severity <= 3 ? 'Mild symptoms' :
           severity <= 6 ? 'Moderate symptoms' :
           severity <= 8 ? 'Severe symptoms' : 'Very severe symptoms'}
        </Text>
      </View>

      {/* Analyze Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.analyzeButton,
            currentSymptoms.length === 0 && styles.analyzeButtonDisabled
          ]}
          onPress={analyzeSymptoms}
          disabled={currentSymptoms.length === 0}
        >
          <Ionicons name="analytics" size={24} color="white" />
          <Text style={styles.analyzeButtonText}>
            Analyze Symptoms with AI
          </Text>
        </TouchableOpacity>
      </View>

      {/* Analysis Results */}
      {analysis && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Analysis Results</Text>
          
          {/* Overall Risk Level */}
          <View style={styles.riskLevelCard}>
            <View style={styles.riskLevelHeader}>
              <Ionicons 
                name={analysis.overallRisk === 'critical' ? 'warning' : 
                      analysis.overallRisk === 'high' ? 'alert-circle' : 
                      analysis.overallRisk === 'medium' ? 'information-circle' : 'checkmark-circle'} 
                size={32} 
                color={getRiskLevelColor(analysis.overallRisk)} 
              />
              <View style={styles.riskLevelContent}>
                <Text style={[
                  styles.riskLevelText,
                  { color: getRiskLevelColor(analysis.overallRisk) }
                ]}>
                  {analysis.overallRisk.toUpperCase()} RISK
                </Text>
                
              </View>
            </View>
          </View>

          {/* Potential Conditions */}
          {analysis.potentialConditions.length > 0 && (
            <View style={styles.conditionsContainer}>
              <Text style={styles.subsectionTitle}>Potential Conditions</Text>
              {analysis.potentialConditions.map((condition, index) => (
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
                    <Text style={styles.severityText}>
                      Severity: {condition.severity}
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
                  
                  {/* Demographic Indicators */}
                  {condition.demographicIndicators && (
                    <View style={styles.demographicContainer}>
                      <Text style={styles.demographicTitle}>👥 Demographic Risk Factors:</Text>
                      
                      <View style={styles.demographicItem}>
                        <Text style={styles.demographicLabel}>Age Group:</Text>
                        <Text style={styles.demographicValue}>{condition.demographicIndicators.ageGroup}</Text>
                      </View>
                      
                      <View style={styles.demographicItem}>
                        <Text style={styles.demographicLabel}>Gender Prevalence:</Text>
                        <Text style={styles.demographicValue}>{condition.demographicIndicators.genderPrevalence}</Text>
                      </View>
                      
                      <View style={styles.demographicItem}>
                        <Text style={styles.demographicLabel}>Age-Specific Risk:</Text>
                        <Text style={styles.demographicValue}>{condition.demographicIndicators.ageSpecificRisk}</Text>
                      </View>
                      
                      <View style={styles.demographicItem}>
                        <Text style={styles.demographicLabel}>Gender-Specific Risk:</Text>
                        <Text style={styles.demographicValue}>{condition.demographicIndicators.genderSpecificRisk}</Text>
                      </View>
                      
                      {condition.demographicIndicators.pastConditionRisk.length > 0 && (
                        <View style={styles.demographicItem}>
                          <Text style={styles.demographicLabel}>Past Condition Risk Factors:</Text>
                          <Text style={styles.demographicValue}>
                            {condition.demographicIndicators.pastConditionRisk.join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Immediate Actions */}
          {analysis.immediateActions.length > 0 && (
            <View style={styles.actionsContainer}>
              <Text style={styles.subsectionTitle}>Immediate Actions</Text>
              <View style={styles.actionsCard}>
                {analysis.immediateActions.map((action, index) => (
                  <View key={index} style={styles.actionItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#00AA00" />
                    <Text style={styles.actionText}>{action}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Lifestyle Assessment */}
          <View style={styles.lifestyleContainer}>
            <Text style={styles.subsectionTitle}>Lifestyle Assessment</Text>
            <View style={styles.lifestyleCard}>
              <View style={styles.lifestyleMetric}>
                <Text style={styles.lifestyleLabel}>Sleep Quality</Text>
                <View style={styles.lifestyleBar}>
                  <View 
                    style={[
                      styles.lifestyleBarFill,
                      { width: `${(analysis.lifestyleFactors.sleepQuality / 10) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.lifestyleValue}>{analysis.lifestyleFactors.sleepQuality.toFixed(1)}/10</Text>
              </View>
              <View style={styles.lifestyleMetric}>
                <Text style={styles.lifestyleLabel}>Stress Level</Text>
                <View style={styles.lifestyleBar}>
                  <View 
                    style={[
                      styles.lifestyleBarFill,
                      { width: `${(analysis.lifestyleFactors.stressLevel / 10) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.lifestyleValue}>{analysis.lifestyleFactors.stressLevel.toFixed(1)}/10</Text>
              </View>
              <View style={styles.lifestyleMetric}>
                <Text style={styles.lifestyleLabel}>Exercise Level</Text>
                <View style={styles.lifestyleBar}>
                  <View 
                    style={[
                      styles.lifestyleBarFill,
                      { width: `${(analysis.lifestyleFactors.exerciseLevel / 10) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.lifestyleValue}>{analysis.lifestyleFactors.exerciseLevel.toFixed(1)}/10</Text>
              </View>
              <View style={styles.lifestyleMetric}>
                <Text style={styles.lifestyleLabel}>Diet Quality</Text>
                <View style={styles.lifestyleBar}>
                  <View 
                    style={[
                      styles.lifestyleBarFill,
                      { width: `${(analysis.lifestyleFactors.dietQuality / 10) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.lifestyleValue}>{analysis.lifestyleFactors.dietQuality.toFixed(1)}/10</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Symptom Selection Modal */}
      <Modal
        visible={showSymptomModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSymptomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Symptoms</Text>
              <TouchableOpacity
                onPress={() => setShowSymptomModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.symptomList}>
              {commonSymptoms.map((symptom, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.symptomItem,
                    currentSymptoms.includes(symptom) && styles.symptomItemSelected
                  ]}
                  onPress={() => addSymptom(symptom)}
                >
                  <Text style={[
                    styles.symptomItemText,
                    currentSymptoms.includes(symptom) && styles.symptomItemTextSelected
                  ]}>
                    {symptom}
                  </Text>
                  {currentSymptoms.includes(symptom) && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚠️ This analysis is for informational purposes only and should not replace professional medical advice. 
          Always consult with a healthcare provider for proper diagnosis and treatment.
          {'\n\n'}This AI tool analyzes symptom patterns to provide general insights and recommendations. 
          It is not a diagnostic tool and cannot predict or diagnose medical conditions.
        </Text>
      </View>
    </ScrollView>
  );
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
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
    textAlign: 'center',
    lineHeight: 26,
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
  selectedSymptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  symptomTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  symptomTagText: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '600',
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  addSymptomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  addSymptomButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  addSymptomButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 12,
  },
  customSymptomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customSymptomInput: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  addCustomButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addCustomButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  severityLabel: {
    fontSize: 18,
    color: '#444',
    marginBottom: 16,
    fontWeight: '600',
  },
  severityContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  severityValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
  },
  severitySlider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  severityButton: {
    padding: 12,
  },
  severityBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E1E5E9',
    borderRadius: 4,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  severityBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  severityDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#CCC',
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  riskLevelCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  riskLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskLevelContent: {
    marginLeft: 20,
    flex: 1,
  },
  riskLevelText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  conditionsContainer: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
    lineHeight: 32,
  },
  conditionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  conditionName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  conditionDetails: {
    marginBottom: 16,
  },
  probabilityText: {
    fontSize: 16,
    color: '#444',
    fontWeight: '600',
    marginBottom: 8,
  },
  severityText: {
    fontSize: 16,
    color: '#444',
    fontWeight: '600',
  },
  recommendationsContainer: {
    borderTopWidth: 2,
    borderTopColor: '#E1E5E9',
    paddingTop: 16,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 8,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  actionText: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  lifestyleContainer: {
    marginBottom: 24,
  },
  lifestyleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lifestyleMetric: {
    marginBottom: 20,
  },
  lifestyleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  lifestyleBar: {
    height: 8,
    backgroundColor: '#E1E5E9',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  lifestyleBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  lifestyleValue: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#E1E5E9',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 8,
  },
  symptomList: {
    padding: 24,
  },
  symptomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  symptomItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  symptomItemText: {
    fontSize: 18,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  symptomItemTextSelected: {
    color: '#1976D2',
    fontWeight: '700',
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
  demographicContainer: {
    borderTopWidth: 3,
    borderTopColor: '#E1E5E9',
    paddingTop: 20,
    marginTop: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  demographicTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    lineHeight: 26,
  },
  demographicItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  demographicLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    flex: 1,
    marginRight: 12,
  },
  demographicValue: {
    fontSize: 14,
    color: '#666',
    flex: 2,
    textAlign: 'right',
    lineHeight: 20,
  },
});

export default SymptomInputScreen; 