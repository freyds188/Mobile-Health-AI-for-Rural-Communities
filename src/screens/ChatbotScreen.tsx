import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatbot } from '../contexts/ChatbotContext';
import { fontFamily } from '../utils/fonts';
import { useAuth } from '../contexts/AuthContext';
import { useHealthData } from '../contexts/HealthDataContext';

const ChatbotScreen = () => {
  const [inputText, setInputText] = useState('');
  const { messages, isTyping, sendMessage, clearChat } = useChatbot();
  const { user } = useAuth();
  const { addHealthData, analyzeHealthData } = useHealthData();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (inputText.trim()) {
      await sendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleClearChat = () => {
    clearChat();
  };

  const renderMessage = ({ item }: { item: any }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.botMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.isUser ? styles.userBubble : styles.botBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.isUser ? styles.userText : styles.botText
        ]}>
          {item.text}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    </View>
  );

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={styles.messageContainer}>
        <View style={[styles.messageBubble, styles.botBubble]}>
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color="#667eea" />
            <Text style={styles.typingText}>AI is typing...</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="medical" size={32} color="#ffffff" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>🤖 AI Health Assistant</Text>
            <Text style={styles.headerSubtitle}>Ask me about your health</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
          <Ionicons name="refresh" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          ListFooterComponent={renderTypingIndicator}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Tell me about your symptoms, pain, or health questions..."
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? 'white' : '#ccc'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 25,
    backgroundColor: '#2E7D32',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 3,
    fontFamily: fontFamily.headingMedium,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#c8e6c9',
    fontFamily: fontFamily.body,
  },
  clearButton: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  messageContainer: {
    marginBottom: 18,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 18,
    borderRadius: 22,
  },
  userBubble: {
    backgroundColor: '#2E7D32',
    borderBottomRightRadius: 8,
  },
  botBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e8f5e8',
  },
  messageText: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: fontFamily.body,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 14,
    color: '#999',
    marginTop: 6,
    alignSelf: 'flex-end',
    fontFamily: fontFamily.body,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
    fontStyle: 'italic',
    fontFamily: fontFamily.body,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 25,
    paddingVertical: 25,
    backgroundColor: '#ffffff',
    borderTopWidth: 3,
    borderTopColor: '#e8f5e8',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    maxHeight: 120,
    fontSize: 20,
    marginRight: 15,
    borderWidth: 3,
    borderColor: '#2E7D32',
    fontFamily: fontFamily.body,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
});

export default ChatbotScreen; 