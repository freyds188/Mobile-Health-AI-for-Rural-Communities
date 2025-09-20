import { v4 as uuidv4 } from 'uuid';
let AsyncStorage: any;
let ExpoFileSystem: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  AsyncStorage = null;
}
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExpoFileSystem = require('expo-file-system');
} catch {
  ExpoFileSystem = null;
}

// Types and Interfaces
export interface ConversationState {
  currentStep: 'initial' | 'awaiting_symptoms' | 'awaiting_severity' | 'awaiting_duration' | 'complete';
  collectedSymptoms: string[];
  collectedSeverity: number | null;
  collectedDuration: string | null;
  sessionId: string;
}

export interface TrainingData {
  id: string;
  input: string;
  intent: string;
  entities: string[];
  response: string;
  confidence: number;
  timestamp: Date;
  sentimentLabel?: 'negative' | 'neutral' | 'positive';
  sentimentScore?: number;
}

export interface IntentData {
  intent: string;
  patterns: string[];
  responses: string[];
  confidence: number;
  trainingCount: number;
}

export interface EntityData {
  entity: string;
  synonyms: string[];
  category: string;
  confidence: number;
}

export interface NLPModel {
  intents: { [key: string]: IntentData };
  entities: { [key: string]: EntityData };
  vocabulary: Set<string>;
  wordVectors: { [key: string]: number[] };
  trainingData: TrainingData[];
  modelVersion: string;
  lastTrained: Date;
  accuracy: number;
  intentNB?: NaiveBayesModel;
}

export interface ProcessedMessage {
  id: string;
  originalText: string;
  processedText: string;
  intent: string;
  confidence: number;
  entities: string[];
  response: string;
  timestamp: Date;
  options?: ChatOption[];
  conversationState?: ConversationState;
  sentimentLabel?: 'negative' | 'neutral' | 'positive';
  sentimentScore?: number;
}

export interface ChatOption {
  id: string;
  text: string;
  type: 'symptom' | 'severity' | 'duration' | 'action';
  value?: any;
  color?: string;
  step?: 'symptoms' | 'severity' | 'duration';
}

export interface TrainingResult {
  success: boolean;
  accuracy: number;
  newIntents: number;
  newEntities: number;
  trainingTime: number;
  modelVersion: string;
}

export interface NaiveBayesModel {
  classes: string[];
  vocabulary: string[];
  priors: number[]; // log-priors
  condprob: { [cls: string]: number[] }; // log P(token|class)
}

class AdvancedNLPService {
  private model: NLPModel;
  private isModelLoaded: boolean = false;
  private readonly MODEL_KEY = 'advanced_nlp_model';
  private readonly VOCABULARY_SIZE = 10000;
  private readonly VECTOR_DIMENSION = 100;
  private conversationState: ConversationState;
  private readonly modelFileName: string = 'nlp-model.json';

  constructor() {
    this.model = this.initializeModel();
    this.conversationState = this.initializeConversationState();
    this.loadModel();
  }

  private initializeModel(): NLPModel {
    return {
      intents: {
        greeting: {
          intent: 'greeting',
          patterns: [
            'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
            'how are you', 'how do you do', 'nice to meet you'
          ],
          responses: [
            'Hello! How can I assist you today?',
            'Hi! How can I help?',
            'Welcome! What would you like to discuss?'
          ],
          confidence: 0.9,
          trainingCount: 0
        },
        duration_inquiry: {
          intent: 'duration_inquiry',
          patterns: [
            'how long', 'duration', 'since when', 'when did it start', 'how many days', 'how many hours'
          ],
          responses: [
            'Duration helps determine severity. How long have you had these symptoms?',
            'Let’s consider duration. When did your symptoms begin?'
          ],
          confidence: 0.7,
          trainingCount: 0
        },
        severity_inquiry: {
          intent: 'severity_inquiry',
          patterns: [
            'how bad', 'how severe', '1 to 10', 'scale of 1 to 10', 'severity level'
          ],
          responses: [
            'On a scale of 1 to 10, how severe are your symptoms?',
            'Please rate your symptom severity from 1 (very mild) to 10 (worst).'
          ],
          confidence: 0.7,
          trainingCount: 0
        },
        treatment_inquiry: {
          intent: 'treatment_inquiry',
          patterns: [
            'what should i do', 'treat', 'treatment', 'home remedy', 'medicine', 'medication'
          ],
          responses: [
            'I can share general guidance. For accurate advice, please also share symptoms, severity, and duration.',
            'Treatment depends on your symptoms and severity. Can you tell me more about how you feel?'
          ],
          confidence: 0.7,
          trainingCount: 0
        },
        general_health: {
          intent: 'general_health',
          patterns: [
            'general health', 'health advice', 'tips', 'how to stay healthy', 'prevent getting sick'
          ],
          responses: [
            'Happy to help with general health advice. Are you experiencing any symptoms today?',
            'I can share prevention and wellness tips. Would you like to start a quick symptom check as well?'
          ],
          confidence: 0.7,
          trainingCount: 0
        },
        mental_health_support: {
          intent: 'mental_health_support',
          patterns: [
            'anxiety', 'depression', 'panic', 'stress', 'lonely', 'hopeless', 'insomnia', 'burnout'
          ],
          responses: [
            'Thank you for sharing. Mental health matters. I can offer coping tips and help you consider next steps. Would you like breathing techniques, grounding tips, or to talk about triggers?',
            'I hear you. For mental health support, small steps can help. Would you like stress-reduction tips or to start a brief check-in?'
          ],
          confidence: 0.8,
          trainingCount: 0
        },
        yes: {
          intent: 'yes',
          patterns: ['yes', 'yeah', 'yep', 'correct', 'that\'s right'],
          responses: [
            'Got it. Let’s continue.',
            'Thanks for confirming. We’ll proceed.'
          ],
          confidence: 0.8,
          trainingCount: 0
        },
        no: {
          intent: 'no',
          patterns: ['no', 'nope', 'not really', 'that\'s not it'],
          responses: [
            'Thanks for clarifying. Could you rephrase or add a detail?',
            'Understood. Please tell me more so I can help better.'
          ],
          confidence: 0.8,
          trainingCount: 0
        },
        small_talk: {
          intent: 'small_talk',
          patterns: [
            'how are you', 'who are you', 'what can you do', 'tell me about yourself',
            'thank you', 'thanks', 'appreciate it', 'you are helpful'
          ],
          responses: [
            "I'm here to help you with health questions and symptom checks. How are you feeling today?",
            "Thanks for asking! I'm focused on your health. What symptoms or questions do you have?",
            "I can help assess symptoms, suggest next steps, and share general health info. What would you like to talk about?"
          ],
          confidence: 0.85,
          trainingCount: 0
        },
        symptom_report: {
          intent: 'symptom_report',
          patterns: [
            'i have', 'i am experiencing', 'i feel', 'i am feeling', 'my .* hurts',
            'experiencing', 'suffering from', 'dealing with', 'been having',
            'pain in', 'ache in', 'discomfort in', 'problem with'
          ],
          responses: [
            'I understand you\'re not feeling well, and I\'m here to help. Let me ask you a few questions to better understand your situation:\n\nHow severe are your symptoms?',
            'Thank you for sharing this with me. I want to make sure you get the right care. Let me help you assess your symptoms:\n\nHow would you rate your pain or discomfort?',
            'I\'m here to support you and help you understand what might be going on. Let\'s start by understanding your symptoms better:\n\nHow intense are your symptoms?'
          ],
          confidence: 0.85,
          trainingCount: 0
        },
        emergency: {
          intent: 'emergency',
          patterns: [
            'emergency', 'urgent', 'serious', 'cannot breathe', 'chest pain',
            'heart attack', 'stroke', 'severe pain', 'unconscious', 'bleeding',
            'broken bone', 'head injury', 'snake bite', 'animal bite'
          ],
          responses: [
            'This sounds like it needs immediate attention. I\'m here to help you get the right care quickly.\n\n🚨 What to do right now:\n• Call emergency services (911 or your local emergency number)\n• If you can\'t call, send someone to get help immediately\n• Stay calm and keep the person comfortable\n• Don\'t attempt to drive long distances if seriously injured\n• Apply first aid if you\'re trained to do so\n\nCan you tell me more about what\'s happening? I\'m here to guide you through this.',
            'This appears to be an emergency situation that requires immediate medical attention.\n\n🚨 Immediate actions:\n• Call emergency services right away\n• If you\'re in a remote area, send someone to get help\n• Keep the person warm and still\n• Don\'t move them if you suspect a spinal injury\n• Apply direct pressure to any bleeding\n\nWhat type of emergency are you experiencing? I\'ll help you through this.',
            'This requires urgent medical attention. Let me help you get the care you need.\n\n🚨 Emergency steps:\n• Contact emergency services immediately\n• If you\'re in a remote location, send someone for help\n• Stay with the person\n• Keep them comfortable and monitor their condition\n• Watch their breathing and level of consciousness\n\nWhat kind of emergency is this? I\'m here to support you.'
          ],
          confidence: 0.95,
          trainingCount: 0
        },
        rural_health_guidance: {
          intent: 'rural_health_guidance',
          patterns: [
            'rural', 'remote', 'village', 'farm', 'countryside', 'isolated',
            'no doctor', 'no hospital', 'far from clinic', 'limited access',
            'local resources', 'community health', 'traditional medicine'
          ],
          responses: [
            'For rural health situations:\n\n🏥 NEAREST RESOURCES:\n- Community health workers\n- Traditional healers (if culturally appropriate)\n- Mobile clinics\n- Telemedicine services\n\n💡 SELF-CARE OPTIONS:\n- First aid kits\n- Herbal remedies (if safe)\n- Rest and hydration\n\nWhat specific rural health concern do you have?',
            'RURAL HEALTHCARE GUIDANCE:\n\n📞 CONTACT OPTIONS:\n- Local community health worker\n- Nearest clinic (even if far)\n- Emergency hotlines\n- Telemedicine apps\n\n🏠 HOME CARE:\n- Keep basic medical supplies\n- Learn first aid\n- Know emergency contacts\n\nWhat\'s your specific situation?',
            'RURAL HEALTH SUPPORT:\n\n🔍 FINDING HELP:\n- Ask neighbors for local resources\n- Contact village health workers\n- Use community networks\n- Consider traditional medicine (if appropriate)\n\n📱 TECHNOLOGY:\n- Telemedicine services\n- Health apps\n- Emergency apps\n\nWhat rural health issue are you facing?'
          ],
          confidence: 0.9,
          trainingCount: 0
        },
        pain_assessment: {
          intent: 'pain_assessment',
          patterns: [
            'pain', 'hurt', 'ache', 'sore', 'discomfort', 'burning', 'sharp pain',
            'dull pain', 'throbbing', 'cramping', 'stabbing'
          ],
          responses: [
            'PAIN ASSESSMENT FOR RURAL SETTINGS:\n\n📊 SEVERITY SCALE:\n1-3: Mild (manage at home)\n4-6: Moderate (consider local help)\n7-10: Severe (seek immediate care)\n\n📍 LOCATION MATTERS:\n- Head/chest: URGENT\n- Abdomen: Monitor closely\n- Limbs: Assess mobility\n\n🚗 TRANSPORT:\n- Can you travel safely?\n- Distance to nearest care?\n- Available transportation?\n\nWhat\'s your pain level and location?',
            'RURAL PAIN EVALUATION:\n\n⚠️ RED FLAGS (Need immediate care):\n- Chest pain\n- Severe head pain\n- Abdominal pain with fever\n- Pain with numbness/weakness\n\n✅ SAFE TO MONITOR:\n- Mild muscle aches\n- Minor cuts/scrapes\n- Mild headaches\n\n🚑 WHEN TO SEEK HELP:\n- Pain >7/10\n- Pain lasting >24 hours\n- Pain with other symptoms\n\nDescribe your pain:',
            'PAIN MANAGEMENT FOR REMOTE AREAS:\n\n🏠 HOME CARE:\n- Rest and elevation\n- Ice/heat therapy\n- Over-the-counter pain relievers\n- Gentle movement\n\n🚨 EMERGENCY SIGNS:\n- Severe pain\n- Pain with fever\n- Pain with injury\n- Pain affecting daily activities\n\nWhat type and level of pain are you experiencing?'
          ],
          confidence: 0.9,
          trainingCount: 0
        },
        local_resources: {
          intent: 'local_resources',
          patterns: [
            'where to go', 'nearest', 'local doctor', 'community health',
            'health worker', 'clinic', 'hospital', 'medical help',
            'traditional medicine', 'herbal', 'home remedies'
          ],
          responses: [
            'LOCAL RURAL HEALTH RESOURCES:\n\n🏥 HEALTHCARE PROVIDERS:\n- Community health workers\n- Village clinics\n- Mobile medical units\n- Traditional healers (if appropriate)\n\n📞 CONTACT METHODS:\n- Local health hotlines\n- Community WhatsApp groups\n- Village health committees\n- Emergency contacts\n\n🚗 TRANSPORT OPTIONS:\n- Community vehicles\n- Motorcycle taxis\n- Ambulance services\n- Neighbor assistance\n\nWhat type of care do you need?',
            'FINDING RURAL HEALTHCARE:\n\n🔍 LOCAL NETWORKS:\n- Ask village elders\n- Contact community leaders\n- Check with local schools\n- Use community notice boards\n\n📱 DIGITAL RESOURCES:\n- Health apps with offline maps\n- Emergency contact lists\n- Telemedicine services\n- Health information hotlines\n\n🏠 TRADITIONAL OPTIONS:\n- Local herbalists\n- Traditional birth attendants\n- Community healers\n- Home remedies (if safe)\n\nWhat specific resource are you looking for?',
            'RURAL HEALTHCARE ACCESS:\n\n📍 LOCATION-BASED HELP:\n- Nearest clinic (even if far)\n- Community health workers\n- Mobile clinics schedule\n- Emergency response teams\n\n📞 COMMUNICATION:\n- Local radio announcements\n- Community messengers\n- Emergency signal systems\n- Health hotlines\n\n💡 ALTERNATIVE CARE:\n- First aid training\n- Home nursing skills\n- Preventive care\n- Health education\n\nWhat\'s your location and what care do you need?'
          ],
          confidence: 0.85,
          trainingCount: 0
        },
        preventive_care: {
          intent: 'preventive_care',
          patterns: [
            'prevent', 'avoid', 'stay healthy', 'wellness', 'nutrition',
            'exercise', 'vaccination', 'clean water', 'sanitation',
            'pregnancy care', 'child health', 'elderly care'
          ],
          responses: [
            'RURAL PREVENTIVE HEALTHCARE:\n\n💧 WATER & SANITATION:\n- Boil drinking water\n- Use clean latrines\n- Wash hands regularly\n- Keep food covered\n\n🍎 NUTRITION:\n- Eat local fruits/vegetables\n- Include protein sources\n- Drink clean water\n- Avoid spoiled food\n\n💉 VACCINATIONS:\n- Attend mobile vaccination clinics\n- Keep vaccination records\n- Follow immunization schedules\n- Ask about free vaccines\n\nWhat preventive care do you need?',
            'STAYING HEALTHY IN RURAL AREAS:\n\n🏃‍♂️ PHYSICAL ACTIVITY:\n- Daily walking\n- Farming activities\n- Traditional games\n- Community sports\n\n🥗 NUTRITION:\n- Local food diversity\n- Clean water access\n- Food preservation\n- Balanced meals\n\n🏥 REGULAR CHECK-UPS:\n- Mobile clinic visits\n- Community health days\n- Pregnancy care\n- Child growth monitoring\n\nWhat health prevention topic interests you?',
            'RURAL WELLNESS GUIDANCE:\n\n👶 MATERNAL & CHILD HEALTH:\n- Prenatal care visits\n- Safe delivery practices\n- Child nutrition\n- Growth monitoring\n\n👴 ELDERLY CARE:\n- Regular health checks\n- Medication management\n- Fall prevention\n- Social support\n\n🌿 TRADITIONAL WELLNESS:\n- Local herbal remedies\n- Traditional exercise\n- Community support\n- Cultural practices\n\nWhat preventive health area do you want to learn about?'
          ],
          confidence: 0.8,
          trainingCount: 0
        },
        health_inquiry: {
          intent: 'health_inquiry',
          patterns: [
            'what is', 'what are', 'how to', 'can you explain', 'tell me about',
            'information about', 'help with', 'advice on', 'recommendation for',
            'questions', 'health questions', 'general health'
          ],
          responses: [
            'I\'d be happy to help you with health information! I can provide guidance on:\n\n🏥 Medical Topics:\n• Understanding common symptoms and conditions\n• First aid and emergency care\n• Preventive health and wellness\n• Medication safety and interactions\n\n👶 Special Populations:\n• Child health and development\n• Pregnancy and maternal care\n• Elderly care and aging health\n• Mental health and emotional wellness\n\n💡 General Health:\n• Nutrition and healthy eating\n• Exercise and physical activity\n• Sleep and stress management\n• Preventive screenings and check-ups\n\nWhat specific topic would you like to learn about?',
            'Great question! I\'m here to help you understand your health better. I can share information about:\n\n📖 Common Health Concerns:\n• Digestive issues and stomach problems\n• Respiratory symptoms and breathing\n• Skin conditions and rashes\n• Pain management and relief\n\n🏠 Self-Care and Prevention:\n• Basic first aid and home care\n• Healthy lifestyle choices\n• Stress management techniques\n• Preventive health measures\n\n🚨 When to Seek Care:\n• Recognizing emergency symptoms\n• Understanding when to see a doctor\n• Preparing for medical appointments\n• Managing chronic conditions\n\nWhat area of health would you like to explore?',
            'I\'m here to help you make informed decisions about your health. I can guide you on:\n\n🔬 Understanding Your Health:\n• Recognizing symptoms and warning signs\n• Understanding test results and diagnoses\n• Making healthy lifestyle choices\n• Managing chronic conditions\n\n📱 Accessing Healthcare:\n• Finding the right healthcare provider\n• Preparing for medical appointments\n• Understanding insurance and costs\n• Telemedicine and virtual care options\n\n💪 Wellness and Prevention:\n• Building healthy habits\n• Managing stress and mental health\n• Exercise and nutrition guidance\n• Preventive care and screenings\n\nWhat would you like to know more about?'
          ],
          confidence: 0.8,
          trainingCount: 0
        },
        goodbye: {
          intent: 'goodbye',
          patterns: [
            'goodbye', 'bye', 'see you', 'talk to you later', 'thanks bye',
            'thank you bye', 'have a good day', 'take care', 'thanks', 'thank you'
          ],
          responses: [
            'Take care! Remember these simple ways to stay healthy:\n• Keep emergency contacts easily accessible\n• Maintain a basic first aid kit at home\n• Stay connected with your healthcare providers\n• Don\'t hesitate to seek help when you need it\n\nI\'m always here when you need support. Stay healthy and well!',
            'Goodbye! Here are some helpful reminders for your health:\n• Know where to find medical care in your area\n• Keep essential health supplies at home\n• Stay up to date with preventive care\n• Build a support network for your health needs\n\nTake care of yourself and those you love!',
            'See you soon! Quick health tips to remember:\n• Stay hydrated and eat nutritious foods\n• Maintain good hygiene practices\n• Keep emergency numbers handy\n• Prioritize your mental and physical wellness\n\nI\'ll be here when you need me. Stay well!'
          ],
          confidence: 0.9,
          trainingCount: 0
        }
      },
      entities: {
        headache: {
          entity: 'headache',
          synonyms: ['head pain', 'migraine', 'head ache', 'head hurting', 'head pounding'],
          category: 'symptom',
          confidence: 0.9
        },
        back_pain: {
          entity: 'back pain',
          synonyms: ['lower back pain', 'backache', 'back hurt', 'back hurting'],
          category: 'symptom',
          confidence: 0.85
        },
        shortness_of_breath: {
          entity: 'shortness of breath',
          synonyms: ['cannot breathe', 'breathing difficulty', 'dyspnea', 'out of breath'],
          category: 'symptom',
          confidence: 0.9
        },
        nausea: {
          entity: 'nausea',
          synonyms: ['queasy', 'sick to stomach', 'vomit', 'vomiting'],
          category: 'symptom',
          confidence: 0.85
        },
        dizziness: {
          entity: 'dizziness',
          synonyms: ['lightheaded', 'light-headed', 'vertigo', 'faint'],
          category: 'symptom',
          confidence: 0.85
        },
        joint_pain: {
          entity: 'joint pain',
          synonyms: ['knee pain', 'elbow pain', 'arthritic pain', 'arthritis pain'],
          category: 'symptom',
          confidence: 0.85
        },
        mental_health: {
          entity: 'mental health',
          synonyms: ['anxiety', 'depression', 'panic', 'stress', 'lonely', 'hopeless'],
          category: 'context',
          confidence: 0.8
        },
        chest_pain: {
          entity: 'chest pain',
          synonyms: ['chest discomfort', 'chest tightness', 'chest ache', 'heart pain'],
          category: 'symptom',
          confidence: 0.9
        },
        fever: {
          entity: 'fever',
          synonyms: ['high temperature', 'hot', 'temperature', 'febrile', 'burning up'],
          category: 'symptom',
          confidence: 0.9
        },
        cough: {
          entity: 'cough',
          synonyms: ['coughing', 'dry cough', 'wet cough', 'hacking', 'chest cough'],
          category: 'symptom',
          confidence: 0.9
        },
        diarrhea: {
          entity: 'diarrhea',
          synonyms: ['loose stools', 'watery stools', 'stomach upset', 'running stomach'],
          category: 'symptom',
          confidence: 0.9
        },
        snake_bite: {
          entity: 'snake bite',
          synonyms: ['snake attack', 'snake wound', 'venomous bite'],
          category: 'emergency',
          confidence: 0.95
        },
        animal_bite: {
          entity: 'animal bite',
          synonyms: ['dog bite', 'cat bite', 'wild animal bite', 'rabies risk'],
          category: 'emergency',
          confidence: 0.9
        },
        broken_bone: {
          entity: 'broken bone',
          synonyms: ['fracture', 'broken arm', 'broken leg', 'bone injury'],
          category: 'emergency',
          confidence: 0.9
        },
        pregnancy: {
          entity: 'pregnancy',
          synonyms: ['pregnant', 'expecting', 'baby', 'maternal health'],
          category: 'health',
          confidence: 0.9
        },
        child_health: {
          entity: 'child health',
          synonyms: ['baby', 'child', 'infant', 'pediatric', 'children'],
          category: 'health',
          confidence: 0.9
        },
        elderly: {
          entity: 'elderly',
          synonyms: ['old', 'senior', 'aged', 'elder', 'grandparent'],
          category: 'health',
          confidence: 0.9
        },
        rural_location: {
          entity: 'rural location',
          synonyms: ['village', 'farm', 'remote', 'countryside', 'isolated'],
          category: 'context',
          confidence: 0.9
        },
        emergency: {
          entity: 'emergency',
          synonyms: ['urgent', 'serious', 'critical', 'immediate'],
          category: 'priority',
          confidence: 0.95
        }
      },
      vocabulary: new Set(),
      wordVectors: {},
      trainingData: [],
      modelVersion: '1.0.0',
      lastTrained: new Date(),
      accuracy: 0.0
    };
  }

  private initializeConversationState(): ConversationState {
    return {
      currentStep: 'initial',
      collectedSymptoms: [],
      collectedSeverity: null,
      collectedDuration: null,
      sessionId: uuidv4()
    };
  }

  private resetConversationState(): void {
    this.conversationState = this.initializeConversationState();
  }

  private async loadModel(): Promise<void> {
    try {
      let savedModel: string | null = null;
      if (AsyncStorage) {
        savedModel = await AsyncStorage.getItem(this.MODEL_KEY);
      }
      if (!savedModel && ExpoFileSystem) {
        const dir = ExpoFileSystem.cacheDirectory || ExpoFileSystem.documentDirectory;
        const fileUri = `${dir}${this.modelFileName}`;
        const info = await ExpoFileSystem.getInfoAsync(fileUri);
        if (info.exists) {
          savedModel = await ExpoFileSystem.readAsStringAsync(fileUri);
        }
      }
      if (savedModel) {
        const parsedModel = JSON.parse(savedModel);
        // Convert Set back from array
        parsedModel.vocabulary = new Set(parsedModel.vocabulary);
        this.model = parsedModel;
        console.log('✅ Advanced NLP Model loaded successfully');
      }
      this.isModelLoaded = true;
    } catch (error) {
      console.error('❌ Failed to load NLP model:', error);
      this.isModelLoaded = true; // Use default model
    }
  }

  // Try to reload model from Expo FileSystem (downloaded via registry)
  async reloadFromFileSystemIfAvailable(): Promise<boolean> {
    try {
      if (!ExpoFileSystem) return false;
      const dir = ExpoFileSystem.cacheDirectory || ExpoFileSystem.documentDirectory;
      const fileUri = `${dir}${this.modelFileName}`;
      const info = await ExpoFileSystem.getInfoAsync(fileUri);
      if (!info.exists) return false;
      const content = await ExpoFileSystem.readAsStringAsync(fileUri);
      const parsed = JSON.parse(content);
      parsed.vocabulary = new Set(parsed.vocabulary);
      this.model = parsed;
      await this.saveModel();
      console.log('✅ Advanced NLP Model reloaded from FileSystem');
      return true;
    } catch (e) {
      return false;
    }
  }

  private async saveModel(): Promise<void> {
    try {
      // Convert Set to array for storage
      const modelToSave = {
        ...this.model,
        vocabulary: Array.from(this.model.vocabulary)
      };
      const serialized = JSON.stringify(modelToSave);
      if (AsyncStorage) {
        await AsyncStorage.setItem(this.MODEL_KEY, serialized);
        console.log('✅ Advanced NLP Model saved successfully');
      }
      if (ExpoFileSystem) {
        const dir = ExpoFileSystem.cacheDirectory || ExpoFileSystem.documentDirectory;
        const fileUri = `${dir}${this.modelFileName}`;
        await ExpoFileSystem.writeAsStringAsync(fileUri, serialized);
      }
    } catch (error) {
      console.error('❌ Failed to save NLP model:', error);
    }
  }

  async processMessage(text: string): Promise<ProcessedMessage> {
    if (!this.isModelLoaded) {
      await this.loadModel();
    }

    // Quick-action short-circuit
    const qa = this.handleQuickActionIfAny(text);
    if (qa.handled && qa.response) {
      const result: ProcessedMessage = {
        id: uuidv4(),
        originalText: text,
        processedText: text,
        intent: 'action',
        confidence: 0.9,
        entities: [],
        response: qa.response.response,
        options: qa.response.options,
        conversationState: { ...this.conversationState },
        timestamp: new Date()
      };
      return result;
    }

    const processedText = this.preprocessText(text);
    const sentiment = this.analyzeSentiment(processedText);
    const intent = this.classifyIntent(processedText);
    const entities = this.extractEntities(processedText);

    // Handle conversation flow based on current step
    let responseData: { response: string; options?: ChatOption[] };
    let conversationState = this.conversationState;

    switch (this.conversationState.currentStep) {
      case 'initial':
        // First interaction - ask for symptoms
        if (intent.intent === 'symptom_report' || entities.length > 0) {
          // User mentioned symptoms, move to severity
          this.conversationState.collectedSymptoms = entities;
          this.conversationState.currentStep = 'awaiting_severity';
          responseData = this.generateSeverityQuestion(entities);
        } else if (intent.intent === 'greeting') {
          // Greeting - ask for symptoms
          this.conversationState.currentStep = 'awaiting_symptoms';
          responseData = this.generateSymptomQuestion();
        } else {
          // Other intents - ask for symptoms
          this.conversationState.currentStep = 'awaiting_symptoms';
          responseData = this.generateSymptomQuestion();
        }
        break;

      case 'awaiting_symptoms':
        // User should provide symptoms
        if (entities.length > 0) {
          // Symptoms detected, move to severity
          this.conversationState.collectedSymptoms = entities;
          this.conversationState.currentStep = 'awaiting_severity';
          responseData = this.generateSeverityQuestion(entities);
        } else if (intent.intent === 'greeting' || intent.intent === 'goodbye') {
          // Reset conversation for new greeting
          this.resetConversationState();
          this.conversationState.currentStep = 'awaiting_symptoms';
          responseData = this.generateSymptomQuestion();
        } else {
          // No symptoms detected, ask again
          responseData = this.generateSymptomQuestion();
        }
        break;

      case 'awaiting_severity':
        // User should provide severity
        const severity = this.extractSeverity(text);
        if (severity !== null) {
          // Severity detected, move to duration
          this.conversationState.collectedSeverity = severity;
          this.conversationState.currentStep = 'awaiting_duration';
          responseData = this.generateDurationQuestion();
        } else if (entities.length > 0) {
          // New symptoms mentioned, update and ask for severity
          this.conversationState.collectedSymptoms = entities;
          responseData = this.generateSeverityQuestion(entities);
        } else {
          // No severity detected, ask again
          responseData = this.generateSeverityQuestion(this.conversationState.collectedSymptoms);
        }
        break;

      case 'awaiting_duration':
        // User should provide duration
        const duration = this.extractDuration(text);
        if (duration !== null) {
          // Duration detected, provide final assessment
          this.conversationState.collectedDuration = duration;
          this.conversationState.currentStep = 'complete';
          responseData = this.generateFinalAssessment();
        } else if (entities.length > 0) {
          // New symptoms mentioned, reset to severity
          this.conversationState.collectedSymptoms = entities;
          this.conversationState.currentStep = 'awaiting_severity';
          responseData = this.generateSeverityQuestion(entities);
        } else {
          // No duration detected, ask again
          responseData = this.generateDurationQuestion();
        }
        break;

      case 'complete':
        // Conversation complete, reset for new interaction
        if (intent.intent === 'symptom_report' || entities.length > 0) {
          // New symptoms mentioned, start new assessment
          this.resetConversationState();
          this.conversationState.collectedSymptoms = entities;
          this.conversationState.currentStep = 'awaiting_severity';
          responseData = this.generateSeverityQuestion(entities);
        } else if (intent.intent === 'greeting') {
          // New greeting, reset conversation
          this.resetConversationState();
          this.conversationState.currentStep = 'awaiting_symptoms';
          responseData = this.generateSymptomQuestion();
        } else {
          // Other intents, provide general response
          responseData = this.generateResponse(intent, entities, processedText);
        }
        break;

      default:
        responseData = this.generateResponse(intent, entities, processedText);
    }

    const result: ProcessedMessage = {
      id: uuidv4(),
      originalText: text,
      processedText,
      intent: intent.intent,
      confidence: intent.confidence,
      entities,
      response: responseData.response,
      options: responseData.options,
      conversationState: { ...this.conversationState },
      timestamp: new Date(),
      sentimentLabel: sentiment.label,
      sentimentScore: sentiment.score
    };

    // Store for training
    this.addTrainingData(text, intent.intent, entities, responseData.response, intent.confidence, sentiment);

    return result;
  }

  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  private classifyIntent(text: string): { intent: string; confidence: number } {
    // Prefer trained Naive Bayes if available
    const nbResult = this.nbClassify(text);
    if (nbResult) return nbResult;

    // Fallback to pattern-based scoring
    let bestIntent = 'unknown';
    let bestScore = 0;

    for (const [intentName, intentData] of Object.entries(this.model.intents)) {
      const score = this.calculateIntentScore(text, intentData);
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intentName;
      }
    }

    return {
      intent: bestIntent,
      confidence: Math.min(0.95, bestScore)
    };
  }

  private calculateIntentScore(text: string, intentData: IntentData): number {
    const words = text.split(' ');
    let score = 0;
    let matches = 0;

    for (const pattern of intentData.patterns) {
      if (pattern.includes('.*')) {
        // Regex pattern
        const regex = new RegExp(pattern, 'i');
        if (regex.test(text)) {
          score += 2;
          matches++;
        }
      } else {
        // Simple word matching
        if (text.includes(pattern.toLowerCase())) {
          score += 1;
          matches++;
        }
      }
    }

    // Boost score based on training count
    const trainingBoost = Math.min(0.3, intentData.trainingCount * 0.01);
    
    return (score / Math.max(1, intentData.patterns.length)) + trainingBoost;
  }

  private analyzeSentiment(text: string): { label: 'negative' | 'neutral' | 'positive'; score: number } {
    // Use seeded lexicon if available
    const modelAny: any = this.model as any;
    const lexicon: Record<string, number> | undefined = modelAny?.wordVectors?.sentimentLexicon;
    const intensifiers = ['very', 'extremely', 'really', 'severely', 'quite'];
    const negations = ['not', "don't", 'no', "isn't", "can't", 'never'];

    const tokens = text.split(/\s+/);
    let score = 0;
    for (let i = 0; i < tokens.length; i++) {
      const w = tokens[i];
      const prev = tokens[i - 1] || '';
      const hasIntensifier = intensifiers.includes(prev);
      const isNegated = negations.includes(prev);

      let wordScore = 0;
      if (lexicon && Object.prototype.hasOwnProperty.call(lexicon, w)) {
        wordScore = lexicon[w]; // -1..1
      } else {
        // Fallback tiny lexicon
        const negativeWords = ['worried', 'scared', 'afraid', 'pain', 'hurts', 'bad', 'terrible', 'awful', 'severe', 'anxious', 'sad', 'depressed', 'panic', 'hopeless'];
        const positiveWords = ['better', 'improved', 'okay', 'fine', 'good', 'relieved', 'calm', 'hope', 'hopeful'];
        if (negativeWords.includes(w)) wordScore = -0.6;
        if (positiveWords.includes(w)) wordScore = 0.6;
      }

      if (wordScore !== 0) {
        const factor = (hasIntensifier ? 1.5 : 1.0) * (isNegated ? -1 : 1);
        score += wordScore * factor;
      }
    }
    // Normalize approximately to -1..1
    const clamped = Math.max(-2, Math.min(2, score)) / 2;
    const label: 'negative' | 'neutral' | 'positive' = clamped > 0.25 ? 'positive' : clamped < -0.25 ? 'negative' : 'neutral';
    return { label, score: clamped };
  }

  private extractEntities(text: string): string[] {
    const entities: string[] = [];
    
    for (const [entityName, entityData] of Object.entries(this.model.entities)) {
      // Check main entity name
      if (text.includes(entityName.toLowerCase())) {
        entities.push(entityName);
        continue;
      }
      
      // Check synonyms
      for (const synonym of entityData.synonyms) {
        if (text.includes(synonym.toLowerCase())) {
          entities.push(entityName);
          break;
        }
      }
    }

    return entities;
  }

  // Lightweight quick-action handling for interactive options
  private handleQuickActionIfAny(text: string): { handled: boolean; response?: { response: string; options?: ChatOption[] } } {
    const lower = text.toLowerCase();
    if (lower.includes('start_assessment')) {
      this.resetConversationState();
      this.conversationState.currentStep = 'awaiting_symptoms';
      return { handled: true, response: this.generateSymptomQuestion() };
    }
    if (lower.includes('mh_breathe')) {
      return {
        handled: true,
        response: {
          response: 'Let’s try a 4-7-8 breathing exercise: Inhale for 4, hold for 7, exhale for 8. Repeat 4 times. Would you like grounding tips too?',
          options: [
            { id: 'mh_ground', text: 'Grounding tips', type: 'action', value: 'mh_ground' },
            { id: 'start_symptom_assessment', text: 'Start symptom check', type: 'action', value: 'start_assessment' }
          ]
        }
      };
    }
    if (lower.includes('mh_ground')) {
      return {
        handled: true,
        response: {
          response: '5-4-3-2-1 grounding: Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste. Want to discuss triggers?',
          options: [
            { id: 'mh_triggers', text: 'Discuss triggers', type: 'action', value: 'mh_triggers' },
            { id: 'start_symptom_assessment', text: 'Start symptom check', type: 'action', value: 'start_assessment' }
          ]
        }
      };
    }
    if (lower.includes('new_assessment')) {
      this.resetConversationState();
      this.conversationState.currentStep = 'awaiting_symptoms';
      return { handled: true, response: this.generateSymptomQuestion() };
    }
    if (lower.includes('emergency_help')) {
      return {
        handled: true,
        response: {
          response: '🚨 This requires urgent attention. Please call emergency services immediately. If you lack signal, have someone seek help now. Keep the person calm and still. Do not attempt long-distance travel. Would you like to start a new assessment?',
          options: [
            { id: 'action_new_assessment', text: 'New Assessment', type: 'action', value: 'new_assessment' }
          ]
        }
      };
    }
    if (lower.includes('log_assessment')) {
      return {
        handled: true,
        response: {
          response: '📘 I will save this assessment to your health log. You can start a new assessment anytime.',
          options: [
            { id: 'action_new_assessment', text: 'New Assessment', type: 'action', value: 'new_assessment' }
          ]
        }
      };
    }
    return { handled: false };
  }

  private generateResponse(intent: { intent: string; confidence: number }, entities: string[], text: string): { response: string; options?: ChatOption[] } {
    // Advice generation for advice-like intents
    if (['treatment_inquiry', 'general_health', 'health_inquiry', 'preventive_care'].includes(intent.intent)) {
      try {
        // Dynamic import to avoid circular deps
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { adviceService } = require('./AdviceService');
        const advice = adviceService.generateAdvice({
          intent: intent.intent,
          entities,
          severity: this.conversationState.collectedSeverity,
          durationText: this.conversationState.collectedDuration
        });
        const options: ChatOption[] = [
          { id: 'start_assessment', text: 'Start symptom check', type: 'action', value: 'start_assessment' },
          { id: 'clarify_add_symptom', text: 'Add symptom', type: 'symptom', value: 'other' },
          { id: 'clarify_severity', text: 'Share severity', type: 'severity', value: 5 },
        ];
        return { response: advice.text, options };
      } catch (e) {
        // Fall through to default handling on failure
      }
    }
    const intentData = this.model.intents[intent.intent];
    
    if (!intentData || intentData.responses.length === 0) {
      return { response: "I'm not sure how to respond to that. Could you rephrase your question?" };
    }

    // Select response based on confidence and entities
    let responseIndex = 0;
    
    if (intent.confidence > 0.8) {
      // High confidence - use more specific responses
      responseIndex = Math.floor(Math.random() * Math.min(2, intentData.responses.length));
    } else {
      // Lower confidence - use more general responses
      responseIndex = Math.floor(Math.random() * intentData.responses.length);
    }

    // Empathy prefix for a more conversational tone
    const empathy = this.buildEmpathyPrefix(text, intent.intent);
    let response = `${empathy}${intentData.responses[responseIndex]}`;
    let options: ChatOption[] = [];

    // Add interactive options based on intent
    if (intent.intent === 'symptom_report') {
      options = [
        ...this.generateSymptomOptions(),
        ...this.generateClarifyingOptions()
      ];
      response += '\n\nJust to better understand your situation:'+
        '\n• How intense is it (1-10)?' +
        '\n• When did it start?' +
        '\n• Anything that makes it better or worse?';
    } else if (intent.intent === 'severity_inquiry') {
      options = [
        ...this.generatePainOptions(),
        ...this.generateClarifyingOptions()
      ];
    } else if (intent.intent === 'duration_inquiry') {
      options = [
        { id: 'duration_short', text: 'Less than 1 hour', type: 'duration', value: 'less than 1 hour' },
        { id: 'duration_few_hours', text: 'A few hours', type: 'duration', value: 'a few hours' },
        { id: 'duration_days', text: 'A few days', type: 'duration', value: 'a few days' }
      ];
    } else if (intent.intent === 'treatment_inquiry') {
      options = [
        { id: 'start_assessment', text: 'Start symptom check', type: 'action', value: 'start_assessment' },
        { id: 'share_severity', text: 'Share severity (1-10)', type: 'severity', value: 5 }
      ];
    } else if (intent.intent === 'mental_health_support') {
      options = [
        { id: 'mh_breathe', text: 'Breathing exercise', type: 'action', value: 'mh_breathe' },
        { id: 'mh_ground', text: 'Grounding tips', type: 'action', value: 'mh_ground' },
        { id: 'mh_triggers', text: 'Discuss triggers', type: 'action', value: 'mh_triggers' }
      ];
    } else if (intent.intent === 'pain_assessment') {
      options = [
        ...this.generatePainOptions(),
        ...this.generateClarifyingOptions()
      ];
    } else if (intent.intent === 'small_talk' || intent.intent === 'greeting') {
      options = [
        { id: 'start_symptom_assessment', text: 'Start symptom check', type: 'action', value: 'start_assessment' },
        { id: 'ask_preventive', text: 'Preventive tips', type: 'action', value: 'preventive_care' },
      ];
    } else if (intent.intent === 'yes' || intent.intent === 'no') {
      // Keep context by nudging back to assessment
      options = [
        { id: 'clarify_add_symptom', text: 'Add symptom', type: 'symptom', value: 'other' },
        { id: 'clarify_severity', text: 'Share severity', type: 'severity', value: 5 },
        { id: 'clarify_duration', text: 'Share duration', type: 'duration', value: 'a few hours' }
      ];
    }

    // Personalize response based on entities
    if (entities.length > 0) {
      response = this.personalizeResponse(response, entities);
    }

    // Add reflective confirmation and yes/no options when confidence is low
    if (intent.confidence < 0.5 && intent.intent !== 'greeting' && intent.intent !== 'goodbye') {
      response += `\n\nJust to confirm, are we talking about ${entities.length > 0 ? entities.join(', ') : 'these symptoms'}?`;
      options = [...(options || []), ...this.generateYesNoOptions()];
    }

    return { response, options };
  }

  private buildEmpathyPrefix(text: string, intent: string): string {
    const sentiment = this.analyzeSentiment(text);
    if (intent === 'greeting') return '';
    if (intent === 'goodbye') return '';
    if (sentiment.label === 'negative') return 'I\'m sorry you\'re going through this. ';
    if (sentiment.label === 'positive') return 'That\'s encouraging to hear. ';
    return 'Thanks for sharing this. ';
  }

  private generateClarifyingOptions(): ChatOption[] {
    return [
      { id: 'clarify_add_symptom', text: 'Add another symptom', type: 'symptom', value: 'other' },
      { id: 'clarify_severity', text: 'Rate severity (1-10)', type: 'severity', value: 5 },
      { id: 'clarify_duration', text: 'Specify duration', type: 'duration', value: 'a few hours' },
      { id: 'clarify_triggers', text: 'Mention triggers', type: 'action', value: 'mention_triggers' }
    ];
  }

  private generateYesNoOptions(): ChatOption[] {
    return [
      { id: 'confirm_yes', text: 'Yes', type: 'action', value: 'yes' },
      { id: 'confirm_no', text: 'No', type: 'action', value: 'no' }
    ];
  }

  private generateSymptomOptions(): ChatOption[] {
    return [
      { id: 'severity_1_3', text: 'Mild (1-3)', type: 'severity', value: 2, color: '#34C759' },
      { id: 'severity_4_6', text: 'Moderate (4-6)', type: 'severity', value: 5, color: '#FF9F0A' },
      { id: 'severity_7_10', text: 'Severe (7-10)', type: 'severity', value: 8, color: '#FF3B30' },
      { id: 'duration_short', text: 'Less than 1 hour', type: 'duration', value: 'less than 1 hour' },
      { id: 'duration_few_hours', text: 'A few hours', type: 'duration', value: 'a few hours' },
      { id: 'duration_days', text: 'A few days', type: 'duration', value: 'a few days' },
    ];
  }

  private generatePainOptions(): ChatOption[] {
    return [
      { id: 'pain_mild', text: 'Mild Pain', type: 'severity', value: 3, color: '#34C759' },
      { id: 'pain_moderate', text: 'Moderate Pain', type: 'severity', value: 6, color: '#FF9F0A' },
      { id: 'pain_severe', text: 'Severe Pain', type: 'severity', value: 9, color: '#FF3B30' },
      { id: 'pain_chest', text: 'Chest Pain', type: 'symptom', value: 'chest_pain', color: '#FF3B30' },
      { id: 'pain_head', text: 'Headache', type: 'symptom', value: 'headache' },
      { id: 'pain_back', text: 'Back Pain', type: 'symptom', value: 'back_pain' },
    ];
  }

  private generateSymptomQuestion(): { response: string; options?: ChatOption[] } {
    const response = "I'm here to help you understand your symptoms. What symptoms are you experiencing today?";
    const options: ChatOption[] = [
      { id: 'symptom_headache', text: 'Headache', type: 'symptom', value: 'headache', step: 'symptoms' },
      { id: 'symptom_fever', text: 'Fever', type: 'symptom', value: 'fever', step: 'symptoms' },
      { id: 'symptom_cough', text: 'Cough', type: 'symptom', value: 'cough', step: 'symptoms' },
      { id: 'symptom_chest_pain', text: 'Chest Pain', type: 'symptom', value: 'chest_pain', step: 'symptoms', color: '#FF3B30' },
      { id: 'symptom_diarrhea', text: 'Diarrhea', type: 'symptom', value: 'diarrhea', step: 'symptoms' },
      { id: 'symptom_back_pain', text: 'Back Pain', type: 'symptom', value: 'back_pain', step: 'symptoms' },
    ];
    return { response, options };
  }

  private generateSeverityQuestion(symptoms: string[]): { response: string; options?: ChatOption[] } {
    const symptomText = symptoms.length > 0 ? `your ${symptoms.join(', ')}` : 'your symptoms';
    const response = `I understand you're experiencing ${symptomText}. How severe would you rate your symptoms on a scale of 1-10?`;
    const options: ChatOption[] = [
      { id: 'severity_1_3', text: 'Mild (1-3)', type: 'severity', value: 2, color: '#34C759', step: 'severity' },
      { id: 'severity_4_6', text: 'Moderate (4-6)', type: 'severity', value: 5, color: '#FF9F0A', step: 'severity' },
      { id: 'severity_7_10', text: 'Severe (7-10)', type: 'severity', value: 8, color: '#FF3B30', step: 'severity' },
    ];
    return { response, options };
  }

  private generateDurationQuestion(): { response: string; options?: ChatOption[] } {
    const response = "How long have you been experiencing these symptoms?";
    const options: ChatOption[] = [
      { id: 'duration_short', text: 'Less than 1 hour', type: 'duration', value: 'less than 1 hour', step: 'duration' },
      { id: 'duration_few_hours', text: 'A few hours', type: 'duration', value: 'a few hours', step: 'duration' },
      { id: 'duration_days', text: 'A few days', type: 'duration', value: 'a few days', step: 'duration' },
      { id: 'duration_week', text: 'A week or more', type: 'duration', value: 'a week or more', step: 'duration' },
    ];
    return { response, options };
  }

  private generateFinalAssessment(): { response: string; options?: ChatOption[] } {
    const { collectedSymptoms, collectedSeverity, collectedDuration } = this.conversationState;
    const symptomText = collectedSymptoms.join(', ');
    const severityText = collectedSeverity ? `${collectedSeverity}/10` : 'unknown';
    const durationText = collectedDuration || 'unknown duration';

    const response = `Based on your assessment:\n\n📋 Symptoms: ${symptomText}\n🔢 Severity: ${severityText}\n⏰ Duration: ${durationText}\n\nI recommend:\n${this.generateRecommendations(collectedSymptoms, collectedSeverity, collectedDuration)}`;
    
    const options: ChatOption[] = [
      { id: 'action_log', text: 'Log This Assessment', type: 'action', value: 'log_assessment' },
      { id: 'action_emergency', text: 'Emergency Help', type: 'action', value: 'emergency_help', color: '#FF3B30' },
      { id: 'action_new_assessment', text: 'New Assessment', type: 'action', value: 'new_assessment' },
    ];
    
    return { response, options };
  }

  private extractSeverity(text: string): number | null {
    // Look for numbers 1-10
    const severityMatch = text.match(/(\d+)/);
    if (severityMatch) {
      const num = parseInt(severityMatch[1]);
      if (num >= 1 && num <= 10) {
        return num;
      }
    }
    
    // Look for severity words
    const severityWords = {
      'mild': 3,
      'moderate': 6,
      'severe': 9,
      'very severe': 10,
      'light': 2,
      'heavy': 8,
      'intense': 8,
      'strong': 7,
      'weak': 2
    };
    
    const lowerText = text.toLowerCase();
    for (const [word, value] of Object.entries(severityWords)) {
      if (lowerText.includes(word)) {
        return value;
      }
    }
    
    return null;
  }

  private extractDuration(text: string): string | null {
    const durationPatterns = [
      /less than (\d+) hour/i,
      /(\d+) hour/i,
      /(\d+) day/i,
      /(\d+) week/i,
      /a few hours/i,
      /a few days/i,
      /a week/i,
      /recently/i,
      /just started/i,
      /for a while/i
    ];
    
    for (const pattern of durationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return null;
  }

  private generateRecommendations(symptoms: string[], severity: number | null, duration: string | null): string {
    let recommendations = '';
    
    // Emergency symptoms
    if (symptoms.includes('chest_pain') && severity && severity >= 7) {
      recommendations += '🚨 EMERGENCY: Chest pain with high severity requires immediate medical attention. Call emergency services.\n\n';
    }
    
    // High severity symptoms
    if (severity && severity >= 8) {
      recommendations += '⚠️ High severity symptoms should be evaluated by a healthcare provider soon.\n\n';
    }
    
    // Duration-based recommendations
    if (duration && duration.includes('week')) {
      recommendations += '📅 Symptoms lasting a week or more should be evaluated by a healthcare provider.\n\n';
    }
    
    // General recommendations
    recommendations += '💡 General Care:\n• Rest and stay hydrated\n• Monitor your symptoms\n• Keep a symptom diary\n• Contact healthcare provider if symptoms worsen\n\n';
    
    // Rural-specific recommendations
    recommendations += '🏘️ Rural Health Tips:\n• Know your nearest healthcare facility\n• Keep emergency contacts handy\n• Consider telemedicine options\n• Have basic first aid supplies\n\n';
    
    return recommendations;
  }

  private personalizeResponse(response: string, entities: string[]): string {
    let personalized = response;
    
    // Add rural-specific entity guidance
    if (entities.includes('headache')) {
      personalized += '\n\n🤕 HEADACHE RURAL GUIDANCE:\n- Rest in a quiet, dark place\n- Stay hydrated with clean water\n- Use cold compress if available\n- Monitor for severe symptoms\n- Seek help if pain >7/10 or lasts >24 hours';
    } else if (entities.includes('chest_pain')) {
      personalized += '\n\n🚨 CHEST PAIN - RURAL EMERGENCY:\n- This is URGENT in rural areas\n- Call emergency services immediately\n- If no signal, send someone for help\n- Do NOT attempt long-distance travel\n- Keep person calm and still';
    } else if (entities.includes('fever')) {
      personalized += '\n\n🌡️ FEVER RURAL CARE:\n- Monitor temperature regularly\n- Keep hydrated with clean water\n- Use cool cloths if available\n- Rest and avoid physical exertion\n- Seek help if fever >103°F or lasts >3 days';
    } else if (entities.includes('diarrhea')) {
      personalized += '\n\n💧 DIARRHEA RURAL MANAGEMENT:\n- Drink clean, boiled water\n- Use oral rehydration solution\n- Avoid dairy and fatty foods\n- Rest and stay near bathroom\n- Seek help if severe dehydration or blood in stools';
    } else if (entities.includes('snake_bite')) {
      personalized += '\n\n🐍 SNAKE BITE RURAL PROTOCOL:\n- IMMEDIATE EMERGENCY\n- Call emergency services\n- Keep person calm and still\n- Remove jewelry from affected area\n- Do NOT cut, suck, or apply tourniquet\n- Note snake appearance if possible';
    } else if (entities.includes('animal_bite')) {
      personalized += '\n\n🐕 ANIMAL BITE RURAL CARE:\n- Clean wound with soap and clean water\n- Apply pressure to stop bleeding\n- Seek medical attention for rabies risk\n- Note animal type and behavior\n- Keep wound clean and covered';
    } else if (entities.includes('broken_bone')) {
      personalized += '\n\n🦴 BROKEN BONE RURAL CARE:\n- IMMOBILIZE the injured area\n- Use splints if available (sticks, boards)\n- Apply ice if available\n- Elevate if possible\n- Seek immediate medical attention\n- Do NOT attempt to straighten';
    } else if (entities.includes('pregnancy')) {
      personalized += '\n\n🤱 PREGNANCY RURAL CARE:\n- Attend mobile prenatal clinics\n- Keep emergency birth kit ready\n- Know nearest delivery facility\n- Stay hydrated and well-nourished\n- Have emergency transport plan';
    } else if (entities.includes('child_health')) {
      personalized += '\n\n👶 CHILD HEALTH RURAL TIPS:\n- Monitor growth and development\n- Attend vaccination clinics\n- Keep emergency contacts handy\n- Teach basic hygiene\n- Know signs of serious illness';
    } else if (entities.includes('elderly')) {
      personalized += '\n\n👴 ELDERLY RURAL CARE:\n- Regular health check-ups\n- Medication management\n- Fall prevention at home\n- Social support networks\n- Emergency response plan';
    }

    return personalized;
  }

  private addTrainingData(input: string, intent: string, entities: string[], response: string, confidence: number, sentiment?: { label: 'negative' | 'neutral' | 'positive'; score: number }): void {
    const trainingData: TrainingData = {
      id: uuidv4(),
      input,
      intent,
      entities,
      response,
      confidence,
      timestamp: new Date(),
      sentimentLabel: sentiment?.label,
      sentimentScore: sentiment?.score
    };

    this.model.trainingData.push(trainingData);
    
    // Update intent training count
    if (this.model.intents[intent]) {
      this.model.intents[intent].trainingCount++;
    }

    // Limit training data size
    if (this.model.trainingData.length > 1000) {
      this.model.trainingData = this.model.trainingData.slice(-500);
    }
  }

  async trainModel(trainingData?: TrainingData[]): Promise<TrainingResult> {
    const startTime = Date.now();
    
    try {
      // Use provided training data or existing data
      const dataToTrain = trainingData || this.model.trainingData;
      
      if (dataToTrain.length === 0) {
        return {
          success: false,
          accuracy: 0,
          newIntents: 0,
          newEntities: 0,
          trainingTime: 0,
          modelVersion: this.model.modelVersion
        };
      }

      let correctPredictions = 0;
      let newIntents = 0;
      let newEntities = 0;

      // Train on each data point
      for (const data of dataToTrain) {
        const processedText = this.preprocessText(data.input);
        const predictedIntent = this.classifyIntent(processedText);
        const predictedEntities = this.extractEntities(processedText);

        // Check if prediction was correct
        if (predictedIntent.intent === data.intent) {
          correctPredictions++;
        }

        // Learn new patterns
        this.learnFromData(data, predictedIntent, predictedEntities);
      }

      // Calculate accuracy
      const accuracy = dataToTrain.length > 0 ? correctPredictions / dataToTrain.length : 0;
      
      // Update model
      this.model.accuracy = accuracy;
      this.model.lastTrained = new Date();
      this.model.modelVersion = this.incrementVersion(this.model.modelVersion);

      // Train a Naive Bayes intent classifier from training data
      this.model.intentNB = this.trainNaiveBayesClassifier(dataToTrain);

      // Save updated model
      await this.saveModel();

      const trainingTime = Date.now() - startTime;

      console.log(`✅ Model training completed - Accuracy: ${(accuracy * 100).toFixed(2)}%`);

      return {
        success: true,
        accuracy,
        newIntents,
        newEntities,
        trainingTime,
        modelVersion: this.model.modelVersion
      };

    } catch (error) {
      console.error('❌ Model training failed:', error);
      return {
        success: false,
        accuracy: 0,
        newIntents: 0,
        newEntities: 0,
        trainingTime: Date.now() - startTime,
        modelVersion: this.model.modelVersion
      };
    }
  }

  private learnFromData(data: TrainingData, predictedIntent: { intent: string; confidence: number }, predictedEntities: string[]): void {
    // Learn new intent patterns if prediction was wrong
    if (predictedIntent.intent !== data.intent) {
      const intentData = this.model.intents[data.intent];
      if (intentData) {
        // Add new pattern from the input
        const words = this.preprocessText(data.input).split(' ');
        const newPattern = words.slice(0, 3).join(' '); // Use first 3 words as pattern
        if (!intentData.patterns.includes(newPattern)) {
          intentData.patterns.push(newPattern);
        }
      }
    }

    // Learn new entities
    for (const entity of data.entities) {
      if (!this.model.entities[entity]) {
        this.model.entities[entity] = {
          entity,
          synonyms: [],
          category: 'symptom',
          confidence: 0.7
        };
      }
    }
  }

  // ==========================
  // Naive Bayes Intent Model
  // ==========================
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }

  private buildVocabulary(samples: TrainingData[]): string[] {
    const vocabSet = new Set<string>();
    for (const s of samples) {
      for (const w of this.tokenize(this.preprocessText(s.input))) {
        vocabSet.add(w);
      }
    }
    return Array.from(vocabSet);
  }

  private vectorize(text: string, vocabulary: string[]): number[] {
    const counts = new Array(vocabulary.length).fill(0);
    const tokens = this.tokenize(this.preprocessText(text));
    for (const t of tokens) {
      const idx = vocabulary.indexOf(t);
      if (idx >= 0) counts[idx] += 1;
    }
    return counts;
  }

  private trainNaiveBayesClassifier(data: TrainingData[]): NaiveBayesModel {
    const classes = Array.from(new Set(data.map(d => d.intent)));
    const vocabulary = this.buildVocabulary(data);
    const classDocCounts: { [c: string]: number } = {};
    const classTokenCounts: { [c: string]: number } = {};
    const condCounts: { [c: string]: number[] } = {};

    classes.forEach(c => {
      classDocCounts[c] = 0;
      classTokenCounts[c] = 0;
      condCounts[c] = new Array(vocabulary.length).fill(0);
    });

    for (const sample of data) {
      classDocCounts[sample.intent] += 1;
      const vec = this.vectorize(sample.input, vocabulary);
      for (let i = 0; i < vocabulary.length; i++) {
        const count = vec[i];
        if (count > 0) {
          condCounts[sample.intent][i] += count;
          classTokenCounts[sample.intent] += count;
        }
      }
    }

    const priors = classes.map(c => Math.log((classDocCounts[c] + 1) / (data.length + classes.length)));
    const condprob: { [c: string]: number[] } = {};
    classes.forEach((c, ci) => {
      const denom = classTokenCounts[c] + vocabulary.length; // Laplace smoothing
      condprob[c] = condCounts[c].map(cnt => Math.log((cnt + 1) / denom));
    });

    return { classes, vocabulary, priors, condprob };
  }

  private nbClassify(text: string): { intent: string; confidence: number } | null {
    const nb = this.model.intentNB;
    if (!nb) return null;

    const vec = this.vectorize(text, nb.vocabulary);
    let bestIdx = 0;
    let bestScore = -Infinity;
    const scores: number[] = [];
    for (let c = 0; c < nb.classes.length; c++) {
      let score = nb.priors[c];
      const cls = nb.classes[c];
      for (let i = 0; i < nb.vocabulary.length; i++) {
        const count = vec[i];
        if (count > 0) score += count * nb.condprob[cls][i];
      }
      scores.push(score);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = c;
      }
    }

    // Convert log-scores to pseudo-confidence via softmax over top-2
    const max = Math.max(...scores);
    const expScores = scores.map(s => Math.exp(s - max));
    const sum = expScores.reduce((a, b) => a + b, 0);
    const confidence = Math.min(0.95, Math.max(0.1, expScores[bestIdx] / (sum || 1)));
    return { intent: nb.classes[bestIdx], confidence };
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const minor = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${minor}`;
  }

  async addTrainingExample(input: string, intent: string, response: string, entities: string[] = []): Promise<void> {
    const trainingData: TrainingData = {
      id: uuidv4(),
      input,
      intent,
      entities,
      response,
      confidence: 0.8,
      timestamp: new Date()
    };

    this.model.trainingData.push(trainingData);
    await this.saveModel();
  }

  async getModelStats(): Promise<{
    version: string;
    accuracy: number;
    intentsCount: number;
    entitiesCount: number;
    trainingDataCount: number;
    lastTrained: Date;
  }> {
    return {
      version: this.model.modelVersion,
      accuracy: this.model.accuracy,
      intentsCount: Object.keys(this.model.intents).length,
      entitiesCount: Object.keys(this.model.entities).length,
      trainingDataCount: this.model.trainingData.length,
      lastTrained: this.model.lastTrained
    };
  }

  async resetModel(): Promise<void> {
    this.model = this.initializeModel();
    await this.saveModel();
    console.log('✅ NLP Model reset to default state');
  }
}

export const advancedNLPService = new AdvancedNLPService();
