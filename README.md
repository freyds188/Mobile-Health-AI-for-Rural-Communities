# Health AI Mobile Application

A comprehensive mobile health application built with React Native and Expo, featuring AI-powered health analysis using K-means clustering.

## Features

### 1. User Management Module
- **Patient and healthcare provider registration/login**: Secure authentication system with role-based access
- **Role-based access**: Support for Patient, Provider, and Admin roles
- **Profile management**: Complete user profiles with name, age, gender, location, and medical history

### 2. Chatbot Interface Module
- **Natural language interaction**: Conversational interface for symptom reporting
- **Multilingual support**: Ready for internationalization
- **NLP processing**: Intelligent symptom extraction and interpretation
- **Free-text interpretation**: Advanced natural language processing capabilities

### 3. Health Data Collection Module
- **Comprehensive data collection**: Symptoms, behavior patterns, and medical history
- **Time-series tracking**: Historical data storage for pattern analysis
- **Behavioral metrics**: Sleep, stress, exercise, and diet tracking
- **Symptom severity tracking**: 1-10 scale severity assessment

### 4. AI Analysis Module (K-means Clustering Engine)
- **K-means clustering**: Advanced pattern recognition algorithm
- **Risk level categorization**: Low, Medium, High risk assessment
- **Pattern detection**: Recurring or worsening symptom identification
- **Health insights**: Non-diagnostic health recommendations
- **Confidence scoring**: Analysis reliability metrics

## Technology Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: React Context API
- **Storage**: AsyncStorage and Expo SecureStore
- **UI Components**: Custom components with Expo Vector Icons
- **AI/ML**: Custom K-means clustering implementation
- **NLP**: Custom natural language processing for symptom extraction

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd health-ai-mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

## Project Structure

```
src/
├── contexts/           # React Context providers
│   ├── AuthContext.tsx
│   ├── HealthDataContext.tsx
│   └── ChatbotContext.tsx
├── navigation/         # Navigation components
│   └── MainTabNavigator.tsx
├── screens/           # Application screens
│   ├── auth/          # Authentication screens
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── ChatbotScreen.tsx
│   ├── HealthDataScreen.tsx
│   ├── AnalysisScreen.tsx
│   ├── ProfileScreen.tsx
│   └── LoadingScreen.tsx
└── components/        # Reusable components
```

## Key Features Implementation

### Authentication System
- Secure user registration and login
- Role-based access control
- Profile management with medical history
- Secure storage using Expo SecureStore

### Chatbot Interface
- Real-time messaging interface
- Symptom extraction using NLP
- Contextual health responses
- Message history persistence

### Health Data Collection
- Comprehensive symptom selection
- Severity assessment (1-10 scale)
- Behavioral tracking (sleep, stress, exercise, diet)
- Notes and additional information

### AI Analysis Engine
- K-means clustering algorithm implementation
- Multi-dimensional health data analysis
- Risk level assessment
- Pattern recognition and recommendations

## Usage

### For Patients
1. **Register/Login**: Create an account or sign in
2. **Chat with AI**: Use the chatbot to describe symptoms
3. **Log Health Data**: Manually input health metrics
4. **View Analysis**: Get AI-powered health insights
5. **Manage Profile**: Update personal and medical information

### For Healthcare Providers
1. **Provider Registration**: Register as a healthcare provider
2. **Patient Monitoring**: Access patient health data (future feature)
3. **Health Analytics**: View aggregated health insights
4. **Professional Dashboard**: Provider-specific interface

### For Administrators
1. **System Management**: Oversee application usage
2. **User Management**: Manage user accounts and roles
3. **Analytics Dashboard**: System-wide health analytics

## AI Analysis Details

### K-means Clustering Algorithm
The application implements a custom K-means clustering algorithm that:

1. **Data Preparation**: Normalizes health data (severity, sleep, stress, exercise)
2. **Clustering**: Groups similar health patterns into 3 clusters
3. **Risk Assessment**: Analyzes cluster characteristics for risk level determination
4. **Pattern Recognition**: Identifies recurring health patterns
5. **Recommendation Generation**: Provides personalized health recommendations

### Analysis Metrics
- **Severity Patterns**: Symptom intensity trends
- **Sleep Quality**: Sleep duration and quality analysis
- **Stress Levels**: Stress pattern identification
- **Exercise Consistency**: Physical activity tracking
- **Behavioral Correlations**: Cross-factor pattern analysis

## Security Features

- **Secure Authentication**: Encrypted user credentials
- **Data Privacy**: Local storage with encryption
- **Role-based Access**: Granular permission system
- **Input Validation**: Comprehensive form validation
- **Error Handling**: Robust error management

## Future Enhancements

- **Backend Integration**: Connect to cloud-based backend
- **Real-time Analytics**: Live health monitoring
- **Telemedicine Integration**: Video consultation features
- **Wearable Device Integration**: Health tracker connectivity
- **Advanced ML Models**: More sophisticated AI algorithms
- **Multi-language Support**: Internationalization
- **Push Notifications**: Health reminders and alerts
- **Data Export**: Health report generation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.

## Disclaimer

This application is for informational purposes only and should not replace professional medical advice. Always consult with healthcare professionals for medical decisions. 