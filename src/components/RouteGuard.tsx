import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

interface RouteGuardProps {
  children: React.ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const { user, loading, firebaseUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    // Mark initial check as done after first render
    if (!loading && !initialCheckDone) {
      setInitialCheckDone(true);
    }
  }, [loading, initialCheckDone]);

  useEffect(() => {
    // List of public routes that don't require authentication
    const publicRoutes = ['/login', '/register', '/anonymous-forms'];
    const isPublicRoute = publicRoutes.some(route => 
      location.pathname === route || location.pathname.startsWith('/anonymous-forms/')
    );

    // Only redirect if:
    // 1. Not currently loading
    // 2. Initial authentication check is complete
    // 3. No Firebase user exists (completely unauthenticated)
    // 4. Trying to access a protected route
    if (!loading && initialCheckDone && !firebaseUser && !isPublicRoute) {
      const currentPath = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`, { replace: true });
    }
  }, [user, loading, firebaseUser, location, navigate, initialCheckDone]);

  // Show loading screen while authentication is being determined
  if (loading || !initialCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
