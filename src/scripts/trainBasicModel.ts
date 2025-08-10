/**
 * Basic Model Training Script
 * Trains a K-means model using sample data and basic configuration
 */

import MLTrainingService, { TrainingConfig } from '../services/MLTrainingService';

export async function runBasicTraining(): Promise<void> {
  console.log('🚀 Starting Basic Model Training');
  console.log('================================');

  const trainingService = new MLTrainingService();

  try {
    // Use quick training with sample data
    console.log('📊 Generating sample training data...');
    const result = await trainingService.quickTrain(80);
    
    // Display results
    console.log('\n📊 TRAINING RESULTS');
    console.log('===================');
    console.log(`Model ID: ${result.modelId}`);
    console.log(`Optimal K: ${result.metrics.optimalK}`);
    console.log(`Training Samples: ${result.metrics.trainingSamples}`);
    console.log(`Testing Samples: ${result.metrics.testingSamples}`);
    console.log(`Training Time: ${(result.metrics.trainingTime / 1000).toFixed(1)}s`);
    console.log(`F1 Score: ${result.validation.f1Score.toFixed(3)}`);
    console.log(`Accuracy: ${result.validation.accuracy.toFixed(3)}`);

    // Display cluster information
    console.log('\n🎯 CLUSTER ANALYSIS');
    console.log('===================');
    result.clusters.forEach(cluster => {
      console.log(`Cluster ${cluster.clusterId}:`);
      console.log(`  Members: ${cluster.memberCount}`);
      console.log(`  Avg Severity: ${cluster.avgSeverity.toFixed(2)}`);
      console.log(`  Risk Level: ${cluster.riskLevel.toUpperCase()}`);
    });

    // Performance assessment
    console.log('\n📈 PERFORMANCE ASSESSMENT');
    console.log('=========================');
    if (result.validation.f1Score >= 0.85) {
      console.log('✅ EXCELLENT: Model performance is excellent (F1 ≥ 0.85)');
    } else if (result.validation.f1Score >= 0.75) {
      console.log('✅ GOOD: Model performance is good (F1 ≥ 0.75)');
    } else if (result.validation.f1Score >= 0.65) {
      console.log('⚠️ FAIR: Model performance is fair (F1 ≥ 0.65)');
      console.log('💡 Consider increasing training data or adjusting parameters');
    } else {
      console.log('❌ POOR: Model performance needs improvement (F1 < 0.65)');
      console.log('💡 Try different parameters or more training data');
    }

    console.log('\n✅ Basic training completed successfully!');
    console.log('\n💡 Next Steps:');
    console.log('1. Run advanced training with: npm run train:advanced');
    console.log('2. Validate model with: npm run validate:model');
    console.log('3. Integrate trained model into your app');
    
  } catch (error) {
    console.error('❌ Basic training failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure all dependencies are installed');
    console.log('2. Check if MachineLearningService is properly configured');
    console.log('3. Verify sample data generation is working');
  }
}

// Run if called directly
if (require.main === module) {
  runBasicTraining().catch(console.error);
}
