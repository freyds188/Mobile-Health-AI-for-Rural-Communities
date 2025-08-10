/**
 * Model Deployment Script
 * Automatically trains and deploys the best performing model for production
 */

import MLTrainingService from '../services/MLTrainingService';
import ModelDeploymentService from '../services/ModelDeploymentService';

export async function deployProductionModel(): Promise<void> {
  console.log('🚀 Starting Production Model Deployment');
  console.log('======================================');

  const trainingService = new MLTrainingService();
  const deploymentService = new ModelDeploymentService();

  try {
    // Step 1: Check existing model
    console.log('📊 Step 1: Checking existing deployed model...');
    const currentModel = deploymentService.getDeployedModelInfo();
    
    if (currentModel.isDeployed) {
      console.log(`✅ Current model deployed: ${currentModel.modelId}`);
      console.log(`📈 Performance: F1=${currentModel.performance?.f1Score.toFixed(3)}, Accuracy=${currentModel.performance?.accuracy.toFixed(3)}`);
    } else {
      console.log('⚠️ No model currently deployed');
    }

    // Step 2: Train multiple model candidates
    console.log('\n🧠 Step 2: Training model candidates...');
    
    const modelCandidates = [];

    // Candidate 1: Hybrid model (recommended)
    console.log('🔄 Training hybrid model...');
    try {
      const hybridModel = await trainingService.trainHybridModel();
      modelCandidates.push({ name: 'Hybrid Model', model: hybridModel });
      console.log(`✅ Hybrid model: F1=${hybridModel.validation.f1Score.toFixed(3)}`);
    } catch (error) {
      console.log('❌ Hybrid model training failed:', error);
    }

    // Candidate 2: Dataset-only model
    console.log('🔄 Training dataset-only model...');
    try {
      const datasetModel = await trainingService.trainWithImportedDatasets();
      modelCandidates.push({ name: 'Dataset Model', model: datasetModel });
      console.log(`✅ Dataset model: F1=${datasetModel.validation.f1Score.toFixed(3)}`);
    } catch (error) {
      console.log('❌ Dataset model training failed:', error);
    }

    // Candidate 3: User data model (if available)
    console.log('🔄 Training user data model...');
    try {
      const userModel = await trainingService.trainWithRealUserData();
      modelCandidates.push({ name: 'User Data Model', model: userModel });
      console.log(`✅ User data model: F1=${userModel.validation.f1Score.toFixed(3)}`);
    } catch (error) {
      console.log('❌ User data model training failed:', error);
    }

    if (modelCandidates.length === 0) {
      throw new Error('No model candidates were successfully trained');
    }

    // Step 3: Select best model
    console.log('\n🏆 Step 3: Selecting best model...');
    const bestCandidate = modelCandidates.reduce((best, current) => 
      current.model.validation.f1Score > best.model.validation.f1Score ? current : best
    );

    console.log(`🥇 Best model: ${bestCandidate.name}`);
    console.log(`📊 Performance: F1=${bestCandidate.model.validation.f1Score.toFixed(3)}, Accuracy=${bestCandidate.model.validation.accuracy.toFixed(3)}`);

    // Step 4: Validate deployment readiness
    console.log('\n🔍 Step 4: Validating deployment readiness...');
    
    const f1Score = bestCandidate.model.validation.f1Score;
    const accuracy = bestCandidate.model.validation.accuracy;
    
    if (f1Score < 0.70) {
      console.log('❌ DEPLOYMENT BLOCKED: F1 score too low (< 0.70)');
      console.log('💡 Recommendation: Collect more training data or improve feature engineering');
      return;
    }

    if (bestCandidate.model.metrics.trainingSamples < 20) {
      console.log('❌ DEPLOYMENT BLOCKED: Insufficient training data (< 20 samples)');
      console.log('💡 Recommendation: Collect more training samples');
      return;
    }

    // Check if new model is better than current
    if (currentModel.isDeployed && currentModel.performance) {
      const improvement = f1Score - currentModel.performance.f1Score;
      if (improvement < 0.01) {
        console.log('⚠️ DEPLOYMENT SKIPPED: New model does not significantly improve performance');
        console.log(`📊 Improvement: ${(improvement * 100).toFixed(1)}% (threshold: 1%)`);
        console.log('💡 Current model remains deployed');
        return;
      } else {
        console.log(`✅ Performance improvement: ${(improvement * 100).toFixed(1)}%`);
      }
    }

    // Step 5: Deploy the model
    console.log('\n🚀 Step 5: Deploying model to production...');
    
    await deploymentService.deployModel(bestCandidate.model);
    
    console.log('✅ Model deployed successfully!');

    // Step 6: Verify deployment
    console.log('\n🔍 Step 6: Verifying deployment...');
    
    const deployedModel = deploymentService.getDeployedModelInfo();
    if (deployedModel.isDeployed) {
      console.log('✅ Deployment verified successfully');
      console.log(`📋 Deployed Model: ${deployedModel.modelId}`);
      console.log(`📈 Performance: F1=${deployedModel.performance?.f1Score.toFixed(3)}`);
      console.log(`🎯 Clusters: ${deployedModel.clusters}`);
    } else {
      console.log('❌ Deployment verification failed');
    }

    // Step 7: Configure continuous learning
    console.log('\n⚙️ Step 7: Configuring continuous learning...');
    
    deploymentService.updateLearningConfig({
      retrainingThreshold: 100, // Retrain after 100 new predictions
      performanceThreshold: Math.max(0.75, f1Score - 0.05), // Maintain within 5% of current performance
      updateFrequency: 'weekly',
      autoDeployment: f1Score >= 0.85 // Auto-deploy only for excellent models
    });

    console.log('✅ Continuous learning configured');

    // Step 8: Performance recommendations
    console.log('\n💡 DEPLOYMENT SUMMARY');
    console.log('====================');
    console.log(`Model Type: ${bestCandidate.name}`);
    console.log(`Model ID: ${bestCandidate.model.modelId}`);
    console.log(`F1 Score: ${f1Score.toFixed(3)} (${getPerformanceRating(f1Score)})`);
    console.log(`Accuracy: ${accuracy.toFixed(3)}`);
    console.log(`Training Samples: ${bestCandidate.model.metrics.trainingSamples}`);
    
    if (f1Score >= 0.90) {
      console.log('🎉 EXCELLENT: Model is production-ready with outstanding performance');
      console.log('✅ Recommendations:');
      console.log('   - Monitor performance metrics');
      console.log('   - Collect user feedback');
      console.log('   - Set up automated monitoring');
    } else if (f1Score >= 0.80) {
      console.log('✅ GOOD: Model is suitable for production deployment');
      console.log('💡 Recommendations:');
      console.log('   - Monitor closely for first few weeks');
      console.log('   - Collect user feedback for improvements');
      console.log('   - Plan for data collection to improve performance');
    } else {
      console.log('⚠️ FAIR: Model deployed but monitor closely');
      console.log('🔧 Recommendations:');
      console.log('   - Implement A/B testing against baseline');
      console.log('   - Aggressive data collection for retraining');
      console.log('   - Consider ensemble methods');
    }

    console.log('\n🎯 NEXT STEPS');
    console.log('=============');
    console.log('1. Model is now active and making predictions');
    console.log('2. Access model management through ModelManagementPanel');
    console.log('3. Monitor predictions through HealthDataContext');
    console.log('4. Model will automatically improve with more data');
    console.log('5. Set up production monitoring and alerts');

    console.log('\n🎉 Production deployment completed successfully!');

  } catch (error) {
    console.error('❌ Production deployment failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure training datasets are available');
    console.log('2. Check system resources and network connectivity');
    console.log('3. Verify MachineLearningService is properly configured');
    console.log('4. Try individual training commands first');
    console.log('5. Check logs for specific error details');
  }
}

function getPerformanceRating(f1Score: number): string {
  if (f1Score >= 0.90) return 'EXCELLENT';
  if (f1Score >= 0.80) return 'GOOD';
  if (f1Score >= 0.70) return 'FAIR';
  return 'NEEDS IMPROVEMENT';
}

// Run if called directly
if (require.main === module) {
  deployProductionModel().catch(console.error);
}
