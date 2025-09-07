import { v4 as uuidv4 } from 'uuid';

/**
 * FeatureVector: Represents processed health data ready for machine learning
 * - Contains numerical features extracted from raw health data
 * - Used as input for clustering and analysis algorithms
 */
export interface FeatureVector {
  id: string;              // Unique identifier for this feature vector
  userId: string;          // User who this data belongs to
  timestamp: Date;         // When this data was collected
  features: number[];      // Numerical features for ML algorithms
  featureNames: string[];  // Names of each feature (for interpretability)
  rawData: any;           // Original health data (for reference)
}

/**
 * ClusterResult: Represents a single cluster from K-means clustering
 * - Contains all data points assigned to this cluster
 * - Includes quality metrics for cluster evaluation
 */
export interface ClusterResult {
  clusterId: number;           // Unique identifier for this cluster (0, 1, 2, etc.)
  centroid: number[];          // Center point of the cluster (average of all members)
  members: FeatureVector[];    // All data points assigned to this cluster
  inertia: number;             // How tight the cluster is (lower = tighter)
  silhouetteScore: number;     // How well-separated the cluster is (-1 to +1)
}

/**
 * MLAnalysisResult: Complete result from machine learning analysis
 * - Contains all clustering results, risk assessment, and recommendations
 * - This is the main output that gets sent to the user interface
 */
export interface MLAnalysisResult {
  id: string;                                    // Unique identifier for this analysis
  userId: string;                                // User who this analysis is for
  timestamp: Date;                               // When this analysis was performed
  algorithm: string;                             // Which ML algorithm was used
  version: string;                               // Version of the ML service
  clusters: ClusterResult[];                     // All clusters found in the data
  optimalK: number;                              // Best number of clusters found
  riskLevel: 'low' | 'medium' | 'high';         // Overall health risk assessment
  patterns: string[];                            // Health patterns discovered
  recommendations: string[];                     // Actionable health recommendations
  confidence: number;                            // How confident we are (0.0 to 1.0)
  featureImportance: { [key: string]: number };  // Which features matter most
  anomalies: FeatureVector[];                    // Unusual health patterns detected
}

/**
 * HealthDataInput: Raw health data from user input
 * - This is what users provide through the app interface
 * - Gets processed into FeatureVector for machine learning
 */
export interface HealthDataInput {
  symptoms: string[];        // List of symptoms (e.g., ["headache", "fatigue"])
  severity: number;          // Overall symptom severity (1-10 scale)
  sleep: number;             // Hours of sleep last night (0-12)
  stress: number;            // Stress level (1-10 scale)
  exercise: number;          // Minutes of exercise today (0-300)
  diet: string;              // Description of recent diet
  notes: string;             // Additional health notes
  timestamp: Date;           // When this data was recorded
}


/**
 * AdvancedKMeans: Implements K-means++ clustering algorithm
 * - K-means++ is an improved version of K-means with better initialization
 * - Automatically finds optimal cluster centers
 * - Includes quality metrics (silhouette score, inertia)
 */
class AdvancedKMeans {
  private k: number;                              // Number of clusters to find
  private maxIterations: number;                  // Maximum iterations to prevent infinite loops
  private tolerance: number;                      // Convergence threshold (when to stop)
  private initMethod: 'random' | 'kmeans++';     // How to initialize cluster centers

  /**
   * Constructor: Sets up K-means clustering parameters
   * @param k - Number of clusters (default: 3)
   * @param maxIterations - Max iterations (default: 300)
   * @param tolerance - Convergence threshold (default: 0.0001)
   * @param initMethod - Initialization method (default: 'kmeans++')
   */
  constructor(
    k: number = 3, // Default number of clusters
    maxIterations: number = 300, // Default max iterations
    tolerance: number = 1e-4, // Default convergence threshold
    initMethod: 'random' | 'kmeans++' = 'kmeans++' // initialization method
  ) {
    this.k = k;
    this.maxIterations = maxIterations;
    this.tolerance = tolerance;
    this.initMethod = initMethod;
  }

  
  /**
   * Euclidean Distance: Standard distance between two points
   * Formula: √(Σ(x₁-y₁)² + (x₂-y₂)² + ... + (xₙ-yₙ)²)
   */
  private euclideanDistance(point1: number[], point2: number[]): number {
    return Math.sqrt(
      point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0)
    );
  }

  /**
   * Manhattan Distance: Sum of absolute differences
   * Formula: |x₁-y₁| + |x₂-y₂| + ... + |xₙ-yₙ|
   * Best for: High-dimensional data with outliers
   */
  private manhattanDistance(point1: number[], point2: number[]): number {
    return point1.reduce((sum, val, i) => sum + Math.abs(val - point2[i]), 0);
  }

  /**
   * Cosine Distance: Measures angle between vectors
   * Formula: 1 - (A·B) / (||A|| × ||B||)
   * Best for: Text data, when magnitude doesn't matter
   */
  private cosineDistance(point1: number[], point2: number[]): number {
    const dotProduct = point1.reduce((sum, val, i) => sum + val * point2[i], 0);
    const magnitude1 = Math.sqrt(point1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(point2.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitude1 === 0 || magnitude2 === 0) return 1;
    return 1 - (dotProduct / (magnitude1 * magnitude2));
  }


  /**
   * K-Means++ Initialization: Smart way to choose initial cluster centers
   * - Step 1: Choose first centroid randomly
   * - Step 2: Choose next centroids with probability proportional to distance²
   * - Result: Better convergence and cluster quality than random initialization
   */
  private initializeCentroids(data: number[][], method: 'random' | 'kmeans++' = 'kmeans++'): number[][] {
    const centroids: number[][] = [];
    const dataLength = data.length;
    const dimensions = data[0].length;

    if (method === 'random') {
      // Traditional random initialization (less effective)
      for (let i = 0; i < this.k; i++) {
        const randomIndex = Math.floor(Math.random() * dataLength);
        centroids.push([...data[randomIndex]]);
      }
    } else if (method === 'kmeans++') {
      // K-means++ initialization for better convergence
      
      // Step 1: Choose first centroid uniformly at random
      const randomIndex = Math.floor(Math.random() * dataLength);
      centroids.push([...data[randomIndex]]);

      // Step 2: Choose remaining centroids using weighted probability
      for (let i = 1; i < this.k; i++) {
        const distances: number[] = [];
        let totalDistance = 0;

        // Calculate minimum distance to existing centroids for each point
        for (const point of data) {
          let minDistance = Infinity;
          for (const centroid of centroids) {
            const distance = this.euclideanDistance(point, centroid);
            minDistance = Math.min(minDistance, distance);
          }
          // Square the distance for weighted selection (key to K-means++)
          distances.push(minDistance * minDistance);
          totalDistance += minDistance * minDistance;
        }

        // Select next centroid with probability proportional to distance squared
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

  // ============================================================================
  // CLUSTER ASSIGNMENT
  // ============================================================================
  /**
   * Assigns each data point to the nearest centroid
   * - Finds the closest cluster center for each point
   * - Returns array of cluster assignments (0, 1, 2, etc.)
   */
  private assignToClusters(data: number[][], centroids: number[][]): number[] {
    const assignments: number[] = [];

    for (const point of data) {
      let minDistance = Infinity;
      let clusterIndex = 0;

      // Find the closest centroid to this point
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

  // ============================================================================
  // CENTROID UPDATE
  // ============================================================================
  /**
   * Updates centroids by computing the mean of all points in each cluster
   * - Calculates new center point for each cluster
   * - Handles empty clusters by reinitializing with random point
   */
  private updateCentroids(data: number[][], assignments: number[]): number[][] {
    const centroids: number[][] = [];
    const dimensions = data[0].length;

    for (let i = 0; i < this.k; i++) {
      // Get all points assigned to this cluster
      const clusterPoints = data.filter((_, index) => assignments[index] === i);

      if (clusterPoints.length === 0) {
        // If cluster is empty, reinitialize with random point
        const randomIndex = Math.floor(Math.random() * data.length);
        centroids.push([...data[randomIndex]]);
      } else {
        // Calculate new centroid as mean of all cluster points
        const centroid = new Array(dimensions).fill(0);

        // Sum all points in the cluster
        for (const point of clusterPoints) {
          for (let j = 0; j < dimensions; j++) {
            centroid[j] += point[j];
          }
        }

        // Divide by number of points to get mean (new centroid)
        for (let j = 0; j < dimensions; j++) {
          centroid[j] /= clusterPoints.length;
        }

        centroids.push(centroid);
      }
    }

    return centroids;
  }

  // ============================================================================
  // QUALITY METRICS
  // ============================================================================
  
  /**
   * Inertia: Measures how tight the clusters are
   * - Sum of squared distances from points to their cluster centers
   * - Lower values = tighter, better clusters
   */
  private calculateInertia(data: number[][], assignments: number[], centroids: number[][]): number {
    let inertia = 0;

    for (let i = 0; i < data.length; i++) {
      const clusterIndex = assignments[i];
      const distance = this.euclideanDistance(data[i], centroids[clusterIndex]);
      inertia += distance * distance;  // Square the distance
    }

    return inertia;
  }

  /**
   * Silhouette Score: Measures how well-separated clusters are
   * - Range: -1 to +1 (higher is better)
   * - Formula: (b - a) / max(a, b)
   *   - a = average distance to points in same cluster
   *   - b = minimum average distance to points in other clusters
   * - +1: Points are well-clustered
   * - 0: Points are on cluster boundaries  
   * - -1: Points may be in wrong clusters
   */
  private calculateSilhouetteScore(data: number[][], assignments: number[]): number {
    if (this.k === 1) return 0;  // Can't calculate silhouette for single cluster

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
        if (otherCluster === cluster) continue;  // Skip same cluster

        const otherClusterPoints = data.filter((_, index) => assignments[index] === otherCluster);
        if (otherClusterPoints.length > 0) {
          const avgDistance = otherClusterPoints.reduce((sum, otherPoint) => sum + this.euclideanDistance(point, otherPoint), 0) / otherClusterPoints.length;
          b = Math.min(b, avgDistance);  // Find closest other cluster
        }
      }

      // Calculate silhouette score for this point
      const silhouette = b === Infinity ? 0 : (b - a) / Math.max(a, b);
      silhouetteScores.push(silhouette);
    }

    // Return average silhouette score across all points
    return silhouetteScores.reduce((sum, score) => sum + score, 0) / silhouetteScores.length;
  }

  // ============================================================================
  // MAIN CLUSTERING ALGORITHM
  // ============================================================================
  /**
   * Main K-means clustering algorithm
   * - Initializes centroids using K-means++
   * - Iteratively assigns points and updates centroids
   * - Stops when convergence is reached or max iterations hit
   * - Returns clustering results with quality metrics
   */
  cluster(data: number[][]): { assignments: number[]; centroids: number[][]; inertia: number; silhouetteScore: number; iterations: number } {
    // Input validation
    if (data.length === 0) {
      throw new Error('Cannot cluster empty data');
    }

    if (this.k > data.length) {
      throw new Error('K cannot be greater than the number of data points');
    }

    // Initialize centroids using K-means++ (better than random)
    let centroids = this.initializeCentroids(data, this.initMethod);
    let assignments: number[] = [];
    let previousInertia = Infinity;
    let iterations = 0;

    // Main clustering loop
    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      // Step 1: Assign each point to nearest centroid
      const newAssignments = this.assignToClusters(data, centroids);
      
      // Step 2: Update centroids based on new assignments
      const newCentroids = this.updateCentroids(data, newAssignments);
      
      // Step 3: Calculate new inertia (quality metric)
      const inertia = this.calculateInertia(data, newAssignments, newCentroids);

      // Check for convergence (when inertia stops improving significantly)
      if (Math.abs(previousInertia - inertia) < this.tolerance) {
        assignments = newAssignments;
        centroids = newCentroids;
        iterations = iteration + 1;
        break;  // Algorithm converged!
      }

      // Update for next iteration
      assignments = newAssignments;
      centroids = newCentroids;
      previousInertia = inertia;
      iterations = iteration + 1;
    }

    // Calculate final quality metrics
    const finalInertia = this.calculateInertia(data, assignments, centroids);
    const silhouetteScore = this.calculateSilhouetteScore(data, assignments);

    return {
      assignments,      // Which cluster each point belongs to
      centroids,        // Final cluster centers
      inertia: finalInertia,           // How tight clusters are
      silhouetteScore,  // How well-separated clusters are
      iterations        // How many iterations it took
    };
  }
}

// ============================================================================
// FEATURE ENGINEERING
// ============================================================================
/**
 * FeatureEngineer: Transforms raw health data into numerical features
 * - Extracts 14 different types of features from health data
 * - Normalizes features for machine learning algorithms
 * - Creates features that capture health patterns and trends
 */
class FeatureEngineer {
  /**
   * Extracts numerical features from raw health data
   * - Converts symptoms, lifestyle, and text data into numbers
   * - Creates 14 different feature types for comprehensive analysis
   */
  static extractFeatures(healthData: HealthDataInput[]): FeatureVector[] {
    return healthData.map((data, index) => {
      const features = [
        // ===== BASIC FEATURES =====
        data.severity,        // Overall symptom severity (1-10)
        data.sleep,           // Hours of sleep (0-12)
        data.stress,          // Stress level (1-10)
        data.exercise,        // Minutes of exercise (0-300)

        // ===== SYMPTOM-BASED FEATURES =====
        data.symptoms.length,                                    // Number of symptoms
        this.calculateSymptomSeverityScore(data.symptoms),      // Weighted symptom severity
        this.calculateSymptomDiversityScore(data.symptoms),     // How many body systems affected

        // ===== TEMPORAL FEATURES =====
        this.getTimeOfDayScore(data.timestamp),                 // Time of day pattern
        this.getDayOfWeekScore(data.timestamp),                 // Weekend vs weekday

        // ===== DERIVED FEATURES =====
        this.calculateSleepStressRatio(data.sleep, data.stress),           // Sleep-stress balance
        this.calculateExerciseSeverityRatio(data.exercise, data.severity), // Exercise-symptom balance
        this.calculateLifestyleScore(data.sleep, data.stress, data.exercise), // Overall lifestyle health

        // ===== DIET FEATURES =====
        this.getDietQualityScore(data.diet),                    // Diet quality assessment

        // ===== TEXT-BASED FEATURES =====
        this.getNotesComplexityScore(data.notes)                // Complexity of health notes
      ];

      // Feature names for interpretability (must match features array above)
      const featureNames = [
        'severity', 'sleep', 'stress', 'exercise',                    // Basic features
        'symptom_count', 'symptom_severity_score', 'symptom_diversity', // Symptom features
        'time_of_day_score', 'day_of_week_score',                     // Temporal features
        'sleep_stress_ratio', 'exercise_severity_ratio', 'lifestyle_score', // Derived features
        'diet_quality', 'notes_complexity'                            // Diet & text features
      ];

      // Create FeatureVector object with extracted features
      return {
        id: uuidv4(),                    // Unique identifier
        userId: '',                      // Will be set by the calling function
        timestamp: data.timestamp,       // When this data was collected
        features,                        // 14 numerical features for ML
        featureNames,                    // Names of each feature
        rawData: data                    // Original health data for reference
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
    // Prefer ProductionRiskAssessment if available (generated by deployment)
    try {
      const praModule: any = await import('./ProductionRiskAssessment');
      const PRAClass = praModule.ProductionRiskAssessment || praModule.default;
      if (PRAClass) {
        const praInstance = new PRAClass();
        // Adapter to match ModelDeploymentService API used elsewhere
        this.deploymentService = {
          getDeployedModelInfo: () => praInstance.getModelInfo(),
          assessHealthRisk: async (healthData: HealthDataInput) => {
            const r = praInstance.assessRisk(healthData);
            return {
              overallRisk: r.overallRisk,
              confidence: r.confidence,
              primaryCluster: 0,
              riskScore: r.riskScore,
              severityRisk: r.severityRisk,
              lifestyleRisk: r.lifestyleRisk,
              symptomRisk: r.symptomRisk,
              immediateActions: r.immediateActions,
              preventativeActions: r.preventativeActions,
              followUpRecommended: r.followUpRecommended,
              accessibilityFactors: r.accessibilityFactors,
              seasonalConsiderations: r.seasonalConsiderations
            };
          }
        };
        return;
      }
    } catch (error) {
      // PRA not found; will fall back to ModelDeploymentService
    }

    // Fallback: use ModelDeploymentService if PRA is not available
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
        anomalies: []
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