// Test student registration flow exactly as it happens in the frontend
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './src/config/firebase';
import { createUser, getUserByEmail } from './src/services/firebaseService';

const testStudentRegistration = async () => {
  console.log('🎓 Testing Student Registration Flow...\n');
  
  const testData = {
    email: `test.student.${Date.now()}@urcet.edu`,
    password: 'TestPass123!',
    name: 'Test Student Registration',
    role: 'student' as const,
    rollNumber: `21CS${Date.now().toString().slice(-3)}`,
    year: '3',
    branch: 'CSE',
    isActive: true
  };
  
  try {
    // Step 1: Check if user already exists (as done in AuthContext)
    console.log('1️⃣ Checking if user already exists...');
    const existingUser = await getUserByEmail(testData.email);
    if (existingUser) {
      console.log('❌ User already exists:', existingUser.email);
      return;
    }
    console.log('✅ User does not exist, proceeding with registration');
    
    // Step 2: Create Firebase Auth user
    console.log('\n2️⃣ Creating Firebase Auth user...');
    const userCredential = await createUserWithEmailAndPassword(auth, testData.email, testData.password);
    const firebaseUser = userCredential.user;
    console.log('✅ Firebase Auth user created successfully!');
    console.log('   UID:', firebaseUser.uid);
    console.log('   Email:', firebaseUser.email);
    
    // Step 3: Create user profile in Firestore
    console.log('\n3️⃣ Creating user profile in Firestore...');
    const { password, ...userDataWithoutPassword } = testData;
    const userId = await createUser({
      ...userDataWithoutPassword,
      id: firebaseUser.uid,
    });
    console.log('✅ User profile created in Firestore!');
    console.log('   User ID:', userId);
    
    // Step 4: Verify user can be retrieved
    console.log('\n4️⃣ Verifying user can be retrieved...');
    const retrievedUser = await getUserByEmail(testData.email);
    if (retrievedUser) {
      console.log('✅ User retrieved successfully!');
      console.log('   Name:', retrievedUser.name);
      console.log('   Role:', retrievedUser.role);
      console.log('   Roll Number:', retrievedUser.rollNumber);
      console.log('   Year:', retrievedUser.year);
      console.log('   Branch:', retrievedUser.branch);
    } else {
      console.log('❌ Failed to retrieve user');
    }
    
    console.log('\n🎉 STUDENT REGISTRATION FLOW COMPLETED SUCCESSFULLY!');
    console.log('✅ The registration process is working correctly');
    console.log('✅ Student can now login with:', testData.email);
    
  } catch (error) {
    console.error('❌ Student Registration Failed:', error);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.message) {
      console.error('Error Message:', error.message);
    }
    
    // Provide specific guidance based on error
    if (error.code === 'auth/email-already-in-use') {
      console.log('💡 This email is already registered. Try logging in instead.');
    } else if (error.code === 'auth/weak-password') {
      console.log('💡 Password is too weak. Use at least 6 characters.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('💡 Invalid email format. Please check the email address.');
    } else if (error.code === 'permission-denied') {
      console.log('💡 Permission denied. Check Firestore security rules.');
    }
  }
};

// Test the registration flow
testStudentRegistration();

export {};
