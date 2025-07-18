// Utility functions for text formatting
export const formatText = {
  // Format role names to lowercase
  role: (role: string): string => {
    if (!role) return '';
    
    switch (role.toLowerCase()) {
      case 'student':
        return 'student';
      case 'admin':
        return 'admin';
      case 'super_admin':
        return 'super admin';
      default:
        return role.toLowerCase();
    }
  },

  // Format general text to lowercase
  title: (text: string): string => {
    if (!text) return '';
    
    return text.toLowerCase();
  },

  // Format text to lowercase (same as title for consistency)
  sentence: (text: string): string => {
    if (!text) return '';
    
    return text.toLowerCase();
  },

  // Format status text (replace underscores with spaces and apply title case)
  status: (status: string): string => {
    if (!status) return '';
    
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  },

  // Format department names to uppercase
  department: (dept: string): string => {
    if (!dept) return '';
    
    return dept.toUpperCase();
  },

  // Format tags with title case (first letter capital, rest lowercase)
  tag: (text: string): string => {
    if (!text) return '';
    
    return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};
