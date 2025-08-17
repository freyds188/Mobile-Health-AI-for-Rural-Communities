import { databaseService } from './DatabaseService';
import { v4 as uuidv4 } from 'uuid';

export interface UserFeedback {
  id: string;
  userId: string;
  timestamp: string;
  usability: number; // 1-5 scale
  functionalSuitability: number; // 1-5 scale
  reliability: number; // 1-5 scale
  comments: string;
  sessionDuration: number; // in minutes
  featuresUsed: string[];
  issuesEncountered: string[];
  suggestions: string[];
}

export interface ITExpertEvaluation {
  id: string;
  evaluatorId: string;
  timestamp: string;
  functionalSuitability: number; // 1-5 scale
  performanceEfficiency: number; // 1-5 scale
  reliability: number; // 1-5 scale
  usability: number; // 1-5 scale
  maintainability: number; // 1-5 scale
  technicalComments: string;
  performanceMetrics: {
    responseTime: number; // in milliseconds
    accuracy: number; // percentage
    uptime: number; // percentage
    errorRate: number; // percentage
  };
  recommendations: string[];
}

export interface SystemMetrics {
  id: string;
  timestamp: string;
  responseTime: number; // in milliseconds
  accuracy: number; // percentage
  uptime: number; // percentage
  errorRate: number; // percentage
  activeUsers: number;
  totalAssessments: number;
  averageSessionDuration: number; // in minutes
}

export class EvaluationService {
  private metrics: SystemMetrics[] = [];

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Initialize with baseline metrics
    this.metrics = [
      {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        responseTime: 500, // 500ms baseline
        accuracy: 85, // 85% baseline
        uptime: 99.5, // 99.5% baseline
        errorRate: 0.5, // 0.5% baseline
        activeUsers: 0,
        totalAssessments: 0,
        averageSessionDuration: 0
      }
    ];
  }

  // User Evaluation Methods
  async submitUserFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): Promise<string> {
    try {
      const feedbackId = uuidv4();
      const userFeedback: UserFeedback = {
        ...feedback,
        id: feedbackId,
        timestamp: new Date().toISOString()
      };

      // Save to database
      await this.saveUserFeedback(userFeedback);
      
      // Update system metrics
      this.updateMetricsFromUserFeedback(userFeedback);
      
      console.log('✅ EvaluationService: User feedback submitted successfully');
      return feedbackId;
    } catch (error) {
      console.error('❌ EvaluationService: Failed to submit user feedback:', error);
      throw error;
    }
  }

  async getUserFeedback(userId: string): Promise<UserFeedback[]> {
    try {
      // This would typically fetch from database
      // For now, return mock data
      return [];
    } catch (error) {
      console.error('❌ EvaluationService: Failed to get user feedback:', error);
      return [];
    }
  }

  async getAverageUserScores(): Promise<{
    usability: number;
    functionalSuitability: number;
    reliability: number;
    totalResponses: number;
  }> {
    try {
      // This would calculate averages from database
      // For now, return mock data
      return {
        usability: 4.2,
        functionalSuitability: 4.0,
        reliability: 4.3,
        totalResponses: 25
      };
    } catch (error) {
      console.error('❌ EvaluationService: Failed to get average user scores:', error);
      return {
        usability: 0,
        functionalSuitability: 0,
        reliability: 0,
        totalResponses: 0
      };
    }
  }

  // IT Expert Evaluation Methods
  async submitITExpertEvaluation(evaluation: Omit<ITExpertEvaluation, 'id' | 'timestamp'>): Promise<string> {
    try {
      const evaluationId = uuidv4();
      const itEvaluation: ITExpertEvaluation = {
        ...evaluation,
        id: evaluationId,
        timestamp: new Date().toISOString()
      };

      // Save to database
      await this.saveITExpertEvaluation(itEvaluation);
      
      // Update system metrics
      this.updateMetricsFromITEvaluation(itEvaluation);
      
      console.log('✅ EvaluationService: IT expert evaluation submitted successfully');
      return evaluationId;
    } catch (error) {
      console.error('❌ EvaluationService: Failed to submit IT expert evaluation:', error);
      throw error;
    }
  }

  async getITExpertEvaluations(): Promise<ITExpertEvaluation[]> {
    try {
      // This would typically fetch from database
      // For now, return mock data
      return [];
    } catch (error) {
      console.error('❌ EvaluationService: Failed to get IT expert evaluations:', error);
      return [];
    }
  }

  async getAverageITScores(): Promise<{
    functionalSuitability: number;
    performanceEfficiency: number;
    reliability: number;
    usability: number;
    maintainability: number;
    totalEvaluations: number;
  }> {
    try {
      // This would calculate averages from database
      // For now, return mock data
      return {
        functionalSuitability: 4.1,
        performanceEfficiency: 4.3,
        reliability: 4.2,
        usability: 4.0,
        maintainability: 4.4,
        totalEvaluations: 5
      };
    } catch (error) {
      console.error('❌ EvaluationService: Failed to get average IT scores:', error);
      return {
        functionalSuitability: 0,
        performanceEfficiency: 0,
        reliability: 0,
        usability: 0,
        maintainability: 0,
        totalEvaluations: 0
      };
    }
  }

  // System Performance Monitoring
  async recordSystemMetrics(metrics: Omit<SystemMetrics, 'id' | 'timestamp'>): Promise<void> {
    try {
      const systemMetrics: SystemMetrics = {
        ...metrics,
        id: uuidv4(),
        timestamp: new Date().toISOString()
      };

      this.metrics.push(systemMetrics);
      
      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      console.log('✅ EvaluationService: System metrics recorded');
    } catch (error) {
      console.error('❌ EvaluationService: Failed to record system metrics:', error);
    }
  }

  async getSystemMetrics(limit: number = 10): Promise<SystemMetrics[]> {
    try {
      return this.metrics.slice(-limit);
    } catch (error) {
      console.error('❌ EvaluationService: Failed to get system metrics:', error);
      return [];
    }
  }

  async getAverageSystemMetrics(): Promise<{
    responseTime: number;
    accuracy: number;
    uptime: number;
    errorRate: number;
  }> {
    try {
      if (this.metrics.length === 0) {
        return {
          responseTime: 0,
          accuracy: 0,
          uptime: 0,
          errorRate: 0
        };
      }

      const total = this.metrics.reduce((acc, metric) => ({
        responseTime: acc.responseTime + metric.responseTime,
        accuracy: acc.accuracy + metric.accuracy,
        uptime: acc.uptime + metric.uptime,
        errorRate: acc.errorRate + metric.errorRate
      }), { responseTime: 0, accuracy: 0, uptime: 0, errorRate: 0 });

      const count = this.metrics.length;
      return {
        responseTime: total.responseTime / count,
        accuracy: total.accuracy / count,
        uptime: total.uptime / count,
        errorRate: total.errorRate / count
      };
    } catch (error) {
      console.error('❌ EvaluationService: Failed to get average system metrics:', error);
      return {
        responseTime: 0,
        accuracy: 0,
        uptime: 0,
        errorRate: 0
      };
    }
  }

  // Performance Analysis Methods
  async analyzePerformanceTrends(): Promise<{
    trend: 'improving' | 'stable' | 'declining';
    responseTimeTrend: 'improving' | 'stable' | 'declining';
    accuracyTrend: 'improving' | 'stable' | 'declining';
    recommendations: string[];
  }> {
    try {
      const recentMetrics = this.metrics.slice(-10);
      if (recentMetrics.length < 5) {
        return {
          trend: 'stable',
          responseTimeTrend: 'stable',
          accuracyTrend: 'stable',
          recommendations: ['Insufficient data for trend analysis']
        };
      }

      const firstHalf = recentMetrics.slice(0, Math.floor(recentMetrics.length / 2));
      const secondHalf = recentMetrics.slice(Math.floor(recentMetrics.length / 2));

      const firstAvg = this.calculateAverageMetrics(firstHalf);
      const secondAvg = this.calculateAverageMetrics(secondHalf);

      const responseTimeTrend = this.determineTrend(firstAvg.responseTime, secondAvg.responseTime, true);
      const accuracyTrend = this.determineTrend(firstAvg.accuracy, secondAvg.accuracy, false);

      const recommendations = this.generatePerformanceRecommendations(responseTimeTrend, accuracyTrend);

      return {
        trend: responseTimeTrend === 'improving' && accuracyTrend === 'improving' ? 'improving' :
               responseTimeTrend === 'declining' || accuracyTrend === 'declining' ? 'declining' : 'stable',
        responseTimeTrend,
        accuracyTrend,
        recommendations
      };
    } catch (error) {
      console.error('❌ EvaluationService: Failed to analyze performance trends:', error);
      return {
        trend: 'stable',
        responseTimeTrend: 'stable',
        accuracyTrend: 'stable',
        recommendations: ['Error analyzing trends']
      };
    }
  }

  // Helper Methods
  private async saveUserFeedback(feedback: UserFeedback): Promise<void> {
    // This would save to database
    // For now, just log
    console.log('💾 EvaluationService: Saving user feedback:', feedback.id);
  }

  private async saveITExpertEvaluation(evaluation: ITExpertEvaluation): Promise<void> {
    // This would save to database
    // For now, just log
    console.log('💾 EvaluationService: Saving IT expert evaluation:', evaluation.id);
  }

  private updateMetricsFromUserFeedback(feedback: UserFeedback): void {
    // Update metrics based on user feedback
    const currentMetrics = this.metrics[this.metrics.length - 1];
    if (currentMetrics) {
      currentMetrics.activeUsers += 1;
      currentMetrics.averageSessionDuration = 
        (currentMetrics.averageSessionDuration + feedback.sessionDuration) / 2;
    }
  }

  private updateMetricsFromITEvaluation(evaluation: ITExpertEvaluation): void {
    // Update metrics based on IT expert evaluation
    const currentMetrics = this.metrics[this.metrics.length - 1];
    if (currentMetrics) {
      currentMetrics.responseTime = evaluation.performanceMetrics.responseTime;
      currentMetrics.accuracy = evaluation.performanceMetrics.accuracy;
      currentMetrics.uptime = evaluation.performanceMetrics.uptime;
      currentMetrics.errorRate = evaluation.performanceMetrics.errorRate;
    }
  }

  private calculateAverageMetrics(metrics: SystemMetrics[]): {
    responseTime: number;
    accuracy: number;
    uptime: number;
    errorRate: number;
  } {
    const total = metrics.reduce((acc, metric) => ({
      responseTime: acc.responseTime + metric.responseTime,
      accuracy: acc.accuracy + metric.accuracy,
      uptime: acc.uptime + metric.uptime,
      errorRate: acc.errorRate + metric.errorRate
    }), { responseTime: 0, accuracy: 0, uptime: 0, errorRate: 0 });

    const count = metrics.length;
    return {
      responseTime: total.responseTime / count,
      accuracy: total.accuracy / count,
      uptime: total.uptime / count,
      errorRate: total.errorRate / count
    };
  }

  private determineTrend(first: number, second: number, lowerIsBetter: boolean): 'improving' | 'stable' | 'declining' {
    const change = ((second - first) / first) * 100;
    const threshold = 5; // 5% change threshold

    if (lowerIsBetter) {
      return change < -threshold ? 'improving' : change > threshold ? 'declining' : 'stable';
    } else {
      return change > threshold ? 'improving' : change < -threshold ? 'declining' : 'stable';
    }
  }

  private generatePerformanceRecommendations(
    responseTimeTrend: 'improving' | 'stable' | 'declining',
    accuracyTrend: 'improving' | 'stable' | 'declining'
  ): string[] {
    const recommendations: string[] = [];

    if (responseTimeTrend === 'declining') {
      recommendations.push('Consider optimizing database queries and caching strategies');
      recommendations.push('Review server resources and scaling options');
    }

    if (accuracyTrend === 'declining') {
      recommendations.push('Review and retrain machine learning models');
      recommendations.push('Analyze recent data quality and preprocessing steps');
    }

    if (responseTimeTrend === 'improving' && accuracyTrend === 'improving') {
      recommendations.push('System performance is improving - continue current optimizations');
    }

    if (recommendations.length === 0) {
      recommendations.push('System performance is stable - continue monitoring');
    }

    return recommendations;
  }
}

export const evaluationService = new EvaluationService();
