import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

// Create your super admin account
const createCustomSuperAdmin = async () => {
  try {
    console.log('Creating custom super admin account...');
    
    const email = 'dell.123456.b@gmail.com';
    const password = 'yarli20042';
    const name = 'Dell Super Administrator';
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      email: email,
      name: name,
      role: 'super_admin',
      isActive: true,
      createdAt: serverTimestamp()
    });
    
    console.log('✅ Custom Super Admin created successfully!');
    console.log('📧 Email:', email);
    console.log('🔒 Password:', password);
    console.log('👤 Name:', name);
    console.log('🆔 UID:', firebaseUser.uid);
    console.log('\n🎉 You can now login with these credentials!');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('✅ Super admin with this email already exists!');
      console.log('📧 Email: dell.123456.b@gmail.com');
      console.log('🔒 Password: yarli20042');
      console.log('\n🎉 You can login with these credentials!');
    } else {
      console.error('❌ Error creating super admin:', error);
    }
  }
};

// Run the script
createCustomSuperAdmin();

export {};
