import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useChatbot } from '../contexts/ChatbotContext';
import { useAuth } from '../contexts/AuthContext';

const ChatHistoryScreen: React.FC = () => {
  const { messages, loadChatHistory } = useChatbot();
  const { user } = useAuth();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    // Ensure initial history is loaded
    loadChatHistory(100).catch(() => {});
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      await loadChatHistory(300);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, loadChatHistory]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.item, item.isUser ? styles.userItem : styles.botItem]}>
      <Text style={styles.text}>{item.text}</Text>
      <Text style={styles.meta}>{new Date(item.timestamp).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footer}><ActivityIndicator /></View>
          ) : (
            <TouchableOpacity style={styles.loadMore} onPress={handleLoadMore}>
              <Text style={styles.loadMoreText}>Load more</Text>
            </TouchableOpacity>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    padding: 16,
  },
  item: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  userItem: {
    backgroundColor: '#E8F5E9',
  },
  botItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e8f5e8',
  },
  text: {
    fontSize: 15,
    color: '#333',
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
    color: '#999',
  },
  footer: {
    paddingVertical: 16,
  },
  loadMore: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
});

export default ChatHistoryScreen;


