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

const HealthDataScreen = () => {
  const { user } = useAuth();
  const { addHealthData } = useHealthData();
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
    if (formData.symptoms.length === 0) {
      Alert.alert('Error', 'Please select at least one symptom');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      await addHealthData({
        userId: user.id,
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

      Alert.alert('Success', 'Health data logged successfully', [
        {
          text: 'OK',
          onPress: () => {
            setFormData({
              symptoms: [],
              severity: 5,
              sleep: 7,
              stress: 5,
              exercise: 30,
              diet: 'balanced',
              notes: '',
            });
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to log health data');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="fitness" size={24} color="#667eea" />
        <Text style={styles.headerTitle}>Log Health Data</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Symptoms Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms</Text>
          <Text style={styles.sectionSubtitle}>Select all that apply</Text>
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
          <Text style={styles.sectionTitle}>Symptom Severity</Text>
          <Text style={styles.sectionSubtitle}>Rate your overall symptom severity (1-10)</Text>
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
          <Text style={styles.sectionTitle}>Daily Behavior</Text>
          
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
          <Text style={styles.sectionTitle}>Additional Notes</Text>
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
          <Text style={styles.submitButtonText}>Log Health Data</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#2E7D32',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
    fontFamily: fontFamily.headingMedium,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e8f5e8',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
    fontFamily: fontFamily.headingMedium,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  symptomChipSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  symptomChipText: {
    fontSize: 16,
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
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: fontFamily.buttonBold,
  },
});

export default HealthDataScreen; 