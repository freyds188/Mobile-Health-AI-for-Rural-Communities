/**
 * Dataset Loader Utility for Health AI Training Data
 * Loads and preprocesses CSV training datasets for K-means clustering
 */

import { HealthDataInput } from '../services/MachineLearningService';

export interface TrainingDataRecord {
  id: string;
  userId: string;
  timestamp: string;
  symptoms: string; // JSON array string
  severity: number;
  sleep: number;
  stress: number;
  exercise: number;
  diet: string;
  notes: string;
  age?: number;
  gender?: string;
  location?: string;
  medical_history?: string;
  time_of_day?: string;
  day_of_week?: string;
  season?: string;
}

export interface DatasetMetrics {
  totalRecords: number;
  uniqueUsers: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  averageSymptoms: number;
  severityDistribution: {
    low: number; // 1-3
    medium: number; // 4-6
    high: number; // 7-10
  };
  demographics: {
    ageGroups: Record<string, number>;
    genderDistribution: Record<string, number>;
  };
}

export class DatasetLoader {
  private static readonly SEVERITY_THRESHOLDS = {
    LOW_MAX: 3,
    MEDIUM_MAX: 6,
    HIGH_MIN: 7
  };

  /**
   * Load training dataset from CSV content
   * @param csvContent - Raw CSV content as string
   * @returns Array of HealthDataInput objects
   */
  static loadFromCSV(csvContent: string): HealthDataInput[] {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('Invalid CSV: No data rows found');
      }

      const headers = this.parseCSVLine(lines[0]);
      const records: HealthDataInput[] = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = this.parseCSVLine(lines[i]);
          if (values.length !== headers.length) {
            console.warn(`Skipping line ${i + 1}: Column count mismatch`);
            continue;
          }

          const record = this.parseDataRecord(headers, values);
          if (record) {
            records.push(record);
          }
        } catch (error) {
          console.warn(`Error parsing line ${i + 1}:`, error);
        }
      }

      console.log(`✅ Loaded ${records.length} training records from CSV`);
      return records;
    } catch (error) {
      console.error('❌ Error loading CSV dataset:', error);
      throw error;
    }
  }

  /**
   * Parse a CSV line handling quoted values and escapes
   */
  private static parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
      i++;
    }
    
    values.push(current.trim());
    return values;
  }

  /**
   * Parse a data record from CSV headers and values
   */
  private static parseDataRecord(headers: string[], values: string[]): HealthDataInput | null {
    try {
      const record: Record<string, any> = {};
      
      // Map headers to values
      for (let i = 0; i < headers.length; i++) {
        record[headers[i]] = values[i];
      }

      // Parse symptoms JSON
      let symptoms: string[] = [];
      try {
        symptoms = JSON.parse(record.symptoms || '[]');
      } catch {
        console.warn('Invalid symptoms JSON, using empty array');
        symptoms = [];
      }

      // Create HealthDataInput object
      const healthData: HealthDataInput = {
        symptoms,
        severity: this.parseNumber(record.severity, 5), // Default severity 5
        sleep: this.parseNumber(record.sleep, 7), // Default 7 hours
        stress: this.parseNumber(record.stress, 5), // Default stress 5
        exercise: this.parseNumber(record.exercise, 30), // Default 30 minutes
        diet: record.diet || 'balanced',
        notes: record.notes || '',
        timestamp: this.parseTimestamp(record.timestamp)
      };

      // Validate required fields
      if (healthData.severity < 1 || healthData.severity > 10) {
        console.warn('Invalid severity value, skipping record');
        return null;
      }

      return healthData;
    } catch (error) {
      console.warn('Error parsing data record:', error);
      return null;
    }
  }

  /**
   * Parse a number with fallback to default
   */
  private static parseNumber(value: string, defaultValue: number): number {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Parse timestamp with fallback to current time
   */
  private static parseTimestamp(value: string): Date {
    try {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    } catch {
      return new Date();
    }
  }

  /**
   * Generate dataset metrics for analysis
   */
  static analyzeDataset(records: HealthDataInput[]): DatasetMetrics {
    if (records.length === 0) {
      throw new Error('Cannot analyze empty dataset');
    }

    // Basic metrics
    const totalRecords = records.length;
    const uniqueUsers = new Set(records.map((_, index) => `user${index + 1}`)).size;

    // Date range
    const timestamps = records.map(r => r.timestamp).sort((a, b) => a.getTime() - b.getTime());
    const dateRange = {
      start: timestamps[0],
      end: timestamps[timestamps.length - 1]
    };

    // Symptom metrics
    const totalSymptoms = records.reduce((sum, record) => sum + record.symptoms.length, 0);
    const averageSymptoms = totalSymptoms / totalRecords;

    // Severity distribution
    let low = 0, medium = 0, high = 0;
    records.forEach(record => {
      if (record.severity <= this.SEVERITY_THRESHOLDS.LOW_MAX) {
        low++;
      } else if (record.severity <= this.SEVERITY_THRESHOLDS.MEDIUM_MAX) {
        medium++;
      } else {
        high++;
      }
    });

    const severityDistribution = { low, medium, high };

    // Demographics (placeholder - would need additional data fields)
    const demographics = {
      ageGroups: {
        '18-30': Math.floor(totalRecords * 0.3),
        '31-50': Math.floor(totalRecords * 0.4),
        '51-70': Math.floor(totalRecords * 0.3)
      },
      genderDistribution: {
        'male': Math.floor(totalRecords * 0.52),
        'female': Math.floor(totalRecords * 0.48)
      }
    };

    return {
      totalRecords,
      uniqueUsers,
      dateRange,
      averageSymptoms,
      severityDistribution,
      demographics
    };
  }

  /**
   * Validate dataset quality for ML training
   */
  static validateDataset(records: HealthDataInput[]): {
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Minimum sample size check
    if (records.length < 50) {
      warnings.push(`Small dataset: ${records.length} records (recommended: 100+)`);
      recommendations.push('Consider collecting more training data');
    }

    // Severity distribution check
    const metrics = this.analyzeDataset(records);
    const { low, medium, high } = metrics.severityDistribution;
    const total = low + medium + high;
    
    if (high / total > 0.5) {
      warnings.push('High severity bias: 50%+ records are high severity');
      recommendations.push('Balance dataset with more low-medium severity cases');
    }

    if (low / total < 0.1) {
      warnings.push('Low severity underrepresentation: <10% low severity cases');
      recommendations.push('Add more low severity training examples');
    }

    // Symptom diversity check
    const allSymptoms = new Set<string>();
    records.forEach(record => {
      record.symptoms.forEach(symptom => allSymptoms.add(symptom));
    });

    if (allSymptoms.size < 5) {
      warnings.push(`Limited symptom diversity: ${allSymptoms.size} unique symptoms`);
      recommendations.push('Include more diverse symptom types in training data');
    }

    // Temporal distribution check
    const uniqueDates = new Set(records.map(r => r.timestamp.toDateString())).size;
    if (uniqueDates < 7) {
      warnings.push(`Limited temporal diversity: ${uniqueDates} unique dates`);
      recommendations.push('Collect data across more time periods');
    }

    const isValid = warnings.length === 0;

    return {
      isValid,
      warnings,
      recommendations
    };
  }

  /**
   * Filter dataset by criteria for specialized training
   */
  static filterDataset(
    records: HealthDataInput[],
    criteria: {
      severityRange?: [number, number];
      symptoms?: string[];
      minSymptoms?: number;
      maxSymptoms?: number;
      dateRange?: [Date, Date];
    }
  ): HealthDataInput[] {
    return records.filter(record => {
      // Severity filter
      if (criteria.severityRange) {
        const [min, max] = criteria.severityRange;
        if (record.severity < min || record.severity > max) {
          return false;
        }
      }

      // Symptom filter
      if (criteria.symptoms) {
        const hasRequiredSymptom = criteria.symptoms.some(symptom =>
          record.symptoms.includes(symptom)
        );
        if (!hasRequiredSymptom) {
          return false;
        }
      }

      // Symptom count filters
      if (criteria.minSymptoms && record.symptoms.length < criteria.minSymptoms) {
        return false;
      }
      if (criteria.maxSymptoms && record.symptoms.length > criteria.maxSymptoms) {
        return false;
      }

      // Date range filter
      if (criteria.dateRange) {
        const [startDate, endDate] = criteria.dateRange;
        if (record.timestamp < startDate || record.timestamp > endDate) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Split dataset for training and validation
   */
  static splitDataset(
    records: HealthDataInput[],
    trainRatio: number = 0.8
  ): {
    training: HealthDataInput[];
    validation: HealthDataInput[];
  } {
    // Shuffle records for random split
    const shuffled = [...records].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor(shuffled.length * trainRatio);

    return {
      training: shuffled.slice(0, splitIndex),
      validation: shuffled.slice(splitIndex)
    };
  }

  /**
   * Create a sample dataset for testing
   */
  static createSampleDataset(size: number = 20): HealthDataInput[] {
    const sampleSymptoms = [
      'headache', 'fever', 'cough', 'fatigue', 'nausea',
      'dizziness', 'back pain', 'chest pain', 'joint pain'
    ];
    const sampleDiets = ['balanced', 'vegetarian', 'vegan', 'low-carb'];
    const sampleNotes = [
      'Mild symptoms after work',
      'Feeling unwell for 2 days',
      'Stress-related symptoms',
      'Weather-related discomfort',
      'Post-exercise fatigue'
    ];

    const records: HealthDataInput[] = [];

    for (let i = 0; i < size; i++) {
      // Random symptom selection (1-3 symptoms)
      const numSymptoms = Math.floor(Math.random() * 3) + 1;
      const symptoms: string[] = [];
      for (let j = 0; j < numSymptoms; j++) {
        const symptom = sampleSymptoms[Math.floor(Math.random() * sampleSymptoms.length)];
        if (!symptoms.includes(symptom)) {
          symptoms.push(symptom);
        }
      }

      const record: HealthDataInput = {
        symptoms,
        severity: Math.floor(Math.random() * 10) + 1,
        sleep: Math.round((Math.random() * 4 + 5) * 10) / 10, // 5-9 hours
        stress: Math.floor(Math.random() * 10) + 1,
        exercise: Math.floor(Math.random() * 90), // 0-90 minutes
        diet: sampleDiets[Math.floor(Math.random() * sampleDiets.length)],
        notes: sampleNotes[Math.floor(Math.random() * sampleNotes.length)],
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Last 30 days
      };

      records.push(record);
    }

    console.log(`✅ Generated ${size} sample records for testing`);
    return records;
  }
}

export default DatasetLoader;
