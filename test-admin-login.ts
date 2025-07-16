import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './src/config/firebase';
import { getUserByEmail } from './src/services/firebaseService';

const testAdminLogin = async () => {
  console.log('🔐 Testing Admin Login with Generated Password...\n');

  try {
    const email = 'test.hod@urcet.edu';
    const password = 'RT4^sJ@5qZ4*'; // Password from previous test

    console.log(`Attempting login with email: ${email}`);
    
    // Try to sign in with the generated password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    console.log('✅ Firebase Auth login successful!');
    console.log(`Firebase UID: ${firebaseUser.uid}`);
    console.log(`Email: ${firebaseUser.email}`);

    // Get user profile from Firestore
    const userProfile = await getUserByEmail(email);
    
    if (userProfile) {
      console.log('✅ User profile found in Firestore!');
      console.log(`Name: ${userProfile.name}`);
      console.log(`Role: ${userProfile.role}`);
      console.log(`Department(s): ${Array.isArray(userProfile.department) ? userProfile.department.join(', ') : userProfile.department}`);
      console.log(`Active: ${userProfile.isActive}`);
    } else {
      console.log('❌ User profile not found in Firestore');
    }

    // Sign out
    await auth.signOut();
    console.log('✅ Signed out successfully');

  } catch (error: any) {
    console.error('❌ Login test failed:', error.message);
  }
};

// Run the test
testAdminLogin();
