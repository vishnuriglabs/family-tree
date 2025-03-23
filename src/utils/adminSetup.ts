import { database } from './firebase';
import { ref, set } from 'firebase/database';

/**
 * This utility file provides functions to set up admin users in the database
 * It should be used only during development or by a super admin
 */

/**
 * Creates an admin user entry in the database
 * @param adminId - The ID to use for the admin (typically the auth UID)
 * @param adminData - The admin user data
 */
export const createAdminUser = async (adminId: string, adminData: any) => {
  try {
    const adminRef = ref(database, `adminUsers/${adminId}`);
    await set(adminRef, {
      ...adminData,
      role: 'administrator',
      createdAt: Date.now()
    });
    console.log('Admin user created successfully');
    return true;
  } catch (error) {
    console.error('Error creating admin user:', error);
    return false;
  }
};

/**
 * This function can be called from the browser console during development
 * to create the initial admin user
 */
export const setupInitialAdmin = async () => {
  const adminId = 'admin-1'; // This should match the ID in AdminAuthContext
  const adminData = {
    username: 'admin',
    permissions: ['read', 'write', 'delete', 'manage_users'],
  };
  
  return await createAdminUser(adminId, adminData);
};

// Expose the setup function to the window object during development
if (process.env.NODE_ENV === 'development') {
  (window as any).setupAdmin = setupInitialAdmin;
}