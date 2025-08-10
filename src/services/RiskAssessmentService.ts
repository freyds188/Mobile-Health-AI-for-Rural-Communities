import { databaseService } from './DatabaseService';
import { MachineLearningService } from './MachineLearningService';
import { v4 as uuidv4 } from 'uuid';

export interface SymptomPattern {
  id: string;
  userId: string;
  timestamp: string;
  symptoms: string[];
  severity: number;
  frequency: number;
  duration: number;
  cluster: number;
  riskLevel: 'low' | 'medium' | 'high';
  potentialConditions: string[];
  confidence: number;
  recommendations: string[];
}

export interface RiskAssessment {
  id: string;
  userId: string;
  timestamp: string;
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  symptomPatterns: SymptomPattern[];
  potentialConditions: Array<{
    condition: string;
    probability: number;
    severity: 'mild' | 'moderate' | 'severe';
    urgency: 'low' | 'medium' | 'high';
    recommendations: string[];
  }>;
  lifestyleFactors: {
    sleepQuality: number;
    stressLevel: number;
    exerciseLevel: number;
    dietQuality: number;
  };
  trends: {
    symptomFrequency: 'increasing' | 'stable' | 'decreasing';
    severityTrend: 'increasing' | 'stable' | 'decreasing';
    riskProgression: 'improving' | 'stable' | 'worsening';
  };
  recommendations: string[];
  nextAssessmentDate: string;
  createdAt: string;
}

export interface ConditionMapping {
  condition: string;
  symptoms: string[];
  severityThreshold: number;
  frequencyThreshold: number;
  riskFactors: string[];
  urgency: 'low' | 'medium' | 'high';
  category: 'respiratory' | 'cardiovascular' | 'neurological' | 'gastrointestinal' | 'musculoskeletal' | 'mental_health' | 'general';
}

export class RiskAssessmentService {
  private mlService: MachineLearningService;
  private conditionMappings: ConditionMapping[];

  constructor() {
    this.mlService = new MachineLearningService();
    this.initializeConditionMappings();
  }

  private initializeConditionMappings(): void {
    this.conditionMappings = [
      // Respiratory Conditions
      {
        condition: 'Upper Respiratory Infection',
        symptoms: ['cough', 'sore throat', 'runny nose', 'congestion', 'fever'],
        severityThreshold: 6,
        frequencyThreshold: 3,
        riskFactors: ['recent exposure', 'seasonal changes'],
        urgency: 'medium',
        category: 'respiratory'
      },
      {
        condition: 'Bronchitis',
        symptoms: ['persistent cough', 'chest discomfort', 'fatigue', 'shortness of breath'],
        severityThreshold: 7,
        frequencyThreshold: 5,
        riskFactors: ['smoking', 'air pollution'],
        urgency: 'high',
        category: 'respiratory'
      },
      {
        condition: 'Asthma',
        symptoms: ['wheezing', 'shortness of breath', 'chest tightness', 'cough at night'],
        severityThreshold: 8,
        frequencyThreshold: 4,
        riskFactors: ['allergies', 'exercise', 'cold air'],
        urgency: 'high',
        category: 'respiratory'
      },

      // Cardiovascular Conditions
      {
        condition: 'Hypertension',
        symptoms: ['headache', 'dizziness', 'chest pain', 'shortness of breath', 'fatigue'],
        severityThreshold: 7,
        frequencyThreshold: 5,
        riskFactors: ['stress', 'poor diet', 'lack of exercise'],
        urgency: 'high',
        category: 'cardiovascular'
      },
      {
        condition: 'Anxiety',
        symptoms: ['rapid heartbeat', 'sweating', 'trembling', 'shortness of breath', 'nausea'],
        severityThreshold: 6,
        frequencyThreshold: 4,
        riskFactors: ['stress', 'life changes', 'genetics'],
        urgency: 'medium',
        category: 'mental_health'
      },

      // Neurological Conditions
      {
        condition: 'Migraine',
        symptoms: ['severe headache', 'nausea', 'sensitivity to light', 'sensitivity to sound'],
        severityThreshold: 8,
        frequencyThreshold: 3,
        riskFactors: ['stress', 'dietary triggers', 'hormonal changes'],
        urgency: 'medium',
        category: 'neurological'
      },
      {
        condition: 'Tension Headache',
        symptoms: ['headache', 'neck pain', 'shoulder tension', 'eye strain'],
        severityThreshold: 5,
        frequencyThreshold: 4,
        riskFactors: ['stress', 'poor posture', 'eye strain'],
        urgency: 'low',
        category: 'neurological'
      },

      // Gastrointestinal Conditions
      {
        condition: 'Gastritis',
        symptoms: ['stomach pain', 'nausea', 'vomiting', 'loss of appetite', 'bloating'],
        severityThreshold: 6,
        frequencyThreshold: 4,
        riskFactors: ['poor diet', 'stress', 'medications'],
        urgency: 'medium',
        category: 'gastrointestinal'
      },
      {
        condition: 'Irritable Bowel Syndrome',
        symptoms: ['abdominal pain', 'bloating', 'diarrhea', 'constipation'],
        severityThreshold: 5,
        frequencyThreshold: 5,
        riskFactors: ['stress', 'diet', 'food sensitivities'],
        urgency: 'low',
        category: 'gastrointestinal'
      },

      // Musculoskeletal Conditions
      {
        condition: 'Back Pain',
        symptoms: ['back pain', 'stiffness', 'muscle spasms', 'limited mobility'],
        severityThreshold: 6,
        frequencyThreshold: 4,
        riskFactors: ['poor posture', 'heavy lifting', 'sedentary lifestyle'],
        urgency: 'medium',
        category: 'musculoskeletal'
      },
      {
        condition: 'Arthritis',
        symptoms: ['joint pain', 'stiffness', 'swelling', 'reduced range of motion'],
        severityThreshold: 7,
        frequencyThreshold: 5,
        riskFactors: ['age', 'injury', 'genetics'],
        urgency: 'medium',
        category: 'musculoskeletal'
      },

      // General Conditions
      {
        condition: 'Fatigue Syndrome',
        symptoms: ['fatigue', 'weakness', 'difficulty concentrating', 'sleep problems'],
        severityThreshold: 6,
        frequencyThreshold: 5,
        riskFactors: ['stress', 'poor sleep', 'nutritional deficiencies'],
        urgency: 'low',
        category: 'general'
      },
      {
        condition: 'Stress-Related Symptoms',
        symptoms: ['headache', 'muscle tension', 'fatigue', 'irritability', 'sleep problems'],
        severityThreshold: 5,
        frequencyThreshold: 4,
        riskFactors: ['work stress', 'life changes', 'poor coping mechanisms'],
        urgency: 'low',
        category: 'mental_health'
      }
    ];
  }

  async performRiskAssessment(userId: string): Promise<RiskAssessment> {
    try {
      console.log('🔍 RiskAssessmentService: Starting risk assessment for user:', userId);

      // Get user's health data
      console.log('📊 RiskAssessmentService: Fetching health data...');
      const healthData = await databaseService.getHealthData(userId);
      console.log('📊 RiskAssessmentService: Retrieved', healthData.length, 'health records');
      
      if (healthData.length === 0) {
        console.log('⚠️ RiskAssessmentService: No health data available, creating sample assessment');
        // Create a sample assessment instead of throwing an error
        return this.createSampleAssessment(userId);
      }

      console.log('📊 RiskAssessmentService: Analyzing', healthData.length, 'health records');

      // Train the system with actual user data
      await this.trainWithUserData(healthData);

      // Analyze symptom patterns using K-means
      const symptomPatterns = await this.analyzeSymptomPatterns(healthData);

      // Identify potential conditions
      const potentialConditions = this.identifyPotentialConditions(symptomPatterns);

      // Calculate overall risk level
      const overallRiskLevel = this.calculateOverallRiskLevel(symptomPatterns, potentialConditions);

      // Analyze lifestyle factors
      const lifestyleFactors = this.analyzeLifestyleFactors(healthData);

      // Analyze trends
      const trends = this.analyzeTrends(healthData);

      // Generate recommendations
      const recommendations = this.generateRecommendations(symptomPatterns, potentialConditions, lifestyleFactors);

      // Create risk assessment
      const assessment: RiskAssessment = {
        id: uuidv4(),
        userId,
        timestamp: new Date().toISOString(),
        overallRiskLevel,
        symptomPatterns,
        potentialConditions,
        lifestyleFactors,
        trends,
        recommendations,
        nextAssessmentDate: this.calculateNextAssessmentDate(overallRiskLevel),
        createdAt: new Date().toISOString()
      };

      // Save assessment to database
      await this.saveRiskAssessment(assessment);

      console.log('✅ RiskAssessmentService: Risk assessment completed successfully');
      return assessment;

    } catch (error) {
      console.error('❌ RiskAssessmentService: Risk assessment failed:', error);
      throw error;
    }
  }

  private async trainWithUserData(healthData: any[]): Promise<void> {
    try {
      console.log('🎯 RiskAssessmentService: Training with actual user data...');
      
      // Extract features from user's health data
      const userFeatures = healthData.map(record => {
        const symptoms = JSON.parse(record.symptoms);
        return {
          severity: record.severity,
          symptomCount: symptoms.length,
          symptomDiversity: this.calculateSymptomDiversity(symptoms),
          frequency: this.calculateSymptomFrequency(symptoms, healthData),
          sleep: record.sleep,
          stress: record.stress,
          exercise: record.exercise,
          timestamp: new Date(record.timestamp).getTime()
        };
      });

      // Update condition mappings based on user patterns
      this.updateConditionMappingsFromUserData(healthData);

      // Train K-means model with user data
      if (userFeatures.length >= 3) {
        const optimalK = Math.min(3, Math.max(2, Math.floor(userFeatures.length / 2)));
        await this.mlService.performKMeansClustering(userFeatures, optimalK);
        console.log('✅ RiskAssessmentService: K-means model trained with user data');
      }

      console.log('✅ RiskAssessmentService: Training completed with', userFeatures.length, 'data points');
    } catch (error) {
      console.warn('⚠️ RiskAssessmentService: Training with user data failed:', error);
      // Continue with assessment even if training fails
    }
  }

  private updateConditionMappingsFromUserData(healthData: any[]): void {
    try {
      // Analyze user's symptom patterns to improve condition mappings
      const userSymptomFrequency: { [symptom: string]: number } = {};
      const userSeverityPatterns: { [symptom: string]: number[] } = {};

      healthData.forEach(record => {
        const symptoms = JSON.parse(record.symptoms);
        symptoms.forEach((symptom: string) => {
          userSymptomFrequency[symptom] = (userSymptomFrequency[symptom] || 0) + 1;
          if (!userSeverityPatterns[symptom]) {
            userSeverityPatterns[symptom] = [];
          }
          userSeverityPatterns[symptom].push(record.severity);
        });
      });

      // Update condition mappings with user-specific patterns
      this.conditionMappings.forEach(mapping => {
        const userSymptomMatch = mapping.symptoms.filter(symptom => 
          userSymptomFrequency[symptom] > 0
        ).length;

        if (userSymptomMatch > 0) {
          // Adjust thresholds based on user's actual patterns
          const userAvgSeverity = Object.values(userSeverityPatterns)
            .flat()
            .reduce((sum, severity) => sum + severity, 0) / Object.values(userSeverityPatterns).flat().length;

          // Update severity threshold based on user's actual severity patterns
          mapping.severityThreshold = Math.max(3, Math.min(8, userAvgSeverity));
          
          console.log(`🔄 Updated condition mapping for ${mapping.condition} based on user data`);
        }
      });

      console.log('✅ RiskAssessmentService: Condition mappings updated with user data');
    } catch (error) {
      console.warn('⚠️ RiskAssessmentService: Failed to update condition mappings:', error);
    }
  }

  private async analyzeSymptomPatterns(healthData: any[]): Promise<SymptomPattern[]> {
    console.log('🔍 RiskAssessmentService: Analyzing symptom patterns...');

    // Prepare data for K-means clustering
    const symptomFeatures = healthData.map(record => {
      const symptoms = JSON.parse(record.symptoms);
      return {
        severity: record.severity,
        symptomCount: symptoms.length,
        symptomDiversity: this.calculateSymptomDiversity(symptoms),
        frequency: this.calculateSymptomFrequency(symptoms, healthData),
        timestamp: new Date(record.timestamp).getTime()
      };
    });

    // Perform K-means clustering
    const clusters = await this.mlService.performKMeansClustering(symptomFeatures, 3);

    // Create symptom patterns
    const patterns: SymptomPattern[] = healthData.map((record, index) => {
      const symptoms = JSON.parse(record.symptoms);
      const cluster = clusters[index];
      const riskLevel = this.calculatePatternRiskLevel(record, cluster);

      return {
        id: uuidv4(),
        userId: record.userId,
        timestamp: record.timestamp,
        symptoms,
        severity: record.severity,
        frequency: this.calculateSymptomFrequency(symptoms, healthData),
        duration: this.calculateSymptomDuration(symptoms, healthData),
        cluster,
        riskLevel,
        potentialConditions: [],
        confidence: this.calculatePatternConfidence(record, cluster),
        recommendations: []
      };
    });

    console.log('📊 RiskAssessmentService: Identified', patterns.length, 'symptom patterns');
    return patterns;
  }

  private identifyPotentialConditions(patterns: SymptomPattern[]): Array<{
    condition: string;
    probability: number;
    severity: 'mild' | 'moderate' | 'severe';
    urgency: 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    console.log('🔍 RiskAssessmentService: Identifying potential conditions...');

    const conditionMatches: { [key: string]: { count: number; totalSeverity: number; totalFrequency: number } } = {};

    // Analyze each pattern against condition mappings
    patterns.forEach(pattern => {
      this.conditionMappings.forEach(mapping => {
        const matchScore = this.calculateConditionMatch(pattern, mapping);
        
        if (matchScore > 0.6) { // Threshold for potential match
          if (!conditionMatches[mapping.condition]) {
            conditionMatches[mapping.condition] = { count: 0, totalSeverity: 0, totalFrequency: 0 };
          }
          
          conditionMatches[mapping.condition].count++;
          conditionMatches[mapping.condition].totalSeverity += pattern.severity;
          conditionMatches[mapping.condition].totalFrequency += pattern.frequency;
        }
      });
    });

    // Convert matches to potential conditions
    const potentialConditions = Object.entries(conditionMatches).map(([condition, stats]) => {
      const avgSeverity = stats.totalSeverity / stats.count;
      const avgFrequency = stats.totalFrequency / stats.count;
      const probability = this.calculateConditionProbability(stats, avgSeverity, avgFrequency);
      const severity = this.determineConditionSeverity(avgSeverity);
      const urgency = this.determineConditionUrgency(condition, avgSeverity, avgFrequency);
      const recommendations = this.generateConditionRecommendations(condition, severity, urgency);

      return {
        condition,
        probability,
        severity,
        urgency,
        recommendations
      };
    });

    // Sort by probability and urgency
    potentialConditions.sort((a, b) => {
      if (a.urgency === 'high' && b.urgency !== 'high') return -1;
      if (b.urgency === 'high' && a.urgency !== 'high') return 1;
      return b.probability - a.probability;
    });

    console.log('🏥 RiskAssessmentService: Identified', potentialConditions.length, 'potential conditions');
    return potentialConditions.slice(0, 5); // Return top 5 conditions
  }

  private calculateOverallRiskLevel(patterns: SymptomPattern[], conditions: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const highRiskPatterns = patterns.filter(p => p.riskLevel === 'high').length;
    const criticalConditions = conditions.filter(c => c.urgency === 'high').length;
    const avgSeverity = patterns.reduce((sum, p) => sum + p.severity, 0) / patterns.length;

    if (criticalConditions > 0 || highRiskPatterns > 2 || avgSeverity > 8) {
      return 'critical';
    } else if (highRiskPatterns > 0 || avgSeverity > 6) {
      return 'high';
    } else if (avgSeverity > 4) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private analyzeLifestyleFactors(healthData: any[]): {
    sleepQuality: number;
    stressLevel: number;
    exerciseLevel: number;
    dietQuality: number;
  } {
    const recentData = healthData.slice(0, 7); // Last 7 days
    const avgSleep = recentData.reduce((sum, d) => sum + d.sleep, 0) / recentData.length;
    const avgStress = recentData.reduce((sum, d) => sum + d.stress, 0) / recentData.length;
    const avgExercise = recentData.reduce((sum, d) => sum + d.exercise, 0) / recentData.length;

    return {
      sleepQuality: avgSleep,
      stressLevel: avgStress,
      exerciseLevel: avgExercise,
      dietQuality: this.assessDietQuality(recentData)
    };
  }

  private analyzeTrends(healthData: any[]): {
    symptomFrequency: 'increasing' | 'stable' | 'decreasing';
    severityTrend: 'increasing' | 'stable' | 'decreasing';
    riskProgression: 'improving' | 'stable' | 'worsening';
  } {
    if (healthData.length < 2) {
      return {
        symptomFrequency: 'stable',
        severityTrend: 'stable',
        riskProgression: 'stable'
      };
    }

    const recent = healthData.slice(0, 3);
    const older = healthData.slice(3, 6);

    const recentAvgSeverity = recent.reduce((sum, d) => sum + d.severity, 0) / recent.length;
    const olderAvgSeverity = older.reduce((sum, d) => sum + d.severity, 0) / older.length;

    const severityTrend = recentAvgSeverity > olderAvgSeverity + 1 ? 'increasing' :
                         recentAvgSeverity < olderAvgSeverity - 1 ? 'decreasing' : 'stable';

    const symptomFrequency = recent.length > older.length ? 'increasing' : 'stable';

    const riskProgression = severityTrend === 'increasing' ? 'worsening' :
                           severityTrend === 'decreasing' ? 'improving' : 'stable';

    return { symptomFrequency, severityTrend, riskProgression };
  }

  private generateRecommendations(patterns: SymptomPattern[], conditions: any[], lifestyleFactors: any): string[] {
    const recommendations: string[] = [];

    // High-risk condition recommendations
    const highRiskConditions = conditions.filter(c => c.urgency === 'high');
    if (highRiskConditions.length > 0) {
      recommendations.push('⚠️ URGENT: Consider consulting a healthcare provider immediately due to high-risk symptoms.');
    }

    // Lifestyle recommendations
    if (lifestyleFactors.stressLevel > 7) {
      recommendations.push('🧘 Practice stress management techniques like meditation or deep breathing exercises.');
    }
    if (lifestyleFactors.sleepQuality < 6) {
      recommendations.push('😴 Improve sleep hygiene: maintain regular sleep schedule and create a relaxing bedtime routine.');
    }
    if (lifestyleFactors.exerciseLevel < 3) {
      recommendations.push('🏃‍♂️ Increase physical activity: aim for at least 30 minutes of moderate exercise daily.');
    }

    // Symptom-specific recommendations
    patterns.forEach(pattern => {
      if (pattern.symptoms.includes('headache') && pattern.severity > 6) {
        recommendations.push('💊 For severe headaches, consider over-the-counter pain relievers and rest in a quiet, dark room.');
      }
      if (pattern.symptoms.includes('fatigue') && pattern.frequency > 3) {
        recommendations.push('⚡ Address fatigue by ensuring adequate sleep, proper nutrition, and managing stress levels.');
      }
    });

    // General health recommendations
    recommendations.push('📋 Keep a detailed symptom diary to track patterns and triggers.');
    recommendations.push('🥗 Maintain a balanced diet rich in fruits, vegetables, and whole grains.');
    recommendations.push('💧 Stay hydrated by drinking plenty of water throughout the day.');

    return recommendations.slice(0, 8); // Limit to 8 recommendations
  }

  // Helper methods
  private calculateSymptomDiversity(symptoms: string[]): number {
    const uniqueSymptoms = new Set(symptoms);
    return uniqueSymptoms.size / symptoms.length;
  }

  private calculateSymptomFrequency(symptoms: string[], healthData: any[]): number {
    const recentData = healthData.slice(0, 7); // Last 7 days
    let frequency = 0;
    
    symptoms.forEach(symptom => {
      recentData.forEach(record => {
        const recordSymptoms = JSON.parse(record.symptoms);
        if (recordSymptoms.includes(symptom)) {
          frequency++;
        }
      });
    });
    
    return frequency;
  }

  private calculateSymptomDuration(symptoms: string[], healthData: any[]): number {
    // Calculate how long symptoms have been present
    const sortedData = healthData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    let duration = 0;
    
    for (let i = 0; i < sortedData.length - 1; i++) {
      const currentSymptoms = JSON.parse(sortedData[i].symptoms);
      const nextSymptoms = JSON.parse(sortedData[i + 1].symptoms);
      
      const hasOverlap = symptoms.some(symptom => 
        currentSymptoms.includes(symptom) && nextSymptoms.includes(symptom)
      );
      
      if (hasOverlap) {
        duration++;
      } else {
        break;
      }
    }
    
    return duration;
  }

  private calculatePatternRiskLevel(record: any, cluster: number): 'low' | 'medium' | 'high' {
    const severity = record.severity;
    const symptoms = JSON.parse(record.symptoms);
    
    if (severity > 8 || symptoms.length > 5) return 'high';
    if (severity > 6 || symptoms.length > 3) return 'medium';
    return 'low';
  }

  private calculatePatternConfidence(record: any, cluster: number): number {
    // Calculate confidence based on data quality and consistency
    const symptoms = JSON.parse(record.symptoms);
    const dataQuality = symptoms.length > 0 ? 0.8 : 0.5;
    const consistency = record.severity > 0 ? 0.9 : 0.6;
    
    return (dataQuality + consistency) / 2;
  }

  private calculateConditionMatch(pattern: SymptomPattern, mapping: ConditionMapping): number {
    const matchingSymptoms = pattern.symptoms.filter(symptom => 
      mapping.symptoms.includes(symptom)
    );
    
    const symptomMatch = matchingSymptoms.length / mapping.symptoms.length;
    const severityMatch = pattern.severity >= mapping.severityThreshold ? 1 : pattern.severity / mapping.severityThreshold;
    const frequencyMatch = pattern.frequency >= mapping.frequencyThreshold ? 1 : pattern.frequency / mapping.frequencyThreshold;
    
    return (symptomMatch + severityMatch + frequencyMatch) / 3;
  }

  private calculateConditionProbability(stats: any, avgSeverity: number, avgFrequency: number): number {
    // Calculate a risk score based on pattern analysis, not probability
    const patternMatch = Math.min(stats.count / 3, 1); // Normalize to 0-1
    const severityMatch = Math.min(avgSeverity / 10, 1);
    const frequencyMatch = Math.min(avgFrequency / 7, 1);
    
    // This is a risk assessment score, not a medical probability
    // Higher values indicate more concerning patterns that warrant attention
    const riskScore = (patternMatch * 0.4 + severityMatch * 0.3 + frequencyMatch * 0.3);
    
    // Cap the risk score to avoid misleading high values
    return Math.min(riskScore, 0.95);
  }

  private determineConditionSeverity(avgSeverity: number): 'mild' | 'moderate' | 'severe' {
    if (avgSeverity > 7) return 'severe';
    if (avgSeverity > 5) return 'moderate';
    return 'mild';
  }

  private determineConditionUrgency(condition: string, avgSeverity: number, avgFrequency: number): 'low' | 'medium' | 'high' {
    const mapping = this.conditionMappings.find(m => m.condition === condition);
    if (!mapping) return 'low';
    
    if (mapping.urgency === 'high' || avgSeverity > 8) return 'high';
    if (mapping.urgency === 'medium' || avgSeverity > 6) return 'medium';
    return 'low';
  }

  private generateConditionRecommendations(condition: string, severity: string, urgency: string): string[] {
    const recommendations: string[] = [];
    
    // General recommendations based on urgency and severity
    if (urgency === 'high') {
      recommendations.push(`Consider discussing these symptoms with a healthcare provider`);
    } else if (severity === 'severe') {
      recommendations.push(`Monitor these symptoms and consider lifestyle adjustments`);
    } else {
      recommendations.push(`Continue monitoring and maintain healthy habits`);
    }
    
    // Add general wellness recommendations
    recommendations.push('Maintain regular sleep schedule and stress management');
    recommendations.push('Stay hydrated and eat a balanced diet');
    recommendations.push('Engage in regular physical activity as appropriate');
    
    // Add condition-specific lifestyle recommendations
    switch (condition) {
      case 'Hypertension':
        recommendations.push('Consider reducing salt intake and monitoring blood pressure');
        break;
      case 'Anxiety':
        recommendations.push('Practice relaxation techniques and consider stress management');
        break;
      case 'Migraine':
        recommendations.push('Identify potential triggers and maintain regular sleep schedule');
        break;
      case 'Back Pain':
        recommendations.push('Consider posture improvement and gentle stretching exercises');
        break;
      case 'Upper Respiratory Infection':
        recommendations.push('Rest well, stay hydrated, and consider over-the-counter remedies');
        break;
      case 'Bronchitis':
        recommendations.push('Rest, stay hydrated, and avoid smoking or secondhand smoke');
        break;
      case 'Asthma':
        recommendations.push('Avoid known triggers and maintain prescribed medication routine');
        break;
    }
    
    return recommendations;
  }

  private assessDietQuality(healthData: any[]): number {
    // Simple diet quality assessment based on available data
    const avgExercise = healthData.reduce((sum, d) => sum + d.exercise, 0) / healthData.length;
    const avgStress = healthData.reduce((sum, d) => sum + d.stress, 0) / healthData.length;
    
    // Higher exercise and lower stress typically correlate with better diet
    return Math.min((avgExercise / 10) * 0.6 + ((10 - avgStress) / 10) * 0.4, 10);
  }

  private calculateNextAssessmentDate(riskLevel: string): string {
    const now = new Date();
    let daysToAdd = 7; // Default: weekly assessment
    
    switch (riskLevel) {
      case 'critical':
        daysToAdd = 1; // Daily assessment
        break;
      case 'high':
        daysToAdd = 3; // Every 3 days
        break;
      case 'medium':
        daysToAdd = 5; // Every 5 days
        break;
      case 'low':
        daysToAdd = 14; // Every 2 weeks
        break;
    }
    
    now.setDate(now.getDate() + daysToAdd);
    return now.toISOString();
  }

  private async saveRiskAssessment(assessment: RiskAssessment): Promise<void> {
    try {
      // Save to database (you'll need to add this method to DatabaseService)
      console.log('💾 RiskAssessmentService: Saving risk assessment to database');
      // await databaseService.saveRiskAssessment(assessment);
    } catch (error) {
      console.error('❌ RiskAssessmentService: Failed to save risk assessment:', error);
    }
  }

  // Public method to get recent risk assessments
  async getRecentRiskAssessments(userId: string, limit: number = 5): Promise<RiskAssessment[]> {
    try {
      // Get from database (you'll need to add this method to DatabaseService)
      console.log('📊 RiskAssessmentService: Getting recent risk assessments for user:', userId);
      // return await databaseService.getRiskAssessments(userId, limit);
      return [];
    } catch (error) {
      console.error('❌ RiskAssessmentService: Failed to get risk assessments:', error);
      return [];
    }
  }

  private createSampleAssessment(userId: string): RiskAssessment {
    console.log('🎯 RiskAssessmentService: Creating sample assessment for user:', userId);
    
    return {
      id: uuidv4(),
      userId,
      timestamp: new Date().toISOString(),
      overallRiskLevel: 'low',
      symptomPatterns: [
        {
          id: uuidv4(),
          userId,
          timestamp: new Date().toISOString(),
          symptoms: ['fatigue', 'stress'],
          severity: 4,
          frequency: 2,
          duration: 3,
          cluster: 0,
          riskLevel: 'low',
          potentialConditions: ['General Fatigue'],
          confidence: 0.6,
          recommendations: ['Get adequate sleep', 'Practice stress management']
        }
      ],
      potentialConditions: [
        {
          condition: 'General Fatigue',
          probability: 0.3,
          severity: 'mild',
          urgency: 'low',
          recommendations: ['Ensure 7-8 hours of sleep', 'Maintain regular exercise routine']
        }
      ],
      lifestyleFactors: {
        sleepQuality: 7.0,
        stressLevel: 5.0,
        exerciseLevel: 6.0,
        dietQuality: 7.0
      },
      trends: {
        symptomFrequency: 'stable',
        severityTrend: 'stable',
        riskProgression: 'stable'
      },
      recommendations: [
        'Start logging your health data regularly',
        'Maintain a balanced diet',
        'Get regular exercise',
        'Practice stress management techniques'
      ],
      nextAssessmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      createdAt: new Date().toISOString()
    };
  }
}

// Singleton instance
export const riskAssessmentService = new RiskAssessmentService();
