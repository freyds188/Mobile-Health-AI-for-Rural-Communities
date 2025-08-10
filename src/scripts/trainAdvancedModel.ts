/**
 * Advanced Model Training Script
 * Trains multiple K-means models with different configurations and compares results
 */

import MLTrainingService, { TrainingConfig } from '../services/MLTrainingService';

export async function runAdvancedTraining(): Promise<void> {
  console.log('🔬 Starting Advanced Model Training');
  console.log('===================================');

  const trainingService = new MLTrainingService();

  try {
    // Generate larger training dataset
    console.log('📊 Generating comprehensive training data...');
    const trainingData = await trainingService.createSampleTrainingData(150);
    
    // Define multiple training configurations for comparison
    const configVariations = [
      {
        maxK: 5,
        iterations: 200,
        testSplit: 0.2,
        convergenceThreshold: 1e-3
      },
      {
        maxK: 7,
        iterations: 300,
        testSplit: 0.2,
        convergenceThreshold: 1e-4
      },
      {
        maxK: 9,
        iterations: 400,
        testSplit: 0.15,
        convergenceThreshold: 1e-4
      },
      {
        maxK: 6,
        iterations: 500,
        testSplit: 0.25,
        convergenceThreshold: 1e-5
      }
    ];

    console.log(`🔄 Training ${configVariations.length} different model configurations...`);
    
    // Train multiple models
    const results = await trainingService.trainMultipleConfigurations(
      trainingData, 
      configVariations
    );
    
    if (results.length === 0) {
      throw new Error('No models were successfully trained');
    }
    
    // Analyze and compare results
    console.log('\n📊 TRAINING COMPARISON');
    console.log('======================');
    
    // Sort results by F1 score
    const sortedResults = results.sort((a, b) => b.validation.f1Score - a.validation.f1Score);
    
    sortedResults.forEach((result, index) => {
      const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      console.log(`\n${rank} Model ${index + 1} (${result.modelId.slice(-8)}):`);
      console.log(`   Config: K=${result.config.maxK}, Iter=${result.config.iterations}, Split=${(result.config.testSplit * 100).toFixed(0)}%`);
      console.log(`   Performance: F1=${result.validation.f1Score.toFixed(3)}, Acc=${result.validation.accuracy.toFixed(3)}`);
      console.log(`   Clusters: ${result.metrics.optimalK}, Time: ${(result.metrics.trainingTime / 1000).toFixed(1)}s`);
      console.log(`   Samples: Train=${result.metrics.trainingSamples}, Test=${result.metrics.testingSamples}`);
    });

    // Best model analysis
    const bestModel = sortedResults[0];
    console.log('\n🏆 BEST MODEL DETAILED ANALYSIS');
    console.log('================================');
    console.log(`Model ID: ${bestModel.modelId}`);
    console.log(`F1 Score: ${bestModel.validation.f1Score.toFixed(3)} (${getPerformanceRating(bestModel.validation.f1Score)})`);
    console.log(`Accuracy: ${bestModel.validation.accuracy.toFixed(3)}`);
    console.log(`Precision: ${bestModel.validation.precision.toFixed(3)}`);
    console.log(`Recall: ${bestModel.validation.recall.toFixed(3)}`);
    console.log(`Optimal K: ${bestModel.metrics.optimalK} clusters`);
    console.log(`Training Time: ${(bestModel.metrics.trainingTime / 1000).toFixed(1)} seconds`);

    // Cluster distribution analysis
    console.log('\n🎯 BEST MODEL CLUSTER ANALYSIS');
    console.log('===============================');
    const totalMembers = bestModel.clusters.reduce((sum, c) => sum + c.memberCount, 0);
    
    bestModel.clusters.forEach(cluster => {
      const percentage = ((cluster.memberCount / totalMembers) * 100).toFixed(1);
      const riskIcon = cluster.riskLevel === 'high' ? '🔴' : 
                       cluster.riskLevel === 'medium' ? '🟡' : '🟢';
      
      console.log(`${riskIcon} Cluster ${cluster.clusterId}: ${cluster.memberCount} members (${percentage}%)`);
      console.log(`   Risk Level: ${cluster.riskLevel.toUpperCase()}`);
      console.log(`   Avg Severity: ${cluster.avgSeverity.toFixed(2)}/10`);
    });

    // Risk distribution analysis
    const riskDistribution = calculateRiskDistribution(bestModel.clusters, totalMembers);
    console.log('\n📊 RISK DISTRIBUTION');
    console.log('====================');
    console.log(`🟢 Low Risk: ${riskDistribution.low}%`);
    console.log(`🟡 Medium Risk: ${riskDistribution.medium}%`);
    console.log(`🔴 High Risk: ${riskDistribution.high}%`);

    // Validate risk distribution for rural healthcare
    validateRuralHealthcareDistribution(riskDistribution);

    // Generate comprehensive training report
    const report = trainingService.generateTrainingReport(results);
    console.log('\n📄 COMPREHENSIVE TRAINING REPORT');
    console.log('=================================');
    console.log(report);

    // Performance recommendations
    console.log('💡 PERFORMANCE RECOMMENDATIONS');
    console.log('===============================');
    
    if (bestModel.validation.f1Score >= 0.90) {
      console.log('✅ EXCELLENT: Model is production-ready');
      console.log('   - Deploy this model to production');
      console.log('   - Monitor performance with real data');
      console.log('   - Set up continuous learning pipeline');
    } else if (bestModel.validation.f1Score >= 0.80) {
      console.log('✅ GOOD: Model is suitable for deployment');
      console.log('   - Consider A/B testing against baseline');
      console.log('   - Gather user feedback for improvement');
      console.log('   - Monitor for edge cases');
    } else if (bestModel.validation.f1Score >= 0.70) {
      console.log('⚠️ FAIR: Model needs optimization before production');
      console.log('   - Collect more diverse training data');
      console.log('   - Try different feature engineering approaches');
      console.log('   - Consider ensemble methods');
    } else {
      console.log('❌ POOR: Significant improvement needed');
      console.log('   - Review feature engineering strategy');
      console.log('   - Increase training data size significantly');
      console.log('   - Consider alternative ML approaches');
    }

    console.log('\n✅ Advanced training completed successfully!');
    console.log('\n🚀 Next Steps:');
    console.log('1. Run model validation: npm run validate:model');
    console.log('2. Test with real user data');
    console.log('3. Deploy best model to production');
    console.log('4. Set up monitoring and feedback loops');
    
  } catch (error) {
    console.error('❌ Advanced training failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if basic training works first');
    console.log('2. Verify system has sufficient memory');
    console.log('3. Ensure no conflicting processes are running');
    console.log('4. Review error logs for specific issues');
  }
}

// Helper functions
function getPerformanceRating(f1Score: number): string {
  if (f1Score >= 0.90) return 'EXCELLENT';
  if (f1Score >= 0.80) return 'GOOD';
  if (f1Score >= 0.70) return 'FAIR';
  return 'NEEDS IMPROVEMENT';
}

function calculateRiskDistribution(clusters: any[], totalMembers: number): {
  low: number;
  medium: number;
  high: number;
} {
  let low = 0, medium = 0, high = 0;
  
  clusters.forEach(cluster => {
    const percentage = (cluster.memberCount / totalMembers) * 100;
    if (cluster.riskLevel === 'low') low += percentage;
    else if (cluster.riskLevel === 'medium') medium += percentage;
    else high += percentage;
  });
  
  return {
    low: Math.round(low),
    medium: Math.round(medium),
    high: Math.round(high)
  };
}

function validateRuralHealthcareDistribution(distribution: { low: number; medium: number; high: number }): void {
  console.log('\n🏥 RURAL HEALTHCARE VALIDATION');
  console.log('==============================');
  
  // Expected distribution for rural healthcare (based on research)
  // Rural areas typically have: 40-60% low risk, 25-40% medium risk, 10-25% high risk
  
  if (distribution.high > 30) {
    console.log('⚠️ WARNING: High-risk population higher than expected for rural areas');
    console.log('   Consider if training data is representative');
  } else if (distribution.high < 10) {
    console.log('⚠️ WARNING: High-risk population lower than expected');
    console.log('   May need more severe case examples in training');
  } else {
    console.log('✅ Risk distribution appears reasonable for rural healthcare');
  }
  
  if (distribution.low < 30) {
    console.log('⚠️ WARNING: Low-risk population may be underrepresented');
    console.log('   Rural areas typically have many wellness visits');
  }
  
  if (distribution.medium > 50) {
    console.log('⚠️ WARNING: Medium-risk population very high');
    console.log('   Consider if clustering is too conservative');
  }
  
  console.log('💡 Rural healthcare insights captured in model training');
}

// Run if called directly
if (require.main === module) {
  runAdvancedTraining().catch(console.error);
}
