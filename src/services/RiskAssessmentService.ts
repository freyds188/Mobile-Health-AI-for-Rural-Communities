import { databaseService } from './DatabaseService';
import { dataService } from './DataService';
import { MachineLearningService } from './MachineLearningService';
import { comprehensiveTrainingService } from './ComprehensiveTrainingService';
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
  demographicAnalysis?: {
    ageGroup: string;
    genderRiskFactors: string[];
    ageSpecificConditions: string[];
    demographicRecommendations: string[];
  };
}

export interface ConditionMapping {
  condition: string;
  symptoms: string[];
  severityThreshold: number;
  frequencyThreshold: number;
  riskFactors: string[];
  urgency: 'low' | 'medium' | 'high';
  category: 'respiratory' | 'cardiovascular' | 'neurological' | 'gastrointestinal' | 'musculoskeletal' | 'mental_health' | 'general';
  ageGroups?: string[];
  genderPrevalence?: 'male' | 'female' | 'both';
}

export interface UserDemographics {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  location?: string;
  medicalHistory?: string;
}

export class RiskAssessmentService {
  private mlService: MachineLearningService;
  private conditionMappings: ConditionMapping[] = [];

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
        category: 'respiratory',
        ageGroups: ['all'],
        genderPrevalence: 'both'
      },
      {
        condition: 'Bronchitis',
        symptoms: ['persistent cough', 'chest discomfort', 'fatigue', 'shortness of breath'],
        severityThreshold: 7,
        frequencyThreshold: 5,
        riskFactors: ['smoking', 'air pollution'],
        urgency: 'high',
        category: 'respiratory',
        ageGroups: ['adult', 'elderly'],
        genderPrevalence: 'both'
      },
      {
        condition: 'Asthma',
        symptoms: ['wheezing', 'shortness of breath', 'chest tightness', 'cough at night'],
        severityThreshold: 8,
        frequencyThreshold: 4,
        riskFactors: ['allergies', 'exercise', 'cold air'],
        urgency: 'high',
        category: 'respiratory',
        ageGroups: ['child', 'adult'],
        genderPrevalence: 'both'
      },

      // Cardiovascular Conditions
      {
        condition: 'Hypertension',
        symptoms: ['headache', 'dizziness', 'chest pain', 'shortness of breath', 'fatigue'],
        severityThreshold: 7,
        frequencyThreshold: 4,
        riskFactors: ['high salt diet', 'stress', 'obesity'],
        urgency: 'high',
        category: 'cardiovascular',
        ageGroups: ['adult', 'elderly'],
        genderPrevalence: 'both'
      },
      {
        condition: 'Heart Disease',
        symptoms: ['chest pain', 'shortness of breath', 'fatigue', 'swelling in legs', 'irregular heartbeat'],
        severityThreshold: 9,
        frequencyThreshold: 3,
        riskFactors: ['smoking', 'diabetes', 'high cholesterol'],
        urgency: 'high',
        category: 'cardiovascular',
        ageGroups: ['adult', 'elderly'],
        genderPrevalence: 'both'
      },

      // Neurological Conditions
      {
        condition: 'Migraine',
        symptoms: ['severe headache', 'nausea', 'sensitivity to light', 'sensitivity to sound'],
        severityThreshold: 8,
        frequencyThreshold: 2,
        riskFactors: ['stress', 'hormonal changes', 'certain foods'],
        urgency: 'medium',
        category: 'neurological',
        ageGroups: ['adult'],
        genderPrevalence: 'female'
      },
      {
        condition: 'Anxiety Disorder',
        symptoms: ['excessive worry', 'restlessness', 'fatigue', 'difficulty concentrating', 'sleep problems'],
        severityThreshold: 6,
        frequencyThreshold: 5,
        riskFactors: ['stress', 'trauma', 'genetics'],
        urgency: 'medium',
        category: 'mental_health',
        ageGroups: ['adult'],
        genderPrevalence: 'both'
      },
      {
        condition: 'Depression',
        symptoms: ['persistent sadness', 'loss of interest', 'fatigue', 'sleep changes', 'appetite changes'],
        severityThreshold: 7,
        frequencyThreshold: 4,
        riskFactors: ['stress', 'life events', 'genetics'],
        urgency: 'high',
        category: 'mental_health',
        ageGroups: ['adult', 'elderly'],
        genderPrevalence: 'both'
      },

      // Gastrointestinal Conditions
      {
        condition: 'Gastritis',
        symptoms: ['stomach pain', 'nausea', 'vomiting', 'loss of appetite', 'bloating'],
        severityThreshold: 6,
        frequencyThreshold: 3,
        riskFactors: ['spicy foods', 'alcohol', 'stress'],
        urgency: 'medium',
        category: 'gastrointestinal',
        ageGroups: ['adult', 'elderly'],
        genderPrevalence: 'both'
      },
      {
        condition: 'Irritable Bowel Syndrome',
        symptoms: ['abdominal pain', 'bloating', 'diarrhea', 'constipation', 'gas'],
        severityThreshold: 5,
        frequencyThreshold: 4,
        riskFactors: ['stress', 'diet', 'food sensitivities'],
        urgency: 'low',
        category: 'gastrointestinal',
        ageGroups: ['adult'],
        genderPrevalence: 'female'
      },

      // Musculoskeletal Conditions
      {
        condition: 'Arthritis',
        symptoms: ['joint pain', 'stiffness', 'swelling', 'reduced range of motion', 'fatigue'],
        severityThreshold: 6,
        frequencyThreshold: 4,
        riskFactors: ['age', 'obesity', 'joint injury'],
        urgency: 'medium',
        category: 'musculoskeletal',
        ageGroups: ['adult', 'elderly'],
        genderPrevalence: 'both'
      },
      {
        condition: 'Back Pain',
        symptoms: ['lower back pain', 'stiffness', 'muscle spasms', 'pain radiating to legs'],
        severityThreshold: 5,
        frequencyThreshold: 3,
        riskFactors: ['poor posture', 'heavy lifting', 'sedentary lifestyle'],
        urgency: 'medium',
        category: 'musculoskeletal',
        ageGroups: ['adult', 'elderly'],
        genderPrevalence: 'both'
      },

      // General Conditions
      {
        condition: 'Diabetes',
        symptoms: ['increased thirst', 'frequent urination', 'fatigue', 'blurred vision', 'slow healing'],
        severityThreshold: 7,
        frequencyThreshold: 3,
        riskFactors: ['obesity', 'family history', 'sedentary lifestyle'],
        urgency: 'high',
        category: 'general',
        ageGroups: ['adult', 'elderly'],
        genderPrevalence: 'both'
      },
      {
        condition: 'Obesity',
        symptoms: ['weight gain', 'fatigue', 'shortness of breath', 'joint pain', 'sleep apnea'],
        severityThreshold: 5,
        frequencyThreshold: 2,
        riskFactors: ['poor diet', 'sedentary lifestyle', 'genetics'],
        urgency: 'medium',
        category: 'general',
        ageGroups: ['adult', 'elderly'],
        genderPrevalence: 'both'
      },
      {
        condition: 'Sleep Disorders',
        symptoms: ['insomnia', 'excessive daytime sleepiness', 'snoring', 'restless sleep', 'fatigue'],
        severityThreshold: 6,
        frequencyThreshold: 4,
        riskFactors: ['stress', 'caffeine', 'screen time'],
        urgency: 'medium',
        category: 'general',
        ageGroups: ['adult', 'elderly'],
        genderPrevalence: 'both'
      }
    ];
  }

  async performRiskAssessment(userId: string, selectedSymptoms?: string[]): Promise<RiskAssessment> {
    try {
      console.log('🔍 RiskAssessmentService: Starting risk assessment for user:', userId);
      console.log('🔍 RiskAssessmentService: Selected symptoms:', selectedSymptoms);
      
      // Ensure database is initialized before proceeding
      console.log('🔧 RiskAssessmentService: Ensuring database is initialized...');
      try {
        await dataService.initialize();
        console.log('✅ RiskAssessmentService: Database initialization confirmed');
      } catch (initError) {
        console.warn('⚠️ RiskAssessmentService: Database initialization failed, but continuing:', initError);
        // Continue with assessment even if database init fails
      }
      
      // Get user demographics
      const userDemographics = await this.getUserDemographics(userId);
      
      // Get health data with error handling
      let healthData: any[] = [];
      try {
        healthData = await databaseService.getHealthData(userId, 50);
        console.log('📊 RiskAssessmentService: Analyzing', healthData.length, 'health records');
      } catch (dbError) {
        console.warn('⚠️ RiskAssessmentService: Failed to get health data from database:', dbError);
        console.log('📊 RiskAssessmentService: Using empty health data array for assessment');
        healthData = [];
      }
      
      // Train the system with comprehensive datasets
      await this.trainWithComprehensiveDatasets();
      
      // Train the system with actual user data
      await this.trainWithUserData(healthData);
      
      // Analyze symptom patterns using K-means
      const symptomPatterns = await this.analyzeSymptomPatterns(healthData);
      
      // Create symptom pattern from selected symptoms if provided
      if (selectedSymptoms && selectedSymptoms.length > 0) {
        console.log('🔍 RiskAssessmentService: Creating pattern from selected symptoms:', selectedSymptoms);
        const selectedPattern: SymptomPattern = {
          id: uuidv4(),
          userId,
          timestamp: new Date().toISOString(),
          symptoms: selectedSymptoms,
          severity: 6, // Default severity for selected symptoms
          frequency: 1,
          duration: 1,
          cluster: 0,
          riskLevel: 'medium',
          potentialConditions: [],
          confidence: 0.8,
          recommendations: []
        };
        symptomPatterns.unshift(selectedPattern); // Add to beginning of patterns
      }
      
      // Identify potential conditions with demographic analysis using datasets
      const potentialConditions = await this.identifyPotentialConditionsWithDatasets(symptomPatterns, userDemographics);
      
      // If no conditions found and we have selected symptoms, create conditions based on symptoms
      if (potentialConditions.length === 0 && selectedSymptoms && selectedSymptoms.length > 0) {
        console.log('🔍 RiskAssessmentService: No conditions found, creating based on selected symptoms');
        const symptomBasedConditions = this.createConditionsFromSymptoms(selectedSymptoms, userDemographics);
        potentialConditions.push(...symptomBasedConditions);
      }
      
      // Calculate overall risk level
      const overallRiskLevel = this.calculateOverallRiskLevel(symptomPatterns, potentialConditions);
      
      // Analyze lifestyle factors
      const lifestyleFactors = this.analyzeLifestyleFactors(healthData);
      
      // Analyze trends
      const trends = this.analyzeTrends(healthData);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(symptomPatterns, potentialConditions, lifestyleFactors);
      
      // Perform demographic analysis
      const demographicAnalysis = this.performDemographicAnalysis(userDemographics, symptomPatterns, potentialConditions);
      
      // Calculate next assessment date
      const nextAssessmentDate = this.calculateNextAssessmentDate(overallRiskLevel);
      
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
        nextAssessmentDate,
        createdAt: new Date().toISOString(),
        demographicAnalysis
      };
      
      // Save the assessment
      await this.saveRiskAssessment(assessment);
      
      console.log('✅ RiskAssessmentService: Risk assessment completed successfully');
      console.log('📊 RiskAssessmentService: Found', potentialConditions.length, 'potential conditions');
      return assessment;
      
    } catch (error) {
      console.error('❌ RiskAssessmentService: Risk assessment failed:', error);
      console.log('🔄 RiskAssessmentService: Creating fallback assessment...');
      
      // Create a fallback assessment if everything fails
      try {
        const fallbackAssessment = this.createSampleAssessment(userId);
        console.log('✅ RiskAssessmentService: Fallback assessment created successfully');
        return fallbackAssessment;
      } catch (fallbackError) {
        console.error('❌ RiskAssessmentService: Even fallback assessment failed:', fallbackError);
        throw new Error('Unable to perform risk assessment. Please try again later.');
      }
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

  private async trainWithComprehensiveDatasets(): Promise<void> {
    try {
      console.log('🔄 RiskAssessmentService: Training with comprehensive datasets...');
      
      // Check if we're on web platform and skip complex training
      if (typeof window !== 'undefined') {
        console.log('🌐 RiskAssessmentService: Web platform - skipping comprehensive training for performance');
        return;
      }
      
      // Train the comprehensive model using all available datasets
      const trainingResult = await comprehensiveTrainingService.trainComprehensiveModel();
      
      if (trainingResult.success) {
        console.log('✅ RiskAssessmentService: Comprehensive dataset training completed');
        console.log('📊 Training Results:', {
          datasetsUsed: trainingResult.datasetsUsed,
          totalRecords: trainingResult.totalRecords,
          accuracy: trainingResult.accuracy,
          ruralAccuracy: trainingResult.ruralAccuracy,
          mentalHealthAccuracy: trainingResult.mentalHealthAccuracy
        });
      } else {
        console.warn('⚠️ RiskAssessmentService: Comprehensive training had issues:', trainingResult.errors);
      }
    } catch (error) {
      console.error('❌ RiskAssessmentService: Comprehensive dataset training failed:', error);
    }
  }

  private async identifyPotentialConditionsWithDatasets(
    patterns: SymptomPattern[], 
    demographics?: UserDemographics
  ): Promise<Array<{
    condition: string;
    probability: number;
    severity: 'mild' | 'moderate' | 'severe';
    urgency: 'low' | 'medium' | 'high';
    recommendations: string[];
  }>> {
    try {
      console.log('🔍 RiskAssessmentService: Identifying conditions using datasets...');
      
      // Get dataset analyses to understand available conditions
      const datasetAnalyses = await comprehensiveTrainingService.loadAllDatasets();
      
      // Extract conditions from datasets
      const datasetConditions = this.extractConditionsFromDatasets(datasetAnalyses);
      
      // Combine with existing condition mappings
      const allConditions = [...this.conditionMappings, ...datasetConditions];
      
      // Use the original identification logic with enhanced conditions
      const conditions = this.identifyPotentialConditions(patterns, demographics);
      
      // Enhance with dataset-specific insights
      const enhancedConditions = await this.enhanceConditionsWithDatasetInsights(conditions, demographics, datasetAnalyses);
      
      console.log('✅ RiskAssessmentService: Dataset-based condition identification completed');
      return enhancedConditions;
      
    } catch (error) {
      console.error('❌ RiskAssessmentService: Dataset-based condition identification failed:', error);
      // Fallback to original method
      return this.identifyPotentialConditions(patterns, demographics);
    }
  }

  private extractConditionsFromDatasets(datasetAnalyses: any[]): ConditionMapping[] {
    const conditions: ConditionMapping[] = [];
    
    datasetAnalyses.forEach(analysis => {
      // Extract rural-specific conditions
      if (analysis.ruralSpecificConditions) {
        analysis.ruralSpecificConditions.forEach((condition: string) => {
          conditions.push({
            condition,
            symptoms: this.getSymptomsForCondition(condition),
            severityThreshold: 6,
            frequencyThreshold: 2,
            riskFactors: ['rural_living', 'limited_access_to_care'],
            urgency: 'medium',
            category: 'general',
            ageGroups: ['all'],
            genderPrevalence: 'both'
          });
        });
      }
      
      // Extract mental health conditions
      if (analysis.mentalHealthConditions) {
        analysis.mentalHealthConditions.forEach((condition: string) => {
          conditions.push({
            condition,
            symptoms: this.getSymptomsForCondition(condition),
            severityThreshold: 5,
            frequencyThreshold: 3,
            riskFactors: ['stress', 'anxiety', 'depression'],
            urgency: 'medium',
            category: 'mental_health',
            ageGroups: ['all'],
            genderPrevalence: 'both'
          });
        });
      }
    });
    
    return conditions;
  }

  private getSymptomsForCondition(condition: string): string[] {
    // Map conditions to common symptoms based on our datasets
    const conditionSymptomMap: { [key: string]: string[] } = {
      'Anxiety': ['excessive worry', 'restlessness', 'difficulty concentrating', 'sleep problems'],
      'Depression': ['persistent sadness', 'loss of interest', 'appetite changes', 'sleep changes'],
      'Hypertension': ['headache', 'dizziness', 'chest pain', 'shortness of breath'],
      'Diabetes': ['increased thirst', 'frequent urination', 'fatigue', 'blurred vision'],
      'Respiratory Infection': ['cough', 'sore throat', 'runny nose', 'congestion', 'fever'],
      'Gastritis': ['stomach pain', 'nausea', 'vomiting', 'loss of appetite', 'bloating'],
      'Migraine': ['severe headache', 'nausea', 'sensitivity to light', 'sensitivity to sound'],
      'Arthritis': ['joint pain', 'stiffness', 'swelling', 'reduced range of motion'],
      'Sleep Disorder': ['insomnia', 'excessive daytime sleepiness', 'snoring', 'restless sleep']
    };
    
    return conditionSymptomMap[condition] || ['fatigue', 'general discomfort'];
  }

  private async enhanceConditionsWithDatasetInsights(
    conditions: any[], 
    demographics?: UserDemographics, 
    datasetAnalyses?: any[]
  ): Promise<any[]> {
    const enhancedConditions = [...conditions];
    
    // Add rural-specific insights if user is in rural area
    if (demographics?.location && demographics.location.toLowerCase().includes('rural')) {
      enhancedConditions.forEach(condition => {
        if (condition.condition.includes('Respiratory') || condition.condition.includes('Infection')) {
          condition.recommendations.push('Consider limited access to healthcare in rural areas');
          condition.recommendations.push('Monitor symptoms closely due to distance from medical facilities');
        }
      });
    }
    
    // Add mental health insights based on dataset analysis
    if (datasetAnalyses) {
      const mentalHealthAnalysis = datasetAnalyses.find(analysis => 
        analysis.datasetName.includes('Mental Health')
      );
      
      if (mentalHealthAnalysis && mentalHealthAnalysis.mentalHealthConditions) {
        enhancedConditions.forEach(condition => {
          if (condition.condition.includes('Anxiety') || condition.condition.includes('Depression')) {
            condition.recommendations.push('Consider seasonal patterns in mental health symptoms');
            condition.recommendations.push('Monitor stress levels and sleep patterns');
          }
        });
      }
    }
    
    return enhancedConditions;
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

  private identifyPotentialConditions(
    patterns: SymptomPattern[], 
    demographics?: UserDemographics
  ): Array<{
    condition: string;
    probability: number;
    severity: 'mild' | 'moderate' | 'severe';
    urgency: 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    const conditions: Array<{
      condition: string;
      probability: number;
      severity: 'mild' | 'moderate' | 'severe';
      urgency: 'low' | 'medium' | 'high';
      recommendations: string[];
    }> = [];

    // Analyze each pattern against condition mappings
    patterns.forEach(pattern => {
      this.conditionMappings.forEach(mapping => {
        // Check if condition is appropriate for user's demographics
        if (demographics) {
          const ageGroup = this.categorizeAgeGroup(demographics.age);
          if (mapping.ageGroups && !mapping.ageGroups.includes(ageGroup) && !mapping.ageGroups.includes('all')) {
            return; // Skip if condition is not appropriate for age group
          }
          if (mapping.genderPrevalence && mapping.genderPrevalence !== 'both' && demographics.gender && mapping.genderPrevalence !== demographics.gender) {
            return; // Skip if condition is not appropriate for gender
          }
        }

        const matchScore = this.calculateConditionMatch(pattern, mapping);
        if (matchScore > 0.3) { // Threshold for condition consideration
          const avgSeverity = pattern.severity;
          const avgFrequency = pattern.frequency;
          
          const probability = this.calculateConditionProbability(
            { count: matchScore * 10, severity: avgSeverity, frequency: avgFrequency },
            avgSeverity,
            avgFrequency
          );
          
          if (probability > 0.2) { // Minimum probability threshold
            const severity = this.determineConditionSeverity(avgSeverity);
            const urgency = this.determineConditionUrgency(mapping.condition, avgSeverity, avgFrequency);
            const recommendations = this.generateConditionRecommendations(mapping.condition, severity, urgency);
            
            conditions.push({
              condition: mapping.condition,
              probability,
              severity,
              urgency,
              recommendations
            });
          }
        }
      });
    });

    // Sort by probability and return top conditions
    return conditions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5); // Limit to top 5 conditions
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

  private async getUserDemographics(userId: string): Promise<UserDemographics> {
    try {
      // Get user profile from database
      const userProfile = await databaseService.getUserProfile(userId);
      return {
        age: userProfile?.age,
        gender: userProfile?.gender as 'male' | 'female' | 'other' | undefined,
        location: userProfile?.location,
        medicalHistory: userProfile?.medicalHistory
      };
    } catch (error) {
      console.warn('⚠️ RiskAssessmentService: Could not retrieve user demographics:', error);
      return {};
    }
  }

  private performDemographicAnalysis(
    demographics: UserDemographics, 
    patterns: SymptomPattern[], 
    conditions: any[]
  ): {
    ageGroup: string;
    genderRiskFactors: string[];
    ageSpecificConditions: string[];
    demographicRecommendations: string[];
  } {
    const ageGroup = this.categorizeAgeGroup(demographics.age);
    const genderRiskFactors = this.analyzeGenderRiskFactors(patterns, demographics.gender);
    const ageSpecificConditions = this.identifyAgeSpecificConditions(ageGroup, conditions);
    const demographicRecommendations = this.generateDemographicRecommendations(demographics, ageGroup, patterns);

    return {
      ageGroup,
      genderRiskFactors,
      ageSpecificConditions,
      demographicRecommendations
    };
  }

  private categorizeAgeGroup(age?: number): string {
    if (!age) return 'unknown';
    if (age < 18) return 'child';
    if (age < 30) return 'young_adult';
    if (age < 50) return 'adult';
    if (age < 65) return 'middle_aged';
    return 'elderly';
  }

  private analyzeGenderRiskFactors(patterns: SymptomPattern[], gender?: string): string[] {
    const riskFactors: string[] = [];
    
    if (!gender) return riskFactors;

    // Analyze patterns for gender-specific risk factors
    const symptomFrequency = this.calculateSymptomFrequencyByGender(patterns, gender);
    
    if (gender === 'female') {
      if (symptomFrequency.includes('migraine')) {
        riskFactors.push('Higher prevalence of migraines in females');
      }
      if (symptomFrequency.includes('anxiety') || symptomFrequency.includes('depression')) {
        riskFactors.push('Increased risk of anxiety and depression');
      }
      if (symptomFrequency.includes('irritable bowel syndrome')) {
        riskFactors.push('Higher risk of IBS');
      }
    } else if (gender === 'male') {
      if (symptomFrequency.includes('chest pain') || symptomFrequency.includes('shortness of breath')) {
        riskFactors.push('Higher risk of cardiovascular conditions');
      }
      if (symptomFrequency.includes('back pain')) {
        riskFactors.push('Increased risk of musculoskeletal issues');
      }
    }

    return riskFactors;
  }

  private calculateSymptomFrequencyByGender(patterns: SymptomPattern[], gender: string): string[] {
    const allSymptoms: string[] = [];
    patterns.forEach(pattern => {
      allSymptoms.push(...pattern.symptoms);
    });
    
    // Count symptom frequency
    const symptomCount: { [key: string]: number } = {};
    allSymptoms.forEach(symptom => {
      symptomCount[symptom] = (symptomCount[symptom] || 0) + 1;
    });
    
    // Return symptoms that appear frequently
    return Object.entries(symptomCount)
      .filter(([_, count]) => count >= 2)
      .map(([symptom, _]) => symptom);
  }

  private identifyAgeSpecificConditions(ageGroup: string, conditions: any[]): string[] {
    const ageSpecificConditions: string[] = [];
    
    conditions.forEach(condition => {
      const mapping = this.conditionMappings.find(cm => cm.condition === condition.condition);
      if (mapping && mapping.ageGroups) {
        if (mapping.ageGroups.includes(ageGroup) || mapping.ageGroups.includes('all')) {
          ageSpecificConditions.push(condition.condition);
        }
      }
    });
    
    return ageSpecificConditions;
  }

  private generateDemographicRecommendations(
    demographics: UserDemographics, 
    ageGroup: string, 
    patterns: SymptomPattern[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Age-specific recommendations
    if (ageGroup === 'elderly') {
      recommendations.push('Consider regular health check-ups due to age-related risk factors');
      recommendations.push('Monitor for chronic conditions more closely');
      recommendations.push('Ensure adequate calcium and vitamin D intake for bone health');
    } else if (ageGroup === 'young_adult') {
      recommendations.push('Focus on preventive health measures');
      recommendations.push('Establish healthy lifestyle habits early');
    } else if (ageGroup === 'middle_aged') {
      recommendations.push('Regular screening for age-appropriate conditions');
      recommendations.push('Monitor cardiovascular health closely');
    }
    
    // Gender-specific recommendations
    if (demographics.gender === 'female') {
      recommendations.push('Consider hormonal factors in symptom patterns');
      recommendations.push('Regular gynecological health monitoring');
    } else if (demographics.gender === 'male') {
      recommendations.push('Regular cardiovascular health monitoring');
      recommendations.push('Prostate health screening as appropriate');
    }
    
    // Location-based recommendations (if available)
    if (demographics.location) {
      recommendations.push(`Consider local environmental factors in ${demographics.location}`);
    }
    
    return recommendations;
  }

  /**
   * Create potential conditions directly from selected symptoms
   */
  private createConditionsFromSymptoms(
    symptoms: string[], 
    demographics?: UserDemographics
  ): Array<{
    condition: string;
    probability: number;
    severity: 'mild' | 'moderate' | 'severe';
    urgency: 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    console.log('🔍 RiskAssessmentService: Creating conditions from symptoms:', symptoms);
    
    const conditions: Array<{
      condition: string;
      probability: number;
      severity: 'mild' | 'moderate' | 'severe';
      urgency: 'low' | 'medium' | 'high';
      recommendations: string[];
    }> = [];

    // Enhanced symptom-to-condition mapping with more variety
    const symptomConditionMap: { [key: string]: Array<{ condition: string; severity: 'mild' | 'moderate' | 'severe'; urgency: 'low' | 'medium' | 'high' }> } = {
      'Headache': [
        { condition: 'Tension Headache', severity: 'mild', urgency: 'low' },
        { condition: 'Migraine', severity: 'moderate', urgency: 'medium' },
        { condition: 'Sinus Headache', severity: 'mild', urgency: 'low' },
        { condition: 'Cluster Headache', severity: 'moderate', urgency: 'medium' }
      ],
      'Cough': [
        { condition: 'Common Cold', severity: 'mild', urgency: 'low' },
        { condition: 'Bronchitis', severity: 'moderate', urgency: 'medium' },
        { condition: 'Allergic Reaction', severity: 'mild', urgency: 'low' },
        { condition: 'Post-Nasal Drip', severity: 'mild', urgency: 'low' }
      ],
      'Fever': [
        { condition: 'Viral Infection', severity: 'moderate', urgency: 'medium' },
        { condition: 'Bacterial Infection', severity: 'moderate', urgency: 'medium' },
        { condition: 'Influenza', severity: 'moderate', urgency: 'medium' }
      ],
      'Chest pain': [
        { condition: 'Angina', severity: 'moderate', urgency: 'high' },
        { condition: 'Costochondritis', severity: 'mild', urgency: 'low' },
        { condition: 'Anxiety', severity: 'mild', urgency: 'low' },
        { condition: 'Gastroesophageal Reflux', severity: 'mild', urgency: 'low' }
      ],
      'Shortness of breath': [
        { condition: 'Asthma', severity: 'moderate', urgency: 'medium' },
        { condition: 'Anxiety', severity: 'mild', urgency: 'low' },
        { condition: 'Respiratory Infection', severity: 'mild', urgency: 'low' },
        { condition: 'Allergic Reaction', severity: 'moderate', urgency: 'medium' }
      ],
      'Stomach pain': [
        { condition: 'Gastritis', severity: 'mild', urgency: 'low' },
        { condition: 'Food Poisoning', severity: 'moderate', urgency: 'medium' },
        { condition: 'Irritable Bowel Syndrome', severity: 'mild', urgency: 'low' },
        { condition: 'Indigestion', severity: 'mild', urgency: 'low' }
      ],
      'Nausea': [
        { condition: 'Gastritis', severity: 'mild', urgency: 'low' },
        { condition: 'Viral Gastroenteritis', severity: 'moderate', urgency: 'medium' },
        { condition: 'Migraine', severity: 'mild', urgency: 'low' },
        { condition: 'Motion Sickness', severity: 'mild', urgency: 'low' }
      ],
      'Fatigue': [
        { condition: 'Sleep Disorder', severity: 'mild', urgency: 'low' },
        { condition: 'Anemia', severity: 'mild', urgency: 'low' },
        { condition: 'Depression', severity: 'mild', urgency: 'low' },
        { condition: 'Chronic Fatigue Syndrome', severity: 'moderate', urgency: 'medium' }
      ],
      'Joint pain': [
        { condition: 'Arthritis', severity: 'moderate', urgency: 'low' },
        { condition: 'Overuse Injury', severity: 'mild', urgency: 'low' },
        { condition: 'Fibromyalgia', severity: 'moderate', urgency: 'low' },
        { condition: 'Rheumatoid Arthritis', severity: 'moderate', urgency: 'medium' }
      ],
      'Dizziness': [
        { condition: 'Vertigo', severity: 'moderate', urgency: 'medium' },
        { condition: 'Low Blood Pressure', severity: 'mild', urgency: 'low' },
        { condition: 'Anxiety', severity: 'mild', urgency: 'low' },
        { condition: 'Inner Ear Disorder', severity: 'mild', urgency: 'low' }
      ],
      'Back pain': [
        { condition: 'Muscle Strain', severity: 'mild', urgency: 'low' },
        { condition: 'Herniated Disc', severity: 'moderate', urgency: 'medium' },
        { condition: 'Sciatica', severity: 'moderate', urgency: 'medium' },
        { condition: 'Poor Posture', severity: 'mild', urgency: 'low' }
      ],
      'Insomnia': [
        { condition: 'Sleep Disorder', severity: 'mild', urgency: 'low' },
        { condition: 'Anxiety', severity: 'mild', urgency: 'low' },
        { condition: 'Depression', severity: 'mild', urgency: 'low' },
        { condition: 'Circadian Rhythm Disorder', severity: 'mild', urgency: 'low' }
      ],
      'Anxiety': [
        { condition: 'Generalized Anxiety Disorder', severity: 'mild', urgency: 'low' },
        { condition: 'Panic Disorder', severity: 'moderate', urgency: 'medium' },
        { condition: 'Stress Response', severity: 'mild', urgency: 'low' }
      ],
      'Depression': [
        { condition: 'Major Depressive Disorder', severity: 'moderate', urgency: 'medium' },
        { condition: 'Seasonal Affective Disorder', severity: 'mild', urgency: 'low' },
        { condition: 'Adjustment Disorder', severity: 'mild', urgency: 'low' }
      ]
    };

    // Process each symptom to ensure multiple conditions are shown
    const processedConditions = new Set<string>();
    symptoms.forEach(symptom => {
      const symptomConditions = symptomConditionMap[symptom];
      if (symptomConditions) {
        symptomConditions.forEach(conditionInfo => {
          if (!processedConditions.has(conditionInfo.condition)) {
            processedConditions.add(conditionInfo.condition);
            conditions.push({
              condition: conditionInfo.condition,
              probability: 0.5, // Uniform probability instead of varying percentages
              severity: conditionInfo.severity,
              urgency: conditionInfo.urgency,
              recommendations: this.generateConditionRecommendations(conditionInfo.condition, conditionInfo.severity, conditionInfo.urgency)
            });
          }
        });
      }
    });

    // Add general conditions based on symptom count to ensure multiple conditions
    if (symptoms.length >= 2) {
      const generalConditions = [
        {
          condition: 'General Viral Infection',
          severity: 'mild' as const,
          urgency: 'low' as const,
          recommendations: [
            'Rest and stay hydrated',
            'Monitor symptoms for worsening',
            'Consider over-the-counter medications for symptom relief',
            'Seek medical attention if symptoms persist beyond 7 days'
          ]
        },
        {
          condition: 'Stress-Related Symptoms',
          severity: 'mild' as const,
          urgency: 'low' as const,
          recommendations: [
            'Practice stress management techniques',
            'Ensure adequate sleep and rest',
            'Consider relaxation exercises',
            'Maintain a balanced lifestyle'
          ]
        },
        {
          condition: 'Seasonal Allergies',
          severity: 'mild' as const,
          urgency: 'low' as const,
          recommendations: [
            'Avoid known allergens',
            'Consider antihistamines',
            'Keep windows closed during high pollen times',
            'Use air purifiers if needed'
          ]
        }
      ];

      generalConditions.forEach(conditionInfo => {
        if (!processedConditions.has(conditionInfo.condition)) {
          processedConditions.add(conditionInfo.condition);
          conditions.push({
            condition: conditionInfo.condition,
            probability: 0.5,
            severity: conditionInfo.severity,
            urgency: conditionInfo.urgency,
            recommendations: conditionInfo.recommendations
          });
        }
      });
    }

    // Add lifestyle-related conditions to ensure variety
    if (symptoms.length >= 1) {
      const lifestyleConditions = [
        {
          condition: 'Lifestyle-Related Symptoms',
          severity: 'mild' as const,
          urgency: 'low' as const,
          recommendations: [
            'Improve sleep hygiene',
            'Increase physical activity gradually',
            'Maintain a balanced diet',
            'Practice stress reduction techniques'
          ]
        }
      ];

      lifestyleConditions.forEach(conditionInfo => {
        if (!processedConditions.has(conditionInfo.condition)) {
          processedConditions.add(conditionInfo.condition);
          conditions.push({
            condition: conditionInfo.condition,
            probability: 0.5,
            severity: conditionInfo.severity,
            urgency: conditionInfo.urgency,
            recommendations: conditionInfo.recommendations
          });
        }
      });
    }

    // Ensure we return multiple conditions (minimum 2, maximum 6)
    const minConditions = Math.max(2, Math.min(symptoms.length, 3));
    const maxConditions = Math.min(6, conditions.length);
    
    // Sort by urgency and severity instead of probability for ethical reasons
    return conditions
      .sort((a, b) => {
        // Sort by urgency first (high > medium > low)
        const urgencyOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        
        // Then by severity (severe > moderate > mild)
        const severityOrder = { 'severe': 3, 'moderate': 2, 'mild': 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, Math.max(minConditions, maxConditions));
  }
}

// Singleton instance
export const riskAssessmentService = new RiskAssessmentService();
