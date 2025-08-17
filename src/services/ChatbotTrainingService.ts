import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { advancedNLPService, TrainingData, TrainingResult } from './AdvancedNLPService';

export interface TrainingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  trainingDataCount: number;
  accuracy: number;
  newIntents: number;
  newEntities: number;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

export interface TrainingDataset {
  id: string;
  name: string;
  description: string;
  data: TrainingData[];
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

export interface TrainingMetrics {
  totalSessions: number;
  averageAccuracy: number;
  bestAccuracy: number;
  totalTrainingTime: number;
  lastTrainingDate?: Date;
  modelVersions: string[];
}

export interface TrainingConfiguration {
  batchSize: number;
  learningRate: number;
  maxEpochs: number;
  validationSplit: number;
  earlyStoppingPatience: number;
}

class ChatbotTrainingService {
  private readonly TRAINING_SESSIONS_KEY = 'chatbot_training_sessions';
  private readonly TRAINING_DATASETS_KEY = 'chatbot_training_datasets';
  private readonly TRAINING_CONFIG_KEY = 'chatbot_training_config';
  private readonly METRICS_KEY = 'chatbot_training_metrics';

  private defaultConfig: TrainingConfiguration = {
    batchSize: 32,
    learningRate: 0.001,
    maxEpochs: 100,
    validationSplit: 0.2,
    earlyStoppingPatience: 10
  };

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Initialize default datasets if none exist
      const datasets = await this.getTrainingDatasets();
      if (datasets.length === 0) {
        await this.createDefaultDatasets();
      }

      // Initialize metrics if none exist
      const metrics = await this.getTrainingMetrics();
      if (!metrics) {
        await this.initializeMetrics();
      }
    } catch (error) {
      console.error('❌ Failed to initialize training service:', error);
    }
  }

  private async createDefaultDatasets(): Promise<void> {
    const defaultDatasets: TrainingDataset[] = [
      {
        id: uuidv4(),
        name: 'Rural Health Conversations',
        description: 'Rural health-specific conversations and emergency guidance',
        data: [
          {
            id: uuidv4(),
            input: 'I have a headache',
            intent: 'symptom_report',
            entities: ['headache'],
            response: 'I understand you\'re not feeling well, and I\'m here to help. To better understand your situation, could you tell me:\n\n• How would you rate your headache on a scale of 1-10?\n• How long have you been experiencing this headache?\n• Are there any other symptoms you\'ve noticed?\n• Do you have access to medical care nearby?',
            confidence: 0.9,
            timestamp: new Date()
          },
          {
            id: uuidv4(),
            input: 'Snake bit me on my farm',
            intent: 'emergency',
            entities: ['snake_bite', 'rural_location'],
            response: '🚨 SNAKE BITE RURAL PROTOCOL:\n- IMMEDIATE EMERGENCY\n- Call emergency services\n- Keep person calm and still\n- Remove jewelry from affected area\n- Do NOT cut, suck, or apply tourniquet\n- Note snake appearance if possible\n\nWhat type of snake was it and how long ago did this happen?',
            confidence: 0.95,
            timestamp: new Date()
          },
          {
            id: uuidv4(),
            input: 'I need local health resources',
            intent: 'local_resources',
            entities: ['rural_location'],
            response: 'LOCAL RURAL HEALTH RESOURCES:\n\n🏥 HEALTHCARE PROVIDERS:\n- Community health workers\n- Village clinics\n- Mobile medical units\n- Traditional healers (if appropriate)\n\n📞 CONTACT METHODS:\n- Local health hotlines\n- Community WhatsApp groups\n- Village health committees\n- Emergency contacts\n\n🚗 TRANSPORT OPTIONS:\n- Community vehicles\n- Motorcycle taxis\n- Ambulance services\n- Neighbor assistance\n\nWhat type of care do you need?',
            confidence: 0.9,
            timestamp: new Date()
          },
          {
            id: uuidv4(),
            input: 'I\'m pregnant and need rural care',
            intent: 'rural_health_guidance',
            entities: ['pregnancy', 'rural_location'],
            response: '🤱 PREGNANCY RURAL CARE:\n- Attend mobile prenatal clinics\n- Keep emergency birth kit ready\n- Know nearest delivery facility\n- Stay hydrated and well-nourished\n- Have emergency transport plan\n\nHow far along are you and what specific care do you need?',
            confidence: 0.9,
            timestamp: new Date()
          },
          {
            id: uuidv4(),
            input: 'My child has fever in remote area',
            intent: 'symptom_report',
            entities: ['fever', 'child_health', 'rural_location'],
            response: 'I understand you\'re worried about your child. Let me help you figure out what to do. Can you tell me:\n• How bad is it on a scale of 1-10?\n• How long have they been feeling this way?\n• Are you in a remote area?\n• Do you have a way to get to help if needed?\n\n🌡️ FEVER CARE TIPS:\n• Monitor temperature regularly\n• Keep them hydrated with clean water\n• Use cool cloths if available\n• Rest and avoid physical exertion\n• Seek help if fever >103°F or lasts >3 days\n\n👶 CHILD HEALTH TIPS:\n• Monitor growth and development\n• Attend vaccination clinics\n• Keep emergency contacts handy\n• Teach basic hygiene\n• Know signs of serious illness\n\nWhat\'s your child\'s temperature and how long have they had the fever?',
            confidence: 0.9,
            timestamp: new Date()
          },
          {
            id: uuidv4(),
            input: 'I have some health questions',
            intent: 'health_inquiry',
            entities: [],
            response: 'I\'d love to help you with health information! I can talk about:\n\n🏥 Medical Topics:\n• Common illnesses and symptoms\n• First aid and emergency care\n• Preventive health measures\n\n🌾 Rural-Specific Health:\n• Agricultural and farming injuries\n• Animal bites and safety\n• Water-borne diseases\n• Traditional medicine (when appropriate)\n\n📚 Health Education:\n• Health literacy and understanding\n• Family planning and maternal care\n• Child and elderly care\n\nWhat would you like to learn about?',
            confidence: 0.9,
            timestamp: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0'
      },
      {
        id: uuidv4(),
        name: 'Rural Emergency Protocols',
        description: 'Emergency protocols specifically for rural areas',
        data: [
          {
            id: uuidv4(),
            input: 'Animal bit me in village',
            intent: 'emergency',
            entities: ['animal_bite', 'rural_location'],
            response: '🐕 ANIMAL BITE RURAL CARE:\n- Clean wound with soap and clean water\n- Apply pressure to stop bleeding\n- Seek medical attention for rabies risk\n- Note animal type and behavior\n- Keep wound clean and covered\n\nWhat type of animal bit you and when did this happen?',
            confidence: 0.95,
            timestamp: new Date()
          },
          {
            id: uuidv4(),
            input: 'Broken bone in remote area',
            intent: 'emergency',
            entities: ['broken_bone', 'rural_location'],
            response: '🦴 BROKEN BONE RURAL CARE:\n- IMMOBILIZE the injured area\n- Use splints if available (sticks, boards)\n- Apply ice if available\n- Elevate if possible\n- Seek immediate medical attention\n- Do NOT attempt to straighten\n\nWhat bone is injured and do you have access to transportation?',
            confidence: 0.95,
            timestamp: new Date()
          },
          {
            id: uuidv4(),
            input: 'Chest pain in rural area',
            intent: 'emergency',
            entities: ['chest_pain', 'rural_location'],
            response: '🚨 CHEST PAIN - RURAL EMERGENCY:\n- This is URGENT in rural areas\n- Call emergency services immediately\n- If no signal, send someone for help\n- Do NOT attempt long-distance travel\n- Keep person calm and still\n\nWhat type of chest pain are you experiencing and how severe is it?',
            confidence: 0.95,
            timestamp: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0'
      }
    ];

    for (const dataset of defaultDatasets) {
      await this.saveTrainingDataset(dataset);
    }
  }

  async startTrainingSession(datasetId?: string): Promise<TrainingSession> {
    const session: TrainingSession = {
      id: uuidv4(),
      startTime: new Date(),
      trainingDataCount: 0,
      accuracy: 0,
      newIntents: 0,
      newEntities: 0,
      status: 'running'
    };

    try {
      // Get training data
      let trainingData: TrainingData[] = [];
      
      if (datasetId) {
        const dataset = await this.getTrainingDataset(datasetId);
        if (dataset) {
          trainingData = dataset.data;
        }
      } else {
        // Use all available training data
        const datasets = await this.getTrainingDatasets();
        trainingData = datasets.flatMap(dataset => dataset.data);
      }

      session.trainingDataCount = trainingData.length;

      if (trainingData.length === 0) {
        throw new Error('No training data available');
      }

      // Train the model
      const result = await advancedNLPService.trainModel(trainingData);
      
      session.endTime = new Date();
      session.accuracy = result.accuracy;
      session.newIntents = result.newIntents;
      session.newEntities = result.newEntities;
      session.status = result.success ? 'completed' : 'failed';

      if (!result.success) {
        session.error = 'Training failed';
      }

      // Save session
      await this.saveTrainingSession(session);

      // Update metrics
      await this.updateTrainingMetrics(session, result);

      console.log(`✅ Training session completed - Accuracy: ${(result.accuracy * 100).toFixed(2)}%`);

      return session;

    } catch (error) {
      session.endTime = new Date();
      session.status = 'failed';
      session.error = error instanceof Error ? error.message : 'Unknown error';
      
      await this.saveTrainingSession(session);
      throw error;
    }
  }

  async addTrainingExample(
    input: string, 
    intent: string, 
    response: string, 
    entities: string[] = [],
    datasetId?: string
  ): Promise<void> {
    const trainingData: TrainingData = {
      id: uuidv4(),
      input,
      intent,
      entities,
      response,
      confidence: 0.8,
      timestamp: new Date()
    };

    // Add to NLP service
    await advancedNLPService.addTrainingExample(input, intent, response, entities);

    // Add to dataset if specified
    if (datasetId) {
      const dataset = await this.getTrainingDataset(datasetId);
      if (dataset) {
        dataset.data.push(trainingData);
        dataset.updatedAt = new Date();
        dataset.version = this.incrementVersion(dataset.version);
        await this.saveTrainingDataset(dataset);
      }
    }
  }

  async createTrainingDataset(name: string, description: string): Promise<TrainingDataset> {
    const dataset: TrainingDataset = {
      id: uuidv4(),
      name,
      description,
      data: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0'
    };

    await this.saveTrainingDataset(dataset);
    return dataset;
  }

  async addDataToDataset(datasetId: string, trainingData: TrainingData[]): Promise<void> {
    const dataset = await this.getTrainingDataset(datasetId);
    if (!dataset) {
      throw new Error('Dataset not found');
    }

    dataset.data.push(...trainingData);
    dataset.updatedAt = new Date();
    dataset.version = this.incrementVersion(dataset.version);
    
    await this.saveTrainingDataset(dataset);
  }

  async getTrainingDatasets(): Promise<TrainingDataset[]> {
    try {
      const data = await AsyncStorage.getItem(this.TRAINING_DATASETS_KEY);
      if (!data) return [];
      
      const datasets = JSON.parse(data);
      // Convert date strings back to Date objects
      return datasets.map((dataset: any) => ({
        ...dataset,
        createdAt: new Date(dataset.createdAt),
        updatedAt: new Date(dataset.updatedAt)
      }));
    } catch (error) {
      console.error('❌ Failed to load training datasets:', error);
      return [];
    }
  }

  async getTrainingDataset(id: string): Promise<TrainingDataset | null> {
    const datasets = await this.getTrainingDatasets();
    return datasets.find(dataset => dataset.id === id) || null;
  }

  async getTrainingSessions(): Promise<TrainingSession[]> {
    try {
      const data = await AsyncStorage.getItem(this.TRAINING_SESSIONS_KEY);
      if (!data) return [];
      
      const sessions = JSON.parse(data);
      // Convert date strings back to Date objects
      return sessions.map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined
      }));
    } catch (error) {
      console.error('❌ Failed to load training sessions:', error);
      return [];
    }
  }

  async getTrainingMetrics(): Promise<TrainingMetrics | null> {
    try {
      const data = await AsyncStorage.getItem(this.METRICS_KEY);
      if (!data) return null;
      
      const metrics = JSON.parse(data);
      // Convert date strings back to Date objects
      return {
        ...metrics,
        lastTrainingDate: metrics.lastTrainingDate ? new Date(metrics.lastTrainingDate) : undefined
      };
    } catch (error) {
      console.error('❌ Failed to load training metrics:', error);
      return null;
    }
  }

  async getTrainingConfiguration(): Promise<TrainingConfiguration> {
    try {
      const data = await AsyncStorage.getItem(this.TRAINING_CONFIG_KEY);
      return data ? JSON.parse(data) : this.defaultConfig;
    } catch (error) {
      console.error('❌ Failed to load training configuration:', error);
      return this.defaultConfig;
    }
  }

  async updateTrainingConfiguration(config: Partial<TrainingConfiguration>): Promise<void> {
    const currentConfig = await this.getTrainingConfiguration();
    const updatedConfig = { ...currentConfig, ...config };
    
    await AsyncStorage.setItem(this.TRAINING_CONFIG_KEY, JSON.stringify(updatedConfig));
  }

  async getModelStats(): Promise<any> {
    return await advancedNLPService.getModelStats();
  }

  async resetModel(): Promise<void> {
    await advancedNLPService.resetModel();
    
    // Clear training sessions
    await AsyncStorage.removeItem(this.TRAINING_SESSIONS_KEY);
    
    // Reset metrics
    await this.initializeMetrics();
    
    console.log('✅ Model and training data reset successfully');
  }

  private async saveTrainingSession(session: TrainingSession): Promise<void> {
    try {
      const sessions = await this.getTrainingSessions();
      sessions.push(session);
      
      // Keep only last 50 sessions
      if (sessions.length > 50) {
        sessions.splice(0, sessions.length - 50);
      }
      
      await AsyncStorage.setItem(this.TRAINING_SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('❌ Failed to save training session:', error);
    }
  }

  private async saveTrainingDataset(dataset: TrainingDataset): Promise<void> {
    try {
      const datasets = await this.getTrainingDatasets();
      const existingIndex = datasets.findIndex(d => d.id === dataset.id);
      
      if (existingIndex >= 0) {
        datasets[existingIndex] = dataset;
      } else {
        datasets.push(dataset);
      }
      
      await AsyncStorage.setItem(this.TRAINING_DATASETS_KEY, JSON.stringify(datasets));
    } catch (error) {
      console.error('❌ Failed to save training dataset:', error);
    }
  }

  private async initializeMetrics(): Promise<void> {
    const metrics: TrainingMetrics = {
      totalSessions: 0,
      averageAccuracy: 0,
      bestAccuracy: 0,
      totalTrainingTime: 0,
      modelVersions: []
    };

    await AsyncStorage.setItem(this.METRICS_KEY, JSON.stringify(metrics));
  }

  private async updateTrainingMetrics(session: TrainingSession, result: TrainingResult): Promise<void> {
    try {
      const metrics = await this.getTrainingMetrics();
      if (!metrics) return;

      metrics.totalSessions++;
      metrics.totalTrainingTime += result.trainingTime;
      
      if (session.endTime && session.startTime) {
        const endTime = session.endTime instanceof Date ? session.endTime : new Date(session.endTime);
        const startTime = session.startTime instanceof Date ? session.startTime : new Date(session.startTime);
        const sessionTime = endTime.getTime() - startTime.getTime();
        metrics.totalTrainingTime += sessionTime;
      }

      // Update accuracy metrics
      const totalAccuracy = metrics.averageAccuracy * (metrics.totalSessions - 1) + result.accuracy;
      metrics.averageAccuracy = totalAccuracy / metrics.totalSessions;
      
      if (result.accuracy > metrics.bestAccuracy) {
        metrics.bestAccuracy = result.accuracy;
      }

      // Update model versions
      if (!metrics.modelVersions.includes(result.modelVersion)) {
        metrics.modelVersions.push(result.modelVersion);
      }

      metrics.lastTrainingDate = new Date();

      await AsyncStorage.setItem(this.METRICS_KEY, JSON.stringify(metrics));
    } catch (error) {
      console.error('❌ Failed to update training metrics:', error);
    }
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  // Utility methods for data validation
  validateTrainingData(data: TrainingData): boolean {
    return !!(
      data.input &&
      data.intent &&
      data.response &&
      data.input.trim().length > 0 &&
      data.response.trim().length > 0
    );
  }

  async validateDataset(datasetId: string): Promise<{
    valid: boolean;
    errors: string[];
    validDataCount: number;
    totalDataCount: number;
  }> {
    const dataset = await this.getTrainingDataset(datasetId);
    if (!dataset) {
      return {
        valid: false,
        errors: ['Dataset not found'],
        validDataCount: 0,
        totalDataCount: 0
      };
    }

    const errors: string[] = [];
    let validDataCount = 0;

    for (const data of dataset.data) {
      if (this.validateTrainingData(data)) {
        validDataCount++;
      } else {
        errors.push(`Invalid training data: ${data.id}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      validDataCount,
      totalDataCount: dataset.data.length
    };
  }
}

export const chatbotTrainingService = new ChatbotTrainingService();
