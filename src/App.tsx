import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { RouteGuard } from './components/RouteGuard';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { StudentDashboard } from './components/Dashboard/StudentDashboard';
import { AdminDashboard } from './components/Dashboard/AdminDashboard';
import { SuperAdminDashboard } from './components/Dashboard/SuperAdminDashboard';
import { FeedbackForms, Students, Analytics, Grievances, AnonymousForms } from './components/Dashboard/Admin';
import { Profile } from './components/Profile/Profile';
import { FeedbackFormFill } from './components/FeedbackFormFill';
import { AnonymousFormFill } from './components/AnonymousFormFill';
import { AnonymousFormsList } from './components/AnonymousFormsList';
import { GrievanceDetail } from './components/GrievanceDetail';
import { StudentFeedbackView } from './components/Student/StudentFeedbackView';
import { StudentHistoryView } from './components/Student/StudentHistoryView';
import { StudentGrievancesView } from './components/Student/StudentGrievancesView';

// Initialize demo data
const initializeDemoData = () => {
  // This function is now handled by Firebase
  // We can create demo users directly in Firebase console or through admin SDK
};

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'student':
      return <Navigate to="/student/dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'super_admin':
      return <Navigate to="/super-admin/dashboard" replace />;
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
          <RouteGuard>
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/forms/:formId" element={
                <PrivateRoute>
                  <FeedbackFormFill />
                </PrivateRoute>
              } />
              <Route path="/anonymous-forms/:formId" element={<AnonymousFormFill />} />
              <Route path="/anonymous-forms" element={<AnonymousFormsList onBack={() => window.history.back()} />} />
              <Route path="/grievances/:grievanceId" element={
                <PrivateRoute>
                  <GrievanceDetail />
                </PrivateRoute>
              } />
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
              {/* Admin specific routes */}
              <Route path="/admin/dashboard" element={
                <PrivateRoute roles={['admin']}>
                  <DashboardLayout>
                    <AdminDashboard />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              <Route path="/feedbackforms" element={
                <PrivateRoute roles={['admin', 'super_admin']}>
                  <DashboardLayout>
                    <FeedbackForms />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              <Route path="/students" element={
                <PrivateRoute roles={['admin', 'super_admin']}>
                  <DashboardLayout>
                    <Students />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              <Route path="/analytics" element={
                <PrivateRoute roles={['admin', 'super_admin']}>
                  <DashboardLayout>
                    <Analytics />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              <Route path="/grievances" element={
                <PrivateRoute roles={['admin', 'super_admin']}>
                  <DashboardLayout>
                    <Grievances />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              <Route path="/admin/anonymous-forms" element={
                <PrivateRoute roles={['admin', 'super_admin']}>
                  <DashboardLayout>
                    <AnonymousForms />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              
              {/* Super Admin specific routes */}
              <Route path="/super-admin/dashboard" element={
                <PrivateRoute roles={['super_admin']}>
                  <DashboardLayout>
                    <SuperAdminDashboard />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              
              {/* Common routes */}
              <Route path="/profile" element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Profile />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              {/* Student specific routes */}
              <Route path="/student/dashboard" element={
                <PrivateRoute roles={['student']}>
                  <DashboardLayout>
                    <StudentDashboard />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              <Route path="/student/feedback" element={
                <PrivateRoute roles={['student']}>
                  <DashboardLayout>
                    <StudentFeedbackView />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              <Route path="/student/history" element={
                <PrivateRoute roles={['student']}>
                  <DashboardLayout>
                    <StudentHistoryView />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              <Route path="/student/grievances" element={
                <PrivateRoute roles={['student']}>
                  <DashboardLayout>
                    <StudentGrievancesView />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </RouteGuard>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;