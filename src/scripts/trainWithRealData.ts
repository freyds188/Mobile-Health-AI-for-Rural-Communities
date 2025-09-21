/**
 * Real Data Training Script
 * Trains ML model using actual CSV datasets and real user data
 */

import MLTrainingService from '../services/MLTrainingService';
import DataImportService from '../services/DataImportService';
import * as fs from 'fs';
import * as path from 'path';

export async function runRealDataTraining(): Promise<void> {
  console.log('🏥 Starting Real Data Training');
  console.log('==============================');

  const trainingService = new MLTrainingService();
  const importService = new DataImportService();

  try {
    // Step 1: Check available training data
    console.log('📊 Step 1: Analyzing available training data...');
    const dataStats = await trainingService.getTrainingDataStats();
    
    console.log('\n📈 TRAINING DATA OVERVIEW');
    console.log('=========================');
    console.log(`Total Available Records: ${dataStats.totalAvailable}`);
    console.log(`Imported Dataset Records: ${dataStats.imported.totalHealthRecords}`);
    console.log(`Real User Records: ${dataStats.realUsers}`);
    console.log(`Synthetic Users: ${dataStats.imported.syntheticUsers}`);
    console.log(`Real Users: ${dataStats.imported.realUsers}`);
    
    if (dataStats.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      dataStats.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    // Step 2: Import CSV datasets if needed
    if (dataStats.imported.totalHealthRecords === 0) {
      console.log('\n📥 Step 2: Importing CSV datasets...');
      
      try {
        // Try to read actual CSV files
        const csvContent = await readCSVFiles();
        if (csvContent.basic || csvContent.enhanced) {
          console.log('📄 Found CSV files, importing...');
          
          if (csvContent.basic) {
            console.log('📊 Importing basic training dataset...');
            const basicResult = await importService.importCSVDataset(csvContent.basic, {
              createSyntheticUsers: true,
              validateImportedData: true,
              importBatchSize: 25
            });
            console.log(`✅ Basic dataset: ${basicResult.importedRecords} records imported`);
          }
          
          if (csvContent.enhanced) {
            console.log('📊 Importing enhanced training dataset...');
            const enhancedResult = await importService.importCSVDataset(csvContent.enhanced, {
              createSyntheticUsers: false, // Users already created
              validateImportedData: true,
              importBatchSize: 25
            });
            console.log(`✅ Enhanced dataset: ${enhancedResult.importedRecords} records imported`);
          }
        } else {
          console.log('⚠️ CSV files not found, will use sample data for demonstration');
        }
      } catch (error) {
        console.log('⚠️ Could not import CSV files, using built-in datasets');
        await importService.importProvidedDatasets();
      }
    } else {
      console.log('\n✅ Step 2: CSV datasets already imported');
    }

    // Step 3: Run different training scenarios
    console.log('\n🚀 Step 3: Running training scenarios...');
    
    const trainingResults = [];

    // Scenario A: Train with imported datasets only
    console.log('\n🔬 SCENARIO A: Training with Imported Datasets');
    console.log('===============================================');
    try {
      const datasetResult = await trainingService.trainWithImportedDatasets();
      trainingResults.push({ name: 'Imported Datasets', result: datasetResult });
      console.log(`✅ Dataset training completed: F1=${datasetResult.validation.f1Score.toFixed(3)}`);
    } catch (error) {
      console.log('❌ Dataset training failed:', error);
    }

    // Scenario B: Train with real user data (if available)
    console.log('\n👥 SCENARIO B: Training with Real User Data');
    console.log('============================================');
    try {
      const realUserResult = await trainingService.trainWithRealUserData();
      trainingResults.push({ name: 'Real User Data', result: realUserResult });
      console.log(`✅ Real user training completed: F1=${realUserResult.validation.f1Score.toFixed(3)}`);
    } catch (error) {
      console.log('❌ Real user training failed:', error);
    }

    // Scenario C: Hybrid training (best approach)
    console.log('\n🔄 SCENARIO C: Hybrid Training (Recommended)');
    console.log('=============================================');
    try {
      const hybridResult = await trainingService.trainHybridModel();
      trainingResults.push({ name: 'Hybrid Model', result: hybridResult });
      console.log(`✅ Hybrid training completed: F1=${hybridResult.validation.f1Score.toFixed(3)}`);
    } catch (error) {
      console.log('❌ Hybrid training failed:', error);
    }

    // Step 4: Compare results and recommend best model
    if (trainingResults.length > 0) {
      console.log('\n🏆 TRAINING RESULTS COMPARISON');
      console.log('==============================');
      
      // Sort by F1 score
      const sortedResults = trainingResults.sort((a, b) => 
        b.result.validation.f1Score - a.result.validation.f1Score
      );
      
      sortedResults.forEach((training, index) => {
        const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        const result = training.result;
        
        console.log(`\n${rank} ${training.name}:`);
        console.log(`   F1 Score: ${result.validation.f1Score.toFixed(3)}`);
        console.log(`   Accuracy: ${result.validation.accuracy.toFixed(3)}`);
        console.log(`   Training Samples: ${result.metrics.trainingSamples}`);
        console.log(`   Clusters: ${result.metrics.optimalK}`);
        console.log(`   Training Time: ${(result.metrics.trainingTime / 1000).toFixed(1)}s`);
      });

      // Recommend best model
      const bestModel = sortedResults[0];
      console.log('\n🎯 RECOMMENDED MODEL');
      console.log('====================');
      console.log(`Model Type: ${bestModel.name}`);
      console.log(`Model ID: ${bestModel.result.modelId}`);
      console.log(`Performance: ${getPerformanceRating(bestModel.result.validation.f1Score)}`);
      console.log(`F1 Score: ${bestModel.result.validation.f1Score.toFixed(3)}`);
      
      // Deployment readiness assessment
      console.log('\n🚀 DEPLOYMENT READINESS');
      console.log('=======================');
      if (bestModel.result.validation.f1Score >= 0.85) {
        console.log('✅ READY FOR PRODUCTION');
        console.log('   - Model performance is excellent');
        console.log('   - Safe to deploy to users');
        console.log('   - Set up monitoring and feedback collection');
      } else if (bestModel.result.validation.f1Score >= 0.75) {
        console.log('⚠️ READY WITH MONITORING');
        console.log('   - Model performance is good but monitor closely');
        console.log('   - Consider A/B testing against baseline');
        console.log('   - Collect user feedback for improvements');
      } else {
        console.log('❌ NEEDS IMPROVEMENT');
        console.log('   - Collect more training data');
        console.log('   - Review feature engineering');
        console.log('   - Consider different ML approaches');
      }

      // Next steps guidance
      console.log('\n📋 NEXT STEPS');
      console.log('=============');
      console.log('1. Integrate best model into your HealthDataContext');
      console.log('2. Update MachineLearningService to use trained model');
      console.log('3. Add model retraining capabilities to your app');
      console.log('4. Set up data collection for continuous improvement');
      console.log('5. Monitor model performance in production');

    } else {
      console.log('\n❌ No training scenarios completed successfully');
      console.log('💡 Check your data setup and try the basic training script first');
    }

    console.log('\n✅ Real data training completed successfully!');
    
  } catch (error) {
    console.error('❌ Real data training failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure CSV datasets are available');
    console.log('2. Check database connectivity');
    console.log('3. Verify sufficient system resources');
    console.log('4. Try basic training script first: npm run train:basic');
  }
}

// Helper functions
async function readCSVFiles(): Promise<{ basic?: string; enhanced?: string }> {
  const csvContent: { basic?: string; enhanced?: string } = {};
  
  try {
    // Try to read basic training dataset
    const basicPath = path.join(process.cwd(), 'datasets/basic_health_assessment_dataset.csv');
    if (fs.existsSync(basicPath)) {
      csvContent.basic = fs.readFileSync(basicPath, 'utf-8');
      console.log('📄 Found basic_health_assessment_dataset.csv');
    }
  } catch (error) {
    console.log('⚠️ Could not read basic_health_assessment_dataset.csv');
  }

  try {
    // Try to read enhanced training dataset
    const enhancedPath = path.join(process.cwd(), 'datasets/temporal_health_patterns_dataset.csv');
    if (fs.existsSync(enhancedPath)) {
      csvContent.enhanced = fs.readFileSync(enhancedPath, 'utf-8');
      console.log('📄 Found temporal_health_patterns_dataset.csv');
    }
  } catch (error) {
    console.log('⚠️ Could not read temporal_health_patterns_dataset.csv');
  }

  return csvContent;
}

function getPerformanceRating(f1Score: number): string {
  if (f1Score >= 0.90) return 'EXCELLENT';
  if (f1Score >= 0.80) return 'GOOD';
  if (f1Score >= 0.70) return 'FAIR';
  return 'NEEDS IMPROVEMENT';
}

// Run if called directly
if (require.main === module) {
  runRealDataTraining().catch(console.error);
}
