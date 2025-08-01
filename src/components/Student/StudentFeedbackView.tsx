import React, { useEffect } from 'react';
import { StudentDashboard } from '../Dashboard/StudentDashboard';

export const StudentFeedbackView: React.FC = () => {
  useEffect(() => {
    // Dispatch event to set the view to feedback
    const event = new CustomEvent('student-navigation', {
      detail: { key: 'feedback' }
    });
    window.dispatchEvent(event);
  }, []);

  return <StudentDashboard initialView="feedback" />;
};
