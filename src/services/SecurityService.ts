import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'react-native-crypto-js';
import { v4 as uuidv4 } from 'uuid';

export interface SecurityConfig {
  encryptionEnabled: boolean;
  keyRotationInterval: number; // days
  maxLoginAttempts: number;
  sessionTimeout: number; // minutes
  requireBiometric: boolean;
  auditLogging: boolean;
}

export interface SecurityKeys {
  dataEncryptionKey: string;
  authenticationKey: string;
  sessionKey: string;
  created: string;
  lastRotated: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress?: string;
  deviceInfo?: string;
  success: boolean;
  details?: any;
}

export interface LoginAttempt {
  email: string;
  timestamp: Date;
  success: boolean;
  deviceInfo?: string;
  ipAddress?: string;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  created: Date;
  lastAccessed: Date;
  deviceInfo: string;
  isActive: boolean;
}

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // days
  preventReuse: number; // number of previous passwords to check
}

class CryptoManager {
  private static instance: CryptoManager;
  private keyStorage: SecurityKeys | null = null;

  static getInstance(): CryptoManager {
    if (!CryptoManager.instance) {
      CryptoManager.instance = new CryptoManager();
    }
    return CryptoManager.instance;
  }

  async initializeKeys(): Promise<void> {
    try {
      console.log('🔐 CryptoManager: Initializing encryption keys...');
      
      // Try to get stored keys
      let storedKeys: string | null = null;
      try {
        storedKeys = await SecureStore.getItemAsync('security_keys');
        console.log('🔐 CryptoManager: Retrieved stored keys:', !!storedKeys);
      } catch (secureStoreError) {
        console.warn('🔐 CryptoManager: SecureStore not available, using fallback:', secureStoreError);
        // Fallback to AsyncStorage for web/testing
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        storedKeys = await AsyncStorage.getItem('security_keys_fallback');
        console.log('🔐 CryptoManager: Retrieved fallback keys:', !!storedKeys);
      }
      
      if (storedKeys) {
        this.keyStorage = JSON.parse(storedKeys);
        console.log('🔐 CryptoManager: Loaded existing keys');
        
        // Check if keys need rotation
        const lastRotated = new Date(this.keyStorage!.lastRotated);
        const daysSinceRotation = (Date.now() - lastRotated.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceRotation > 30) { // Rotate keys every 30 days
          console.log('🔐 CryptoManager: Rotating old keys');
          await this.rotateKeys();
        }
      } else {
        console.log('🔐 CryptoManager: Generating new keys');
        await this.generateNewKeys();
      }
      
      console.log('✅ CryptoManager: Keys initialized successfully');
    } catch (error) {
      console.error('❌ CryptoManager: Failed to initialize security keys:', error);
      // Create in-memory keys as last resort
      console.log('🔄 CryptoManager: Creating in-memory keys as fallback');
      await this.createInMemoryKeys();
    }
  }

  private async generateNewKeys(): Promise<void> {
    const dataEncryptionKey = await this.generateSecureKey(32);
    const authenticationKey = await this.generateSecureKey(32);
    const sessionKey = await this.generateSecureKey(16);
    const now = new Date().toISOString();

    this.keyStorage = {
      dataEncryptionKey,
      authenticationKey,
      sessionKey,
      created: now,
      lastRotated: now
    };

    // Try to store securely, fallback to AsyncStorage if needed
    try {
      await SecureStore.setItemAsync('security_keys', JSON.stringify(this.keyStorage));
      console.log('🔐 CryptoManager: Keys stored in SecureStore');
    } catch (error) {
      console.warn('🔐 CryptoManager: SecureStore not available, using fallback storage');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('security_keys_fallback', JSON.stringify(this.keyStorage));
      console.log('🔐 CryptoManager: Keys stored in AsyncStorage fallback');
    }
  }

  private async createInMemoryKeys(): Promise<void> {
    console.log('🔄 CryptoManager: Creating in-memory encryption keys');
    const now = new Date().toISOString();
    
    // Create simple fallback keys for development/testing
    this.keyStorage = {
      dataEncryptionKey: 'fallback_data_key_' + Math.random().toString(36),
      authenticationKey: 'fallback_auth_key_' + Math.random().toString(36),
      sessionKey: 'fallback_session_' + Math.random().toString(36),
      created: now,
      lastRotated: now
    };
    
    console.log('✅ CryptoManager: In-memory keys created');
  }

  private async rotateKeys(): Promise<void> {
    if (!this.keyStorage) throw new Error('Keys not initialized');

    // Generate new keys while keeping old ones for decryption
    const oldKeys = { ...this.keyStorage };
    await this.generateNewKeys();

    // Store old keys temporarily for data migration with fallback
    try {
      await SecureStore.setItemAsync('old_security_keys', JSON.stringify(oldKeys));
    } catch (error) {
      console.warn('🔐 CryptoManager: SecureStore not available for old keys, using fallback');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('old_security_keys_fallback', JSON.stringify(oldKeys));
    }
  }

  private async generateSecureKey(length: number): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(length);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  get keys(): SecurityKeys | null {
    return this.keyStorage;
  }

  encrypt(data: string, useSessionKey: boolean = false): string {
    if (!this.keyStorage) throw new Error('Encryption keys not initialized');

    try {
      const key = useSessionKey ? this.keyStorage.sessionKey : this.keyStorage.dataEncryptionKey;
      return CryptoJS.AES.encrypt(data, key).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  async decrypt(encryptedData: string, useSessionKey: boolean = false): Promise<string> {
    if (!this.keyStorage) throw new Error('Encryption keys not initialized');

    try {
      const key = useSessionKey ? this.keyStorage.sessionKey : this.keyStorage.dataEncryptionKey;
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        // Try with old keys if available (with fallback)
        let oldKeysStr: string | null = null;
        try {
          oldKeysStr = await SecureStore.getItemAsync('old_security_keys');
        } catch (secureStoreError) {
          console.warn('🔐 CryptoManager: SecureStore not available for old keys, trying fallback');
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          oldKeysStr = await AsyncStorage.getItem('old_security_keys_fallback');
        }
        
        if (oldKeysStr) {
          const oldKeys = JSON.parse(oldKeysStr);
          const oldKey = useSessionKey ? oldKeys.sessionKey : oldKeys.dataEncryptionKey;
          const oldBytes = CryptoJS.AES.decrypt(encryptedData, oldKey);
          const oldDecrypted = oldBytes.toString(CryptoJS.enc.Utf8);
          if (oldDecrypted) {
            console.log('🔐 CryptoManager: Successfully decrypted with old keys');
            return oldDecrypted;
          }
        }
        throw new Error('Decryption failed with both current and old keys');
      }
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  generateHash(data: string, salt?: string): { hash: string; salt: string } {
    if (!this.keyStorage) throw new Error('Authentication keys not initialized');

    const dataSalt = salt || this.generateSalt();
    const hash = CryptoJS.PBKDF2(data, dataSalt + this.keyStorage.authenticationKey, {
      keySize: 256/32,
      iterations: 10000
    }).toString();

    return { hash, salt: dataSalt };
  }

  verifyHash(data: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.generateHash(data, salt);
    return computedHash === hash;
  }

  private generateSalt(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  generateToken(): string {
    return uuidv4() + '-' + Date.now().toString(36);
  }
}

class SessionManager {
  private sessions: Map<string, SessionInfo> = new Map();
  private readonly SESSION_TIMEOUT = 30; // minutes

  createSession(userId: string, deviceInfo: string): SessionInfo {
    const sessionId = uuidv4();
    const now = new Date();

    const session: SessionInfo = {
      sessionId,
      userId,
      created: now,
      lastAccessed: now,
      deviceInfo,
      isActive: true
    };

    this.sessions.set(sessionId, session);
    this.scheduleCleanup();
    
    return session;
  }

  validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return false;
    }

    const now = new Date();
    const timeDiff = now.getTime() - session.lastAccessed.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff > this.SESSION_TIMEOUT) {
      this.invalidateSession(sessionId);
      return false;
    }

    // Update last accessed time
    session.lastAccessed = now;
    return true;
  }

  refreshSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return false;
    }

    session.lastAccessed = new Date();
    return true;
  }

  invalidateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
    }
  }

  invalidateAllUserSessions(userId: string): void {
    this.sessions.forEach(session => {
      if (session.userId === userId) {
        session.isActive = false;
      }
    });
  }

  getActiveSessions(userId: string): SessionInfo[] {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId && session.isActive);
  }

  private scheduleCleanup(): void {
    // Clean up expired sessions every 10 minutes
    setTimeout(() => {
      this.cleanupExpiredSessions();
      this.scheduleCleanup();
    }, 10 * 60 * 1000);
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    this.sessions.forEach((session, sessionId) => {
      const timeDiff = now.getTime() - session.lastAccessed.getTime();
      const minutesDiff = timeDiff / (1000 * 60);

      if (minutesDiff > this.SESSION_TIMEOUT || !session.isActive) {
        expiredSessions.push(sessionId);
      }
    });

    expiredSessions.forEach(sessionId => {
      this.sessions.delete(sessionId);
    });
  }
}

class AuditLogger {
  private logs: AuditLog[] = [];
  private readonly MAX_LOGS = 1000;

  async logAction(
    userId: string,
    action: string,
    resource: string,
    success: boolean,
    details?: any,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<void> {
    const log: AuditLog = {
      id: uuidv4(),
      userId,
      action,
      resource,
      timestamp: new Date(),
      success,
      details,
      deviceInfo,
      ipAddress
    };

    this.logs.push(log);

    // Keep only the most recent logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    // Store logs securely with platform-aware fallback
    try {
      const cryptoManager = CryptoManager.getInstance();
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      // Check if encryption keys are available
      if (cryptoManager.keys) {
        const encryptedLogs = cryptoManager.encrypt(JSON.stringify(this.logs));
        
        // Try SecureStore first, then fallback to AsyncStorage
        try {
          await SecureStore.setItemAsync('audit_logs', encryptedLogs);
          console.log('📋 AuditLogger: Logs stored securely in SecureStore');
        } catch (secureStoreError) {
          console.warn('📋 AuditLogger: SecureStore not available, using AsyncStorage fallback');
          await AsyncStorage.setItem('audit_logs_encrypted', encryptedLogs);
          console.log('📋 AuditLogger: Logs stored with encryption in AsyncStorage');
        }
      } else {
        // Fallback: store unencrypted logs in AsyncStorage
        console.warn('📋 AuditLogger: Encryption keys not ready, storing logs unencrypted');
        await AsyncStorage.setItem('audit_logs_temp', JSON.stringify(this.logs));
        console.log('📋 AuditLogger: Logs stored unencrypted in AsyncStorage');
      }
    } catch (error) {
      console.error('❌ AuditLogger: Failed to store audit logs:', error);
      // Log to console as final fallback (but don't show the full log in console to avoid spam)
      console.log('📋 AuditLogger: Using console fallback for log storage');
    }
  }

  async loadLogs(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      let encryptedLogs: string | null = null;
      
      // Try SecureStore first, then fallback to AsyncStorage
      try {
        encryptedLogs = await SecureStore.getItemAsync('audit_logs');
        console.log('📋 AuditLogger: Loaded logs from SecureStore');
      } catch (secureStoreError) {
        console.warn('📋 AuditLogger: SecureStore not available, trying AsyncStorage fallback');
        // Try encrypted AsyncStorage fallback
        encryptedLogs = await AsyncStorage.getItem('audit_logs_encrypted');
        if (!encryptedLogs) {
          // Try unencrypted AsyncStorage fallback
          const unencryptedLogs = await AsyncStorage.getItem('audit_logs_temp');
          if (unencryptedLogs) {
            this.logs = JSON.parse(unencryptedLogs).map((log: any) => ({
              ...log,
              timestamp: new Date(log.timestamp)
            }));
            console.log('📋 AuditLogger: Loaded unencrypted logs from AsyncStorage');
            return;
          }
        }
      }
      
      if (encryptedLogs) {
        const cryptoManager = CryptoManager.getInstance();
        if (cryptoManager.keys) {
          const decryptedLogs = await cryptoManager.decrypt(encryptedLogs);
          this.logs = JSON.parse(decryptedLogs).map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp)
          }));
          console.log('📋 AuditLogger: Loaded and decrypted logs successfully');
        } else {
          console.warn('📋 AuditLogger: Encryption keys not available, cannot decrypt logs');
          this.logs = [];
        }
      } else {
        console.log('📋 AuditLogger: No existing logs found');
        this.logs = [];
      }
    } catch (error) {
      console.error('❌ AuditLogger: Failed to load audit logs:', error);
      this.logs = [];
    }
  }

  getLogsForUser(userId: string, limit?: number): AuditLog[] {
    const userLogs = this.logs
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? userLogs.slice(0, limit) : userLogs;
  }

  getSecurityEvents(limit?: number): AuditLog[] {
    const securityActions = ['login', 'logout', 'password_change', 'account_locked', 'permission_denied'];
    const securityLogs = this.logs
      .filter(log => securityActions.includes(log.action))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? securityLogs.slice(0, limit) : securityLogs;
  }
}

class LoginAttemptTracker {
  private attempts: Map<string, LoginAttempt[]> = new Map();
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15; // minutes

  recordAttempt(email: string, success: boolean, deviceInfo?: string, ipAddress?: string): void {
    const attempt: LoginAttempt = {
      email,
      timestamp: new Date(),
      success,
      deviceInfo,
      ipAddress
    };

    const userAttempts = this.attempts.get(email) || [];
    userAttempts.push(attempt);

    // Keep only recent attempts (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentAttempts = userAttempts.filter(a => a.timestamp > oneHourAgo);
    
    this.attempts.set(email, recentAttempts);
  }

  isAccountLocked(email: string): boolean {
    const userAttempts = this.attempts.get(email) || [];
    const lockoutTime = new Date(Date.now() - this.LOCKOUT_DURATION * 60 * 1000);
    
    const recentFailedAttempts = userAttempts.filter(
      attempt => !attempt.success && attempt.timestamp > lockoutTime
    );

    return recentFailedAttempts.length >= this.MAX_ATTEMPTS;
  }

  getRemainingLockoutTime(email: string): number {
    if (!this.isAccountLocked(email)) return 0;

    const userAttempts = this.attempts.get(email) || [];
    const recentFailedAttempts = userAttempts
      .filter(attempt => !attempt.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (recentFailedAttempts.length === 0) return 0;

    const lastFailedAttempt = recentFailedAttempts[0];
    const lockoutEndTime = new Date(lastFailedAttempt.timestamp.getTime() + this.LOCKOUT_DURATION * 60 * 1000);
    const remainingTime = lockoutEndTime.getTime() - Date.now();

    return Math.max(0, Math.ceil(remainingTime / (1000 * 60))); // minutes
  }

  clearAttempts(email: string): void {
    this.attempts.delete(email);
  }
}

export class SecurityService {
  private cryptoManager: CryptoManager;
  private sessionManager: SessionManager;
  private auditLogger: AuditLogger;
  private loginTracker: LoginAttemptTracker;
  private config: SecurityConfig;
  private passwordPolicy: PasswordPolicy;

  constructor() {
    this.cryptoManager = CryptoManager.getInstance();
    this.sessionManager = new SessionManager();
    this.auditLogger = new AuditLogger();
    this.loginTracker = new LoginAttemptTracker();
    
    this.config = {
      encryptionEnabled: true,
      keyRotationInterval: 30,
      maxLoginAttempts: 5,
      sessionTimeout: 30,
      requireBiometric: false,
      auditLogging: true
    };

    this.passwordPolicy = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90,
      preventReuse: 5
    };
  }

  async initialize(): Promise<void> {
    try {
      await this.cryptoManager.initializeKeys();
      await this.auditLogger.loadLogs();
      console.log('Security service initialized successfully');
    } catch (error) {
      console.error('Security service initialization failed:', error);
      throw error;
    }
  }

  // Encryption methods
  encryptData(data: string): string {
    return this.cryptoManager.encrypt(data);
  }

  async decryptData(encryptedData: string): Promise<string> {
    return await this.cryptoManager.decrypt(encryptedData);
  }

  // Authentication methods
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    return this.cryptoManager.generateHash(password, salt);
  }

  verifyPassword(password: string, hash: string, salt: string): boolean {
    return this.cryptoManager.verifyHash(password, hash, salt);
  }

  validatePassword(password: string): SecurityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    // Length check
    if (password.length < this.passwordPolicy.minLength) {
      errors.push(`Password must be at least ${this.passwordPolicy.minLength} characters long`);
    } else {
      score += 20;
    }

    // Character type checks
    if (this.passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score += 15;
    }

    if (this.passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      score += 15;
    }

    if (this.passwordPolicy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
      score += 15;
    }

    if (this.passwordPolicy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 15;
    }

    // Additional security checks
    if (password.length > 12) score += 10;
    if (password.length > 16) score += 10;

    // Common password check
    const commonPasswords = ['password', '123456', 'admin', 'qwerty', 'letmein'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable');
      score = Math.max(0, score - 30);
    }

    // Sequential character check
    if (/123|abc|qwe/i.test(password)) {
      warnings.push('Avoid using sequential characters');
      score = Math.max(0, score - 10);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, Math.min(100, score))
    };
  }

  // Session management
  createSession(userId: string, deviceInfo: string): string {
    const session = this.sessionManager.createSession(userId, deviceInfo);
    
    if (this.config.auditLogging) {
      this.auditLogger.logAction(userId, 'session_created', 'session', true, { sessionId: session.sessionId }, deviceInfo);
    }
    
    return session.sessionId;
  }

  validateSession(sessionId: string): boolean {
    return this.sessionManager.validateSession(sessionId);
  }

  refreshSession(sessionId: string): boolean {
    return this.sessionManager.refreshSession(sessionId);
  }

  invalidateSession(sessionId: string, userId?: string): void {
    this.sessionManager.invalidateSession(sessionId);
    
    if (this.config.auditLogging && userId) {
      this.auditLogger.logAction(userId, 'session_invalidated', 'session', true, { sessionId });
    }
  }

  // Login attempt tracking
  recordLoginAttempt(email: string, success: boolean, deviceInfo?: string): boolean {
    this.loginTracker.recordAttempt(email, success, deviceInfo);
    
    if (!success && this.loginTracker.isAccountLocked(email)) {
      if (this.config.auditLogging) {
        this.auditLogger.logAction('', 'account_locked', 'auth', true, { email, reason: 'too_many_failed_attempts' }, deviceInfo);
      }
      return false;
    }

    return true;
  }

  isAccountLocked(email: string): boolean {
    return this.loginTracker.isAccountLocked(email);
  }

  getRemainingLockoutTime(email: string): number {
    return this.loginTracker.getRemainingLockoutTime(email);
  }

  clearLoginAttempts(email: string): void {
    this.loginTracker.clearAttempts(email);
  }

  // Audit logging
  async logAction(userId: string, action: string, resource: string, success: boolean, details?: any): Promise<void> {
    if (this.config.auditLogging) {
      await this.auditLogger.logAction(userId, action, resource, success, details);
    }
  }

  getAuditLogs(userId: string, limit?: number): AuditLog[] {
    return this.auditLogger.getLogsForUser(userId, limit);
  }

  getSecurityEvents(limit?: number): AuditLog[] {
    return this.auditLogger.getSecurityEvents(limit);
  }

  // Data validation and sanitization
  sanitizeInput(input: string): string {
    // Remove potential XSS and injection attempts
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  generateSecureToken(): string {
    return this.cryptoManager.generateToken();
  }

  // Security configuration
  updateSecurityConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getSecurityConfig(): SecurityConfig {
    return { ...this.config };
  }

  updatePasswordPolicy(newPolicy: Partial<PasswordPolicy>): void {
    this.passwordPolicy = { ...this.passwordPolicy, ...newPolicy };
  }

  getPasswordPolicy(): PasswordPolicy {
    return { ...this.passwordPolicy };
  }

  // Security health check
  async performSecurityHealthCheck(): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check encryption status
    if (!this.config.encryptionEnabled) {
      issues.push('Data encryption is disabled');
      recommendations.push('Enable data encryption for better security');
      score -= 30;
    }

    // Check session timeout
    if (this.config.sessionTimeout > 60) {
      issues.push('Session timeout is too long');
      recommendations.push('Reduce session timeout to 30 minutes or less');
      score -= 10;
    }

    // Check audit logging
    if (!this.config.auditLogging) {
      issues.push('Audit logging is disabled');
      recommendations.push('Enable audit logging for security monitoring');
      score -= 20;
    }

    // Check recent security events
    const recentEvents = this.auditLogger.getSecurityEvents(50);
    const failedLogins = recentEvents.filter(event => event.action === 'login' && !event.success);
    
    if (failedLogins.length > 10) {
      issues.push('High number of failed login attempts detected');
      recommendations.push('Monitor for potential brute force attacks');
      score -= 15;
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }
}

export const securityService = new SecurityService();