import { database } from './firebase';
import { ref, get, update } from 'firebase/database';

/**
 * Utility function to fix spouse relationships in the database
 * This handles cases where a member has relation="spouse" but no proper bidirectional connection
 */
export async function fixSpouseRelationships() {
  try {
    // Get all family members
    const familyMembersRef = ref(database, 'familyMembers');
    const snapshot = await get(familyMembersRef);
    
    if (!snapshot.exists()) {
      console.log('No family members found');
      return;
    }
    
    const members = snapshot.val();
    const updates: Record<string, any> = {};
    
    // First pass: identify members with relation="spouse" but no spouseId
    for (const [memberId, memberData] of Object.entries(members)) {
      const member = memberData as any;
      
      // If this member has relation="spouse" but no spouseId
      if (member.relation === 'spouse' && !member.spouseId) {
        console.log(`Found member with relation="spouse" but no spouseId: ${member.name}`);
        
        // Look for potential spouses - members who might have this member as their spouse
        for (const [potentialSpouseId, potentialSpouseData] of Object.entries(members)) {
          const potentialSpouse = potentialSpouseData as any;
          
          // Skip the same member
          if (potentialSpouseId === memberId) continue;
          
          // If we find someone who already has this member as their spouse
          if (potentialSpouse.spouseId === memberId) {
            console.log(`Found match: ${potentialSpouse.name} has ${member.name} as spouse`);
            
            // Update the spouseId for this member
            updates[`/familyMembers/${memberId}/spouseId`] = potentialSpouseId;
            
            // Create bidirectional relationship
            updates[`/relationships/${memberId}/spouse`] = potentialSpouseId;
            updates[`/relationships/${potentialSpouseId}/spouse`] = memberId;
            
            break;
          }
        }
      }
    }
    
    // Second pass: Check if we need to add any missing bidirectional relationships
    for (const [memberId, memberData] of Object.entries(members)) {
      const member = memberData as any;
      
      // If this member has a spouseId but no relationship entry
      if (member.spouseId && members[member.spouseId]) {
        const spouseId = member.spouseId;
        
        // Update relationships entries
        updates[`/relationships/${memberId}/spouse`] = spouseId;
        updates[`/relationships/${spouseId}/spouse`] = memberId;
      }
    }
    
    // Apply all updates atomically
    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
      console.log(`Fixed ${Object.keys(updates).length / 2} spouse relationships`);
      return true;
    } else {
      console.log('No spouse relationships needed fixing');
      return false;
    }
  } catch (error) {
    console.error('Error fixing spouse relationships:', error);
    return false;
  }
}

/**
 * This function directly creates a spouse relationship between Arjun and Fasna
 * based on their names in the database
 */
export async function fixArjunFasnaRelationship() {
  try {
    // Get all family members
    const familyMembersRef = ref(database, 'familyMembers');
    const snapshot = await get(familyMembersRef);
    
    if (!snapshot.exists()) {
      console.log('No family members found');
      return false;
    }
    
    const members = snapshot.val();
    let arjunId: string | null = null;
    let fasnaId: string | null = null;
    
    // Find Arjun and Fasna by name
    for (const [memberId, memberData] of Object.entries(members)) {
      const member = memberData as any;
      
      if (member.name && member.name.toLowerCase().includes('arjun')) {
        arjunId = memberId;
      }
      
      if (member.name && member.name.toLowerCase().includes('fasna')) {
        fasnaId = memberId;
      }
      
      // If we found both, break out of the loop
      if (arjunId && fasnaId) break;
    }
    
    // If we didn't find both members, return
    if (!arjunId || !fasnaId) {
      console.log(`Couldn't find both members: Arjun (${arjunId}) and Fasna (${fasnaId})`);
      return false;
    }
    
    console.log(`Found Arjun (${arjunId}) and Fasna (${fasnaId})`);
    
    // Create the updates object
    const updates: Record<string, any> = {
      // Set spouseId in both members' data
      [`/familyMembers/${arjunId}/spouseId`]: fasnaId,
      [`/familyMembers/${fasnaId}/spouseId`]: arjunId,
      
      // Create bidirectional relationship in relationships node
      [`/relationships/${arjunId}/spouse`]: fasnaId,
      [`/relationships/${fasnaId}/spouse`]: arjunId
    };
    
    // Apply all updates atomically
    await update(ref(database), updates);
    console.log('Successfully created spouse relationship between Arjun and Fasna');
    return true;
  } catch (error) {
    console.error('Error fixing Arjun-Fasna relationship:', error);
    return false;
  }
} 