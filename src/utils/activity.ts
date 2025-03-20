import { ref, push, set } from 'firebase/database';
import { database } from './firebase';

// Activity types for consistent logging
export enum ActivityType {
  USER_SIGNUP = 'User Signup',
  USER_LOGIN = 'User Login',
  MEMBER_ADDED = 'Added Family Member',
  MEMBER_UPDATED = 'Updated Family Member',
  MEMBER_DELETED = 'Deleted Family Member',
  RELATIONSHIP_UPDATED = 'Updated Relationship',
  FAMILY_EXPORTED = 'Exported Family Tree',
  ADMIN_LOGIN = 'Admin Login',
  SYSTEM = 'System Event'
}

interface ActivityData {
  userId: string;
  user: string;
  userEmail?: string;
  action: string;
  family?: string;
  entityId?: string; // ID of the entity being modified (member, family, etc.)
  details?: string; // Additional details about the activity
  timestamp: number;
}

/**
 * Logs an activity to the Firebase database
 * @param userId - The ID of the user performing the action
 * @param userName - The display name of the user
 * @param action - The action being performed (use ActivityType for consistency)
 * @param options - Additional options for the activity
 * @returns Promise that resolves when the activity is logged
 */
export const logActivity = async (
  userId: string,
  userName: string,
  action: ActivityType | string,
  options: {
    userEmail?: string;
    family?: string;
    entityId?: string;
    details?: string;
  } = {}
): Promise<void> => {
  try {
    const activityRef = ref(database, 'activities');
    const newActivityRef = push(activityRef);
    
    const activityData: ActivityData = {
      userId,
      user: userName,
      action,
      timestamp: Date.now(),
      ...options
    };
    
    await set(newActivityRef, activityData);
    console.log('Activity logged:', action);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

/**
 * Logs a system activity (not associated with a specific user)
 * @param action - The system action being performed
 * @param details - Additional details about the system activity
 */
export const logSystemActivity = async (
  action: string,
  details: string
): Promise<void> => {
  try {
    await logActivity('system', 'System', action, { details });
  } catch (error) {
    console.error('Error logging system activity:', error);
  }
}; 