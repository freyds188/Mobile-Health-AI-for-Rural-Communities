import React, { createContext, useContext, useState, useEffect } from 'react';
import { dataService, HealthRecord, AnalysisReport } from '../services/DataService';
import { databaseService } from '../services/DatabaseService';
import { useAuth } from './AuthContext';
import ModelDeploymentService from '../services/ModelDeploymentService';
import { MachineLearningService, HealthDataInput } from '../services/MachineLearningService';

export interface HealthData {
  id: string;
  userId: string;
  timestamp: Date;
  symptoms: string[];
  severity: number; // 1-10 scale
  behavior: {
    sleep: number; // hours
    stress: number; // 1-10 scale
    exercise: number; // minutes
    diet: string;
  };
  notes: string;
}

export interface HealthInsight {
  id: string;
  userId: string;
  timestamp: Date;
  riskLevel: 'low' | 'medium' | 'high';
  patterns: string[];
  recommendations: string[];
  confidence: number; // 0-1
  dataPoints: number;
  trendsAnalysis: {
    severityTrend: 'improving' | 'stable' | 'worsening';
    sleepTrend: 'improving' | 'stable' | 'worsening';
    stressTrend: 'improving' | 'stable' | 'worsening';
    exerciseTrend: 'improving' | 'stable' | 'worsening';
  };
}

interface HealthDataContextType {
  healthData: HealthData[];
  insights: HealthInsight[];
  isLoading: boolean;
  addHealthData: (data: Omit<HealthData, 'id' | 'timestamp' | 'userId'>) => Promise<boolean>;
  getHealthData: (userId: string) => HealthData[];
  analyzeHealthData: (userId: string) => Promise<HealthInsight | null>;
  getInsights: (userId: string) => HealthInsight[];
  refreshData: () => Promise<void>;
  // New deployed model features
  deployModel: () => Promise<boolean>;
  getModelInfo: () => any;
  getPredictionStats: () => any;
  triggerModelRetraining: () => Promise<boolean>;
}

const HealthDataContext = createContext<HealthDataContextType | undefined>(undefined);

export const useHealthData = () => {
  const context = useContext(HealthDataContext);
  if (!context) {
    throw new Error('useHealthData must be used within a HealthDataProvider');
  }
  return context;
};

export const HealthDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize ML services
  const [deploymentService] = useState(new ModelDeploymentService());
  const [mlService] = useState(new MachineLearningService());

  useEffect(() => {
    if (user) {
      loadHealthData();
    } else {
      // Clear data when user logs out
      setHealthData([]);
      setInsights([]);
    }
  }, [user]);

  const loadHealthData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('🔄 Loading health data for user:', user.id);
      
      // Load health records
      const records = await dataService.getHealthData(user.id);
      console.log('📊 Loaded health records from database:', records.length);
      
      const formattedRecords: HealthData[] = records.map(record => ({
        id: record.id,
        userId: record.userId,
        timestamp: record.timestamp,
        symptoms: record.symptoms,
        severity: record.severity,
        behavior: record.behavior,
        notes: record.notes
      }));
      
      setHealthData(formattedRecords);
      console.log('✅ Health data loaded and set in context');
      
      // Load existing insights from database
      try {
        const dbInsights = await databaseService.getHealthInsights(user.id);
        console.log('🧠 Loaded insights from database:', dbInsights.length);
        
        const formattedInsights: HealthInsight[] = dbInsights.map(insight => ({
          id: insight.id,
          userId: insight.userId,
          timestamp: new Date(insight.timestamp),
          riskLevel: insight.riskLevel,
          patterns: JSON.parse(insight.patterns),
          recommendations: JSON.parse(insight.recommendations),
          confidence: insight.confidence,
          dataPoints: 0, // Will be calculated when needed
          trendsAnalysis: {
            severityTrend: 'stable',
            sleepTrend: 'stable',
            stressTrend: 'stable',
            exerciseTrend: 'stable'
          }
        }));
        
        setInsights(formattedInsights);
        console.log('✅ Insights loaded and set in context');
      } catch (insightError) {
        console.warn('⚠️ Failed to load insights:', insightError);
        // Continue without insights if they fail to load
      }
      
    } catch (error) {
      console.error('❌ Error loading health data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addHealthData = async (data: Omit<HealthData, 'id' | 'timestamp' | 'userId'>): Promise<boolean> => {
    if (!user) {
      console.error('❌ No user logged in');
      return false;
    }

    try {
      setIsLoading(true);
      console.log('📊 Adding health data for user:', user.id);
      console.log('📋 Health data input:', data);
      
      // Prepare health data for database (matching DatabaseService interface)
      const healthDataForDB = {
        userId: user.id,
        timestamp: new Date().toISOString(),
        symptoms: JSON.stringify(data.symptoms), // Store as JSON string
        severity: data.severity,
        sleep: data.behavior.sleep,
        stress: data.behavior.stress,
        exercise: data.behavior.exercise,
        diet: data.behavior.diet,
        notes: data.notes || ''
      };

      console.log('💾 Saving to database with data:', healthDataForDB);

      // Save directly to DatabaseService to avoid data transformation issues
      const recordId = await databaseService.saveHealthData(healthDataForDB);
      
      console.log('✅ Health data saved with ID:', recordId);
      
      if (recordId) {
        // Add to local state
        const newRecord: HealthData = {
          id: recordId,
          userId: user.id,
          timestamp: new Date(),
          symptoms: data.symptoms,
          severity: data.severity,
          behavior: data.behavior,
          notes: data.notes
        };
        
        setHealthData(prev => {
          const updated = [...prev, newRecord];
          console.log('📊 Updated local health data count:', updated.length);
          return updated;
        });

        // Refresh data from database to ensure consistency
        try {
          console.log('🔄 Refreshing data from database...');
          await refreshData();
        } catch (refreshError) {
          console.warn('⚠️ Data refresh failed:', refreshError);
          // Continue with local state update if refresh fails
        }

        // Also trigger ML analysis for immediate feedback
        try {
          console.log('🧠 Triggering ML analysis...');
          await analyzeHealthData(user.id);
        } catch (mlError) {
          console.warn('⚠️ ML analysis failed:', mlError);
          // Don't fail the whole operation if ML analysis fails
        }

        return true;
      }
      
      console.error('❌ Failed to save health data - no record ID returned');
      return false;
    } catch (error) {
      console.error('❌ Error adding health data:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthData = (userId: string): HealthData[] => {
    return healthData.filter(data => data.userId === userId);
  };

  const analyzeHealthData = async (userId: string): Promise<HealthInsight | null> => {
    if (!user || user.id !== userId) {
      console.warn('⚠️ No user or user ID mismatch for analysis');
      return null;
    }

    try {
      setIsLoading(true);
      console.log('🧠 Starting health data analysis for user:', userId);
      
      // Get user's health data
      const userHealthData = healthData.filter(data => data.userId === userId);
      console.log('📊 Found health records for analysis:', userHealthData.length);
      
      if (userHealthData.length === 0) {
        console.log('⚠️ No health data available for analysis');
        return null;
      }

      // Use the most recent health record for deployed model assessment
      const mostRecentData = userHealthData.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];

      console.log('📋 Most recent health data:', mostRecentData);

      // Convert to ML format
      const healthDataForML: HealthDataInput = {
        symptoms: mostRecentData.symptoms,
        severity: mostRecentData.severity,
        sleep: mostRecentData.behavior.sleep,
        stress: mostRecentData.behavior.stress,
        exercise: mostRecentData.behavior.exercise,
        diet: mostRecentData.behavior.diet,
        notes: mostRecentData.notes,
        timestamp: mostRecentData.timestamp
      };

      console.log('🤖 Sending to ML service:', healthDataForML);

      // Use ML service for analysis (will use deployed model if available)
      const mlResult = await mlService.analyzeHealthData(userId, [healthDataForML]);
      
      console.log('🎯 ML analysis result:', mlResult);

      // Calculate trends from all user data
      const trendsAnalysis = calculateTrends(userHealthData);

      // Create insight from ML result
      const insight: HealthInsight = {
        id: mlResult.id,
        userId: mlResult.userId,
        timestamp: mlResult.timestamp,
        riskLevel: mlResult.riskLevel,
        patterns: mlResult.patterns,
        recommendations: mlResult.recommendations,
        confidence: mlResult.confidence,
        dataPoints: userHealthData.length,
        trendsAnalysis
      };
      
      console.log('💡 Generated insight:', insight);
      
      // Add to local insights
      setInsights(prev => {
        const filtered = prev.filter(i => i.userId !== userId || i.id !== insight.id);
        const updated = [...filtered, insight];
        console.log('📊 Updated insights count:', updated.length);
        return updated;
      });

      return insight;
    } catch (error) {
      console.error('❌ Error analyzing health data:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getInsights = (userId: string): HealthInsight[] => {
    return insights.filter(insight => insight.userId === userId);
  };

  const refreshData = async () => {
    if (user) {
      console.log('🔄 Refreshing health data for user:', user.id);
      await loadHealthData();
      console.log('✅ Health data refresh completed');
      console.log('📊 Current health data count in context:', healthData.length);
      console.log('🧠 Current insights count in context:', insights.length);
    }
  };

  // Helper function to calculate trends from health data
  const calculateTrends = (userHealthData: HealthData[]) => {
    if (userHealthData.length < 2) {
      return {
        severityTrend: 'stable' as const,
        sleepTrend: 'stable' as const,
        stressTrend: 'stable' as const,
        exerciseTrend: 'stable' as const
      };
    }

    // Sort by timestamp to get chronological order
    const sortedData = [...userHealthData].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Get recent half vs older half for trend calculation
    const midPoint = Math.floor(sortedData.length / 2);
    const olderData = sortedData.slice(0, midPoint);
    const recentData = sortedData.slice(midPoint);

    const calculateTrend = (older: number[], recent: number[]) => {
      const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
      const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      const diff = recentAvg - olderAvg;
      
      if (Math.abs(diff) < 0.5) return 'stable';
      return diff > 0 ? 'worsening' : 'improving';
    };

    return {
      severityTrend: calculateTrend(
        olderData.map(d => d.severity),
        recentData.map(d => d.severity)
      ) as 'improving' | 'stable' | 'worsening',
      sleepTrend: calculateTrend(
        olderData.map(d => d.behavior.sleep),
        recentData.map(d => d.behavior.sleep)
      ) as 'improving' | 'stable' | 'worsening',
      stressTrend: calculateTrend(
        olderData.map(d => d.behavior.stress),
        recentData.map(d => d.behavior.stress)
      ) as 'improving' | 'stable' | 'worsening',
      exerciseTrend: calculateTrend(
        olderData.map(d => d.behavior.exercise),
        recentData.map(d => d.behavior.exercise)
      ) as 'improving' | 'stable' | 'worsening'
    };
  };

  // New deployed model methods
  const deployModel = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('🚀 Deploying model from HealthDataContext...');
      
      // Import training service
      const { default: MLTrainingService } = await import('../services/MLTrainingService');
      const trainingService = new MLTrainingService();
      
      // Train a hybrid model with best performance
      const trainingResult = await trainingService.trainHybridModel();
      
      // Deploy the trained model
      await deploymentService.deployModel(trainingResult);
      
      console.log('✅ Model deployed successfully from context');
      return true;
      
    } catch (error) {
      console.error('❌ Model deployment failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getModelInfo = () => {
    return deploymentService.getDeployedModelInfo();
  };

  const getPredictionStats = () => {
    return deploymentService.getPredictionStats();
  };

  const triggerModelRetraining = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('🔄 Triggering model retraining from context...');
      
      const result = await deploymentService.triggerRetraining();
      
      if (result.success) {
        console.log('✅ Model retrained successfully');
        // Refresh insights with new model
        if (user) {
          await analyzeHealthData(user.id);
        }
      }
      
      return result.success;
      
    } catch (error) {
      console.error('❌ Model retraining failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value: HealthDataContextType = {
    healthData,
    insights,
    isLoading,
    addHealthData,
    getHealthData,
    analyzeHealthData,
    getInsights,
    refreshData,
    // New deployed model features
    deployModel,
    getModelInfo,
    getPredictionStats,
    triggerModelRetraining
  };

  return (
    <HealthDataContext.Provider value={value}>
      {children}
    </HealthDataContext.Provider>
  );
};