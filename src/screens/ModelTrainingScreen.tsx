import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const ModelTrainingScreen = () => {
  const { user } = useAuth();
  const [isRunningScript, setIsRunningScript] = useState(false);

  console.log('🔄 ModelTrainingScreen: Component rendered, user:', user?.id);

  const runKMeansTraining = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsRunningScript(true);
    
    try {
      // Show instructions for running the script
      const message = Platform.OS === 'web' 
        ? 'To train the K-means model, please run the training script from your terminal:\n\nFor Windows: train_kmeans.bat\nFor Unix/Linux: ./train_kmeans.sh\n\nThis will train the model using all available datasets and save it to the database.'
        : 'To train the K-means model, please run the training script from your terminal:\n\nFor Windows: train_kmeans.bat\nFor Unix/Linux: ./train_kmeans.sh\n\nThis will train the model using all available datasets and save it to the database.';

      Alert.alert(
        'K-means Training Script',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Terminal', 
            onPress: () => {
              if (Platform.OS === 'web') {
                // For web, show instructions
                Alert.alert(
                  'Terminal Instructions',
                  'Please open your terminal/command prompt and navigate to the project directory, then run:\n\nWindows: train_kmeans.bat\nUnix/Linux: ./train_kmeans.sh'
                );
              } else {
                // For mobile, show instructions
                Alert.alert(
                  'Mobile Instructions',
                  'Please use a desktop computer to run the training script. The script requires Node.js and access to the project files.'
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ ModelTrainingScreen: Script execution failed:', error);
      Alert.alert('Script Error', 'Failed to execute training script. Please check the console for details.');
    } finally {
      setIsRunningScript(false);
    }
  };

  const openScriptFile = () => {
    const scriptPath = Platform.OS === 'win32' ? 'train_kmeans.bat' : 'train_kmeans.sh';
    Alert.alert(
      'Script Location',
      `The training script is located at:\n\n${scriptPath}\n\nPlease run this script from your terminal to train the K-means model.`
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="brain" size={32} color="#007AFF" />
          <Text style={styles.headerTitle}>K-means Model Training</Text>
          <Text style={styles.headerSubtitle}>
            Train the AI model using external scripts
          </Text>
        </View>
      </View>

      {/* Training Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Training Instructions</Text>
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <Text style={styles.instructionText}>
            The model training has been moved to external scripts for better performance and reliability.
          </Text>
        </View>
      </View>

      {/* Script Runner */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Run Training Script</Text>
        <TouchableOpacity 
          style={[styles.trainingButton, isRunningScript && styles.trainingButtonDisabled]} 
          onPress={runKMeansTraining}
          disabled={isRunningScript}
        >
          {isRunningScript ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="play" size={24} color="#FFFFFF" />
          )}
          <Text style={styles.trainingButtonText}>
            {isRunningScript ? 'Running Script...' : 'Run K-means Training'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.scriptInfoButton} onPress={openScriptFile}>
          <Ionicons name="document-text" size={20} color="#007AFF" />
          <Text style={styles.scriptInfoText}>View Script Location</Text>
        </TouchableOpacity>
      </View>

      {/* Script Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Script Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="code" size={20} color="#007AFF" />
            <Text style={styles.infoLabel}>Script Type:</Text>
            <Text style={styles.infoValue}>K-means Clustering</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="folder" size={20} color="#007AFF" />
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>train_kmeans.bat / train_kmeans.sh</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="analytics" size={20} color="#007AFF" />
            <Text style={styles.infoLabel}>Datasets:</Text>
            <Text style={styles.infoValue}>Multiple health datasets</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="save" size={20} color="#007AFF" />
            <Text style={styles.infoLabel}>Output:</Text>
            <Text style={styles.infoValue}>Trained model saved to database</Text>
          </View>
        </View>
      </View>

      {/* Requirements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Requirements</Text>
        <View style={styles.requirementsCard}>
          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={20} color="#00AA00" />
            <Text style={styles.requirementText}>Node.js installed</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={20} color="#00AA00" />
            <Text style={styles.requirementText}>Project dependencies installed</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={20} color="#00AA00" />
            <Text style={styles.requirementText}>Access to project directory</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={20} color="#00AA00" />
            <Text style={styles.requirementText}>Available datasets in project</Text>
          </View>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚠️ This training process uses synthetic and anonymized data for educational purposes. 
          The model is designed to provide general health insights and should not replace professional medical advice.
          {'\n\n'}Training results may vary based on data quality and quantity. 
          For production use, ensure compliance with healthcare data regulations.
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
  instructionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginLeft: 12,
    flex: 1,
  },
  trainingButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  trainingButtonDisabled: {
    backgroundColor: '#999',
  },
  trainingButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  scriptInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#F0F2F5',
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  scriptInfoText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginLeft: 12,
    marginRight: 8,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    flex: 1,
  },
  requirementsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requirementText: {
    fontSize: 16,
    color: '#444',
    marginLeft: 12,
    lineHeight: 24,
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

export default ModelTrainingScreen;
