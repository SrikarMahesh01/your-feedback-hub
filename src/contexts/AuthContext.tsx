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

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string) => Promise<void>;
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
          setFirebaseUser(firebaseUser);
          // Get user data from Firestore
          const userData = await getUserById(firebaseUser.uid);
          if (userData) {
            setUser(userData);
          } else {
            // If user data doesn't exist in Firestore, try to find by email
            const userByEmail = await getUserByEmail(firebaseUser.email || '');
            if (userByEmail) {
              setUser(userByEmail);
            } else {
              // User exists in Auth but not in Firestore - this shouldn't happen
              console.error('User exists in Auth but not in Firestore');
              await signOut(auth);
            }
          }
        } else {
          setFirebaseUser(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setFirebaseUser(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
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
    } catch (error: any) {
      console.error('Login error:', error);
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
      const userId = await createUser({
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
    } catch (error: any) {
      console.error('Registration error:', error);
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
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};