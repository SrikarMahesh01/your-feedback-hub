// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
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

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// 🛡️ Set authentication persistence to SESSION for browser-session-only persistence
// This ensures: 
// - Sessions persist across tabs in the same browser window
// - Sessions are cleared when browser is closed
// - Sessions don't persist in new incognito windows or different browsers
// - Prevents misuse of URLs copied to other devices/browsers
setPersistence(auth, browserSessionPersistence).catch((error) => {
  console.warn('Failed to set authentication persistence:', error);
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;