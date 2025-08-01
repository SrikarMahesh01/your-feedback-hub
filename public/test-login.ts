import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

// Test login with your credentials
const testLogin = async () => {
  try {
    console.log('Testing login with your credentials...');
    
    const email = 'dell.123456.b@gmail.com';
    const password = 'yarli20042';
    
    // Try to sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    console.log('✅ Login successful!');
    console.log('📧 Email:', firebaseUser.email);
    console.log('🆔 UID:', firebaseUser.uid);
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('👤 User Data:', userData);
      console.log('🎭 Role:', userData.role);
      console.log('📝 Name:', userData.name);
      
      if (userData.role === 'super_admin') {
        console.log('🎉 Super Admin access confirmed!');
      } else {
        console.log('⚠️  User role is not super_admin');
      }
    } else {
      console.log('❌ User document not found in Firestore');
    }
    
  } catch (error) {
    console.error('❌ Login failed:', error);
    if (error.code === 'auth/user-not-found') {
      console.log('User not found. Please create the account first.');
    } else if (error.code === 'auth/wrong-password') {
      console.log('Incorrect password.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('Invalid email format.');
    }
  }
};

// Run the test
testLogin();

export {};
