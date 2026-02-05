import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUser, getUserById, getUserByEmail } from '../services/firebaseService';
import { User } from '../types';
import { SessionManager } from '../utils/sessionManager';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: Omit<User, 'id' | 'createdAt'>, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          // 🔐 Firebase browserSessionPersistence handles session management automatically
          // No need for complex custom session logic as Firebase will:
          // - Keep session alive across tabs in same browser
          // - Clear session when browser is closed
          // - Prevent session in incognito/different browsers
          
          setFirebaseUser(firebaseUser);
          
          // Get user data from Firestore
          const userData = await getUserById(firebaseUser.uid);
          if (userData) {
            setUser(userData);
            // Initialize basic session tracking for UI purposes
            SessionManager.initializeSession();
          } else {
            // If user data doesn't exist in Firestore, try to find by email
            const userByEmail = await getUserByEmail(firebaseUser.email || '');
            if (userByEmail) {
              setUser(userByEmail);
              SessionManager.initializeSession();
            } else {
              // User exists in Auth but not in Firestore - this shouldn't happen
              await signOut(auth);
              SessionManager.clearSession();
            }
          }
        } else {
          // No Firebase user - clear everything
          setFirebaseUser(null);
          setUser(null);
          SessionManager.clearSession();
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setFirebaseUser(null);
        setUser(null);
        SessionManager.clearSession();
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      // 🛡️ Ensure browserSessionPersistence is set before authentication
      await setPersistence(auth, browserSessionPersistence);
      
      // 🔐 Sign in with session persistence enforced
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user data from Firestore
      const userData = await getUserByEmail(email);
      if (!userData) {
        throw new Error('User profile not found');
      }
      
      setFirebaseUser(firebaseUser);
      setUser(userData);
      
      // Initialize session management for the logged-in user
      SessionManager.initializeSession();
      
      return userData;
    } catch (error: any) {
      // Preserve the original error object to maintain Firebase error codes
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt'>, password: string) => {
    setLoading(true);
    try {
      // 🛡️ Ensure browserSessionPersistence is set before registration
      await setPersistence(auth, browserSessionPersistence);

      // Create Firebase Auth user first - this will authenticate the user
      // Firebase Auth will handle duplicate email checking automatically
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
      const firebaseUser = userCredential.user;

      // Now that we're authenticated, create user profile in Firestore with the Firebase UID
      await createUser({
        ...userData,
        id: firebaseUser.uid, // Use Firebase UID as the document ID
      });

      const newUser: User = {
        ...userData,
        id: firebaseUser.uid,
        createdAt: new Date().toISOString(),
      };

      // Don't set the user state immediately - let them login properly
      // This ensures a clean authentication flow
      console.log('User created successfully:', newUser);
      
      // Sign out immediately after registration to force proper login
      await signOut(auth);
      setFirebaseUser(null);
      setUser(null);
      SessionManager.clearSession();
      
      console.log('User signed out after registration. Please login.');
    } catch (error: any) {
      // Preserve the original error object to maintain Firebase error codes
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
      setUser(null);
      
      // Clear session management
      SessionManager.clearSession();
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};