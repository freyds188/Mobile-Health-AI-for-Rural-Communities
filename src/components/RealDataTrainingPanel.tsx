import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MLTrainingService from '../services/MLTrainingService';
import DataImportService from '../services/DataImportService';

interface TrainingStats {
  imported: any;
  realUsers: number;
  totalAvailable: number;
  recommendations: string[];
}

interface TrainingResult {
  modelId: string;
  validation: {
    f1Score: number;
    accuracy: number;
  };
  metrics: {
    trainingSamples: number;
    testingSamples: number;
    optimalK: number;
    trainingTime: number;
  };
}

const RealDataTrainingPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [trainingStats, setTrainingStats] = useState<TrainingStats | null>(null);
  const [lastTrainingResult, setLastTrainingResult] = useState<TrainingResult | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [trainingPhase, setTrainingPhase] = useState<string>('');

  const trainingService = new MLTrainingService();
  const importService = new DataImportService();

  useEffect(() => {
    loadTrainingStats();
  }, []);

  const loadTrainingStats = async () => {
    try {
      setIsLoading(true);
      const stats = await trainingService.getTrainingDataStats();
      setTrainingStats(stats);
    } catch (error) {
      console.warn('Could not load training stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportDatasets = async () => {
    setIsLoading(true);
    setTrainingPhase('Importing CSV datasets...');
    
    try {
      const results = await importService.importProvidedDatasets();
      const totalImported = results.reduce((sum, r) => sum + r.importedRecords, 0);
      
      if (totalImported > 0) {
        Alert.alert(
          'Import Successful',
          `Successfully imported ${totalImported} health records from datasets.`,
          [{ text: 'OK', onPress: loadTrainingStats }]
        );
      } else {
        Alert.alert(
          'Import Notice',
          'No new data was imported. Datasets may already be loaded.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Import Failed',
        'Failed to import datasets. Using sample data instead.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setTrainingPhase('');
    }
  };

  const handleTrainWithDatasets = async () => {
    setIsLoading(true);
    setTrainingPhase('Training with imported datasets...');
    
    try {
      const result = await trainingService.trainWithImportedDatasets();
      setLastTrainingResult(result);
      
      Alert.alert(
        'Training Completed',
        `Model trained successfully!\nF1 Score: ${result.validation.f1Score.toFixed(3)}\nAccuracy: ${result.validation.accuracy.toFixed(3)}`,
        [
          { text: 'View Details', onPress: () => setShowDetailsModal(true) },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Training Failed',
        'Could not train with datasets. Try importing datasets first.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setTrainingPhase('');
    }
  };

  const handleHybridTraining = async () => {
    setIsLoading(true);
    setTrainingPhase('Running hybrid training (datasets + user data)...');
    
    try {
      const result = await trainingService.trainHybridModel();
      setLastTrainingResult(result);
      
      Alert.alert(
        'Hybrid Training Completed',
        `Advanced model trained successfully!\nF1 Score: ${result.validation.f1Score.toFixed(3)}\nAccuracy: ${result.validation.accuracy.toFixed(3)}`,
        [
          { text: 'View Details', onPress: () => setShowDetailsModal(true) },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Training Failed',
        'Hybrid training failed. Try basic training first.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setTrainingPhase('');
    }
  };

  const handleClearData = async () => {
    Alert.alert(
      'Clear Training Data',
      'This will remove all imported synthetic users and their data. Real user data will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await importService.clearImportedData();
              await loadTrainingStats();
              Alert.alert('Success', 'Training data cleared successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear training data.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const getPerformanceColor = (f1Score: number): string => {
    if (f1Score >= 0.85) return '#4CAF50'; // Green
    if (f1Score >= 0.75) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getPerformanceText = (f1Score: number): string => {
    if (f1Score >= 0.85) return 'EXCELLENT';
    if (f1Score >= 0.75) return 'GOOD';
    if (f1Score >= 0.65) return 'FAIR';
    return 'NEEDS IMPROVEMENT';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>
          {trainingPhase || 'Loading training data...'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="analytics" size={28} color="#2E7D32" />
        <Text style={styles.title}>Real Data Training</Text>
      </View>

      {/* Training Data Overview */}
      {trainingStats && (
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>📊 Training Data Overview</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Total Records:</Text>
            <Text style={styles.statsValue}>{trainingStats.totalAvailable}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Imported Dataset:</Text>
            <Text style={styles.statsValue}>{trainingStats.imported.totalHealthRecords}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Real Users:</Text>
            <Text style={styles.statsValue}>{trainingStats.imported.realUsers}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Synthetic Users:</Text>
            <Text style={styles.statsValue}>{trainingStats.imported.syntheticUsers}</Text>
          </View>

          {trainingStats.recommendations.length > 0 && (
            <View style={styles.recommendationsSection}>
              <Text style={styles.recommendationsTitle}>💡 Recommendations:</Text>
              {trainingStats.recommendations.map((rec, index) => (
                <Text key={index} style={styles.recommendationText}>
                  • {rec}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Last Training Result */}
      {lastTrainingResult && (
        <View style={styles.resultCard}>
          <Text style={styles.cardTitle}>🏆 Last Training Result</Text>
          <View style={styles.resultHeader}>
            <Text style={styles.modelId}>Model: {lastTrainingResult.modelId.slice(-8)}</Text>
            <Text 
              style={[
                styles.performanceText,
                { color: getPerformanceColor(lastTrainingResult.validation.f1Score) }
              ]}
            >
              {getPerformanceText(lastTrainingResult.validation.f1Score)}
            </Text>
          </View>
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {lastTrainingResult.validation.f1Score.toFixed(3)}
              </Text>
              <Text style={styles.metricLabel}>F1 Score</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {lastTrainingResult.validation.accuracy.toFixed(3)}
              </Text>
              <Text style={styles.metricLabel}>Accuracy</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {lastTrainingResult.metrics.optimalK}
              </Text>
              <Text style={styles.metricLabel}>Clusters</Text>
            </View>
          </View>
        </View>
      )}

      {/* Training Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>🚀 Training Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleImportDatasets}
          activeOpacity={0.7}
        >
          <Ionicons name="download" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Import CSV Datasets</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleTrainWithDatasets}
          activeOpacity={0.7}
        >
          <Ionicons name="school" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Train with Datasets</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.hybridButton]} 
          onPress={handleHybridTraining}
          activeOpacity={0.7}
        >
          <Ionicons name="layers" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Hybrid Training (Recommended)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.clearButton]} 
          onPress={handleClearData}
          activeOpacity={0.7}
        >
          <Ionicons name="trash" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Clear Training Data</Text>
        </TouchableOpacity>
      </View>

      {/* Training Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Training Details</Text>
              <TouchableOpacity 
                onPress={() => setShowDetailsModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {lastTrainingResult && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.detailTitle}>Model Performance</Text>
                <Text style={styles.detailText}>F1 Score: {lastTrainingResult.validation.f1Score.toFixed(3)}</Text>
                <Text style={styles.detailText}>Accuracy: {lastTrainingResult.validation.accuracy.toFixed(3)}</Text>
                
                <Text style={styles.detailTitle}>Training Metrics</Text>
                <Text style={styles.detailText}>Training Samples: {lastTrainingResult.metrics.trainingSamples}</Text>
                <Text style={styles.detailText}>Testing Samples: {lastTrainingResult.metrics.testingSamples}</Text>
                <Text style={styles.detailText}>Optimal Clusters: {lastTrainingResult.metrics.optimalK}</Text>
                <Text style={styles.detailText}>Training Time: {(lastTrainingResult.metrics.trainingTime / 1000).toFixed(1)}s</Text>
                
                <Text style={styles.detailTitle}>Model ID</Text>
                <Text style={styles.detailText}>{lastTrainingResult.modelId}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 12,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 16,
    color: '#666',
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recommendationsSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modelId: {
    fontSize: 16,
    color: '#666',
  },
  performanceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  hybridButton: {
    backgroundColor: '#1976D2',
  },
  clearButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default RealDataTrainingPanel;
