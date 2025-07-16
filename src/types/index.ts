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
  priority: 'low' | 'medium' | 'high';
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
  isAnonymous: boolean;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface FormQuestion {
  id: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'rating';
  question: string;
  options?: string[];
  required: boolean;
}

export interface FeedbackResponse {
  id: string;
  formId: string;
  studentId?: string;
  responses: { [questionId: string]: string | string[] | number };
  submittedAt: string;
  isAnonymous: boolean;
}

export const DEPARTMENTS = ['CSE', 'AI ML', 'AI DS', 'ECE', 'EEE', 'IT', 'MECH'] as const;
export const YEARS = ['1', '2', '3', '4'] as const;
export const BRANCHES = DEPARTMENTS;