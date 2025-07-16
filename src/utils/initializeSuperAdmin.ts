import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { createSuperAdmin } from '../services/firebaseService';

// Initialize Super Admin with custom credentials
export const initializeSuperAdminWithCredentials = async (email: string, password: string, name: string = 'Super Administrator') => {
  try {
    console.log('Creating super admin account with custom credentials...');
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      email, 
      password
    );
    
    const firebaseUser = userCredential.user;
    
    // Create super admin profile in Firestore
    await createSuperAdmin({
      id: firebaseUser.uid,
      email: email,
      name: name,
      role: 'super_admin',
    });
    
    console.log('Super admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    
    return {
      email: email,
      password: password,
      uid: firebaseUser.uid,
    };
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Super admin with this email already exists!');
      return { email: email, password: password };
    }
    console.error('Error creating super admin:', error);
    throw error;
  }
};

// Initialize Super Admin
export const initializeSuperAdmin = async () => {
  try {
    const superAdminEmail = 'superadmin@urcet.edu';
    const superAdminPassword = 'SuperAdmin123!';
    
    console.log('Creating super admin account...');
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      superAdminEmail, 
      superAdminPassword
    );
    
    const firebaseUser = userCredential.user;
    
    // Create super admin profile in Firestore
    await createSuperAdmin({
      id: firebaseUser.uid,
      email: superAdminEmail,
      name: 'System Super Administrator',
      role: 'super_admin',
    });
    
    console.log('Super admin created successfully!');
    console.log('Email:', superAdminEmail);
    console.log('Password:', superAdminPassword);
    console.log('Please change this password after first login.');
    
    return {
      email: superAdminEmail,
      password: superAdminPassword,
      uid: firebaseUser.uid,
    };
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Super admin already exists!');
      return { email: 'superadmin@urcet.edu', password: 'SuperAdmin123!' };
    }
    console.error('Error creating super admin:', error);
    throw error;
  }
};

// Create demo users for testing
export const createDemoUsers = async () => {
  try {
    console.log('Creating demo users...');
    
    const demoUsers = [
      {
        email: 'student@urcet.edu',
        password: 'Student123!',
        name: 'Rajesh Kumar',
        role: 'student' as const,
        rollNumber: '21CS001',
        year: '3',
        branch: 'CSE',
      },
      {
        email: 'hod.cse@urcet.edu',
        password: 'HodCSE123!',
        name: 'Dr. Priya Sharma',
        role: 'admin' as const,
        department: 'CSE',
      },
      {
        email: 'hod.ece@urcet.edu',
        password: 'HodECE123!',
        name: 'Dr. Suresh Reddy',
        role: 'admin' as const,
        department: 'ECE',
      },
    ];
    
    for (const user of demoUsers) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          user.email,
          user.password
        );
        
        const { password, ...userDataWithoutPassword } = user;
        
        await createSuperAdmin({
          id: userCredential.user.uid,
          ...userDataWithoutPassword,
        });
        
        console.log(`Created ${user.role}: ${user.email}`);
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`${user.email} already exists, skipping...`);
        } else {
          console.error(`Error creating ${user.email}:`, error);
        }
      }
    }
    
    console.log('Demo users creation completed!');
    return demoUsers;
  } catch (error) {
    console.error('Error creating demo users:', error);
    throw error;
  }
};
