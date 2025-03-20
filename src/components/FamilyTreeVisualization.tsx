import React, { useState, useEffect } from 'react';
import { UserCircle, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FamilyMemberData } from '../utils/database';

interface FamilyNode {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  photoUrl?: string;
  birthDate?: string;
  parentId?: string | null;
  spouseId?: string | null;
  children: string[];
  bio?: string;
  isRoot?: boolean;
}

interface FamilyTreeViewProps {
  familyMembers: Record<string, FamilyMemberData>;
  rootMemberId?: string;
  onMemberClick: (memberId: string) => void;
}

export const FamilyTreeVisualization: React.FC<FamilyTreeViewProps> = ({ 
  familyMembers, 
  rootMemberId,
  onMemberClick
}) => {
  const [rootId, setRootId] = useState<string | undefined>(rootMemberId);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // If no root member is specified, find the oldest ancestor
  useEffect(() => {
    if (!rootId && Object.keys(familyMembers).length > 0) {
      // First check if there's a member marked as root
      const rootMember = Object.values(familyMembers).find(member => member.isRoot);
      
      if (rootMember && rootMember.id) {
        setRootId(rootMember.id);
      } else {
        // If no root member, find a member without parents to use as root
        const possibleRoots = Object.values(familyMembers).filter(
          member => !member.parentId || member.parentId === ""
        );
        
        if (possibleRoots.length > 0) {
          setRootId(possibleRoots[0].id);
        } else {
          // If all members have parents, just use the first one
          setRootId(Object.values(familyMembers)[0].id);
        }
      }
    }
  }, [familyMembers, rootId]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Build the family tree structure
  const buildFamilyTree = (memberId: string, depth = 0, maxDepth = 3) => {
    if (depth > maxDepth) return null;
    
    const member = familyMembers[memberId];
    if (!member) return null;

    const isExpanded = expandedNodes.has(memberId);
    const hasChildren = member.children && member.children.length > 0;
    const spouse = member.spouseId ? familyMembers[member.spouseId] : null;
    
    return (
      <div className="family-node" key={member.id}>
        <div className="flex flex-col items-center">
          <div 
            className={`p-3 my-2 rounded-lg shadow ${
              member.gender === 'male' 
                ? 'bg-blue-100 dark:bg-blue-900/30' 
                : member.gender === 'female' 
                  ? 'bg-pink-100 dark:bg-pink-900/30' 
                  : 'bg-purple-100 dark:bg-purple-900/30'
            } cursor-pointer transition-transform hover:scale-105`}
            onClick={() => onMemberClick(member.id || '')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {member.photoUrl ? (
                  <img 
                    src={member.photoUrl} 
                    alt={member.name} 
                    className="w-12 h-12 object-cover"
                  />
                ) : (
                  <UserCircle className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{member.name}</h3>
                {member.birthDate && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {member.birthDate}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Spouse (if exists) */}
          {spouse && (
            <div className="relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-b-2 border-gray-300 dark:border-gray-600"></div>
              <div 
                className={`p-3 my-2 rounded-lg shadow ${
                  spouse.gender === 'male' 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : spouse.gender === 'female' 
                      ? 'bg-pink-100 dark:bg-pink-900/30' 
                      : 'bg-purple-100 dark:bg-purple-900/30'
                } cursor-pointer transition-transform hover:scale-105 ml-20`}
                onClick={() => onMemberClick(spouse.id || '')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {spouse.photoUrl ? (
                      <img 
                        src={spouse.photoUrl} 
                        alt={spouse.name} 
                        className="w-12 h-12 object-cover"
                      />
                    ) : (
                      <UserCircle className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{spouse.name}</h3>
                    {spouse.birthDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {spouse.birthDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Toggle button to expand/collapse */}
          {hasChildren && (
            <button 
              onClick={() => toggleNode(memberId)}
              className="mt-2 p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          )}
        </div>
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pl-12 border-l-2 border-gray-300 dark:border-gray-600 mt-2 ml-6"
            >
              {member.children?.map(childId => (
                buildFamilyTree(childId, depth + 1, maxDepth)
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    );
  };

  if (!rootId || Object.keys(familyMembers).length === 0) {
    return (
      <div className="text-center p-8">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Family Members Yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Start building your family tree by adding family members using the button above.
        </p>
      </div>
    );
  }

  return (
    <div className="family-tree-container p-4 overflow-x-auto">
      {rootId && buildFamilyTree(rootId)}
    </div>
  );
}; 