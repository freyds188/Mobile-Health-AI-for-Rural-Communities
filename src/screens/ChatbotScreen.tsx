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
  Modal,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useChatbot } from '../contexts/ChatbotContext';
import { fontFamily } from '../utils/fonts';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

interface SeverityOption {
  value: number;
  label: string;
  color: string;
  description: string;
}

interface SymptomOption {
  id: string;
  name: string;
  category: string;
  icon: string;
}

interface ChatOption {
  id: string;
  text: string;
  type: 'symptom' | 'severity' | 'duration' | 'action';
  value?: any;
  color?: string;
}

const SEVERITY_OPTIONS: SeverityOption[] = [
  { value: 1, label: 'Very Mild', color: '#4CAF50', description: 'Barely noticeable' },
  { value: 2, label: 'Mild', color: '#8BC34A', description: 'Slightly bothersome' },
  { value: 3, label: 'Moderate', color: '#FFC107', description: 'Noticeable but manageable' },
  { value: 4, label: 'Moderately Severe', color: '#FF9800', description: 'Significantly bothersome' },
  { value: 5, label: 'Severe', color: '#FF5722', description: 'Very bothersome' },
  { value: 6, label: 'Very Severe', color: '#F44336', description: 'Extremely bothersome' },
  { value: 7, label: 'Extremely Severe', color: '#D32F2F', description: 'Almost unbearable' },
  { value: 8, label: 'Intense', color: '#C62828', description: 'Very intense pain/discomfort' },
  { value: 9, label: 'Excruciating', color: '#B71C1C', description: 'Extremely intense' },
  { value: 10, label: 'Worst Possible', color: '#8D6E63', description: 'The worst pain/discomfort imaginable' },
];

const COMMON_SYMPTOMS: SymptomOption[] = [
  // Emergency Symptoms
  { id: 'chest_pain', name: 'Chest Pain', category: 'Emergency', icon: 'heart' },
  { id: 'shortness_of_breath', name: 'Shortness of Breath', category: 'Emergency', icon: 'airplane' },
  { id: 'severe_headache', name: 'Severe Headache', category: 'Emergency', icon: 'medical' },
  { id: 'unconscious', name: 'Unconscious', category: 'Emergency', icon: 'warning' },
  { id: 'severe_bleeding', name: 'Severe Bleeding', category: 'Emergency', icon: 'medical' },
  
  // Common Symptoms
  { id: 'headache', name: 'Headache', category: 'Pain', icon: 'medical' },
  { id: 'fever', name: 'Fever', category: 'General', icon: 'thermometer' },
  { id: 'cough', name: 'Cough', category: 'Respiratory', icon: 'medical' },
  { id: 'sore_throat', name: 'Sore Throat', category: 'Respiratory', icon: 'medical' },
  { id: 'stomach_pain', name: 'Stomach Pain', category: 'Pain', icon: 'restaurant' },
  { id: 'back_pain', name: 'Back Pain', category: 'Pain', icon: 'body' },
  { id: 'joint_pain', name: 'Joint Pain', category: 'Pain', icon: 'fitness' },
  { id: 'fatigue', name: 'Fatigue', category: 'General', icon: 'bed' },
  { id: 'nausea', name: 'Nausea', category: 'General', icon: 'medical' },
  { id: 'dizziness', name: 'Dizziness', category: 'General', icon: 'medical' },
  { id: 'rash', name: 'Rash', category: 'Skin', icon: 'body' },
  { id: 'swelling', name: 'Swelling', category: 'General', icon: 'medical' },
  { id: 'diarrhea', name: 'Diarrhea', category: 'General', icon: 'medical' },
  { id: 'constipation', name: 'Constipation', category: 'General', icon: 'medical' },
  { id: 'insomnia', name: 'Insomnia', category: 'General', icon: 'bed' },
];

const DURATION_OPTIONS: ChatOption[] = [
  { id: 'less_than_hour', text: 'Less than 1 hour', type: 'duration', value: 'less than 1 hour' },
  { id: 'few_hours', text: 'A few hours', type: 'duration', value: 'a few hours' },
  { id: 'one_day', text: '1 day', type: 'duration', value: '1 day' },
  { id: 'few_days', text: 'A few days', type: 'duration', value: 'a few days' },
  { id: 'one_week', text: '1 week', type: 'duration', value: '1 week' },
  { id: 'few_weeks', text: 'A few weeks', type: 'duration', value: 'a few weeks' },
  { id: 'one_month', text: '1 month', type: 'duration', value: '1 month' },
  { id: 'longer', text: 'Longer than 1 month', type: 'duration', value: 'longer than 1 month' },
];

const ChatbotScreen: React.FC = () => {
  const { messages, sendMessage, isTyping, isLoading } = useChatbot();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [showSeverityModal, setShowSeverityModal] = useState(false);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<number | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomDuration, setSymptomDuration] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animate in on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (inputText.trim()) {
      await sendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleSeveritySelect = (severity: number) => {
    setSelectedSeverity(severity);
    setShowSeverityModal(false);
  };

  const handleSymptomSelect = (symptomId: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleSymptomSubmit = async () => {
    if (selectedSymptoms.length > 0 && selectedSeverity !== null) {
      const symptomText = selectedSymptoms.map(id => 
        COMMON_SYMPTOMS.find(s => s.id === id)?.name
      ).join(', ');
      
      const message = `Symptoms: ${symptomText}, Severity: ${selectedSeverity}/10${symptomDuration ? `, Duration: ${symptomDuration}` : ''}${additionalNotes ? `, Notes: ${additionalNotes}` : ''}`;
      
      await sendMessage(message);
      
      // Reset form
      setSelectedSymptoms([]);
      setSelectedSeverity(null);
      setSymptomDuration('');
      setAdditionalNotes('');
    }
  };

  const handleQuickAction = (action: string) => {
    let message = '';
    switch (action) {
      case 'emergency':
        message = 'I need emergency help right now. What should I do?';
        break;
      case 'symptom_check':
        message = 'I\'m not feeling well and want to understand what might be wrong.';
        break;
      case 'medication_help':
        message = 'I need help understanding my medications or have questions about them.';
        break;
      case 'health_advice':
        message = 'I have general health questions and would like some advice.';
        break;
      case 'mental_health':
        message = 'I\'m struggling with my mental health and need support.';
        break;
      case 'pregnancy':
        message = 'I\'m pregnant and need advice for prenatal care.';
        break;
      case 'child_health':
        message = 'My child is sick and I need guidance on what to do.';
        break;
      case 'elderly_care':
        message = 'I need advice for elderly care or my aging parent.';
        break;
      case 'nutrition':
        message = 'I have questions about nutrition and healthy eating.';
        break;
      case 'exercise':
        message = 'I need advice about exercise and physical activity.';
        break;
    }
    setInputText(message);
  };

  const handleChatOption = async (option: ChatOption) => {
    let message = '';
    switch (option.type) {
      case 'severity':
        const severityText = SEVERITY_OPTIONS.find(s => s.value === option.value)?.label || '';
        message = `Severity: ${severityText} (${option.value}/10)`;
        break;
      case 'symptom':
        const symptom = COMMON_SYMPTOMS.find(s => s.id === option.value);
        message = `Symptom: ${symptom?.name || option.value}`;
        break;
      case 'duration':
        message = `Duration: ${option.text}`;
        break;
      case 'action':
        // Send the canonical action value when available so NLP can react
        message = String(option.value || option.text);
        break;
    }
    if (message) {
      await sendMessage(message);
    }
  };

  const renderChatOptions = (options: ChatOption[]) => (
    <View style={styles.chatOptionsContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.chatOption,
            { backgroundColor: option.color || '#2E7D32' }
          ]}
          onPress={() => handleChatOption(option)}
        >
          <Text style={styles.chatOptionText}>{option.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMessage = ({ item }: { item: any }) => (
    <Animated.View 
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.botMessage
      ]}
    >
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
        
        {!item.isUser && item.symptoms && item.symptoms.length > 0 && (
          <View style={styles.symptomsContainer}>
            <Text style={styles.symptomsLabel}>Detected symptoms:</Text>
            <Text style={styles.symptomsText}>{item.symptoms.join(', ')}</Text>
          </View>
        )}
        
        {!item.isUser && item.confidence && (
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceText}>
              Confidence: {(item.confidence * 100).toFixed(1)}%
            </Text>
          </View>
        )}
        
        {!item.isUser && item.nlpAnalysis && (
          <View style={styles.confidenceContainer}>
            {item.nlpAnalysis.sentimentLabel && (
              <Text style={styles.confidenceText}>
                Sentiment: {item.nlpAnalysis.sentimentLabel} {(item.nlpAnalysis.sentimentScore ?? 0).toFixed(2)}
              </Text>
            )}
          </View>
        )}

        {!item.isUser && item.options && (
          renderChatOptions(item.options)
        )}
      </View>
      
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </Animated.View>
  );

  const renderSeverityModal = () => (
    <Modal
      visible={showSeverityModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSeverityModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Severity Level</Text>
              <TouchableOpacity
                onPress={() => setShowSeverityModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.severityOptionsContainer}>
              {SEVERITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.severityOption,
                    selectedSeverity === option.value && styles.selectedSeverityOption
                  ]}
                  onPress={() => handleSeveritySelect(option.value)}
                >
                  <View style={[styles.severityIndicator, { backgroundColor: option.color }]} />
                  <View style={styles.severityTextContainer}>
                    <Text style={styles.severityLabel}>{option.label}</Text>
                    <Text style={styles.severityDescription}>{option.description}</Text>
                  </View>
                  <Text style={styles.severityValue}>{option.value}/10</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSymptomModal = () => (
    <Modal
      visible={showSymptomModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSymptomModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Symptoms</Text>
              <TouchableOpacity
                onPress={() => setShowSymptomModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.symptomOptionsContainer}>
              {COMMON_SYMPTOMS.map((symptom) => (
                <TouchableOpacity
                  key={symptom.id}
                  style={[
                    styles.symptomOption,
                    selectedSymptoms.includes(symptom.id) && styles.selectedSymptomOption
                  ]}
                  onPress={() => handleSymptomSelect(symptom.id)}
                >
                  <Ionicons 
                    name={symptom.icon as any} 
                    size={24} 
                    color={selectedSymptoms.includes(symptom.id) ? '#2E7D32' : '#666'} 
                  />
                  <View style={styles.symptomTextContainer}>
                    <Text style={[
                      styles.symptomName,
                      selectedSymptoms.includes(symptom.id) && styles.selectedSymptomName
                    ]}>
                      {symptom.name}
                    </Text>
                    <Text style={styles.symptomCategory}>{symptom.category}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSymptomSubmit}
              >
                <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                <Text style={styles.submitButtonText}>Submit Symptoms</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#2E7D32', '#1B5E20']}
                style={styles.avatar}
              >
                <Ionicons name="medical" size={24} color="white" />
              </LinearGradient>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Ask the Risk</Text>
              <Text style={styles.headerSubtitle}>AI Health Assistant</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="settings-outline" size={24} color="#2E7D32" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      {showQuickActions && messages.length <= 1 && (
        <Animated.View 
          style={[styles.quickActionsContainer, { opacity: fadeAnim }]}
        >
          <Text style={styles.quickActionsTitle}>How can I help you today?</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
          >
            {[
              { icon: 'warning', label: 'Emergency', action: 'emergency', color: '#F44336' },
              { icon: 'pills', label: 'Medication', action: 'medication_help', color: '#4CAF50' },
              { icon: 'help-circle', label: 'Health Advice', action: 'health_advice', color: '#FF9800' },
              { icon: 'heart', label: 'Mental Health', action: 'mental_health', color: '#9C27B0' },
            ].map((action, index) => (
              <TouchableOpacity
                key={action.action}
                style={[styles.quickActionButton, { backgroundColor: action.color }]}
                onPress={() => handleQuickAction(action.action)}
              >
                <Ionicons name={action.icon as any} size={20} color="white" />
                <Text style={styles.quickActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Messages */}
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />
        
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Tell AI about your health concern..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {renderSeverityModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#e8f5e8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    //
  },
  headerButton: {
    padding: 8,
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: 'hidden',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    //
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    fontFamily: fontFamily.headingMedium,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
    fontFamily: fontFamily.body,
  },
  quickActionsContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#e8f5e8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
    fontFamily: fontFamily.headingMedium,
  },
  quickActionsScroll: {
    flexDirection: 'row',
    paddingRight: 25,
  },
  quickActionButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 20,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 20,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 18,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userBubble: {
    backgroundColor: '#2E7D32',
    borderBottomRightRadius: 6,
  },
  botBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#e8f5e8',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamily.body,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    alignSelf: 'flex-end',
    fontFamily: fontFamily.body,
  },
  symptomsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e8f5e8',
  },
  symptomsLabel: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 4,
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
  },
  symptomsText: {
    fontSize: 14,
    color: '#666',
    fontFamily: fontFamily.body,
  },
  confidenceContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e8f5e8',
  },
  confidenceText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    fontFamily: fontFamily.body,
  },
  chatOptionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e8f5e8',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chatOption: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  chatOptionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
  },
  typingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  typingBubble: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8f5e8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typingDot1: {
    backgroundColor: '#2E7D32',
  },
  typingDot2: {
    backgroundColor: '#4CAF50',
  },
  typingDot3: {
    backgroundColor: '#8BC34A',
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e8f5e8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minHeight: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
    fontFamily: fontFamily.body,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonActive: {
    backgroundColor: '#2E7D32',
  },
  sendButtonInactive: {
    backgroundColor: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackground: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalContent: {
    padding: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    fontFamily: fontFamily.headingMedium,
  },
  closeButton: {
    padding: 8,
  },
  severityOptionsContainer: {
    maxHeight: 400,
  },
  severityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedSeverityOption: {
    backgroundColor: '#e8f5e8',
    borderColor: '#2E7D32',
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 15,
  },
  severityTextContainer: {
    flex: 1,
  },
  severityLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: fontFamily.bodySemiBold,
  },
  severityDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: fontFamily.body,
  },
  severityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    fontFamily: fontFamily.bodySemiBold,
  },
  symptomOptionsContainer: {
    maxHeight: 400,
  },
  symptomOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedSymptomOption: {
    backgroundColor: '#e8f5e8',
    borderColor: '#2E7D32',
  },
  symptomTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  symptomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: fontFamily.bodySemiBold,
  },
  selectedSymptomName: {
    color: '#2E7D32',
  },
  symptomCategory: {
    fontSize: 14,
    color: '#666',
    fontFamily: fontFamily.body,
  },
  modalFooter: {
    marginTop: 25,
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    padding: 18,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: fontFamily.buttonBold,
  },
});

export default ChatbotScreen; 