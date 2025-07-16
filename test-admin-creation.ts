import { createAdminUser } from './src/services/firebaseService';
import { generateRandomPassword } from './src/utils/passwordUtils';

const testAdminCreation = async () => {
  console.log('🧪 Testing Admin Creation with Password Generation...\n');

  try {
    // Generate a random password
    const password = generateRandomPassword(12);
    console.log(`Generated password: ${password}`);

    // Test admin data
    const adminData = {
      email: 'test.hod@urcet.edu',
      name: 'Test HOD',
      department: ['CSE', 'AI ML'],
      password: password,
    };

    console.log('Creating admin user...');
    const result = await createAdminUser(adminData);

    if (result.success) {
      console.log('✅ Admin user created successfully!');
      console.log(`User ID: ${result.userId}`);
      console.log(`Email: ${adminData.email}`);
      console.log(`Password: ${adminData.password}`);
      console.log(`Name: ${adminData.name}`);
      console.log(`Departments: ${adminData.department.join(', ')}`);
    } else {
      console.log('❌ Failed to create admin user');
      console.log(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testAdminCreation();
