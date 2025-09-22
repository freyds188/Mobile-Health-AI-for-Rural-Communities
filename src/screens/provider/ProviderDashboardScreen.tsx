import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { exportService } from '../../utils/ExportService';
import { dataService } from '../../services/DataService';

interface InsightRow {
  id: string;
  userId: string;
  patientName: string;
  riskLevel: 'low' | 'medium' | 'high';
  timestamp: string;
  confidence: number;
}

interface SubmissionRow {
  id: string;
  patientId: string;
  patientName?: string;
  sentAt: string;
  riskSummary?: string;
  payload?: any;
  insightId?: string;
}

const riskColor = (risk: InsightRow['riskLevel']) =>
  risk === 'high' ? '#D32F2F' : risk === 'medium' ? '#F57C00' : '#2E7D32';

const ProviderDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [insights, setInsights] = useState<InsightRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionRow | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState<string>('');

  const loadData = useCallback(async () => {
    if (!user) return;
    if (user.role !== 'provider') {
      setInsights([]);
      setSubmissions([]);
      return;
    }
    setRefreshing(true);
    try {
      const rows = await dataService.getPatientInsightsForProvider(user.id);
      const mapped = rows.map(r => ({
        id: r.id,
        userId: r.userId,
        patientName: (r as any).patientName || 'Patient',
        riskLevel: r.riskLevel as InsightRow['riskLevel'],
        timestamp: (r.timestamp as Date).toISOString?.() || String(r.timestamp),
        confidence: r.confidence
      }));
      setInsights(mapped);

      const subs = await dataService.getSubmissionsForProvider(user.id);
      setSubmissions(
        subs.map(s => ({
          id: s.id,
          patientId: s.patientId,
          patientName: s.patientName,
          sentAt: (s.sentAt as Date).toISOString?.() || String(s.sentAt),
          riskSummary: s.payload?.overallRiskLevel,
          payload: s.payload,
          insightId: s.insightId
        }))
      );
    } catch (e) {
      console.error('ProviderDashboard load failed:', e);
      setInsights([]);
      setSubmissions([]);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const renderItem = ({ item }: { item: InsightRow }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Patient Details', { patientId: item.userId })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.patientName}>{item.patientName}</Text>
        <View style={[styles.riskBadge, { backgroundColor: riskColor(item.riskLevel) }]}>
          <Text style={styles.riskText}>{item.riskLevel.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.cardRow}>
        <Ionicons name="time-outline" size={16} color="#666" />
        <Text style={styles.rowText}>{new Date(item.timestamp).toLocaleString()}</Text>
      </View>
      <View style={styles.cardRow}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#666" />
        <Text style={styles.rowText}>Confidence: {(item.confidence * 100).toFixed(0)}%</Text>
      </View>
    </TouchableOpacity>
  );

  const exportCSV = async () => {
    const rows = insights.map(i => ({
      id: i.id,
      patientName: i.patientName,
      riskLevel: i.riskLevel,
      timestamp: i.timestamp,
      confidence: i.confidence
    }));
    const uri = await exportService.exportCSV('provider_insights.csv', rows);
    await exportService.shareFile(uri);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Provider Dashboard</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity onPress={exportCSV}>
            <Ionicons name="download-outline" size={22} color="#2E7D32" />
          </TouchableOpacity>
          <TouchableOpacity onPress={loadData}>
            <Ionicons name="refresh" size={22} color="#2E7D32" />
          </TouchableOpacity>
        </View>
      </View>
      {user && user.role !== 'provider' && (
        <View style={[styles.card, { padding: 12 }]}> 
          <Text style={{ color: '#D32F2F', fontWeight: '700' }}>Access restricted. Switch to a provider account to view submissions.</Text>
        </View>
      )}
      {submissions.length > 0 && (
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontWeight: '700', color: '#2E7D32', marginBottom: 6 }}>Recent Submissions</Text>
          {submissions.slice(0, 5).map(s => (
            <TouchableOpacity key={s.id} onPress={() => setSelectedSubmission(s)}>
              <View style={[styles.card, { padding: 10 }]}> 
                <Text style={{ fontWeight: '600', color: '#333' }}>{s.patientName || 'Patient'}</Text>
                <Text style={{ color: '#666', marginTop: 2 }}>Sent: {new Date(s.sentAt).toLocaleString()}</Text>
                {!!s.riskSummary && <Text style={{ color: '#555', marginTop: 2 }}>Risk: {String(s.riskSummary).toUpperCase()}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <FlatList
        data={insights}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={insights.length === 0 && styles.emptyContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color="#aaa" />
            <Text style={styles.emptyText}>No submissions yet from assigned patients.</Text>
          </View>
        )}
      />

      <Modal visible={!!selectedSubmission} transparent animationType="slide" onRequestClose={() => setSelectedSubmission(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submission Details</Text>
              <TouchableOpacity onPress={() => setSelectedSubmission(null)}><Ionicons name="close" size={22} color="#333" /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.modalLabel}>Patient:</Text>
              <Text style={styles.modalValue}>{selectedSubmission?.patientName || selectedSubmission?.patientId}</Text>
              <Text style={styles.modalLabel}>Sent:</Text>
              <Text style={styles.modalValue}>{selectedSubmission ? new Date(selectedSubmission.sentAt).toLocaleString() : ''}</Text>
              {!!selectedSubmission?.riskSummary && (
                <>
                  <Text style={styles.modalLabel}>Risk:</Text>
                  <Text style={styles.modalValue}>{String(selectedSubmission.riskSummary).toUpperCase()}</Text>
                </>
              )}
              {(() => {
                const payload: any = selectedSubmission?.payload || {};
                const conditions = Array.isArray(payload.potentialConditions) ? payload.potentialConditions : [];
                const symptoms = Array.isArray(payload.selectedSymptoms) ? payload.selectedSymptoms : [];
                return (
                  <>
                    {symptoms.length > 0 && (
                      <>
                        <Text style={styles.modalLabel}>Selected Symptoms:</Text>
                        <Text style={styles.modalValue}>{symptoms.join(', ')}</Text>
                      </>
                    )}
                    {conditions.length > 0 && (
                      <>
                        <Text style={styles.modalLabel}>Potential Conditions:</Text>
                        {conditions.slice(0, 8).map((c: any, idx: number) => (
                          <Text key={idx} style={styles.modalBullet}>• {c.condition} ({c.urgency})</Text>
                        ))}
                      </>
                    )}
                  </>
                );
              })()}
            </ScrollView>
            <View style={{ marginTop: 12 }}>
              <Text style={styles.modalLabel}>Send Feedback</Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Write feedback for the patient"
                value={feedbackText}
                onChangeText={setFeedbackText}
                multiline
              />
              <TextInput
                style={styles.feedbackRating}
                placeholder="Rating (1-5) optional"
                value={feedbackRating}
                onChangeText={setFeedbackRating}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.feedbackSend}
                onPress={async () => {
                  try {
                    if (!user || !selectedSubmission) return;
                    const rating = feedbackRating ? Math.max(1, Math.min(5, parseInt(feedbackRating))) : undefined;
                    await dataService.saveProviderFeedback({
                      providerId: user.id,
                      patientId: selectedSubmission.patientId,
                      insightId: selectedSubmission.insightId,
                      feedbackText,
                      rating,
                    });
                    setFeedbackText('');
                    setFeedbackRating('');
                    Alert.alert('Sent', 'Feedback sent to patient.');
                  } catch (e) {
                    Alert.alert('Error', 'Failed to send feedback.');
                  }
                }}
              >
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.feedbackSendText}>Send Feedback</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#2E7D32' },
  card: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  patientName: { fontSize: 16, fontWeight: '600', color: '#333' },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  riskText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  rowText: { marginLeft: 6, color: '#555' },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center' },
  emptyText: { color: '#888', marginTop: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontWeight: '700', color: '#2E7D32' },
  modalLabel: { marginTop: 8, fontWeight: '700', color: '#333' },
  modalValue: { marginTop: 4, color: '#555' },
  modalBullet: { marginTop: 4, color: '#555' },
  feedbackInput: { backgroundColor: 'white', borderRadius: 12, borderWidth: 2, borderColor: '#E1E5E9', paddingHorizontal: 14, paddingVertical: 10, minHeight: 80, textAlignVertical: 'top', marginTop: 6 },
  feedbackRating: { backgroundColor: 'white', borderRadius: 12, borderWidth: 2, borderColor: '#E1E5E9', paddingHorizontal: 14, paddingVertical: 10, marginTop: 8 },
  feedbackSend: { marginTop: 10, backgroundColor: '#2E7D32', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingVertical: 10 },
  feedbackSendText: { color: '#fff', marginLeft: 8, fontWeight: '700' }
});

export default ProviderDashboardScreen;


