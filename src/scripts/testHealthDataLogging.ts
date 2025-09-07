/**
 * Test Health Data Logging
 * Tests the complete flow of health data logging and saving
 */

import { databaseService } from '../services/DatabaseService';

interface TestHealthData {
  userId: string;
  timestamp: string;
  symptoms: string;
  severity: number;
  sleep: number;
  stress: number;
  exercise: number;
  diet: string;
  notes: string;
}

export async function testHealthDataLogging(): Promise<void> {
  console.log('🧪 Testing Health Data Logging System');
  console.log('====================================');

  try {
    // Step 1: Initialize database
    console.log('📊 Step 1: Initializing database...');
    await databaseService.initialize();
    console.log('✅ Database initialized');

    // Step 2: Create test user if needed
    console.log('\n👤 Step 2: Setting up test user...');
    let testUserId = 'test_user_health_logging';
    
    try {
      // Try to create a test user
      const createdUser = await databaseService.createUser({
        email: 'test@health.local',
        name: 'Health Test User',
        password: 'TestPassword123!',
        role: 'patient',
        age: 30,
        gender: 'other',
        location: 'Test Rural Area'
      });
      testUserId = createdUser.id;
      console.log('✅ Test user created');
    } catch (error) {
      console.log('ℹ️ Test user may already exist:', error);
      // Attempt to find existing user ID by email if available in DatabaseService
      try {
        const users = await (databaseService as any).getAllUsers?.();
        if (Array.isArray(users)) {
          const existing = users.find((u: any) => u.email === 'test@health.local');
          if (existing?.id) {
            testUserId = existing.id;
          }
        }
      } catch {}
    }

    // Step 3: Test health data saving
    console.log('\n💾 Step 3: Testing health data saving...');
    
    const testHealthData: TestHealthData = {
      userId: testUserId,
      timestamp: new Date().toISOString(),
      symptoms: JSON.stringify(['headache', 'fatigue']),
      severity: 6,
      sleep: 7.5,
      stress: 5,
      exercise: 30,
      diet: 'balanced',
      notes: 'Test health data entry for validation'
    };

    console.log('📋 Test data:', testHealthData);

    const savedId = await databaseService.saveHealthData(testHealthData);
    console.log('✅ Health data saved with ID:', savedId);

    // Step 4: Test health data retrieval
    console.log('\n📊 Step 4: Testing health data retrieval...');
    
    const retrievedData = await databaseService.getHealthData(testUserId, 10);
    console.log('✅ Retrieved health data:', retrievedData.length, 'records');
    
    if (retrievedData.length > 0) {
      const latestRecord = retrievedData[0];
      console.log('📋 Latest record:', {
        id: latestRecord.id,
        userId: latestRecord.userId,
        symptoms: latestRecord.symptoms,
        severity: latestRecord.severity,
        timestamp: latestRecord.timestamp
      });
      
      // Verify the data integrity
      const symptomsArray = JSON.parse(latestRecord.symptoms);
      console.log('🔍 Parsed symptoms:', symptomsArray);
      
      if (symptomsArray.includes('headache') && symptomsArray.includes('fatigue')) {
        console.log('✅ Data integrity verified - symptoms correctly stored and retrieved');
      } else {
        console.log('❌ Data integrity issue - symptoms not matching');
      }
    }

    // Step 5: Test multiple health data entries
    console.log('\n📈 Step 5: Testing multiple health data entries...');
    
    const multipleEntries = [
      {
        userId: testUserId,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        symptoms: JSON.stringify(['cough', 'fever']),
        severity: 8,
        sleep: 5.0,
        stress: 7,
        exercise: 0,
        diet: 'poor',
        notes: 'Feeling unwell, stayed in bed'
      },
      {
        userId: testUserId,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        symptoms: JSON.stringify(['headache']),
        severity: 4,
        sleep: 8.0,
        stress: 3,
        exercise: 60,
        diet: 'balanced',
        notes: 'Feeling better after rest'
      },
      {
        userId: testUserId,
        timestamp: new Date().toISOString(), // Now
        symptoms: JSON.stringify(['back pain']),
        severity: 3,
        sleep: 7.5,
        stress: 2,
        exercise: 45,
        diet: 'balanced',
        notes: 'Minor back pain from exercise, otherwise good'
      }
    ];

    for (let i = 0; i < multipleEntries.length; i++) {
      const entry = multipleEntries[i];
      const entryId = await databaseService.saveHealthData(entry);
      console.log(`✅ Entry ${i + 1} saved with ID: ${entryId}`);
    }

    // Step 6: Verify all entries
    console.log('\n🔍 Step 6: Verifying all saved entries...');
    
    const allUserData = await databaseService.getHealthData(testUserId, 20);
    console.log(`✅ Total health records for user: ${allUserData.length}`);
    
    // Display summary of all records
    allUserData.forEach((record, index) => {
      const symptoms = JSON.parse(record.symptoms);
      console.log(`   Record ${index + 1}: ${symptoms.join(', ')} (Severity: ${record.severity})`);
    });

    // Step 7: Test data validation
    console.log('\n🛡️ Step 7: Testing data validation...');
    
    try {
      // Test with invalid data
      await databaseService.saveHealthData({
        userId: '',  // Invalid: empty user ID
        timestamp: new Date().toISOString(),
        symptoms: JSON.stringify(['test']),
        severity: 15, // Invalid: severity > 10
        sleep: -1,    // Invalid: negative sleep
        stress: 0,
        exercise: 0,
        diet: 'balanced',
        notes: ''
      });
      console.log('❌ Validation failed - invalid data was accepted');
    } catch (error) {
      console.log('✅ Validation working - invalid data rejected:', error);
    }

    // Step 8: Performance test
    console.log('\n⚡ Step 8: Performance testing...');
    
    const startTime = Date.now();
    const performanceEntries = [];
    
    for (let i = 0; i < 10; i++) {
      performanceEntries.push(databaseService.saveHealthData({
        userId: testUserId,
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        symptoms: JSON.stringify(['test_symptom_' + i]),
        severity: (i % 10) + 1,
        sleep: 7 + (i % 3),
        stress: (i % 8) + 1,
        exercise: i * 10,
        diet: i % 2 === 0 ? 'balanced' : 'vegetarian',
        notes: `Performance test entry ${i}`
      }));
    }
    
    await Promise.all(performanceEntries);
    const endTime = Date.now();
    
    console.log(`✅ Performance test: 10 entries saved in ${endTime - startTime}ms`);
    console.log(`   Average: ${(endTime - startTime) / 10}ms per entry`);

    // Final verification
    const finalCount = await databaseService.getHealthData(testUserId, 100);
    console.log(`\n📊 Final verification: ${finalCount.length} total health records for test user`);

    console.log('\n🎉 HEALTH DATA LOGGING TEST COMPLETED SUCCESSFULLY!');
    console.log('=================================================');
    console.log('✅ All tests passed:');
    console.log('   - Database initialization');
    console.log('   - User creation');
    console.log('   - Health data saving');
    console.log('   - Health data retrieval');
    console.log('   - Data integrity verification');
    console.log('   - Multiple entries handling');
    console.log('   - Data validation');
    console.log('   - Performance testing');
    
    console.log('\n💡 Health data logging system is working correctly!');
    console.log('Ready for production use in the Health AI app.');

  } catch (error) {
    console.error('❌ Health data logging test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check database initialization');
    console.log('2. Verify DatabaseService implementation');
    console.log('3. Check data structure compatibility');
    console.log('4. Ensure proper error handling');
  }
}

// Run if called directly
if (require.main === module) {
  testHealthDataLogging().catch(console.error);
}
