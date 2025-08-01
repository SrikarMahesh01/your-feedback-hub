// Test all Super Admin CRUD operations
import { 
  getAllUsers, 
  getAllGrievances, 
  getFeedbackFormsByDepartment,
  createUser,
  deleteUser,
  assignUserRole,
  toggleUserStatus,
  updateGrievanceStatus,
  deleteGrievance,
  toggleFeedbackFormStatus,
  deleteFeedbackForm
} from './src/services/firebaseService';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './src/config/firebase';
import { addDoc, collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './src/config/firebase';

const testSuperAdminOperations = async () => {
  console.log('👑 Testing Super Admin CRUD Operations...\n');
  
  let testUserId: string;
  let testGrievanceId: string;
  
  try {
    // 1. TEST USER MANAGEMENT
    console.log('1️⃣ Testing User Management Operations...');
    
    // Create a test user
    const testEmail = `admin.test.${Date.now()}@urcet.edu`;
    const testPassword = 'AdminTest123!';
    
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const firebaseUser = userCredential.user;
    testUserId = firebaseUser.uid;
    
    const testUserData = {
      id: testUserId,
      email: testEmail,
      name: 'Test Admin User',
      role: 'admin' as const,
      department: 'CSE',
      isActive: true
    };
    
    await createUser(testUserData);
    console.log('✅ CREATE USER: Test user created successfully!');
    
    // Test get all users
    const allUsers = await getAllUsers();
    console.log('✅ READ USERS: Retrieved', allUsers.length, 'users');
    
    // Test role assignment
    await assignUserRole(testUserId, 'student');
    console.log('✅ UPDATE USER ROLE: Role changed to student');
    
    // Test toggle user status
    await toggleUserStatus(testUserId, false);
    console.log('✅ UPDATE USER STATUS: User deactivated');
    
    await toggleUserStatus(testUserId, true);
    console.log('✅ UPDATE USER STATUS: User reactivated');
    
    // 2. TEST GRIEVANCE MANAGEMENT
    console.log('\n2️⃣ Testing Grievance Management Operations...');
    
    // Create a test grievance
    const grievanceData = {
      studentId: testUserId,
      studentName: 'Test Student',
      title: 'Test Grievance for Admin Operations',
      description: 'This is a test grievance for admin CRUD operations',
      category: 'academic',
      department: 'CSE',
      status: 'pending',
      priority: 'medium',
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const grievanceRef = await addDoc(collection(db, 'grievances'), grievanceData);
    testGrievanceId = grievanceRef.id;
    console.log('✅ CREATE GRIEVANCE: Test grievance created');
    
    // Test get all grievances
    const allGrievances = await getAllGrievances();
    console.log('✅ READ GRIEVANCES: Retrieved', allGrievances.length, 'grievances');
    
    // Test update grievance status
    await updateGrievanceStatus(testGrievanceId, 'resolved');
    console.log('✅ UPDATE GRIEVANCE: Status changed to resolved');
    
    // 3. TEST FEEDBACK FORM MANAGEMENT
    console.log('\n3️⃣ Testing Feedback Form Management Operations...');
    
    // Create a test feedback form
    const formData = {
      title: 'Test Feedback Form',
      description: 'This is a test feedback form for admin operations',
      questions: [
        {
          id: 'q1',
          type: 'text',
          question: 'What is your feedback?',
          required: true
        }
      ],
      department: 'CSE',
      createdBy: testUserId,
      isAnonymous: false,
      isActive: true,
      createdAt: serverTimestamp()
    };
    
    const formRef = await addDoc(collection(db, 'feedback_forms'), formData);
    const testFormId = formRef.id;
    console.log('✅ CREATE FORM: Test feedback form created');
    
    // Test get feedback forms
    const cseForms = await getFeedbackFormsByDepartment('CSE');
    console.log('✅ READ FORMS: Retrieved', cseForms.length, 'CSE forms');
    
    // Test toggle form status
    await toggleFeedbackFormStatus(testFormId, false);
    console.log('✅ UPDATE FORM: Form deactivated');
    
    await toggleFeedbackFormStatus(testFormId, true);
    console.log('✅ UPDATE FORM: Form reactivated');
    
    // 4. CLEANUP - DELETE OPERATIONS
    console.log('\n4️⃣ Testing Delete Operations...');
    
    // Delete feedback form
    await deleteFeedbackForm(testFormId);
    console.log('✅ DELETE FORM: Feedback form deleted');
    
    // Delete grievance
    await deleteGrievance(testGrievanceId);
    console.log('✅ DELETE GRIEVANCE: Grievance deleted');
    
    // Delete user
    await deleteUser(testUserId);
    console.log('✅ DELETE USER: User deleted');
    
    console.log('\n🎉 ALL SUPER ADMIN OPERATIONS COMPLETED SUCCESSFULLY!');
    console.log('✅ User Management: CREATE, READ, UPDATE, DELETE - Working');
    console.log('✅ Grievance Management: CREATE, READ, UPDATE, DELETE - Working');
    console.log('✅ Feedback Form Management: CREATE, READ, UPDATE, DELETE - Working');
    console.log('✅ Role Assignment: Working');
    console.log('✅ Status Toggle: Working');
    
  } catch (error) {
    console.error('❌ Super Admin Operations Test Failed:', error);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.message) {
      console.error('Error Message:', error.message);
    }
  }
};

// Test all operations
testSuperAdminOperations();

export {};
