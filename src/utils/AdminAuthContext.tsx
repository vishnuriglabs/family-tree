import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDatabase, ref, get } from 'firebase/database';
import { logActivity, ActivityType } from './activity';

interface AdminUser {
  id: string;
  username: string;
  role: string;
  permissions: string[];
  lastLogin?: string;
  loginTime?: string;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  loading: boolean;
  adminLogin: (username: string, password: string) => Promise<AdminUser>;
  adminLogout: () => void;
  isAdmin: boolean;
  error?: string;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

interface AdminAuthProviderProps {
  children: ReactNode;
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Check if admin user is in session storage on component mount
    const storedAdmin = sessionStorage.getItem('adminUser');
    if (storedAdmin) {
      try {
        const adminData = JSON.parse(storedAdmin);
        setAdminUser(adminData);
        setIsAdmin(true);
      } catch (error) {
        console.error('Failed to parse admin data from session:', error);
        sessionStorage.removeItem('adminUser');
      }
    }
    setLoading(false);
  }, []);

  // For demo purposes, we're using a hardcoded admin
  // In a real app, you would validate against your database
  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'adminpass123';

  const login = async (username: string, password: string): Promise<boolean> => {
    // Set loading state
    setLoading(true);
    
    try {
      // For demo purposes, we are using hardcoded credentials
      // In a real application, this would make an API call to authenticate
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Set admin user in session storage
        const adminUser = {
          id: 'admin-1',
          username: username,
          role: 'administrator',
          permissions: ['read', 'write', 'delete', 'manage_users'],
          loginTime: new Date().toISOString()
        };
        
        // Import the admin setup utility
        const { setupInitialAdmin } = await import('./adminSetup');
        
        // Ensure admin user exists in the database
        await setupInitialAdmin();
        
        sessionStorage.setItem('adminUser', JSON.stringify(adminUser));
        setAdminUser(adminUser);
        setIsAdmin(true);
        
        // Log admin login activity
        await logActivity(
          adminUser.id,
          adminUser.username,
          ActivityType.ADMIN_LOGIN,
          {
            details: 'Admin user logged in'
          }
        );
        
        return true;
      } else {
        setError('Invalid credentials');
        return false;
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError('An error occurred during login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  function adminLogout() {
    sessionStorage.removeItem('adminUser');
    setAdminUser(null);
    setIsAdmin(false);
  }

  const value = {
    adminUser,
    loading,
    adminLogin: login,
    adminLogout,
    isAdmin,
    error
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {!loading && children}
    </AdminAuthContext.Provider>
  );
}