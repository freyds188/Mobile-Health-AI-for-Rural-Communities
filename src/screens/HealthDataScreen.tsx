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

type HealthDataScreenNavigationProp = StackNavigationProp<HealthStackParamList, 'Log Health Main'>;

const HealthDataScreen = () => {
  const { user } = useAuth();
  const { addHealthData, refreshData } = useHealthData();
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
          console.log('🧹 Form fields cleared after successful save');
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
});

export default HealthDataScreen; 