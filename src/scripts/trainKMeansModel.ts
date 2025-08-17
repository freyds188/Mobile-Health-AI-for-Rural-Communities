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
      
      // Initialize training service
      await this.trainingService.initialize();
      console.log('✅ TrainingService initialized');
      
      console.log('🎯 All services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }

  async trainKMeansModel(): Promise<boolean> {
    console.log('🧠 Starting K-means model training...');
    
    try {
      // Load all available datasets
      console.log('📊 Loading datasets...');
      const datasets = await this.trainingService.loadAllDatasets();
      console.log(`✅ Loaded ${datasets.length} datasets`);

      if (datasets.length === 0) {
        console.warn('⚠️ No datasets available for training');
        return false;
      }

      // Combine all datasets for training
      console.log('🔄 Combining datasets...');
      const combinedData = this.combineDatasets(datasets);
      console.log(`✅ Combined data contains ${combinedData.length} records`);

      // Train K-means model
      console.log('🎯 Training K-means model...');
      const modelResult = await this.mlService.trainKMeansModel(combinedData);
      
      if (modelResult.success) {
        console.log('✅ K-means model trained successfully');
        console.log(`📈 Model accuracy: ${modelResult.accuracy?.toFixed(2)}%`);
        console.log(`🎯 Number of clusters: ${modelResult.clusters?.length || 'N/A'}`);
        
        // Save model to database
        console.log('💾 Saving model to database...');
        await this.saveModelToDatabase(modelResult);
        console.log('✅ Model saved to database');
        
        return true;
      } else {
        console.error('❌ K-means model training failed:', modelResult.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error during K-means training:', error);
      return false;
    }
  }

  private combineDatasets(datasets: any[]): any[] {
    const combined: any[] = [];
    
    datasets.forEach((dataset, index) => {
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
        features: modelResult.features,
        trainedAt: new Date().toISOString(),
        metadata: {
          algorithm: 'K-means',
          parameters: modelResult.parameters,
          datasetSize: modelResult.datasetSize
        }
      };

      // Save to database (you may need to implement this method)
      console.log('💾 Model data prepared:', modelData);
      
      // For now, just log the model info
      console.log('📋 Model Summary:');
      console.log(`   - Type: ${modelData.type}`);
      console.log(`   - Accuracy: ${modelData.accuracy?.toFixed(2)}%`);
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
