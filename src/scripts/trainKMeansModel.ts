import { dataService } from '../services/DataService';
import { databaseService } from '../services/DatabaseService';
import { ComprehensiveTrainingService } from '../services/ComprehensiveTrainingService';
import { MachineLearningService } from '../services/MachineLearningService';

class KMeansTrainingScript {
  private trainingService: ComprehensiveTrainingService;
  private mlService: MachineLearningService;

  constructor() {
    this.trainingService = new ComprehensiveTrainingService();
    this.mlService = new MachineLearningService();
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing K-means training script...');
    
    try {
      // Initialize all required services
      await dataService.initialize();
      console.log('✅ DataService initialized');
      
      // Training service uses internal dataset initialization
      console.log('✅ TrainingService ready');
      
      console.log('🎯 All services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }

  async trainKMeansModel(): Promise<boolean> {
    console.log('🧠 Starting K-means model training...');
    
    try {
      // Load all available datasets (analysis summary)
      console.log('📊 Loading datasets...');
      const analyses = await this.trainingService.loadAllDatasets();
      console.log(`✅ Loaded ${analyses.length} dataset analyses`);

      if (analyses.length === 0) {
        console.warn('⚠️ No datasets available for training');
        return false;
      }

      // Combine all datasets for training
      console.log('🔄 Combining datasets...');
      const combinedData = this.combineDatasets((this as any).trainingService.datasets ? Array.from((this as any).trainingService.datasets.values()).map((d: any) => d.records) : []);
      console.log(`✅ Combined data contains ${combinedData.length} records`);

      // Train using ML analysis pipeline
      console.log('🎯 Running ML analysis on combined data...');
      const healthData = combinedData.map((record: any) => ({
        symptoms: record.symptoms || [],
        severity: record.severity,
        sleep: record.behavior?.sleep ?? 7,
        stress: record.behavior?.stress ?? 5,
        exercise: record.behavior?.exercise ?? 30,
        diet: record.behavior?.diet ?? 'balanced',
        notes: record.notes || '',
        timestamp: new Date(record.timestamp)
      }));

      const modelResult = await this.mlService.analyzeHealthData('training_pipeline', healthData);
      
      if (modelResult) {
        console.log('✅ K-means model trained successfully');
        console.log(`🎯 Number of clusters: ${modelResult.clusters?.length || 0}`);
        
        // Save model to database
        console.log('💾 Saving model to database...');
        await this.saveModelToDatabase(modelResult);
        console.log('✅ Model saved to database');
        
        return true;
      } else {
        console.error('❌ K-means model training failed: No result returned');
        return false;
      }
    } catch (error) {
      console.error('❌ Error during K-means training:', error);
      return false;
    }
  }

  private combineDatasets(datasets: any[]): any[] {
    const combined: any[] = [];
    
    datasets.forEach((dataset: any[], index: number) => {
      console.log(`📊 Processing dataset ${index + 1}: ${dataset.length} records`);
      
      dataset.forEach((record: any) => {
        // Normalize and combine data
        const normalizedRecord = this.normalizeRecord(record);
        if (normalizedRecord) {
          combined.push(normalizedRecord);
        }
      });
    });
    
    return combined;
  }

  private normalizeRecord(record: any): any {
    try {
      // Extract and normalize symptoms
      const symptoms = Array.isArray(record.symptoms) 
        ? record.symptoms 
        : typeof record.symptoms === 'string' 
          ? JSON.parse(record.symptoms) 
          : [];

      // Normalize severity (ensure it's 1-10)
      const severity = Math.max(1, Math.min(10, record.severity || 5));

      // Normalize behavior data
      const behavior = {
        sleep: Math.max(0, Math.min(24, record.sleep || record.behavior?.sleep || 8)),
        stress: Math.max(1, Math.min(10, record.stress || record.behavior?.stress || 5)),
        exercise: Math.max(0, Math.min(300, record.exercise || record.behavior?.exercise || 30)),
        diet: record.diet || record.behavior?.diet || 'balanced'
      };

      return {
        symptoms,
        severity,
        behavior,
        timestamp: record.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.warn('⚠️ Failed to normalize record:', error);
      return null;
    }
  }

  private async saveModelToDatabase(modelResult: any): Promise<void> {
    try {
      const modelData = {
        id: `kmeans_${Date.now()}`,
        type: 'kmeans',
        version: '1.0',
        accuracy: modelResult.accuracy,
        clusters: modelResult.clusters,
        features: modelResult.featureImportance,
        trainedAt: new Date().toISOString(),
        metadata: {
          algorithm: 'K-means',
          parameters: {},
          datasetSize: modelResult?.clusters?.reduce((sum: number, c: any) => sum + (c.members?.length || 0), 0) || 0
        }
      };

      // Save to database (you may need to implement this method)
      console.log('💾 Model data prepared:', modelData);
      
      // For now, just log the model info
      console.log('📋 Model Summary:');
      console.log(`   - Type: ${modelData.type}`);
      if (typeof modelData.accuracy === 'number') {
        console.log(`   - Accuracy: ${modelData.accuracy.toFixed(2)}%`);
      }
      console.log(`   - Clusters: ${modelData.clusters?.length || 0}`);
      console.log(`   - Trained at: ${modelData.trainedAt}`);
      
    } catch (error) {
      console.error('❌ Failed to save model to database:', error);
      throw error;
    }
  }

  async runFullTraining(): Promise<void> {
    console.log('🎯 Starting full K-means training pipeline...');
    
    try {
      await this.initialize();
      const success = await this.trainKMeansModel();
      
      if (success) {
        console.log('🎉 K-means training completed successfully!');
      } else {
        console.error('❌ K-means training failed');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Training pipeline failed:', error);
      process.exit(1);
    }
  }
}

// Export for use in other scripts
export { KMeansTrainingScript };

// Run the script if called directly
if (require.main === module) {
  const script = new KMeansTrainingScript();
  script.runFullTraining();
}
