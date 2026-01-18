import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

// Configuration from your project
const firebaseConfig = {
  apiKey: "AIzaSyCIGT_idUZfeVQ-QSlNMyJpWQvwGjWfe60",
  authDomain: "your-feedback-hub.firebaseapp.com",
  projectId: "your-feedback-hub",
  storageBucket: "your-feedback-hub.firebasestorage.app",
  messagingSenderId: "1043382584598",
  appId: "1:1043382584598:web:3946235a708822e8377c37"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const fixSuperAdmin = async () => {
  const email = 'dell.123456.b@gmail.com';
  const password = 'yarli20042';
  const name = 'Dell Super Administrator';

  console.log(`\n🔧 Starting Super Admin Repair for: ${email}`);

  let user;
  
  // Step 1: Ensure Authentication Exists
  try {
    console.log('... Attempting to sign in');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    user = cred.user;
    console.log('✅ Authenticated successfully.');
  } catch (e: any) {
    if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
      console.log('⚠️ User not found or invalid credentials. Attempting to create new user...');
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        user = cred.user;
        console.log('✅ Created new user in Firebase Auth.');
      } catch (createErr: any) {
        if (createErr.code === 'auth/email-already-in-use') {
             console.error('❌ Error: Email exists but password was wrong. Please delete the user from Firebase Console or use the correct password.');
        } else {
             console.error('❌ Failed to create user:', createErr.message);
        }
        process.exit(1);
      }
    } else {
      console.error('❌ Login error:', e.message);
      process.exit(1);
    }
  }

  // Step 2: Ensure Firestore Profile Exists
  if (user) {
    console.log(`... Checking Firestore profile for UID: ${user.uid}`);
    const userDocRef = doc(db, 'users', user.uid);
    
    try {
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            console.log('⚠️ Firestore document missing. Creating it now...');
            await setDoc(userDocRef, {
                email: email,
                name: name,
                role: 'super_admin',
                isActive: true,
                createdAt: serverTimestamp(),
                department: ['ALL'] // Super admin usually has access to all
            });
            console.log('✅  Firestore document created successfully.');
        } else {
            console.log('ℹ️  User document exists. Verifying role...');
            const data = userDoc.data();
            
            if (data.role !== 'super_admin') {
                console.log('⚠️ Role is incorrect. Updating to super_admin...');
                await setDoc(userDocRef, { role: 'super_admin' }, { merge: true });
                console.log('✅ Role updated.');
            } else {
                console.log('✅ User is correctly configured as super_admin.');
            }
        }
    } catch (err: any) {
        console.error('❌ Firestore Error:', err.message);
        console.log('NOTE: If this fails with "permission-denied", your firestore.rules might be blocking writes. However, since you are logged in as this user, standard rules should allow creation of your own profile.');
    }
  }

  console.log('\n🎉 Repair Complete. You should be able to login now!');
  process.exit(0);
};

fixSuperAdmin();
