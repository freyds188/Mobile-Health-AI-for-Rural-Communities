import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ModelDeploymentService, { ContinuousLearningConfig } from '../services/ModelDeploymentService';
import MLTrainingService from '../services/MLTrainingService';

interface ModelInfo {
  isDeployed: boolean;
  modelId?: string;
  version?: string;
  performance?: { f1Score: number; accuracy: number };
  deploymentDate?: Date;
  clusters?: number;
}

interface PredictionStats {
  totalPredictions: number;
  riskDistribution: { low: number; medium: number; high: number };
  averageConfidence: number;
  recentAccuracy?: number;
}

const ModelManagementPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [modelInfo, setModelInfo] = useState<ModelInfo>({ isDeployed: false });
  const [predictionStats, setPredictionStats] = useState<PredictionStats | null>(null);
  const [learningConfig, setLearningConfig] = useState<ContinuousLearningConfig>({
    retrainingThreshold: 50,
    performanceThreshold: 0.80,
    updateFrequency: 'weekly',
    autoDeployment: false
  });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [deploymentService] = useState(new ModelDeploymentService());
  const [trainingService] = useState(new MLTrainingService());

  useEffect(() => {
    loadModelInfo();
    loadPredictionStats();
  }, []);

  const loadModelInfo = async () => {
    try {
      const info = deploymentService.getDeployedModelInfo();
      setModelInfo(info);
    } catch (error) {
      console.warn('Could not load model info:', error);
    }
  };

  const loadPredictionStats = async () => {
    try {
      const stats = deploymentService.getPredictionStats();
      setPredictionStats(stats);
    } catch (error) {
      console.warn('Could not load prediction stats:', error);
    }
  };

  const handleDeployLatestModel = async () => {
    setIsLoading(true);
    
    try {
      // Train a new model
      Alert.alert(
        'Deploy Model',
        'This will train a new model and deploy it for production use. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Deploy',
            onPress: async () => {
              try {
                console.log('🚀 Training and deploying new model...');
                
                // Train hybrid model (best performance)
                const trainingResult = await trainingService.trainHybridModel();
                
                // Deploy the trained model
                await deploymentService.deployModel(trainingResult);
                
                // Refresh UI
                await loadModelInfo();
                await loadPredictionStats();
                
                Alert.alert(
                  'Deployment Successful',
                  `New model deployed successfully!\nF1 Score: ${trainingResult.validation.f1Score.toFixed(3)}\nAccuracy: ${trainingResult.validation.accuracy.toFixed(3)}`,
                  [{ text: 'OK' }]
                );
                
              } catch (error) {
                Alert.alert('Deployment Failed', 'Could not deploy model. Please try again.');
                console.error('Deployment error:', error);
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Could not start deployment process.');
      setIsLoading(false);
    }
  };

  const handleRetrainModel = async () => {
    setIsLoading(true);
    
    try {
      const result = await deploymentService.triggerRetraining();
      
      if (result.success) {
        Alert.alert(
          'Retraining Successful',
          `Model retrained and deployed!\nNew Model ID: ${result.newModelId}`,
          [{ text: 'OK', onPress: () => {
            loadModelInfo();
            loadPredictionStats();
          }}]
        );
      } else {
        Alert.alert(
          'Retraining Complete',
          'Model was retrained but did not improve performance. Current model retained.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Retraining Failed', 'Could not retrain model. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateConfig = () => {
    deploymentService.updateLearningConfig(learningConfig);
    setShowConfigModal(false);
    Alert.alert('Configuration Updated', 'Continuous learning settings have been updated.');
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 0.85) return '#4CAF50';
    if (score >= 0.75) return '#FF9800';
    return '#F44336';
  };

  const getPerformanceText = (score: number): string => {
    if (score >= 0.85) return 'EXCELLENT';
    if (score >= 0.75) return 'GOOD';
    return 'NEEDS IMPROVEMENT';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Managing model deployment...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="settings" size={28} color="#2E7D32" />
        <Text style={styles.title}>Model Management</Text>
      </View>

      {/* Current Model Status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚀 Deployed Model Status</Text>
        
        {modelInfo.isDeployed ? (
          <View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>✅ DEPLOYED</Text>
              </View>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Model ID:</Text>
              <Text style={styles.statusValue}>{modelInfo.modelId?.slice(-8)}</Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Version:</Text>
              <Text style={styles.statusValue}>{modelInfo.version}</Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Deployed:</Text>
              <Text style={styles.statusValue}>
                {modelInfo.deploymentDate?.toLocaleDateString()}
              </Text>
            </View>
            
            {modelInfo.performance && (
              <View style={styles.performanceSection}>
                <Text style={styles.performanceTitle}>Model Performance</Text>
                <View style={styles.metricsRow}>
                  <View style={styles.metric}>
                    <Text style={[styles.metricValue, { color: getPerformanceColor(modelInfo.performance.f1Score) }]}>
                      {modelInfo.performance.f1Score.toFixed(3)}
                    </Text>
                    <Text style={styles.metricLabel}>F1 Score</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={[styles.metricValue, { color: getPerformanceColor(modelInfo.performance.accuracy) }]}>
                      {modelInfo.performance.accuracy.toFixed(3)}
                    </Text>
                    <Text style={styles.metricLabel}>Accuracy</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricValue}>{modelInfo.clusters}</Text>
                    <Text style={styles.metricLabel}>Clusters</Text>
                  </View>
                </View>
                <Text style={[styles.performanceRating, { color: getPerformanceColor(modelInfo.performance.f1Score) }]}>
                  {getPerformanceText(modelInfo.performance.f1Score)}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noModelContainer}>
            <Ionicons name="warning" size={48} color="#FF9800" />
            <Text style={styles.noModelText}>No Model Deployed</Text>
            <Text style={styles.noModelSubtext}>Deploy a model to start making predictions</Text>
          </View>
        )}
      </View>

      {/* Prediction Statistics */}
      {predictionStats && predictionStats.totalPredictions > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Prediction Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statsItem}>
              <Text style={styles.statsValue}>{predictionStats.totalPredictions}</Text>
              <Text style={styles.statsLabel}>Total Predictions</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsValue}>{(predictionStats.averageConfidence * 100).toFixed(1)}%</Text>
              <Text style={styles.statsLabel}>Avg Confidence</Text>
            </View>
            {predictionStats.recentAccuracy && (
              <View style={styles.statsItem}>
                <Text style={styles.statsValue}>{(predictionStats.recentAccuracy * 100).toFixed(1)}%</Text>
                <Text style={styles.statsLabel}>Recent Accuracy</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.distributionTitle}>Risk Distribution</Text>
          <View style={styles.distributionContainer}>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { backgroundColor: '#4CAF50', width: `${predictionStats.riskDistribution.low}%` }]} />
              <Text style={styles.distributionText}>🟢 Low: {predictionStats.riskDistribution.low}%</Text>
            </View>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { backgroundColor: '#FF9800', width: `${predictionStats.riskDistribution.medium}%` }]} />
              <Text style={styles.distributionText}>🟡 Medium: {predictionStats.riskDistribution.medium}%</Text>
            </View>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { backgroundColor: '#F44336', width: `${predictionStats.riskDistribution.high}%` }]} />
              <Text style={styles.distributionText}>🔴 High: {predictionStats.riskDistribution.high}%</Text>
            </View>
          </View>
        </View>
      )}

      {/* Model Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🛠️ Model Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleDeployLatestModel}
          activeOpacity={0.7}
        >
          <Ionicons name="rocket" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Deploy New Model</Text>
        </TouchableOpacity>

        {modelInfo.isDeployed && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.retrainButton]} 
            onPress={handleRetrainModel}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color="#ffffff" />
            <Text style={styles.actionButtonText}>Retrain Model</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.actionButton, styles.configButton]} 
          onPress={() => setShowConfigModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="cog" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Configure Learning</Text>
        </TouchableOpacity>
      </View>

      {/* Configuration Modal */}
      <Modal
        visible={showConfigModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Continuous Learning Configuration</Text>
              <TouchableOpacity 
                onPress={() => setShowConfigModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Retraining Threshold</Text>
                <Text style={styles.configDescription}>Number of new predictions before retraining</Text>
                <View style={styles.configInput}>
                  <Text style={styles.configValue}>{learningConfig.retrainingThreshold}</Text>
                </View>
              </View>

              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Performance Threshold</Text>
                <Text style={styles.configDescription}>Minimum accuracy to maintain</Text>
                <View style={styles.configInput}>
                  <Text style={styles.configValue}>{(learningConfig.performanceThreshold * 100).toFixed(0)}%</Text>
                </View>
              </View>

              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Update Frequency</Text>
                <Text style={styles.configDescription}>How often to check for retraining</Text>
                <View style={styles.configInput}>
                  <Text style={styles.configValue}>{learningConfig.updateFrequency}</Text>
                </View>
              </View>

              <View style={styles.configItem}>
                <View style={styles.switchRow}>
                  <View>
                    <Text style={styles.configLabel}>Auto Deployment</Text>
                    <Text style={styles.configDescription}>Automatically deploy better models</Text>
                  </View>
                  <Switch
                    value={learningConfig.autoDeployment}
                    onValueChange={(value) => setLearningConfig(prev => ({ ...prev, autoDeployment: value }))}
                    trackColor={{ false: '#ccc', true: '#2E7D32' }}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.saveConfigButton}
                onPress={handleUpdateConfig}
              >
                <Text style={styles.saveConfigText}>Save Configuration</Text>
              </TouchableOpacity>
            </ScrollView>
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
  card: {
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  noModelContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noModelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 12,
  },
  noModelSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  performanceSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  performanceRating: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statsItem: {
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statsLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  distributionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  distributionContainer: {
    gap: 8,
  },
  distributionItem: {
    marginBottom: 8,
  },
  distributionBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  distributionText: {
    fontSize: 14,
    color: '#666',
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
  retrainButton: {
    backgroundColor: '#1976D2',
  },
  configButton: {
    backgroundColor: '#666',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  configItem: {
    marginBottom: 20,
  },
  configLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  configDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  configInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  configValue: {
    fontSize: 16,
    color: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveConfigButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveConfigText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ModelManagementPanel;
