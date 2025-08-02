import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

interface HealthDataContextType {
  healthData: HealthData[];
  insights: HealthInsight[];
  addHealthData: (data: Omit<HealthData, 'id' | 'timestamp'>) => Promise<void>;
  getHealthData: (userId: string) => HealthData[];
  analyzeHealthData: (userId: string) => Promise<HealthInsight>;
  getInsights: (userId: string) => HealthInsight[];
}

const HealthDataContext = createContext<HealthDataContextType | undefined>(undefined);

export const useHealthData = () => {
  const context = useContext(HealthDataContext);
  if (!context) {
    throw new Error('useHealthData must be used within a HealthDataProvider');
  }
  return context;
};

// K-means clustering implementation
class KMeansClusterer {
  private k: number;
  private maxIterations: number;

  constructor(k: number = 3, maxIterations: number = 100) {
    this.k = k;
    this.maxIterations = maxIterations;
  }

  private calculateDistance(point1: number[], point2: number[]): number {
    return Math.sqrt(
      point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0)
    );
  }

  private initializeCentroids(data: number[][]): number[][] {
    const centroids: number[][] = [];
    const dataLength = data.length;
    
    for (let i = 0; i < this.k; i++) {
      const randomIndex = Math.floor(Math.random() * dataLength);
      centroids.push([...data[randomIndex]]);
    }
    
    return centroids;
  }

  private assignToClusters(data: number[][], centroids: number[][]): number[] {
    const assignments: number[] = [];
    
    for (const point of data) {
      let minDistance = Infinity;
      let clusterIndex = 0;
      
      for (let i = 0; i < centroids.length; i++) {
        const distance = this.calculateDistance(point, centroids[i]);
        if (distance < minDistance) {
          minDistance = distance;
          clusterIndex = i;
        }
      }
      
      assignments.push(clusterIndex);
    }
    
    return assignments;
  }

  private updateCentroids(data: number[][], assignments: number[]): number[][] {
    const centroids: number[][] = [];
    const dimensions = data[0].length;
    
    for (let i = 0; i < this.k; i++) {
      const clusterPoints = data.filter((_, index) => assignments[index] === i);
      
      if (clusterPoints.length === 0) {
        // If cluster is empty, initialize with random point
        const randomIndex = Math.floor(Math.random() * data.length);
        centroids.push([...data[randomIndex]]);
      } else {
        const centroid = new Array(dimensions).fill(0);
        
        for (const point of clusterPoints) {
          for (let j = 0; j < dimensions; j++) {
            centroid[j] += point[j];
          }
        }
        
        for (let j = 0; j < dimensions; j++) {
          centroid[j] /= clusterPoints.length;
        }
        
        centroids.push(centroid);
      }
    }
    
    return centroids;
  }

  cluster(data: number[][]): { assignments: number[]; centroids: number[][] } {
    let centroids = this.initializeCentroids(data);
    let assignments: number[] = [];
    
    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      const newAssignments = this.assignToClusters(data, centroids);
      
      // Check for convergence
      if (assignments.length > 0 && 
          JSON.stringify(newAssignments) === JSON.stringify(assignments)) {
        break;
      }
      
      assignments = newAssignments;
      centroids = this.updateCentroids(data, assignments);
    }
    
    return { assignments, centroids };
  }
}

export const HealthDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [insights, setInsights] = useState<HealthInsight[]>([]);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('healthData');
      const storedInsights = await AsyncStorage.getItem('healthInsights');
      
      if (storedData) {
        setHealthData(JSON.parse(storedData).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      }
      
      if (storedInsights) {
        setInsights(JSON.parse(storedInsights).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      }
    } catch (error) {
      console.error('Error loading health data:', error);
    }
  };

  const addHealthData = async (data: Omit<HealthData, 'id' | 'timestamp'>) => {
    try {
      const newHealthData: HealthData = {
        ...data,
        id: Date.now().toString(),
        timestamp: new Date()
      };

      const updatedData = [...healthData, newHealthData];
      setHealthData(updatedData);
      
      await AsyncStorage.setItem('healthData', JSON.stringify(updatedData));
    } catch (error) {
      console.error('Error adding health data:', error);
    }
  };

  const getHealthData = (userId: string): HealthData[] => {
    return healthData.filter(data => data.userId === userId);
  };

  const analyzeHealthData = async (userId: string): Promise<HealthInsight> => {
    const userData = getHealthData(userId);
    
    if (userData.length < 3) {
      // Not enough data for clustering
      return {
        id: Date.now().toString(),
        userId,
        timestamp: new Date(),
        riskLevel: 'low',
        patterns: ['Insufficient data for analysis'],
        recommendations: ['Continue logging health data for better insights'],
        confidence: 0.1
      };
    }

    // Prepare data for clustering
    const clusteringData = userData.map(data => [
      data.severity,
      data.behavior.sleep,
      data.behavior.stress,
      data.behavior.exercise
    ]);

    // Perform K-means clustering
    const clusterer = new KMeansClusterer(3);
    const { assignments, centroids } = clusterer.cluster(clusteringData);

    // Analyze patterns
    const patterns: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let confidence = 0.5;

    // Calculate average severity for each cluster
    const clusterSeverities = new Array(3).fill(0).map(() => ({ sum: 0, count: 0 }));
    
    assignments.forEach((cluster, index) => {
      clusterSeverities[cluster].sum += userData[index].severity;
      clusterSeverities[cluster].count += 1;
    });

    const avgSeverities = clusterSeverities.map(c => c.count > 0 ? c.sum / c.count : 0);
    const maxSeverity = Math.max(...avgSeverities);
    const minSeverity = Math.min(...avgSeverities);

    // Determine risk level based on severity patterns
    if (maxSeverity > 7) {
      riskLevel = 'high';
      patterns.push('High severity symptoms detected');
      recommendations.push('Consider consulting a healthcare provider');
    } else if (maxSeverity > 4) {
      riskLevel = 'medium';
      patterns.push('Moderate severity symptoms observed');
      recommendations.push('Monitor symptoms closely');
    } else {
      riskLevel = 'low';
      patterns.push('Low severity symptoms');
      recommendations.push('Continue current health practices');
    }

    // Analyze sleep patterns
    const avgSleep = userData.reduce((sum, data) => sum + data.behavior.sleep, 0) / userData.length;
    if (avgSleep < 6) {
      patterns.push('Insufficient sleep detected');
      recommendations.push('Aim for 7-9 hours of sleep per night');
    }

    // Analyze stress patterns
    const avgStress = userData.reduce((sum, data) => sum + data.behavior.stress, 0) / userData.length;
    if (avgStress > 7) {
      patterns.push('High stress levels detected');
      recommendations.push('Consider stress management techniques');
    }

    // Calculate confidence based on data consistency
    const severityVariance = userData.reduce((sum, data) => {
      const diff = data.severity - (userData.reduce((s, d) => s + d.severity, 0) / userData.length);
      return sum + diff * diff;
    }, 0) / userData.length;
    
    confidence = Math.max(0.1, Math.min(0.9, 1 - severityVariance / 25));

    const insight: HealthInsight = {
      id: Date.now().toString(),
      userId,
      timestamp: new Date(),
      riskLevel,
      patterns,
      recommendations,
      confidence
    };

    const updatedInsights = [...insights, insight];
    setInsights(updatedInsights);
    await AsyncStorage.setItem('healthInsights', JSON.stringify(updatedInsights));

    return insight;
  };

  const getInsights = (userId: string): HealthInsight[] => {
    return insights.filter(insight => insight.userId === userId);
  };

  const value: HealthDataContextType = {
    healthData,
    insights,
    addHealthData,
    getHealthData,
    analyzeHealthData,
    getInsights
  };

  return (
    <HealthDataContext.Provider value={value}>
      {children}
    </HealthDataContext.Provider>
  );
}; 