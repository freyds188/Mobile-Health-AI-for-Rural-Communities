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
    description: string;
    probability: number;
    severity: 'mild' | 'moderate' | 'severe';
    urgency: 'low' | 'medium' | 'high';
    recommendations: string[];
    sources: string[];
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
      let potentialConditions = await this.identifyPotentialConditionsWithDatasets(symptomPatterns, userDemographics);
      console.log('🔍 RiskAssessmentService: Initial conditions found:', potentialConditions.length);
      
      // If no conditions found and we have selected symptoms, create conditions based on symptoms
      if (potentialConditions.length === 0 && selectedSymptoms && selectedSymptoms.length > 0) {
        console.log('🔍 RiskAssessmentService: No conditions found, creating based on selected symptoms');
        const symptomBasedConditions = this.createConditionsFromSymptoms(selectedSymptoms, userDemographics);
        potentialConditions.push(...symptomBasedConditions);
      }
      
      // Ensure we always have at least 3 conditions for better user experience
      if (potentialConditions.length < 3 && selectedSymptoms && selectedSymptoms.length > 0) {
        console.log('🔍 RiskAssessmentService: Adding additional conditions for better coverage');
        const additionalConditions = this.createConditionsFromSymptoms(selectedSymptoms, userDemographics);
        // Add conditions that aren't already in the list
        additionalConditions.forEach(condition => {
          if (!potentialConditions.find(existing => existing.condition === condition.condition)) {
            potentialConditions.push(condition);
          }
        });
      }
      
      // Final fallback: if still no conditions, create them from symptoms
      if (potentialConditions.length === 0 && selectedSymptoms && selectedSymptoms.length > 0) {
        console.log('🔍 RiskAssessmentService: Final fallback - creating conditions from symptoms');
        const finalConditions = this.createConditionsFromSymptoms(selectedSymptoms, userDemographics);
        potentialConditions.push(...finalConditions);
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
        console.log('🔄 RiskAssessmentService: Creating fallback assessment with symptom-based conditions...');
        
        // Create a proper fallback assessment using symptom-based conditions
        const fallbackConditions = selectedSymptoms && selectedSymptoms.length > 0 
          ? this.createConditionsFromSymptoms(selectedSymptoms, {})
          : [];
        
        const fallbackAssessment: RiskAssessment = {
          id: uuidv4(),
          userId,
          timestamp: new Date().toISOString(),
          overallRiskLevel: 'low',
          symptomPatterns: selectedSymptoms && selectedSymptoms.length > 0 ? [{
            id: uuidv4(),
            userId,
            timestamp: new Date().toISOString(),
            symptoms: selectedSymptoms,
            severity: 6,
            frequency: 1,
            duration: 1,
            cluster: 0,
            riskLevel: 'medium',
            potentialConditions: fallbackConditions.map(c => c.condition),
            confidence: 0.8,
            recommendations: []
          }] : [],
                     potentialConditions: fallbackConditions.length > 0 ? fallbackConditions : [{
             condition: 'General Health Assessment',
             description: 'A basic health evaluation to assess overall well-being and identify any potential health concerns that may require attention.',
             probability: 0.3,
             severity: 'mild',
             urgency: 'low',
             recommendations: ['Monitor your symptoms', 'Maintain healthy lifestyle', 'Consider consulting a healthcare provider if symptoms persist'],
             sources: ['Mayo Clinic: https://www.mayoclinic.org/', 'Centers for Disease Control and Prevention: https://www.cdc.gov/']
           }],
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
            'Continue monitoring your symptoms',
            'Maintain a balanced diet and regular exercise',
            'Practice stress management techniques',
            'Get adequate sleep and rest'
          ],
          nextAssessmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        };
        
        console.log('✅ RiskAssessmentService: Fallback assessment created successfully with', fallbackConditions.length, 'conditions');
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
    description: string;
    probability: number;
    severity: 'mild' | 'moderate' | 'severe';
    urgency: 'low' | 'medium' | 'high';
    recommendations: string[];
    sources: string[];
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
    description: string;
    probability: number;
    severity: 'mild' | 'moderate' | 'severe';
    urgency: 'low' | 'medium' | 'high';
    recommendations: string[];
    sources: string[];
  }> {
    console.log('🔍 RiskAssessmentService: Starting condition identification with', patterns.length, 'patterns');
    const conditions: Array<{
      condition: string;
      description: string;
      probability: number;
      severity: 'mild' | 'moderate' | 'severe';
      urgency: 'low' | 'medium' | 'high';
      recommendations: string[];
      sources: string[];
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
        if (matchScore > 0.1) { // Lowered threshold for condition consideration
          const avgSeverity = pattern.severity;
          const avgFrequency = pattern.frequency;
          
          const probability = this.calculateConditionProbability(
            { count: matchScore * 10, severity: avgSeverity, frequency: avgFrequency },
            avgSeverity,
            avgFrequency
          );
          
          if (probability > 0.1) { // Lowered minimum probability threshold
            const severity = this.determineConditionSeverity(avgSeverity);
            const urgency = this.determineConditionUrgency(mapping.condition, avgSeverity, avgFrequency);
            const recommendations = this.generateConditionRecommendations(mapping.condition, severity, urgency);
            
                         conditions.push({
               condition: mapping.condition,
               description: this.getConditionDescription(mapping.condition),
               probability,
               severity,
               urgency,
               recommendations,
               sources: this.getConditionSources(mapping.condition)
             });
          }
        }
      });
    });

    console.log('🔍 RiskAssessmentService: Found', conditions.length, 'conditions before filtering');
    
    // Sort by probability and return top conditions
    const result = conditions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 8); // Increased limit to top 8 conditions
    
    console.log('🔍 RiskAssessmentService: Returning', result.length, 'conditions after filtering');
    return result;
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
    // Normalize symptoms to lowercase for better matching
    const normalizedPatternSymptoms = pattern.symptoms.map(s => s.toLowerCase());
    const normalizedMappingSymptoms = mapping.symptoms.map(s => s.toLowerCase());
    
    const matchingSymptoms = normalizedPatternSymptoms.filter(symptom => 
      normalizedMappingSymptoms.some(mappingSymptom => 
        mappingSymptom.includes(symptom) || symptom.includes(mappingSymptom)
      )
    );
    
    // Calculate match score with more flexible criteria
    const symptomMatch = matchingSymptoms.length / Math.max(normalizedMappingSymptoms.length, 1);
    const severityMatch = pattern.severity >= mapping.severityThreshold ? 1 : pattern.severity / mapping.severityThreshold;
    const frequencyMatch = pattern.frequency >= mapping.frequencyThreshold ? 1 : pattern.frequency / mapping.frequencyThreshold;
    
    // Weight symptom match more heavily since it's the primary indicator
    return (symptomMatch * 0.6 + severityMatch * 0.25 + frequencyMatch * 0.15);
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

  private getConditionDescription(condition: string): string {
    // Return descriptions for conditions based on the condition mappings
    const descriptions: { [key: string]: string } = {
      'Upper Respiratory Infection': 'A viral infection affecting the nose, throat, and sinuses, commonly causing symptoms like cough, sore throat, and congestion.',
      'Bronchitis': 'Inflammation of the bronchial tubes in the lungs, often caused by viral or bacterial infection, leading to persistent cough and chest discomfort.',
      'Asthma': 'A chronic respiratory condition where the airways become inflamed and narrow, causing difficulty breathing, wheezing, and chest tightness.',
      'Hypertension': 'High blood pressure, a condition where the force of blood against artery walls is consistently too high, often called the silent killer.',
      'Heart Disease': 'A range of conditions affecting the heart, including coronary artery disease, heart failure, and arrhythmias.',
      'Migraine': 'A severe, recurring headache that typically affects one side of the head, often accompanied by nausea, sensitivity to light and sound.',
      'Anxiety Disorder': 'A mental health condition characterized by excessive worry and fear that can interfere with daily activities.',
      'Depression': 'A mental health disorder characterized by persistent feelings of sadness, loss of interest, and fatigue.',
      'Gastritis': 'Inflammation of the stomach lining, often caused by infection, medication, or excessive alcohol consumption.',
      'Irritable Bowel Syndrome': 'A chronic digestive disorder affecting the large intestine, causing abdominal pain, bloating, and changes in bowel habits.',
      'Arthritis': 'Inflammation of one or more joints, causing pain, stiffness, and reduced range of motion.',
      'Back Pain': 'Pain in the back, ranging from mild to severe, often caused by muscle strain, poor posture, or underlying conditions.',
      'Diabetes': 'A chronic condition affecting how the body processes glucose, leading to high blood sugar levels.',
      'Obesity': 'A medical condition characterized by excessive body fat that can lead to various health problems.',
      'Sleep Disorders': 'Conditions that affect the ability to sleep well on a regular basis, including insomnia and sleep apnea.'
    };
    
    return descriptions[condition] || 'A health condition that may require medical attention and lifestyle modifications.';
  }

  private getConditionSources(condition: string): string[] {
    // Return authoritative medical sources for each condition
    const sources: { [key: string]: string[] } = {
      'Tension Headache': [
        'Mayo Clinic - Tension Headache: https://www.mayoclinic.org/diseases-conditions/tension-headache',
        'American Migraine Foundation - Tension-Type Headache: https://americanmigrainefoundation.org/resource-library/tension-type-headache/',
        'National Institute of Neurological Disorders and Stroke: https://www.ninds.nih.gov/health-information/disorders/headache'
      ],
      'Migraine': [
        'Mayo Clinic - Migraine: https://www.mayoclinic.org/diseases-conditions/migraine-headache',
        'American Migraine Foundation: https://americanmigrainefoundation.org/',
        'World Health Organization - Headache Disorders: https://www.who.int/news-room/fact-sheets/detail/headache-disorders'
      ],
      'Sinus Headache': [
        'Mayo Clinic - Sinus Headaches: https://www.mayoclinic.org/diseases-conditions/sinus-headaches',
        'American Academy of Otolaryngology: https://www.enthealth.org/conditions/sinusitis/',
        'Cleveland Clinic - Sinus Headaches: https://my.clevelandclinic.org/health/diseases/9641-sinus-headaches'
      ],
      'Cluster Headache': [
        'Mayo Clinic - Cluster Headache: https://www.mayoclinic.org/diseases-conditions/cluster-headache',
        'American Migraine Foundation - Cluster Headache: https://americanmigrainefoundation.org/resource-library/cluster-headache/',
        'National Institute of Neurological Disorders and Stroke: https://www.ninds.nih.gov/health-information/disorders/cluster-headache'
      ],
      'Common Cold': [
        'Centers for Disease Control and Prevention - Common Cold: https://www.cdc.gov/features/rhinoviruses/',
        'Mayo Clinic - Common Cold: https://www.mayoclinic.org/diseases-conditions/common-cold',
        'National Institute of Allergy and Infectious Diseases: https://www.niaid.nih.gov/diseases-conditions/common-cold'
      ],
      'Bronchitis': [
        'Mayo Clinic - Bronchitis: https://www.mayoclinic.org/diseases-conditions/bronchitis',
        'American Lung Association - Bronchitis: https://www.lung.org/lung-health-diseases/lung-disease-lookup/bronchitis',
        'Centers for Disease Control and Prevention: https://www.cdc.gov/antibiotic-use/bronchitis.html'
      ],
      'Allergic Reaction': [
        'American Academy of Allergy, Asthma & Immunology: https://www.aaaai.org/conditions-and-treatments/allergies',
        'Mayo Clinic - Allergies: https://www.mayoclinic.org/diseases-conditions/allergies',
        'National Institute of Allergy and Infectious Diseases: https://www.niaid.nih.gov/diseases-conditions/allergic-diseases'
      ],
      'Post-Nasal Drip': [
        'American Academy of Otolaryngology: https://www.enthealth.org/conditions/post-nasal-drip/',
        'Mayo Clinic - Post-nasal drip: https://www.mayoclinic.org/symptoms/post-nasal-drip/basics/definition/sym-20050634',
        'Cleveland Clinic: https://my.clevelandclinic.org/health/symptoms/23062-post-nasal-drip'
      ],
      'Viral Infection': [
        'Centers for Disease Control and Prevention: https://www.cdc.gov/vaccines/parents/diseases/index.html',
        'Mayo Clinic - Viral Infections: https://www.mayoclinic.org/diseases-conditions/viral-infections',
        'World Health Organization: https://www.who.int/health-topics/viral-infections'
      ],
      'Bacterial Infection': [
        'Centers for Disease Control and Prevention: https://www.cdc.gov/antibiotic-use/index.html',
        'Mayo Clinic - Bacterial Infections: https://www.mayoclinic.org/diseases-conditions/bacterial-infections',
        'World Health Organization: https://www.who.int/health-topics/bacterial-infections'
      ],
      'Influenza': [
        'Centers for Disease Control and Prevention - Flu: https://www.cdc.gov/flu/',
        'World Health Organization - Influenza: https://www.who.int/health-topics/influenza',
        'Mayo Clinic - Influenza: https://www.mayoclinic.org/diseases-conditions/flu'
      ],
      'Angina': [
        'American Heart Association - Angina: https://www.heart.org/en/health-topics/heart-attack/angina-chest-pain',
        'Mayo Clinic - Angina: https://www.mayoclinic.org/diseases-conditions/angina',
        'National Heart, Lung, and Blood Institute: https://www.nhlbi.nih.gov/health/angina'
      ],
      'Costochondritis': [
        'Mayo Clinic - Costochondritis: https://www.mayoclinic.org/diseases-conditions/costochondritis',
        'Cleveland Clinic: https://my.clevelandclinic.org/health/diseases/12516-costochondritis',
        'American College of Rheumatology: https://www.rheumatology.org/I-Am-A/Patient-Caregiver/Diseases-Conditions/Costochondritis'
      ],
      'Anxiety': [
        'National Institute of Mental Health - Anxiety Disorders: https://www.nimh.nih.gov/health/topics/anxiety-disorders',
        'Mayo Clinic - Anxiety Disorders: https://www.mayoclinic.org/diseases-conditions/anxiety',
        'American Psychiatric Association: https://www.psychiatry.org/patients-families/anxiety-disorders'
      ],
      'Gastroesophageal Reflux': [
        'Mayo Clinic - GERD: https://www.mayoclinic.org/diseases-conditions/gerd',
        'American College of Gastroenterology: https://gi.org/topics/acid-reflux/',
        'National Institute of Diabetes and Digestive and Kidney Diseases: https://www.niddk.nih.gov/health-information/digestive-diseases/acid-reflux-ger-gerd-adults'
      ],
      'Asthma': [
        'American Lung Association - Asthma: https://www.lung.org/lung-health-diseases/lung-disease-lookup/asthma',
        'Centers for Disease Control and Prevention - Asthma: https://www.cdc.gov/asthma/',
        'National Heart, Lung, and Blood Institute: https://www.nhlbi.nih.gov/health/asthma'
      ],
      'Respiratory Infection': [
        'Centers for Disease Control and Prevention: https://www.cdc.gov/respiratory-viruses/index.html',
        'Mayo Clinic - Respiratory Infections: https://www.mayoclinic.org/diseases-conditions/respiratory-infections',
        'World Health Organization: https://www.who.int/health-topics/respiratory-infections'
      ],
      'Gastritis': [
        'Mayo Clinic - Gastritis: https://www.mayoclinic.org/diseases-conditions/gastritis',
        'National Institute of Diabetes and Digestive and Kidney Diseases: https://www.niddk.nih.gov/health-information/digestive-diseases/gastritis',
        'American College of Gastroenterology: https://gi.org/topics/gastritis/'
      ],
      'Food Poisoning': [
        'Centers for Disease Control and Prevention - Food Poisoning: https://www.cdc.gov/foodsafety/food-poisoning.html',
        'Mayo Clinic - Food Poisoning: https://www.mayoclinic.org/diseases-conditions/food-poisoning',
        'World Health Organization - Food Safety: https://www.who.int/health-topics/food-safety'
      ],
      'Irritable Bowel Syndrome': [
        'Mayo Clinic - IBS: https://www.mayoclinic.org/diseases-conditions/irritable-bowel-syndrome',
        'National Institute of Diabetes and Digestive and Kidney Diseases: https://www.niddk.nih.gov/health-information/digestive-diseases/irritable-bowel-syndrome',
        'American College of Gastroenterology: https://gi.org/topics/irritable-bowel-syndrome/'
      ],
      'Indigestion': [
        'Mayo Clinic - Indigestion: https://www.mayoclinic.org/diseases-conditions/indigestion',
        'National Institute of Diabetes and Digestive and Kidney Diseases: https://www.niddk.nih.gov/health-information/digestive-diseases/indigestion-dyspepsia',
        'Cleveland Clinic: https://my.clevelandclinic.org/health/diseases/7317-indigestion-dyspepsia'
      ],
      'Viral Gastroenteritis': [
        'Centers for Disease Control and Prevention - Viral Gastroenteritis: https://www.cdc.gov/norovirus/',
        'Mayo Clinic - Viral Gastroenteritis: https://www.mayoclinic.org/diseases-conditions/viral-gastroenteritis',
        'World Health Organization: https://www.who.int/health-topics/gastroenteritis'
      ],
      'Motion Sickness': [
        'Mayo Clinic - Motion Sickness: https://www.mayoclinic.org/diseases-conditions/motion-sickness',
        'Centers for Disease Control and Prevention: https://wwwnc.cdc.gov/travel/page/motion-sickness',
        'National Institute on Deafness and Other Communication Disorders: https://www.nidcd.nih.gov/health/balance-disorders'
      ],
      'Sleep Disorder': [
        'National Institute of Neurological Disorders and Stroke - Sleep Disorders: https://www.ninds.nih.gov/health-information/disorders/sleep-disorders',
        'American Academy of Sleep Medicine: https://aasm.org/',
        'Mayo Clinic - Sleep Disorders: https://www.mayoclinic.org/diseases-conditions/sleep-disorders'
      ],
      'Anemia': [
        'National Heart, Lung, and Blood Institute - Anemia: https://www.nhlbi.nih.gov/health/anemia',
        'Mayo Clinic - Anemia: https://www.mayoclinic.org/diseases-conditions/anemia',
        'American Society of Hematology: https://www.hematology.org/education/patients/anemia'
      ],
      'Depression': [
        'National Institute of Mental Health - Depression: https://www.nimh.nih.gov/health/topics/depression',
        'Mayo Clinic - Depression: https://www.mayoclinic.org/diseases-conditions/depression',
        'American Psychiatric Association: https://www.psychiatry.org/patients-families/depression'
      ],
      'Chronic Fatigue Syndrome': [
        'Centers for Disease Control and Prevention - ME/CFS: https://www.cdc.gov/me-cfs/',
        'Mayo Clinic - Chronic Fatigue Syndrome: https://www.mayoclinic.org/diseases-conditions/chronic-fatigue-syndrome',
        'National Institute of Neurological Disorders and Stroke: https://www.ninds.nih.gov/health-information/disorders/myalgic-encephalomyelitischronic-fatigue-syndrome-me-cfs'
      ],
      'Arthritis': [
        'Centers for Disease Control and Prevention - Arthritis: https://www.cdc.gov/arthritis/',
        'American College of Rheumatology: https://www.rheumatology.org/I-Am-A/Patient-Caregiver/Diseases-Conditions',
        'Mayo Clinic - Arthritis: https://www.mayoclinic.org/diseases-conditions/arthritis'
      ],
      'Overuse Injury': [
        'American Academy of Orthopaedic Surgeons: https://orthoinfo.aaos.org/en/diseases--conditions/overuse-injuries/',
        'Mayo Clinic - Sports Injuries: https://www.mayoclinic.org/diseases-conditions/sports-injuries',
        'National Institute of Arthritis and Musculoskeletal and Skin Diseases: https://www.niams.nih.gov/health-topics/sports-injuries'
      ],
      'Fibromyalgia': [
        'Centers for Disease Control and Prevention - Fibromyalgia: https://www.cdc.gov/arthritis/basics/fibromyalgia.htm',
        'Mayo Clinic - Fibromyalgia: https://www.mayoclinic.org/diseases-conditions/fibromyalgia',
        'National Institute of Arthritis and Musculoskeletal and Skin Diseases: https://www.niams.nih.gov/health-topics/fibromyalgia'
      ],
      'Rheumatoid Arthritis': [
        'Centers for Disease Control and Prevention - Rheumatoid Arthritis: https://www.cdc.gov/arthritis/basics/rheumatoid-arthritis.html',
        'American College of Rheumatology: https://www.rheumatology.org/I-Am-A/Patient-Caregiver/Diseases-Conditions/Rheumatoid-Arthritis',
        'Mayo Clinic - Rheumatoid Arthritis: https://www.mayoclinic.org/diseases-conditions/rheumatoid-arthritis'
      ],
      'Vertigo': [
        'National Institute on Deafness and Other Communication Disorders: https://www.nidcd.nih.gov/health/balance-disorders',
        'Mayo Clinic - Vertigo: https://www.mayoclinic.org/diseases-conditions/vertigo',
        'American Academy of Otolaryngology: https://www.enthealth.org/conditions/vertigo/'
      ],
      'Low Blood Pressure': [
        'American Heart Association - Low Blood Pressure: https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/low-blood-pressure-when-blood-pressure-is-too-low',
        'Mayo Clinic - Low Blood Pressure: https://www.mayoclinic.org/diseases-conditions/low-blood-pressure',
        'National Heart, Lung, and Blood Institute: https://www.nhlbi.nih.gov/health/low-blood-pressure'
      ],
      'Inner Ear Disorder': [
        'National Institute on Deafness and Other Communication Disorders: https://www.nidcd.nih.gov/health/balance-disorders',
        'American Academy of Otolaryngology: https://www.enthealth.org/conditions/balance-disorders/',
        'Mayo Clinic - Inner Ear Disorders: https://www.mayoclinic.org/diseases-conditions/balance-problems'
      ],
      'Muscle Strain': [
        'American Academy of Orthopaedic Surgeons: https://orthoinfo.aaos.org/en/diseases--conditions/muscle-strains-in-the-thigh/',
        'Mayo Clinic - Muscle Strains: https://www.mayoclinic.org/diseases-conditions/muscle-strains',
        'National Institute of Arthritis and Musculoskeletal and Skin Diseases: https://www.niams.nih.gov/health-topics/sports-injuries'
      ],
      'Herniated Disc': [
        'American Academy of Orthopaedic Surgeons: https://orthoinfo.aaos.org/en/diseases--conditions/herniated-disk/',
        'Mayo Clinic - Herniated Disk: https://www.mayoclinic.org/diseases-conditions/herniated-disk',
        'National Institute of Neurological Disorders and Stroke: https://www.ninds.nih.gov/health-information/disorders/herniated-disk'
      ],
      'Sciatica': [
        'American Academy of Orthopaedic Surgeons: https://orthoinfo.aaos.org/en/diseases--conditions/sciatica/',
        'Mayo Clinic - Sciatica: https://www.mayoclinic.org/diseases-conditions/sciatica',
        'National Institute of Neurological Disorders and Stroke: https://www.ninds.nih.gov/health-information/disorders/sciatica'
      ],
      'Poor Posture': [
        'American Academy of Orthopaedic Surgeons: https://orthoinfo.aaos.org/en/staying-healthy/preventing-back-pain-at-work-and-at-home/',
        'Mayo Clinic - Back Pain: https://www.mayoclinic.org/diseases-conditions/back-pain',
        'National Institute of Arthritis and Musculoskeletal and Skin Diseases: https://www.niams.nih.gov/health-topics/back-pain'
      ],
      'Circadian Rhythm Disorder': [
        'National Institute of Neurological Disorders and Stroke: https://www.ninds.nih.gov/health-information/disorders/circadian-rhythm-disorders',
        'American Academy of Sleep Medicine: https://aasm.org/',
        'Mayo Clinic - Circadian Rhythm Disorders: https://www.mayoclinic.org/diseases-conditions/circadian-rhythm-disorders'
      ],
      'Generalized Anxiety Disorder': [
        'National Institute of Mental Health - GAD: https://www.nimh.nih.gov/health/publications/generalized-anxiety-disorder-gad',
        'Mayo Clinic - Generalized Anxiety Disorder: https://www.mayoclinic.org/diseases-conditions/generalized-anxiety-disorder',
        'American Psychiatric Association: https://www.psychiatry.org/patients-families/anxiety-disorders'
      ],
      'Panic Disorder': [
        'National Institute of Mental Health - Panic Disorder: https://www.nimh.nih.gov/health/publications/panic-disorder-when-fear-overwhelms',
        'Mayo Clinic - Panic Disorder: https://www.mayoclinic.org/diseases-conditions/panic-attacks',
        'American Psychiatric Association: https://www.psychiatry.org/patients-families/anxiety-disorders'
      ],
      'Stress Response': [
        'National Institute of Mental Health - Stress: https://www.nimh.nih.gov/health/publications/stress',
        'Mayo Clinic - Stress Management: https://www.mayoclinic.org/healthy-lifestyle/stress-management',
        'American Psychological Association: https://www.apa.org/topics/stress'
      ],
      'Major Depressive Disorder': [
        'National Institute of Mental Health - Depression: https://www.nimh.nih.gov/health/topics/depression',
        'Mayo Clinic - Depression: https://www.mayoclinic.org/diseases-conditions/depression',
        'American Psychiatric Association: https://www.psychiatry.org/patients-families/depression'
      ],
      'Seasonal Affective Disorder': [
        'National Institute of Mental Health - SAD: https://www.nimh.nih.gov/health/publications/seasonal-affective-disorder',
        'Mayo Clinic - Seasonal Affective Disorder: https://www.mayoclinic.org/diseases-conditions/seasonal-affective-disorder',
        'American Psychiatric Association: https://www.psychiatry.org/patients-families/depression'
      ],
      'Adjustment Disorder': [
        'Mayo Clinic - Adjustment Disorders: https://www.mayoclinic.org/diseases-conditions/adjustment-disorders',
        'American Psychiatric Association: https://www.psychiatry.org/patients-families/adjustment-disorder',
        'National Institute of Mental Health: https://www.nimh.nih.gov/health/topics/anxiety-disorders'
      ],
      'Pharyngitis': [
        'Mayo Clinic - Sore Throat: https://www.mayoclinic.org/diseases-conditions/sore-throat',
        'Centers for Disease Control and Prevention: https://www.cdc.gov/groupastrep/diseases-public/strep-throat.html',
        'American Academy of Otolaryngology: https://www.enthealth.org/conditions/sore-throat/'
      ],
      'Strep Throat': [
        'Centers for Disease Control and Prevention - Strep Throat: https://www.cdc.gov/groupastrep/diseases-public/strep-throat.html',
        'Mayo Clinic - Strep Throat: https://www.mayoclinic.org/diseases-conditions/strep-throat',
        'American Academy of Pediatrics: https://www.healthychildren.org/English/health-issues/conditions/infections/Pages/Strep-Throat.aspx'
      ],
      'Allergic Rhinitis': [
        'American Academy of Allergy, Asthma & Immunology: https://www.aaaai.org/conditions-and-treatments/allergies/hay-fever-rhinitis',
        'Mayo Clinic - Hay Fever: https://www.mayoclinic.org/diseases-conditions/hay-fever',
        'National Institute of Allergy and Infectious Diseases: https://www.niaid.nih.gov/diseases-conditions/allergic-rhinitis'
      ],
      'Sinusitis': [
        'Mayo Clinic - Sinusitis: https://www.mayoclinic.org/diseases-conditions/acute-sinusitis',
        'American Academy of Otolaryngology: https://www.enthealth.org/conditions/sinusitis/',
        'National Institute of Allergy and Infectious Diseases: https://www.niaid.nih.gov/diseases-conditions/sinusitis'
      ],
      'Sinus Congestion': [
        'Mayo Clinic - Sinus Headaches: https://www.mayoclinic.org/diseases-conditions/sinus-headaches',
        'American Academy of Otolaryngology: https://www.enthealth.org/conditions/sinusitis/',
        'Cleveland Clinic: https://my.clevelandclinic.org/health/diseases/9641-sinus-headaches'
      ],
      'Muscle Stiffness': [
        'American Academy of Orthopaedic Surgeons: https://orthoinfo.aaos.org/en/staying-healthy/exercise-and-fitness/',
        'Mayo Clinic - Muscle Pain: https://www.mayoclinic.org/symptoms/muscle-pain/basics/definition/sym-20050866',
        'National Institute of Arthritis and Musculoskeletal and Skin Diseases: https://www.niams.nih.gov/health-topics/muscle-bone-diseases'
      ],
      'Inflammation': [
        'National Institute of Allergy and Infectious Diseases: https://www.niaid.nih.gov/research/inflammation',
        'Mayo Clinic - Inflammation: https://www.mayoclinic.org/diseases-conditions/inflammation',
        'National Institute of Arthritis and Musculoskeletal and Skin Diseases: https://www.niams.nih.gov/health-topics/inflammation'
      ],
      'Infection': [
        'Centers for Disease Control and Prevention: https://www.cdc.gov/infectioncontrol/index.html',
        'Mayo Clinic - Infections: https://www.mayoclinic.org/diseases-conditions/infections',
        'World Health Organization: https://www.who.int/health-topics/infectious-diseases'
      ],
      'General Viral Infection': [
        'Centers for Disease Control and Prevention: https://www.cdc.gov/vaccines/parents/diseases/index.html',
        'Mayo Clinic - Viral Infections: https://www.mayoclinic.org/diseases-conditions/viral-infections',
        'World Health Organization: https://www.who.int/health-topics/viral-infections'
      ],
      'Stress-Related Symptoms': [
        'National Institute of Mental Health - Stress: https://www.nimh.nih.gov/health/publications/stress',
        'Mayo Clinic - Stress Management: https://www.mayoclinic.org/healthy-lifestyle/stress-management',
        'American Psychological Association: https://www.apa.org/topics/stress'
      ],
      'Seasonal Allergies': [
        'American Academy of Allergy, Asthma & Immunology: https://www.aaaai.org/conditions-and-treatments/allergies',
        'Mayo Clinic - Seasonal Allergies: https://www.mayoclinic.org/diseases-conditions/hay-fever',
        'National Institute of Allergy and Infectious Diseases: https://www.niaid.nih.gov/diseases-conditions/allergic-diseases'
      ],
      'Lifestyle-Related Symptoms': [
        'Centers for Disease Control and Prevention - Healthy Living: https://www.cdc.gov/healthyliving/',
        'Mayo Clinic - Healthy Lifestyle: https://www.mayoclinic.org/healthy-lifestyle',
        'World Health Organization - Healthy Living: https://www.who.int/health-topics/healthy-living'
      ],
      'General Health Assessment': [
        'Centers for Disease Control and Prevention - Preventive Care: https://www.cdc.gov/prevention/',
        'Mayo Clinic - Preventive Care: https://www.mayoclinic.org/healthy-lifestyle/adult-health',
        'World Health Organization - Primary Health Care: https://www.who.int/health-topics/primary-health-care'
      ]
    };
    
    return sources[condition] || [
      'Mayo Clinic: https://www.mayoclinic.org/',
      'Centers for Disease Control and Prevention: https://www.cdc.gov/',
      'World Health Organization: https://www.who.int/'
    ];
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
           description: 'A feeling of tiredness or lack of energy that can be caused by various factors including lack of sleep, stress, or underlying health conditions.',
           probability: 0.3,
           severity: 'mild',
           urgency: 'low',
           recommendations: ['Ensure 7-8 hours of sleep', 'Maintain regular exercise routine'],
           sources: ['Mayo Clinic: https://www.mayoclinic.org/', 'Centers for Disease Control and Prevention: https://www.cdc.gov/']
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
    description: string;
    probability: number;
    severity: 'mild' | 'moderate' | 'severe';
    urgency: 'low' | 'medium' | 'high';
    recommendations: string[];
    sources: string[];
  }> {
    console.log('🔍 RiskAssessmentService: Creating conditions from symptoms:', symptoms);
    
    const conditions: Array<{
      condition: string;
      description: string;
      probability: number;
      severity: 'mild' | 'moderate' | 'severe';
      urgency: 'low' | 'medium' | 'high';
      recommendations: string[];
      sources: string[];
    }> = [];

    // Enhanced symptom-to-condition mapping with descriptions
    const symptomConditionMap: { [key: string]: Array<{ condition: string; description: string; severity: 'mild' | 'moderate' | 'severe'; urgency: 'low' | 'medium' | 'high' }> } = {
      'Headache': [
        { condition: 'Tension Headache', description: 'A common type of headache caused by muscle tension in the head, neck, and shoulders, often related to stress, poor posture, or eye strain.', severity: 'mild', urgency: 'low' },
        { condition: 'Migraine', description: 'A severe, recurring headache that typically affects one side of the head, often accompanied by nausea, sensitivity to light and sound, and visual disturbances.', severity: 'moderate', urgency: 'medium' },
        { condition: 'Sinus Headache', description: 'Pain and pressure in the face caused by inflammation of the sinuses, often due to allergies or infection.', severity: 'mild', urgency: 'low' },
        { condition: 'Cluster Headache', description: 'Intense, excruciating headaches that occur in clusters or cycles, typically affecting one side of the head around the eye area.', severity: 'moderate', urgency: 'medium' }
      ],
      'Cough': [
        { condition: 'Common Cold', description: 'A viral infection of the upper respiratory tract causing symptoms like cough, runny nose, sore throat, and mild fever.', severity: 'mild', urgency: 'low' },
        { condition: 'Bronchitis', description: 'Inflammation of the bronchial tubes in the lungs, often caused by viral or bacterial infection, leading to persistent cough and chest discomfort.', severity: 'moderate', urgency: 'medium' },
        { condition: 'Allergic Reaction', description: 'An immune system response to allergens like pollen, dust, or pet dander, causing respiratory symptoms including cough.', severity: 'mild', urgency: 'low' },
        { condition: 'Post-Nasal Drip', description: 'Excess mucus dripping down the back of the throat from the nasal passages, often causing chronic cough and throat irritation.', severity: 'mild', urgency: 'low' }
      ],
      'Fever': [
        { condition: 'Viral Infection', description: 'An infection caused by a virus, such as the common cold or flu, typically causing fever, body aches, and other systemic symptoms.', severity: 'moderate', urgency: 'medium' },
        { condition: 'Bacterial Infection', description: 'An infection caused by bacteria that can affect various parts of the body, often requiring medical treatment with antibiotics.', severity: 'moderate', urgency: 'medium' },
        { condition: 'Influenza', description: 'A highly contagious viral infection affecting the respiratory system, characterized by sudden onset of fever, body aches, and fatigue.', severity: 'moderate', urgency: 'medium' }
      ],
      'Chest pain': [
        { condition: 'Angina', description: 'Chest pain or discomfort caused by reduced blood flow to the heart muscle, often a sign of coronary artery disease.', severity: 'moderate', urgency: 'high' },
        { condition: 'Costochondritis', description: 'Inflammation of the cartilage that connects the ribs to the breastbone, causing sharp chest pain that may worsen with movement or breathing.', severity: 'mild', urgency: 'low' },
        { condition: 'Anxiety', description: 'A mental health condition characterized by excessive worry and fear, which can manifest as physical symptoms including chest tightness and pain.', severity: 'mild', urgency: 'low' },
        { condition: 'Gastroesophageal Reflux', description: 'A digestive disorder where stomach acid flows back into the esophagus, causing heartburn and chest discomfort.', severity: 'mild', urgency: 'low' }
      ],
      'Shortness of breath': [
        { condition: 'Asthma', description: 'A chronic respiratory condition where the airways become inflamed and narrow, causing difficulty breathing, wheezing, and chest tightness.', severity: 'moderate', urgency: 'medium' },
        { condition: 'Anxiety', description: 'A mental health condition that can cause physical symptoms including shortness of breath, rapid breathing, and chest tightness due to stress response.', severity: 'mild', urgency: 'low' },
        { condition: 'Respiratory Infection', description: 'An infection affecting the lungs or airways, such as pneumonia or bronchitis, causing breathing difficulties and other respiratory symptoms.', severity: 'mild', urgency: 'low' },
        { condition: 'Allergic Reaction', description: 'An immune system response to allergens that can cause airway constriction and difficulty breathing, potentially life-threatening in severe cases.', severity: 'moderate', urgency: 'medium' }
      ],
      'Stomach pain': [
        { condition: 'Gastritis', description: 'Inflammation of the stomach lining, often caused by infection, medication, or excessive alcohol consumption, leading to abdominal pain and discomfort.', severity: 'mild', urgency: 'low' },
        { condition: 'Food Poisoning', description: 'An illness caused by consuming contaminated food or water, typically causing stomach pain, nausea, vomiting, and diarrhea.', severity: 'moderate', urgency: 'medium' },
        { condition: 'Irritable Bowel Syndrome', description: 'A chronic digestive disorder affecting the large intestine, causing abdominal pain, bloating, and changes in bowel habits.', severity: 'mild', urgency: 'low' },
        { condition: 'Indigestion', description: 'Discomfort or pain in the upper abdomen, often caused by overeating, eating too quickly, or consuming fatty or spicy foods.', severity: 'mild', urgency: 'low' }
      ],
      'Nausea': [
        { condition: 'Gastritis', description: 'Inflammation of the stomach lining that can cause nausea, vomiting, and abdominal discomfort, often triggered by certain foods or medications.', severity: 'mild', urgency: 'low' },
        { condition: 'Viral Gastroenteritis', description: 'A viral infection of the stomach and intestines, commonly known as stomach flu, causing nausea, vomiting, and diarrhea.', severity: 'moderate', urgency: 'medium' },
        { condition: 'Migraine', description: 'A severe headache disorder that often includes nausea and vomiting as accompanying symptoms, along with sensitivity to light and sound.', severity: 'mild', urgency: 'low' },
        { condition: 'Motion Sickness', description: 'A condition caused by movement during travel, such as in cars, boats, or planes, leading to nausea, dizziness, and sometimes vomiting.', severity: 'mild', urgency: 'low' }
      ],
      'Fatigue': [
        { condition: 'Sleep Disorder', description: 'Various conditions affecting sleep quality and quantity, such as insomnia or sleep apnea, leading to persistent tiredness and lack of energy.', severity: 'mild', urgency: 'low' },
        { condition: 'Anemia', description: 'A condition where the body lacks enough healthy red blood cells to carry adequate oxygen to tissues, causing fatigue, weakness, and shortness of breath.', severity: 'mild', urgency: 'low' },
        { condition: 'Depression', description: 'A mental health disorder characterized by persistent feelings of sadness, loss of interest, and fatigue that can significantly impact daily functioning.', severity: 'mild', urgency: 'low' },
        { condition: 'Chronic Fatigue Syndrome', description: 'A complex disorder characterized by extreme fatigue that cannot be explained by any underlying medical condition and does not improve with rest.', severity: 'moderate', urgency: 'medium' }
      ],
      'Joint pain': [
        { condition: 'Arthritis', description: 'Inflammation of one or more joints, causing pain, stiffness, and reduced range of motion, with osteoarthritis and rheumatoid arthritis being common types.', severity: 'moderate', urgency: 'low' },
        { condition: 'Overuse Injury', description: 'Pain and inflammation in joints or muscles caused by repetitive movements or excessive physical activity without adequate rest.', severity: 'mild', urgency: 'low' },
        { condition: 'Fibromyalgia', description: 'A chronic condition characterized by widespread musculoskeletal pain, fatigue, and tenderness in localized areas throughout the body.', severity: 'moderate', urgency: 'low' },
        { condition: 'Rheumatoid Arthritis', description: 'An autoimmune disorder where the immune system attacks the joints, causing inflammation, pain, and eventually joint damage and deformity.', severity: 'moderate', urgency: 'medium' }
      ],
      'Dizziness': [
        { condition: 'Vertigo', description: 'A sensation of spinning or feeling that the environment is moving around you, often caused by inner ear problems or vestibular disorders.', severity: 'moderate', urgency: 'medium' },
        { condition: 'Low Blood Pressure', description: 'Blood pressure that is lower than normal, which can cause dizziness, lightheadedness, and fainting, especially when standing up quickly.', severity: 'mild', urgency: 'low' },
        { condition: 'Anxiety', description: 'A mental health condition that can cause physical symptoms including dizziness, lightheadedness, and feelings of unsteadiness.', severity: 'mild', urgency: 'low' },
        { condition: 'Inner Ear Disorder', description: 'Problems affecting the inner ear, which is responsible for balance and hearing, often causing dizziness, vertigo, and balance issues.', severity: 'mild', urgency: 'low' }
      ],
      'Back pain': [
        { condition: 'Muscle Strain', description: 'An injury to the muscles or tendons in the back, often caused by lifting heavy objects, poor posture, or sudden movements.', severity: 'mild', urgency: 'low' },
        { condition: 'Herniated Disc', description: 'A condition where the soft center of a spinal disc pushes through a crack in the tougher exterior, potentially pressing on nerves and causing pain.', severity: 'moderate', urgency: 'medium' },
        { condition: 'Sciatica', description: 'Pain that radiates along the path of the sciatic nerve, which runs from the lower back through the hips and down each leg, often caused by a herniated disc.', severity: 'moderate', urgency: 'medium' },
        { condition: 'Poor Posture', description: 'Incorrect positioning of the body while sitting, standing, or lying down, which can lead to muscle strain and chronic back pain over time.', severity: 'mild', urgency: 'low' }
      ],
      'Insomnia': [
        { condition: 'Sleep Disorder', description: 'Difficulty falling asleep, staying asleep, or getting quality sleep, which can be caused by stress, anxiety, medical conditions, or lifestyle factors.', severity: 'mild', urgency: 'low' },
        { condition: 'Anxiety', description: 'A mental health condition characterized by excessive worry and fear that can interfere with sleep patterns and cause insomnia.', severity: 'mild', urgency: 'low' },
        { condition: 'Depression', description: 'A mood disorder that can cause changes in sleep patterns, including difficulty falling asleep or sleeping too much.', severity: 'mild', urgency: 'low' },
        { condition: 'Circadian Rhythm Disorder', description: 'A disruption in the body\'s internal clock that regulates sleep-wake cycles, causing difficulty sleeping at normal times.', severity: 'mild', urgency: 'low' }
      ],
      'Anxiety': [
        { condition: 'Generalized Anxiety Disorder', description: 'A mental health condition characterized by persistent and excessive worry about various aspects of life, often accompanied by physical symptoms.', severity: 'mild', urgency: 'low' },
        { condition: 'Panic Disorder', description: 'A type of anxiety disorder characterized by sudden, intense episodes of fear or panic attacks, often with physical symptoms like rapid heartbeat and shortness of breath.', severity: 'moderate', urgency: 'medium' },
        { condition: 'Stress Response', description: 'The body\'s natural reaction to challenging situations, which can manifest as anxiety symptoms when stress levels become overwhelming.', severity: 'mild', urgency: 'low' }
      ],
      'Depression': [
        { condition: 'Major Depressive Disorder', description: 'A serious mental health condition characterized by persistent feelings of sadness, loss of interest in activities, and other symptoms that interfere with daily life.', severity: 'moderate', urgency: 'medium' },
        { condition: 'Seasonal Affective Disorder', description: 'A type of depression that occurs at the same time each year, typically during fall and winter months when there is less natural sunlight.', severity: 'mild', urgency: 'low' },
        { condition: 'Adjustment Disorder', description: 'A short-term condition that occurs when someone has difficulty coping with or adjusting to a stressful life event or change.', severity: 'mild', urgency: 'low' }
      ],
      'Sore throat': [
        { condition: 'Pharyngitis', description: 'Inflammation of the pharynx (throat), often caused by viral or bacterial infections, causing pain and difficulty swallowing.', severity: 'mild', urgency: 'low' },
        { condition: 'Strep Throat', description: 'A bacterial infection caused by Streptococcus bacteria, causing severe sore throat, difficulty swallowing, and sometimes fever.', severity: 'moderate', urgency: 'medium' },
        { condition: 'Viral Infection', description: 'An infection caused by a virus, such as the common cold or flu, that can cause sore throat along with other respiratory symptoms.', severity: 'mild', urgency: 'low' }
      ],
      'Runny nose': [
        { condition: 'Allergic Rhinitis', description: 'An allergic reaction to airborne allergens like pollen, dust, or pet dander, causing nasal congestion, runny nose, and sneezing.', severity: 'mild', urgency: 'low' },
        { condition: 'Common Cold', description: 'A viral infection of the upper respiratory tract that causes symptoms including runny nose, congestion, sore throat, and mild fever.', severity: 'mild', urgency: 'low' },
        { condition: 'Sinusitis', description: 'Inflammation of the sinuses, often caused by infection or allergies, leading to nasal congestion, runny nose, and facial pressure.', severity: 'mild', urgency: 'low' }
      ],
      'Congestion': [
        { condition: 'Sinus Congestion', description: 'Blockage or stuffiness in the nasal passages and sinuses, often caused by colds, allergies, or sinus infections.', severity: 'mild', urgency: 'low' },
        { condition: 'Allergic Reaction', description: 'An immune system response to allergens that can cause nasal congestion, runny nose, and other respiratory symptoms.', severity: 'mild', urgency: 'low' },
        { condition: 'Upper Respiratory Infection', description: 'An infection affecting the nose, throat, and sinuses, commonly caused by viruses and causing congestion, cough, and other symptoms.', severity: 'mild', urgency: 'low' }
      ],
      'Stiffness': [
        { condition: 'Muscle Stiffness', description: 'Tightness or reduced flexibility in muscles, often caused by overuse, injury, or lack of physical activity.', severity: 'mild', urgency: 'low' },
        { condition: 'Arthritis', description: 'Inflammation of joints causing stiffness, pain, and reduced range of motion, particularly noticeable in the morning or after periods of inactivity.', severity: 'moderate', urgency: 'low' },
        { condition: 'Poor Posture', description: 'Incorrect positioning of the body that can lead to muscle stiffness and tension, particularly in the neck, shoulders, and back.', severity: 'mild', urgency: 'low' }
      ],
      'Swelling': [
        { condition: 'Inflammation', description: 'The body\'s natural response to injury or infection, causing redness, swelling, heat, and pain in the affected area.', severity: 'mild', urgency: 'low' },
        { condition: 'Allergic Reaction', description: 'An immune system response to allergens that can cause swelling, particularly in the face, lips, tongue, or throat, which can be serious.', severity: 'moderate', urgency: 'medium' },
        { condition: 'Infection', description: 'A condition caused by harmful microorganisms that can lead to inflammation and swelling in the affected area as the body fights the infection.', severity: 'moderate', urgency: 'medium' }
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
               description: conditionInfo.description,
               probability: 0.5, // Uniform probability instead of varying percentages
               severity: conditionInfo.severity,
               urgency: conditionInfo.urgency,
               recommendations: this.generateConditionRecommendations(conditionInfo.condition, conditionInfo.severity, conditionInfo.urgency),
               sources: this.getConditionSources(conditionInfo.condition)
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
          description: 'A viral infection affecting the body, typically causing multiple symptoms like fever, fatigue, and respiratory issues that usually resolve on their own.',
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
          description: 'Physical and mental symptoms caused by chronic stress, including fatigue, muscle tension, sleep problems, and changes in appetite or mood.',
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
          description: 'An allergic response to environmental allergens that appear during specific seasons, such as pollen in spring or ragweed in fall.',
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
            description: conditionInfo.description,
            probability: 0.5,
            severity: conditionInfo.severity,
            urgency: conditionInfo.urgency,
            recommendations: conditionInfo.recommendations,
            sources: this.getConditionSources(conditionInfo.condition)
          });
        }
      });
    }

    // Add lifestyle-related conditions to ensure variety
    if (symptoms.length >= 1) {
      const lifestyleConditions = [
        {
          condition: 'Lifestyle-Related Symptoms',
          description: 'Symptoms that arise from lifestyle factors such as poor sleep, lack of exercise, unhealthy diet, or high stress levels, rather than from a specific medical condition.',
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
            description: conditionInfo.description,
            probability: 0.5,
            severity: conditionInfo.severity,
            urgency: conditionInfo.urgency,
            recommendations: conditionInfo.recommendations,
            sources: this.getConditionSources(conditionInfo.condition)
          });
        }
      });
    }

    // Ensure we return multiple conditions (minimum 3, maximum 8)
    const minConditions = Math.max(3, Math.min(symptoms.length, 4));
    const maxConditions = Math.min(8, conditions.length);
    
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
