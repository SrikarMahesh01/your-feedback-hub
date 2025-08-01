export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin' | 'super_admin';
  rollNumber?: string;
  year?: string;
  branch?: string;
  department?: string | string[]; // Allow single department or array of departments
  isActive?: boolean;
  createdAt: string;
}

export interface Grievance {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  category: 'academic' | 'infrastructure' | 'hostel' | 'transport' | 'library' | 'other';
  department: string; // Target department HOD who should handle this grievance
  studentDepartment?: string; // Student's own department for reference
  studentBranch?: string; // Student's branch for reference
  studentYear?: string; // Student's year for reference
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  submittedAt: string;
  updatedAt: string;
  adminComments?: string[];
}

export interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  questions: FormQuestion[];
  targetYear?: string;
  targetBranch?: string;
  department: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface FeedbackFormWithCreator extends FeedbackForm {
  creatorInfo?: {
    name: string;
    department: string | string[];
    hodTitle: string;
  };
}

export interface FormQuestion {
  id: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'rating';
  question: string;
  options?: string[];
  required: boolean;
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
}

export interface FeedbackResponse {
  id: string;
  formId: string;
  studentId?: string;
  responses: { [questionId: string]: string | string[] | number };
  submittedAt: string;
}

export const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'IT', 'MECH'] as const;
export const YEARS = ['1', '2', '3', '4'] as const;
export const BRANCHES = DEPARTMENTS;

// Mapping of departments to their HOD departments for display purposes
export const DEPARTMENT_HOD_MAPPING = {
  'CSE': 'CSE Department',
  'ECE': 'ECE Department', 
  'EEE': 'EEE Department',
  'IT': 'IT Department',
  'MECH': 'MECH Department'
} as const;

// Mapping of departments to their HOD titles
export const DEPARTMENT_HOD_TITLE_MAPPING = {
  'CSE': 'CSE HOD',
  'ECE': 'ECE HOD',
  'EEE': 'EEE HOD',
  'IT': 'IT HOD',
  'MECH': 'MECH HOD'
} as const;

// Function to get HOD department display name
export const getHODDepartmentName = (department: string): string => {
  return DEPARTMENT_HOD_MAPPING[department as keyof typeof DEPARTMENT_HOD_MAPPING] || `${department} Department`;
};

// Function to get HOD title based on department
export const getHODTitle = (department: string | string[]): string => {
  // Handle array of departments (take first one)
  const dept = Array.isArray(department) ? department[0] : department;
  return DEPARTMENT_HOD_TITLE_MAPPING[dept as keyof typeof DEPARTMENT_HOD_TITLE_MAPPING] || `${dept} HOD`;
};