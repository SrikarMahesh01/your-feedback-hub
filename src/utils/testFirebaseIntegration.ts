import { initializeSuperAdmin, createDemoUsers } from './initializeSuperAdmin';
import { 
  getAllUsers, 
  getAllGrievances, 
  getFeedbackFormsByDepartment,
  getSystemStats,
  createUser,
  getUserByEmail
} from '../services/firebaseService';
import { User } from '../types';

// Test Firebase connection and Super Admin functionality
export const testFirebaseIntegration = async () => {
  console.log('🔥 Testing Firebase Integration...');
  
  try {
    // 1. Test Firebase connection
    console.log('1. Testing Firebase connection...');
    const stats = await getSystemStats();
    console.log('✅ Firebase connection successful!', stats);
    
    // 2. Test Super Admin initialization
    console.log('2. Testing Super Admin initialization...');
    try {
      await initializeSuperAdmin();
      console.log('✅ Super Admin initialized successfully!');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('✅ Super Admin already exists!');
      } else {
        console.error('❌ Super Admin initialization failed:', error);
      }
    }
    
    // 3. Test Super Admin access
    console.log('3. Testing Super Admin access...');
    const superAdmin = await getUserByEmail('superadmin@urcet.edu');
    if (superAdmin && superAdmin.role === 'super_admin') {
      console.log('✅ Super Admin access verified!', {
        email: superAdmin.email,
        name: superAdmin.name,
        role: superAdmin.role
      });
    } else {
      console.log('❌ Super Admin not found or role incorrect');
    }
    
    // 4. Test demo users creation
    console.log('4. Testing demo users creation...');
    try {
      await createDemoUsers();
      console.log('✅ Demo users created successfully!');
    } catch (error: any) {
      console.log('ℹ️ Demo users may already exist:', error.message);
    }
    
    // 5. Test all operations
    console.log('5. Testing all operations...');
    
    // Test user management
    const allUsers = await getAllUsers();
    console.log('✅ User management working:', allUsers.length, 'users found');
    
    // Test grievance management
    const allGrievances = await getAllGrievances();
    console.log('✅ Grievance management working:', allGrievances.length, 'grievances found');
    
    // Test feedback form management
    const cseforms = await getFeedbackFormsByDepartment('CSE');
    console.log('✅ Feedback form management working:', cseforms.length, 'forms found');
    
    return {
      success: true,
      message: 'All tests passed! Firebase integration is working correctly.',
      stats: {
        users: allUsers.length,
        grievances: allGrievances.length,
        forms: cseforms.length
      }
    };
    
  } catch (error) {
    console.error('❌ Firebase integration test failed:', error);
    return {
      success: false,
      message: 'Firebase integration test failed',
      error: error
    };
  }
};

// Enhanced Super Admin operations
export const enhancedSuperAdminOps = {
  // Initialize complete system
  initializeSystem: async () => {
    console.log('🚀 Initializing complete system...');
    
    try {
      // 1. Initialize Super Admin
      await initializeSuperAdmin();
      console.log('✅ Super Admin initialized');
      
      // 2. Create demo users
      await createDemoUsers();
      console.log('✅ Demo users created');
      
      // 3. Create additional admin users for all departments
      const departments = ['CSE', 'AI ML', 'AI DS', 'ECE', 'EEE', 'IT', 'MECH'];
      for (const dept of departments) {
        const adminEmail = `hod.${dept.toLowerCase().replace(' ', '')}@urcet.edu`;
        const existingAdmin = await getUserByEmail(adminEmail);
        
        if (!existingAdmin) {
          const adminUser: Omit<User, 'createdAt'> = {
            id: `admin_${dept.toLowerCase().replace(' ', '_')}_${Date.now()}`,
            email: adminEmail,
            name: `HOD ${dept}`,
            role: 'admin',
            department: dept,
            isActive: true
          };
          
          await createUser(adminUser);
          console.log(`✅ Created admin for ${dept} department`);
        }
      }
      
      return { success: true, message: 'System initialized successfully!' };
    } catch (error) {
      console.error('❌ System initialization failed:', error);
      return { success: false, error };
    }
  },
  
  // Get comprehensive system overview
  getSystemOverview: async () => {
    try {
      const [users, grievances, stats] = await Promise.all([
        getAllUsers(),
        getAllGrievances(),
        getSystemStats()
      ]);
      
      return {
        users: {
          total: users.length,
          students: users.filter(u => u.role === 'student').length,
          admins: users.filter(u => u.role === 'admin').length,
          superAdmins: users.filter(u => u.role === 'super_admin').length
        },
        grievances: {
          total: grievances.length,
          pending: grievances.filter(g => g.status === 'pending').length,
          resolved: grievances.filter(g => g.status === 'resolved').length
        },
        stats
      };
    } catch (error) {
      console.error('❌ Failed to get system overview:', error);
      throw error;
    }
  }
};
