// Simple test to verify form creation
const testFormData = {
  title: "Test Form",
  description: "This is a test form",
  questions: [
    {
      id: "q1",
      type: "text",
      question: "What is your feedback?",
      required: true,
      options: [],
      placeholder: "Enter your feedback",
      maxLength: undefined,
      minLength: undefined,
    }
  ],
  targetYear: "all",
  targetBranch: "all",
  department: "CSE",
  createdBy: "test-user",
  isAnonymous: false,
  isActive: true,
};

console.log("Test form data:", JSON.stringify(testFormData, null, 2));
