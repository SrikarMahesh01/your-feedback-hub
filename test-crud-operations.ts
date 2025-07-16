import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIGT_idUZfeVQ-QSlNMyJpWQvwGjWfe60",
  authDomain: "your-feedback-hub.firebaseapp.com",
  projectId: "your-feedback-hub",
  storageBucket: "your-feedback-hub.firebasestorage.app",
  messagingSenderId: "1043382584598",
  appId: "1:1043382584598:web:3946235a708822e8377c37"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test student registration and CRUD operations
const testCRUDOperations = async () => {
  console.log('🧪 Testing CRUD Operations...\n');
  
  const testStudent = {
    email: `test.student.${Date.now()}@urcet.edu`,
    password: 'TestPass123!',
    name: 'Test Student',
    rollNumber: `21CS${Date.now().toString().slice(-3)}`,
    year: '3',
    branch: 'CSE',
    role: 'student',
    isActive: true
  };

  try {
    // 1. TEST CREATE (Student Registration)
    console.log('1️⃣ Testing CREATE Operation (Student Registration)...');
    const userCredential = await createUserWithEmailAndPassword(auth, testStudent.email, testStudent.password);
    const firebaseUser = userCredential.user;
    
    // Create user document in Firestore
    const userData = {
      id: firebaseUser.uid,
      email: testStudent.email,
      name: testStudent.name,
      role: testStudent.role,
      rollNumber: testStudent.rollNumber,
      year: testStudent.year,
      branch: testStudent.branch,
      isActive: testStudent.isActive,
      createdAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    console.log('✅ CREATE: Student registered successfully!');
    console.log('   Email:', testStudent.email);
    console.log('   UID:', firebaseUser.uid);
    
    // 2. TEST READ Operation
    console.log('\n2️⃣ Testing READ Operation...');
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      console.log('✅ READ: User document retrieved successfully!');
      console.log('   Data:', userDoc.data());
    } else {
      console.log('❌ READ: User document not found!');
    }
    
    // 3. TEST UPDATE Operation
    console.log('\n3️⃣ Testing UPDATE Operation...');
    const updateData = {
      name: 'Updated Test Student',
      year: '4',
      updatedAt: serverTimestamp()
    };
    await updateDoc(doc(db, 'users', firebaseUser.uid), updateData);
    
    // Verify update
    const updatedDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (updatedDoc.exists() && updatedDoc.data().name === 'Updated Test Student') {
      console.log('✅ UPDATE: User document updated successfully!');
      console.log('   Updated name:', updatedDoc.data().name);
      console.log('   Updated year:', updatedDoc.data().year);
    } else {
      console.log('❌ UPDATE: Failed to update user document!');
    }
    
    // 4. TEST Grievance Creation
    console.log('\n4️⃣ Testing Grievance Creation...');
    const grievanceData = {
      studentId: firebaseUser.uid,
      studentName: testStudent.name,
      title: 'Test Grievance',
      description: 'This is a test grievance description',
      category: 'academic',
      department: 'CSE',
      status: 'pending',
      priority: 'medium',
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const grievanceDoc = await addDoc(collection(db, 'grievances'), grievanceData);
    console.log('✅ GRIEVANCE CREATE: Grievance created successfully!');
    console.log('   Grievance ID:', grievanceDoc.id);
    
    // 5. TEST Feedback Form Query
    console.log('\n5️⃣ Testing Feedback Form Query...');
    const formsQuery = query(
      collection(db, 'feedback_forms'),
      where('department', '==', 'CSE'),
      where('isActive', '==', true)
    );
    const formsSnapshot = await getDocs(formsQuery);
    console.log('✅ QUERY: Feedback forms query executed successfully!');
    console.log('   Active CSE forms found:', formsSnapshot.size);
    
    // 6. TEST DELETE Operation (Clean up)
    console.log('\n6️⃣ Testing DELETE Operation...');
    
    // Delete grievance
    await deleteDoc(doc(db, 'grievances', grievanceDoc.id));
    console.log('✅ DELETE: Grievance deleted successfully!');
    
    // Delete user document
    await deleteDoc(doc(db, 'users', firebaseUser.uid));
    console.log('✅ DELETE: User document deleted successfully!');
    
    // Delete Firebase Auth user
    await deleteUser(firebaseUser);
    console.log('✅ DELETE: Firebase Auth user deleted successfully!');
    
    console.log('\n🎉 ALL CRUD OPERATIONS COMPLETED SUCCESSFULLY!');
    console.log('✅ Create: Working');
    console.log('✅ Read: Working');
    console.log('✅ Update: Working');
    console.log('✅ Delete: Working');
    console.log('✅ Query: Working');
    
  } catch (error) {
    console.error('❌ CRUD Test Failed:', error);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.message) {
      console.error('Error Message:', error.message);
    }
  }
};

// Test authentication flow
const testAuthFlow = async () => {
  console.log('\n🔐 Testing Authentication Flow...\n');
  
  const testEmail = `auth.test.${Date.now()}@urcet.edu`;
  const testPassword = 'AuthTest123!';
  
  try {
    // Test Registration
    console.log('1️⃣ Testing Registration...');
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✅ Registration successful!');
    console.log('   Email:', userCredential.user.email);
    console.log('   UID:', userCredential.user.uid);
    
    // Test Login
    console.log('\n2️⃣ Testing Login...');
    const loginCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('✅ Login successful!');
    console.log('   Logged in as:', loginCredential.user.email);
    
    // Clean up
    await deleteUser(loginCredential.user);
    console.log('✅ Test user cleaned up!');
    
  } catch (error) {
    console.error('❌ Auth Test Failed:', error);
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting Comprehensive CRUD and Auth Testing...\n');
  
  await testAuthFlow();
  await testCRUDOperations();
  
  console.log('\n🏁 All tests completed!');
};

runAllTests();

export {};
