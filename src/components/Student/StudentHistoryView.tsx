import React, { useEffect } from 'react';
import { StudentDashboard } from '../Dashboard/StudentDashboard';

export const StudentHistoryView: React.FC = () => {
  useEffect(() => {
    // Dispatch event to set the view to history
    const event = new CustomEvent('student-navigation', {
      detail: { key: 'history' }
    });
    window.dispatchEvent(event);
  }, []);

  return <StudentDashboard initialView="history" />;
};
