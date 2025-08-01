import React, { useEffect } from 'react';
import { StudentDashboard } from '../Dashboard/StudentDashboard';

export const StudentGrievancesView: React.FC = () => {
  useEffect(() => {
    // Dispatch event to set the view to grievances
    const event = new CustomEvent('student-navigation', {
      detail: { key: 'grievances' }
    });
    window.dispatchEvent(event);
  }, []);

  return <StudentDashboard initialView="grievances" />;
};
