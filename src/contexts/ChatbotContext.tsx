import React, { createContext, useContext, useState, useEffect } from 'react';
import { dataService } from '../services/DataService';
import { databaseService } from '../services/DatabaseService';
import { advancedNLPService, ProcessedMessage, ChatOption, ConversationState } from '../services/AdvancedNLPService';
import { chatbotTrainingService } from '../services/ChatbotTrainingService';
import { useAuth } from './AuthContext';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  symptoms?: string[];
  intent?: string;
  nlpAnalysis?: ProcessedMessage;
  confidence?: number;
  options?: ChatOption[];
  conversationState?: ConversationState;
}

export interface SymptomData {
  symptoms: string[];
  severity: number;
  notes: string;
  confidence: number;
}

interface ChatbotContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  extractSymptoms: (text: string) => Promise<SymptomData>;
  loadChatHistory: () => Promise<void>;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};

export const ChatbotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      initializeChat();
    } else {
      // Clear messages when user logs out
      setMessages([]);
    }
  }, [user]);

  const initializeChat = async () => {
    if (!user) return;

    try {
      // Load chat history
      await loadChatHistory();
      
      // If no messages, add welcome message
      if (messages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome-' + Date.now(),
          text: `Hello ${user.name}! I'm Ada, your health assistant. I'm here to help you understand your symptoms and get the care you need. What symptoms are you experiencing today?`,
          isUser: false,
          timestamp: new Date(),
          intent: 'greeting',
          options: [
            { id: 'symptom_headache', text: 'Headache', type: 'symptom', value: 'headache' },
            { id: 'symptom_fever', text: 'Fever', type: 'symptom', value: 'fever' },
            { id: 'symptom_cough', text: 'Cough', type: 'symptom', value: 'cough' },
            { id: 'symptom_chest_pain', text: 'Chest Pain', type: 'symptom', value: 'chest_pain', color: '#FF3B30' },
            { id: 'symptom_diarrhea', text: 'Diarrhea', type: 'symptom', value: 'diarrhea' },
            { id: 'symptom_back_pain', text: 'Back Pain', type: 'symptom', value: 'back_pain' },
          ]
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  };

  const loadChatHistory = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const chatHistory = await dataService.getChatHistory(user.id, 50);
      
      const formattedMessages: ChatMessage[] = chatHistory.map(msg => ({
        id: msg.id,
        text: msg.text,
        isUser: msg.isUser,
        timestamp: msg.timestamp,
        symptoms: msg.extractedSymptoms,
        intent: msg.nlpAnalysis?.intent.intent
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!user || !text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Process message with advanced NLP service
      const processedMessage = await advancedNLPService.processMessage(text.trim());
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: processedMessage.response,
        isUser: false,
        timestamp: new Date(),
        symptoms: processedMessage.entities,
        intent: processedMessage.intent,
        nlpAnalysis: processedMessage,
        confidence: processedMessage.confidence,
        options: processedMessage.options,
        conversationState: processedMessage.conversationState
      };

      setMessages(prev => [...prev, botMessage]);

      // Save to database
      await databaseService.saveChatMessage({
        userId: user.id,
        text: text.trim(),
        isUser: true,
        timestamp: new Date().toISOString(),
        symptoms: processedMessage.entities.length > 0 ? JSON.stringify(processedMessage.entities) : undefined,
        intent: processedMessage.intent
      });

      await databaseService.saveChatMessage({
        userId: user.id,
        text: processedMessage.response,
        isUser: false,
        timestamp: new Date().toISOString(),
        intent: 'response'
      });

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error processing your message. Please try again or contact support if the problem persists.",
        isUser: false,
        timestamp: new Date(),
        intent: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    if (!user) return;
    
    const welcomeMessage: ChatMessage = {
      id: 'welcome-' + Date.now(),
      text: `Hello ${user.name}! I'm your AI health assistant. How are you feeling today?`,
      isUser: false,
      timestamp: new Date(),
      intent: 'greeting'
    };
    
    setMessages([welcomeMessage]);
  };

  const extractSymptoms = async (text: string): Promise<SymptomData> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const result = await dataService.processChatMessage(user.id, text);
      
      return {
        symptoms: result.extractedSymptoms || [],
        severity: result.nlpAnalysis.symptoms.severity,
        notes: text,
        confidence: result.nlpAnalysis.confidence
      };
    } catch (error) {
      console.error('Error extracting symptoms:', error);
      return {
        symptoms: [],
        severity: 5,
        notes: text,
        confidence: 0.1
      };
    }
  };

  const value: ChatbotContextType = {
    messages,
    isTyping,
    isLoading,
    sendMessage,
    clearChat,
    extractSymptoms,
    loadChatHistory
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
};