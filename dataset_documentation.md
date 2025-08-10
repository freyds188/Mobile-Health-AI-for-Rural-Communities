# Health AI Training Dataset Documentation

## Overview
This documentation describes the comprehensive CSV datasets created for training the K-means clustering model in the Health AI application. The datasets contain synthetic but realistic health data specifically designed for rural healthcare scenarios.

## Dataset Files

### 1. `training_dataset.csv` (100 records)
- **Purpose**: Basic training dataset with common health conditions and symptoms
- **Focus**: Standard health metrics and rural-specific conditions
- **Time Range**: January 2024 (10 days)
- **Demographics**: Ages 21-73, mixed gender, all rural locations

### 2. `enhanced_training_dataset.csv` (100 records)
- **Purpose**: Enhanced dataset with seasonal, temporal, and rural-specific factors
- **Focus**: Advanced features including time-of-day, seasonal patterns, and rural-specific health challenges
- **Time Range**: Full year 2024 with seasonal variations
- **Demographics**: Ages 16-72, mixed gender, rural-specific conditions

## Dataset Schema

### Core Health Data Fields
| Field | Type | Description | Range/Values |
|-------|------|-------------|--------------|
| `id` | Integer | Unique record identifier | 1-200 |
| `userId` | String | Unique user identifier | user001-user200 |
| `timestamp` | ISO DateTime | When symptoms were recorded | 2024 dates with time |
| `symptoms` | JSON Array | List of symptoms | See Symptom Categories below |
| `severity` | Integer | Overall symptom severity | 1-10 (1=mild, 10=severe) |
| `sleep` | Float | Hours of sleep | 2.0-9.5 hours |
| `stress` | Integer | Stress level | 1-10 (1=low, 10=high) |
| `exercise` | Integer | Minutes of exercise | 0-90 minutes |
| `diet` | String | Diet type | balanced, vegetarian, vegan, low-carb, high-protein, etc. |
| `notes` | String | Additional symptoms description | Free text |

### Demographics & Context
| Field | Type | Description | Values |
|-------|------|-------------|--------|
| `age` | Integer | User age | 16-73 years |
| `gender` | String | User gender | male, female |
| `location` | String | Geographic context | rural_area |
| `medical_history` | String | Pre-existing conditions | See Medical Conditions below |

### Enhanced Features (enhanced_training_dataset.csv only)
| Field | Type | Description | Values |
|-------|------|-------------|--------|
| `time_of_day` | String | Time period when symptoms occurred | early_morning, morning, late_morning, noon, afternoon, late_afternoon, evening, night, midnight |
| `day_of_week` | String | Day of week | monday, tuesday, wednesday, thursday, friday, saturday, sunday |
| `season` | String | Season when symptoms occurred | spring, summer, autumn, winter |

## Symptom Categories

### Physical Symptoms
- `headache` - Head pain of varying intensity
- `fever` - Elevated body temperature
- `cough` - Respiratory cough (dry or productive)
- `fatigue` - General tiredness or exhaustion
- `nausea` - Feeling of sickness or queasiness
- `dizziness` - Lightheadedness or vertigo
- `shortness of breath` - Difficulty breathing
- `chest pain` - Pain in chest area
- `abdominal pain` - Stomach or belly pain
- `joint pain` - Pain in joints (knees, elbows, etc.)
- `back pain` - Lower or upper back pain
- `muscle weakness` - General muscle weakness

### Rural-Specific Symptoms
- `heat exhaustion` - Heat-related illness
- `dehydration` - Fluid loss symptoms
- `allergic reaction` - Environmental allergies
- `agricultural injury` - Farm-related injuries
- `pesticide exposure` - Chemical exposure effects
- `animal injury` - Livestock-related injuries
- `weather exposure` - Extreme weather effects

### Seasonal Symptoms
- `seasonal allergies` - Pollen-related symptoms
- `seasonal depression` - Weather-related mood changes
- `cold weather arthritis` - Weather-sensitive joint pain
- `heat rash` - Summer heat-related skin issues
- `sunburn` - UV exposure damage
- `frostbite` - Cold exposure injury

### Mental Health & Social
- `anxiety` - Anxiety disorders
- `depression` - Depressive symptoms
- `insomnia` - Sleep disorders
- `seasonal affective disorder` - Seasonal mood disorder
- `isolation` - Rural isolation effects
- `work stress` - Job-related stress
- `family stress` - Family-related stress
- `financial stress` - Economic stress

## Medical Conditions

### Chronic Conditions
- `hypertension` - High blood pressure
- `diabetes` / `type_2_diabetes` - Diabetes mellitus
- `heart_disease` / `coronary_artery_disease` - Cardiovascular disease
- `asthma` - Respiratory condition
- `copd` - Chronic obstructive pulmonary disease
- `arthritis` / `rheumatoid_arthritis` / `osteoarthritis` - Joint conditions
- `fibromyalgia` - Chronic pain condition

### Acute Conditions
- `pneumonia` - Lung infection
- `bronchitis` - Bronchial inflammation
- `gastritis` - Stomach inflammation
- `kidney_stones` - Kidney stone disease
- `migraine` / `chronic_migraine` - Severe headaches

### Neurological
- `stroke` - Cerebrovascular accident
- `epilepsy` - Seizure disorder
- `multiple_sclerosis` - Autoimmune neurological condition
- `parkinsons` - Parkinson's disease
- `alzheimers` - Alzheimer's disease

### Other Conditions
- `cancer` - Various cancer types
- `lupus` / `systemic_lupus` - Autoimmune condition
- `pregnancy` - Pregnancy-related symptoms
- `menopause` - Menopausal symptoms
- `allergies` / `seasonal_allergies` - Allergic conditions

## Feature Engineering for K-means

The datasets are designed to support the following machine learning features as defined in `MachineLearningService.ts`:

### Basic Features
1. **severity** - Direct symptom severity (1-10)
2. **sleep** - Hours of sleep (affects overall health)
3. **stress** - Stress level (1-10)
4. **exercise** - Minutes of exercise (health indicator)

### Derived Features
5. **symptom_count** - Number of symptoms (calculated from symptoms array)
6. **symptom_severity_score** - Weighted symptom severity based on symptom types
7. **symptom_diversity** - Variety of symptom categories
8. **time_of_day_score** - Numerical representation of time patterns
9. **day_of_week_score** - Weekly pattern scoring
10. **sleep_stress_ratio** - Relationship between sleep and stress
11. **exercise_severity_ratio** - Exercise vs severity correlation
12. **lifestyle_score** - Combined lifestyle health score
13. **diet_quality** - Numerical diet quality score
14. **notes_complexity** - Text analysis of notes field

## Rural Healthcare Focus

### Key Rural Health Challenges Represented
1. **Access to Care** - Transportation and specialist access issues
2. **Environmental Factors** - Agricultural injuries, weather exposure
3. **Seasonal Patterns** - Seasonal work stress, weather-related conditions
4. **Isolation Effects** - Mental health impacts of rural isolation
5. **Occupational Hazards** - Farm work injuries, chemical exposures
6. **Technology Barriers** - Internet connectivity for telehealth

### Age and Gender Distribution
- **Age Range**: 16-73 years (representative of rural working population)
- **Gender Balance**: Approximately 50/50 male/female distribution
- **Demographics**: Focus on working-age adults with rural occupations

## Usage Instructions

### For K-means Training
1. **Load Dataset**: Import CSV files into your ML pipeline
2. **Feature Extraction**: Use `FeatureEngineer.extractFeatures()` method
3. **Normalization**: Apply feature normalization for clustering
4. **Clustering**: Use `AdvancedKMeans` class with optimal K detection
5. **Risk Assessment**: Apply risk stratification based on cluster results

### Recommended Training Approach
```typescript
// Example usage in MachineLearningService
const healthData = loadDatasetFromCSV('training_dataset.csv');
const features = FeatureEngineer.extractFeatures(healthData);
const normalizedFeatures = FeatureEngineer.normalizeFeatures(features);
const optimalK = await mlService.findOptimalK(normalizedFeatures);
const kmeans = new AdvancedKMeans(optimalK, 300, 1e-4, 'kmeans++');
const clusterResult = kmeans.cluster(normalizedFeatures.map(f => f.features));
```

### Validation and Testing
- **Cross-validation**: Use temporal splits (early dates for training, later for testing)
- **Seasonal Testing**: Test model performance across different seasons
- **Demographic Testing**: Validate across age groups and genders
- **Rural-specific Validation**: Focus on rural-specific health patterns

## Data Quality Notes

### Synthetic Data Characteristics
- **Realistic Patterns**: Based on real rural health statistics
- **Seasonal Variations**: Includes seasonal health pattern variations
- **Correlation Patterns**: Maintains realistic correlations between variables
- **Rural Authenticity**: Focuses on genuine rural health challenges

### Limitations
- **Synthetic Nature**: Data is simulated, not from real patients
- **Geographic Scope**: Limited to general rural patterns (not region-specific)
- **Cultural Factors**: May not capture all cultural health patterns
- **Temporal Scope**: Limited to 2024 data patterns

## Future Enhancements

### Potential Dataset Expansions
1. **Multi-year Data**: Historical patterns across multiple years
2. **Regional Variations**: Different rural regions (farming vs. mining communities)
3. **Pediatric Data**: Specific patterns for rural children
4. **Elderly Focus**: Geriatric rural health patterns
5. **Mental Health**: Expanded mental health and social determinants

### Integration Opportunities
1. **Real Data Integration**: Blend with anonymized real patient data
2. **Weather Data**: Include actual weather pattern correlations
3. **Economic Indicators**: Include local economic health factors
4. **Healthcare Access**: Detailed healthcare resource availability data

## Conclusion

These datasets provide a comprehensive foundation for training K-means clustering models specifically tailored to rural healthcare needs. The combination of basic health metrics, seasonal patterns, and rural-specific challenges creates a robust training environment for developing meaningful health risk stratification models.

The datasets support the complete machine learning pipeline from feature extraction through risk assessment, enabling the development of AI-powered health insights particularly valuable for underserved rural populations.
