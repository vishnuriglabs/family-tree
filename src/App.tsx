import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { AdminLoginPage } from './components/AdminLoginPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { AdminDashboard } from './components/AdminDashboard';
import { FamilyDetailsPage } from './components/FamilyDetailsPage';
import { AddFamilyMemberPage } from './components/AddFamilyMemberPage';
import { NotFoundPage } from './components/NotFoundPage';
import { DarkModeProvider } from './components/DarkModeProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { UserDashboard } from './components/UserDashboard';
import { EditProfilePage } from './components/EditProfilePage';
import { LandingPage } from './components/LandingPage';
import { FamilyTreeContainer } from './components/FamilyTreeContainer';
import { UpdateRelationships } from './components/UpdateRelationships';
import { FamilyRecordsPage } from './components/FamilyRecordsPage';
import { AdminAuthProvider, useAdminAuth } from './utils/AdminAuthContext';
import { AuthProvider, useAuth } from './utils/AuthContext';

// Debug component to log route changes
const RouteLogger = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('Route changed to:', location.pathname);
  }, [location]);
  
  return null;
};

// Create an AdminProtectedRoute component to protect admin routes
const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/admin-login');
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAdmin ? children : null;
};

function App() {
  console.log('App component rendering');
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AdminAuthProvider>
          <DarkModeProvider>
            <Router>
              <RouteLogger />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/admin-login" element={<AdminLoginPage />} />
                
                {/* Admin routes */}
                <Route path="/admin-dashboard" element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin-dashboard/family-details" element={
                  <AdminProtectedRoute>
                    <FamilyDetailsPage />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin-dashboard/add-member" element={
                  <AdminProtectedRoute>
                    <AddFamilyMemberPage />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin-dashboard/manage-relationships" element={
                  <AdminProtectedRoute>
                    <UpdateRelationships />
                  </AdminProtectedRoute>
                } />
                
                {/* Redirect old routes to new admin routes */}
                <Route path="/family-details" element={<Navigate to="/admin-dashboard/family-details" replace />} />
                
                {/* User routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/edit-profile" element={
                  <ProtectedRoute>
                    <EditProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/add-family-member" element={
                  <ProtectedRoute>
                    <AddFamilyMemberPage />
                  </ProtectedRoute>
                } />
                <Route path="/family-records" element={
                  <ProtectedRoute>
                    <FamilyRecordsPage />
                  </ProtectedRoute>
                } />
                
                {/* Family tree routes */}
                <Route path="/family-tree" element={
                  <ProtectedRoute>
                    <FamilyTreeContainer />
                  </ProtectedRoute>
                } />
                
                {/* 404 route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Router>
          </DarkModeProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;