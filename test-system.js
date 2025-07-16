import { testFirebaseIntegration, enhancedSuperAdminOps } from './src/utils/testFirebaseIntegration';

// Quick test to verify Firebase integration
const runSystemTest = async () => {
  console.log('🔥 Starting System Integration Test...');
  
  try {
    // Test Firebase connection and basic operations
    const testResult = await testFirebaseIntegration();
    
    if (testResult.success) {
      console.log('✅ Firebase Integration Test PASSED');
      console.log('📊 System Stats:', testResult.stats);
      
      // Get system overview
      const overview = await enhancedSuperAdminOps.getSystemOverview();
      console.log('📈 System Overview:', overview);
      
      console.log('\n🚀 System is ready for Super Admin access!');
      console.log('📱 Access the app at: http://localhost:5174');
      console.log('🔐 Super Admin Login: superadmin@urcet.edu / SuperAdmin123!');
      
    } else {
      console.log('❌ Firebase Integration Test FAILED');
      console.error('Error:', testResult.error);
    }
    
  } catch (error) {
    console.error('💥 System test failed:', error);
  }
};

// Run the test
runSystemTest();
