export interface AppConfiguration {
  // Database Configuration
  database: {
    name: string;
    version: string;
    encryption: boolean;
    backupEnabled: boolean;
  };

  // Security Configuration
  security: {
    encryptionEnabled: boolean;
    keyRotationInterval: number; // days
    maxLoginAttempts: number;
    sessionTimeout: number; // minutes
    requireBiometric: boolean;
    auditLogging: boolean;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      maxAge: number; // days
      preventReuse: number;
    };
  };

  // Machine Learning Configuration
  machineLearning: {
    enabled: boolean;
    algorithms: {
      kmeans: {
        enabled: boolean;
        defaultK: number;
        maxIterations: number;
        tolerance: number;
        initMethod: 'random' | 'kmeans++';
      };
      anomalyDetection: {
        enabled: boolean;
        threshold: number;
      };
      featureEngineering: {
        enabled: boolean;
        normalization: boolean;
      };
    };
    modelValidation: {
      enabled: boolean;
      crossValidationFolds: number;
      minDataPoints: number;
    };
  };

  // NLP Configuration
  nlp: {
    enabled: boolean;
    features: {
      sentimentAnalysis: boolean;
      entityExtraction: boolean;
      intentClassification: boolean;
      symptomExtraction: boolean;
    };
    languages: string[];
    confidence: {
      minThreshold: number;
      highThreshold: number;
    };
  };

  // UI Configuration
  ui: {
    theme: {
      default: 'light' | 'dark' | 'auto';
      allowUserCustomization: boolean;
    };
    charts: {
      enabled: boolean;
      animationsEnabled: boolean;
      defaultTimeRange: number; // days
    };
    notifications: {
      enabled: boolean;
      types: {
        healthReminders: boolean;
        analysisComplete: boolean;
        riskAlerts: boolean;
      };
    };
  };

  // Analytics Configuration
  analytics: {
    enabled: boolean;
    anonymized: boolean;
    retentionPeriod: number; // days
    reportingEnabled: boolean;
  };

  // Development Configuration
  development: {
    debugMode: boolean;
    testingEnabled: boolean;
    mockData: boolean;
    apiLogging: boolean;
  };

  // Performance Configuration
  performance: {
    caching: {
      enabled: boolean;
      maxAge: number; // seconds
    };
    dataLimits: {
      maxHealthRecords: number;
      maxChatMessages: number;
      maxAnalysisHistory: number;
    };
    backgroundProcessing: {
      enabled: boolean;
      batchSize: number;
    };
  };
}

export const DEFAULT_CONFIG: AppConfiguration = {
  database: {
    name: 'health_ai_secure.db',
    version: '2.0',
    encryption: true,
    backupEnabled: true
  },

  security: {
    encryptionEnabled: true,
    keyRotationInterval: 30,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    requireBiometric: false,
    auditLogging: true,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90,
      preventReuse: 5
    }
  },

  machineLearning: {
    enabled: true,
    algorithms: {
      kmeans: {
        enabled: true,
        defaultK: 3,
        maxIterations: 300,
        tolerance: 1e-4,
        initMethod: 'kmeans++'
      },
      anomalyDetection: {
        enabled: true,
        threshold: 2.5
      },
      featureEngineering: {
        enabled: true,
        normalization: true
      }
    },
    modelValidation: {
      enabled: true,
      crossValidationFolds: 5,
      minDataPoints: 3
    }
  },

  nlp: {
    enabled: true,
    features: {
      sentimentAnalysis: true,
      entityExtraction: true,
      intentClassification: true,
      symptomExtraction: true
    },
    languages: ['en'],
    confidence: {
      minThreshold: 0.3,
      highThreshold: 0.8
    }
  },

  ui: {
    theme: {
      default: 'auto',
      allowUserCustomization: true
    },
    charts: {
      enabled: true,
      animationsEnabled: true,
      defaultTimeRange: 30
    },
    notifications: {
      enabled: true,
      types: {
        healthReminders: true,
        analysisComplete: true,
        riskAlerts: true
      }
    }
  },

  analytics: {
    enabled: true,
    anonymized: true,
    retentionPeriod: 365,
    reportingEnabled: true
  },

  development: {
    debugMode: __DEV__,
    testingEnabled: __DEV__,
    mockData: false,
    apiLogging: __DEV__
  },

  performance: {
    caching: {
      enabled: true,
      maxAge: 3600
    },
    dataLimits: {
      maxHealthRecords: 1000,
      maxChatMessages: 500,
      maxAnalysisHistory: 100
    },
    backgroundProcessing: {
      enabled: true,
      batchSize: 10
    }
  }
};

export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfiguration = DEFAULT_CONFIG;

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  getConfig(): AppConfiguration {
    return { ...this.config };
  }

  updateConfig(updates: Partial<AppConfiguration>): void {
    this.config = { ...this.config, ...updates };
  }

  updateSecurityConfig(updates: Partial<AppConfiguration['security']>): void {
    this.config.security = { ...this.config.security, ...updates };
  }

  updateMLConfig(updates: Partial<AppConfiguration['machineLearning']>): void {
    this.config.machineLearning = { ...this.config.machineLearning, ...updates };
  }

  updateNLPConfig(updates: Partial<AppConfiguration['nlp']>): void {
    this.config.nlp = { ...this.config.nlp, ...updates };
  }

  updateUIConfig(updates: Partial<AppConfiguration['ui']>): void {
    this.config.ui = { ...this.config.ui, ...updates };
  }

  isFeatureEnabled(feature: string): boolean {
    const parts = feature.split('.');
    let current: any = this.config;
    
    for (const part of parts) {
      if (current[part] === undefined) return false;
      current = current[part];
    }
    
    return current === true;
  }

  getFeatureConfig(feature: string): any {
    const parts = feature.split('.');
    let current: any = this.config;
    
    for (const part of parts) {
      if (current[part] === undefined) return null;
      current = current[part];
    }
    
    return current;
  }

  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate security settings
    if (this.config.security.sessionTimeout < 5) {
      errors.push('Session timeout too short (minimum 5 minutes)');
    }

    if (this.config.security.maxLoginAttempts < 3) {
      errors.push('Max login attempts too low (minimum 3)');
    }

    if (this.config.security.passwordPolicy.minLength < 6) {
      errors.push('Password minimum length too short (minimum 6)');
    }

    // Validate ML settings
    if (this.config.machineLearning.algorithms.kmeans.defaultK < 2) {
      errors.push('K-means K value too low (minimum 2)');
    }

    if (this.config.machineLearning.algorithms.kmeans.maxIterations < 10) {
      errors.push('K-means max iterations too low (minimum 10)');
    }

    // Validate performance settings
    if (this.config.performance.dataLimits.maxHealthRecords < 10) {
      errors.push('Max health records too low (minimum 10)');
    }

    if (this.config.performance.caching.maxAge < 60) {
      errors.push('Cache max age too low (minimum 60 seconds)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importConfig(configJson: string): boolean {
    try {
      const imported = JSON.parse(configJson);
      const validation = this.validateConfig();
      
      if (validation.isValid) {
        this.config = { ...DEFAULT_CONFIG, ...imported };
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to import config:', error);
      return false;
    }
  }

  resetToDefaults(): void {
    this.config = { ...DEFAULT_CONFIG };
  }
}

export const configManager = ConfigManager.getInstance();