import { v4 as uuidv4 } from 'uuid';

export interface FeatureVector {
  id: string;
  userId: string;
  timestamp: Date;
  features: number[];
  featureNames: string[];
  rawData: any;
}

export interface ClusterResult {
  clusterId: number;
  centroid: number[];
  members: FeatureVector[];
  inertia: number;
  silhouetteScore: number;
}

export interface MLAnalysisResult {
  id: string;
  userId: string;
  timestamp: Date;
  algorithm: string;
  version: string;
  clusters: ClusterResult[];
  optimalK: number;
  riskLevel: 'low' | 'medium' | 'high';
  patterns: string[];
  recommendations: string[];
  confidence: number;
  featureImportance: { [key: string]: number };
  anomalies: FeatureVector[];
}

export interface HealthDataInput {
  symptoms: string[];
  severity: number;
  sleep: number;
  stress: number;
  exercise: number;
  diet: string;
  notes: string;
  timestamp: Date;
}

class AdvancedKMeans {
  private k: number;
  private maxIterations: number;
  private tolerance: number;
  private initMethod: 'random' | 'kmeans++';

  constructor(
    k: number = 3,
    maxIterations: number = 300,
    tolerance: number = 1e-4,
    initMethod: 'random' | 'kmeans++' = 'kmeans++'
  ) {
    this.k = k;
    this.maxIterations = maxIterations;
    this.tolerance = tolerance;
    this.initMethod = initMethod;
  }

  private euclideanDistance(point1: number[], point2: number[]): number {
    return Math.sqrt(
      point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0)
    );
  }

  private manhattanDistance(point1: number[], point2: number[]): number {
    return point1.reduce((sum, val, i) => sum + Math.abs(val - point2[i]), 0);
  }

  private cosineDistance(point1: number[], point2: number[]): number {
    const dotProduct = point1.reduce((sum, val, i) => sum + val * point2[i], 0);
    const magnitude1 = Math.sqrt(point1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(point2.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitude1 === 0 || magnitude2 === 0) return 1;
    return 1 - (dotProduct / (magnitude1 * magnitude2));
  }

  private initializeCentroids(data: number[][], method: 'random' | 'kmeans++' = 'kmeans++'): number[][] {
    const centroids: number[][] = [];
    const dataLength = data.length;
    const dimensions = data[0].length;

    if (method === 'random') {
      for (let i = 0; i < this.k; i++) {
        const randomIndex = Math.floor(Math.random() * dataLength);
        centroids.push([...data[randomIndex]]);
      }
    } else if (method === 'kmeans++') {
      // K-means++ initialization for better convergence
      const randomIndex = Math.floor(Math.random() * dataLength);
      centroids.push([...data[randomIndex]]);

      for (let i = 1; i < this.k; i++) {
        const distances: number[] = [];
        let totalDistance = 0;

        for (const point of data) {
          let minDistance = Infinity;
          for (const centroid of centroids) {
            const distance = this.euclideanDistance(point, centroid);
            minDistance = Math.min(minDistance, distance);
          }
          distances.push(minDistance * minDistance);
          totalDistance += minDistance * minDistance;
        }

        const random = Math.random() * totalDistance;
        let cumulativeDistance = 0;
        
        for (let j = 0; j < data.length; j++) {
          cumulativeDistance += distances[j];
          if (cumulativeDistance >= random) {
            centroids.push([...data[j]]);
            break;
          }
        }
      }
    }

    return centroids;
  }

  private assignToClusters(data: number[][], centroids: number[][]): number[] {
    const assignments: number[] = [];

    for (const point of data) {
      let minDistance = Infinity;
      let clusterIndex = 0;

      for (let i = 0; i < centroids.length; i++) {
        const distance = this.euclideanDistance(point, centroids[i]);
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
        // If cluster is empty, reinitialize with random point
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

  private calculateInertia(data: number[][], assignments: number[], centroids: number[][]): number {
    let inertia = 0;

    for (let i = 0; i < data.length; i++) {
      const clusterIndex = assignments[i];
      const distance = this.euclideanDistance(data[i], centroids[clusterIndex]);
      inertia += distance * distance;
    }

    return inertia;
  }

  private calculateSilhouetteScore(data: number[][], assignments: number[]): number {
    if (this.k === 1) return 0;

    const silhouetteScores: number[] = [];

    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      const cluster = assignments[i];

      // Calculate average distance to points in same cluster (a)
      const sameClusterPoints = data.filter((_, index) => assignments[index] === cluster && index !== i);
      const a = sameClusterPoints.length > 0
        ? sameClusterPoints.reduce((sum, otherPoint) => sum + this.euclideanDistance(point, otherPoint), 0) / sameClusterPoints.length
        : 0;

      // Calculate minimum average distance to points in other clusters (b)
      let b = Infinity;
      for (let otherCluster = 0; otherCluster < this.k; otherCluster++) {
        if (otherCluster === cluster) continue;

        const otherClusterPoints = data.filter((_, index) => assignments[index] === otherCluster);
        if (otherClusterPoints.length > 0) {
          const avgDistance = otherClusterPoints.reduce((sum, otherPoint) => sum + this.euclideanDistance(point, otherPoint), 0) / otherClusterPoints.length;
          b = Math.min(b, avgDistance);
        }
      }

      const silhouette = b === Infinity ? 0 : (b - a) / Math.max(a, b);
      silhouetteScores.push(silhouette);
    }

    return silhouetteScores.reduce((sum, score) => sum + score, 0) / silhouetteScores.length;
  }

  cluster(data: number[][]): { assignments: number[]; centroids: number[][]; inertia: number; silhouetteScore: number; iterations: number } {
    if (data.length === 0) {
      throw new Error('Cannot cluster empty data');
    }

    if (this.k > data.length) {
      throw new Error('K cannot be greater than the number of data points');
    }

    let centroids = this.initializeCentroids(data, this.initMethod);
    let assignments: number[] = [];
    let previousInertia = Infinity;
    let iterations = 0;

    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      const newAssignments = this.assignToClusters(data, centroids);
      const newCentroids = this.updateCentroids(data, newAssignments);
      const inertia = this.calculateInertia(data, newAssignments, newCentroids);

      // Check for convergence
      if (Math.abs(previousInertia - inertia) < this.tolerance) {
        assignments = newAssignments;
        centroids = newCentroids;
        iterations = iteration + 1;
        break;
      }

      assignments = newAssignments;
      centroids = newCentroids;
      previousInertia = inertia;
      iterations = iteration + 1;
    }

    const finalInertia = this.calculateInertia(data, assignments, centroids);
    const silhouetteScore = this.calculateSilhouetteScore(data, assignments);

    return {
      assignments,
      centroids,
      inertia: finalInertia,
      silhouetteScore,
      iterations
    };
  }
}

class FeatureEngineer {
  static extractFeatures(healthData: HealthDataInput[]): FeatureVector[] {
    return healthData.map((data, index) => {
      const features = [
        // Basic features
        data.severity,
        data.sleep,
        data.stress,
        data.exercise,

        // Symptom-based features
        data.symptoms.length,
        this.calculateSymptomSeverityScore(data.symptoms),
        this.calculateSymptomDiversityScore(data.symptoms),

        // Temporal features
        this.getTimeOfDayScore(data.timestamp),
        this.getDayOfWeekScore(data.timestamp),

        // Derived features
        this.calculateSleepStressRatio(data.sleep, data.stress),
        this.calculateExerciseSeverityRatio(data.exercise, data.severity),
        this.calculateLifestyleScore(data.sleep, data.stress, data.exercise),

        // Diet features
        this.getDietQualityScore(data.diet),

        // Text-based features
        this.getNotesComplexityScore(data.notes)
      ];

      const featureNames = [
        'severity', 'sleep', 'stress', 'exercise',
        'symptom_count', 'symptom_severity_score', 'symptom_diversity',
        'time_of_day_score', 'day_of_week_score',
        'sleep_stress_ratio', 'exercise_severity_ratio', 'lifestyle_score',
        'diet_quality', 'notes_complexity'
      ];

      return {
        id: uuidv4(),
        userId: '', // Will be set by the calling function
        timestamp: data.timestamp,
        features,
        featureNames,
        rawData: data
      };
    });
  }

  private static calculateSymptomSeverityScore(symptoms: string[]): number {
    const severityWeights: { [key: string]: number } = {
      'chest pain': 10,
      'shortness of breath': 9,
      'severe headache': 8,
      'high fever': 8,
      'nausea': 6,
      'fatigue': 5,
      'mild headache': 3,
      'cough': 4,
      'dizziness': 6,
      'abdominal pain': 7
    };

    return symptoms.reduce((total, symptom) => {
      return total + (severityWeights[symptom.toLowerCase()] || 5);
    }, 0) / Math.max(symptoms.length, 1);
  }

  private static calculateSymptomDiversityScore(symptoms: string[]): number {
    const categories: { [key: string]: string[] } = {
      'respiratory': ['cough', 'shortness of breath', 'wheezing'],
      'neurological': ['headache', 'dizziness', 'fatigue'],
      'cardiovascular': ['chest pain', 'heart palpitations'],
      'gastrointestinal': ['nausea', 'abdominal pain', 'vomiting'],
      'general': ['fever', 'pain', 'weakness']
    };

    const affectedCategories = new Set<string>();
    
    symptoms.forEach(symptom => {
      Object.entries(categories).forEach(([category, categorySymptoms]) => {
        if (categorySymptoms.some(catSymptom => symptom.toLowerCase().includes(catSymptom))) {
          affectedCategories.add(category);
        }
      });
    });

    return affectedCategories.size;
  }

  private static getTimeOfDayScore(timestamp: Date): number {
    const hour = timestamp.getHours();
    // Score based on typical health pattern times
    if (hour >= 6 && hour <= 12) return 1; // Morning
    if (hour >= 13 && hour <= 18) return 2; // Afternoon
    if (hour >= 19 && hour <= 23) return 3; // Evening
    return 4; // Night
  }

  private static getDayOfWeekScore(timestamp: Date): number {
    const day = timestamp.getDay();
    // Weekend vs weekday pattern
    return day === 0 || day === 6 ? 1 : 0;
  }

  private static calculateSleepStressRatio(sleep: number, stress: number): number {
    if (stress === 0) return sleep;
    return sleep / stress;
  }

  private static calculateExerciseSeverityRatio(exercise: number, severity: number): number {
    if (severity === 0) return exercise;
    return exercise / severity;
  }

  private static calculateLifestyleScore(sleep: number, stress: number, exercise: number): number {
    // Weighted lifestyle score
    const sleepScore = Math.min(sleep / 8, 1) * 0.4; // Optimal 8 hours
    const stressScore = (10 - stress) / 10 * 0.3; // Lower stress is better
    const exerciseScore = Math.min(exercise / 60, 1) * 0.3; // 60 minutes optimal
    
    return sleepScore + stressScore + exerciseScore;
  }

  private static getDietQualityScore(diet: string): number {
    const dietLower = diet.toLowerCase();
    const healthyKeywords = ['vegetables', 'fruits', 'whole grain', 'lean protein', 'water', 'healthy'];
    const unhealthyKeywords = ['fast food', 'junk', 'processed', 'sugar', 'soda', 'fried'];
    
    let score = 5; // Neutral baseline
    
    healthyKeywords.forEach(keyword => {
      if (dietLower.includes(keyword)) score += 1;
    });
    
    unhealthyKeywords.forEach(keyword => {
      if (dietLower.includes(keyword)) score -= 1;
    });
    
    return Math.max(0, Math.min(10, score));
  }

  private static getNotesComplexityScore(notes: string): number {
    if (!notes) return 0;
    
    const wordCount = notes.split(/\s+/).length;
    const sentenceCount = notes.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);
    
    // Complexity based on length and structure
    return Math.min(wordCount * 0.1 + avgWordsPerSentence * 0.2, 10);
  }

  static normalizeFeatures(features: FeatureVector[]): FeatureVector[] {
    if (features.length === 0) return [];

    const numFeatures = features[0].features.length;
    const means = new Array(numFeatures).fill(0);
    const stds = new Array(numFeatures).fill(0);

    // Calculate means
    for (const feature of features) {
      for (let i = 0; i < numFeatures; i++) {
        means[i] += feature.features[i];
      }
    }
    for (let i = 0; i < numFeatures; i++) {
      means[i] /= features.length;
    }

    // Calculate standard deviations
    for (const feature of features) {
      for (let i = 0; i < numFeatures; i++) {
        stds[i] += Math.pow(feature.features[i] - means[i], 2);
      }
    }
    for (let i = 0; i < numFeatures; i++) {
      stds[i] = Math.sqrt(stds[i] / features.length);
    }

    // Normalize features
    return features.map(feature => ({
      ...feature,
      features: feature.features.map((value, i) => 
        stds[i] === 0 ? 0 : (value - means[i]) / stds[i]
      )
    }));
  }
}

class AnomalyDetector {
  static detectAnomalies(features: FeatureVector[], threshold: number = 2.5): FeatureVector[] {
    if (features.length < 3) return [];

    const anomalies: FeatureVector[] = [];
    const numFeatures = features[0].features.length;

    // Calculate z-scores for each feature
    for (let featureIndex = 0; featureIndex < numFeatures; featureIndex++) {
      const values = features.map(f => f.features[featureIndex]);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const std = Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
      );

      if (std === 0) continue;

      features.forEach(feature => {
        const zScore = Math.abs((feature.features[featureIndex] - mean) / std);
        if (zScore > threshold && !anomalies.some(a => a.id === feature.id)) {
          anomalies.push(feature);
        }
      });
    }

    return anomalies;
  }
}

export class MachineLearningService {
  private version = '2.0.0';
  private deploymentService: any; // Will be imported dynamically to avoid circular dependencies

  constructor() {
    this.initializeDeploymentService();
  }

  private async initializeDeploymentService() {
    try {
      const { default: ModelDeploymentService } = await import('./ModelDeploymentService');
      this.deploymentService = new ModelDeploymentService();
    } catch (error) {
      console.warn('Could not initialize deployment service:', error);
    }
  }

  async findOptimalK(features: FeatureVector[], maxK: number = 10): Promise<number> {
    if (features.length < 2) return 1;

    const data = features.map(f => f.features);
    const maxPossibleK = Math.min(maxK, Math.floor(features.length / 2));
    const silhouetteScores: number[] = [];

    for (let k = 2; k <= maxPossibleK; k++) {
      const kmeans = new AdvancedKMeans(k, 100, 1e-4, 'kmeans++');
      const result = kmeans.cluster(data);
      silhouetteScores.push(result.silhouetteScore);
    }

    // Find K with highest silhouette score
    let optimalK = 2;
    let maxScore = -1;

    silhouetteScores.forEach((score, index) => {
      if (score > maxScore) {
        maxScore = score;
        optimalK = index + 2;
      }
    });

    return optimalK;
  }

  async analyzeHealthData(userId: string, healthData: HealthDataInput[]): Promise<MLAnalysisResult> {
    if (healthData.length < 3) {
      return this.createInsufficientDataResult(userId);
    }

    try {
      // Check if we have a deployed model for faster prediction
      if (this.deploymentService && healthData.length === 1) {
        return await this.analyzeWithDeployedModel(userId, healthData[0]);
      }

      // Fall back to full clustering analysis for multiple data points
      return await this.performFullAnalysis(userId, healthData);

    } catch (error) {
      console.error('ML Analysis failed:', error);
      return this.createErrorResult(userId, error);
    }
  }

  /**
   * Fast analysis using deployed model (for single health data point)
   */
  private async analyzeWithDeployedModel(userId: string, healthData: HealthDataInput): Promise<MLAnalysisResult> {
    try {
      console.log('🚀 Using deployed model for fast risk assessment...');
      
      const modelInfo = this.deploymentService.getDeployedModelInfo();
      if (!modelInfo.isDeployed) {
        console.log('⚠️ No deployed model available, falling back to full analysis');
        return await this.performFullAnalysis(userId, [healthData]);
      }

      // Get risk assessment from deployed model
      const riskAssessment = await this.deploymentService.assessHealthRisk(healthData);
      
      // Convert to MLAnalysisResult format
      return {
        id: uuidv4(),
        userId,
        timestamp: new Date(),
        algorithm: `Deployed Model v${modelInfo.version}`,
        version: this.version,
        clusters: [{
          clusterId: riskAssessment.primaryCluster,
          centroid: [],
          members: [],
          inertia: 0,
          silhouetteScore: riskAssessment.confidence
        }],
        optimalK: modelInfo.clusters || 5,
        riskLevel: riskAssessment.overallRisk,
        patterns: [
          `Primary risk cluster: ${riskAssessment.primaryCluster}`,
          `Risk score: ${riskAssessment.riskScore}/100`,
          `Severity risk: ${riskAssessment.severityRisk}%`,
          `Lifestyle risk: ${riskAssessment.lifestyleRisk}%`,
          `Symptom risk: ${riskAssessment.symptomRisk}%`
        ],
        recommendations: [
          ...riskAssessment.immediateActions,
          ...riskAssessment.preventativeActions
        ],
        confidence: riskAssessment.confidence,
        featureImportance: {},
        anomalies: [],
        // Additional deployed model specific data
        deployedModelAssessment: riskAssessment
      };

    } catch (error) {
      console.warn('Deployed model analysis failed, falling back to full analysis:', error);
      return await this.performFullAnalysis(userId, [healthData]);
    }
  }

  /**
   * Full clustering analysis (original method)
   */
  private async performFullAnalysis(userId: string, healthData: HealthDataInput[]): Promise<MLAnalysisResult> {
    console.log('🧠 Performing full K-means clustering analysis...');
    
    // Feature extraction and normalization
    let features = FeatureEngineer.extractFeatures(healthData);
    features = features.map(f => ({ ...f, userId }));
    const normalizedFeatures = FeatureEngineer.normalizeFeatures(features);

    // Find optimal K
    const optimalK = await this.findOptimalK(normalizedFeatures);

    // Perform clustering
    const kmeans = new AdvancedKMeans(optimalK, 300, 1e-4, 'kmeans++');
    const data = normalizedFeatures.map(f => f.features);
    const clusterResult = kmeans.cluster(data);

    // Create cluster results
    const clusters: ClusterResult[] = [];
    for (let i = 0; i < optimalK; i++) {
      const members = normalizedFeatures.filter((_, index) => clusterResult.assignments[index] === i);
      clusters.push({
        clusterId: i,
        centroid: clusterResult.centroids[i],
        members,
        inertia: this.calculateClusterInertia(members, clusterResult.centroids[i]),
        silhouetteScore: clusterResult.silhouetteScore
      });
    }

    // Detect anomalies
    const anomalies = AnomalyDetector.detectAnomalies(normalizedFeatures);

    // Calculate feature importance
    const featureImportance = this.calculateFeatureImportance(normalizedFeatures, clusterResult.assignments);

    // Risk assessment
    const { riskLevel, patterns, recommendations, confidence } = this.assessRisk(
      clusters, 
      normalizedFeatures, 
      anomalies,
      featureImportance
    );

    return {
      id: uuidv4(),
      userId,
      timestamp: new Date(),
      algorithm: 'Advanced K-Means with Feature Engineering',
      version: this.version,
      clusters,
      optimalK,
      riskLevel,
      patterns,
      recommendations,
      confidence,
      featureImportance,
      anomalies
    };
  }

  private calculateClusterInertia(members: FeatureVector[], centroid: number[]): number {
    return members.reduce((sum, member) => {
      const distance = Math.sqrt(
        member.features.reduce((distSum, val, i) => distSum + Math.pow(val - centroid[i], 2), 0)
      );
      return sum + distance * distance;
    }, 0);
  }

  private calculateFeatureImportance(features: FeatureVector[], assignments: number[]): { [key: string]: number } {
    if (features.length === 0) return {};

    const featureNames = features[0].featureNames;
    const importance: { [key: string]: number } = {};

    // Calculate variance for each feature across clusters
    featureNames.forEach((name, index) => {
      const uniqueClusters = [...new Set(assignments)];
      let totalVariance = 0;

      uniqueClusters.forEach(cluster => {
        const clusterFeatures = features
          .filter((_, i) => assignments[i] === cluster)
          .map(f => f.features[index]);
        
        if (clusterFeatures.length > 1) {
          const mean = clusterFeatures.reduce((sum, val) => sum + val, 0) / clusterFeatures.length;
          const variance = clusterFeatures.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / clusterFeatures.length;
          totalVariance += variance;
        }
      });

      importance[name] = totalVariance / uniqueClusters.length;
    });

    // Normalize importance scores
    const maxImportance = Math.max(...Object.values(importance));
    if (maxImportance > 0) {
      Object.keys(importance).forEach(key => {
        importance[key] = importance[key] / maxImportance;
      });
    }

    return importance;
  }

  private assessRisk(
    clusters: ClusterResult[], 
    features: FeatureVector[], 
    anomalies: FeatureVector[],
    featureImportance: { [key: string]: number }
  ): { riskLevel: 'low' | 'medium' | 'high'; patterns: string[]; recommendations: string[]; confidence: number } {
    
    const patterns: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let confidence = 0.7;

    // Analyze severity patterns
    const avgSeverity = features.reduce((sum, f) => sum + f.rawData.severity, 0) / features.length;
    if (avgSeverity > 7) {
      riskLevel = 'high';
      patterns.push('Consistently high symptom severity detected');
      recommendations.push('Immediate medical consultation recommended');
      confidence = Math.min(confidence + 0.2, 0.95);
    } else if (avgSeverity > 4) {
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      patterns.push('Moderate symptom severity observed');
      recommendations.push('Monitor symptoms and consider medical advice');
    }

    // Analyze sleep patterns
    const avgSleep = features.reduce((sum, f) => sum + f.rawData.sleep, 0) / features.length;
    if (avgSleep < 6) {
      patterns.push('Chronic sleep deprivation detected');
      recommendations.push('Prioritize improving sleep hygiene and duration');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Analyze stress patterns
    const avgStress = features.reduce((sum, f) => sum + f.rawData.stress, 0) / features.length;
    if (avgStress > 7) {
      patterns.push('Elevated stress levels detected');
      recommendations.push('Consider stress management techniques and relaxation practices');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Analyze exercise patterns
    const avgExercise = features.reduce((sum, f) => sum + f.rawData.exercise, 0) / features.length;
    if (avgExercise < 30) {
      patterns.push('Insufficient physical activity detected');
      recommendations.push('Gradually increase physical activity to 150+ minutes per week');
    }

    // Anomaly analysis
    if (anomalies.length > features.length * 0.1) {
      patterns.push('Irregular health patterns detected');
      recommendations.push('Track symptoms more closely and note triggers');
      confidence = Math.max(confidence - 0.1, 0.5);
    }

    // Cluster analysis
    if (clusters.length > 0) {
      const largestCluster = clusters.reduce((max, cluster) => 
        cluster.members.length > max.members.length ? cluster : max
      );

      if (largestCluster.members.length < features.length * 0.5) {
        patterns.push('Diverse health patterns with no dominant trend');
        confidence = Math.max(confidence - 0.1, 0.5);
      }
    }

    // Feature importance analysis
    const topFeatures = Object.entries(featureImportance)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    if (topFeatures.length > 0) {
      patterns.push(`Primary health factors: ${topFeatures.map(([name]) => name).join(', ')}`);
    }

    // Adjust confidence based on data quality
    if (features.length < 10) {
      confidence = Math.max(confidence - 0.2, 0.3);
      patterns.push('Limited data available for analysis');
      recommendations.push('Continue logging health data for better insights');
    }

    return { riskLevel, patterns, recommendations, confidence };
  }

  private createInsufficientDataResult(userId: string): MLAnalysisResult {
    return {
      id: uuidv4(),
      userId,
      timestamp: new Date(),
      algorithm: 'Advanced K-Means with Feature Engineering',
      version: this.version,
      clusters: [],
      optimalK: 1,
      riskLevel: 'low',
      patterns: ['Insufficient data for meaningful analysis'],
      recommendations: ['Continue logging health data regularly for better insights'],
      confidence: 0.1,
      featureImportance: {},
      anomalies: []
    };
  }

  private createErrorResult(userId: string, error: any): MLAnalysisResult {
    return {
      id: uuidv4(),
      userId,
      timestamp: new Date(),
      algorithm: 'Advanced K-Means with Feature Engineering',
      version: this.version,
      clusters: [],
      optimalK: 1,
      riskLevel: 'low',
      patterns: ['Analysis error occurred'],
      recommendations: ['Please try again or contact support'],
      confidence: 0.0,
      featureImportance: {},
      anomalies: []
    };
  }

  async validateModel(features: FeatureVector[]): Promise<{ isValid: boolean; metrics: any }> {
    if (features.length < 10) {
      return { isValid: false, metrics: { reason: 'Insufficient data for validation' } };
    }

    try {
      // Perform cross-validation
      const folds = 5;
      const foldSize = Math.floor(features.length / folds);
      const silhouetteScores: number[] = [];

      for (let i = 0; i < folds; i++) {
        const start = i * foldSize;
        const end = i === folds - 1 ? features.length : start + foldSize;
        const testData = features.slice(start, end);
        const trainData = [...features.slice(0, start), ...features.slice(end)];

        if (trainData.length > 2) {
          const optimalK = await this.findOptimalK(trainData);
          const kmeans = new AdvancedKMeans(optimalK);
          const data = trainData.map(f => f.features);
          const result = kmeans.cluster(data);
          silhouetteScores.push(result.silhouetteScore);
        }
      }

      const avgSilhouette = silhouetteScores.reduce((sum, score) => sum + score, 0) / silhouetteScores.length;
      const isValid = avgSilhouette > 0.3; // Threshold for acceptable clustering

      return {
        isValid,
        metrics: {
          avgSilhouetteScore: avgSilhouette,
          crossValidationFolds: folds,
          threshold: 0.3
        }
      };

    } catch (error) {
      return { isValid: false, metrics: { error: error instanceof Error ? error.message : String(error) } };
    }
  }

  async performKMeansClustering(data: any[], k: number = 3): Promise<number[]> {
    try {
      console.log('🔍 MLService: Performing K-means clustering with k =', k);
      
      if (data.length === 0) {
        console.warn('⚠️ MLService: No data provided for clustering');
        return [];
      }

      // Extract features for clustering
      const features = data.map(item => [
        item.severity || 0,
        item.symptomCount || 0,
        item.symptomDiversity || 0,
        item.frequency || 0
      ]);

      // Normalize features
      const normalizedFeatures = this.normalizeFeaturesForClustering(features);

      // Perform clustering
      const kmeans = new AdvancedKMeans(k, 300, 1e-4, 'kmeans++');
      const result = kmeans.cluster(normalizedFeatures);

      console.log('✅ MLService: K-means clustering completed successfully');
      console.log('📊 MLService: Clustering metrics - Inertia:', result.inertia, 'Silhouette:', result.silhouetteScore);

      return result.assignments;
    } catch (error) {
      console.error('❌ MLService: K-means clustering failed:', error);
      // Return default cluster assignments if clustering fails
      return data.map((_, index) => index % k);
    }
  }

  private normalizeFeaturesForClustering(features: number[][]): number[][] {
    if (features.length === 0) return features;

    const dimensions = features[0].length;
    const normalized: number[][] = [];

    // Calculate min and max for each dimension
    const mins: number[] = new Array(dimensions).fill(Infinity);
    const maxs: number[] = new Array(dimensions).fill(-Infinity);

    features.forEach(feature => {
      feature.forEach((value, dim) => {
        mins[dim] = Math.min(mins[dim], value);
        maxs[dim] = Math.max(maxs[dim], value);
      });
    });

    // Normalize features to [0, 1] range
    features.forEach(feature => {
      const normalizedFeature = feature.map((value, dim) => {
        const range = maxs[dim] - mins[dim];
        return range === 0 ? 0 : (value - mins[dim]) / range;
      });
      normalized.push(normalizedFeature);
    });

    return normalized;
  }
}

export const machineLearningService = new MachineLearningService();