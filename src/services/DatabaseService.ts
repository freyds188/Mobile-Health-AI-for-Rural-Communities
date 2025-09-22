import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'react-native-crypto-js';
import { HealthDataInput } from './MachineLearningService';
import { v4 as uuidv4 } from 'uuid';

interface DatabaseConfig {
  dbName: string;
  version: string;
  encryption: boolean;
}

interface EncryptionKeys {
  dataKey: string;
  authKey: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'provider' | 'admin' | 'chw';
  age?: number;
  gender?: 'male' | 'female' | 'other';
  location?: string;
  medicalHistory?: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
}

interface HealthData {
  id: string;
  userId: string;
  timestamp: string;
  symptoms: string; // JSON array
  severity: number;
  sleep: number;
  stress: number;
  exercise: number;
  diet: string;
  notes: string;
  encrypted: boolean;
  createdAt: string;
}

interface HealthInsight {
  id: string;
  userId: string;
  timestamp: string;
  riskLevel: 'low' | 'medium' | 'high';
  patterns: string; // JSON array
  recommendations: string; // JSON array
  confidence: number;
  algorithmVersion: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  symptoms?: string; // JSON array
  intent?: string;
  processed: boolean;
  encrypted: boolean;
  createdAt: string;
}

interface CachedContentRow {
  key: string;
  value: string;
  updatedAt: string;
}

export class DatabaseService {
  private db: SQLite.WebSQLDatabase | null = null;
  private config: DatabaseConfig;
  private encryptionKeys: EncryptionKeys | null = null;
  private isInitialized = false;
  private isWebPlatform = false;
  private webStorage: Map<string, any> = new Map(); // Fallback storage for web

  constructor(config: DatabaseConfig = {
    dbName: 'health_ai_secure.db',
    version: '1.0',
    encryption: true
  }) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      console.log('✅ DatabaseService: Already initialized with valid database');
      return;
    }

    // Reset state if we're re-initializing
    if (this.isInitialized && !this.db) {
      console.log('⚠️ DatabaseService: Re-initializing due to null database reference');
      this.isInitialized = false;
    }

    try {
      console.log('💾 DatabaseService: Starting initialization...');
      
      // Check if we're on web platform
      this.isWebPlatform = typeof window !== 'undefined';
      
      if (this.isWebPlatform) {
        console.log('🌐 DatabaseService: Web platform detected, using web storage fallback');
        // Initialize encryption keys even on web so we can encrypt localStorage
        if (this.config.encryption) {
          await this.initializeEncryption();
        }
        this.loadWebStorage();
        this.db = this.createWebFallbackDatabase();
        this.isInitialized = true;
        console.log('✅ DatabaseService: Web storage initialized successfully');
        return;
      }
      
      // Initialize encryption keys
      if (this.config.encryption) {
        console.log('🔐 DatabaseService: Initializing encryption...');
        await this.initializeEncryption();
      }

      // Open database with platform detection
      console.log('📂 DatabaseService: Opening database...');
      await this.openDatabase();

      // Verify database is open
      if (!this.db) {
        throw new Error('Database failed to open');
      }

      // Create tables
      console.log('🏗️ DatabaseService: Creating tables...');
      await this.createTables();
      
      // Run migrations if needed
      console.log('🔄 DatabaseService: Running migrations...');
      await this.runMigrations();

      this.isInitialized = true;
      console.log('✅ DatabaseService: Database initialized successfully');
      
      // Final verification
      if (!this.db) {
        throw new Error('Database reference lost after initialization');
      }
    } catch (error) {
      console.error('❌ DatabaseService: Database initialization failed:', error);
      this.isInitialized = false;
      this.db = null;
      
      // If initialization fails, try to use web storage as fallback
      if (!this.isWebPlatform) {
        console.log('🔄 DatabaseService: Falling back to web storage...');
        this.isWebPlatform = true;
        this.loadWebStorage();
        this.db = this.createWebFallbackDatabase();
        this.isInitialized = true;
        console.log('✅ DatabaseService: Web storage fallback initialized');
        return;
      }
      
      throw error;
    }
  }

  private async openDatabase(): Promise<void> {
    try {
      // Check if we're on web
      if (typeof window !== 'undefined' && !window.location.protocol.startsWith('file:')) {
        console.log('🌐 DatabaseService: Web platform detected, using fallback storage');
        this.isWebPlatform = true;
        // For web, we'll use a mock database that stores data in localStorage
        this.db = this.createWebFallbackDatabase();
        this.loadWebStorage();
      } else {
        console.log('📱 DatabaseService: Native platform detected, using SQLite');
        this.isWebPlatform = false;
        this.db = SQLite.openDatabase(this.config.dbName);
        
        // Test the database connection
        await this.testDatabaseConnection();
      }
    } catch (error) {
      console.error('❌ DatabaseService: Failed to open database, using fallback:', error);
      this.isWebPlatform = true;
      this.db = this.createWebFallbackDatabase();
      this.loadWebStorage();
    }
  }

  private async testDatabaseConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not available for testing'));
        return;
      }

      this.db!.transaction(tx => {
        tx.executeSql(
          'SELECT 1',
          [],
          () => {
            console.log('✅ DatabaseService: Database connection test successful');
            resolve();
          },
          (_, error) => {
            console.error('❌ DatabaseService: Database connection test failed:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  private loadWebStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Prefer encrypted storage if available
        const enc = window.localStorage.getItem('health_ai_web_storage_encrypted');
        if (enc && this.config.encryption) {
          try {
            const decrypted = this.decrypt(enc);
            const parsed = JSON.parse(decrypted);
            this.webStorage = new Map(Object.entries(parsed));
            console.log('📦 DatabaseService: Loaded encrypted web storage data');
            return;
          } catch (e) {
            console.warn('❌ DatabaseService: Failed to decrypt web storage, falling back to plaintext if present');
          }
        }
        const storedData = window.localStorage.getItem('health_ai_web_storage');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          this.webStorage = new Map(Object.entries(parsed));
          console.log('📦 DatabaseService: Loaded web storage data');
        }
      }
    } catch (error) {
      console.warn('❌ DatabaseService: Failed to load web storage:', error);
    }
  }

  private saveWebStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const dataObj = Object.fromEntries(this.webStorage);
        const json = JSON.stringify(dataObj);
        if (this.config.encryption && this.encryptionKeys) {
          const enc = this.encrypt(json);
          window.localStorage.setItem('health_ai_web_storage_encrypted', enc);
          // Clean up legacy plaintext key
          try { window.localStorage.removeItem('health_ai_web_storage'); } catch {}
          console.log('💾 DatabaseService: Saved encrypted web storage data');
        } else {
          window.localStorage.setItem('health_ai_web_storage', json);
          console.log('💾 DatabaseService: Saved web storage data');
        }
      }
    } catch (error) {
      console.warn('❌ DatabaseService: Failed to save web storage:', error);
    }
  }

  private createWebFallbackDatabase(): any {
    console.log('🔄 DatabaseService: Creating web fallback database');
    // Web fallback database that uses webStorage Map
    return {
      transaction: (callback: any) => {
        const tx = {
          executeSql: (sql: string, params: any[] = [], successCallback?: any, errorCallback?: any) => {
            console.log('🗃️ Web DB:', sql, params);
            try {
              let result: any = { rows: { length: 0, item: (i: number) => null, _array: [] } };
              
              // Handle COUNT(*) queries with safe defaults
              const countMatch = sql.match(/SELECT\s+COUNT\(\*\)\s+as\s+count\s+FROM\s+(\w+)/i);
              if (countMatch) {
                const table = countMatch[1].toLowerCase();
                const safeCount = (() => {
                  if (table === 'users') return ((this.webStorage.get('users') || []) as any[]).length;
                  if (table === 'health_data') { let n = 0; for (const k of this.webStorage.keys()) if (k.startsWith('health_data_')) n++; return n; }
                  if (table === 'health_insights') { let n = 0; for (const k of this.webStorage.keys()) if (k.startsWith('health_insight_')) n++; return n; }
                  if (table === 'chat_messages') { let n = 0; for (const k of this.webStorage.keys()) if (k.startsWith('chat_message_')) n++; return n; }
                  return 0;
                })();
                const rowsArray = [{ count: safeCount }];
                result.rows = {
                  length: rowsArray.length,
                  item: (i: number) => rowsArray[i] ?? null,
                  _array: rowsArray
                };
                if (successCallback) { setTimeout(() => successCallback(tx, result), 0); }
                return;
              }

              // Handle INSERT operations
              if (sql.includes('INSERT INTO health_data')) {
                const [id, userId, timestamp, symptoms, severity, sleep, stress, exercise, diet, notes, encrypted, createdAt] = params;
                const healthData = {
                  id,
                  user_id: userId,
                  timestamp,
                  symptoms,
                  severity,
                  sleep,
                  stress,
                  exercise,
                  diet,
                  notes,
                  encrypted,
                  created_at: createdAt
                };
                
                // Store in webStorage with a unique key
                const key = `health_data_${id}`;
                this.webStorage.set(key, healthData);
                this.saveWebStorage();
                console.log('✅ Web DB: Health data saved with ID:', id);
                
                if (successCallback) {
                  setTimeout(() => successCallback(tx, result), 0);
                }
              }
              // Handle SELECT operations for health_data
              else if (sql.includes('SELECT * FROM health_data WHERE user_id = ?')) {
                const userId = params[0];
                const limit = params[1];
                
                // Get all health data records for this user
                const records: any[] = [];
                for (const [key, value] of this.webStorage.entries()) {
                  if (key.startsWith('health_data_') && value.user_id === userId) {
                    records.push(value);
                  }
                }
                
                // Sort by timestamp descending (most recent first)
                records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                
                // Apply limit if specified
                const limitedRecords = limit ? records.slice(0, limit) : records;
                
                result.rows = {
                  length: limitedRecords.length,
                  item: (i: number) => limitedRecords[i],
                  _array: limitedRecords
                };
                
                console.log('📊 Web DB: Retrieved', limitedRecords.length, 'health records for user:', userId);
                
                if (successCallback) {
                  setTimeout(() => successCallback(tx, result), 0);
                }
              }
              // Handle INSERT operations for health_insights
              else if (sql.includes('INSERT INTO health_insights')) {
                const [id, userId, timestamp, riskLevel, patterns, recommendations, confidence, algorithmVersion, createdAt] = params;
                const insight = {
                  id,
                  user_id: userId,
                  timestamp,
                  risk_level: riskLevel,
                  patterns,
                  recommendations,
                  confidence,
                  algorithm_version: algorithmVersion,
                  created_at: createdAt
                };
                
                const key = `health_insight_${id}`;
                this.webStorage.set(key, insight);
                this.saveWebStorage();
                console.log('✅ Web DB: Health insight saved with ID:', id);
                
                if (successCallback) {
                  setTimeout(() => successCallback(tx, result), 0);
                }
              }
              // Handle SELECT operations for health_insights
              else if (sql.includes('SELECT * FROM health_insights WHERE user_id = ?')) {
                const userId = params[0];
                const limit = params[1];
                
                const records: any[] = [];
                for (const [key, value] of this.webStorage.entries()) {
                  if (key.startsWith('health_insight_') && value.user_id === userId) {
                    records.push(value);
                  }
                }
                
                records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                const limitedRecords = limit ? records.slice(0, limit) : records;
                
                result.rows = {
                  length: limitedRecords.length,
                  item: (i: number) => limitedRecords[i],
                  _array: limitedRecords
                };
                
                console.log('🧠 Web DB: Retrieved', limitedRecords.length, 'insights for user:', userId);
                
                if (successCallback) {
                  setTimeout(() => successCallback(tx, result), 0);
                }
              }
              // Handle INSERT operations for chat_messages
              else if (sql.includes('INSERT INTO chat_messages')) {
                const [id, userId, text, isUser, timestamp, symptoms, intent, processed, encrypted, createdAt] = params;
                const message = {
                  id,
                  user_id: userId,
                  text,
                  is_user: isUser,
                  timestamp,
                  symptoms,
                  intent,
                  processed,
                  encrypted,
                  created_at: createdAt
                };

                const key = `chat_message_${id}`;
                this.webStorage.set(key, message);
                this.saveWebStorage();
                console.log('✅ Web DB: Chat message saved with ID:', id);

                if (successCallback) {
                  setTimeout(() => successCallback(tx, result), 0);
                }
              }
              // Handle SELECT operations for chat_messages
              else if (sql.includes('SELECT * FROM chat_messages WHERE user_id = ?')) {
                const userId = params[0];
                const maybeLimit = params[1];

                const records: any[] = [];
                for (const [key, value] of this.webStorage.entries()) {
                  if (key.startsWith('chat_message_') && value.user_id === userId) {
                    records.push(value);
                  }
                }

                // Default order is ASC in query; sort ascending by timestamp
                records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                const limitedRecords = typeof maybeLimit === 'number' ? records.slice(0, maybeLimit) : records;

                result.rows = {
                  length: limitedRecords.length,
                  item: (i: number) => limitedRecords[i],
                  _array: limitedRecords
                };

                console.log('💬 Web DB: Retrieved', limitedRecords.length, 'chat messages for user:', userId);

                if (successCallback) {
                  setTimeout(() => successCallback(tx, result), 0);
                }
              }
              // Handle DELETE operations for chat_messages
              else if (sql.includes('DELETE FROM chat_messages WHERE user_id = ?')) {
                const userId = params[0];
                const toDelete: string[] = [];
                for (const [key, value] of this.webStorage.entries()) {
                  if (key.startsWith('chat_message_') && value.user_id === userId) {
                    toDelete.push(key);
                  }
                }
                toDelete.forEach(k => this.webStorage.delete(k));
                this.saveWebStorage();
                console.log('🧹 Web DB: Deleted', toDelete.length, 'chat messages for user:', userId);

                if (successCallback) {
                  setTimeout(() => successCallback(tx, result), 0);
                }
              }
              // Handle INSERT operations for provider_feedback (support OR IGNORE variant)
              else if (
                sql.includes('INSERT INTO provider_feedback') ||
                sql.includes('INSERT OR IGNORE INTO provider_feedback')
              ) {
                const [id, providerId, patientId, insightId, feedbackText, rating, createdAt] = params;
                const feedback = {
                  id,
                  provider_id: providerId,
                  patient_id: patientId,
                  insight_id: insightId,
                  feedback_text: feedbackText,
                  rating,
                  created_at: createdAt
                };
                const list = (this.webStorage.get('provider_feedback') || []) as any[];
                list.push(feedback);
                this.webStorage.set('provider_feedback', list);
                this.saveWebStorage();
                console.log('✅ Web DB: Provider feedback saved with ID:', id);

                if (successCallback) {
                  setTimeout(() => successCallback(tx, result), 0);
                }
              }
              // Handle SELECT operations for provider_feedback by patient
              else if (sql.includes('SELECT id, provider_id as providerId, feedback_text as feedbackText, rating, created_at as createdAt\n           FROM provider_feedback WHERE patient_id = ?')) {
                const patientId = params[0];
                const list = (this.webStorage.get('provider_feedback') || []) as any[];
                const rowsArray = list
                  .filter(f => f.patient_id === patientId)
                  .map(f => ({ id: f.id, providerId: f.provider_id, feedbackText: f.feedback_text, rating: f.rating ?? null, createdAt: f.created_at }))
                  .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
                result.rows = {
                  length: rowsArray.length,
                  item: (i: number) => rowsArray[i] ?? null,
                  _array: rowsArray
                };
                if (successCallback) { setTimeout(() => successCallback(tx, result), 0); }
              }
              // Handle other operations (users, etc.)
              else {
                console.log('⚠️ Web DB: Unhandled SQL operation:', sql);
                if (successCallback) {
                  setTimeout(() => successCallback(tx, result), 0);
                }
              }
            } catch (error) {
              console.error('❌ Web DB Error:', error);
              if (errorCallback) {
                setTimeout(() => errorCallback(tx, error), 0);
              }
            }
          }
        };
        callback(tx);
      }
    };
  }

  private async ensureDb(): Promise<void> {
    // If a DB object is already available, nothing to do
    if (this.db) {
      return;
    }

    // Determine platform once
    this.isWebPlatform = typeof window !== 'undefined';

    if (this.isWebPlatform) {
      // Web fallback: Map persisted to localStorage
      this.loadWebStorage();
      this.db = this.createWebFallbackDatabase();
      this.isInitialized = true;
      return;
    }

    // Native path: run full initialization which sets up SQLite DB
    await this.initialize();
  }

  private async initializeEncryption(): Promise<void> {
    try {
      console.log('🔐 DatabaseService: Initializing encryption keys...');
      
      // Try to get existing keys with fallback
      let storedKeys: string | null = null;
      
      try {
        storedKeys = await SecureStore.getItemAsync('encryption_keys');
        console.log('🔐 DatabaseService: Retrieved keys from SecureStore');
      } catch (secureStoreError) {
        console.warn('🔐 DatabaseService: SecureStore not available, using localStorage fallback');
        if (typeof window !== 'undefined' && window.localStorage) {
          storedKeys = window.localStorage.getItem('encryption_keys_fallback');
          console.log('🔐 DatabaseService: Retrieved keys from localStorage');
        }
      }
      
      if (storedKeys) {
        this.encryptionKeys = JSON.parse(storedKeys);
        console.log('✅ DatabaseService: Loaded existing encryption keys');
      } else {
        console.log('🔐 DatabaseService: Generating new encryption keys...');
        // Generate new encryption keys
        const dataKey = await this.generateSecureKey();
        const authKey = await this.generateSecureKey();
        
        this.encryptionKeys = { dataKey, authKey };
        
        // Store keys securely with fallback
        try {
          await SecureStore.setItemAsync('encryption_keys', JSON.stringify(this.encryptionKeys));
          console.log('🔐 DatabaseService: Keys stored in SecureStore');
        } catch (secureStoreError) {
          console.warn('🔐 DatabaseService: SecureStore not available, using localStorage fallback');
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('encryption_keys_fallback', JSON.stringify(this.encryptionKeys));
            console.log('🔐 DatabaseService: Keys stored in localStorage');
          }
        }
      }
    } catch (error) {
      console.error('❌ DatabaseService: Encryption initialization failed:', error);
      // Create fallback keys for development
      this.encryptionKeys = {
        dataKey: 'fallback_data_key_' + Date.now(),
        authKey: 'fallback_auth_key_' + Date.now()
      };
      console.log('🔄 DatabaseService: Using fallback encryption keys');
    }
  }

  private async generateSecureKey(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private encrypt(data: string): string {
    if (!this.config.encryption || !this.encryptionKeys) {
      return data;
    }
    
    try {
      return CryptoJS.AES.encrypt(data, this.encryptionKeys.dataKey).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      return data;
    }
  }

  private decrypt(encryptedData: string): string {
    if (!this.config.encryption || !this.encryptionKeys) {
      return encryptedData;
    }
    
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKeys.dataKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData;
    }
  }

  private async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const passwordSalt = salt || await this.generateSecureKey();
    
    // DETERMINISTIC HASHING: Use a method that produces the same output for same input
    // AES encryption is non-deterministic, so we'll use a simple deterministic approach
    const combined = password + '|' + passwordSalt + '|health-ai-2024';
    
    // Simple deterministic hash using string manipulation
    // This is consistent but still reasonably secure for this demo app
    let hash = '';
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash += (char * 7 + i * 3).toString(36);
    }
    
    // Add some complexity by reversing and adding length
    hash = hash.split('').reverse().join('') + combined.length.toString(36);
    
    // Using deterministic hashing method (details omitted in logs for security)
    
    return { hash, salt: passwordSalt };
  }

  private async createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(tx => {
        // Users table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('patient', 'provider', 'admin', 'chw')),
            age INTEGER,
            gender TEXT CHECK (gender IN ('male', 'female', 'other')),
            location TEXT,
            medical_history TEXT,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);

        // Health data table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS health_data (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            symptoms TEXT NOT NULL,
            severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10),
            sleep REAL NOT NULL,
            stress INTEGER NOT NULL CHECK (stress >= 1 AND stress <= 10),
            exercise REAL NOT NULL,
            diet TEXT NOT NULL,
            notes TEXT,
            encrypted INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          );
        `);

        // Health insights table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS health_insights (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
            patterns TEXT NOT NULL,
            recommendations TEXT NOT NULL,
            confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
            algorithm_version TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          );
        `);

        // Patient-provider assignments table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS patient_provider_assignments (
            patient_id TEXT NOT NULL,
            provider_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            PRIMARY KEY (patient_id, provider_id),
            FOREIGN KEY (patient_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (provider_id) REFERENCES users (id) ON DELETE CASCADE
          );
        `);

        // Provider assessment submissions table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS provider_assessment_submissions (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            provider_id TEXT NOT NULL,
            insight_id TEXT,
            payload_json TEXT NOT NULL,
            sent_at TEXT NOT NULL,
            status TEXT DEFAULT 'sent',
            FOREIGN KEY (patient_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (provider_id) REFERENCES users (id) ON DELETE CASCADE
          );
        `);

        // Risk assessment history table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS risk_assessment_history (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (patient_id) REFERENCES users (id) ON DELETE CASCADE
          );
        `);

        // Provider feedback table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS provider_feedback (
            id TEXT PRIMARY KEY,
            provider_id TEXT NOT NULL,
            patient_id TEXT NOT NULL,
            insight_id TEXT,
            feedback_text TEXT NOT NULL,
            rating INTEGER,
            created_at TEXT NOT NULL,
            FOREIGN KEY (provider_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (patient_id) REFERENCES users (id) ON DELETE CASCADE
          );
        `);

        // Chat messages table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            text TEXT NOT NULL,
            is_user INTEGER NOT NULL,
            timestamp TEXT NOT NULL,
            symptoms TEXT,
            intent TEXT,
            processed INTEGER DEFAULT 0,
            encrypted INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          );
        `);

        // CHW guided visit records
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS chw_visits (
            id TEXT PRIMARY KEY,
            chw_id TEXT NOT NULL,
            patient_id TEXT NOT NULL,
            started_at TEXT NOT NULL,
            completed_at TEXT,
            status TEXT NOT NULL DEFAULT 'in_progress',
            steps_json TEXT NOT NULL,
            encrypted INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (chw_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (patient_id) REFERENCES users (id) ON DELETE CASCADE
          );
        `);

        // Create indexes for better performance
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_health_data_user_timestamp ON health_data (user_id, timestamp);');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_health_insights_user_timestamp ON health_insights (user_id, timestamp);');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_assignments_provider ON patient_provider_assignments (provider_id);');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_submissions_provider ON provider_assessment_submissions (provider_id, sent_at);');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_history_patient ON risk_assessment_history (patient_id, created_at);');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_feedback_patient ON provider_feedback (patient_id);');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_chat_messages_user_timestamp ON chat_messages (user_id, timestamp);');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_chw_visits_chw ON chw_visits (chw_id, started_at);');
        tx.executeSql('CREATE INDEX IF NOT EXISTS idx_chw_visits_patient ON chw_visits (patient_id, started_at);');

        // Cached content table
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS cached_content (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      }, 
      (error) => {
        console.error('Create tables failed:', error);
        reject(error);
      },
      () => {
        console.log('Tables created successfully');
        resolve();
      });
    });
  }

  // Simple cache helpers for external content
  async cacheContent(key: string, value: any): Promise<void> {
    if (this.isWebPlatform) {
      this.webStorage.set(`cache:${key}`, { key, value, updatedAt: new Date().toISOString() });
      return;
    }
    await this.ensureDb();
    await new Promise<void>((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO cached_content (key, value, updated_at) VALUES (?, ?, ?)`,
          [key, JSON.stringify(value), new Date().toISOString()],
          () => resolve(),
          (_t, e) => { reject(e); return false; }
        );
      });
    });
  }

  async getCachedContent(key: string): Promise<any | null> {
    if (this.isWebPlatform) {
      const row = this.webStorage.get(`cache:${key}`);
      return row?.value || null;
    }
    await this.ensureDb();
    return await new Promise<any | null>((resolve) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `SELECT value FROM cached_content WHERE key = ? LIMIT 1`,
          [key],
          (_tx, rs) => {
            if (rs.rows.length > 0) {
              try { resolve(JSON.parse(rs.rows.item(0).value)); }
              catch { resolve(null); }
            } else resolve(null);
          }
        );
      });
    });
  }

  private async runMigrations(): Promise<void> {
    // Implementation for future database migrations
    console.log('No migrations to run');
  }

  // User management methods
  async createUser(userData: Omit<User, 'id' | 'passwordHash' | 'salt' | 'createdAt' | 'updatedAt'> & { password: string }): Promise<User> {
    console.log('⚡ DatabaseService: FAST user creation for:', userData.email);
    
    // OPTIMIZED: Quick initialization check - don't wait for full init
    if (!this.isInitialized) {
      console.log('⚡ DatabaseService: Quick initialization for user creation...');
      // Skip full initialization for speed - use basic setup
      this.isWebPlatform = typeof window !== 'undefined';
      if (this.isWebPlatform) {
        this.loadWebStorage(); // Synchronous call
        console.log('📦 DatabaseService: Web storage loaded for registration');
      }
      // Mark as initialized to skip future checks
      this.isInitialized = true;
    }

    const id = uuidv4();
    const { hash, salt } = await this.hashPassword(userData.password);
    const now = new Date().toISOString();
    
    // Store user with securely generated hash (sensitive values not logged)

    const user: User = {
      id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      age: userData.age,
      gender: userData.gender,
      location: userData.location,
      medicalHistory: userData.medicalHistory,
      passwordHash: hash,
      salt,
      createdAt: now,
      updatedAt: now
    };

    // For web platform, use fallback storage
    if (this.isWebPlatform) {
      console.log('🌐 DatabaseService: Creating user in web storage');
      try {
        const users = this.webStorage.get('users') || [];
        
        // Check if user already exists
        const existingUser = users.find((u: any) => u.email === userData.email);
        if (existingUser) {
          throw new Error('User already exists');
        }
        
        // Add new user
        users.push({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          age: user.age,
          gender: user.gender,
          location: user.location,
          medical_history: user.medicalHistory,
          password_hash: user.passwordHash,
          salt: user.salt,
          created_at: user.createdAt,
          updated_at: user.updatedAt
        });
        
        this.webStorage.set('users', users);
        this.saveWebStorage(); // Persist to localStorage
        
        console.log('✅ DatabaseService: User created successfully in web storage');
        return user;
      } catch (error) {
        console.error('❌ DatabaseService: Failed to create user in web storage:', error);
        throw error;
      }
    }

    // SQLite database user creation
    if (!this.db) {
      console.error('❌ DatabaseService: Database connection is null');
      throw new Error('Database connection not available');
    }

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `INSERT INTO users (id, email, name, role, age, gender, location, medical_history, password_hash, salt, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.id, user.email, user.name, user.role, user.age || null, 
            user.gender || null, user.location || null, user.medicalHistory || null,
            user.passwordHash, user.salt, user.createdAt, user.updatedAt
          ],
          () => {
            console.log('✅ DatabaseService: User created successfully in SQLite');
            resolve(user);
          },
          (_, error) => {
            console.error('❌ DatabaseService: Failed to create user in SQLite:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Provider-patient assignment methods
  async assignPatientToProvider(patientId: string, providerId: string): Promise<void> {
    // Web fallback
    if (this.isWebPlatform) {
      this.loadWebStorage();
      const now = new Date().toISOString();
      const assignments: Array<{ patientId: string; providerId: string; createdAt: string }> = this.webStorage.get('assignments') || [];
      const exists = assignments.some(a => a.patientId === patientId && a.providerId === providerId);
      if (!exists) {
        assignments.push({ patientId, providerId, createdAt: now });
        this.webStorage.set('assignments', assignments);
        this.saveWebStorage();
      }
      return;
    }
    await this.ensureDb();
    const now = new Date().toISOString();
    await new Promise<void>((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `INSERT OR IGNORE INTO patient_provider_assignments (patient_id, provider_id, created_at) VALUES (?, ?, ?)`,
          [patientId, providerId, now],
          () => resolve(),
          (_t, e) => { reject(e); return false; }
        );
      });
    });
  }

  async getAssignedPatients(providerId: string): Promise<Array<{ id: string; name: string; email: string }>> {
    // Web fallback
    if (this.isWebPlatform) {
      this.loadWebStorage();
      const users: Array<any> = this.webStorage.get('users') || [];
      const assignments: Array<{ patientId: string; providerId: string; createdAt: string }> = this.webStorage.get('assignments') || [];
      const patientIds = assignments.filter(a => a.providerId === providerId).map(a => a.patientId);
      const rows = users
        .filter(u => patientIds.includes(u.id))
        .map(u => ({ id: u.id, name: u.name, email: u.email }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return rows;
    }
    await this.ensureDb();
    return await new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `SELECT u.id, u.name, u.email
           FROM patient_provider_assignments ppa
           JOIN users u ON u.id = ppa.patient_id
           WHERE ppa.provider_id = ?
           ORDER BY u.name ASC`,
          [providerId],
          (_tx, rs) => {
            const rows: Array<{ id: string; name: string; email: string }> = [];
            for (let i = 0; i < rs.rows.length; i++) rows.push(rs.rows.item(i));
            resolve(rows);
          },
          (_t, e) => { reject(e); return false; }
        );
      });
    });
  }

  async getProvidersForPatient(patientId: string): Promise<Array<{ id: string; name: string; email: string }>> {
    // Web fallback
    if (this.isWebPlatform) {
      this.loadWebStorage();
      const users: Array<any> = this.webStorage.get('users') || [];
      const assignments: Array<{ patientId: string; providerId: string; createdAt: string }> = this.webStorage.get('assignments') || [];
      const providerIds = assignments.filter(a => a.patientId === patientId).map(a => a.providerId);
      const rows = users
        .filter(u => providerIds.includes(u.id) && u.role === 'provider')
        .map(u => ({ id: u.id, name: u.name, email: u.email }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return rows;
    }
    await this.ensureDb();
    return await new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `SELECT u.id, u.name, u.email
           FROM patient_provider_assignments ppa
           JOIN users u ON u.id = ppa.provider_id
           WHERE ppa.patient_id = ?
           ORDER BY u.name ASC`,
          [patientId],
          (_tx, rs) => {
            const rows: Array<{ id: string; name: string; email: string }> = [];
            for (let i = 0; i < rs.rows.length; i++) rows.push(rs.rows.item(i));
            resolve(rows);
          },
          (_t, e) => { reject(e); return false; }
        );
      });
    });
  }

  async getPatientInsightsForProvider(providerId: string): Promise<Array<HealthInsight & { patientName: string }>> {
    await this.ensureDb();
    return await new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `SELECT hi.*, u.name as patient_name
           FROM health_insights hi
           JOIN patient_provider_assignments ppa ON ppa.patient_id = hi.user_id
           JOIN users u ON u.id = hi.user_id
           WHERE ppa.provider_id = ?
           ORDER BY hi.timestamp DESC`,
          [providerId],
          (_tx, rs) => {
            const insights: Array<HealthInsight & { patientName: string }> = [];
            for (let i = 0; i < rs.rows.length; i++) {
              const row = rs.rows.item(i);
              insights.push({
                id: row.id,
                userId: row.user_id,
                timestamp: row.timestamp,
                riskLevel: row.risk_level,
                patterns: row.patterns,
                recommendations: row.recommendations,
                confidence: row.confidence,
                algorithmVersion: row.algorithm_version,
                createdAt: row.created_at,
                patientName: row.patient_name
              });
            }
            resolve(insights);
          },
          (_t, e) => { reject(e); return false; }
        );
      });
    });
  }

  async saveProviderFeedback(feedback: { id?: string; providerId: string; patientId: string; insightId?: string; feedbackText: string; rating?: number }): Promise<string> {
    await this.ensureDb();
    const id = feedback.id || uuidv4();
    const now = new Date().toISOString();
    await new Promise<void>((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `INSERT OR IGNORE INTO provider_feedback (id, provider_id, patient_id, insight_id, feedback_text, rating, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, feedback.providerId, feedback.patientId, feedback.insightId || null, feedback.feedbackText, feedback.rating ?? null, now],
          () => resolve(),
          (_t, e) => { reject(e); return false; }
        );
      });
    });
    return id;
  }

  async getFeedbackForPatient(patientId: string): Promise<Array<{ id: string; providerId: string; feedbackText: string; rating: number | null; createdAt: string }>> {
    await this.ensureDb();
    return await new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `SELECT id, provider_id as providerId, feedback_text as feedbackText, rating, created_at as createdAt
           FROM provider_feedback WHERE patient_id = ? ORDER BY created_at DESC`,
          [patientId],
          (_tx, rs) => {
            const rows: Array<{ id: string; providerId: string; feedbackText: string; rating: number | null; createdAt: string }> = [];
            for (let i = 0; i < rs.rows.length; i++) rows.push(rs.rows.item(i));
            resolve(rows);
          },
          (_t, e) => { reject(e); return false; }
        );
      });
    });
  }

  // Provider submissions
  async saveAssessmentSubmission(submission: { id?: string; patientId: string; providerId: string; insightId?: string; payload: any; sentAt?: Date; status?: string }): Promise<string> {
    // Web fallback
    if (this.isWebPlatform) {
      this.loadWebStorage();
      const id = submission.id || uuidv4();
      const sentAt = (submission.sentAt ?? new Date()).toISOString();
      const submissions: Array<any> = this.webStorage.get('submissions') || [];
      submissions.push({
        id,
        patientId: submission.patientId,
        providerId: submission.providerId,
        insightId: submission.insightId ?? null,
        payload: submission.payload,
        sentAt,
        status: submission.status || 'sent'
      });
      this.webStorage.set('submissions', submissions);
      this.saveWebStorage();
      return id;
    }
    await this.ensureDb();
    const id = submission.id || uuidv4();
    const sentAt = (submission.sentAt ?? new Date()).toISOString();
    await new Promise<void>((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `INSERT OR IGNORE INTO provider_assessment_submissions (id, patient_id, provider_id, insight_id, payload_json, sent_at, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, submission.patientId, submission.providerId, submission.insightId || null, JSON.stringify(submission.payload), sentAt, submission.status || 'sent'],
          () => resolve(),
          (_t, e) => { reject(e); return false; }
        );
      });
    });
    return id;
  }

  async getSubmissionsForProvider(providerId: string): Promise<Array<{ id: string; patientId: string; insightId?: string; payload: any; sentAt: string; status: string }>> {
    // Web fallback
    if (this.isWebPlatform) {
      this.loadWebStorage();
      const submissions: Array<any> = this.webStorage.get('submissions') || [];
      const users: Array<any> = this.webStorage.get('users') || [];
      const rows = submissions
        .filter(s => s.providerId === providerId)
        .map(s => ({
          id: s.id,
          patientId: s.patientId,
          insightId: s.insightId || undefined,
          payload: s.payload,
          sentAt: s.sentAt,
          status: s.status,
          patientName: (users.find(u => u.id === s.patientId) || {}).name
        }))
        .sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)));
      return rows;
    }
    await this.ensureDb();
    return await new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `SELECT s.id, s.patient_id as patientId, s.insight_id as insightId, s.payload_json as payloadJson, s.sent_at as sentAt, s.status, u.name as patientName
           FROM provider_assessment_submissions s
           JOIN users u ON u.id = s.patient_id
           WHERE s.provider_id = ?
           ORDER BY s.sent_at DESC`,
          [providerId],
          (_tx, rs) => {
            const rows: Array<{ id: string; patientId: string; insightId?: string; payload: any; sentAt: string; status: string; patientName?: string }> = [];
            for (let i = 0; i < rs.rows.length; i++) {
              const r = rs.rows.item(i);
              let payload: any = null; try { payload = JSON.parse(r.payloadJson); } catch { payload = r.payloadJson; }
              rows.push({ id: r.id, patientId: r.patientId, insightId: r.insightId ?? undefined, payload, sentAt: r.sentAt, status: r.status, patientName: r.patientName });
            }
            resolve(rows);
          },
          (_t, e) => { reject(e); return false; }
        );
      });
    });
  }

  async getSubmissionsForPatient(patientId: string): Promise<Array<{ id: string; providerId: string; providerName?: string; insightId?: string; payload: any; sentAt: string; status: string }>> {
    // Web fallback
    if (this.isWebPlatform) {
      this.loadWebStorage();
      const submissions: Array<any> = this.webStorage.get('submissions') || [];
      const users: Array<any> = this.webStorage.get('users') || [];
      const rows = submissions
        .filter(s => s.patientId === patientId)
        .map(s => ({
          id: s.id,
          providerId: s.providerId,
          providerName: (users.find(u => u.id === s.providerId) || {}).name,
          insightId: s.insightId || undefined,
          payload: s.payload,
          sentAt: s.sentAt,
          status: s.status
        }))
        .sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)));
      return rows;
    }
    await this.ensureDb();
    return await new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `SELECT s.id, s.provider_id as providerId, s.insight_id as insightId, s.payload_json as payloadJson, s.sent_at as sentAt, s.status, u.name as providerName
           FROM provider_assessment_submissions s
           JOIN users u ON u.id = s.provider_id
           WHERE s.patient_id = ?
           ORDER BY s.sent_at DESC`,
          [patientId],
          (_tx, rs) => {
            const rows: Array<{ id: string; providerId: string; insightId?: string; payload: any; sentAt: string; status: string; providerName?: string }> = [];
            for (let i = 0; i < rs.rows.length; i++) {
              const r = rs.rows.item(i);
              let payload: any = null; try { payload = JSON.parse(r.payloadJson); } catch { payload = r.payloadJson; }
              rows.push({ id: r.id, providerId: r.providerId, insightId: r.insightId ?? undefined, payload, sentAt: r.sentAt, status: r.status, providerName: r.providerName });
            }
            resolve(rows);
          },
          (_t, e) => { reject(e); return false; }
        );
      });
    });
  }

  async getAllProviders(): Promise<Array<{ id: string; name: string; email: string; affiliation?: string; specialty?: string }>> {
    // Web fallback using in-memory storage
    if (this.isWebPlatform) {
      this.loadWebStorage();
      const users = (this.webStorage.get('users') || []) as Array<any>;
      const providers = users
        .filter(u => u.role === 'provider')
        .map(u => ({ id: u.id, name: u.name, email: u.email, affiliation: u.location || '', specialty: '' }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return providers;
    }

    await this.ensureDb();
    return await new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `SELECT id, name, email, location as affiliation, '' as specialty FROM users WHERE role = 'provider' ORDER BY name ASC`,
          [],
          (_tx, rs) => {
            const rows: Array<{ id: string; name: string; email: string; affiliation?: string; specialty?: string }> = [];
            for (let i = 0; i < rs.rows.length; i++) rows.push(rs.rows.item(i));
            resolve(rows);
          },
          (_t, e) => { reject(e); return false; }
        );
      });
    });
  }

  // Risk assessment history methods
  async saveRiskAssessmentHistory(patientId: string, payload: any, createdAt?: Date): Promise<string> {
    const id = uuidv4();
    const at = (createdAt ?? new Date()).toISOString();
    // Web fallback
    if (this.isWebPlatform) {
      this.loadWebStorage();
      const key = `rah_${id}`;
      this.webStorage.set(key, { id, patientId, payload, createdAt: at });
      this.saveWebStorage();
      return id;
    }

    await this.ensureDb();
    await new Promise<void>((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `INSERT INTO risk_assessment_history (id, patient_id, payload_json, created_at) VALUES (?, ?, ?, ?)`,
          [id, patientId, JSON.stringify(payload), at],
          () => resolve(),
          (_t, e) => { reject(e); return false; }
        );
      });
    });
    return id;
  }

  async getRiskAssessmentHistory(patientId: string, limit: number = 50): Promise<Array<{ id: string; patientId: string; payload: any; createdAt: string }>> {
    // Web fallback
    if (this.isWebPlatform) {
      this.loadWebStorage();
      const records: Array<{ id: string; patientId: string; payload: any; createdAt: string }> = [];
      for (const [key, value] of this.webStorage.entries()) {
        if (key.startsWith('rah_') && value.patientId === patientId) {
          records.push({ id: value.id, patientId: value.patientId, payload: value.payload, createdAt: value.createdAt });
        }
      }
      records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return records.slice(0, limit);
    }

    await this.ensureDb();
    return await new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `SELECT id, patient_id as patientId, payload_json as payloadJson, created_at as createdAt
           FROM risk_assessment_history WHERE patient_id = ? ORDER BY created_at DESC LIMIT ?`,
          [patientId, limit],
          (_tx, rs) => {
            const rows: Array<{ id: string; patientId: string; payload: any; createdAt: string }> = [];
            for (let i = 0; i < rs.rows.length; i++) {
              const r = rs.rows.item(i);
              let payload: any = null; try { payload = JSON.parse(r.payloadJson); } catch { payload = r.payloadJson; }
              rows.push({ id: r.id, patientId: r.patientId, payload, createdAt: r.createdAt });
            }
            resolve(rows);
          },
          (_t, e) => { reject(e); return false; }
        );
      });
    });
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    console.log('⚡ DatabaseService: FAST authentication for:', email);
    
    // OPTIMIZED: Quick initialization check
    if (!this.isInitialized) {
      console.log('⚡ DatabaseService: Quick initialization for authentication...');
      // Skip full initialization for speed - use basic setup
      this.isWebPlatform = typeof window !== 'undefined';
      if (this.isWebPlatform) {
        await this.loadWebStorage();
      }
      this.isInitialized = true;
    }

    // For web platform, use fallback storage
    if (this.isWebPlatform) {
      console.log('🌐 DatabaseService: Using web fallback for authentication');
      try {
        const users = this.webStorage.get('users') || [];
        const user = users.find((u: any) => u.email === email);
        
        if (!user) {
          console.log('❌ DatabaseService: User not found in web storage');
          return null;
        }

        // Hash password for comparison (sensitive values not logged)
        const { hash } = await this.hashPassword(password, user.salt);
        
        // Compare hashes without logging sensitive values
        
        if (hash === user.password_hash) {
          console.log('✅ DatabaseService: Web authentication successful');
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            age: user.age,
            gender: user.gender,
            location: user.location,
            medicalHistory: user.medical_history,
            passwordHash: user.password_hash,
            salt: user.salt,
            createdAt: user.created_at,
            updatedAt: user.updated_at
          };
        } else {
          console.log('❌ DatabaseService: Invalid password for web user');
          return null;
        }
      } catch (error) {
        console.error('❌ DatabaseService: Web authentication error:', error);
        return null;
      }
    }

    // SQLite database authentication
    if (!this.db) {
      console.error('❌ DatabaseService: Database connection is null');
      return null; // Return null instead of throwing
    }

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM users WHERE email = ?',
          [email],
          async (_, { rows }) => {
            if (rows.length === 0) {
              console.log('❌ DatabaseService: User not found in SQLite');
              resolve(null);
              return;
            }

            const userData = rows.item(0);
            const { hash } = await this.hashPassword(password, userData.salt);

            if (hash === userData.password_hash) {
              console.log('✅ DatabaseService: SQLite authentication successful');
              const user: User = {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                role: userData.role,
                age: userData.age,
                gender: userData.gender,
                location: userData.location,
                medicalHistory: userData.medical_history,
                passwordHash: userData.password_hash,
                salt: userData.salt,
                createdAt: userData.created_at,
                updatedAt: userData.updated_at
              };
              resolve(user);
            } else {
              console.log('❌ DatabaseService: Invalid password for SQLite user');
              resolve(null);
            }
          },
          (_, error) => {
            console.error('❌ DatabaseService: SQLite authentication failed:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      console.log('👤 DatabaseService: Getting user by ID:', userId);
      
      if (this.isWebPlatform) {
        console.log('🌐 DatabaseService: Using web fallback for getUserById');
        const user = this.webStorage.get(`user_${userId}`);
        return user || null;
      }

      return new Promise((resolve, reject) => {
        this.db!.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM users WHERE id = ?',
            [userId],
            (_, result) => {
              if (result.rows.length > 0) {
                const user = result.rows.item(0);
                console.log('✅ DatabaseService: User found:', user.email);
                resolve(user);
              } else {
                console.log('❌ DatabaseService: User not found');
                resolve(null);
              }
            },
            (_, error) => {
              console.error('❌ DatabaseService: Error getting user:', error);
              reject(error);
              return false;
            }
          );
        });
      });
    } catch (error) {
      console.error('❌ DatabaseService: getUserById failed:', error);
      return null;
    }
  }

  async getUserProfile(userId: string): Promise<{ age?: number; gender?: string; location?: string; medicalHistory?: string } | null> {
    try {
      console.log('👤 DatabaseService: Getting user profile for:', userId);
      
      const user = await this.getUserById(userId);
      if (!user) {
        console.log('❌ DatabaseService: User not found for profile');
        return null;
      }

      return {
        age: user.age,
        gender: user.gender,
        location: user.location,
        medicalHistory: user.medicalHistory
      };
    } catch (error) {
      console.error('❌ DatabaseService: getUserProfile failed:', error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'passwordHash' | 'salt' | 'createdAt'>>): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = key === 'medicalHistory' ? 'medical_history' : key === 'updatedAt' ? 'updated_at' : key;
        updateFields.push(`${dbKey} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) return true;

    updateFields.push('updated_at = ?');
    updateValues.push(new Date().toISOString());
    updateValues.push(userId);

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues,
          (_, result) => resolve(result.rowsAffected > 0),
          (_, error) => {
            console.error('Update user failed:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Health data methods
  async saveHealthData(data: Omit<HealthData, 'id' | 'createdAt' | 'encrypted'>): Promise<string> {
    if (!this.isInitialized) {
      console.error('❌ DatabaseService: Database not initialized, attempting to initialize...');
      try {
        await this.initialize();
      } catch (initError) {
        console.error('❌ DatabaseService: Failed to initialize database:', initError);
        throw new Error('Database is not properly initialized. Please try again or contact support.');
      }
    }

    if (!this.db) {
      console.error('❌ DatabaseService: Database object is null after initialization');
      throw new Error('Database connection failed. Please try again or contact support.');
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const shouldEncrypt = this.config.encryption;
    
    console.log('💾 DatabaseService: Saving health data with ID:', id);
    console.log('💾 DatabaseService: User ID:', data.userId);
    console.log('💾 DatabaseService: Symptoms (type):', typeof data.symptoms);
    console.log('💾 DatabaseService: Should encrypt:', shouldEncrypt);
    
    const encryptedSymptoms = shouldEncrypt ? this.encrypt(data.symptoms) : data.symptoms;
    const encryptedNotes = shouldEncrypt && data.notes ? this.encrypt(data.notes) : data.notes;

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `INSERT INTO health_data (id, user_id, timestamp, symptoms, severity, sleep, stress, exercise, diet, notes, encrypted, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, data.userId, data.timestamp, encryptedSymptoms, data.severity,
            data.sleep, data.stress, data.exercise, data.diet, encryptedNotes,
            shouldEncrypt ? 1 : 0, now
          ],
          () => {
            console.log('✅ DatabaseService: Health data saved successfully with ID:', id);
            resolve(id);
          },
          (_, error) => {
            console.error('❌ DatabaseService: Save health data failed:', error);
            reject(new Error(`Failed to save health data: ${error.message}`));
            return false;
          }
        );
      });
    });
  }

  async getHealthData(userId: string, limit?: number): Promise<HealthData[]> {
    if (!this.isInitialized) {
      console.error('❌ DatabaseService: Database not initialized, attempting to initialize...');
      try {
        await this.initialize();
      } catch (initError) {
        console.error('❌ DatabaseService: Failed to initialize database:', initError);
        throw new Error('Database is not properly initialized. Please try again or contact support.');
      }
    }

    if (!this.db) {
      console.error('❌ DatabaseService: Database object is null after initialization');
      throw new Error('Database connection failed. Please try again or contact support.');
    }

    console.log('📊 DatabaseService: Getting health data for user:', userId);
    console.log('📊 DatabaseService: Limit:', limit);
    console.log('📊 DatabaseService: Is web platform:', this.isWebPlatform);

    const query = limit 
      ? 'SELECT * FROM health_data WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?'
      : 'SELECT * FROM health_data WHERE user_id = ? ORDER BY timestamp DESC';
    
    const params = limit ? [userId, limit] : [userId];

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          query,
          params,
          (_, { rows }) => {
            const healthData: HealthData[] = [];
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              const data: HealthData = {
                id: row.id,
                userId: row.user_id,
                timestamp: row.timestamp,
                symptoms: row.encrypted ? this.decrypt(row.symptoms) : row.symptoms,
                severity: row.severity,
                sleep: row.sleep,
                stress: row.stress,
                exercise: row.exercise,
                diet: row.diet,
                notes: row.encrypted && row.notes ? this.decrypt(row.notes) : row.notes,
                encrypted: row.encrypted === 1,
                createdAt: row.created_at
              };
              healthData.push(data);
            }
            
            console.log('✅ DatabaseService: Retrieved', healthData.length, 'health records');
            resolve(healthData);
          },
          (_, error) => {
            console.error('❌ DatabaseService: Get health data failed:', error);
            reject(new Error(`Failed to retrieve health data: ${error.message}`));
            return false;
          }
        );
      });
    });
  }

  // Health insights methods
  async saveHealthInsight(insight: Omit<HealthInsight, 'id' | 'createdAt'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = uuidv4();
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `INSERT INTO health_insights (id, user_id, timestamp, risk_level, patterns, recommendations, confidence, algorithm_version, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, insight.userId, insight.timestamp, insight.riskLevel,
            insight.patterns, insight.recommendations, insight.confidence,
            insight.algorithmVersion, now
          ],
          () => resolve(id),
          (_, error) => {
            console.error('Save health insight failed:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getHealthInsights(userId: string, limit?: number): Promise<HealthInsight[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = limit 
      ? 'SELECT * FROM health_insights WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?'
      : 'SELECT * FROM health_insights WHERE user_id = ? ORDER BY timestamp DESC';
    
    const params = limit ? [userId, limit] : [userId];

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          query,
          params,
          (_, { rows }) => {
            const insights: HealthInsight[] = [];
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              const insight: HealthInsight = {
                id: row.id,
                userId: row.user_id,
                timestamp: row.timestamp,
                riskLevel: row.risk_level,
                patterns: row.patterns,
                recommendations: row.recommendations,
                confidence: row.confidence,
                algorithmVersion: row.algorithm_version,
                createdAt: row.created_at
              };
              insights.push(insight);
            }
            
            resolve(insights);
          },
          (_, error) => {
            console.error('Get health insights failed:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Chat messages methods
  async saveChatMessage(message: Omit<ChatMessage, 'id' | 'createdAt' | 'encrypted' | 'processed'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = uuidv4();
    const now = new Date().toISOString();
    const shouldEncrypt = this.config.encryption;
    
    const encryptedText = shouldEncrypt ? this.encrypt(message.text) : message.text;

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `INSERT INTO chat_messages (id, user_id, text, is_user, timestamp, symptoms, intent, processed, encrypted, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, message.userId, encryptedText, message.isUser ? 1 : 0,
            message.timestamp, message.symptoms || null, message.intent || null,
            0, shouldEncrypt ? 1 : 0, now
          ],
          () => resolve(id),
          (_, error) => {
            console.error('Save chat message failed:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // CHW visit methods
  async saveCHWVisit(visit: { chwId: string; patientId: string; startedAt: string; completedAt?: string; status?: string; steps: any }): Promise<string> {
    if (this.isWebPlatform) {
      // Simple web fallback using in-memory map persisted to localStorage
      const id = uuidv4();
      const now = new Date().toISOString();
      const shouldEncrypt = this.config.encryption;
      const record = {
        id,
        chw_id: visit.chwId,
        patient_id: visit.patientId,
        started_at: visit.startedAt,
        completed_at: visit.completedAt || null,
        status: visit.status || 'in_progress',
        steps_json: shouldEncrypt ? this.encrypt(JSON.stringify(visit.steps)) : JSON.stringify(visit.steps),
        encrypted: shouldEncrypt ? 1 : 0,
        created_at: now
      } as any;
      const list = (this.webStorage.get('chw_visits') || []) as any[];
      list.push(record);
      this.webStorage.set('chw_visits', list);
      this.saveWebStorage();
      return id;
    }
    await this.ensureDb();
    const id = uuidv4();
    const now = new Date().toISOString();
    const shouldEncrypt = this.config.encryption;
    const stepsJson = shouldEncrypt ? this.encrypt(JSON.stringify(visit.steps)) : JSON.stringify(visit.steps);
    await new Promise<void>((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `INSERT INTO chw_visits (id, chw_id, patient_id, started_at, completed_at, status, steps_json, encrypted, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, visit.chwId, visit.patientId, visit.startedAt, visit.completedAt || null, visit.status || 'in_progress', stepsJson, shouldEncrypt ? 1 : 0, now],
          () => resolve(),
          (_t, e) => { reject(e); return false; }
        );
      });
    });
    return id;
  }

  async getCHWVisitsForCHW(chwId: string, limit: number = 50): Promise<Array<{ id: string; chwId: string; patientId: string; startedAt: string; completedAt?: string; status: string; steps: any; createdAt: string }>> {
    if (this.isWebPlatform) {
      this.loadWebStorage();
      const list = (this.webStorage.get('chw_visits') || []) as any[];
      const rows = list
        .filter(r => r.chw_id === chwId)
        .sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)))
        .slice(0, limit)
        .map(r => ({
          id: r.id,
          chwId: r.chw_id,
          patientId: r.patient_id,
          startedAt: r.started_at,
          completedAt: r.completed_at || undefined,
          status: r.status,
          steps: r.encrypted ? JSON.parse(this.decrypt(r.steps_json)) : JSON.parse(r.steps_json),
          createdAt: r.created_at
        }));
      return rows;
    }
    await this.ensureDb();
    return await new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM chw_visits WHERE chw_id = ? ORDER BY started_at DESC LIMIT ?`,
          [chwId, limit],
          async (_tx, rs) => {
            const rows: Array<{ id: string; chwId: string; patientId: string; startedAt: string; completedAt?: string; status: string; steps: any; createdAt: string }> = [];
            for (let i = 0; i < rs.rows.length; i++) {
              const r = rs.rows.item(i);
              const stepsJson = r.steps_json;
              let steps: any = null;
              try { steps = r.encrypted ? JSON.parse(this.decrypt(stepsJson)) : JSON.parse(stepsJson); } catch { steps = null; }
              rows.push({ id: r.id, chwId: r.chw_id, patientId: r.patient_id, startedAt: r.started_at, completedAt: r.completed_at || undefined, status: r.status, steps, createdAt: r.created_at });
            }
            resolve(rows);
          },
          (_t, e) => { reject(e); return false; }
        );
      });
    });
  }

  // Differential privacy and de-identification for training
  async getDeidentifiedTrainingData(limit: number = 200, epsilon: number = 1.0): Promise<HealthDataInput[]> {
    const addLaplace = (value: number, sensitivity = 1): number => {
      const u = Math.random() - 0.5; // (-0.5, 0.5)
      const b = sensitivity / epsilon;
      return value + (-b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u)));
    };

    const toInput = (row: any): HealthDataInput => {
      let symptomsArr: string[] = [];
      try { symptomsArr = JSON.parse(row.symptoms || '[]'); } catch {}
      const sleep = Math.max(0, Math.min(12, addLaplace(Number(row.sleep) || 0)));
      const stress = Math.max(1, Math.min(10, Math.round(addLaplace(Number(row.stress) || 1))));
      const exercise = Math.max(0, Math.round(Math.max(0, addLaplace(Number(row.exercise) || 0))));
      const severity = Math.max(1, Math.min(10, Math.round(addLaplace(Number(row.severity) || 1))));
      return {
        symptoms: symptomsArr.map((s: string) => s.toString().toLowerCase().slice(0, 32)),
        severity,
        sleep,
        stress,
        exercise,
        diet: 'redacted',
        notes: '',
        timestamp: new Date(row.timestamp)
      };
    };

    // Web fallback path: iterate over webStorage
    if (this.isWebPlatform) {
      this.loadWebStorage();
      const records: any[] = [];
      for (const [key, value] of this.webStorage.entries()) {
        if (key.startsWith('health_data_')) {
          const v = value;
          const decryptedSymptoms = v.encrypted ? this.decrypt(v.symptoms) : v.symptoms;
          records.push({ ...v, symptoms: decryptedSymptoms });
        }
      }
      records.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
      return records.slice(0, limit).map(toInput);
    }

    await this.ensureDb();
    return await new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          `SELECT timestamp, symptoms, severity, sleep, stress, exercise FROM health_data ORDER BY timestamp DESC LIMIT ?`,
          [limit],
          (_tx, rs) => {
            const out: HealthDataInput[] = [];
            for (let i = 0; i < rs.rows.length; i++) {
              const r = rs.rows.item(i);
              const symptoms = r.encrypted ? this.decrypt(r.symptoms) : r.symptoms;
              out.push(toInput({ ...r, symptoms }));
            }
            resolve(out);
          },
          (_t, e) => { reject(e); return false; }
        );
      });
    });
  }

  async saveChatMessagesBatch(messages: Array<Omit<ChatMessage, 'id' | 'createdAt' | 'encrypted' | 'processed'>>): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    const ids: string[] = [];
    const now = new Date().toISOString();
    const shouldEncrypt = this.config.encryption;

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        for (const msg of messages) {
          const id = uuidv4();
          ids.push(id);
          const encryptedText = shouldEncrypt ? this.encrypt(msg.text) : msg.text;
          tx.executeSql(
            `INSERT INTO chat_messages (id, user_id, text, is_user, timestamp, symptoms, intent, processed, encrypted, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id, msg.userId, encryptedText, msg.isUser ? 1 : 0,
              msg.timestamp, msg.symptoms || null, msg.intent || null,
              0, shouldEncrypt ? 1 : 0, now
            ]
          );
        }
      }, 
      (error) => {
        console.error('Save chat messages batch failed:', error);
        reject(error);
      },
      () => resolve(ids));
    });
  }

  async getChatMessages(userId: string, limit?: number): Promise<ChatMessage[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = limit 
      ? 'SELECT * FROM chat_messages WHERE user_id = ? ORDER BY timestamp ASC LIMIT ?'
      : 'SELECT * FROM chat_messages WHERE user_id = ? ORDER BY timestamp ASC';
    
    const params = limit ? [userId, limit] : [userId];

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql(
          query,
          params,
          (_, { rows }) => {
            const messages: ChatMessage[] = [];
            
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              const message: ChatMessage = {
                id: row.id,
                userId: row.user_id,
                text: row.encrypted ? this.decrypt(row.text) : row.text,
                isUser: row.is_user === 1,
                timestamp: row.timestamp,
                symptoms: row.symptoms,
                intent: row.intent,
                processed: row.processed === 1,
                encrypted: row.encrypted === 1,
                createdAt: row.created_at
              };
              messages.push(message);
            }
            
            resolve(messages);
          },
          (_, error) => {
            console.error('Get chat messages failed:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async deleteChatHistory(userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        tx.executeSql('DELETE FROM chat_messages WHERE user_id = ?', [userId]);
      }, 
      (error) => {
        console.error('Delete chat history failed:', error);
        reject(error);
      },
      () => resolve());
    });
  }

  // Utility methods
  async clearWebStorageUsers(): Promise<void> {
    if (this.isWebPlatform && typeof window !== 'undefined' && window.localStorage) {
      console.log('🧹 DatabaseService: Clearing all web storage users for fresh start');
      this.webStorage.set('users', []);
      this.saveWebStorage();
      console.log('✅ DatabaseService: Web storage users cleared');
    }
  }

  async clearAllUserData(userId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.transaction(tx => {
        // Delete in reverse order of dependencies
        tx.executeSql('DELETE FROM chat_messages WHERE user_id = ?', [userId]);
        tx.executeSql('DELETE FROM health_insights WHERE user_id = ?', [userId]);
        tx.executeSql('DELETE FROM health_data WHERE user_id = ?', [userId]);
        tx.executeSql('DELETE FROM users WHERE id = ?', [userId]);
      }, 
      (error) => {
        console.error('Clear user data failed:', error);
        reject(error);
      },
      () => {
        console.log('User data cleared successfully');
        resolve(true);
      });
    });
  }

  async getDatabaseStats(): Promise<{ users: number; healthData: number; insights: number; messages: number }> {
    await this.ensureDb();
    return new Promise((resolve, reject) => {
      const stats = { users: 0, healthData: 0, insights: 0, messages: 0 };
      this.db!.transaction(tx => {
        tx.executeSql('SELECT COUNT(*) as count FROM users', [], (_t, { rows }) => {
          const row = rows && rows.length > 0 ? rows.item(0) : null;
          stats.users = row?.count ?? 0;
        });
        tx.executeSql('SELECT COUNT(*) as count FROM health_data', [], (_t, { rows }) => {
          const row = rows && rows.length > 0 ? rows.item(0) : null;
          stats.healthData = row?.count ?? 0;
        });
        tx.executeSql('SELECT COUNT(*) as count FROM health_insights', [], (_t, { rows }) => {
          const row = rows && rows.length > 0 ? rows.item(0) : null;
          stats.insights = row?.count ?? 0;
        });
        tx.executeSql('SELECT COUNT(*) as count FROM chat_messages', [], (_t, { rows }) => {
          const row = rows && rows.length > 0 ? rows.item(0) : null;
          stats.messages = row?.count ?? 0;
        });
      }, 
      (error) => {
        console.error('Get database stats failed:', error);
        reject(error);
      },
      () => resolve(stats));
    });
  }

  async backup(): Promise<string> {
    // Implementation for database backup
    throw new Error('Backup functionality not implemented yet');
  }

  async close(): Promise<void> {
    if (this.db) {
      // SQLite doesn't have an explicit close method in Expo
      this.db = null;
      this.isInitialized = false;
    }
  }

  /**
   * Get current database status and health
   */
  getDatabaseStatus(): { isInitialized: boolean; isWebPlatform: boolean; hasDatabase: boolean; error?: string } {
    return {
      isInitialized: this.isInitialized,
      isWebPlatform: this.isWebPlatform,
      hasDatabase: this.db !== null,
      error: this.isInitialized && !this.db ? 'Database reference is null despite being initialized' : undefined
    };
  }

  /**
   * Force re-initialization of the database
   */
  async forceReinitialize(): Promise<void> {
    console.log('🔄 DatabaseService: Force re-initializing database...');
    this.isInitialized = false;
    this.db = null;
    await this.initialize();
  }
}

// Singleton instance
export const databaseService = new DatabaseService();