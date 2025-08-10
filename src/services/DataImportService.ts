/**
 * Data Import Service
 * Imports CSV training datasets into the actual Health AI system database
 * Converts external training data into your app's data format
 */

import { DatabaseService } from './DatabaseService';
import DatasetLoader from '../utils/DatasetLoader';
import { HealthDataInput } from './MachineLearningService';

export interface DataImportConfig {
  preserveExistingData: boolean;
  createSyntheticUsers: boolean;
  validateImportedData: boolean;
  importBatchSize: number;
}

export interface ImportResult {
  success: boolean;
  totalRecords: number;
  importedRecords: number;
  skippedRecords: number;
  errors: string[];
  importedUsers: number;
  createdUsers: string[];
  importDuration: number;
}

export class DataImportService {
  private databaseService: DatabaseService;
  
  constructor() {
    this.databaseService = new DatabaseService();
  }

  /**
   * Import CSV dataset directly into the app's database
   */
  async importCSVDataset(
    csvContent: string, 
    config: Partial<DataImportConfig> = {}
  ): Promise<ImportResult> {
    const startTime = Date.now();
    
    const fullConfig: DataImportConfig = {
      preserveExistingData: true,
      createSyntheticUsers: true,
      validateImportedData: true,
      importBatchSize: 50,
      ...config
    };

    console.log('📥 Starting CSV dataset import...');
    console.log('⚙️ Import configuration:', fullConfig);

    const result: ImportResult = {
      success: false,
      totalRecords: 0,
      importedRecords: 0,
      skippedRecords: 0,
      errors: [],
      importedUsers: 0,
      createdUsers: [],
      importDuration: 0
    };

    try {
      // Initialize database
      await this.databaseService.initializeDatabase();

      // Load and validate CSV data
      console.log('📊 Loading CSV data...');
      const healthDataArray = DatasetLoader.loadFromCSV(csvContent);
      result.totalRecords = healthDataArray.length;

      if (fullConfig.validateImportedData) {
        const validation = DatasetLoader.validateDataset(healthDataArray);
        if (!validation.isValid) {
          console.warn('⚠️ Data validation warnings:', validation.warnings);
          result.errors.push(...validation.warnings);
        }
      }

      // Extract unique users from the dataset
      const uniqueUserIds = [...new Set(healthDataArray.map(data => 
        this.extractUserIdFromHealthData(data)
      ))];

      console.log(`👥 Found ${uniqueUserIds.length} unique users in dataset`);

      // Create synthetic users if needed
      if (fullConfig.createSyntheticUsers) {
        for (const userId of uniqueUserIds) {
          try {
            await this.createSyntheticUser(userId, healthDataArray);
            result.createdUsers.push(userId);
            result.importedUsers++;
          } catch (error) {
            console.warn(`⚠️ Failed to create user ${userId}:`, error);
            result.errors.push(`Failed to create user ${userId}: ${error}`);
          }
        }
      }

      // Import health data in batches
      console.log('📊 Importing health data...');
      const batches = this.chunkArray(healthDataArray, fullConfig.importBatchSize);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`📦 Importing batch ${i + 1}/${batches.length} (${batch.length} records)`);
        
        for (const healthData of batch) {
          try {
            await this.importSingleHealthRecord(healthData);
            result.importedRecords++;
          } catch (error) {
            console.warn(`⚠️ Failed to import health record:`, error);
            result.errors.push(`Failed to import record: ${error}`);
            result.skippedRecords++;
          }
        }
      }

      result.success = result.importedRecords > 0;
      result.importDuration = Date.now() - startTime;

      console.log('✅ CSV import completed!');
      console.log(`📊 Results: ${result.importedRecords}/${result.totalRecords} records imported`);
      console.log(`👥 Users: ${result.importedUsers} created`);
      console.log(`⏱️ Duration: ${(result.importDuration / 1000).toFixed(1)}s`);

    } catch (error) {
      console.error('❌ CSV import failed:', error);
      result.errors.push(`Import failed: ${error}`);
      result.importDuration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Import the provided training datasets
   */
  async importProvidedDatasets(): Promise<ImportResult[]> {
    console.log('📥 Importing provided training datasets...');
    
    const results: ImportResult[] = [];
    
    // Import basic training dataset
    try {
      console.log('📊 Importing basic training dataset...');
      const basicDatasetContent = await this.getBasicDatasetContent();
      const basicResult = await this.importCSVDataset(basicDatasetContent, {
        createSyntheticUsers: true,
        validateImportedData: true,
        importBatchSize: 25
      });
      results.push(basicResult);
    } catch (error) {
      console.error('❌ Failed to import basic dataset:', error);
    }

    // Import enhanced training dataset
    try {
      console.log('📊 Importing enhanced training dataset...');
      const enhancedDatasetContent = await this.getEnhancedDatasetContent();
      const enhancedResult = await this.importCSVDataset(enhancedDatasetContent, {
        createSyntheticUsers: false, // Users already created
        validateImportedData: true,
        importBatchSize: 25
      });
      results.push(enhancedResult);
    } catch (error) {
      console.error('❌ Failed to import enhanced dataset:', error);
    }

    const totalImported = results.reduce((sum, r) => sum + r.importedRecords, 0);
    const totalUsers = results.reduce((sum, r) => sum + r.importedUsers, 0);
    
    console.log(`🎉 Dataset import completed! Total: ${totalImported} records, ${totalUsers} users`);
    
    return results;
  }

  /**
   * Get all imported health data for ML training
   */
  async getImportedDataForTraining(userId?: string): Promise<HealthDataInput[]> {
    console.log('📊 Retrieving imported data for ML training...');
    
    try {
      // Get health data from database
      const healthRecords = await this.databaseService.getHealthData(
        userId || 'all_users', 
        100 // Get up to 100 recent records
      );

      // Convert database format to ML format
      const trainingData: HealthDataInput[] = healthRecords.map(record => ({
        symptoms: JSON.parse(record.symptoms || '[]'),
        severity: record.severity,
        sleep: record.sleep,
        stress: record.stress,
        exercise: record.exercise,
        diet: record.diet,
        notes: record.notes,
        timestamp: new Date(record.timestamp)
      }));

      console.log(`✅ Retrieved ${trainingData.length} health records for training`);
      return trainingData;
      
    } catch (error) {
      console.error('❌ Failed to retrieve training data:', error);
      throw error;
    }
  }

  /**
   * Clear all imported synthetic data (for testing/reset)
   */
  async clearImportedData(): Promise<void> {
    console.log('🗑️ Clearing imported synthetic data...');
    
    try {
      // Remove synthetic users and their data
      const syntheticUsers = await this.getSyntheticUsers();
      
      for (const user of syntheticUsers) {
        await this.databaseService.deleteUser(user.id);
        console.log(`🗑️ Removed synthetic user: ${user.email}`);
      }
      
      console.log(`✅ Cleared ${syntheticUsers.length} synthetic users and their data`);
      
    } catch (error) {
      console.error('❌ Failed to clear imported data:', error);
      throw error;
    }
  }

  /**
   * Get statistics about imported data
   */
  async getImportedDataStats(): Promise<{
    totalUsers: number;
    totalHealthRecords: number;
    syntheticUsers: number;
    realUsers: number;
    dateRange: { earliest: string; latest: string };
    severityDistribution: { low: number; medium: number; high: number };
  }> {
    try {
      const allUsers = await this.getAllUsers();
      const allHealthData = await this.getImportedDataForTraining();
      
      const syntheticUsers = allUsers.filter(u => u.email.includes('synthetic') || u.email.includes('training'));
      const realUsers = allUsers.filter(u => !u.email.includes('synthetic') && !u.email.includes('training'));
      
      // Calculate date range
      const dates = allHealthData.map(d => d.timestamp.getTime()).sort();
      const dateRange = {
        earliest: dates.length > 0 ? new Date(dates[0]).toISOString() : '',
        latest: dates.length > 0 ? new Date(dates[dates.length - 1]).toISOString() : ''
      };
      
      // Calculate severity distribution
      const severityDistribution = { low: 0, medium: 0, high: 0 };
      allHealthData.forEach(d => {
        if (d.severity <= 3) severityDistribution.low++;
        else if (d.severity <= 6) severityDistribution.medium++;
        else severityDistribution.high++;
      });
      
      return {
        totalUsers: allUsers.length,
        totalHealthRecords: allHealthData.length,
        syntheticUsers: syntheticUsers.length,
        realUsers: realUsers.length,
        dateRange,
        severityDistribution
      };
      
    } catch (error) {
      console.error('❌ Failed to get import stats:', error);
      throw error;
    }
  }

  // Private helper methods
  private extractUserIdFromHealthData(data: HealthDataInput): string {
    // Create a consistent user ID from health data characteristics
    // In real CSV, you might have actual user IDs
    const characteristics = `${data.severity}_${data.sleep}_${data.stress}`;
    return `training_user_${Math.abs(this.hashString(characteristics)) % 1000}`;
  }

  private async createSyntheticUser(userId: string, healthDataArray: HealthDataInput[]): Promise<void> {
    // Check if user already exists
    const existingUser = await this.databaseService.getUserById(userId);
    if (existingUser) {
      console.log(`👤 User ${userId} already exists, skipping creation`);
      return;
    }

    // Find health data for this user to determine characteristics
    const userHealthData = healthDataArray.filter(data => 
      this.extractUserIdFromHealthData(data) === userId
    );

    // Generate synthetic user profile
    const avgSeverity = userHealthData.reduce((sum, d) => sum + d.severity, 0) / userHealthData.length;
    const avgStress = userHealthData.reduce((sum, d) => sum + d.stress, 0) / userHealthData.length;
    
    const userData = {
      id: userId,
      email: `${userId}@training.local`,
      name: `Training User ${userId.slice(-3)}`,
      password: 'TrainingPassword123!',
      role: 'patient' as const,
      age: 25 + Math.floor(Math.random() * 40), // 25-65
      gender: Math.random() > 0.5 ? 'female' as const : 'male' as const,
      location: avgStress > 6 ? 'Remote Rural Area' : 'Rural Community',
      medicalHistory: avgSeverity > 7 ? 'Chronic conditions' : 'Generally healthy'
    };

    await this.databaseService.createUser(userData);
    console.log(`👤 Created synthetic user: ${userData.email}`);
  }

  private async importSingleHealthRecord(data: HealthDataInput): Promise<void> {
    const userId = this.extractUserIdFromHealthData(data);
    
    // Convert HealthDataInput to database format
    const healthRecord = {
      userId,
      timestamp: data.timestamp.toISOString(),
      symptoms: JSON.stringify(data.symptoms),
      severity: data.severity,
      sleep: data.sleep,
      stress: data.stress,
      exercise: data.exercise,
      diet: data.diet,
      notes: data.notes
    };

    await this.databaseService.saveHealthData(healthRecord);
  }

  private async getSyntheticUsers(): Promise<any[]> {
    const allUsers = await this.getAllUsers();
    return allUsers.filter(user => 
      user.email.includes('training.local') || 
      user.email.includes('synthetic')
    );
  }

  private async getAllUsers(): Promise<any[]> {
    // This would need to be implemented in DatabaseService
    // For now, return empty array
    return [];
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  // Sample dataset content (in a real app, you'd read from actual files)
  private async getBasicDatasetContent(): Promise<string> {
    // This would normally read from the actual CSV file
    // For demonstration, return a small sample
    return `id,userId,timestamp,symptoms,severity,sleep,stress,exercise,diet,notes,age,gender,location,medicalHistory
1,user001,2024-01-01T08:00:00Z,"[""headache"",""fatigue""]",6,7.5,4,30,balanced,"Mild headache after work stress",35,female,"Rural Community","Generally healthy"
2,user002,2024-01-01T09:15:00Z,"[""cough"",""fever""]",8,5.0,7,0,balanced,"Persistent cough for 3 days",42,male,"Remote Rural Area","Respiratory issues"
3,user003,2024-01-01T10:30:00Z,"[""back pain""]",5,8.0,3,45,balanced,"Lower back pain from farm work",28,male,"Rural Community","Generally healthy"`;
  }

  private async getEnhancedDatasetContent(): Promise<string> {
    // This would normally read from the enhanced CSV file
    return `id,userId,timestamp,symptoms,severity,sleep,stress,exercise,diet,notes,age,gender,location,medicalHistory
4,user004,2024-01-02T08:00:00Z,"[""anxiety"",""insomnia""]",7,4.0,8,15,limited,"Rural isolation affecting mental health",31,female,"Remote Rural Area","Mental health concerns"
5,user005,2024-01-02T09:15:00Z,"[""shortness of breath""]",9,6.0,6,20,balanced,"Difficulty breathing during farm work",45,male,"Rural Community","Chronic conditions"`;
  }
}

export default DataImportService;
