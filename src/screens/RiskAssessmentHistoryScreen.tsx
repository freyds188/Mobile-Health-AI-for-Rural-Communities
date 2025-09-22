import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/DataService';
import { notificationService } from '../services/NotificationService';

const RiskAssessmentHistoryScreen: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Array<{ id: string; createdAt: Date; payload: any }>>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<{ id: string; payload: any } | null>(null);
  const [providers, setProviders] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [query, setQuery] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await dataService.getRiskAssessmentHistory(user.id, 100);
      setItems(list);
    } catch (e) {
      Alert.alert('Error', 'Failed to load assessment history.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const openDetail = (item: { id: string; payload: any }) => setDetail(item);

  const loadProviders = async () => {
    try {
      setProviderError(null);
      const list = await dataService.listAllProviders();
      setProviders(list);
    } catch {
      setProviderError('Unable to load providers. Please try again later.');
    }
  };

  const sendSelected = async () => {
    if (!user || !detail) return;
    try {
      if (providers.length === 0) await loadProviders();
      const provider = providers.find(p => p.id === selectedProviderId);
      if (!provider) {
        Alert.alert('Select Provider', 'Please select a healthcare provider.');
        return;
      }
      const res = await dataService.sendAssessmentToSpecificProvider(user.id, provider.id, detail.payload, detail.payload?.assessmentId);
      if (res.success) {
        Alert.alert('Sent', `Your risk assessment has been sent to ${provider.name}.`);
        try {
          const raw = (detail.payload?.overallRiskLevel || 'low').toString().toLowerCase();
          const risk = raw === 'high' || raw === 'medium' || raw === 'low' ? (raw as 'high' | 'medium' | 'low') : 'low';
          await notificationService.sendRiskAlert(risk);
        } catch {}
        setDetail(null);
        setSelectedProviderId(null);
      } else {
        Alert.alert('Error', 'Failed to send assessment.');
      }
    } catch {
      Alert.alert('Error', 'Failed to send assessment.');
    }
  };

  const renderItem = ({ item }: { item: { id: string; createdAt: Date; payload: any } }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.date}>{item.createdAt.toLocaleString()}</Text>
        <TouchableOpacity onPress={() => openDetail(item)}>
          <View style={styles.sendPill}>
            <Ionicons name="eye" size={16} color="#fff" />
            <Text style={styles.sendPillText}>View</Text>
          </View>
        </TouchableOpacity>
      </View>
      <Text style={styles.summary}>Risk: {(item.payload?.overallRiskLevel || 'unknown').toString().toUpperCase()}</Text>
      {!!item.payload?.recommendations?.length && (
        <Text style={styles.reco}>Recs: {item.payload.recommendations.slice(0,3).join('; ')}{item.payload.recommendations.length>3?'...':''}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={!loading ? <Text style={{ textAlign: 'center', color: '#666' }}>No assessment history yet.</Text> : null}
      />

      <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assessment Details</Text>
              <TouchableOpacity onPress={() => setDetail(null)}><Ionicons name="close" size={22} color="#333" /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              <Text style={styles.modalLabel}>Risk:</Text>
              <Text style={styles.modalValue}>{(detail?.payload?.overallRiskLevel || 'unknown').toString().toUpperCase()}</Text>
              {Array.isArray(detail?.payload?.selectedSymptoms) && detail?.payload?.selectedSymptoms.length > 0 && (
                <>
                  <Text style={styles.modalLabel}>Selected Symptoms:</Text>
                  <Text style={styles.modalValue}>{detail?.payload?.selectedSymptoms.join(', ')}</Text>
                </>
              )}
              {Array.isArray(detail?.payload?.potentialConditions) && detail?.payload?.potentialConditions.length > 0 && (
                <>
                  <Text style={styles.modalLabel}>Potential Conditions:</Text>
                  {detail?.payload?.potentialConditions.slice(0,5).map((c: any, idx: number) => (
                    <Text key={idx} style={styles.modalBullet}>• {c.condition} ({c.urgency})</Text>
                  ))}
                </>
              )}
              {!!detail?.payload?.recommendations?.length && (
                <>
                  <Text style={styles.modalLabel}>Recommendations:</Text>
                  {detail?.payload?.recommendations.slice(0,5).map((r: string, idx: number) => (
                    <Text key={idx} style={styles.modalBullet}>• {r}</Text>
                  ))}
                </>
              )}
            </ScrollView>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.modalLabel}>Send to Provider</Text>
              <TextInput
                style={styles.providerSearch}
                placeholder="Search provider by name or email"
                value={query}
                onChangeText={setQuery}
                onFocus={() => { if (providers.length === 0) loadProviders(); }}
              />
              {providerError && <Text style={{ color: '#D32F2F', marginTop: 6 }}>{providerError}</Text>}
              <View style={{ maxHeight: 160 }}>
                {providers
                  .filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.email.toLowerCase().includes(query.toLowerCase()))
                  .slice(0, 8)
                  .map(p => (
                    <TouchableOpacity key={p.id} style={[styles.providerItem, selectedProviderId === p.id && styles.providerItemSelected]} onPress={() => setSelectedProviderId(p.id)}>
                      <Text style={styles.providerName}>{p.name}</Text>
                      <Text style={styles.providerEmail}>{p.email}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
              <TouchableOpacity style={styles.sendPrimary} onPress={sendSelected}>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.sendPrimaryText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  date: { color: '#2E7D32', fontWeight: '700' },
  summary: { marginTop: 8, color: '#333', fontWeight: '600' },
  reco: { marginTop: 4, color: '#555' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sendPill: { backgroundColor: '#2E7D32', flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  sendPillText: { color: '#fff', marginLeft: 6, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontWeight: '700', color: '#2E7D32' },
  modalLabel: { marginTop: 8, fontWeight: '700', color: '#333' },
  modalValue: { marginTop: 4, color: '#555' },
  modalBullet: { marginTop: 4, color: '#555' },
  sendPrimary: { marginTop: 10, backgroundColor: '#2E7D32', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingVertical: 10 },
  sendPrimaryText: { color: '#fff', marginLeft: 8, fontWeight: '700' },
  providerItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  providerItemSelected: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 8 },
  providerName: { fontWeight: '700', color: '#2E7D32' },
  providerEmail: { color: '#666', fontSize: 12 },
  providerSearch: { backgroundColor: 'white', borderRadius: 12, borderWidth: 2, borderColor: '#E1E5E9', paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, color: '#333' },
});

export default RiskAssessmentHistoryScreen;


