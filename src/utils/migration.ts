import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Migration script to update lowercase "all" values to uppercase "ALL"
export const migrateLowercaseAllValues = async () => {
  console.log('Starting migration: Converting lowercase "all" to uppercase "ALL"');
  
  try {
    // Update feedback forms
    const feedbackFormsRef = collection(db, 'feedback_forms');
    const feedbackFormsSnapshot = await getDocs(feedbackFormsRef);
    
    let feedbackUpdates = 0;
    const feedbackPromises = feedbackFormsSnapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      const updates: any = {};
      
      if (data.targetYear === 'all') {
        updates.targetYear = 'ALL';
      }
      if (data.targetBranch === 'all') {
        updates.targetBranch = 'ALL';
      }
      
      if (Object.keys(updates).length > 0) {
        feedbackUpdates++;
        await updateDoc(doc(db, 'feedback_forms', docSnapshot.id), updates);
        console.log(`Updated feedback form: ${docSnapshot.id}`, updates);
      }
    });
    
    await Promise.all(feedbackPromises);
    
    // Update anonymous forms
    const anonymousFormsRef = collection(db, 'anonymous_forms');
    const anonymousFormsSnapshot = await getDocs(anonymousFormsRef);
    
    let anonymousUpdates = 0;
    const anonymousPromises = anonymousFormsSnapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      const updates: any = {};
      
      if (data.targetYear === 'all') {
        updates.targetYear = 'ALL';
      }
      if (data.targetBranch === 'all') {
        updates.targetBranch = 'ALL';
      }
      
      if (Object.keys(updates).length > 0) {
        anonymousUpdates++;
        await updateDoc(doc(db, 'anonymous_forms', docSnapshot.id), updates);
        console.log(`Updated anonymous form: ${docSnapshot.id}`, updates);
      }
    });
    
    await Promise.all(anonymousPromises);
    
    console.log(`Migration completed successfully!`);
    console.log(`- Updated ${feedbackUpdates} feedback forms`);
    console.log(`- Updated ${anonymousUpdates} anonymous forms`);
    
    return {
      success: true,
      feedbackUpdates,
      anonymousUpdates
    };
    
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Function to check if migration is needed
export const checkForLowercaseAllValues = async () => {
  try {
    // Check feedback forms
    const feedbackFormsRef = collection(db, 'feedback_forms');
    const feedbackFormsSnapshot = await getDocs(feedbackFormsRef);
    
    let feedbackFormsWithLowercase = 0;
    feedbackFormsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.targetYear === 'all' || data.targetBranch === 'all') {
        feedbackFormsWithLowercase++;
      }
    });
    
    // Check anonymous forms
    const anonymousFormsRef = collection(db, 'anonymous_forms');
    const anonymousFormsSnapshot = await getDocs(anonymousFormsRef);
    
    let anonymousFormsWithLowercase = 0;
    anonymousFormsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.targetYear === 'all' || data.targetBranch === 'all') {
        anonymousFormsWithLowercase++;
      }
    });
    
    return {
      feedbackFormsWithLowercase,
      anonymousFormsWithLowercase,
      migrationNeeded: feedbackFormsWithLowercase > 0 || anonymousFormsWithLowercase > 0
    };
    
  } catch (error) {
    console.error('Error checking for lowercase values:', error);
    return {
      feedbackFormsWithLowercase: 0,
      anonymousFormsWithLowercase: 0,
      migrationNeeded: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
