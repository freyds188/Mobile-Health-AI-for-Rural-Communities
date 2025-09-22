import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { dataService } from '../../services/DataService';

type RouteParams = { params: { patientId: string } };

const PatientDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams>>();
  const patientId = (route.params as any)?.patientId;
  const [insights, setInsights] = useState<any[]>([]);
  const [feedbackText, setFeedbackText] = useState('');

  const loadData = useCallback(async () => {
    if (!patientId) return;
    const userInsights = await dataService.getHealthData(patientId, 50);
    // This screen focuses on risk insights; fetch latest analysis reports if needed
    // For now, show health data entries and allow feedback saving.
    setInsights(userInsights);
  }, [patientId]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveFeedback = async () => {
    try {
      const providerId = (await dataService.getCurrentUser?.())?.id; // if available
    } catch {}
    try {
      await dataService.saveProviderFeedback({
        providerId: 'current-provider',
        patientId,
        feedbackText: feedbackText.trim(),
      });
      setFeedbackText('');
      Alert.alert('Feedback saved');
    } catch (e) {
      Alert.alert('Error', 'Could not save feedback');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient Details</Text>
      <FlatList
        data={insights}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}><Ionicons name="time-outline" size={16} color="#666" /><Text style={styles.rowText}>{new Date(item.timestamp).toLocaleString()}</Text></View>
            <View style={styles.row}><Ionicons name="fitness-outline" size={16} color="#666" /><Text style={styles.rowText}>Severity: {item.severity}</Text></View>
            <Text style={styles.notes}>{item.notes}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No records yet.</Text>}
      />

      <View style={styles.feedbackBox}>
        <Text style={styles.feedbackTitle}>Provider Feedback</Text>
        <TextInput
          style={styles.input}
          placeholder="Write feedback..."
          value={feedbackText}
          onChangeText={setFeedbackText}
          multiline
        />
        <TouchableOpacity style={styles.button} onPress={saveFeedback}>
          <Text style={styles.buttonText}>Save Feedback</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#2E7D32', marginBottom: 12 },
  card: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12, marginBottom: 10, borderColor: '#e0e0e0', borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  rowText: { marginLeft: 6, color: '#555' },
  notes: { marginTop: 6, color: '#333' },
  empty: { textAlign: 'center', color: '#888', marginTop: 24 },
  feedbackBox: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  feedbackTitle: { fontWeight: '700', marginBottom: 8, color: '#333' },
  input: { minHeight: 80, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, backgroundColor: '#fafafa' },
  button: { marginTop: 10, backgroundColor: '#2E7D32', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' }
});

export default PatientDetailsScreen;


