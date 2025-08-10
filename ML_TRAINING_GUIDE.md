# 🤖 Machine Learning Training Guide

## 📋 **Overview**
Your Health AI project uses an **Advanced K-Means clustering algorithm** combined with **Feature Engineering** and **Anomaly Detection** to analyze health patterns and provide personalized insights.

## 🧠 **ML System Architecture**

### **Key Components:**
1. **AdvancedKMeans**: K-means clustering with k-means++ initialization
2. **FeatureEngineer**: Extracts and normalizes health features
3. **AnomalyDetector**: Identifies unusual health patterns
4. **NLPService**: Processes symptom descriptions and notes
5. **DataService**: Orchestrates ML analysis and storage

### **Training Process:**
```
Health Data → Feature Extraction → Normalization → Clustering → Risk Assessment → Insights
```

## 🔄 **How ML Training Works**

### **1. Automatic Training Triggers**
The ML system trains **automatically** when:
- ✅ **New health data is logged** (minimum 3 data points required)
- ✅ **User requests analysis** via the Analysis screen
- ✅ **Periodic retraining** (when new patterns emerge)

### **2. Training Data Sources**
The system learns from:
- **Symptoms**: Extracted from user descriptions using NLP
- **Severity levels**: 1-10 scale ratings
- **Sleep patterns**: Hours of sleep per night
- **Stress levels**: 1-10 scale ratings  
- **Exercise data**: Minutes of activity
- **Diet information**: Nutritional patterns
- **Temporal patterns**: Time-based health trends

### **3. Feature Engineering Process**
```typescript
// Extracted features include:
- Symptom frequency vectors
- Severity trend coefficients
- Sleep quality metrics
- Stress-exercise correlation
- Diet quality indicators
- Temporal patterns (daily/weekly cycles)
- Symptom co-occurrence patterns
```

## 🎯 **Manual Training Methods**

### **Method 1: Through the App Interface**

#### **Add Health Data**:
1. **Navigate to Health Data Screen**
2. **Log daily health information**:
   - Symptoms (free text - uses NLP)
   - Severity (1-10 scale)
   - Sleep hours
   - Stress level (1-10)
   - Exercise minutes
   - Diet description
   - Additional notes

#### **Trigger Analysis**:
1. **Navigate to Analysis Screen**
2. **System automatically analyzes** when ≥3 data points exist
3. **View clustering results** and risk assessments

### **Method 2: Programmatic Training**

#### **Add Sample Training Data**:
```typescript
// Example: Adding diverse health data for training
const trainingData = [
  {
    symptoms: ['headache', 'fatigue', 'stress'],
    severity: 7,
    sleep: 5,
    stress: 8,
    exercise: 15,
    diet: 'Fast food, high caffeine',
    notes: 'Very stressful day at work, poor sleep',
    timestamp: new Date('2024-01-01')
  },
  {
    symptoms: ['mild fatigue'],
    severity: 3,
    sleep: 8,
    stress: 2,
    exercise: 45,
    diet: 'Balanced meals, plenty of water',
    notes: 'Great day, felt energetic',
    timestamp: new Date('2024-01-02')
  },
  {
    symptoms: ['back pain', 'tension'],
    severity: 6,
    sleep: 6,
    stress: 7,
    exercise: 0,
    diet: 'Irregular meals',
    notes: 'Long day at computer, no exercise',
    timestamp: new Date('2024-01-03')
  }
  // Add more diverse data points...
];

// Save to trigger ML training
for (const data of trainingData) {
  await dataService.saveHealthData(userId, data);
}
```

### **Method 3: Bulk Data Import**

Create a training script to add comprehensive data:

```typescript
// Create: src/utils/TrainingDataGenerator.ts
export const generateTrainingData = () => {
  const patterns = [
    // High stress pattern
    {
      baseSymptoms: ['headache', 'fatigue', 'anxiety'],
      severityRange: [6, 9],
      sleepRange: [4, 6],
      stressRange: [7, 10],
      exerciseRange: [0, 20],
      dietPatterns: ['Fast food', 'Irregular meals', 'High caffeine']
    },
    // Healthy pattern  
    {
      baseSymptoms: [],
      severityRange: [1, 3],
      sleepRange: [7, 9],
      stressRange: [1, 4],
      exerciseRange: [30, 90],
      dietPatterns: ['Balanced nutrition', 'Regular meals', 'Plenty of water']
    },
    // Illness pattern
    {
      baseSymptoms: ['fever', 'cough', 'body aches'],
      severityRange: [7, 10],
      sleepRange: [6, 10],
      stressRange: [3, 6],
      exerciseRange: [0, 10],
      dietPatterns: ['Light meals', 'Lots of fluids', 'Reduced appetite']
    }
  ];
  
  // Generate 30 days of varied data
  // Implementation details...
};
```

## 📊 **ML Training Parameters**

### **K-Means Configuration**:
```typescript
const kmeans = new AdvancedKMeans(
  k: 3,              // Number of clusters (auto-optimized)
  maxIterations: 300, // Maximum training iterations
  tolerance: 1e-4,   // Convergence threshold
  initMethod: 'kmeans++' // Initialization method
);
```

### **Feature Engineering Settings**:
- **Symptom embedding dimensions**: Variable (based on vocabulary)
- **Normalization method**: Z-score normalization
- **Feature importance**: Calculated via variance analysis
- **Anomaly threshold**: 95th percentile

## 🔍 **Model Performance Monitoring**

### **Key Metrics Tracked**:
- **Silhouette Score**: Cluster quality (higher = better)
- **Inertia**: Within-cluster sum of squares (lower = better)
- **Convergence Rate**: Training efficiency
- **Feature Importance**: Which factors matter most
- **Anomaly Detection Rate**: Unusual pattern identification

### **View Training Results**:
```typescript
// Access ML analysis results
const analysis = await dataService.analyzeHealthData(userId);

console.log('Training Results:', {
  optimalClusters: analysis.optimalK,
  riskLevel: analysis.riskLevel,
  confidence: analysis.confidence,
  patterns: analysis.patterns,
  featureImportance: analysis.featureImportance
});
```

## 🎮 **Quick Training Demo**

### **1. Create Demo Training Data**:
```javascript
// In browser console or app
const demoData = [
  // Stress cluster
  { symptoms: ['headache', 'tension'], severity: 8, sleep: 5, stress: 9, exercise: 10, diet: 'Fast food' },
  { symptoms: ['fatigue', 'anxiety'], severity: 7, sleep: 4, stress: 8, exercise: 0, diet: 'Irregular' },
  { symptoms: ['headache', 'irritability'], severity: 6, sleep: 5, stress: 7, exercise: 15, diet: 'High caffeine' },
  
  // Healthy cluster  
  { symptoms: [], severity: 2, sleep: 8, stress: 2, exercise: 60, diet: 'Balanced nutrition' },
  { symptoms: ['mild fatigue'], severity: 1, sleep: 9, stress: 1, exercise: 45, diet: 'Regular meals' },
  { symptoms: [], severity: 1, sleep: 8, stress: 3, exercise: 30, diet: 'Plenty of water' },
  
  // Illness cluster
  { symptoms: ['fever', 'cough'], severity: 9, sleep: 10, stress: 4, exercise: 0, diet: 'Light meals' },
  { symptoms: ['body aches', 'fatigue'], severity: 8, sleep: 9, stress: 3, exercise: 5, diet: 'Fluids only' }
];

// Add through app interface or API
```

### **2. Trigger Training**:
1. **Navigate to Analysis Screen**
2. **System automatically detects** sufficient data
3. **Clustering begins** with visual feedback
4. **Results displayed** with risk assessment

### **3. View Results**:
- **Risk Level**: Low/Medium/High classification
- **Pattern Recognition**: Identified health clusters
- **Recommendations**: Personalized health advice
- **Anomaly Alerts**: Unusual patterns detected

## 📈 **Training Optimization Tips**

### **For Better Results**:
1. **Diverse Data**: Include various health states (good days, bad days, illness)
2. **Consistent Logging**: Regular daily entries improve pattern detection
3. **Detailed Symptoms**: Rich descriptions help NLP feature extraction
4. **Temporal Variety**: Include weekdays, weekends, different seasons
5. **Sufficient Volume**: Minimum 10-15 entries for meaningful clusters

### **Advanced Training**:
1. **Feature Engineering**: Add custom health metrics
2. **NLP Training**: Enhance symptom vocabulary
3. **Temporal Modeling**: Include circadian rhythm patterns
4. **Multi-user Learning**: Aggregate anonymized patterns
5. **External Data**: Weather, activity trackers, etc.

## 🚀 **Ready to Train!**

### **Quick Start**:
1. **Add 5+ health entries** with varied symptoms and metrics
2. **Navigate to Analysis Screen** to trigger training
3. **Review clustering results** and risk assessments
4. **Iterate with more data** for improved accuracy

### **Expected Training Output**:
```
🤖 ML Training Started...
📊 Features Extracted: 8 dimensions
🎯 Optimal Clusters: 3
📈 Silhouette Score: 0.73
⚡ Convergence: 15 iterations
🎨 Risk Assessment: Medium
📋 Patterns Found: ['Stress-sleep correlation', 'Exercise-mood link']
✅ Training Complete!
```

Your ML system is now **self-training** and will improve with every health data entry! 🎉