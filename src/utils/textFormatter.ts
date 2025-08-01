// Utility functions for text formatting
export const formatText = {
  // Format role names to uppercase
  role: (role: string): string => {
    if (!role) return '';
    
    switch (role.toLowerCase()) {
      case 'student':
        return 'STUDENT';
      case 'admin':
        return 'ADMIN';
      case 'super_admin':
        return 'SUPER ADMIN';
      default:
        return role.toUpperCase();
    }
  },

  // Format general text to uppercase (every character capitalized)
  title: (text: string): string => {
    if (!text) return '';
    
    return text.toUpperCase();
  },

  // Format text to uppercase (every character capitalized)
  sentence: (text: string): string => {
    if (!text) return '';
    
    return text.toUpperCase();
  },

  // Format status text (replace underscores with spaces and apply uppercase)
  status: (status: string): string => {
    if (!status) return '';
    
    return status.replace(/_/g, ' ').toUpperCase();
  },

  // Format department names to uppercase
  department: (dept: string): string => {
    if (!dept) return '';
    
    return dept.toUpperCase();
  },

  // Format tags with uppercase (every character capitalized)
  tag: (text: string): string => {
    if (!text) return '';
    
    return text.replace(/_/g, ' ').toUpperCase();
  }
};
