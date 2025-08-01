import { 
  createAnonymousForm, 
  getAnonymousForms, 
  submitAnonymousResponse,
  getAnonymousResponsesByForm,
  updateAnonymousFormStatus,
  deleteAnonymousForm
} from './src/services/firebaseService';

async function testAnonymousForms() {
  console.log('🚀 Testing Anonymous Forms Functionality');
  
  try {
    // Test 1: Create an anonymous form
    console.log('\n1. Creating anonymous form...');
    const formData = {
      title: 'Test Anonymous Form',
      description: 'This is a test anonymous feedback form',
      questions: [
        {
          id: '1',
          type: 'rating' as const,
          question: 'How would you rate your overall experience?',
          required: true,
          options: []
        },
        {
          id: '2',
          type: 'textarea' as const,
          question: 'What improvements would you suggest?',
          required: false,
          options: []
        }
      ],
      isActive: true,
      createdBy: 'test-admin',
      department: 'CSE'
    };
    
    const formId = await createAnonymousForm(formData);
    console.log('✅ Anonymous form created with ID:', formId);
    
    // Test 2: Get all anonymous forms
    console.log('\n2. Fetching all anonymous forms...');
    const forms = await getAnonymousForms();
    console.log('✅ Retrieved', forms.length, 'anonymous forms');
    
    // Test 3: Submit an anonymous response
    console.log('\n3. Submitting anonymous response...');
    const responseData = {
      formId: formId,
      studentYear: '3',
      responses: {
        '1': 5,
        '2': 'Great system, keep it up!'
      }
    };
    
    const responseId = await submitAnonymousResponse(responseData);
    console.log('✅ Anonymous response submitted with ID:', responseId);
    
    // Test 4: Get responses for the form
    console.log('\n4. Fetching responses for the form...');
    const responses = await getAnonymousResponsesByForm(formId);
    console.log('✅ Retrieved', responses.length, 'responses for the form');
    
    // Test 5: Update form status
    console.log('\n5. Updating form status...');
    await updateAnonymousFormStatus(formId, false);
    console.log('✅ Form status updated to inactive');
    
    // Test 6: Clean up - delete the test form
    console.log('\n6. Cleaning up test data...');
    await deleteAnonymousForm(formId);
    console.log('✅ Test form deleted');
    
    console.log('\n🎉 All anonymous forms tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAnonymousForms();
