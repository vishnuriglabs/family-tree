import { FamilyMemberData } from './database';

interface TreeNode {
  id: string;
  name: string;
  gender: string;
  birthDate?: string;
  photoUrl?: string;
  bio?: string;
  spouseId?: string | null;
  spouse?: TreeNode | null;
  children: TreeNode[];
}

// Find the root member of the family tree
export const findRootMember = (members: Record<string, FamilyMemberData>): FamilyMemberData | null => {
  // First look for a member explicitly marked as root
  for (const id in members) {
    if (members[id].isRoot) {
      return members[id];
    }
  }

  // If no explicit root, find members without parents who have the most descendants
  const membersWithoutParents = Object.values(members).filter(m => !m.parentId);
  
  if (membersWithoutParents.length === 0) {
    return null;
  } else if (membersWithoutParents.length === 1) {
    return membersWithoutParents[0];
  }

  // If multiple members without parents, choose the one with the most descendants
  // This is a heuristic to find the most likely root person
  return membersWithoutParents.sort((a, b) => {
    const aDesc = countDescendants(a.id!, members);
    const bDesc = countDescendants(b.id!, members);
    return bDesc - aDesc;
  })[0];
};

// Count the number of descendants for a member (for finding the root)
const countDescendants = (memberId: string, members: Record<string, FamilyMemberData>): number => {
  const member = members[memberId];
  if (!member) return 0;
  
  let count = 0;
  
  // Count direct children
  if (member.children && member.children.length > 0) {
    count += member.children.length;
    
    // Recursively count their descendants
    for (const childId of member.children) {
      count += countDescendants(childId, members);
    }
  }
  
  return count;
};

// Build a tree structure starting from the root member
export const buildFamilyTree = (members: Record<string, FamilyMemberData>): TreeNode | null => {
  const rootMember = findRootMember(members);
  if (!rootMember || !rootMember.id) return null;
  
  // Use a map to prevent infinite loops in case of circular references
  const processedMembers = new Set<string>();
  
  // Recursively build the tree
  return buildTreeNode(rootMember.id, members, processedMembers);
};

// Helper function to build tree recursively
const buildTreeNode = (
  memberId: string, 
  members: Record<string, FamilyMemberData>,
  processedMembers: Set<string>
): TreeNode | null => {
  if (processedMembers.has(memberId)) return null;
  
  const member = members[memberId];
  if (!member) return null;
  
  processedMembers.add(memberId);
  
  const node: TreeNode = {
    id: memberId,
    name: member.name,
    gender: member.gender,
    birthDate: member.birthDate,
    photoUrl: member.photoUrl,
    bio: member.bio,
    spouseId: member.spouseId,
    spouse: null,
    children: []
  };
  
  // Add spouse if exists
  if (member.spouseId && members[member.spouseId] && !processedMembers.has(member.spouseId)) {
    const spouseMember = members[member.spouseId];
    node.spouse = {
      id: member.spouseId,
      name: spouseMember.name,
      gender: spouseMember.gender,
      birthDate: spouseMember.birthDate,
      photoUrl: spouseMember.photoUrl,
      bio: spouseMember.bio,
      children: [],
      spouseId: memberId
    };
    
    // Mark spouse as processed
    processedMembers.add(member.spouseId);
  }
  
  // Add children
  if (member.children && member.children.length > 0) {
    for (const childId of member.children) {
      const childNode = buildTreeNode(childId, members, processedMembers);
      if (childNode) {
        node.children.push(childNode);
      }
    }
  }
  
  return node;
};

// Generate a formatted JSON string for the family tree
export const generateFamilyTreeJSON = (members: Record<string, FamilyMemberData>): string => {
  const tree = buildFamilyTree(members);
  return JSON.stringify(tree, null, 2);
};

// Generate CSV format for the family tree (flat structure)
export const generateFamilyTreeCSV = (members: Record<string, FamilyMemberData>): string => {
  // CSV header
  let csv = 'ID,Name,Gender,Birth Date,Parent ID,Spouse ID\n';
  
  // Add each member as a row
  for (const id in members) {
    const member = members[id];
    csv += `${id},${member.name},${member.gender},${member.birthDate || ''},${member.parentId || ''},${member.spouseId || ''}\n`;
  }
  
  return csv;
};

// Helper function to download content as a file
export const downloadFile = (content: string, fileName: string, contentType: string): void => {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}; 