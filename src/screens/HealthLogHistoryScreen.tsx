import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useHealthData, HealthData, HealthInsight } from '../contexts/HealthDataContext';
import { fontFamily } from '../utils/fonts';

const HealthLogHistoryScreen = () => {
  const { user } = useAuth();
  const { healthData, insights, isLoading, refreshData } = useHealthData();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'week' | 'month'>('all');
  const [selectedInsight, setSelectedInsight] = useState<HealthInsight | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const userHealthData = user ? healthData.filter(data => data.userId === user.id) : [];
  const userInsights = user ? insights.filter(insight => insight.userId === user.id) : [];

  // Function to find insight for a health entry (by timestamp proximity)
  const findInsightForEntry = (entryTimestamp: Date): HealthInsight | null => {
    const entryTime = new Date(entryTimestamp).getTime();
    
    console.log(`🔍 Finding insight for entry at ${entryTimestamp.toISOString()}`);
    console.log(`🧠 Available insights count: ${userInsights.length}`);
    
    // Find insight within 2 hours of the health entry (increased window)
    const matchingInsight = userInsights.find(insight => {
      const insightTime = new Date(insight.timestamp).getTime();
      const timeDiff = Math.abs(entryTime - insightTime);
      const timeDiffMinutes = timeDiff / (1000 * 60);
      
      console.log(`⏰ Insight ${insight.id}: ${insight.timestamp.toISOString()}, diff: ${timeDiffMinutes.toFixed(1)} minutes`);
      
      return timeDiff <= 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    });
    
    if (matchingInsight) {
      console.log(`✅ Found matching insight: ${matchingInsight.id}`);
    } else {
      console.log('❌ No matching insight found');
    }
    
    return matchingInsight || null;
  };

  const openAnalysisModal = (insight: HealthInsight) => {
    setSelectedInsight(insight);
    setModalVisible(true);
  };

  const closeAnalysisModal = () => {
    setModalVisible(false);
    setSelectedInsight(null);
  };

  useEffect(() => {
    if (user) {
      console.log('📋 HealthLogHistoryScreen: User detected, refreshing data...');
      refreshData();
    }
  }, [user]);

  useEffect(() => {
    console.log('📋 HealthLogHistoryScreen: Data updated - Total health data:', healthData.length);
    console.log('📋 HealthLogHistoryScreen: User health data:', userHealthData.length);
    console.log('🧠 HealthLogHistoryScreen: Total insights:', insights.length);
    console.log('🧠 HealthLogHistoryScreen: User insights:', userInsights.length);
    console.log('📋 HealthLogHistoryScreen: Current user:', user?.id);
  }, [healthData, userHealthData, insights, userInsights, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Error refreshing health data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getFilteredData = () => {
    const now = new Date();
    let filtered = [...userHealthData];

    switch (selectedFilter) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(data => new Date(data.timestamp) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(data => new Date(data.timestamp) >= monthAgo);
        break;
      default:
        // 'all' - no filtering
        break;
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const formatDate = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return '#4CAF50'; // Green - low
    if (severity <= 6) return '#FF9800'; // Orange - medium
    return '#F44336'; // Red - high
  };

  const getSeverityLabel = (severity: number) => {
    if (severity <= 3) return 'Mild';
    if (severity <= 6) return 'Moderate';
    return 'Severe';
  };

  const handleDeleteEntry = (entryId: string, timestamp: Date) => {
    Alert.alert(
      '🗑️ Delete Health Log',
      `Are you sure you want to delete this health log from ${formatDate(timestamp)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete functionality in HealthDataContext
            console.log('🗑️ Delete health log entry:', entryId);
            Alert.alert('Feature Coming Soon', 'Delete functionality will be available in the next update.');
          }
        }
      ]
    );
  };

  const renderHealthLogEntry = (entry: HealthData, index: number) => {
    const associatedInsight = findInsightForEntry(entry.timestamp);
    
    return (
    <View key={entry.id} style={styles.logEntry}>
      <View style={styles.entryHeader}>
        <View style={styles.entryHeaderLeft}>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(entry.severity) }]}>
            <Text style={styles.severityText}>{getSeverityLabel(entry.severity)}</Text>
          </View>
          <Text style={styles.entryDate}>{formatDate(entry.timestamp)}</Text>
        </View>
       
      </View>

      <View style={styles.entryContent}>
        <View style={styles.symptomsSection}>
          <Text style={styles.sectionLabel}>🩺 Symptoms:</Text>
          <View style={styles.symptomsContainer}>
            {entry.symptoms.map((symptom, idx) => (
              <View key={idx} style={styles.symptomChip}>
                <Text style={styles.symptomText}>{symptom}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Ionicons name="thermometer" size={16} color="#2E7D32" />
            <Text style={styles.metricLabel}>Severity</Text>
            <Text style={[styles.metricValue, { color: getSeverityColor(entry.severity) }]}>
              {entry.severity}/10
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="bed" size={16} color="#2E7D32" />
            <Text style={styles.metricLabel}>Sleep</Text>
            <Text style={styles.metricValue}>{entry.behavior.sleep}h</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="trending-up" size={16} color="#2E7D32" />
            <Text style={styles.metricLabel}>Stress</Text>
            <Text style={styles.metricValue}>{entry.behavior.stress}/10</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="fitness" size={16} color="#2E7D32" />
            <Text style={styles.metricLabel}>Exercise</Text>
            <Text style={styles.metricValue}>{entry.behavior.exercise}min</Text>
          </View>
        </View>

        <View style={styles.additionalInfo}>
          <View style={styles.dietInfo}>
            <Ionicons name="restaurant" size={16} color="#2E7D32" />
            <Text style={styles.dietText}>Diet: {entry.behavior.diet}</Text>
          </View>
          {entry.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>📝 Notes:</Text>
              <Text style={styles.notesText}>{entry.notes}</Text>
            </View>
          )}
        </View>

        {/* Analysis Results Section */}
        {associatedInsight && (
          <View style={styles.analysisSection}>
            <View style={styles.analysisSectionHeader}>
              <Ionicons name="analytics" size={16} color="#1976D2" />
              <Text style={styles.analysisSectionTitle}>AI Health Analysis</Text>
              <TouchableOpacity 
                style={styles.viewAnalysisButton}
                onPress={() => openAnalysisModal(associatedInsight)}
              >
                <Text style={styles.viewAnalysisButtonText}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#1976D2" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.analysisPreview}>
              <View style={styles.riskLevelContainer}>
                <Ionicons 
                  name={
                    associatedInsight.riskLevel === 'low' ? 'checkmark-circle' :
                    associatedInsight.riskLevel === 'medium' ? 'warning' : 'alert-circle'
                  } 
                  size={20} 
                  color={
                    associatedInsight.riskLevel === 'low' ? '#4CAF50' :
                    associatedInsight.riskLevel === 'medium' ? '#FF9800' : '#F44336'
                  }
                />
                <Text style={[
                  styles.riskLevelText,
                  { color: 
                    associatedInsight.riskLevel === 'low' ? '#4CAF50' :
                    associatedInsight.riskLevel === 'medium' ? '#FF9800' : '#F44336'
                  }
                ]}>
                  {associatedInsight.riskLevel.toUpperCase()} RISK
                </Text>
                <Text style={styles.confidenceText}>
                  {Math.round(associatedInsight.confidence * 100)}% confidence
                </Text>
              </View>
              
              {associatedInsight.recommendations.length > 0 && (
                <Text style={styles.recommendationPreview} numberOfLines={2}>
                  💡 {associatedInsight.recommendations[0].substring(0, 100)}...
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
    );
  };

  const filteredData = getFilteredData();

  // Analysis Modal Component
  const renderAnalysisModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeAnalysisModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Health Analysis</Text>
            <TouchableOpacity onPress={closeAnalysisModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {selectedInsight && (
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Risk Assessment */}
              <View style={styles.modalSection}>
                <View style={styles.modalSectionHeader}>
                  <Ionicons name="shield-checkmark" size={20} color="#2E7D32" />
                  <Text style={styles.modalSectionTitle}>Risk Assessment</Text>
                </View>
                <View style={styles.riskAssessmentCard}>
                  <View style={styles.riskHeader}>
                    <Ionicons 
                      name={
                        selectedInsight.riskLevel === 'low' ? 'checkmark-circle' :
                        selectedInsight.riskLevel === 'medium' ? 'warning' : 'alert-circle'
                      } 
                      size={24} 
                      color={
                        selectedInsight.riskLevel === 'low' ? '#4CAF50' :
                        selectedInsight.riskLevel === 'medium' ? '#FF9800' : '#F44336'
                      }
                    />
                    <Text style={[
                      styles.modalRiskLevel,
                      { color: 
                        selectedInsight.riskLevel === 'low' ? '#4CAF50' :
                        selectedInsight.riskLevel === 'medium' ? '#FF9800' : '#F44336'
                      }
                    ]}>
                      {selectedInsight.riskLevel.toUpperCase()} RISK
                    </Text>
                  </View>
                  <Text style={styles.modalConfidence}>
                    Confidence: {Math.round(selectedInsight.confidence * 100)}%
                  </Text>
                  <Text style={styles.analysisDate}>
                    Analysis Date: {new Date(selectedInsight.timestamp).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Patterns */}
              {selectedInsight.patterns.length > 0 && (
                <View style={styles.modalSection}>
                  <View style={styles.modalSectionHeader}>
                    <Ionicons name="trending-up" size={20} color="#2E7D32" />
                    <Text style={styles.modalSectionTitle}>Analysis Patterns</Text>
                  </View>
                  <View style={styles.patternsContainer}>
                    {selectedInsight.patterns.map((pattern, index) => (
                      <Text key={index} style={styles.patternItem}>• {pattern}</Text>
                    ))}
                  </View>
                </View>
              )}

              {/* Recommendations */}
              {selectedInsight.recommendations.length > 0 && (
                <View style={styles.modalSection}>
                  <View style={styles.modalSectionHeader}>
                    <Ionicons name="bulb" size={20} color="#2E7D32" />
                    <Text style={styles.modalSectionTitle}>Recommendations</Text>
                  </View>
                  <View style={styles.recommendationsContainer}>
                    {selectedInsight.recommendations.map((recommendation, index) => (
                      <Text key={index} style={styles.recommendationText}>
                        {recommendation}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  if (isLoading && filteredData.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading your health history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderAnalysisModal()}
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'week' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('week')}
        >
          <Text style={[styles.filterText, selectedFilter === 'week' && styles.filterTextActive]}>
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'month' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('month')}
        >
          <Text style={[styles.filterText, selectedFilter === 'month' && styles.filterTextActive]}>
            This Month
          </Text>
        </TouchableOpacity>
      </View>

      {filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="clipboard-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Health Logs Yet</Text>
          <Text style={styles.emptyText}>
            {selectedFilter === 'all' 
              ? "Start logging your health data to see your history here."
              : `No health logs found for the selected time period.`}
          </Text>
          <TouchableOpacity style={styles.logFirstButton} onPress={() => console.log('Navigate to Log Health')}>
            <Ionicons name="add-circle" size={20} color="#ffffff" />
            <Text style={styles.logFirstButtonText}>Log Your First Entry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              📊 {filteredData.length} health {filteredData.length === 1 ? 'entry' : 'entries'} {
                selectedFilter === 'all' ? 'total' : 
                selectedFilter === 'week' ? 'this week' : 'this month'
              }
            </Text>
            {userInsights.length > 0 && (
              <Text style={styles.insightsStatsText}>
                🧠 {userInsights.length} AI {userInsights.length === 1 ? 'analysis' : 'analyses'} available
              </Text>
            )}
          </View>


          {filteredData.map((entry, index) => renderHealthLogEntry(entry, index))}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: '#666',
    fontFamily: fontFamily.body,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 15,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    fontFamily: fontFamily.bodySemiBold,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 16,
    color: '#666',
    fontFamily: fontFamily.body,
  },
  insightsStatsText: {
    fontSize: 14,
    color: '#1976D2',
    marginTop: 5,
    fontFamily: fontFamily.body,
  },
  logEntry: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    marginBottom: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  entryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 12,
  },
  severityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: fontFamily.buttonBold,
  },
  entryDate: {
    fontSize: 16,
    color: '#666',
    fontFamily: fontFamily.body,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  entryContent: {
    gap: 15,
  },
  symptomsSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: fontFamily.bodySemiBold,
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  symptomText: {
    fontSize: 14,
    color: '#2E7D32',
    fontFamily: fontFamily.bodyMedium,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    minWidth: '45%',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: fontFamily.body,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: fontFamily.buttonBold,
    marginLeft: 'auto',
  },
  additionalInfo: {
    gap: 10,
  },
  dietInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dietText: {
    fontSize: 14,
    color: '#666',
    fontFamily: fontFamily.body,
  },
  notesSection: {
    gap: 5,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: fontFamily.bodySemiBold,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: fontFamily.body,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    fontFamily: fontFamily.buttonBold,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    fontFamily: fontFamily.body,
  },
  logFirstButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  logFirstButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fontFamily.buttonBold,
  },
  bottomSpacer: {
    height: 20,
  },
  // Analysis section styles
  analysisSection: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  analysisSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginLeft: 8,
    flex: 1,
    fontFamily: fontFamily.bodySemiBold,
  },
  viewAnalysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  viewAnalysisButtonText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
    marginRight: 4,
    fontFamily: fontFamily.bodySemiBold,
  },
  analysisPreview: {
    gap: 10,
  },
  riskLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskLevelText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: fontFamily.buttonBold,
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 'auto',
    fontFamily: fontFamily.body,
  },
  recommendationPreview: {
    fontSize: 13,
    color: '#333',
    fontStyle: 'italic',
    lineHeight: 18,
    fontFamily: fontFamily.body,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: fontFamily.headingMedium,
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 8,
    fontFamily: fontFamily.bodySemiBold,
  },
  riskAssessmentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalRiskLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    fontFamily: fontFamily.headingMedium,
  },
  modalConfidence: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    fontFamily: fontFamily.bodySemiBold,
  },
  analysisDate: {
    fontSize: 14,
    color: '#666',
    fontFamily: fontFamily.body,
  },
  patternsContainer: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ffcc02',
  },
  patternItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    lineHeight: 20,
    fontFamily: fontFamily.body,
  },
  recommendationsContainer: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 10,
    fontFamily: fontFamily.body,
  },
});

export default HealthLogHistoryScreen;
