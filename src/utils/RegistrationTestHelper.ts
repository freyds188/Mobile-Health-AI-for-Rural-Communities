import { dataService } from '../services/DataService';

export class RegistrationTestHelper {
  
  /**
   * Test the complete registration flow
   */
  static async testRegistrationFlow(): Promise<{
    success: boolean;
    message: string;
    userCredentials?: { email: string; password: string };
  }> {
    try {
      console.log('🧪 RegistrationTestHelper: Starting registration flow test...');
      
      // Generate unique test user data
      const timestamp = Date.now();
      const testUser = {
        name: 'Test Registration User',
        email: `regtest${timestamp}@healthai.com`,
        password: 'testpass123',
        role: 'patient' as const,
        age: 30,
        gender: 'male' as const,
        location: 'Test Location',
        medicalHistory: 'No significant medical history. Test user.'
      };
      
      console.log('👤 Creating test user:', testUser.email);
      
      // Step 1: Create user (registration)
      const userProfile = await dataService.createUser(testUser);
      console.log('✅ User created successfully:', userProfile.id);
      
      // Step 2: Attempt to authenticate with the same credentials (login test)
      console.log('🔐 Testing authentication with new credentials...');
      const authResult = await dataService.authenticateUser(testUser.email, testUser.password);
      
      if (!authResult) {
        return {
          success: false,
          message: 'Registration succeeded but authentication failed - user cannot login with their credentials'
        };
      }
      
      console.log('✅ Authentication successful! User can login with their credentials');
      
      // Step 3: Verify user data integrity
      if (authResult.user.email !== testUser.email || authResult.user.name !== testUser.name) {
        return {
          success: false,
          message: 'User data integrity check failed - stored data does not match registration data'
        };
      }
      
      console.log('✅ User data integrity verified');
      
      return {
        success: true,
        message: `Registration flow test completed successfully! User ${testUser.email} can register and login.`,
        userCredentials: {
          email: testUser.email,
          password: testUser.password
        }
      };
      
    } catch (error) {
      console.error('❌ RegistrationTestHelper: Test failed:', error);
      return {
        success: false,
        message: `Registration test failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Test user creation with various validation scenarios
   */
  static async testValidationScenarios(): Promise<{
    success: boolean;
    results: Array<{ scenario: string; passed: boolean; message: string }>;
  }> {
    const results: Array<{ scenario: string; passed: boolean; message: string }> = [];
    
    // Test 1: Valid user creation
    try {
      const validUser = {
        name: 'Valid Test User',
        email: `valid${Date.now()}@test.com`,
        password: 'validpass123',
        role: 'patient' as const,
        age: 25,
        gender: 'female' as const
      };
      
      await dataService.createUser(validUser);
      results.push({
        scenario: 'Valid user creation',
        passed: true,
        message: 'Successfully created user with valid data'
      });
    } catch (error) {
      results.push({
        scenario: 'Valid user creation',
        passed: false,
        message: `Failed to create valid user: ${error instanceof Error ? error.message : String(error)}`
      });
    }
    
    // Test 2: Duplicate email (should fail)
    try {
      const timestamp = Date.now();
      const duplicateUser = {
        name: 'Duplicate User 1',
        email: `duplicate${timestamp}@test.com`,
        password: 'password123',
        role: 'patient' as const
      };
      
      // Create first user
      await dataService.createUser(duplicateUser);
      
      // Try to create second user with same email (should fail)
      const duplicateUser2 = { ...duplicateUser, name: 'Duplicate User 2' };
      await dataService.createUser(duplicateUser2);
      
      results.push({
        scenario: 'Duplicate email prevention',
        passed: false,
        message: 'System allowed duplicate email (should have been prevented)'
      });
    } catch (error) {
      results.push({
        scenario: 'Duplicate email prevention',
        passed: true,
        message: 'Correctly prevented duplicate email registration'
      });
    }
    
    // Test 3: Invalid email format (should fail)
    try {
      const invalidEmailUser = {
        name: 'Invalid Email User',
        email: 'not-an-email',
        password: 'password123',
        role: 'patient' as const
      };
      
      await dataService.createUser(invalidEmailUser);
      results.push({
        scenario: 'Invalid email validation',
        passed: false,
        message: 'System allowed invalid email format'
      });
    } catch (error) {
      results.push({
        scenario: 'Invalid email validation',
        passed: true,
        message: 'Correctly rejected invalid email format'
      });
    }
    
    // Test 4: Weak password (should fail)
    try {
      const weakPasswordUser = {
        name: 'Weak Password User',
        email: `weak${Date.now()}@test.com`,
        password: '123',
        role: 'patient' as const
      };
      
      await dataService.createUser(weakPasswordUser);
      results.push({
        scenario: 'Weak password validation',
        passed: false,
        message: 'System allowed weak password'
      });
    } catch (error) {
      results.push({
        scenario: 'Weak password validation',
        passed: true,
        message: 'Correctly rejected weak password'
      });
    }
    
    const allPassed = results.every(r => r.passed);
    
    return {
      success: allPassed,
      results
    };
  }
  
  /**
   * Create a sample user for testing login functionality
   */
  static async createSampleUser(): Promise<{
    success: boolean;
    credentials?: { email: string; password: string };
    message: string;
  }> {
    try {
      const timestamp = Date.now();
      const sampleUser = {
        name: 'Sample Test User',
        email: `sample${timestamp}@healthai.com`,
        password: 'sample123',
        role: 'patient' as const,
        age: 28,
        gender: 'female' as const,
        location: 'Sample City',
        medicalHistory: 'Sample medical history for testing purposes.'
      };
      
      console.log('👤 Creating sample user for testing:', sampleUser.email);
      const userProfile = await dataService.createUser(sampleUser);
      
      console.log('✅ Sample user created successfully:', userProfile.id);
      
      return {
        success: true,
        credentials: {
          email: sampleUser.email,
          password: sampleUser.password
        },
        message: `Sample user created successfully! You can now login with:\nEmail: ${sampleUser.email}\nPassword: ${sampleUser.password}`
      };
    } catch (error) {
      console.error('❌ Failed to create sample user:', error);
      return {
        success: false,
        message: `Failed to create sample user: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export default RegistrationTestHelper;