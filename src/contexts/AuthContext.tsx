import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
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
          // Check if this is a new browser session (browser was closed and reopened)
          if (SessionManager.isNewBrowserSession()) {
            // Browser was closed and reopened, log out the user
            await signOut(auth);
            SessionManager.clearSession();
            setFirebaseUser(null);
            setUser(null);
            setLoading(false);
            return;
          }

          // Check if session is still valid
          if (!SessionManager.isSessionValid()) {
            // Session expired or invalid, log out
            await signOut(auth);
            SessionManager.clearSession();
            setFirebaseUser(null);
            setUser(null);
            setLoading(false);
            return;
          }

          // Valid session, proceed with user authentication
          setFirebaseUser(firebaseUser);
          // Get user data from Firestore
          const userData = await getUserById(firebaseUser.uid);
          if (userData) {
            setUser(userData);
            // Initialize or continue session
            if (!SessionManager.getSessionId()) {
              SessionManager.initializeSession();
            } else {
              SessionManager.startHeartbeat();
            }
          } else {
            // If user data doesn't exist in Firestore, try to find by email
            const userByEmail = await getUserByEmail(firebaseUser.email || '');
            if (userByEmail) {
              setUser(userByEmail);
              // Initialize or continue session
              if (!SessionManager.getSessionId()) {
                SessionManager.initializeSession();
              } else {
                SessionManager.startHeartbeat();
              }
            } else {
              // User exists in Auth but not in Firestore - this shouldn't happen
              await signOut(auth);
              SessionManager.clearSession();
            }
          }
        } else {
          setFirebaseUser(null);
          setUser(null);
          SessionManager.stopHeartbeat();
        }
      } catch (error) {
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
      throw new Error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt'>, password: string) => {
    setLoading(true);
    try {
      // Check if user already exists
      const existingUser = await getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
      const firebaseUser = userCredential.user;

      // Create user profile in Firestore with the Firebase UID
      await createUser({
        ...userData,
        id: firebaseUser.uid, // Use Firebase UID as the document ID
      });

      const newUser: User = {
        ...userData,
        id: firebaseUser.uid,
        createdAt: new Date().toISOString(),
      };

      setFirebaseUser(firebaseUser);
      setUser(newUser);
      
      // Initialize session management for the new user
      SessionManager.initializeSession();
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
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