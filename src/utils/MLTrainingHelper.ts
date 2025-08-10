import { dataService } from '../services/DataService';

export interface TrainingDataPoint {
  symptoms: string[];
  severity: number;
  sleep: number;
  stress: number;
  exercise: number;
  diet: string;
  notes: string;
  daysAgo?: number;
}

export class MLTrainingHelper {
  
  /**
   * Generate comprehensive training data for ML system
   */
  static generateSampleTrainingData(): TrainingDataPoint[] {
    return [
      // HIGH STRESS CLUSTER
      {
        symptoms: ['headache', 'tension', 'fatigue'],
        severity: 8,
        sleep: 4,
        stress: 9,
        exercise: 0,
        diet: 'Fast food, high caffeine, irregular meals',
        notes: 'Extremely stressful day at work, deadline pressure, poor sleep',
        daysAgo: 10
      },
      {
        symptoms: ['anxiety', 'irritability', 'muscle tension'],
        severity: 7,
        sleep: 5,
        stress: 8,
        exercise: 15,
        diet: 'Skipped breakfast, energy drinks, late dinner',
        notes: 'Work presentation today, felt anxious all morning',
        daysAgo: 9
      },
      {
        symptoms: ['headache', 'fatigue', 'eye strain'],
        severity: 6,
        sleep: 5,
        stress: 7,
        exercise: 10,
        diet: 'Convenience food, too much coffee',
        notes: 'Long hours on computer, stress headache by evening',
        daysAgo: 8
      },

      // HEALTHY LIFESTYLE CLUSTER
      {
        symptoms: [],
        severity: 1,
        sleep: 8,
        stress: 2,
        exercise: 60,
        diet: 'Balanced breakfast, salad lunch, home-cooked dinner',
        notes: 'Great day! Morning run, healthy meals, felt energetic',
        daysAgo: 7
      },
      {
        symptoms: ['mild fatigue'],
        severity: 2,
        sleep: 9,
        stress: 1,
        exercise: 45,
        diet: 'Nutritious meals, plenty of water, light snacks',
        notes: 'Excellent sleep, gentle yoga, peaceful day',
        daysAgo: 6
      },
      {
        symptoms: [],
        severity: 1,
        sleep: 8,
        stress: 3,
        exercise: 30,
        diet: 'Oatmeal, vegetables, lean protein, herbal tea',
        notes: 'Consistent routine, meditation in evening',
        daysAgo: 5
      },

      // ILLNESS/RECOVERY CLUSTER
      {
        symptoms: ['fever', 'cough', 'body aches', 'chills'],
        severity: 9,
        sleep: 12,
        stress: 4,
        exercise: 0,
        diet: 'Soup, tea, light crackers, lots of fluids',
        notes: 'Came down with flu, stayed in bed most of the day',
        daysAgo: 4
      },
      {
        symptoms: ['mild cough', 'fatigue', 'congestion'],
        severity: 5,
        sleep: 10,
        stress: 3,
        exercise: 0,
        diet: 'Chicken soup, orange juice, rest',
        notes: 'Recovering from flu, still tired but better',
        daysAgo: 3
      },
      {
        symptoms: ['slight fatigue'],
        severity: 3,
        sleep: 9,
        stress: 2,
        exercise: 20,
        diet: 'Light meals, vitamins, staying hydrated',
        notes: 'Almost back to normal, took gentle walk',
        daysAgo: 2
      },

      // MODERATE STRESS/LIFESTYLE CLUSTER
      {
        symptoms: ['mild headache', 'some tension'],
        severity: 4,
        sleep: 6,
        stress: 5,
        exercise: 25,
        diet: 'Mixed day - healthy lunch, fast food dinner',
        notes: 'Busy day but manageable, some work stress',
        daysAgo: 1
      },
      {
        symptoms: ['slight fatigue'],
        severity: 3,
        sleep: 7,
        stress: 4,
        exercise: 40,
        diet: 'Good breakfast, salad, pizza for dinner',
        notes: 'Normal day, evening workout felt good',
        daysAgo: 0
      }
    ];
  }

  /**
   * Add sample training data to the system
   */
  static async addSampleTrainingData(userId: string): Promise<void> {
    try {
      console.log('🤖 MLTrainingHelper: Starting sample data generation...');
      
      const sampleData = this.generateSampleTrainingData();
      console.log(`📊 MLTrainingHelper: Generated ${sampleData.length} training samples`);

      for (const data of sampleData) {
        const timestamp = new Date();
        if (data.daysAgo) {
          timestamp.setDate(timestamp.getDate() - data.daysAgo);
        }

        const healthData = {
          symptoms: data.symptoms,
          severity: data.severity,
          sleep: data.sleep,
          stress: data.stress,
          exercise: data.exercise,
          diet: data.diet,
          notes: data.notes,
          timestamp
        };

        await dataService.saveHealthData(userId, healthData);
        console.log(`✅ MLTrainingHelper: Added data point for ${data.daysAgo || 0} days ago`);
        
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('🎯 MLTrainingHelper: Sample data generation complete!');
      console.log('📈 MLTrainingHelper: Triggering ML analysis...');

      // Trigger ML analysis
      const analysis = await dataService.performHealthAnalysis(userId);
      
      console.log('🎉 MLTrainingHelper: Training complete!');
      console.log('📊 Analysis Results:', {
        riskLevel: analysis.riskLevel,
        confidence: analysis.confidence,
        clustersFound: analysis.mlAnalysis.clusters.length,
        patterns: analysis.patterns.length,
        recommendations: analysis.recommendations.length
      });

    } catch (error) {
      console.error('❌ MLTrainingHelper: Training failed:', error);
      throw error;
    }
  }

  /**
   * Generate specific pattern data for testing
   */
  static generatePatternData(patternType: 'stress' | 'healthy' | 'illness' | 'mixed'): TrainingDataPoint[] {
    switch (patternType) {
      case 'stress':
        return [
          { symptoms: ['headache', 'tension'], severity: 8, sleep: 4, stress: 9, exercise: 0, diet: 'Fast food', notes: 'High stress day', daysAgo: 3 },
          { symptoms: ['anxiety', 'fatigue'], severity: 7, sleep: 5, stress: 8, exercise: 10, diet: 'Irregular meals', notes: 'Work pressure', daysAgo: 2 },
          { symptoms: ['irritability'], severity: 6, sleep: 5, stress: 7, exercise: 15, diet: 'High caffeine', notes: 'Stressful week', daysAgo: 1 }
        ];
      
      case 'healthy':
        return [
          { symptoms: [], severity: 1, sleep: 8, stress: 2, exercise: 60, diet: 'Balanced nutrition', notes: 'Great day!', daysAgo: 3 },
          { symptoms: [], severity: 2, sleep: 9, stress: 1, exercise: 45, diet: 'Healthy meals', notes: 'Feeling energetic', daysAgo: 2 },
          { symptoms: ['mild fatigue'], severity: 1, sleep: 8, stress: 2, exercise: 30, diet: 'Good nutrition', notes: 'Consistent routine', daysAgo: 1 }
        ];
      
      case 'illness':
        return [
          { symptoms: ['fever', 'cough'], severity: 9, sleep: 12, stress: 3, exercise: 0, diet: 'Liquids only', notes: 'Sick with flu', daysAgo: 3 },
          { symptoms: ['cough', 'fatigue'], severity: 6, sleep: 10, stress: 2, exercise: 0, diet: 'Light meals', notes: 'Recovering', daysAgo: 2 },
          { symptoms: ['mild fatigue'], severity: 3, sleep: 9, stress: 2, exercise: 15, diet: 'Normal meals', notes: 'Almost better', daysAgo: 1 }
        ];
      
      case 'mixed':
      default:
        return this.generateSampleTrainingData();
    }
  }

  /**
   * Test the ML system with specific patterns
   */
  static async testMLPatterns(userId: string, patternType: 'stress' | 'healthy' | 'illness' | 'mixed' = 'mixed'): Promise<void> {
    try {
      console.log(`🧪 MLTrainingHelper: Testing ${patternType} patterns...`);
      
      const testData = this.generatePatternData(patternType);
      
      for (const data of testData) {
        const timestamp = new Date();
        if (data.daysAgo) {
          timestamp.setDate(timestamp.getDate() - data.daysAgo);
        }

        await dataService.saveHealthData(userId, {
          symptoms: data.symptoms,
          severity: data.severity,
          sleep: data.sleep,
          stress: data.stress,
          exercise: data.exercise,
          diet: data.diet,
          notes: data.notes,
          timestamp
        });
      }

      // Analyze the pattern
      const analysis = await dataService.performHealthAnalysis(userId);
      
      console.log(`✅ MLTrainingHelper: ${patternType} pattern test complete`);
      console.log('📊 Pattern Analysis:', {
        detectedRisk: analysis.riskLevel,
        confidence: analysis.confidence,
        mainPatterns: analysis.patterns.slice(0, 3)
      });

    } catch (error) {
      console.error(`❌ MLTrainingHelper: ${patternType} pattern test failed:`, error);
    }
  }
}

// Export for easy access
export default MLTrainingHelper;