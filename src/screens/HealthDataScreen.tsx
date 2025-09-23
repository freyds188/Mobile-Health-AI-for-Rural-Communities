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
import { useHealthData } from '../contexts/HealthDataContext';
import { fontFamily } from '../utils/fonts';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HealthStackParamList } from '../navigation/HealthStackNavigator';
import { adviceService } from '../services/AdviceService';
import { ProductionRiskAssessment } from '../services/ProductionRiskAssessment';

type HealthDataScreenNavigationProp = StackNavigationProp<HealthStackParamList, 'Log Health Main'>;

const HealthDataScreen = () => {
  const { user } = useAuth();
  const { addHealthData, refreshData, saveAnalysisInsight } = useHealthData();
  const navigation = useNavigation<HealthDataScreenNavigationProp>();
  const [formData, setFormData] = useState({
    symptoms: [] as string[],
    severity: 5,
    sleep: 7,
    stress: 5,
    exercise: 30,
    diet: 'balanced',
    notes: '',
  });

  const [analysisResult, setAnalysisResult] = useState<{
    riskAssessment?: any;
    recommendations?: string;
    confidence?: number;
    isAnalyzing?: boolean;
  }>({});

  const riskAssessmentService = new ProductionRiskAssessment();

  const symptomOptions = [
    { label: 'Headache', value: 'headache' },
    { label: 'Fever', value: 'fever' },
    { label: 'Cough', value: 'cough' },
    { label: 'Fatigue', value: 'fatigue' },
    { label: 'Nausea', value: 'nausea' },
    { label: 'Dizziness', value: 'dizziness' },
    { label: 'Shortness of breath', value: 'shortness of breath' },
    { label: 'Chest pain', value: 'chest pain' },
    { label: 'Abdominal pain', value: 'abdominal pain' },
    { label: 'Joint pain', value: 'joint pain' },
    { label: 'Back pain', value: 'back pain' },
    { label: 'Muscle weakness', value: 'muscle weakness' },
  ];

  const dietOptions = [
    { label: 'Balanced', value: 'balanced' },
    { label: 'Vegetarian', value: 'vegetarian' },
    { label: 'Vegan', value: 'vegan' },
    { label: 'Low-carb', value: 'low-carb' },
    { label: 'High-protein', value: 'high-protein' },
    { label: 'Other', value: 'other' },
  ];

  const handleSymptomToggle = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const analyzeHealthInput = async () => {
    console.log('🔍 Starting health input analysis...');
    
    if (formData.symptoms.length === 0) {
      Alert.alert('⚠️ Missing Information', 'Please select at least one symptom to analyze');
      return;
    }

    setAnalysisResult(prev => ({ ...prev, isAnalyzing: true }));

    try {
      // Prepare data for risk assessment
      const healthData = {
        symptoms: formData.symptoms,
        severity: formData.severity,
        sleep: formData.sleep,
        stress: formData.stress,
        exercise: formData.exercise,
        diet: formData.diet,
        notes: formData.notes,
      };

      console.log('📊 Performing risk assessment...', healthData);

      // Get risk assessment from production model
      const riskAssessment = riskAssessmentService.assessRisk(healthData);
      
      console.log('✅ Risk assessment completed:', riskAssessment);

      // Generate personalized advice using AdviceService
      const adviceContext = {
        intent: 'health_inquiry',
        entities: formData.symptoms,
        severity: formData.severity,
        durationText: formData.notes,
      };

      const generatedAdvice = adviceService.generateAdvice(adviceContext);
      
      console.log('💡 Generated recommendations:', generatedAdvice);

      // Combine results
      setAnalysisResult({
        riskAssessment,
        recommendations: generatedAdvice.text,
        confidence: riskAssessment.confidence,
        isAnalyzing: false,
      });

      // Save analysis results to history
      try {
        console.log('💾 Saving analysis results to history...');
        const saved = await saveAnalysisInsight(riskAssessment, generatedAdvice.text);
        if (saved) {
          console.log('✅ Analysis results saved to history successfully');
          
          // Show success message to user
          setTimeout(() => {
            Alert.alert(
              '✅ Analysis Complete',
              'Your health analysis has been completed and saved to your history. You can view past analyses in your dashboard.',
              [{ text: 'Got it!' }]
            );
          }, 500);
        } else {
          console.warn('⚠️ Failed to save analysis results to history');
        }
      } catch (saveError) {
        console.error('❌ Error saving analysis to history:', saveError);
        // Don't fail the analysis if saving fails
      }

      console.log('🎉 Analysis completed successfully');

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      setAnalysisResult(prev => ({ ...prev, isAnalyzing: false }));
      
      Alert.alert(
        '❌ Analysis Error',
        'There was a problem analyzing your health data. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSubmit = async () => {
    console.log('📝 Submitting health data:', formData);
    
    if (formData.symptoms.length === 0) {
      Alert.alert('⚠️ Missing Information', 'Please select at least one symptom to continue');
      return;
    }

    if (!user) {
      Alert.alert('❌ Authentication Error', 'Please log in to save your health data');
      return;
    }

    try {
      console.log('💾 Attempting to save health data for user:', user.id);
      
      const success = await addHealthData({
        symptoms: formData.symptoms,
        severity: formData.severity,
        behavior: {
          sleep: formData.sleep,
          stress: formData.stress,
          exercise: formData.exercise,
          diet: formData.diet,
        },
        notes: formData.notes,
      });

      if (success) {
        console.log('✅ Health data saved successfully');
        
        // Automatically clear form fields after successful save
        const resetForm = () => {
          setFormData({
            symptoms: [],
            severity: 5,
            sleep: 7,
            stress: 5,
            exercise: 30,
            diet: 'balanced',
            notes: '',
          });
          setAnalysisResult({}); // Clear analysis results too
          console.log('🧹 Form fields and analysis results cleared after successful save');
        };

        // Clear fields immediately
        resetForm();

        Alert.alert(
          '✅ Health Data Saved!', 
          'Your health information has been logged successfully. Our AI will analyze it for health insights.',
          [
            {
              text: 'View History',
              onPress: () => {
                console.log('📋 User chose to view log history');
                navigation.navigate('Health History');
              },
            },
            {
              text: 'Log More Data',
              onPress: () => {
                console.log('📝 User chose to log more data');
                // Form is already cleared, user can continue logging
              },
            }
          ]
        );
        
        // Force refresh dashboard data after successful save
        setTimeout(() => {
          console.log('🔄 Triggering dashboard refresh after save...');
          refreshData();
        }, 1000);
      } else {
        console.error('❌ Failed to save health data - addHealthData returned false');
        Alert.alert(
          '❌ Save Failed', 
          'There was a problem saving your health data. Please check your connection and try again.',
          [
            { text: 'Try Again', style: 'default' },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error during health data submission:', error);
      Alert.alert(
        '❌ Error', 
        'An unexpected error occurred while saving your health data. Please try again.',
        [
          { text: 'Retry', style: 'default' },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Symptoms Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical" size={24} color="#2E7D32" />
            <Text style={styles.sectionTitle}>What symptoms do you have?</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Tap all symptoms you're experiencing today</Text>
          <View style={styles.symptomsGrid}>
            {symptomOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.symptomChip,
                  formData.symptoms.includes(option.value) && styles.symptomChipSelected
                ]}
                onPress={() => handleSymptomToggle(option.value)}
              >
                <Text style={[
                  styles.symptomChipText,
                  formData.symptoms.includes(option.value) && styles.symptomChipTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Severity Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="thermometer" size={24} color="#2E7D32" />
            <Text style={styles.sectionTitle}>How severe are your symptoms?</Text>
          </View>
          <Text style={styles.sectionSubtitle}>1 = Very mild, 10 = Very severe</Text>
          <View style={styles.severityContainer}>
            <Text style={styles.severityLabel}>Severity: {formData.severity}/10</Text>
            <View style={styles.severitySlider}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.severityDot,
                    formData.severity >= level && styles.severityDotSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, severity: level }))}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Behavior Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={24} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Your daily activities</Text>
          </View>
          
          <View style={styles.behaviorItem}>
            <Text style={styles.behaviorLabel}>Sleep (hours)</Text>
            <View style={styles.behaviorInput}>
              <TextInput
                style={styles.input}
                value={formData.sleep.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, sleep: parseFloat(text) || 0 }))}
                keyboardType="numeric"
                placeholder="7"
              />
            </View>
          </View>

          <View style={styles.behaviorItem}>
            <Text style={styles.behaviorLabel}>Stress Level (1-10)</Text>
            <View style={styles.behaviorInput}>
              <TextInput
                style={styles.input}
                value={formData.stress.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, stress: parseFloat(text) || 0 }))}
                keyboardType="numeric"
                placeholder="5"
              />
            </View>
          </View>

          <View style={styles.behaviorItem}>
            <Text style={styles.behaviorLabel}>Exercise (minutes)</Text>
            <View style={styles.behaviorInput}>
              <TextInput
                style={styles.input}
                value={formData.exercise.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, exercise: parseFloat(text) || 0 }))}
                keyboardType="numeric"
                placeholder="30"
              />
            </View>
          </View>

          <View style={styles.behaviorItem}>
            <Text style={styles.behaviorLabel}>Diet</Text>
            <View style={styles.selectContainer}>
              <select
                value={formData.diet}
                onChange={(e) => setFormData(prev => ({ ...prev, diet: e.target.value }))}
                style={webSelectStyles}
              >
                <option value="balanced">Balanced</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="low-carb">Low-carb</option>
                <option value="high-protein">High-protein</option>
                <option value="other">Other</option>
              </select>
            </View>
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbox" size={24} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Anything else to add?</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            value={formData.notes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            placeholder="Any additional information about your symptoms or health..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Analysis Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={24} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Get AI Health Analysis</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Analyze your symptoms and get personalized recommendations
          </Text>
          
          <TouchableOpacity 
            style={[styles.analysisButton, analysisResult.isAnalyzing && styles.analysisButtonDisabled]} 
            onPress={analyzeHealthInput}
            disabled={analysisResult.isAnalyzing}
          >
            <Ionicons 
              name={analysisResult.isAnalyzing ? "hourglass" : "search"} 
              size={20} 
              color="#ffffff" 
            />
            <Text style={styles.analysisButtonText}>
              {analysisResult.isAnalyzing ? 'Analyzing...' : 'Analyze My Health Data'}
            </Text>
          </TouchableOpacity>

          {/* Analysis Results */}
          {analysisResult.riskAssessment && (
            <View style={styles.analysisResults}>
              <View style={styles.riskAssessmentCard}>
                <View style={styles.riskHeader}>
                  <Ionicons 
                    name={
                      analysisResult.riskAssessment.overallRisk === 'low' ? 'checkmark-circle' :
                      analysisResult.riskAssessment.overallRisk === 'moderate' ? 'warning' : 'alert-circle'
                    } 
                    size={24} 
                    color={
                      analysisResult.riskAssessment.overallRisk === 'low' ? '#4CAF50' :
                      analysisResult.riskAssessment.overallRisk === 'moderate' ? '#FF9800' : '#F44336'
                    }
                  />
                  <Text style={[
                    styles.riskLevel,
                    { color: 
                      analysisResult.riskAssessment.overallRisk === 'low' ? '#4CAF50' :
                      analysisResult.riskAssessment.overallRisk === 'moderate' ? '#FF9800' : '#F44336'
                    }
                  ]}>
                    {analysisResult.riskAssessment.overallRisk.toUpperCase()} RISK
                  </Text>
                </View>
                
                <Text style={styles.riskScore}>
                  Risk Score: {analysisResult.riskAssessment.riskScore}/100
                </Text>
                
                {analysisResult.confidence && (
                  <Text style={styles.confidence}>
                    Confidence: {Math.round(analysisResult.confidence * 100)}%
                  </Text>
                )}
              </View>

              {/* Recommendations */}
              {analysisResult.recommendations && (
                <View style={styles.recommendationsCard}>
                  <View style={styles.recommendationsHeader}>
                    <Ionicons name="bulb" size={20} color="#2E7D32" />
                    <Text style={styles.recommendationsTitle}>Personalized Recommendations</Text>
                  </View>
                  <Text style={styles.recommendationsText}>
                    {analysisResult.recommendations}
                  </Text>
                </View>
              )}

              {/* Immediate Actions */}
              {analysisResult.riskAssessment.immediateActions && analysisResult.riskAssessment.immediateActions.length > 0 && (
                <View style={styles.actionsCard}>
                  <View style={styles.actionsHeader}>
                    <Ionicons name="flash" size={20} color="#FF5722" />
                    <Text style={styles.actionsTitle}>Immediate Actions</Text>
                  </View>
                  {analysisResult.riskAssessment.immediateActions.map((action: string, index: number) => (
                    <Text key={index} style={styles.actionItem}>• {action}</Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
          <Text style={styles.submitButtonText}>Save My Health Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const webSelectStyles = {
  fontSize: 18,
  paddingVertical: 15,
  paddingHorizontal: 15,
  borderWidth: 2,
  borderColor: '#e0e0e0',
  borderRadius: 12,
  color: '#333',
  paddingRight: 30,
  backgroundColor: '#f8f9fa',
  width: '100%',
  height: 60,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 25,
    paddingTop: 30,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    marginBottom: 25,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 10,
    fontFamily: fontFamily.headingMedium,
  },
  sectionSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 25,
    marginTop: 8,
    fontFamily: fontFamily.body,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  symptomChip: {
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 3,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  symptomChipSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  symptomChipText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
    fontFamily: fontFamily.bodyMedium,
  },
  symptomChipTextSelected: {
    color: 'white',
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
  },
  severityContainer: {
    alignItems: 'center',
  },
  severityLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    fontFamily: fontFamily.bodySemiBold,
  },
  severitySlider: {
    flexDirection: 'row',
    gap: 12,
  },
  severityDot: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#e0e0e0',
  },
  severityDotSelected: {
    backgroundColor: '#2E7D32',
  },
  behaviorItem: {
    marginBottom: 20,
  },
  behaviorLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    fontFamily: fontFamily.bodySemiBold,
  },
  behaviorInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    height: 60,
  },
  input: {
    fontSize: 18,
    paddingHorizontal: 18,
    paddingVertical: 15,
    color: '#333',
    fontFamily: fontFamily.body,
  },
  notesInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    fontSize: 18,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    fontFamily: fontFamily.body,
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: fontFamily.buttonBold,
  },
  analysisButton: {
    backgroundColor: '#1976D2',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  analysisButtonDisabled: {
    backgroundColor: '#9E9E9E',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  analysisButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: fontFamily.bodySemiBold,
  },
  analysisResults: {
    marginTop: 10,
  },
  riskAssessmentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    fontFamily: fontFamily.headingMedium,
  },
  riskScore: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    fontFamily: fontFamily.bodySemiBold,
  },
  confidence: {
    fontSize: 14,
    color: '#666',
    fontFamily: fontFamily.body,
  },
  recommendationsCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#c8e6c9',
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 8,
    fontFamily: fontFamily.bodySemiBold,
  },
  recommendationsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    fontFamily: fontFamily.body,
  },
  actionsCard: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#ffcc02',
  },
  actionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5722',
    marginLeft: 8,
    fontFamily: fontFamily.bodySemiBold,
  },
  actionItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    lineHeight: 18,
    fontFamily: fontFamily.body,
  },
});

export default HealthDataScreen; 