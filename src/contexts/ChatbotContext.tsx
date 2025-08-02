import React, { createContext, useContext, useState } from 'react';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  symptoms?: string[];
  intent?: string;
}

export interface SymptomData {
  symptoms: string[];
  severity: number;
  notes: string;
}

interface ChatbotContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  extractSymptoms: (text: string) => Promise<SymptomData>;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};

// Simple NLP for symptom extraction
class SimpleNLP {
  private symptomKeywords = {
    'headache': ['headache', 'head pain', 'migraine', 'head ache'],
    'fever': ['fever', 'temperature', 'hot', 'chills'],
    'cough': ['cough', 'coughing', 'dry cough', 'wet cough'],
    'fatigue': ['fatigue', 'tired', 'exhausted', 'weakness'],
    'nausea': ['nausea', 'sick', 'vomiting', 'queasy'],
    'pain': ['pain', 'ache', 'sore', 'hurt'],
    'dizziness': ['dizzy', 'lightheaded', 'vertigo'],
    'shortness of breath': ['breath', 'breathing', 'shortness', 'wheezing'],
    'chest pain': ['chest', 'heart', 'chest pain'],
    'abdominal pain': ['stomach', 'belly', 'abdominal', 'gut']
  };

  private severityKeywords = {
    'mild': ['mild', 'slight', 'little', 'minor'],
    'moderate': ['moderate', 'medium', 'some'],
    'severe': ['severe', 'bad', 'terrible', 'awful', 'extreme']
  };

  extractSymptoms(text: string): { symptoms: string[], severity: number } {
    const lowerText = text.toLowerCase();
    const symptoms: string[] = [];
    let severity = 5; // Default moderate

    // Extract symptoms
    for (const [symptom, keywords] of Object.entries(this.symptomKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          symptoms.push(symptom);
          break;
        }
      }
    }

    // Determine severity
    for (const [level, keywords] of Object.entries(this.severityKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          if (level === 'mild') severity = 3;
          else if (level === 'moderate') severity = 5;
          else if (level === 'severe') severity = 8;
          break;
        }
      }
    }

    // Additional severity indicators
    if (lowerText.includes('very') || lowerText.includes('really')) {
      severity = Math.min(10, severity + 2);
    }

    return { symptoms, severity };
  }

  generateResponse(userMessage: string, symptoms: string[]): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (symptoms.length === 0) {
      return "I understand you're not feeling well. Could you please describe your symptoms in more detail? For example, you could mention if you have a headache, fever, cough, or any other symptoms you're experiencing.";
    }

    if (symptoms.includes('headache')) {
      return "I see you're experiencing a headache. How long have you had it? Is it accompanied by any other symptoms like sensitivity to light or nausea?";
    }

    if (symptoms.includes('fever')) {
      return "You mentioned having a fever. Have you taken your temperature? A fever above 100.4°F (38°C) should be monitored closely.";
    }

    if (symptoms.includes('chest pain')) {
      return "Chest pain can be serious. If you're experiencing chest pain, especially if it's severe or accompanied by shortness of breath, please seek immediate medical attention.";
    }

    if (symptoms.length > 1) {
      return `I've identified several symptoms: ${symptoms.join(', ')}. This combination of symptoms should be evaluated by a healthcare professional. When did these symptoms start?`;
    }

    return "Thank you for sharing your symptoms. I recommend keeping track of when these symptoms occur and their severity. Consider consulting with a healthcare provider for proper evaluation.";
  }
}

export const ChatbotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hello! I'm your health assistant. I'm here to help you track your symptoms and provide health insights. How are you feeling today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const nlp = new SimpleNLP();

  const sendMessage = async (text: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { symptoms, severity } = nlp.extractSymptoms(text);
    const response = nlp.generateResponse(text, symptoms);

    const botMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: response,
      isUser: false,
      timestamp: new Date(),
      symptoms,
      intent: symptoms.length > 0 ? 'symptom_report' : 'general_inquiry'
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        text: "Hello! I'm your health assistant. I'm here to help you track your symptoms and provide health insights. How are you feeling today?",
        isUser: false,
        timestamp: new Date()
      }
    ]);
  };

  const extractSymptoms = async (text: string): Promise<SymptomData> => {
    const { symptoms, severity } = nlp.extractSymptoms(text);
    return {
      symptoms,
      severity,
      notes: text
    };
  };

  const value: ChatbotContextType = {
    messages,
    isTyping,
    sendMessage,
    clearChat,
    extractSymptoms
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
}; 