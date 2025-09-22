import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/DataService';

const stepsTemplate = [
  { id: 'consent', title: 'Obtain Consent', description: 'Explain purpose and obtain verbal consent.' },
  { id: 'vitals', title: 'Record Basic Vitals', description: 'Ask for symptom severity, sleep, stress, exercise.' },
  { id: 'symptoms', title: 'Capture Symptoms', description: 'List key symptoms and notes.' },
  { id: 'recommend', title: 'Provide Guidance', description: 'Share recommendations and next steps.' }
];

const CHWWorkflowScreen: React.FC = () => {
  const { user } = useAuth();
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const canUse = user && (user.role === 'chw' || user.role === 'provider' || user.role === 'admin');

  const nextStep = useMemo(() => stepsTemplate.find(s => !completed[s.id]), [completed]);

  const markComplete = (stepId: string) => {
    setCompleted(prev => ({ ...prev, [stepId]: true }));
  };

  const saveVisit = async () => {
    if (!user) return;
    const steps = stepsTemplate.map(s => ({ ...s, done: !!completed[s.id] }));
    try {
      // Save a minimal visit for the logged-in CHW against themselves for demo
      const db = dataService.getDatabaseService();
      await db.saveCHWVisit({
        chwId: user.id,
        patientId: user.id,
        startedAt: new Date().toISOString(),
        status: steps.every(s => s.done) ? 'completed' : 'in_progress',
        steps
      });
    } catch {}
  };

  if (!canUse) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text>CHW mode is restricted. Please login as CHW or Provider.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Community Health Worker Guidance</Text>
      {stepsTemplate.map(step => (
        <View key={step.id} style={{ padding: 12, borderWidth: 1, borderColor: '#e1e5e9', borderRadius: 8, marginBottom: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>{step.title}</Text>
          <Text style={{ color: '#555', marginTop: 4 }}>{step.description}</Text>
          {!completed[step.id] ? (
            <TouchableOpacity onPress={() => markComplete(step.id)} style={{ marginTop: 8, backgroundColor: '#007AFF', padding: 10, borderRadius: 6 }}>
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Mark Complete</Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ marginTop: 8, color: 'green', fontWeight: '600' }}>Completed</Text>
          )}
        </View>
      ))}
      <TouchableOpacity onPress={saveVisit} style={{ marginTop: 12, backgroundColor: '#0a7', padding: 12, borderRadius: 6 }}>
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>Save Visit</Text>
      </TouchableOpacity>
      {nextStep ? (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '600' }}>Next Step:</Text>
          <Text>{nextStep.title}</Text>
        </View>
      ) : (
        <Text style={{ marginTop: 16, color: 'green', fontWeight: '600' }}>All steps completed</Text>
      )}
    </ScrollView>
  );
};

export default CHWWorkflowScreen;


