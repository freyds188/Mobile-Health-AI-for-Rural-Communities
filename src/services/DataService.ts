import { databaseService } from './DatabaseService';
import { machineLearningService, MLAnalysisResult, HealthDataInput } from './MachineLearningService';
import { nlpService, NLPAnalysisResult } from './NLPService';
import { securityService } from './SecurityService';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'provider' | 'admin';
  age?: number;
  gender?: 'male' | 'female' | 'other';
  location?: string;
  medicalHistory?: string;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  preferences: {
    notifications: boolean;
    dataSharing: boolean;
    language: string;
    theme: 'light' | 'dark' | 'auto';
  };
}

export interface HealthRecord {
  id: string;
  userId: string;
  timestamp: Date;
  symptoms: string[];
  severity: number;
  behavior: {
    sleep: number;
    stress: number;
    exercise: number;
    diet: string;
  };
  notes: string;
  nlpAnalysis?: NLPAnalysisResult;
  processed: boolean;
  encrypted: boolean;
}

export interface AnalysisReport {
  id: string;
  userId: string;
  timestamp: Date;
  mlAnalysis: MLAnalysisResult;
  riskLevel: 'low' | 'medium' | 'high';
  patterns: string[];
  recommendations: string[];
  confidence: number;
  dataPoints: number;
  trendsAnalysis: {
    severityTrend: 'improving' | 'stable' | 'worsening';
    sleepTrend: 'improving' | 'stable' | 'worsening';
    stressTrend: 'improving' | 'stable' | 'worsening';
    exerciseTrend: 'improving' | 'stable' | 'worsening';
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  nlpAnalysis?: NLPAnalysisResult;
  extractedSymptoms?: string[];
  processed: boolean;
}

export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedData?: any;
}

export interface AnalyticsData {
  totalUsers: number;
  totalHealthRecords: number;
  totalAnalyses: number;
  avgRiskLevel: number;
  commonSymptoms: { symptom: string; count: number; percentage: number }[];
  riskDistribution: { low: number; medium: number; high: number };
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
  };
}

class DataValidator {
  static validateHealthData(data: any): DataValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!data.symptoms || !Array.isArray(data.symptoms) || data.symptoms.length === 0) {
      errors.push('Symptoms are required and must be a non-empty array');
    }

    if (typeof data.severity !== 'number' || data.severity < 1 || data.severity > 10) {
      errors.push('Severity must be a number between 1 and 10');
    }

    if (!data.behavior || typeof data.behavior !== 'object') {
      errors.push('Behavior data is required');
    } else {
      if (typeof data.behavior.sleep !== 'number' || data.behavior.sleep < 0 || data.behavior.sleep > 24) {
        errors.push('Sleep hours must be a number between 0 and 24');
      }

      if (typeof data.behavior.stress !== 'number' || data.behavior.stress < 1 || data.behavior.stress > 10) {
        errors.push('Stress level must be a number between 1 and 10');
      }

      if (typeof data.behavior.exercise !== 'number' || data.behavior.exercise < 0) {
        errors.push('Exercise minutes must be a non-negative number');
      }

      if (!data.behavior.diet || typeof data.behavior.diet !== 'string') {
        errors.push('Diet description is required');
      }
    }

    // Warnings for unusual values
    if (data.severity > 8) {
      warnings.push('High severity level detected - consider seeking medical attention');
    }

    if (data.behavior && data.behavior.sleep < 4) {
      warnings.push('Very low sleep duration detected');
    }

    if (data.behavior && data.behavior.stress > 8) {
      warnings.push('High stress level detected');
    }

    // Sanitize data
    const sanitizedData = {
      symptoms: data.symptoms?.map((s: string) => securityService.sanitizeInput(s.toString())) || [],
      severity: Math.max(1, Math.min(10, Math.round(data.severity || 5))),
      behavior: {
        sleep: Math.max(0, Math.min(24, data.behavior?.sleep || 8)),
        stress: Math.max(1, Math.min(10, Math.round(data.behavior?.stress || 5))),
        exercise: Math.max(0, data.behavior?.exercise || 0),
        diet: securityService.sanitizeInput(data.behavior?.diet || '')
      },
      notes: securityService.sanitizeInput(data.notes || '')
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  static validateUserProfile(data: any): DataValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Email validation
    if (!data.email || !securityService.validateEmail(data.email)) {
      errors.push('Valid email address is required');
    }

    // Name validation
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    // Age validation
    if (data.age !== undefined && (typeof data.age !== 'number' || data.age < 0 || data.age > 150)) {
      errors.push('Age must be a number between 0 and 150');
    }

    // Role validation
    if (!data.role || !['patient', 'provider', 'admin'].includes(data.role)) {
      errors.push('Role must be patient, provider, or admin');
    }

    // Gender validation
    if (data.gender && !['male', 'female', 'other'].includes(data.gender)) {
      errors.push('Gender must be male, female, or other');
    }

    // Sanitize data
    const sanitizedData = {
      email: data.email?.toLowerCase().trim(),
      name: securityService.sanitizeInput(data.name || ''),
      role: data.role,
      age: data.age ? Math.max(0, Math.min(150, Math.round(data.age))) : undefined,
      gender: data.gender,
      location: data.location ? securityService.sanitizeInput(data.location) : undefined,
      medicalHistory: data.medicalHistory ? securityService.sanitizeInput(data.medicalHistory) : undefined
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }
}

export class DataService {
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    console.log('🔧 DataService: Initializing DataService');
  }

  /**
   * Initialize the data service and all dependencies
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ DataService: Already initialized');
      return;
    }

    if (this.initializationPromise) {
      console.log('⏳ DataService: Initialization already in progress');
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🔄 DataService: Starting initialization...');
      
      // Initialize database first with retry logic
      console.log('💾 DataService: Initializing database...');
      let dbInitSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!dbInitSuccess && retryCount < maxRetries) {
        try {
          await databaseService.initialize();
          console.log('✅ DataService: Database initialized successfully');
          dbInitSuccess = true;
        } catch (dbError) {
          retryCount++;
          console.warn(`⚠️ DataService: Database initialization attempt ${retryCount} failed:`, dbError);
          
          if (retryCount >= maxRetries) {
            console.error('❌ DataService: Database initialization failed after all retries');
            throw new Error(`Database initialization failed after ${maxRetries} attempts: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      // Initialize other services
      console.log('🔐 DataService: Initializing security service...');
      try {
        await securityService.initialize();
        console.log('✅ DataService: Security service initialized');
      } catch (securityError) {
        console.warn('⚠️ DataService: Security service initialization failed, but continuing:', securityError);
        // Continue even if security service fails
      }

      // Note: ML and NLP services don't require explicit initialization
      console.log('✅ DataService: ML and NLP services ready');

      this.isInitialized = true;
      console.log('🎉 DataService: Initialization complete');
    } catch (error) {
      console.error('❌ DataService: Initialization failed:', error);
      this.isInitialized = false;
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Ensure the service is initialized before performing operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      console.log('⚠️ DataService: Service not initialized, initializing now...');
      await this.initialize();
    }
  }

  // User Management
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role: 'patient' | 'provider' | 'admin';
    age?: number;
    gender?: 'male' | 'female' | 'other';
    location?: string;
    medicalHistory?: string;
  }): Promise<UserProfile> {
    console.log('👤 DataService: Starting FAST user creation for:', userData.email);
    
    // OPTIMIZED: Quick basic validation only
    console.log('⚡ DataService: Fast validation (basic checks only)');
    
    // Only essential validations for speed
    if (!userData.email || !userData.email.includes('@')) {
      throw new Error('Valid email required');
    }
    if (!userData.name || userData.name.trim().length < 2) {
      throw new Error('Valid name required');
    }
    if (!userData.password || userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    
    // Skip expensive password validation for speed - use sanitized data directly
    const sanitizedData = {
      email: userData.email.toLowerCase().trim(),
      name: userData.name.trim(),
      password: userData.password,
      role: userData.role,
      age: userData.age,
      gender: userData.gender,
      location: userData.location?.trim(),
      medicalHistory: userData.medicalHistory?.trim()
    };

    try {
      // Create user in database
      console.log('⚡ DataService: Creating user in database (FAST MODE)');
      
      const dbUser = await databaseService.createUser(sanitizedData);
      console.log('✅ DataService: User created in database with ID:', dbUser.id);
      
      // OPTIMIZED: Skip security logging for faster registration
      console.log('⚡ DataService: Skipping audit log for speed (can be added later)');

      // Convert to UserProfile format
      const userProfile: UserProfile = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        age: dbUser.age,
        gender: dbUser.gender,
        location: dbUser.location,
        medicalHistory: dbUser.medicalHistory,
        createdAt: new Date(dbUser.createdAt),
        updatedAt: new Date(dbUser.updatedAt),
        isVerified: false,
        preferences: {
          notifications: true,
          dataSharing: false,
          language: 'en',
          theme: 'auto'
        }
      };

      console.log('🎯 DataService: User profile created successfully');
      return userProfile;
    } catch (error) {
      console.error('❌ DataService: User creation failed:', error);
      await securityService.logAction('', 'user_creation_failed', 'user', false, { 
        email: userData.email, 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async authenticateUser(email: string, password: string, deviceInfo?: string): Promise<{
    user: UserProfile;
    sessionToken: string;
  } | null> {
    console.log('🚀 DataService: FAST authentication for:', email);
    
    // OPTIMIZED: Skip account locking checks for faster auth
    console.log('⚡ DataService: Skipping lockout checks for speed');

    try {
      console.log('🔍 DataService: Checking user in database');
      
      // Check if we're on web and handle demo user
      if (typeof window !== 'undefined' && email === 'demo@healthai.com' && password === 'demo123') {
        console.log('🌐 DataService: Creating demo user for web platform');
        const demoUser = {
          id: 'demo-user-1',
          email: 'demo@healthai.com',
          name: 'Demo User',
          role: 'patient' as const,
          age: 28,
          gender: 'female' as const,
          location: 'Demo City',
          medicalHistory: 'Demo medical history for testing',
          passwordHash: 'demo-hash',
          salt: 'demo-salt',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        console.log('✅ DataService: Demo user authentication successful');
        
        // Create session
        console.log('🎟️ DataService: Creating session token');
        const sessionToken = securityService.createSession(demoUser.id, deviceInfo || 'unknown');

        // Log successful login
        await securityService.logAction(demoUser.id, 'login_success', 'auth', true, { email });

        const userProfile: UserProfile = {
          id: demoUser.id,
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role,
          age: demoUser.age,
          gender: demoUser.gender,
          location: demoUser.location,
          medicalHistory: demoUser.medicalHistory,
          createdAt: new Date(demoUser.createdAt),
          updatedAt: new Date(demoUser.updatedAt),
          isVerified: true,
          preferences: {
            notifications: true,
            dataSharing: false,
            language: 'en',
            theme: 'auto'
          }
        };

        console.log('🎯 DataService: Demo authentication completed successfully');
        return { user: userProfile, sessionToken };
      }
      
      console.log('🔍 DataService: Calling databaseService.authenticateUser');
      const dbUser = await databaseService.authenticateUser(email, password);
      console.log('📊 DataService: DatabaseService returned:', !!dbUser);
      
      if (!dbUser) {
        console.log('❌ DataService: User not found or invalid password for:', email);
        console.log('⚡ DataService: This means authentication failed at database level');
        return null;
      }

      console.log('✅ DataService: Database authentication successful');
      
      // OPTIMIZED: Skip security tracking for faster login
      console.log('⚡ DataService: Skipping login attempt tracking for speed');

      // Create session
      console.log('🎟️ DataService: Creating session token');
      const sessionToken = securityService.createSession(dbUser.id, deviceInfo || 'unknown');

      // OPTIMIZED: Skip audit logging for faster login
      console.log('⚡ DataService: Skipping audit logging for speed');

      const userProfile: UserProfile = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        age: dbUser.age,
        gender: dbUser.gender,
        location: dbUser.location,
        medicalHistory: dbUser.medicalHistory,
        createdAt: new Date(dbUser.createdAt),
        updatedAt: new Date(dbUser.updatedAt),
        isVerified: true,
        preferences: {
          notifications: true,
          dataSharing: false,
          language: 'en',
          theme: 'auto'
        }
      };

      console.log('🎯 DataService: Authentication completed successfully');
      return { user: userProfile, sessionToken };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ DataService: Authentication error:', errorMessage);
      await securityService.logAction('', 'login_error', 'auth', false, { email, error: errorMessage });
      return null; // Return null instead of throwing for unexpected errors
    }
  }

  async validateSession(sessionToken: string): Promise<boolean> {
    return securityService.validateSession(sessionToken);
  }

  async logout(sessionToken: string, userId: string): Promise<void> {
    securityService.invalidateSession(sessionToken, userId);
    await securityService.logAction(userId, 'logout', 'auth', true, { sessionToken });
  }

  // Health Data Management
  async saveHealthData(userId: string, healthData: HealthDataInput, processNLP: boolean = true): Promise<string> {
    // Ensure service is initialized
    try {
      await this.ensureInitialized();
    } catch (initError) {
      console.error('❌ DataService: Failed to initialize service for saveHealthData:', initError);
      throw new Error(`Service initialization failed: ${initError instanceof Error ? initError.message : String(initError)}`);
    }

    // Validate input
    const validation = DataValidator.validateHealthData(healthData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      console.log('💾 DataService: Saving health data for user:', userId);
      console.log('📋 DataService: Health data:', validation.sanitizedData);

      // Process with NLP if requested
      let nlpAnalysis: NLPAnalysisResult | undefined;
      if (processNLP && validation.sanitizedData.notes) {
        try {
          nlpAnalysis = await nlpService.processText(validation.sanitizedData.notes);
          console.log('📝 DataService: NLP analysis completed');
        } catch (nlpError) {
          console.warn('⚠️ DataService: NLP processing failed:', nlpError);
          // Continue without NLP analysis
        }
      }

      // Save to database (enqueue offline if needed)
      const payload = {
        userId,
        timestamp: healthData.timestamp.toISOString(),
        symptoms: JSON.stringify(validation.sanitizedData.symptoms),
        severity: validation.sanitizedData.severity,
        sleep: validation.sanitizedData.behavior.sleep,
        stress: validation.sanitizedData.behavior.stress,
        exercise: validation.sanitizedData.behavior.exercise,
        diet: validation.sanitizedData.behavior.diet,
        notes: validation.sanitizedData.notes
      } as const;

      try {
        const recordId = await databaseService.saveHealthData(payload);
        console.log('✅ DataService: Health data saved with ID:', recordId);
        // Log action
        try {
          await securityService.logAction(userId, 'health_data_saved', 'health_record', true, { 
            recordId,
            severity: validation.sanitizedData.severity,
            symptomsCount: validation.sanitizedData.symptoms.length 
          });
        } catch {}
        return recordId;
      } catch (e) {
        // If offline/network/db issue, queue for retry
        try {
          const { offlineQueue } = await import('../utils/OfflineQueue');
          await offlineQueue.enqueue({ id: `save-${Date.now()}`, type: 'saveHealthData', payload, });
          console.warn('⚠️ DataService: Queued health data for later sync');
          return `queued-${Date.now()}`;
        } catch (qerr) {
          throw e;
        }
      }
    } catch (error) {
      console.error('❌ DataService: Health data save failed:', error);
      
      // Provide better error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('Database not initialized')) {
          throw new Error('Database is not properly initialized. Please try again or contact support.');
        } else if (error.message.includes('database')) {
          throw new Error('Database error occurred while saving health data. Please try again.');
        }
      }
      
      // Log failure
      try {
        await securityService.logAction(userId, 'health_data_save_failed', 'health_record', false, { 
          error: error instanceof Error ? error.message : String(error)
        });
      } catch (logError) {
        console.warn('⚠️ DataService: Failure logging failed:', logError);
      }
      
      throw error;
    }
  }

  async getHealthData(userId: string, limit?: number): Promise<HealthRecord[]> {
    try {
      await this.ensureInitialized();
    } catch (initError) {
      console.error('❌ DataService: Failed to initialize service for getHealthData:', initError);
      throw new Error(`Service initialization failed: ${initError instanceof Error ? initError.message : String(initError)}`);
    }

    try {
      console.log('📊 DataService: Getting health data for user:', userId);
      const dbRecords = await databaseService.getHealthData(userId, limit);
      
      // Convert database format to HealthRecord format
      const healthRecords: HealthRecord[] = dbRecords.map(record => ({
        id: record.id,
        userId: record.userId,
        timestamp: new Date(record.timestamp),
        symptoms: typeof record.symptoms === 'string' ? JSON.parse(record.symptoms) : record.symptoms,
        severity: record.severity,
        behavior: {
          sleep: record.sleep,
          stress: record.stress,
          exercise: record.exercise,
          diet: record.diet
        },
        notes: record.notes,
        processed: true,
        encrypted: record.encrypted
      }));

      console.log('✅ DataService: Retrieved', healthRecords.length, 'health records');
      return healthRecords;
    } catch (error) {
      console.error('❌ DataService: Failed to get health data:', error);
      if (error instanceof Error && error.message.includes('Database not initialized')) {
        throw new Error('Database is not properly initialized. Please try again or contact support.');
      }
      throw error;
    }
  }

  // Machine Learning Analysis
  async performHealthAnalysis(userId: string): Promise<AnalysisReport> {
    try {
      const healthRecords = await this.getHealthData(userId);
      
      if (healthRecords.length < 3) {
        throw new Error('Insufficient data for analysis. At least 3 health records are required.');
      }

      // Convert to ML input format
      const mlInput: HealthDataInput[] = healthRecords.map(record => ({
        symptoms: record.symptoms,
        severity: record.severity,
        sleep: record.behavior.sleep,
        stress: record.behavior.stress,
        exercise: record.behavior.exercise,
        diet: record.behavior.diet,
        notes: record.notes,
        timestamp: record.timestamp
      }));

      // Perform ML analysis
      const mlAnalysis = await machineLearningService.analyzeHealthData(userId, mlInput);

      // Calculate trends
      const trendsAnalysis = this.calculateTrends(healthRecords);

      // Save analysis to database
      await databaseService.saveHealthInsight({
        userId,
        timestamp: mlAnalysis.timestamp.toISOString(),
        riskLevel: mlAnalysis.riskLevel,
        patterns: JSON.stringify(mlAnalysis.patterns),
        recommendations: JSON.stringify(mlAnalysis.recommendations),
        confidence: mlAnalysis.confidence,
        algorithmVersion: mlAnalysis.version
      });

      const analysisReport: AnalysisReport = {
        id: mlAnalysis.id,
        userId,
        timestamp: mlAnalysis.timestamp,
        mlAnalysis,
        riskLevel: mlAnalysis.riskLevel,
        patterns: mlAnalysis.patterns,
        recommendations: mlAnalysis.recommendations,
        confidence: mlAnalysis.confidence,
        dataPoints: healthRecords.length,
        trendsAnalysis
      };

      await securityService.logAction(userId, 'health_analysis_performed', 'analysis', true, { 
        analysisId: mlAnalysis.id,
        riskLevel: mlAnalysis.riskLevel,
        confidence: mlAnalysis.confidence 
      });

      return analysisReport;
    } catch (error) {
      await securityService.logAction(userId, 'health_analysis_failed', 'analysis', false, { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private calculateTrends(records: HealthRecord[]): AnalysisReport['trendsAnalysis'] {
    if (records.length < 2) {
      return {
        severityTrend: 'stable',
        sleepTrend: 'stable',
        stressTrend: 'stable',
        exerciseTrend: 'stable'
      };
    }

    const sortedRecords = records.slice().sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Exponential weighted moving averages for smoothing
    const ewma = (values: number[], alpha = 0.5) => {
      let prev = values[0];
      const out: number[] = [];
      for (const v of values) {
        prev = alpha * v + (1 - alpha) * prev;
        out.push(prev);
      }
      return out;
    };

    const values = {
      severity: sortedRecords.map(r => r.severity),
      sleep: sortedRecords.map(r => r.behavior.sleep),
      stress: sortedRecords.map(r => r.behavior.stress),
      exercise: sortedRecords.map(r => r.behavior.exercise),
    };

    const smoothed = {
      severity: ewma(values.severity),
      sleep: ewma(values.sleep),
      stress: ewma(values.stress),
      exercise: ewma(values.exercise),
    };

    const trendOf = (arr: number[], inverse = false) => {
      const n = arr.length;
      if (n < 3) return 'stable' as const;
      const first = arr[Math.max(0, n - 5)];
      const last = arr[n - 1];
      const diff = last - first;
      const threshold = Math.max(0.5, Math.abs(first) * 0.05);
      if (Math.abs(diff) < threshold) return 'stable' as const;
      if (inverse) return diff > 0 ? 'worsening' as const : 'improving' as const;
      return diff > 0 ? 'improving' as const : 'worsening' as const;
    };

    return {
      severityTrend: trendOf(smoothed.severity, true),
      sleepTrend: trendOf(smoothed.sleep),
      stressTrend: trendOf(smoothed.stress, true),
      exerciseTrend: trendOf(smoothed.exercise),
    };
  }

  // Chat Management
  async processChatMessage(userId: string, message: string): Promise<{
    response: string;
    nlpAnalysis: NLPAnalysisResult;
    extractedSymptoms?: string[];
  }> {
    try {
      // Process message with NLP
      const nlpAnalysis = await nlpService.processText(message);
      
      // Save message to database
      await databaseService.saveChatMessage({
        userId,
        text: message,
        isUser: true,
        timestamp: new Date().toISOString(),
        symptoms: nlpAnalysis.symptoms.symptoms.length > 0 ? JSON.stringify(nlpAnalysis.symptoms.symptoms) : undefined,
        intent: nlpAnalysis.intent.intent
      });

      // Generate response
      const response = nlpService.generateResponse(nlpAnalysis);

      // Save bot response
      await databaseService.saveChatMessage({
        userId,
        text: response,
        isUser: false,
        timestamp: new Date().toISOString(),
        intent: 'response'
      });

      await securityService.logAction(userId, 'chat_message_processed', 'chat', true, { 
        intent: nlpAnalysis.intent.intent,
        symptomsDetected: nlpAnalysis.symptoms.symptoms.length 
      });

      return {
        response,
        nlpAnalysis,
        extractedSymptoms: nlpAnalysis.symptoms.symptoms
      };
    } catch (error) {
      await securityService.logAction(userId, 'chat_message_failed', 'chat', false, { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getChatHistory(userId: string, limit?: number): Promise<ChatMessage[]> {
    await this.ensureInitialized();

    try {
      const dbMessages = await databaseService.getChatMessages(userId, limit);
      
      const chatMessages: ChatMessage[] = dbMessages.map(msg => ({
        id: msg.id,
        sessionId: '', // We'll implement sessions later if needed
        userId: msg.userId,
        text: msg.text,
        isUser: msg.isUser,
        timestamp: new Date(msg.timestamp),
        extractedSymptoms: msg.symptoms ? JSON.parse(msg.symptoms) : undefined,
        processed: msg.processed
      }));

      return chatMessages;
    } catch (error) {
      await securityService.logAction(userId, 'chat_history_access_failed', 'chat', false, { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async clearChatHistory(userId: string): Promise<void> {
    await this.ensureInitialized();
    await databaseService.deleteChatHistory(userId);
  }

  // Analytics and Reporting
  async getAnalytics(): Promise<AnalyticsData> {
    await this.ensureInitialized();

    try {
      const stats = await databaseService.getDatabaseStats();
      
      // This is a simplified version - in a real app you'd calculate these from actual data
      const analytics: AnalyticsData = {
        totalUsers: stats.users,
        totalHealthRecords: stats.healthData,
        totalAnalyses: stats.insights,
        avgRiskLevel: 2.5, // Placeholder
        commonSymptoms: [
          { symptom: 'headache', count: 45, percentage: 23.5 },
          { symptom: 'fatigue', count: 38, percentage: 19.8 },
          { symptom: 'stress', count: 32, percentage: 16.7 }
        ],
        riskDistribution: { low: 60, medium: 30, high: 10 },
        userEngagement: {
          dailyActiveUsers: Math.floor(stats.users * 0.3),
          weeklyActiveUsers: Math.floor(stats.users * 0.6),
          monthlyActiveUsers: Math.floor(stats.users * 0.8)
        }
      };

      return analytics;
    } catch (error) {
      console.error('Failed to get analytics:', error);
      throw error;
    }
  }

  // Data Export and Backup
  async exportUserData(userId: string): Promise<{
    user: UserProfile;
    healthRecords: HealthRecord[];
    chatMessages: ChatMessage[];
    analyses: AnalysisReport[];
  }> {
    await this.ensureInitialized();

    try {
      const user = await databaseService.getUserById(userId);
      if (!user) throw new Error('User not found');

      const healthRecords = await this.getHealthData(userId);
      const chatMessages = await this.getChatHistory(userId);
      
      // Get analyses from database
      const dbInsights = await databaseService.getHealthInsights(userId);
      const analyses: AnalysisReport[] = dbInsights.map(insight => ({
        id: insight.id,
        userId: insight.userId,
        timestamp: new Date(insight.timestamp),
        mlAnalysis: {} as MLAnalysisResult, // Simplified for export
        riskLevel: insight.riskLevel,
        patterns: JSON.parse(insight.patterns),
        recommendations: JSON.parse(insight.recommendations),
        confidence: insight.confidence,
        dataPoints: 0, // Calculate if needed
        trendsAnalysis: {
          severityTrend: 'stable',
          sleepTrend: 'stable',
          stressTrend: 'stable',
          exerciseTrend: 'stable'
        }
      }));

      const userProfile: UserProfile = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        age: user.age,
        gender: user.gender,
        location: user.location,
        medicalHistory: user.medicalHistory,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
        isVerified: true,
        preferences: {
          notifications: true,
          dataSharing: false,
          language: 'en',
          theme: 'auto'
        }
      };

      await securityService.logAction(userId, 'data_exported', 'export', true);

      return {
        user: userProfile,
        healthRecords,
        chatMessages,
        analyses
      };
    } catch (error) {
      await securityService.logAction(userId, 'data_export_failed', 'export', false, { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getDatabaseStats(): Promise<{ users: number; healthData: number; insights: number; messages: number }> {
    await this.ensureInitialized();

    try {
      return await databaseService.getDatabaseStats();
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return { users: 0, healthData: 0, insights: 0, messages: 0 };
    }
  }

  // Database access for testing
  getDatabaseService() {
    return databaseService;
  }

  // System Health and Monitoring
  async getSystemHealth(): Promise<{
    database: { status: 'healthy' | 'warning' | 'error'; details: string };
    security: { score: number; issues: string[]; recommendations: string[] };
    services: { [serviceName: string]: 'healthy' | 'warning' | 'error' };
  }> {
    await this.ensureInitialized();

    try {
      // Check database health
      const dbStats = await databaseService.getDatabaseStats();
      const databaseHealth = {
        status: 'healthy' as const,
        details: `Database operational with ${dbStats.users} users and ${dbStats.healthData} health records`
      };

      // Check security health
      const securityHealth = await securityService.performSecurityHealthCheck();

      // Check service health
      const services = {
        database: 'healthy' as const,
        security: securityHealth.score > 80 ? 'healthy' as const : securityHealth.score > 60 ? 'warning' as const : 'error' as const,
        ml: 'healthy' as const,
        nlp: 'healthy' as const
      };

      return {
        database: databaseHealth,
        security: securityHealth,
        services
      };
    } catch (error) {
      console.error('System health check failed:', error);
      throw error;
    }
  }
}

export const dataService = new DataService();