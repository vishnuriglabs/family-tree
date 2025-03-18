import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { UserDashboard } from './components/UserDashboard';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { AdminLoginPage } from './components/AdminLoginPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { AdminDashboard } from './components/AdminDashboard';
import { FamilyDetailsPage } from './components/FamilyDetailsPage';
import { AddFamilyMemberPage } from './components/AddFamilyMemberPage';
import { NotFoundPage } from './components/NotFoundPage';
import { DarkModeProvider } from './components/DarkModeProvider';
import ErrorBoundary from './components/ErrorBoundary';

// Debug component to log route changes
const RouteLogger = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('Current route:', location.pathname);
  }, [location]);
  
  return null;
};

function App() {
  console.log('App component rendering');
  
  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <Router>
          <RouteLogger />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={
              <ErrorBoundary>
                <SignupPage />
              </ErrorBoundary>
            } />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/family-details" element={<FamilyDetailsPage />} />
            <Route path="/add-family-member" element={<AddFamilyMemberPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </DarkModeProvider>
    </ErrorBoundary>
  );
}

export default App;