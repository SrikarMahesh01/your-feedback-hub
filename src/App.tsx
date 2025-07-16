import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { StudentDashboard } from './components/Dashboard/StudentDashboard';
import { AdminDashboard } from './components/Dashboard/AdminDashboard';
import { SuperAdminDashboard } from './components/Dashboard/SuperAdminDashboard';
import { AnonymousFeedback } from './components/AnonymousFeedback';
import { User } from './types';
import { createUser } from './services/firebaseService';

// Initialize demo data
const initializeDemoData = () => {
  // This function is now handled by Firebase
  // We can create demo users directly in Firebase console or through admin SDK
  console.log('Demo data initialization moved to Firebase');
};

// Helper function to create demo users (run once)
const createDemoUsers = async () => {
  try {
    const demoUsers: User[] = [
      {
        email: 'student@urcet.edu',
        name: 'Rajesh Kumar',
        role: 'student',
        rollNumber: '21CS001',
        year: '3',
        branch: 'CSE',
      },
      {
        email: 'hod.cse@urcet.edu',
        name: 'Dr. Priya Sharma',
        role: 'admin',
        department: 'CSE',
      },
      {
        email: 'admin@urcet.edu',
        name: 'System Administrator',
        role: 'super_admin',
      },
    ];
    
    // Note: In production, create these users through Firebase console
    // or use Firebase Admin SDK for initial setup
    console.log('Demo users should be created through Firebase console:', demoUsers);
  } catch (error) {
    console.error('Error creating demo users:', error);
  }
};

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'student':
      return <StudentDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'super_admin':
      return <SuperAdminDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  useEffect(() => {
    initializeDemoData();
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          colorBgContainer: '#ffffff',
        },
      }}
    >
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/anonymous" element={<AnonymousFeedback />} />
            <Route path="/unauthorized" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
                  <p className="text-gray-600">You don't have permission to access this page.</p>
                </div>
              </div>
            } />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <DashboardLayout>
                  <DashboardRouter />
                </DashboardLayout>
              </PrivateRoute>
            } />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;