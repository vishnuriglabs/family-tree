import { ref, get, set, push, update, remove, query, orderByChild, equalTo } from 'firebase/database';
import { database } from './firebase';

// Types
export interface FamilyMemberData {
  id?: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  birthDate?: string;
  deathDate?: string | null;
  bio?: string;
  photoUrl?: string;
  relation?: string;
  parentId?: string | null;
  spouseId?: string | null;
  children?: string[];
  phone?: string;
  email?: string;
  education?: string;
  occupation?: string;
  address?: string;
  createdBy?: string;
  createdAt?: number;
  isRoot?: boolean; // Whether this is the root of the family tree
}

// Database paths
const FAMILY_MEMBERS_PATH = 'familyMembers';
const USERS_PATH = 'users';

// Family member functions
export const addFamilyMember = async (memberData: FamilyMemberData): Promise<string | null> => {
  try {
    const familyMembersRef = ref(database, 'familyMembers');
    const newFamilyMemberRef = push(familyMembersRef);
    
    // Remove any self-referential relationships to prevent bugs
    const cleanData = {
      name: memberData.name,
      gender: memberData.gender,
      birthDate: memberData.birthDate || null,
      deathDate: memberData.deathDate || null,
      bio: memberData.bio || '',
      photoUrl: memberData.photoUrl || '',
      relation: memberData.relation || '',
      // Ensure no self-references are created
      parentId: null, // For a new member, parent should be set separately
      spouseId: null, // For a new member, spouse should be set separately
      children: [], // For a new member, children should be added separately
      createdBy: memberData.createdBy || null,
      createdAt: memberData.createdAt || Date.now(),
      isRoot: memberData.isRoot || false,
      phone: memberData.phone || '',
      email: memberData.email || '',
      education: memberData.education || '',
      occupation: memberData.occupation || '',
      address: memberData.address || ''
    };
    
    // First save the new member
    await set(newFamilyMemberRef, cleanData);
    const newMemberId = newFamilyMemberRef.key;

    // If this is a spouse relationship, set up the bidirectional relationship
    if (memberData.relation === 'spouse' && memberData.spouseId) {
      console.log('Setting up spouse relationship for new member');
      await setSpouseRelationship(memberData.spouseId, newMemberId);
    }
    
    return newMemberId;
  } catch (error) {
    console.error('Error adding family member:', error);
    return null;
  }
};

export const updateFamilyMember = async (id: string, updates: Partial<FamilyMemberData>) => {
  const memberRef = ref(database, `${FAMILY_MEMBERS_PATH}/${id}`);
  return update(memberRef, updates);
};

export const deleteFamilyMember = async (id: string) => {
  const memberRef = ref(database, `${FAMILY_MEMBERS_PATH}/${id}`);
  return remove(memberRef);
};

export const getFamilyMember = async (id: string) => {
  const memberRef = ref(database, `${FAMILY_MEMBERS_PATH}/${id}`);
  const snapshot = await get(memberRef);

  if (snapshot.exists()) {
    return snapshot.val() as FamilyMemberData;
  }

  return null;
};

export const getFamilyMembersByUser = async (userId: string) => {
  try {
    // Get all family members from the database first
    const membersRef = ref(database, FAMILY_MEMBERS_PATH);
    const snapshot = await get(membersRef);

    if (snapshot.exists()) {
      const allMembers: Record<string, FamilyMemberData> = {};
      const connectedMembers: Record<string, FamilyMemberData> = {};

      // First pass: collect all members
      snapshot.forEach((childSnapshot) => {
        const member = childSnapshot.val() as FamilyMemberData;
        const id = childSnapshot.key!;
        if (!member.id) {
          member.id = id; // Ensure ID is set
        }
        allMembers[id] = member;
      });

      // Second pass: identify user's family members
      snapshot.forEach((childSnapshot) => {
        const member = childSnapshot.val() as FamilyMemberData;
        const id = childSnapshot.key!;

        // Add members created by current user
        if (member.createdBy === userId) {
          connectedMembers[id] = member;
        }
      });

      // Third pass: find all connected members through relationships (repeatedly until no more are found)
      let newMembersFound = true;
      while (newMembersFound) {
        newMembersFound = false;

        // Clone the current state of connectedMembers keys to avoid modification during iteration
        const currentConnectedIds = Object.keys(connectedMembers);

        for (const id of currentConnectedIds) {
          const member = allMembers[id];

          // Add parent if exists
          if (member.parentId && allMembers[member.parentId] && !connectedMembers[member.parentId]) {
            connectedMembers[member.parentId] = allMembers[member.parentId];
            newMembersFound = true;
          }

          // Add spouse if exists
          if (member.spouseId && allMembers[member.spouseId] && !connectedMembers[member.spouseId]) {
            connectedMembers[member.spouseId] = allMembers[member.spouseId];
            newMembersFound = true;
          }

          // Add children if they exist
          if (member.children && member.children.length > 0) {
            member.children.forEach(childId => {
              if (allMembers[childId] && !connectedMembers[childId]) {
                connectedMembers[childId] = allMembers[childId];
                newMembersFound = true;
              }
            });
          }

          // Check for reverse relationships:
          // Look for members who have this member as their parent
          Object.entries(allMembers).forEach(([otherMemberId, otherMember]) => {
            if (otherMember.parentId === id && !connectedMembers[otherMemberId]) {
              connectedMembers[otherMemberId] = otherMember;
              newMembersFound = true;
            }

            // Look for members who have this member as their spouse
            if (otherMember.spouseId === id && !connectedMembers[otherMemberId]) {
              connectedMembers[otherMemberId] = otherMember;
              newMembersFound = true;
            }

            // Look for members who have this member as their child
            if (otherMember.children && otherMember.children.includes(id) && !connectedMembers[otherMemberId]) {
              connectedMembers[otherMemberId] = otherMember;
              newMembersFound = true;
            }
          });
        }
      }

      console.log('Connected family members:', Object.keys(connectedMembers).length);
      return connectedMembers;
    }

    return {};
  } catch (error) {
    console.error('Error fetching family members:', error);
    throw error;
  }
};

// Helper functions for family relationships
export const addChildToParent = async (parentId: string, childId: string) => {
  try {
    // Skip invalid inputs
    if (!parentId || !childId) {
      console.error('Invalid parent or child ID', { parentId, childId });
      return null;
    }

    // Don't allow self as child
    if (parentId === childId) {
      console.error('Cannot add self as child', { parentId, childId });
      return null;
    }

    console.log(`Adding child ${childId} to parent ${parentId}`);
    const parentRef = ref(database, `${FAMILY_MEMBERS_PATH}/${parentId}`);
    const snapshot = await get(parentRef);

    if (snapshot.exists()) {
      const parent = snapshot.val() as FamilyMemberData;
      const children = parent.children || [];

      // Only add the child if it's not already in the array
      if (!children.includes(childId)) {
        const updatedChildren = [...children, childId];
        console.log(`Updated children array for ${parentId}:`, updatedChildren);
        return update(parentRef, { children: updatedChildren });
      } else {
        console.log(`Child ${childId} already in parent's children array`);
      }
    } else {
      console.error(`Parent ${parentId} not found in database`);
    }
  } catch (error) {
    console.error(`Error adding child ${childId} to parent ${parentId}:`, error);
  }

  return null;
};

export const setParentForChild = async (parentId: string, childId: string) => {
  try {
    // Skip invalid inputs
    if (!parentId || !childId) {
      console.error('Invalid parent or child ID', { parentId, childId });
      return null;
    }

    // Don't allow self as parent
    if (parentId === childId) {
      console.error('Cannot set self as parent', { parentId, childId });
      return null;
    }

    console.log(`Setting parent ${parentId} for child ${childId}`);

    // First check if child exists
    const childRef = ref(database, `${FAMILY_MEMBERS_PATH}/${childId}`);
    const childSnapshot = await get(childRef);

    if (!childSnapshot.exists()) {
      console.error(`Child ${childId} not found in database`);
      return null;
    }

    // Update child with new parent
    await update(childRef, { parentId });
    console.log(`Updated parentId for child ${childId} to ${parentId}`);

    // Also update the parent's children array for bidirectional relationship
    await addChildToParent(parentId, childId);

    return true;
  } catch (error) {
    console.error(`Error setting parent ${parentId} for child ${childId}:`, error);
    return false;
  }
};

export const setSpouseRelationship = async (spouse1Id: string, spouse2Id: string) => {
  try {
    // Safety check to prevent self-referential relationships
    if (spouse1Id === spouse2Id) {
      console.error('Cannot set spouse relationship between the same person', spouse1Id);
      return;
    }

    console.log(`Setting spouse relationship between ${spouse1Id} and ${spouse2Id}`);

    // Get references to both members
    const spouse1Ref = ref(database, `${FAMILY_MEMBERS_PATH}/${spouse1Id}`);
    const spouse2Ref = ref(database, `${FAMILY_MEMBERS_PATH}/${spouse2Id}`);

    // Get current data for both members
    const [spouse1Snapshot, spouse2Snapshot] = await Promise.all([
      get(spouse1Ref),
      get(spouse2Ref)
    ]);

    if (!spouse1Snapshot.exists() || !spouse2Snapshot.exists()) {
      console.error('One or both members do not exist');
      return;
    }

    // Update both members with their spouse IDs
    const updates = {
      [`${FAMILY_MEMBERS_PATH}/${spouse1Id}/spouseId`]: spouse2Id,
      [`${FAMILY_MEMBERS_PATH}/${spouse2Id}/spouseId`]: spouse1Id,
      [`${FAMILY_MEMBERS_PATH}/${spouse1Id}/relation`]: 'spouse',
      [`${FAMILY_MEMBERS_PATH}/${spouse2Id}/relation`]: 'spouse'
    };

    // Apply all updates atomically
    await update(ref(database), updates);
    
    console.log('Successfully set spouse relationship');
  } catch (error) {
    console.error('Error setting spouse relationship:', error);
  }
};

// Helper function to add a second parent to a child
export const addSecondParentToChild = async (childId: string, firstParentId: string, secondParentId: string) => {
  try {
    console.log(`Adding second parent ${secondParentId} to child ${childId}`);

    // First, add the child to the second parent's children array
    await addChildToParent(secondParentId, childId);

    // Since our data model only supports one parentId field directly,
    // we need to create a virtual second parent connection through the spouses

    // 1. Make sure first and second parents are connected as spouses
    await setSpouseRelationship(firstParentId, secondParentId);

    // 2. For the child, keep the existing parentId but ensure
    // we can access the second parent through the first parent's spouse
    const childRef = ref(database, `${FAMILY_MEMBERS_PATH}/${childId}`);
    const childSnapshot = await get(childRef);

    if (childSnapshot.exists()) {
      const childData = childSnapshot.val() as FamilyMemberData;

      // If child doesn't have parentId yet, set it to the first parent
      // This ensures we have at least one direct parent connection
      if (!childData.parentId) {
        console.log(`Setting primary parent ${firstParentId} for child ${childId}`);
        await update(childRef, { parentId: firstParentId });
      }

      console.log(`Successfully added second parent ${secondParentId} to child ${childId}`);
      return true;
    } else {
      console.error(`Child ${childId} not found`);
      return false;
    }
  } catch (error) {
    console.error(`Error adding second parent ${secondParentId} to child ${childId}:`, error);
    return false;
  }
};

// User profile functions
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  familyTreeName?: string;
  gender?: string;
  job?: string;
  address?: string;
  phone?: string;
  education?: string;
  createdAt: number;
}

export const createUserProfile = async (profile: UserProfile) => {
  try {
    console.log("Creating user profile for:", profile.uid);
    // Try writing to a different location that might be more permissive
    const userRef = ref(database, `users/${profile.uid}`);
    const result = await set(userRef, profile);
    console.log("User profile created successfully:", result);
    return result;
  } catch (error) {
    console.error("Error creating user profile:", error);
    // Try writing to a test location as fallback
    try {
      const testRef = ref(database, `test_users/${profile.uid}`);
      return await set(testRef, profile);
    } catch (fallbackError) {
      console.error("Fallback write also failed:", fallbackError);
      throw fallbackError;
    }
  }
};

export const getUserProfile = async (uid: string) => {
  const userRef = ref(database, `${USERS_PATH}/${uid}`);
  const snapshot = await get(userRef);

  if (snapshot.exists()) {
    return snapshot.val() as UserProfile;
  }

  return null;
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  const userRef = ref(database, `${USERS_PATH}/${uid}`);
  return update(userRef, updates);
};

// Function to remove different types of relationships between family members
export const removeFamilyRelationship = async (
  relationshipType: 'parent-child' | 'spouse' | 'second-parent',
  memberId1: string,
  memberId2: string
) => {
  try {
    // Validate input
    if (!memberId1 || !memberId2) {
      console.error('Invalid member IDs', { memberId1, memberId2 });
      return false;
    }

    if (memberId1 === memberId2) {
      console.error('Cannot remove relationship with self', { memberId1 });
      return false;
    }

    console.log(`Removing ${relationshipType} relationship between ${memberId1} and ${memberId2}`);

    // Get the members from database
    const member1Ref = ref(database, `${FAMILY_MEMBERS_PATH}/${memberId1}`);
    const member2Ref = ref(database, `${FAMILY_MEMBERS_PATH}/${memberId2}`);

    const member1Snapshot = await get(member1Ref);
    const member2Snapshot = await get(member2Ref);

    if (!member1Snapshot.exists() || !member2Snapshot.exists()) {
      console.error('One or both members do not exist');
      return false;
    }

    const member1 = member1Snapshot.val() as FamilyMemberData;
    const member2 = member2Snapshot.val() as FamilyMemberData;

    switch (relationshipType) {
      case 'parent-child':
        // Remove parent-child relationship (member1 is parent, member2 is child)
        // 1. Remove child from parent's children array
        if (member1.children && member1.children.includes(memberId2)) {
          const updatedChildren = member1.children.filter(id => id !== memberId2);
          await update(member1Ref, { children: updatedChildren.length ? updatedChildren : null });
        }

        // 2. Remove parent from child's parentId if it matches
        if (member2.parentId === memberId1) {
          await update(member2Ref, { parentId: null });
        }
        break;

      case 'spouse':
        // Remove spouse relationship (bidirectional)
        // 1. Remove spouse reference from member1 if it points to member2
        if (member1.spouseId === memberId2) {
          await update(member1Ref, { spouseId: null });
        }

        // 2. Remove spouse reference from member2 if it points to member1
        if (member2.spouseId === memberId1) {
          await update(member2Ref, { spouseId: null });
        }
        break;

      case 'second-parent':
        // For second parent relationship, we need to:
        // 1. Keep the primary parent relationship intact
        // 2. Remove the second parent from the child's relationships 

        // If member1 is the second parent of member2:
        // - Remove member2 from member1's children array
        if (member1.children && member1.children.includes(memberId2)) {
          const updatedChildren = member1.children.filter(id => id !== memberId2);
          await update(member1Ref, { children: updatedChildren.length ? updatedChildren : null });
        }

        // - If member2's primary parent has member1 as spouse, break that relationship
        if (member2.parentId) {
          const primaryParentRef = ref(database, `${FAMILY_MEMBERS_PATH}/${member2.parentId}`);
          const primaryParentSnapshot = await get(primaryParentRef);

          if (primaryParentSnapshot.exists()) {
            const primaryParent = primaryParentSnapshot.val() as FamilyMemberData;
            if (primaryParent.spouseId === memberId1) {
              await update(primaryParentRef, { spouseId: null });
              await update(member1Ref, { spouseId: null });
            }
          }
        }
        break;

      default:
        console.error('Invalid relationship type', relationshipType);
        return false;
    }

    console.log(`Successfully removed ${relationshipType} relationship between ${memberId1} and ${memberId2}`);
    return true;
  } catch (error) {
    console.error(`Error removing relationship between ${memberId1} and ${memberId2}:`, error);
    return false;
  }
};

// Function to fix self-referential relationships for an existing member
export const fixSelfReferences = async (memberId: string) => {
  try {
    if (!memberId) {
      console.error('Invalid member ID');
      return false;
    }

    console.log(`Fixing self-references for member: ${memberId}`);
    const memberRef = ref(database, `${FAMILY_MEMBERS_PATH}/${memberId}`);
    const snapshot = await get(memberRef);

    if (!snapshot.exists()) {
      console.error(`Member ${memberId} not found`);
      return false;
    }

    const member = snapshot.val() as FamilyMemberData;
    const updates: Partial<FamilyMemberData> = {};
    let hasUpdates = false;

    // Check for self-reference as parent
    if (member.parentId === memberId) {
      console.log(`Fixing self-reference as parent for ${memberId}`);
      updates.parentId = null;
      hasUpdates = true;
    }

    // Check for self-reference as spouse
    if (member.spouseId === memberId) {
      console.log(`Fixing self-reference as spouse for ${memberId}`);
      updates.spouseId = null;
      hasUpdates = true;
    }

    // Check for self-reference in children array
    if (member.children && member.children.includes(memberId)) {
      console.log(`Fixing self-reference in children array for ${memberId}`);
      updates.children = member.children.filter(id => id !== memberId);
      hasUpdates = true;
    }

    // Apply updates if any
    if (hasUpdates) {
      await update(memberRef, updates);
      console.log(`Fixed self-references for ${memberId}`);
      return true;
    }

    console.log(`No self-references found for ${memberId}`);
    return false;
  } catch (error) {
    console.error(`Error fixing self-references for ${memberId}:`, error);
    return false;
  }
}; 