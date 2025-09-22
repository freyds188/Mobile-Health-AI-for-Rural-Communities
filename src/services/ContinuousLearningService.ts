import MLTrainingService from './MLTrainingService';
import ModelDeploymentService from './ModelDeploymentService';
import { modelMonitoringService } from './ModelMonitoringService';

export interface ContinuousLearningPolicy {
  minSamples: number;
  maxFrequencyHours: number;
  acceptIfF1ImprovesBy: number; // minimal improvement to accept
}

export class ContinuousLearningService {
  private lastRunAt: number = 0;
  private policy: ContinuousLearningPolicy = {
    minSamples: 50,
    maxFrequencyHours: 24,
    acceptIfF1ImprovesBy: 0.005
  };

  async maybeRetrainAndDeploy(): Promise<{ attempted: boolean; deployed?: boolean; reason?: string }> {
    const now = Date.now();
    if (now - this.lastRunAt < this.policy.maxFrequencyHours * 3600 * 1000) {
      return { attempted: false, reason: 'frequency_limit' };
    }
    this.lastRunAt = now;

    try {
      const training = new MLTrainingService();
      const stats = await training.getTrainingDataStats();
      if (stats.totalAvailable < this.policy.minSamples) {
        return { attempted: false, reason: 'insufficient_samples' };
      }

      const result = await training.trainHybridModel();
      const currentF1 = result.validation.f1Score;

      const recent = await modelMonitoringService.getRecentPerformance();
      const baseline = recent.length > 0 ? recent[recent.length - 1] : undefined;
      const baselineF1 = baseline?.f1Score ?? 0;

      if (currentF1 > baselineF1 + this.policy.acceptIfF1ImprovesBy) {
        const deployer = new ModelDeploymentService();
        await deployer.deployModel(result);
        await modelMonitoringService.recordPerformance({ modelId: result.modelId, timestamp: new Date().toISOString(), f1Score: result.validation.f1Score, accuracy: result.validation.accuracy });
        return { attempted: true, deployed: true };
      } else {
        await modelMonitoringService.recordPerformance({ modelId: result.modelId, timestamp: new Date().toISOString(), f1Score: result.validation.f1Score, accuracy: result.validation.accuracy });
        return { attempted: true, deployed: false, reason: 'no_improvement' };
      }
    } catch (e) {
      return { attempted: true, deployed: false, reason: 'error' };
    }
  }
}

export const continuousLearningService = new ContinuousLearningService();


