import { cleanupOrphanedResponses } from './src/services/firebaseService';

// Script to clean up orphaned responses (responses whose forms no longer exist)
const runCleanup = async () => {
  try {
    console.log('Starting cleanup of orphaned responses...');
    const deletedCount = await cleanupOrphanedResponses();
    console.log(`✅ Cleanup completed! Removed ${deletedCount} orphaned responses.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
};

runCleanup();
