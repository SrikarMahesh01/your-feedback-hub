import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, Grievance, FeedbackForm, FeedbackResponse } from '../types';
import { 
  createUserWithEmailAndPassword, 
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';

// Collections
const USERS_COLLECTION = 'users';
const GRIEVANCES_COLLECTION = 'grievances';
const FEEDBACK_FORMS_COLLECTION = 'feedback_forms';
const FEEDBACK_RESPONSES_COLLECTION = 'feedback_responses';
const ANONYMOUS_FORMS_COLLECTION = 'anonymous_forms';
const ANONYMOUS_RESPONSES_COLLECTION = 'anonymous_responses';

// User operations
export const createUser = async (userData: Omit<User, 'createdAt'>) => {
  try {
    // If userData has an ID, use it as the document ID (for Firebase Auth integration)
    if (userData.id) {
      const docRef = doc(db, USERS_COLLECTION, userData.id);
      await setDoc(docRef, {
        ...userData,
        createdAt: serverTimestamp(),
      });
      return userData.id;
    } else {
      // Create a new document with auto-generated ID
      const docRef = await addDoc(collection(db, USERS_COLLECTION), {
        ...userData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    }
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const createUserWithId = async (userData: Omit<User, 'createdAt'>) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userData.id);
    await setDoc(docRef, {
      ...userData,
      createdAt: serverTimestamp(),
    });
    return userData.id;
  } catch (error) {
    console.error('Error creating user with ID:', error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const q = query(collection(db, USERS_COLLECTION), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as User;
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, userData: Partial<User>) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string) => {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Grievance operations
export const createGrievance = async (grievanceData: Omit<Grievance, 'id' | 'submittedAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, GRIEVANCES_COLLECTION), {
      ...grievanceData,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating grievance:', error);
    throw error;
  }
};

export const getGrievancesByStudent = async (studentId: string): Promise<Grievance[]> => {
  try {
    const q = query(
      collection(db, GRIEVANCES_COLLECTION), 
      where('studentId', '==', studentId)
    );
    const querySnapshot = await getDocs(q);
    const grievances = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Grievance;
    });
    
    // Sort by submittedAt in JavaScript instead of Firestore
    return grievances.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  } catch (error) {
    console.error('Error getting grievances by student:', error);
    throw error;
  }
};

export const getGrievancesByDepartment = async (department: string): Promise<Grievance[]> => {
  try {
    const q = query(
      collection(db, GRIEVANCES_COLLECTION), 
      where('department', '==', department)
    );
    const querySnapshot = await getDocs(q);
    const grievances = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Grievance;
    });
    
    // Sort by submittedAt in JavaScript instead of Firestore
    return grievances.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  } catch (error) {
    console.error('Error getting grievances by department:', error);
    throw error;
  }
};

export const getAllGrievances = async (): Promise<Grievance[]> => {
  try {
    const q = query(collection(db, GRIEVANCES_COLLECTION));
    const querySnapshot = await getDocs(q);
    const grievances = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Grievance;
    });
    
    // Sort by submittedAt in JavaScript instead of Firestore
    return grievances.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  } catch (error) {
    console.error('Error getting all grievances:', error);
    throw error;
  }
};

export const updateGrievanceStatus = async (grievanceId: string, status: string, adminComments?: string[]) => {
  try {
    const docRef = doc(db, GRIEVANCES_COLLECTION, grievanceId);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };
    
    if (adminComments) {
      updateData.adminComments = adminComments;
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating grievance status:', error);
    throw error;
  }
};

// Feedback Form operations
export const createFeedbackForm = async (formData: Omit<FeedbackForm, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, FEEDBACK_FORMS_COLLECTION), {
      ...formData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating feedback form:', error);
    throw error;
  }
};

export const getFeedbackFormsByDepartment = async (department: string): Promise<FeedbackForm[]> => {
  try {
    const q = query(
      collection(db, FEEDBACK_FORMS_COLLECTION), 
      where('department', '==', department)
    );
    const querySnapshot = await getDocs(q);
    const forms = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        expiresAt: data.expiresAt?.toDate?.()?.toISOString(),
      } as FeedbackForm;
    });
    
    // Sort by createdAt in JavaScript instead of Firestore
    return forms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error getting feedback forms by department:', error);
    throw error;
  }
};

export const getAvailableFeedbackForms = async (studentYear?: string, studentBranch?: string): Promise<FeedbackForm[]> => {
  try {
    let q = query(
      collection(db, FEEDBACK_FORMS_COLLECTION), 
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const forms = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        expiresAt: data.expiresAt?.toDate?.()?.toISOString(),
      } as FeedbackForm;
    });

    // Filter forms based on target criteria
    return forms.filter(form => {
      const yearMatch = !form.targetYear || form.targetYear === studentYear;
      const branchMatch = !form.targetBranch || form.targetBranch === studentBranch;
      const notExpired = !form.expiresAt || new Date(form.expiresAt) > new Date();
      return yearMatch && branchMatch && notExpired;
    });
  } catch (error) {
    console.error('Error getting available feedback forms:', error);
    throw error;
  }
};

export const getAnonymousFeedbackForms = async (): Promise<FeedbackForm[]> => {
  try {
    const q = query(
      collection(db, ANONYMOUS_FORMS_COLLECTION), 
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        expiresAt: data.expiresAt?.toDate?.()?.toISOString(),
      } as FeedbackForm;
    });
  } catch (error) {
    console.error('Error getting anonymous feedback forms:', error);
    throw error;
  }
};

// Feedback Response operations
export const submitFeedbackResponse = async (responseData: Omit<FeedbackResponse, 'id' | 'submittedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, FEEDBACK_RESPONSES_COLLECTION), {
      ...responseData,
      submittedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error submitting feedback response:', error);
    throw error;
  }
};

export const submitAnonymousResponse = async (responseData: Omit<FeedbackResponse, 'id' | 'submittedAt' | 'studentId'>) => {
  try {
    const docRef = await addDoc(collection(db, ANONYMOUS_RESPONSES_COLLECTION), {
      ...responseData,
      submittedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error submitting anonymous response:', error);
    throw error;
  }
};

// n8n Webhook integration
export const sendWebhookNotification = async (data: any) => {
  try {
    // Replace with your actual n8n webhook URL
    const webhookUrl = process.env.REACT_APP_N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/grievance';
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        source: 'yoUR_Feedback_Hub',
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending webhook notification:', error);
    // Don't throw error to prevent blocking the main operation
    return null;
  }
};

// Real-time listeners
export const subscribeToGrievances = (callback: (grievances: Grievance[]) => void, department?: string) => {
  let q;
  if (department) {
    q = query(
      collection(db, GRIEVANCES_COLLECTION), 
      where('department', '==', department),
      orderBy('submittedAt', 'desc')
    );
  } else {
    q = query(collection(db, GRIEVANCES_COLLECTION), orderBy('submittedAt', 'desc'));
  }

  return onSnapshot(q, (querySnapshot) => {
    const grievances = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Grievance;
    });
    callback(grievances);
  });
};

export const subscribeToFeedbackForms = (callback: (forms: FeedbackForm[]) => void, department?: string) => {
  let q;
  if (department) {
    q = query(
      collection(db, FEEDBACK_FORMS_COLLECTION), 
      where('department', '==', department),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(collection(db, FEEDBACK_FORMS_COLLECTION), orderBy('createdAt', 'desc'));
  }

  return onSnapshot(q, (querySnapshot) => {
    const forms = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        expiresAt: data.expiresAt?.toDate?.()?.toISOString(),
      } as FeedbackForm;
    });
    callback(forms);
  });
};

// Admin operations
export const toggleUserStatus = async (userId: string, isActive: boolean) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    throw error;
  }
};

export const assignUserRole = async (userId: string, role: 'student' | 'admin' | 'super_admin') => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      role,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error assigning user role:', error);
    throw error;
  }
};

export const getSystemStats = async () => {
  try {
    const [usersSnapshot, grievancesSnapshot, formsSnapshot] = await Promise.all([
      getDocs(collection(db, USERS_COLLECTION)),
      getDocs(collection(db, GRIEVANCES_COLLECTION)),
      getDocs(collection(db, FEEDBACK_FORMS_COLLECTION))
    ]);

    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
    const grievances = grievancesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Grievance[];
    const forms = formsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FeedbackForm[];

    return {
      totalUsers: users.length,
      totalStudents: users.filter(u => u.role === 'student').length,
      totalAdmins: users.filter(u => u.role === 'admin').length,
      totalSuperAdmins: users.filter(u => u.role === 'super_admin').length,
      totalGrievances: grievances.length,
      pendingGrievances: grievances.filter(g => g.status === 'pending').length,
      resolvedGrievances: grievances.filter(g => g.status === 'resolved').length,
      totalForms: forms.length,
      activeForms: forms.filter(f => f.isActive).length,
    };
  } catch (error) {
    console.error('Error getting system stats:', error);
    throw error;
  }
};

export const createSuperAdmin = async (userData: Omit<User, 'createdAt'>) => {
  try {
    const superAdminData = {
      ...userData,
      role: 'super_admin' as const,
    };
    
    if (userData.id) {
      const docRef = doc(db, USERS_COLLECTION, userData.id);
      await setDoc(docRef, {
        ...superAdminData,
        createdAt: serverTimestamp(),
      });
      return userData.id;
    } else {
      const docRef = await addDoc(collection(db, USERS_COLLECTION), {
        ...superAdminData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    }
  } catch (error) {
    console.error('Error creating super admin:', error);
    throw error;
  }
};

// Feedback form management
export const toggleFeedbackFormStatus = async (formId: string, isActive: boolean) => {
  try {
    const docRef = doc(db, FEEDBACK_FORMS_COLLECTION, formId);
    await updateDoc(docRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error toggling feedback form status:', error);
    throw error;
  }
};

export const deleteFeedbackForm = async (formId: string) => {
  try {
    await deleteDoc(doc(db, FEEDBACK_FORMS_COLLECTION, formId));
  } catch (error) {
    console.error('Error deleting feedback form:', error);
    throw error;
  }
};

export const deleteGrievance = async (grievanceId: string) => {
  try {
    await deleteDoc(doc(db, GRIEVANCES_COLLECTION, grievanceId));
  } catch (error) {
    console.error('Error deleting grievance:', error);
    throw error;
  }
};

// Create admin user with Firebase Authentication
export const createAdminUser = async (adminData: {
  email: string;
  name: string;
  department: string | string[];
  password: string;
}): Promise<{ success: boolean; userId?: string; error?: string }> => {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(adminData.email);
    if (existingUser) {
      return { success: false, error: 'User with this email already exists' };
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      adminData.email, 
      adminData.password
    );
    const firebaseUser = userCredential.user;

    // Create user profile in Firestore
    const userProfile: Omit<User, 'createdAt'> = {
      id: firebaseUser.uid,
      email: adminData.email,
      name: adminData.name,
      role: 'admin',
      department: adminData.department,
      isActive: true,
    };

    await createUser(userProfile);

    // Sign out the newly created user so it doesn't affect current session
    await signOut(auth);

    return { success: true, userId: firebaseUser.uid };
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return { success: false, error: error.message || 'Failed to create admin user' };
  }
};

// Change user password
export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user is currently logged in' };
    }

    // Re-authenticate user with current password
    const credential = EmailAuthProvider.credential(user.email!, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);

    return { success: true };
  } catch (error: any) {
    console.error('Error changing password:', error);
    let errorMessage = 'Failed to change password';
    
    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Current password is incorrect';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'New password is too weak. Please use at least 6 characters.';
    } else if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'Please log out and log back in before changing your password';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Update user profile information
export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message || 'Failed to update profile' };
  }
};