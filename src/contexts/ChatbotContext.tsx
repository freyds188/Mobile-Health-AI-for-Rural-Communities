import React, { createContext, useContext, useState, useEffect } from 'react';
import { dataService } from '../services/DataService';
import { NLPAnalysisResult } from '../services/NLPService';
import { useAuth } from './AuthContext';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  symptoms?: string[];
  intent?: string;
  nlpAnalysis?: NLPAnalysisResult;
  confidence?: number;
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
          text: `Hello ${user.name}! I'm your AI health assistant. I'm here to help you track your symptoms and provide health insights. How are you feeling today?`,
          isUser: false,
          timestamp: new Date(),
          intent: 'greeting'
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
      // Process message with enhanced NLP service
      const result = await dataService.processChatMessage(user.id, text.trim());
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: result.response,
        isUser: false,
        timestamp: new Date(),
        symptoms: result.extractedSymptoms,
        intent: result.nlpAnalysis.intent.intent,
        nlpAnalysis: result.nlpAnalysis,
        confidence: result.nlpAnalysis.confidence
      };

      setMessages(prev => [...prev, botMessage]);

      // If symptoms were detected, provide additional guidance
      if (result.extractedSymptoms && result.extractedSymptoms.length > 0) {
        setTimeout(() => {
          const followUpMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            text: "I've detected some symptoms in your message. Would you like me to help you log this information in your health records for tracking and analysis?",
            isUser: false,
            timestamp: new Date(),
            intent: 'follow_up'
          };
          setMessages(prev => [...prev, followUpMessage]);
        }, 1500);
      }

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