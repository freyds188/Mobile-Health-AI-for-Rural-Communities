/**
 * Model Deployment Service
 * Deploys trained K-means models for production health risk assessment
 * Implements risk levels and continuous learning capabilities
 */

let AsyncStorage: any;
try {
  // Only require AsyncStorage when running in React Native/web environments
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  }
} catch {
  AsyncStorage = null;
}
import { HealthDataInput } from './MachineLearningService';

export interface DeployedModel {
  modelId: string;
  version: string;
  timestamp: Date;
  
  // Model configuration
  optimalK: number;
  featureWeights: number[];
  
  // Risk assessment clusters
  clusters: DeployedCluster[];
  
  // Performance metrics
  f1Score: number;
  accuracy: number;
  
  // Training metadata
  trainingSamples: number;
  datasetSource: string;
}

export interface DeployedCluster {
  clusterId: number;
  centroid: number[];
  riskLevel: 'low' | 'medium' | 'high';
  avgSeverity: number;
  memberCount: number;
  
  // Risk characteristics
  typicalSymptoms: string[];
  riskFactors: string[];
  recommendations: string[];
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  confidence: number;
  primaryCluster: number;
  riskScore: number; // 0-100
  
  // Detailed assessment
  severityRisk: number;
  lifestyleRisk: number;
  symptomRisk: number;
  
  // Actionable insights
  immediateActions: string[];
  preventativeActions: string[];
  followUpRecommended: boolean;
  
  // Rural-specific insights
  accessibilityFactors: string[];
  seasonalConsiderations: string[];
}

export interface ContinuousLearningConfig {
  retrainingThreshold: number; // Number of new samples before retraining
  performanceThreshold: number; // Minimum accuracy to maintain
  updateFrequency: 'daily' | 'weekly' | 'monthly';
  autoDeployment: boolean;
}

export class ModelDeploymentService {
  private deployedModel: DeployedModel | null = null;
  private learningConfig: ContinuousLearningConfig;
  private predictionHistory: Array<{
    input: HealthDataInput;
    prediction: RiskAssessment;
    timestamp: Date;
    actualOutcome?: string;
  }> = [];

  constructor() {
    this.learningConfig = {
      retrainingThreshold: 50,
      performanceThreshold: 0.80,
      updateFrequency: 'weekly',
      autoDeployment: false
    };
    
    this.loadDeployedModel();
  }

  /**
   * Deploy a trained model for production use
   */
  async deployModel(trainedModel: {
    modelId: string;
    validation: { f1Score: number; accuracy: number };
    metrics: { trainingSamples: number; optimalK: number };
    clusters: Array<{
      clusterId: number;
      centroid: number[];
      avgSeverity: number;
      memberCount: number;
    }>;
  }): Promise<void> {
    console.log('🚀 Deploying trained model for production...');
    
    try {
      // Create deployed model with enhanced risk assessment
      const deployedModel: DeployedModel = {
        modelId: trainedModel.modelId,
        version: '1.0.0',
        timestamp: new Date(),
        optimalK: trainedModel.metrics.optimalK,
        featureWeights: this.calculateFeatureWeights(),
        f1Score: trainedModel.validation.f1Score,
        accuracy: trainedModel.validation.accuracy,
        trainingSamples: trainedModel.metrics.trainingSamples,
        datasetSource: 'rural_healthcare_datasets',
        clusters: trainedModel.clusters.map(cluster => this.enhanceClusterForDeployment(cluster))
      };

      // Validate model before deployment
      const validation = await this.validateModelForDeployment(deployedModel);
      if (!validation.isValid) {
        throw new Error(`Model validation failed: ${validation.errors.join(', ')}`);
      }

      // Deploy the model
      this.deployedModel = deployedModel;
      await this.saveDeployedModel();
      
      console.log('✅ Model deployed successfully!');
      console.log(`📊 Model Performance: F1=${deployedModel.f1Score.toFixed(3)}, Accuracy=${deployedModel.accuracy.toFixed(3)}`);
      console.log(`🎯 Risk Clusters: ${deployedModel.clusters.length}`);
      
      // Log cluster information
      deployedModel.clusters.forEach(cluster => {
        console.log(`   Cluster ${cluster.clusterId}: ${cluster.riskLevel} risk (${cluster.memberCount} members)`);
      });

    } catch (error) {
      console.error('❌ Model deployment failed:', error);
      throw error;
    }
  }

  /**
   * Assess health risk using the deployed model
   */
  async assessHealthRisk(healthData: HealthDataInput): Promise<RiskAssessment> {
    if (!this.deployedModel) {
      throw new Error('No model deployed. Deploy a model first.');
    }

    console.log('🔍 Assessing health risk with deployed model...');

    try {
      // Extract features for risk assessment
      const features = this.extractFeaturesForRisk(healthData);
      
      // Find closest cluster
      const { clusterId, distance } = this.findClosestCluster(features);
      const primaryCluster = this.deployedModel.clusters[clusterId];
      
      // Calculate confidence based on distance to cluster centroid
      const confidence = Math.max(0.1, 1 - (distance / 10)); // Normalize distance to confidence
      
      // Calculate detailed risk scores
      const severityRisk = this.calculateSeverityRisk(healthData.severity);
      const lifestyleRisk = this.calculateLifestyleRisk(healthData);
      const symptomRisk = this.calculateSymptomRisk(healthData.symptoms);
      
      // Overall risk score (0-100)
      const riskScore = Math.round(
        (severityRisk * 0.4) + 
        (lifestyleRisk * 0.3) + 
        (symptomRisk * 0.3)
      );
      
      // Determine overall risk level
      const overallRisk = this.determineOverallRisk(riskScore, primaryCluster.riskLevel);
      
      // Generate recommendations
      const assessment: RiskAssessment = {
        overallRisk,
        confidence,
        primaryCluster: clusterId,
        riskScore,
        severityRisk,
        lifestyleRisk,
        symptomRisk,
        immediateActions: this.generateImmediateActions(overallRisk, healthData),
        preventativeActions: this.generatePreventativeActions(overallRisk, healthData),
        followUpRecommended: this.shouldRecommendFollowUp(overallRisk, riskScore),
        accessibilityFactors: this.assessAccessibilityFactors(healthData),
        seasonalConsiderations: this.getSeasonalConsiderations(healthData.timestamp)
      };

      // Store prediction for continuous learning
      this.predictionHistory.push({
        input: healthData,
        prediction: assessment,
        timestamp: new Date()
      });

      // Check if continuous learning should be triggered
      await this.checkContinuousLearning();

      console.log(`✅ Risk assessment completed: ${overallRisk} risk (${riskScore}/100, ${(confidence * 100).toFixed(1)}% confidence)`);
      
      return assessment;

    } catch (error) {
      console.error('❌ Risk assessment failed:', error);
      throw error;
    }
  }

  /**
   * Get current model information
   */
  getDeployedModelInfo(): {
    isDeployed: boolean;
    modelId?: string;
    version?: string;
    performance?: { f1Score: number; accuracy: number };
    deploymentDate?: Date;
    clusters?: number;
  } {
    if (!this.deployedModel) {
      return { isDeployed: false };
    }

    return {
      isDeployed: true,
      modelId: this.deployedModel.modelId,
      version: this.deployedModel.version,
      performance: {
        f1Score: this.deployedModel.f1Score,
        accuracy: this.deployedModel.accuracy
      },
      deploymentDate: this.deployedModel.timestamp,
      clusters: this.deployedModel.clusters.length
    };
  }

  /**
   * Update continuous learning configuration
   */
  updateLearningConfig(config: Partial<ContinuousLearningConfig>): void {
    this.learningConfig = { ...this.learningConfig, ...config };
    console.log('⚙️ Updated continuous learning config:', this.learningConfig);
  }

  /**
   * Get prediction statistics
   */
  getPredictionStats(): {
    totalPredictions: number;
    riskDistribution: { low: number; medium: number; high: number };
    averageConfidence: number;
    recentAccuracy?: number;
  } {
    const total = this.predictionHistory.length;
    
    if (total === 0) {
      return {
        totalPredictions: 0,
        riskDistribution: { low: 0, medium: 0, high: 0 },
        averageConfidence: 0
      };
    }

    const distribution = { low: 0, medium: 0, high: 0 };
    let confidenceSum = 0;

    this.predictionHistory.forEach(pred => {
      distribution[pred.prediction.overallRisk]++;
      confidenceSum += pred.prediction.confidence;
    });

    // Calculate recent accuracy if we have actual outcomes
    const recentPredictions = this.predictionHistory.slice(-50);
    const accuratePredictions = recentPredictions.filter(p => p.actualOutcome === p.prediction.overallRisk);
    const recentAccuracy = recentPredictions.length > 0 
      ? accuratePredictions.length / recentPredictions.length 
      : undefined;

    return {
      totalPredictions: total,
      riskDistribution: {
        low: Math.round((distribution.low / total) * 100),
        medium: Math.round((distribution.medium / total) * 100),
        high: Math.round((distribution.high / total) * 100)
      },
      averageConfidence: confidenceSum / total,
      recentAccuracy
    };
  }

  /**
   * Trigger manual model retraining
   */
  async triggerRetraining(): Promise<{ success: boolean; newModelId?: string; performance?: any }> {
    console.log('🔄 Triggering manual model retraining...');
    
    try {
      // Collect recent prediction data for retraining
      const recentData = this.predictionHistory.slice(-this.learningConfig.retrainingThreshold);
      
      if (recentData.length < 10) {
        throw new Error('Insufficient new data for retraining');
      }

      // Import training service for retraining
      const { default: MLTrainingService } = await import('./MLTrainingService');
      const trainingService = new MLTrainingService();

      // Create training data from recent predictions
      const trainingData = recentData.map(p => p.input);
      
      // Retrain model
      const newModel = await trainingService.trainModelWithData(trainingData, {
        testSplit: 0.2,
        maxK: this.deployedModel?.optimalK || 5,
        iterations: 300,
        convergenceThreshold: 1e-4
      });

      // Check if new model is better
      if (newModel.validation.f1Score > (this.deployedModel?.f1Score || 0)) {
        console.log('✅ New model performs better, deploying...');
        await this.deployModel(newModel);
        
        return {
          success: true,
          newModelId: newModel.modelId,
          performance: newModel.validation
        };
      } else {
        console.log('⚠️ New model does not improve performance, keeping current model');
        return { success: false };
      }

    } catch (error) {
      console.error('❌ Manual retraining failed:', error);
      return { success: false };
    }
  }

  // Private helper methods
  private async loadDeployedModel(): Promise<void> {
    try {
      if (!AsyncStorage) return;
      const modelData = await AsyncStorage.getItem('deployed_model');
      if (modelData) {
        this.deployedModel = JSON.parse(modelData);
        console.log('📥 Loaded deployed model:', this.deployedModel?.modelId);
      }
    } catch (error) {
      console.warn('Could not load deployed model:', error);
    }
  }

  private async saveDeployedModel(): Promise<void> {
    try {
      if (!AsyncStorage) return;
      await AsyncStorage.setItem('deployed_model', JSON.stringify(this.deployedModel));
    } catch (error) {
      console.error('Failed to save deployed model:', error);
    }
  }

  private calculateFeatureWeights(): number[] {
    // Default feature weights for rural healthcare
    return [
      0.35, // severity
      0.15, // sleep
      0.20, // stress
      0.10, // exercise
      0.20  // symptom_count
    ];
  }

  private enhanceClusterForDeployment(cluster: any): DeployedCluster {
    const riskLevel = cluster.avgSeverity <= 3 ? 'low' : 
                     cluster.avgSeverity <= 6 ? 'medium' : 'high';

    return {
      clusterId: cluster.clusterId,
      centroid: cluster.centroid,
      riskLevel,
      avgSeverity: cluster.avgSeverity,
      memberCount: cluster.memberCount,
      typicalSymptoms: this.getTypicalSymptomsForCluster(riskLevel),
      riskFactors: this.getRiskFactorsForCluster(riskLevel),
      recommendations: this.getRecommendationsForCluster(riskLevel)
    };
  }

  private async validateModelForDeployment(model: DeployedModel): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (model.f1Score < 0.70) {
      errors.push('Model F1 score below acceptable threshold (0.70)');
    }

    if (model.clusters.length < 2) {
      errors.push('Model must have at least 2 clusters');
    }

    if (model.trainingSamples < 20) {
      errors.push('Model trained on insufficient data (<20 samples)');
    }

    return { isValid: errors.length === 0, errors };
  }

  private extractFeaturesForRisk(healthData: HealthDataInput): number[] {
    return [
      healthData.severity,
      healthData.sleep,
      healthData.stress,
      healthData.exercise / 10, // Normalize
      healthData.symptoms.length
    ];
  }

  private findClosestCluster(features: number[]): { clusterId: number; distance: number } {
    if (!this.deployedModel) throw new Error('No deployed model');

    let minDistance = Infinity;
    let closestCluster = 0;

    this.deployedModel.clusters.forEach((cluster, index) => {
      const distance = Math.sqrt(
        features.reduce((sum, val, i) => sum + Math.pow(val - cluster.centroid[i], 2), 0)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestCluster = index;
      }
    });

    return { clusterId: closestCluster, distance: minDistance };
  }

  private calculateSeverityRisk(severity: number): number {
    return Math.min(100, (severity / 10) * 100);
  }

  private calculateLifestyleRisk(healthData: HealthDataInput): number {
    let risk = 0;
    
    // Sleep factor
    if (healthData.sleep < 6) risk += 30;
    else if (healthData.sleep < 7) risk += 15;
    
    // Stress factor
    if (healthData.stress >= 8) risk += 25;
    else if (healthData.stress >= 6) risk += 15;
    
    // Exercise factor
    if (healthData.exercise < 30) risk += 20;
    else if (healthData.exercise > 120) risk += 10;
    
    // Diet factor
    if (healthData.diet === 'poor') risk += 15;
    else if (healthData.diet === 'limited_access') risk += 10;
    
    return Math.min(100, risk);
  }

  private calculateSymptomRisk(symptoms: string[]): number {
    const highRiskSymptoms = ['chest pain', 'shortness of breath', 'severe headache', 'high fever'];
    const mediumRiskSymptoms = ['fever', 'cough', 'nausea', 'dizziness'];
    
    let risk = symptoms.length * 10; // Base risk from symptom count
    
    symptoms.forEach(symptom => {
      if (highRiskSymptoms.some(hrs => symptom.toLowerCase().includes(hrs))) {
        risk += 30;
      } else if (mediumRiskSymptoms.some(mrs => symptom.toLowerCase().includes(mrs))) {
        risk += 15;
      }
    });
    
    return Math.min(100, risk);
  }

  private determineOverallRisk(riskScore: number, clusterRisk: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
    // Combine calculated risk score with cluster-based risk
    if (riskScore >= 70 || clusterRisk === 'high') return 'high';
    if (riskScore >= 40 || clusterRisk === 'medium') return 'medium';
    return 'low';
  }

  private generateImmediateActions(riskLevel: 'low' | 'medium' | 'high', healthData: HealthDataInput): string[] {
    const actions: string[] = [];

    if (riskLevel === 'high') {
      actions.push('Seek immediate medical attention');
      if (healthData.symptoms.some(s => s.includes('chest') || s.includes('breath'))) {
        actions.push('Call emergency services if symptoms worsen');
      }
      actions.push('Monitor symptoms closely');
    } else if (riskLevel === 'medium') {
      actions.push('Schedule appointment with healthcare provider');
      actions.push('Monitor symptoms for changes');
      if (healthData.stress >= 7) {
        actions.push('Practice stress reduction techniques');
      }
    } else {
      actions.push('Continue current health practices');
      if (healthData.sleep < 7) {
        actions.push('Prioritize adequate sleep (7-9 hours)');
      }
    }

    return actions;
  }

  private generatePreventativeActions(riskLevel: 'low' | 'medium' | 'high', healthData: HealthDataInput): string[] {
    const actions: string[] = [];

    // Universal preventative actions
    actions.push('Maintain regular exercise routine');
    actions.push('Eat a balanced diet with plenty of fruits and vegetables');
    actions.push('Stay hydrated');

    // Risk-specific actions
    if (riskLevel === 'high' || riskLevel === 'medium') {
      actions.push('Schedule regular health checkups');
      actions.push('Monitor blood pressure regularly');
    }

    // Lifestyle-specific actions
    if (healthData.stress >= 6) {
      actions.push('Practice stress management techniques');
    }
    
    if (healthData.exercise < 150) {
      actions.push('Gradually increase physical activity');
    }

    return actions;
  }

  private shouldRecommendFollowUp(riskLevel: 'low' | 'medium' | 'high', riskScore: number): boolean {
    return riskLevel === 'high' || (riskLevel === 'medium' && riskScore >= 60);
  }

  private assessAccessibilityFactors(healthData: HealthDataInput): string[] {
    const factors: string[] = [];
    
    // Rural-specific accessibility considerations
    factors.push('Distance to nearest healthcare facility');
    
    if (healthData.notes?.toLowerCase().includes('transport')) {
      factors.push('Transportation challenges identified');
    }
    
    factors.push('Consider telemedicine options');
    factors.push('Local community health worker availability');
    
    return factors;
  }

  private getSeasonalConsiderations(timestamp: Date): string[] {
    const month = timestamp.getMonth();
    const considerations: string[] = [];
    
    // Seasonal health considerations
    if (month >= 2 && month <= 4) { // Spring
      considerations.push('Allergy season - monitor respiratory symptoms');
    } else if (month >= 5 && month <= 7) { // Summer  
      considerations.push('Heat-related illness risk - stay hydrated');
      considerations.push('Increased outdoor activity opportunities');
    } else if (month >= 8 && month <= 10) { // Fall
      considerations.push('Flu season approaching - consider vaccination');
    } else { // Winter
      considerations.push('Cold weather precautions');
      considerations.push('Vitamin D deficiency risk');
    }
    
    return considerations;
  }

  private getTypicalSymptomsForCluster(riskLevel: 'low' | 'medium' | 'high'): string[] {
    const symptoms: { [key: string]: string[] } = {
      low: ['mild fatigue', 'occasional headache', 'minor stress'],
      medium: ['persistent fatigue', 'frequent headaches', 'sleep issues', 'moderate stress'],
      high: ['severe fatigue', 'chronic pain', 'breathing difficulties', 'high stress']
    };
    
    return symptoms[riskLevel] || [];
  }

  private getRiskFactorsForCluster(riskLevel: 'low' | 'medium' | 'high'): string[] {
    const factors: { [key: string]: string[] } = {
      low: ['sedentary lifestyle', 'poor sleep habits'],
      medium: ['chronic stress', 'irregular exercise', 'dietary issues'],
      high: ['multiple chronic conditions', 'severe lifestyle factors', 'access barriers']
    };
    
    return factors[riskLevel] || [];
  }

  private getRecommendationsForCluster(riskLevel: 'low' | 'medium' | 'high'): string[] {
    const recommendations: { [key: string]: string[] } = {
      low: ['Maintain healthy lifestyle', 'Regular checkups'],
      medium: ['Increase medical monitoring', 'Lifestyle modifications', 'Stress management'],
      high: ['Immediate medical attention', 'Comprehensive care plan', 'Emergency preparedness']
    };
    
    return recommendations[riskLevel] || [];
  }

  private async checkContinuousLearning(): Promise<void> {
    if (this.predictionHistory.length >= this.learningConfig.retrainingThreshold) {
      console.log('🔄 Continuous learning threshold reached, considering retraining...');
      
      if (this.learningConfig.autoDeployment) {
        await this.triggerRetraining();
      } else {
        console.log('💡 Manual retraining recommended - call triggerRetraining()');
      }
    }
  }
}

export default ModelDeploymentService;
