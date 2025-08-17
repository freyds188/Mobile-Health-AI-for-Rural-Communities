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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { chatbotTrainingService, TrainingDataset, TrainingSession, TrainingMetrics } from '../services/ChatbotTrainingService';
import { advancedNLPService } from '../services/AdvancedNLPService';
import { useAuth } from '../contexts/AuthContext';

const ChatbotTrainingScreen = () => {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState<TrainingDataset[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [metrics, setMetrics] = useState<TrainingMetrics | null>(null);
  const [modelStats, setModelStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newDatasetDescription, setNewDatasetDescription] = useState('');
  const [showAddDataset, setShowAddDataset] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [datasetsData, sessionsData, metricsData, statsData] = await Promise.all([
        chatbotTrainingService.getTrainingDatasets(),
        chatbotTrainingService.getTrainingSessions(),
        chatbotTrainingService.getTrainingMetrics(),
        advancedNLPService.getModelStats()
      ]);

      setDatasets(datasetsData);
      setSessions(sessionsData);
      setMetrics(metricsData);
      setModelStats(statsData);
    } catch (error) {
      console.error('Failed to load training data:', error);
      Alert.alert('Error', 'Failed to load training data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const startTraining = async () => {
    if (!selectedDataset && datasets.length === 0) {
      Alert.alert('No Training Data', 'Please create a training dataset first.');
      return;
    }

    setTraining(true);
    try {
      const session = await chatbotTrainingService.startTrainingSession(selectedDataset || undefined);
      
      Alert.alert(
        'Training Completed',
        `Training completed with ${(session.accuracy * 100).toFixed(2)}% accuracy.\nNew intents: ${session.newIntents}\nNew entities: ${session.newEntities}`,
        [{ text: 'OK', onPress: loadData }]
      );
    } catch (error) {
      console.error('Training failed:', error);
      Alert.alert('Training Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setTraining(false);
    }
  };

  const createDataset = async () => {
    if (!newDatasetName.trim()) {
      Alert.alert('Error', 'Please enter a dataset name');
      return;
    }

    try {
      const dataset = await chatbotTrainingService.createTrainingDataset(
        newDatasetName.trim(),
        newDatasetDescription.trim()
      );
      
      setDatasets(prev => [...prev, dataset]);
      setNewDatasetName('');
      setNewDatasetDescription('');
      setShowAddDataset(false);
      
      Alert.alert('Success', 'Dataset created successfully');
    } catch (error) {
      console.error('Failed to create dataset:', error);
      Alert.alert('Error', 'Failed to create dataset');
    }
  };

  const resetModel = async () => {
    Alert.alert(
      'Reset Model',
      'This will reset the model to its default state and clear all training data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatbotTrainingService.resetModel();
              await loadData();
              Alert.alert('Success', 'Model reset successfully');
            } catch (error) {
              console.error('Failed to reset model:', error);
              Alert.alert('Error', 'Failed to reset model');
            }
          }
        }
      ]
    );
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28A745';
      case 'running': return '#007AFF';
      case 'failed': return '#DC3545';
      default: return '#6C757D';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading training data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="school" size={32} color="#007AFF" />
            <Text style={styles.headerTitle}>🤖 Chatbot Training</Text>
            <Text style={styles.headerSubtitle}>Train and improve your AI assistant</Text>
          </View>
        </View>

        {/* Model Stats */}
        {modelStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Model Statistics</Text>
            <View style={styles.statsCard}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Version:</Text>
                <Text style={styles.statValue}>{modelStats.version}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Accuracy:</Text>
                <Text style={styles.statValue}>{(modelStats.accuracy * 100).toFixed(2)}%</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Intents:</Text>
                <Text style={styles.statValue}>{modelStats.intentsCount}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Entities:</Text>
                <Text style={styles.statValue}>{modelStats.entitiesCount}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Training Data:</Text>
                <Text style={styles.statValue}>{modelStats.trainingDataCount}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Training Metrics */}
        {metrics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Training Metrics</Text>
            <View style={styles.metricsCard}>
              <View style={styles.metricItem}>
                <Ionicons name="analytics" size={24} color="#007AFF" />
                <View style={styles.metricContent}>
                  <Text style={styles.metricValue}>{(metrics.averageAccuracy * 100).toFixed(2)}%</Text>
                  <Text style={styles.metricLabel}>Average Accuracy</Text>
                </View>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
                <View style={styles.metricContent}>
                  <Text style={styles.metricValue}>{(metrics.bestAccuracy * 100).toFixed(2)}%</Text>
                  <Text style={styles.metricLabel}>Best Accuracy</Text>
                </View>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="time" size={24} color="#28A745" />
                <View style={styles.metricContent}>
                  <Text style={styles.metricValue}>{metrics.totalSessions}</Text>
                  <Text style={styles.metricLabel}>Training Sessions</Text>
                </View>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="timer" size={24} color="#FF6B6B" />
                <View style={styles.metricContent}>
                  <Text style={styles.metricValue}>{formatDuration(metrics.totalTrainingTime)}</Text>
                  <Text style={styles.metricLabel}>Total Training Time</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Training Control */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start Training</Text>
          <View style={styles.trainingCard}>
            <View style={styles.datasetSelector}>
              <Text style={styles.selectorLabel}>Training Dataset:</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerText}>
                  {selectedDataset 
                    ? datasets.find(d => d.id === selectedDataset)?.name 
                    : 'All Available Data'
                  }
                </Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    const options = ['All Available Data', ...datasets.map(d => d.name)];
                    Alert.alert(
                      'Select Dataset',
                      'Choose training dataset:',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        ...options.map((option, index) => ({
                          text: option,
                          onPress: () => {
                            if (index === 0) {
                              setSelectedDataset('');
                            } else {
                              setSelectedDataset(datasets[index - 1].id);
                            }
                          }
                        }))
                      ]
                    );
                  }}
                >
                  <Ionicons name="chevron-down" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.trainButton, training && styles.trainButtonDisabled]}
              onPress={startTraining}
              disabled={training}
            >
              {training ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="play" size={24} color="white" />
              )}
              <Text style={styles.trainButtonText}>
                {training ? 'Training...' : 'Start Training'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Datasets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Training Datasets</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddDataset(true)}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {showAddDataset && (
            <View style={styles.addDatasetCard}>
              <TextInput
                style={styles.input}
                placeholder="Dataset name"
                value={newDatasetName}
                onChangeText={setNewDatasetName}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                value={newDatasetDescription}
                onChangeText={setNewDatasetDescription}
                multiline
                numberOfLines={3}
              />
              <View style={styles.addDatasetActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddDataset(false);
                    setNewDatasetName('');
                    setNewDatasetDescription('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={createDataset}
                >
                  <Text style={styles.createButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {datasets.map(dataset => (
            <View key={dataset.id} style={styles.datasetCard}>
              <View style={styles.datasetHeader}>
                <Text style={styles.datasetName}>{dataset.name}</Text>
                <Text style={styles.datasetVersion}>v{dataset.version}</Text>
              </View>
              <Text style={styles.datasetDescription}>{dataset.description}</Text>
              <View style={styles.datasetStats}>
                <Text style={styles.datasetStat}>{dataset.data.length} examples</Text>
                                 <Text style={styles.datasetStat}>
                   Updated {(dataset.updatedAt instanceof Date ? dataset.updatedAt : new Date(dataset.updatedAt)).toLocaleDateString()}
                 </Text>
              </View>
            </View>
          ))}

          {datasets.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="document-text" size={48} color="#CCC" />
              <Text style={styles.emptyStateText}>No training datasets yet</Text>
              <Text style={styles.emptyStateSubtext}>Create your first dataset to start training</Text>
            </View>
          )}
        </View>

        {/* Recent Training Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Training Sessions</Text>
          {sessions.slice(0, 5).map(session => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionDate}>
                    {(session.startTime instanceof Date ? session.startTime : new Date(session.startTime)).toLocaleDateString()}
                  </Text>
                  <Text style={styles.sessionTime}>
                    {(session.startTime instanceof Date ? session.startTime : new Date(session.startTime)).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(session.status) }
                ]}>
                  <Text style={styles.statusText}>{session.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.sessionStats}>
                <Text style={styles.sessionStat}>
                  Accuracy: {(session.accuracy * 100).toFixed(2)}%
                </Text>
                <Text style={styles.sessionStat}>
                  Data: {session.trainingDataCount} examples
                </Text>
                {session.endTime && (
                  <Text style={styles.sessionStat}>
                    Duration: {formatDuration(
                      (session.endTime instanceof Date ? session.endTime : new Date(session.endTime)).getTime() - 
                      (session.startTime instanceof Date ? session.startTime : new Date(session.startTime)).getTime()
                    )}
                  </Text>
                )}
              </View>
              {session.error && (
                <Text style={styles.errorText}>Error: {session.error}</Text>
              )}
            </View>
          ))}

          {sessions.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="time" size={48} color="#CCC" />
              <Text style={styles.emptyStateText}>No training sessions yet</Text>
              <Text style={styles.emptyStateSubtext}>Start your first training session</Text>
            </View>
          )}
        </View>

        {/* Reset Model */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.resetButton} onPress={resetModel}>
            <Ionicons name="refresh" size={24} color="white" />
            <Text style={styles.resetButtonText}>Reset Model to Default</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
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
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    lineHeight: 32,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '700',
  },
  metricsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricContent: {
    marginLeft: 16,
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  trainingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  datasetSelector: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E1E5E9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  pickerButton: {
    padding: 4,
  },
  trainButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  trainButtonDisabled: {
    backgroundColor: '#CCC',
  },
  trainButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  addButton: {
    backgroundColor: '#28A745',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDatasetCard: {
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
  input: {
    borderWidth: 2,
    borderColor: '#E1E5E9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addDatasetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#28A745',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  datasetCard: {
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
  datasetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  datasetName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  datasetVersion: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  datasetDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    lineHeight: 22,
  },
  datasetStats: {
    flexDirection: 'row',
    gap: 16,
  },
  datasetStat: {
    fontSize: 14,
    color: '#888',
  },
  sessionCard: {
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
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sessionTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  sessionStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  sessionStat: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#DC3545',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#DC3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
});

export default ChatbotTrainingScreen;
