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
import { User, Grievance, FeedbackForm, FeedbackResponse, FeedbackFormWithCreator, getHODTitle } from '../types';
import { formatDate } from '../utils/dateFormatter';
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

// Update feedback form status (activate/deactivate)
export const updateFeedbackFormStatus = async (formId: string, isActive: boolean) => {
  try {
    const docRef = doc(db, FEEDBACK_FORMS_COLLECTION, formId);
    await updateDoc(docRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating feedback form status:', error);
    throw error;
  }
};

export const getGrievanceById = async (grievanceId: string): Promise<Grievance | null> => {
  try {
    const docRef = doc(db, GRIEVANCES_COLLECTION, grievanceId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Grievance;
    }
    return null;
  } catch (error) {
    console.error('Error getting grievance by ID:', error);
    throw error;
  }
};

// Feedback Form operations
export const createFeedbackForm = async (formData: Omit<FeedbackForm, 'id' | 'createdAt'>) => {
  // Clean the data to remove any undefined values
  const cleanData = JSON.parse(JSON.stringify(formData));
  
  try {
    const docRef = await addDoc(collection(db, FEEDBACK_FORMS_COLLECTION), {
      ...cleanData,
      createdAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const getFeedbackFormsByDepartment = async (department: string): Promise<FeedbackForm[]> => {
  try {
    const formsQuery = query(
      collection(db, FEEDBACK_FORMS_COLLECTION), 
      where('department', '==', department)
    );
    const snapshot = await getDocs(formsQuery);
    const forms = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        expiresAt: data.expiresAt?.toDate?.()?.toISOString(),
      } as FeedbackForm;
    });

    return forms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error getting feedback forms by department:', error);
    throw error;
  }
};

export const getAllFeedbackForms = async (): Promise<FeedbackForm[]> => {
  try {
    // Get regular forms only
    const regularQuery = query(collection(db, FEEDBACK_FORMS_COLLECTION));
    const regularSnapshot = await getDocs(regularQuery);
    const regularForms = regularSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        expiresAt: data.expiresAt?.toDate?.()?.toISOString(),
      } as FeedbackForm;
    });

    // Sort all forms by creation date
    return regularForms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error getting all feedback forms:', error);
    throw error;
  }
};

export const getAvailableFeedbackForms = async (studentYear?: string, studentBranch?: string, studentDepartment?: string, studentId?: string): Promise<FeedbackForm[]> => {
  try {
    // Remove orderBy to avoid index requirements
    let q = query(
      collection(db, FEEDBACK_FORMS_COLLECTION), 
      where('isActive', '==', true)
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

    console.log('All active forms:', forms.map(f => ({
      id: f.id,
      title: f.title,
      department: f.department,
      targetYear: f.targetYear,
      targetBranch: f.targetBranch,
      isActive: f.isActive,
      createdAt: f.createdAt
    })));

    // Get submitted form IDs for this student if studentId is provided
    let submittedFormIds: string[] = [];
    if (studentId) {
      try {
        const submittedResponses = await getFeedbackResponsesByStudent(studentId);
        submittedFormIds = submittedResponses.map(response => response.formId);
        console.log('Student has already submitted forms:', submittedFormIds);
      } catch (error) {
        console.error('Error getting submitted responses:', error);
      }
    }

    // Filter forms based on target criteria - only using targetBranch and targetYear
    const filteredForms = forms.filter(form => {
      console.log(`\n--- Checking form: ${form.title} (${form.id}) ---`);
      console.log('Form details:', {
        department: form.department,
        targetYear: form.targetYear,
        targetBranch: form.targetBranch,
        isActive: form.isActive,
        expiresAt: form.expiresAt
      });
      
      // First, check if student has already submitted this form
      if (studentId && submittedFormIds.includes(form.id)) {
        console.log('❌ Student has already submitted this form');
        return false;
      }
      
      // Make year matching more flexible
      const normalizeYear = (year: string) => {
        if (!year) return '';
        return year.toString().replace(/[^0-9]/g, ''); // Extract only numbers
      };
      
      const formYear = normalizeYear(form.targetYear || '');
      const studentYearNum = normalizeYear(studentYear || '');
      
      const yearMatch = !form.targetYear || 
        form.targetYear === 'ALL' || 
        form.targetYear === 'all' || // Handle legacy lowercase values
        formYear === studentYearNum ||
        form.targetYear === studentYear;
        
      const branchMatch = !form.targetBranch || 
        form.targetBranch === 'ALL' || 
        form.targetBranch === 'all' || // Handle legacy lowercase values 
        form.targetBranch?.toLowerCase() === studentBranch?.toLowerCase();
        
      const notExpired = !form.expiresAt || new Date(form.expiresAt) > new Date();
      
      console.log('Filter results:', {
        yearMatch: `${yearMatch} (form.targetYear: ${form.targetYear}, studentYear: ${studentYear}, normalized: ${formYear} vs ${studentYearNum})`,
        branchMatch: `${branchMatch} (form.targetBranch: ${form.targetBranch}, studentBranch: ${studentBranch})`,
        notExpired: `${notExpired} (form.expiresAt: ${form.expiresAt})`
      });
      
      const shouldShow = yearMatch && branchMatch && notExpired;
      console.log(`Form ${form.title} should show: ${shouldShow}`);
      
      return shouldShow;
    });
    
    console.log('=== FINAL RESULTS ===');
    console.log('Filtered forms for student:', filteredForms.map(f => ({
      id: f.id,
      title: f.title,
      department: f.department
    })));
    
    // Sort by createdAt in JavaScript instead of Firestore
    return filteredForms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error getting available feedback forms:', error);
    throw error;
  }
};

// Enhanced function that includes creator information for display
export const getAvailableFeedbackFormsWithCreator = async (studentYear?: string, studentBranch?: string, studentDepartment?: string, studentId?: string): Promise<FeedbackFormWithCreator[]> => {
  try {
    // Get the basic forms first
    const forms = await getAvailableFeedbackForms(studentYear, studentBranch, studentDepartment, studentId);
    
    // Enrich each form with creator information
    const formsWithCreator = await Promise.all(
      forms.map(async (form) => {
        try {
          const creator = await getUserById(form.createdBy);
          const enrichedForm: FeedbackFormWithCreator = {
            ...form,
            creatorInfo: creator ? {
              name: creator.name,
              department: creator.department || 'Unknown',
              hodTitle: getHODTitle(creator.department || 'Unknown')
            } : undefined
          };
          return enrichedForm;
        } catch (error) {
          console.error(`Error getting creator info for form ${form.id}:`, error);
          // Return form without creator info if there's an error
          return { ...form } as FeedbackFormWithCreator;
        }
      })
    );
    
    return formsWithCreator;
  } catch (error) {
    console.error('Error getting feedback forms with creator info:', error);
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

export const subscribeToFeedbackResponses = (callback: (responses: any[]) => void, adminDepartments: string | string[]) => {
  const departments = Array.isArray(adminDepartments) ? adminDepartments : [adminDepartments];
  
  // Get all forms for the departments first
  getAllFeedbackForms().then(allForms => {
    const departmentForms = allForms.filter((form: FeedbackForm) => departments.includes(form.department));
    const formIds = departmentForms.map((form: FeedbackForm) => form.id);
    
    if (formIds.length === 0) {
      callback([]);
      return;
    }
    
    // Listen to regular responses
    const regularResponsesQuery = query(
      collection(db, FEEDBACK_RESPONSES_COLLECTION),
      where('formId', 'in', formIds),
      orderBy('submittedAt', 'desc')
    );
    
    let regularResponses: any[] = [];
    
    const combineAndCallback = () => {
      // Sort by submittedAt
      regularResponses.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      callback(regularResponses);
    };
    
    // Subscribe to regular responses
    const unsubscribeRegular = onSnapshot(regularResponsesQuery, (querySnapshot) => {
      regularResponses = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });
      combineAndCallback();
    });
    
    // Return unsubscribe function
    return unsubscribeRegular;
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
    // First, delete all responses associated with this form
    const responsesQuery = query(
      collection(db, FEEDBACK_RESPONSES_COLLECTION),
      where('formId', '==', formId)
    );
    const responsesSnapshot = await getDocs(responsesQuery);
    
    // Delete all responses in batch
    const deletePromises = responsesSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    await Promise.all(deletePromises);
    
    console.log(`Deleted ${responsesSnapshot.docs.length} responses for form ${formId}`);
    
    // Then delete the form itself
    await deleteDoc(doc(db, FEEDBACK_FORMS_COLLECTION, formId));
    
    console.log(`Successfully deleted form ${formId} and all associated responses`);
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

// Function to clean up orphaned responses (responses whose forms no longer exist)
export const cleanupOrphanedResponses = async () => {
  try {
    console.log('Starting cleanup of orphaned responses...');
    
    // Get all responses
    const responsesQuery = query(collection(db, FEEDBACK_RESPONSES_COLLECTION));
    const responsesSnapshot = await getDocs(responsesQuery);
    
    let deletedCount = 0;
    
    // Check each response to see if its form still exists
    for (const responseDoc of responsesSnapshot.docs) {
      const responseData = responseDoc.data();
      
      if (responseData.formId) {
        try {
          const formDocRef = doc(db, FEEDBACK_FORMS_COLLECTION, responseData.formId);
          const formDoc = await getDoc(formDocRef);
          
          // If form doesn't exist, delete the orphaned response
          if (!formDoc.exists()) {
            await deleteDoc(responseDoc.ref);
            deletedCount++;
            console.log(`Deleted orphaned response ${responseDoc.id} for non-existent form ${responseData.formId}`);
          }
        } catch (error) {
          console.warn(`Error checking form existence for response ${responseDoc.id}:`, error);
        }
      }
    }
    
    console.log(`Cleanup completed. Deleted ${deletedCount} orphaned responses.`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up orphaned responses:', error);
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

// Enhanced department-based data functions
export const getStudentsByDepartment = async (department: string | string[]): Promise<User[]> => {
  try {
    const departments = Array.isArray(department) ? department : [department];
    const allUsers = await getAllUsers();
    
    const students = allUsers.filter((user: User) => 
      user.role === 'student' && 
      user.branch && 
      departments.includes(user.branch)
    );
    
    return students.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error getting students by department:', error);
    throw error;
  }
};

// Get all students (for super admin or general admin use)
export const getAllStudents = async (): Promise<User[]> => {
  try {
    const allUsers = await getAllUsers();
    
    const students = allUsers.filter((user: User) => 
      user.role === 'student'
    );
    
    return students.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error getting all students:', error);
    throw error;
  }
};

export const getGrievancesByAdminDepartments = async (adminDepartments: string | string[]): Promise<Grievance[]> => {
  try {
    const departments = Array.isArray(adminDepartments) ? adminDepartments : [adminDepartments];
    const allGrievances = await getAllGrievances();
    
    const departmentGrievances = allGrievances.filter((grievance: Grievance) => {
      // Check if the grievance department matches any of the admin's departments
      return departments.includes(grievance.department);
    });
    
    return departmentGrievances.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  } catch (error) {
    console.error('Error getting grievances by admin departments:', error);
    throw error;
  }
};

export const getFeedbackResponsesByDepartment = async (department: string | string[]): Promise<FeedbackResponse[]> => {
  try {
    const departments = Array.isArray(department) ? department : [department];
    
    // Get all feedback forms for the departments
    const allForms = await getAllFeedbackForms();
    const departmentForms = allForms.filter((form: FeedbackForm) => 
      departments.includes(form.department)
    );
    const formIds = departmentForms.map((form: FeedbackForm) => form.id);
    
    if (formIds.length === 0) {
      return [];
    }
    
    // Get responses for these forms
    const q = query(
      collection(db, FEEDBACK_RESPONSES_COLLECTION),
      where('formId', 'in', formIds)
    );
    const querySnapshot = await getDocs(q);
    
    const responses = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as FeedbackResponse;
    });
    
    return responses.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  } catch (error) {
    console.error('Error getting feedback responses by department:', error);
    throw error;
  }
};

export const getDetailedStudentGrievances = async (adminDepartments: string | string[]): Promise<any[]> => {
  try {
    const departments = Array.isArray(adminDepartments) ? adminDepartments : [adminDepartments];
    
    // Get all students from admin's departments
    const students = await getStudentsByDepartment(departments);
    
    // Get all grievances for these departments
    const grievances = await getGrievancesByAdminDepartments(departments);
    
    // Combine student info with their grievances
    const detailedGrievances = grievances.map(grievance => {
      const student = students.find(s => s.id === grievance.studentId);
      return {
        ...grievance,
        studentDetails: student ? {
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber,
          year: student.year,
          branch: student.branch,
        } : null,
      };
    });
    
    return detailedGrievances;
  } catch (error) {
    console.error('Error getting detailed student grievances:', error);
    throw error;
  }
};

export const getDetailedFeedbackResponses = async (adminDepartments: string | string[]): Promise<any[]> => {
  try {
    const departments = Array.isArray(adminDepartments) ? adminDepartments : [adminDepartments];
    
    // Get all feedback forms for the departments
    const allForms = await getAllFeedbackForms();
    const departmentForms = allForms.filter((form: FeedbackForm) => departments.includes(form.department));
    
    // Get all responses for these forms
    const regularResponses = await getFeedbackResponsesByDepartment(departments);
    
    // Get all students from admin's departments
    const students = await getStudentsByDepartment(departments);
    
    // Combine response info with student and form details
    const detailedResponses = regularResponses.map(response => {
      const form = departmentForms.find((f: FeedbackForm) => f.id === response.formId);
      const student = response.studentId ? students.find(s => s.id === response.studentId) : null;
      
      return {
        ...response,
        formDetails: form ? {
          title: form.title,
          description: form.description,
          department: form.department,
          questions: form.questions,
        } : null,
        studentDetails: student ? {
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber,
          year: student.year,
          branch: student.branch,
        } : null,
      };
    });
    
    return detailedResponses;
  } catch (error) {
    console.error('Error getting detailed feedback responses:', error);
    throw error;
  }
};

export const getFeedbackResponsesByStudent = async (studentId: string): Promise<any[]> => {
  try {
    // Get regular responses by student
    const regularQuery = query(
      collection(db, FEEDBACK_RESPONSES_COLLECTION),
      where('studentId', '==', studentId)
    );
    const regularSnapshot = await getDocs(regularQuery);
    
    const responses = await Promise.all(
      regularSnapshot.docs.map(async (responseDoc) => {
        const responseData = responseDoc.data();
        
        // Get form details if formId exists
        let formDetails = null;
        if (responseData.formId) {
          try {
            const formDocRef = doc(db, FEEDBACK_FORMS_COLLECTION, responseData.formId);
            const formDoc = await getDoc(formDocRef);
            if (formDoc.exists()) {
              formDetails = formDoc.data();
            }
          } catch (error) {
            console.warn(`Could not fetch form details for formId: ${responseData.formId}`, error);
          }
        }
        
        return {
          id: responseDoc.id,
          ...responseData,
          submittedAt: responseData.submittedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          formDetails,
        };
      })
    );

    // Filter out responses where the form no longer exists (orphaned responses)
    const validResponses = responses.filter(response => response.formDetails !== null);

    // Sort by submittedAt in JavaScript
    return validResponses.sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  } catch (error) {
    console.error('Error getting feedback responses by student:', error);
    throw error;
  }
};

// CSV Export functionality
export const exportResponsesToCSV = (responses: any[], formTitle: string): void => {
  if (!responses || responses.length === 0) {
    console.warn('No responses to export');
    return;
  }

  // Get all unique questions from all responses
  const allQuestions = new Set<string>();
  responses.forEach(response => {
    if (response.formDetails?.questions) {
      response.formDetails.questions.forEach((q: any) => {
        allQuestions.add(q.question);
      });
    }
  });

  const questionsList = Array.from(allQuestions);

  // Create CSV headers
  const headers = [
    'Response ID',
    'Student Name',
    'Email',
    'Roll Number',
    'Year',
    'Branch',
    'Submitted At',
    ...questionsList
  ];

  // Create CSV rows
  const rows = responses.map(response => {
    const row: any = {
      'Response ID': response.id,
      'Student Name': response.studentDetails?.name || 'N/A',
      'Email': response.studentDetails?.email || 'N/A',
      'Roll Number': response.studentDetails?.rollNumber || 'N/A',
      'Year': response.studentDetails?.year || 'N/A',
      'Branch': response.studentDetails?.branch || 'N/A',
      'Submitted At': new Date(response.submittedAt).toLocaleString()
    };

    // Add responses to questions
    questionsList.forEach(question => {
      const questionData = response.formDetails?.questions?.find((q: any) => q.question === question);
      if (questionData && response.responses) {
        const answer = response.responses[questionData.id];
        row[question] = Array.isArray(answer) ? answer.join(', ') : (answer || 'No response');
      } else {
        row[question] = 'No response';
      }
    });

    return row;
  });

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map(row => headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma
      const escapedValue = String(value).replace(/"/g, '""');
      return escapedValue.includes(',') ? `"${escapedValue}"` : escapedValue;
    }).join(','))
  ].join('\n');

  // Download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${formTitle.replace(/[^a-zA-Z0-9]/g, '_')}_responses.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// New functions for getting forms and responses by creator
export const getFeedbackFormsByCreator = async (creatorId: string): Promise<FeedbackForm[]> => {
  try {
    // Get regular forms created by this user
    const regularQuery = query(
      collection(db, FEEDBACK_FORMS_COLLECTION),
      where('createdBy', '==', creatorId)
    );
    const regularSnapshot = await getDocs(regularQuery);
    
    // Get forms created by this user
    const allForms = regularSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString(),
    })) as FeedbackForm[];
    
    // Sort by createdAt in JavaScript
    return allForms.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error getting feedback forms by creator:', error);
    throw error;
  }
};

export const getFeedbackResponsesByCreator = async (creatorId: string): Promise<any[]> => {
  try {
    // Get all forms created by this user (without orderBy to avoid index requirement)
    const userForms = await getFeedbackFormsByCreator(creatorId);
    const formIds = userForms.map(form => form.id);
    
    if (formIds.length === 0) {
      return [];
    }
    
    // Get regular responses for user's forms
    const regularResponsesPromises = formIds.map(async (formId) => {
      const q = query(
        collection(db, FEEDBACK_RESPONSES_COLLECTION),
        where('formId', '==', formId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));
    });
    
    const regularResponses = await Promise.all(regularResponsesPromises);
    
    // Flatten all responses
    const allResponses = regularResponses.flat();

    // Enrich responses with student and form details
    const enrichedResponses = await Promise.all(allResponses.map(async (response: any) => {
      // Get form details
      const form = userForms.find(f => f.id === response.formId);
      
      // Get student details
      let studentDetails = null;
      if (response.studentId) {
        try {
          const student = await getUserById(response.studentId);
          if (student) {
            studentDetails = {
              name: student.name,
              email: student.email,
              rollNumber: student.rollNumber,
              year: student.year,
              branch: student.branch,
            };
          }
        } catch (error) {
          console.error('Error fetching student details:', error);
        }
      }
      
      return {
        ...response,
        formDetails: form ? {
          title: form.title,
          description: form.description,
          targetBranch: form.targetBranch,
          targetYear: form.targetYear,
          questions: form.questions,
        } : null,
        studentDetails,
      };
    }));
    
    // Sort by submittedAt in JavaScript instead of Firestore
    return enrichedResponses.sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  } catch (error) {
    console.error('Error getting feedback responses by creator:', error);
    throw error;
  }
};

export const getFeedbackFormById = async (formId: string): Promise<FeedbackForm | null> => {
  try {
    // Get form from regular forms collection
    const regularDocRef = doc(db, FEEDBACK_FORMS_COLLECTION, formId);
    const regularDocSnap = await getDoc(regularDocRef);
    
    if (regularDocSnap.exists()) {
      const data = regularDocSnap.data();
      const formData = {
        id: regularDocSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        expiresAt: data.expiresAt?.toDate?.()?.toISOString(),
      } as FeedbackForm;
      
      // Check if form is active
      if (!formData.isActive) {
        console.log(`Form ${formId} is inactive, not returning it`);
        return null;
      }
      
      return formData;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting feedback form by ID:', error);
    throw error;
  }
};

export const checkIfStudentSubmittedForm = async (studentId: string, formId: string): Promise<boolean> => {
  try {
    // Check regular responses
    const regularQuery = query(
      collection(db, FEEDBACK_RESPONSES_COLLECTION),
      where('studentId', '==', studentId),
      where('formId', '==', formId)
    );
    const regularSnapshot = await getDocs(regularQuery);
    
    return regularSnapshot.size > 0;
  } catch (error) {
    console.error('Error checking if student submitted form:', error);
    return false;
  }
};

// Export students data to CSV
export const exportStudentsToCSV = (students: User[], departmentName: string): void => {
  if (!students || students.length === 0) {
    console.warn('No students to export');
    return;
  }

  // Create CSV headers
  const headers = [
    'Serial No',
    'Name',
    'Email',
    'Roll Number',
    'Year',
    'Branch',
    'Department',
    'Status',
    'Account Created',
    'Last Login'
  ];

  // Create CSV rows
  const rows = students.map((student, index) => {
    return [
      index + 1,
      student.name || 'N/A',
      student.email || 'N/A',
      student.rollNumber || 'N/A',
      student.year || 'N/A',
      student.branch || 'N/A',
      student.department || 'N/A',
      student.isActive !== false ? 'Active' : 'Inactive',
      student.createdAt ? formatDate(student.createdAt) : 'N/A',
      'N/A' // Last login placeholder - can be implemented later
    ];
  });

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      const value = String(cell || '');
      // Escape quotes and wrap in quotes if contains comma
      const escapedValue = value.replace(/"/g, '""');
      return escapedValue.includes(',') ? `"${escapedValue}"` : escapedValue;
    }).join(','))
  ].join('\n');

  // Download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${departmentName.replace(/[^a-zA-Z0-9]/g, '_')}_Students_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export anonymous forms responses to CSV
export const exportAnonymousResponsesToCSV = async (formId: string, formTitle: string): Promise<void> => {
  try {
    const responses = await getAnonymousResponsesByForm(formId);
    const form = await getAnonymousFormById(formId);
    
    if (!responses || responses.length === 0) {
      console.warn('No anonymous responses to export');
      return;
    }

    if (!form) {
      console.warn('Form not found');
      return;
    }

    // Create CSV headers
    const headers = [
      'Response ID',
      'Student Year',
      'Submission Date',
      'Submission Time',
      ...form.questions.map(q => q.question)
    ];

    // Create CSV rows
    const rows = responses.map((response, index) => {
      const submissionDate = new Date(response.submittedAt);
      const row = [
        `ANO-${index + 1}`,
        response.studentYear || 'N/A',
        formatDate(response.submittedAt),
        submissionDate.toLocaleTimeString(),
      ];

      // Add responses for each question
      form.questions.forEach(question => {
        const answer = response.responses[question.id];
        if (Array.isArray(answer)) {
          row.push(answer.join('; '));
        } else {
          row.push(String(answer || ''));
        }
      });

      return row;
    });

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const value = String(cell || '');
        // Escape quotes and wrap in quotes if contains comma
        const escapedValue = value.replace(/"/g, '""');
        return escapedValue.includes(',') ? `"${escapedValue}"` : escapedValue;
      }).join(','))
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Anonymous_${formTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Responses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting anonymous responses to CSV:', error);
    throw error;
  }
};

// Anonymous Forms Functions
export const createAnonymousForm = async (formData: Omit<FeedbackForm, 'id' | 'createdAt'>) => {
  try {
    console.log('Creating anonymous form in Firestore with data:', formData);
    const docRef = await addDoc(collection(db, ANONYMOUS_FORMS_COLLECTION), {
      ...formData,
      createdAt: serverTimestamp(),
    });
    console.log('Anonymous form created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating anonymous form:', error);
    throw error;
  }
};

export const getAnonymousForms = async (): Promise<FeedbackForm[]> => {
  try {
    console.log('Fetching anonymous forms from Firestore...');
    
    // Fetch all anonymous forms (rules allow list: if true)
    // Then filter for active forms on the client side
    const q = query(collection(db, ANONYMOUS_FORMS_COLLECTION));
    const querySnapshot = await getDocs(q);
    
    console.log('Total anonymous forms fetched:', querySnapshot.docs.length);
    
    const forms = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString(),
    } as FeedbackForm));

    // Filter for active forms and sort by creation date
    const activeForms = forms
      .filter(form => form.isActive === true)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log('Active forms after filtering:', activeForms.length);
    console.log('Active forms:', activeForms);
    
    return activeForms;
  } catch (error) {
    console.error('Error getting anonymous forms:', error);
    throw error;
  }
};

export const getAnonymousFormById = async (formId: string): Promise<FeedbackForm | null> => {
  try {
    const docRef = doc(db, ANONYMOUS_FORMS_COLLECTION, formId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        expiresAt: data.expiresAt?.toDate?.()?.toISOString(),
      } as FeedbackForm;
    }
    return null;
  } catch (error) {
    console.error('Error getting anonymous form by ID:', error);
    throw error;
  }
};

export const submitAnonymousResponse = async (responseData: {
  formId: string;
  studentYear: string;
  responses: { [questionId: string]: string | string[] | number };
}) => {
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

export const getAnonymousResponsesByForm = async (formId: string): Promise<any[]> => {
  try {
    // Get all responses for this form and sort in JavaScript to avoid composite index
    const q = query(
      collection(db, ANONYMOUS_RESPONSES_COLLECTION),
      where('formId', '==', formId)
    );
    const querySnapshot = await getDocs(q);
    
    const responses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));

    // Sort in JavaScript
    return responses.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  } catch (error) {
    console.error('Error getting anonymous responses:', error);
    throw error;
  }
};

export const getAnonymousResponsesByCreator = async (creatorId: string): Promise<any[]> => {
  try {
    // First get all anonymous forms created by this admin
    const formsQuery = query(
      collection(db, ANONYMOUS_FORMS_COLLECTION),
      where('createdBy', '==', creatorId)
    );
    const formsSnapshot = await getDocs(formsQuery);
    const formIds = formsSnapshot.docs.map(doc => doc.id);
    
    if (formIds.length === 0) {
      return [];
    }
    
    // Get all responses for these forms
    const responses: any[] = [];
    for (const formId of formIds) {
      const formResponses = await getAnonymousResponsesByForm(formId);
      // Add form details to each response
      const formData = formsSnapshot.docs.find(doc => doc.id === formId)?.data();
      const responsesWithFormDetails = formResponses.map(response => ({
        ...response,
        formDetails: {
          id: formId,
          title: formData?.title || 'Unknown Form',
          questions: formData?.questions || [],
        }
      }));
      responses.push(...responsesWithFormDetails);
    }
    
    return responses.sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  } catch (error) {
    console.error('Error getting anonymous responses by creator:', error);
    throw error;
  }
};

export const deleteAnonymousForm = async (formId: string) => {
  try {
    // First, delete all responses associated with this form
    const responsesQuery = query(
      collection(db, ANONYMOUS_RESPONSES_COLLECTION),
      where('formId', '==', formId)
    );
    const responsesSnapshot = await getDocs(responsesQuery);
    
    // Delete all responses in batch
    const deletePromises = responsesSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    await Promise.all(deletePromises);
    
    console.log(`Deleted ${responsesSnapshot.docs.length} anonymous responses for form ${formId}`);
    
    // Then delete the form itself
    await deleteDoc(doc(db, ANONYMOUS_FORMS_COLLECTION, formId));
    
    console.log(`Successfully deleted anonymous form ${formId} and all associated responses`);
  } catch (error) {
    console.error('Error deleting anonymous form:', error);
    throw error;
  }
};

export const updateAnonymousFormStatus = async (formId: string, isActive: boolean) => {
  try {
    const docRef = doc(db, ANONYMOUS_FORMS_COLLECTION, formId);
    await updateDoc(docRef, { isActive });
  } catch (error) {
    console.error('Error updating anonymous form status:', error);
    throw error;
  }
};