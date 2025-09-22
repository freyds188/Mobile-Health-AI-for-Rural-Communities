import { dataService } from '../services/DataService';
import { securityService } from '../services/SecurityService';
import ModelDeploymentService from '../services/ModelDeploymentService';
import { continuousLearningService } from '../services/ContinuousLearningService';
import { notificationService } from '../services/NotificationService';
import { offlineQueue } from './OfflineQueue';
import MLTrainingService from '../services/MLTrainingService';

export const initializeApp = async (): Promise<boolean> => {
  try {
    console.log('🚀 Initializing Health AI App...');
    
    // Set timeouts for each initialization step
    const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, stepName: string): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error(`${stepName} timeout after ${timeoutMs}ms`)), timeoutMs)
        )
      ]);
    };
    
    // Initialize security service first
    console.log('🔐 Initializing security...');
    await withTimeout(securityService.initialize(), 5000, 'Security initialization');
    console.log('✅ Security service initialized');
    
    // Initialize data service (which includes database)
    console.log('💾 Initializing database...');
    await withTimeout(dataService.initialize(), 5000, 'Database initialization');
    console.log('✅ Data service initialized');
    
    // Check system health
    console.log('🏥 Checking system health...');
    try {
      const systemHealth = await withTimeout(dataService.getSystemHealth(), 3000, 'System health check');
      console.log('📊 System Health:', JSON.stringify(systemHealth, null, 2));
      
      if (systemHealth.services.database === 'error') {
        console.warn('⚠️ Database has issues, but continuing...');
      }
      
      console.log('📊 System Health Score:', systemHealth.security.score);
    } catch (healthError) {
      console.warn('⚠️ System health check failed, but continuing:', healthError);
    }
    
    console.log('✅ App initialization completed successfully');
    
    // Configure model registry and check updates (optional public manifest URL)
    try {
      const modelDeployment = new ModelDeploymentService();
      // Example: host manifest yourself; keep null if none
      // modelDeployment.setRegistryManifestUrl('https://example.com/deployed-model-config.json');
      await modelDeployment.checkForModelUpdates();
    } catch {}
    
    // Notifications: request permissions and schedule daily reminder
    try {
      await notificationService.requestPermissions();
      await notificationService.scheduleDailyReminder(19);
    } catch {}

    // Drain offline queue (best-effort)
    try {
      await offlineQueue.load();
      await offlineQueue.drain(async (op) => {
        if (op.type === 'saveHealthData') {
          try {
            // @ts-ignore payload shape enforced at enqueue site
            await dataService.getDatabaseService().saveHealthData(op.payload);
            return true;
          } catch {
            return false;
          }
        }
        return true;
      });
    } catch {}

    // Optional: light-touch continuous learning kick-off (non-blocking)
    try {
      setTimeout(() => {
        continuousLearningService.maybeRetrainAndDeploy().then(r => {
          if (r.deployed) {
            console.log('🔄 Continuous learning deployed a new model');
          } else {
            console.log('ℹ️ Continuous learning result:', r.reason || 'skipped');
          }
        }).catch(() => {});
      }, 0);
    } catch {}
    
    // Create demo user for immediate functionality (especially on web)
    if (typeof window !== 'undefined') {
      console.log('🌐 Creating demo user for web platform...');
      await createDemoUser();
    }
    
    return true;
  } catch (error) {
    console.error('❌ App initialization failed:', error instanceof Error ? error.message : String(error));
    console.error('🔍 Full error:', error);
    console.log('🔄 Continuing with minimal functionality...');
    return false; // Continue even if initialization fails
  }
};

export const createDemoUser = async (): Promise<boolean> => {
  try {
    console.log('👤 Creating demo user...');
    
    // Check if demo user already exists
    try {
      const existingAuth = await dataService.authenticateUser('demo@healthai.com', 'demo123');
      if (existingAuth) {
        console.log('✅ Demo user already exists');
        return true;
      }
    } catch (authError) {
      console.log('Demo user doesn\'t exist yet, creating...');
    }
    
    const demoUser = await dataService.createUser({
      name: 'Demo User',
      email: 'demo@healthai.com',
      password: 'demo123',
      role: 'patient',
      age: 28,
      gender: 'female',
      location: 'Demo City',
      medicalHistory: 'No significant medical history. Participating in demo.'
    });

    console.log('✅ Demo user created:', demoUser.email);
    
    // Add some sample health data
    try {
      await seedSampleData(demoUser.id);
    } catch (seedError) {
      console.log('Note: Could not add sample data:', seedError);
    }
    
    // Create demo provider if missing and assign
    try {
      let providerAuth: any = null;
      try { providerAuth = await dataService.authenticateUser('provider@healthai.com', 'provider123'); } catch {}
      let providerId: string;
      if (!providerAuth) {
        const provider = await dataService.createUser({
          name: 'Demo Provider',
          email: 'provider@healthai.com',
          password: 'provider123',
          role: 'provider',
          age: 35,
          gender: 'male',
          location: 'Demo City',
          medicalHistory: ''
        });
        providerId = provider.id;
      } else {
        providerId = providerAuth.user.id;
      }
      await dataService.assignPatientToProvider(demoUser.id, providerId);
    } catch {}

    return true;
  } catch (error) {
    console.log('ℹ️ Demo user might already exist or creation failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
};

export const seedSampleData = async (userId: string): Promise<void> => {
  try {
    console.log('🌱 Seeding sample health data...');
    
    const sampleHealthData = [
      {
        symptoms: ['headache', 'fatigue'],
        severity: 6,
        sleep: 7,
        stress: 5,
        exercise: 30,
        diet: 'Balanced meals with vegetables and protein',
        notes: 'Feeling tired after long work day, mild headache in the evening',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        symptoms: ['mild fatigue'],
        severity: 3,
        sleep: 8,
        stress: 3,
        exercise: 45,
        diet: 'Good breakfast, healthy lunch, light dinner',
        notes: 'Feeling much better after good sleep and exercise',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        symptoms: [],
        severity: 1,
        sleep: 8,
        stress: 2,
        exercise: 60,
        diet: 'Great nutritious meals, plenty of water',
        notes: 'Feeling energetic and healthy today!',
        timestamp: new Date() // Today
      }
    ];

    for (const data of sampleHealthData) {
      await dataService.saveHealthData(userId, data);
    }

    console.log('✅ Sample health data created');
  } catch (error) {
    console.error('❌ Failed to seed sample data:', error);
  }
};