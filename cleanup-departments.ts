import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  query,
  where
} from 'firebase/firestore';
import { db } from './src/config/firebase';

const ANONYMOUS_FORMS_COLLECTION = 'anonymous_forms';

async function cleanupOldDepartments() {
  console.log('🧹 Cleaning up old department references...');
  
  try {
    // Get all anonymous forms
    const formsQuery = query(collection(db, ANONYMOUS_FORMS_COLLECTION));
    const formsSnapshot = await getDocs(formsQuery);
    
    let updatedCount = 0;
    const invalidDepartments = ['AI ML', 'AI DS'];
    
    for (const formDoc of formsSnapshot.docs) {
      const formData = formDoc.data();
      
      // Check if form has invalid departments
      if (invalidDepartments.includes(formData.department)) {
        console.log(`Found form with invalid department: ${formData.department} - "${formData.title}"`);
        
        // Update to CSE as default (you can change this logic)
        await updateDoc(doc(db, ANONYMOUS_FORMS_COLLECTION, formDoc.id), {
          department: 'CSE'
        });
        
        console.log(`✅ Updated form "${formData.title}" department from ${formData.department} to CSE`);
        updatedCount++;
      }
      
      // Check targetBranch field too
      if (formData.targetBranch && invalidDepartments.includes(formData.targetBranch)) {
        console.log(`Found form with invalid targetBranch: ${formData.targetBranch} - "${formData.title}"`);
        
        await updateDoc(doc(db, ANONYMOUS_FORMS_COLLECTION, formDoc.id), {
          targetBranch: 'CSE'
        });
        
        console.log(`✅ Updated form "${formData.title}" targetBranch from ${formData.targetBranch} to CSE`);
        updatedCount++;
      }
    }
    
    if (updatedCount === 0) {
      console.log('✅ No forms with invalid departments found. Database is clean!');
    } else {
      console.log(`✅ Cleanup complete! Updated ${updatedCount} forms.`);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupOldDepartments();
