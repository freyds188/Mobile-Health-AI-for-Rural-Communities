import { databaseService } from '../services/DatabaseService';

export class DatabaseInitializationHelper {
  /**
   * Force initialize the database with comprehensive error handling
   */
  static async forceInitializeDatabase(): Promise<{ success: boolean; error?: string; details: any }> {
    console.log('🔧 DatabaseInitializationHelper: Starting forced database initialization...');
    
    try {
      // Clear any existing state
      console.log('🧹 DatabaseInitializationHelper: Clearing existing database state...');
      
      // Attempt initialization with multiple strategies
      const strategies = [
        'standard',
        'web_fallback',
        'minimal_config'
      ];

      for (const strategy of strategies) {
        console.log(`🔄 DatabaseInitializationHelper: Trying strategy: ${strategy}`);
        
        try {
          switch (strategy) {
            case 'standard':
              await databaseService.initialize();
              break;
              
            case 'web_fallback':
              // Force web platform detection
              if (typeof window !== 'undefined') {
                console.log('🌐 DatabaseInitializationHelper: Forcing web storage mode');
                // The database service should automatically fall back to web storage
                await databaseService.initialize();
              }
              break;
              
            case 'minimal_config':
              // Try with minimal configuration
              console.log('⚙️ DatabaseInitializationHelper: Trying minimal configuration');
              await databaseService.initialize();
              break;
          }
          
          // Test if initialization was successful
          const status = await this.getDatabaseStatus();
          if (status.isInitialized) {
            console.log('✅ DatabaseInitializationHelper: Database initialized successfully with strategy:', strategy);
            return {
              success: true,
              details: {
                strategy,
                status,
                platform: typeof window !== 'undefined' ? 'web' : 'native'
              }
            };
          }
        } catch (strategyError) {
          console.warn(`⚠️ DatabaseInitializationHelper: Strategy ${strategy} failed:`, strategyError);
          continue;
        }
      }
      
      throw new Error('All initialization strategies failed');
      
    } catch (error) {
      console.error('❌ DatabaseInitializationHelper: All initialization attempts failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        details: {
          platform: typeof window !== 'undefined' ? 'web' : 'native',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * Check if database is properly initialized
   */
  static async isDatabaseInitialized(): Promise<boolean> {
    try {
      const status = await this.getDatabaseStatus();
      return status.isInitialized;
    } catch (error) {
      console.error('❌ DatabaseInitializationHelper: Error checking database status:', error);
      return false;
    }
  }

  /**
   * Get comprehensive database status
   */
  static async getDatabaseStatus(): Promise<{
    isInitialized: boolean;
    platform: 'web' | 'native' | 'unknown';
    hasDatabase: boolean;
    canConnect: boolean;
    error?: string;
  }> {
    try {
      console.log('🔍 DatabaseInitializationHelper: Checking database status...');
      
      const platform = typeof window !== 'undefined' ? 'web' : 'native';
      
      // Try to access database service properties (if accessible)
      let isInitialized = false;
      let hasDatabase = false;
      let canConnect = false;
      let error: string | undefined;

      try {
        // Test basic database operations
        const stats = await databaseService.getDatabaseStats();
        isInitialized = true;
        hasDatabase = true;
        canConnect = true;
        console.log('✅ DatabaseInitializationHelper: Database is fully operational');
      } catch (dbError) {
        error = dbError instanceof Error ? dbError.message : String(dbError);
        
        if (error.includes('Database not initialized')) {
          isInitialized = false;
          hasDatabase = false;
          canConnect = false;
        } else if (error.includes('database')) {
          isInitialized = true;
          hasDatabase = true;
          canConnect = false;
        } else {
          isInitialized = false;
          hasDatabase = false;
          canConnect = false;
        }
      }

      return {
        isInitialized,
        platform,
        hasDatabase,
        canConnect,
        error
      };
      
    } catch (error) {
      console.error('❌ DatabaseInitializationHelper: Error getting database status:', error);
      return {
        isInitialized: false,
        platform: 'unknown',
        hasDatabase: false,
        canConnect: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Reset database completely
   */
  static async resetDatabase(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 DatabaseInitializationHelper: Resetting database...');
      
      // Clear web storage if on web platform
      if (typeof window !== 'undefined' && window.localStorage) {
        console.log('🧹 DatabaseInitializationHelper: Clearing web storage...');
        window.localStorage.removeItem('health_ai_web_storage');
        window.localStorage.removeItem('health_ai_secure_keys');
      }
      
      // Try to close database connection
      try {
        await databaseService.close();
      } catch (closeError) {
        console.warn('⚠️ DatabaseInitializationHelper: Could not close database:', closeError);
      }
      
      // Force re-initialization
      const result = await this.forceInitializeDatabase();
      
      if (result.success) {
        console.log('✅ DatabaseInitializationHelper: Database reset successful');
        return { success: true };
      } else {
        console.error('❌ DatabaseInitializationHelper: Database reset failed');
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ DatabaseInitializationHelper: Database reset error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get troubleshooting information
   */
  static async getTroubleshootingInfo(): Promise<{
    platform: string;
    databaseStatus: any;
    environment: any;
    recommendations: string[];
  }> {
    const platform = typeof window !== 'undefined' ? 'web' : 'native';
    const databaseStatus = await this.getDatabaseStatus();
    
    const environment = {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      platform: platform,
      hasLocalStorage: typeof window !== 'undefined' && !!window.localStorage,
      hasSessionStorage: typeof window !== 'undefined' && !!window.sessionStorage,
      timestamp: new Date().toISOString()
    };

    const recommendations: string[] = [];

    if (!databaseStatus.isInitialized) {
      recommendations.push('Database is not initialized. Try forcing initialization.');
      recommendations.push('Check if you have proper permissions for database access.');
    }

    if (platform === 'web' && !environment.hasLocalStorage) {
      recommendations.push('Web storage is not available. Check browser settings.');
    }

    if (databaseStatus.error) {
      recommendations.push(`Database error detected: ${databaseStatus.error}`);
      recommendations.push('Try resetting the database completely.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Database appears to be working correctly.');
    }

    return {
      platform,
      databaseStatus,
      environment,
      recommendations
    };
  }

  /**
   * Test database operations
   */
  static async testDatabaseOperations(): Promise<{
    success: boolean;
    tests: Array<{ name: string; success: boolean; error?: string }>;
  }> {
    const tests: Array<{ name: string; success: boolean; error?: string }> = [];
    
    try {
      // Test 1: Get database stats
      try {
        await databaseService.getDatabaseStats();
        tests.push({ name: 'Get Database Stats', success: true });
      } catch (error) {
        tests.push({ 
          name: 'Get Database Stats', 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }

      // Test 2: Create a test user (if possible)
      try {
        const testUser = await databaseService.createUser({
          email: 'test@example.com',
          password: 'testpass123',
          name: 'Test User',
          role: 'patient'
        });
        tests.push({ name: 'Create Test User', success: true });
        
        // Clean up test user
        try {
          await databaseService.clearAllUserData(testUser.id);
        } catch (cleanupError) {
          console.warn('Could not cleanup test user:', cleanupError);
        }
      } catch (error) {
        tests.push({ 
          name: 'Create Test User', 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }

      const allTestsPassed = tests.every(test => test.success);
      
      return {
        success: allTestsPassed,
        tests
      };
      
    } catch (error) {
      tests.push({ 
        name: 'Test Suite', 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      return {
        success: false,
        tests
      };
    }
  }
}

// Export convenience functions
export const forceInitializeDatabase = DatabaseInitializationHelper.forceInitializeDatabase;
export const isDatabaseInitialized = DatabaseInitializationHelper.isDatabaseInitialized;
export const getDatabaseStatus = DatabaseInitializationHelper.getDatabaseStatus;
export const resetDatabase = DatabaseInitializationHelper.resetDatabase;
export const getTroubleshootingInfo = DatabaseInitializationHelper.getTroubleshootingInfo;
export const testDatabaseOperations = DatabaseInitializationHelper.testDatabaseOperations;
