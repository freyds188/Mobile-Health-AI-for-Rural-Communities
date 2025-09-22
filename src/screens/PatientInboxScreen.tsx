import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Modal, ScrollView, TextInput, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/DataService';
import { eventBus } from '../utils/EventBus';

interface InboxItem {
  id: string;
  type: 'submission' | 'feedback';
  providerId: string;
  providerName?: string;
  sentAt: string;
  riskSummary?: string;
  payload?: any;
  insightId?: string;
  feedbackText?: string;
  rating?: number | null;
}

const READ_KEY = (userId: string) => `inbox_read_${userId}`;
const ARCHIVE_KEY = (userId: string) => `inbox_archive_${userId}`;

const PatientInboxScreen: React.FC = () => {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 900; // tablet/desktop breakpoint

  const [items, setItems] = useState<InboxItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<InboxItem | null>(null);
  const [feedbacks, setFeedbacks] = useState<Array<{ id: string; providerId: string; feedbackText: string; rating: number | null; createdAt: Date }>>([]);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<'newest' | 'unread'>('newest');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());

  const loadState = useCallback(async () => {
    if (!user) return;
    try {
      const [readRaw, archRaw] = await Promise.all([
        AsyncStorage.getItem(READ_KEY(user.id)),
        AsyncStorage.getItem(ARCHIVE_KEY(user.id))
      ]);
      setReadIds(new Set(readRaw ? JSON.parse(readRaw) : []));
      setArchivedIds(new Set(archRaw ? JSON.parse(archRaw) : []));
    } catch {}
  }, [user]);

  const persistRead = useCallback(async (next: Set<string>) => {
    if (!user) return;
    setReadIds(new Set(next));
    try { await AsyncStorage.setItem(READ_KEY(user.id), JSON.stringify(Array.from(next))); } catch {}
  }, [user]);

  const persistArchive = useCallback(async (next: Set<string>) => {
    if (!user) return;
    setArchivedIds(new Set(next));
    try { await AsyncStorage.setItem(ARCHIVE_KEY(user.id), JSON.stringify(Array.from(next))); } catch {}
  }, [user]);

  const load = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const [rows, feedback] = await Promise.all([
        dataService.getSubmissionsForPatient(user.id),
        dataService.getFeedbackForPatient(user.id)
      ]);
      const submissionItems: InboxItem[] = rows.map(r => ({
        id: r.id,
        type: 'submission',
        providerId: r.providerId,
        providerName: r.providerName,
        sentAt: (r.sentAt as Date).toISOString?.() || String(r.sentAt),
        riskSummary: r.payload?.overallRiskLevel,
        payload: r.payload,
        insightId: r.insightId
      }));
      const feedbackItems: InboxItem[] = feedback.map(f => ({
        id: f.id,
        type: 'feedback',
        providerId: f.providerId,
        providerName: (f as any).providerName,
        sentAt: (f.createdAt as any as Date).toISOString?.() || String(f.createdAt),
        feedbackText: f.feedbackText,
        rating: f.rating ?? null
      }));
      const merged = [...submissionItems, ...feedbackItems]
        .filter(i => !archivedIds.has(i.id))
        .sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)));
      setItems(merged);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadState(); }, [loadState]);

  // Live updates: refresh when provider feedback is saved for this user
  useEffect(() => {
    if (!user) return;
    const off = eventBus.on('provider_feedback_saved', (payload?: any) => {
      try {
        if (payload && payload.patientId === user.id) {
          // Refresh inbox items and feedback list if current selection is from this provider
          load();
          if (selected && payload.providerId === selected.providerId) {
            // Trigger feedback reload effect by updating selected ref
            setSelected({ ...selected });
          }
        }
      } catch {}
    });
    return () => { try { off(); } catch {} };
  }, [user, load, selected]);

  useEffect(() => {
    const loadFeedback = async () => {
      if (!user || !selected) { setFeedbacks([]); return; }
      try {
        const all = await dataService.getFeedbackForPatient(user.id);
        const filtered = all.filter(f => f.providerId === selected.providerId);
        setFeedbacks(filtered);
      } catch {
        setFeedbacks([]);
      }
    };
    loadFeedback();
  }, [user, selected]);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = items.filter(i => !archivedIds.has(i.id)).filter(i => {
      if (!q) return true;
      return (
        (i.providerName || '').toLowerCase().includes(q) ||
        (i.riskSummary || '').toLowerCase().includes(q) ||
        (i.payload?.selectedSymptoms || []).join(', ').toLowerCase().includes(q) ||
        (i.feedbackText || '').toLowerCase().includes(q)
      );
    });
    if (sortMode === 'unread') {
      return base.sort((a, b) => (Number(!readIds.has(a.id)) - Number(!readIds.has(b.id))) || String(b.sentAt).localeCompare(String(a.sentAt)));
    }
    return base.sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)));
  }, [items, search, sortMode, readIds, archivedIds]);

  const onSelect = (item: InboxItem) => {
    setSelected(item);
    if (!readIds.has(item.id)) {
      const next = new Set(readIds);
      next.add(item.id);
      persistRead(next);
    }
  };

  const toggleArchive = (item: InboxItem) => {
    const next = new Set(archivedIds);
    if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
    persistArchive(next);
    if (selected?.id === item.id) setSelected(null);
  };

  const renderItem = ({ item }: { item: InboxItem }) => {
    const unread = !readIds.has(item.id);
    return (
      <TouchableOpacity onPress={() => onSelect(item)} accessibilityLabel={`Open message from ${item.providerName || 'provider'}`}> 
        <View style={[styles.listItem, unread && styles.listItemUnread]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.listTitle}>{item.providerName || 'Provider'}</Text>
            {unread && <View style={styles.unreadDot} accessibilityLabel="Unread message" />}
          </View>
          <Text style={styles.listMeta}>{new Date(item.sentAt).toLocaleString()}</Text>
          {item.type === 'submission' && !!item.riskSummary && (
            <Text style={styles.listSnippet}>Risk: {String(item.riskSummary).toUpperCase()}</Text>
          )}
          {item.type === 'feedback' && !!item.feedbackText && (
            <Text style={styles.listSnippet}>Feedback: {item.feedbackText.slice(0, 140)}{item.feedbackText.length > 140 ? '…' : ''}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const DetailsView = () => (
    <View style={styles.detailCard}>
      {selected ? (
        <>
          <Text style={styles.detailTitle}>{selected.providerName || selected.providerId}</Text>
          <Text style={styles.detailMeta}>{new Date(selected.sentAt).toLocaleString()}</Text>
          {selected.type === 'submission' && !!selected.riskSummary && <Text style={styles.detailRisk}>Risk: {String(selected.riskSummary).toUpperCase()}</Text>}
          <ScrollView style={{ marginTop: 8 }}>
            {selected.type === 'submission' ? (() => {
              const payload: any = selected?.payload || {};
              const conditions = Array.isArray(payload.potentialConditions) ? payload.potentialConditions : [];
              const symptoms = Array.isArray(payload.selectedSymptoms) ? payload.selectedSymptoms : [];
              return (
                <>
                  {symptoms.length > 0 && (
                    <>
                      <Text style={styles.modalLabel}>Selected Symptoms</Text>
                      <Text style={styles.modalValue}>{symptoms.join(', ')}</Text>
                    </>
                  )}
                  {conditions.length > 0 && (
                    <>
                      <Text style={styles.modalLabel}>Potential Conditions</Text>
                      {conditions.slice(0, 8).map((c: any, idx: number) => (
                        <Text key={idx} style={styles.modalBullet}>• {c.condition} ({c.urgency})</Text>
                      ))}
                    </>
                  )}
                </>
              );
            })() : null}
            {(selected.type === 'submission' ? feedbacks.length > 0 : !!selected.feedbackText) && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalLabel}>Provider Feedback</Text>
                {selected.type === 'submission'
                  ? feedbacks.slice(0, 5).map(f => (
                      <View key={f.id} style={{ marginTop: 6 }}>
                        <Text style={styles.modalValue}>{new Date(f.createdAt as any).toLocaleString()} {typeof f.rating === 'number' ? `(Rating: ${f.rating})` : ''}</Text>
                        <Text style={styles.modalBullet}>• {f.feedbackText}</Text>
                      </View>
                    ))
                  : (
                      <View style={{ marginTop: 6 }}>
                        <Text style={styles.modalValue}>{typeof selected.rating === 'number' ? `(Rating: ${selected.rating})` : ''}</Text>
                        <Text style={styles.modalBullet}>• {selected.feedbackText}</Text>
                      </View>
                    )
                }
              </View>
            )}
          </ScrollView>
          <View style={styles.detailActions}>
            <TouchableOpacity style={styles.actionBtn} accessibilityLabel="Mark as read" onPress={() => { const next = new Set(readIds); next.add(selected.id); persistRead(next); }}>
              <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Mark read</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6c757d' }]} accessibilityLabel="Archive" onPress={() => toggleArchive(selected)}>
              <Ionicons name="archive-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{archivedIds.has(selected.id) ? 'Unarchive' : 'Archive'}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Ionicons name="mail-open-outline" size={48} color="#aaa" />
          <Text style={styles.emptyText}>Select a message to view details</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by provider, risk, symptoms"
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Search inbox"
          />
        </View>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setSortMode(m => (m === 'newest' ? 'unread' : 'newest'))} accessibilityLabel="Toggle sorting">
          <Ionicons name={sortMode === 'newest' ? 'time-outline' : 'mail-unread-outline'} size={18} color="#2E7D32" />
          <Text style={styles.sortText}>{sortMode === 'newest' ? 'Newest' : 'Unread first'}</Text>
        </TouchableOpacity>
      </View>

      {isWide ? (
        <View style={styles.splitPane}>
          <View style={styles.leftPane}>
            <FlatList
              data={filteredSorted}
              keyExtractor={(i) => i.id}
              renderItem={renderItem}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
              ListEmptyComponent={() => (
                <View style={styles.empty}> 
                  <Ionicons name="mail-open-outline" size={48} color="#aaa" />
                  <Text style={styles.emptyText}>No messages found.</Text>
                </View>
              )}
            />
          </View>
          <View style={styles.rightPane}>
            <DetailsView />
          </View>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredSorted}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            contentContainerStyle={filteredSorted.length === 0 && styles.emptyContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
            ListEmptyComponent={() => (
              <View style={styles.empty}>
                <Ionicons name="mail-open-outline" size={48} color="#aaa" />
                <Text style={styles.emptyText}>No messages yet.</Text>
              </View>
            )}
          />

          <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Submission Details</Text>
                  <TouchableOpacity onPress={() => setSelected(null)} accessibilityLabel="Close"><Ionicons name="close" size={22} color="#333" /></TouchableOpacity>
                </View>
                <DetailsView />
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E1E5E9' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, borderWidth: 2, borderColor: '#E1E5E9', paddingHorizontal: 10, paddingVertical: 8, flex: 1, marginRight: 10 },
  searchInput: { marginLeft: 8, flex: 1, color: '#333' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  sortText: { marginLeft: 6, color: '#2E7D32', fontWeight: '700' },

  splitPane: { flex: 1, flexDirection: 'row' },
  leftPane: { width: 360, borderRightWidth: 1, borderRightColor: '#E1E5E9' },
  rightPane: { flex: 1, padding: 12 },

  listItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  listItemUnread: { backgroundColor: '#F1F8E9' },
  listTitle: { fontWeight: '700', color: '#2E7D32' },
  listMeta: { color: '#666', marginTop: 2 },
  listSnippet: { color: '#555', marginTop: 4 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D32F2F' },

  detailCard: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e0e0e0', flex: 1 },
  detailTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  detailMeta: { color: '#666', marginTop: 2 },
  detailRisk: { color: '#555', marginTop: 2 },
  detailActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionBtn: { backgroundColor: '#2E7D32', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  actionBtnText: { color: '#fff', marginLeft: 8, fontWeight: '700' },

  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 20 },
  emptyText: { color: '#888', marginTop: 8 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontWeight: '700', color: '#2E7D32' },
  modalLabel: { marginTop: 8, fontWeight: '700', color: '#333' },
  modalValue: { marginTop: 4, color: '#555' },
  modalBullet: { marginTop: 4, color: '#555' }
});

export default PatientInboxScreen;
