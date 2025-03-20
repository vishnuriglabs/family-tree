import React, { useState, useEffect } from 'react';
import { FamilyTreeVisualization } from './FamilyTreeVisualization';
import { useAuth } from '../utils/AuthContext';
import { getFamilyMembersByUser, FamilyMemberData, setParentForChild, setSpouseRelationship, addSecondParentToChild } from '../utils/database';
import { Loader2, UserCircle, X, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MemberDetailModal } from './MemberDetailModal';

export function FamilyTreeContainer() {
  const [members, setMembers] = useState<Record<string, FamilyMemberData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const [selectedMember, setSelectedMember] = useState<FamilyMemberData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadFamilyMembers();
  }, [currentUser]);

  const loadFamilyMembers = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const membersData = await getFamilyMembersByUser(currentUser.uid);
      setMembers(membersData);
    } catch (err) {
      console.error('Failed to load family members:', err);
      setError('Failed to load family members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberClick = (memberId: string) => {
    const member = members[memberId];
    if (member) {
      setSelectedMember(member);
    }
  };

  const handleCloseDetails = () => {
    setSelectedMember(null);
  };

  const handleAddRelative = (memberId: string, relationType: string) => {
    // Store selected member and relationship in sessionStorage
    sessionStorage.setItem('selectedMemberId', memberId);
    sessionStorage.setItem('relationType', relationType);
    
    // Navigate to add family member page
    navigate('/add-family-member');
  };

  const updateFamilyRelationships = async (memberId1: string, memberId2: string, relationshipType: string) => {
    try {
      if (relationshipType === 'parent-child') {
        // Set memberId1 as parent of memberId2
        await setParentForChild(memberId1, memberId2);
      } else if (relationshipType === 'spouse') {
        // Set spouse relationship between memberId1 and memberId2
        await setSpouseRelationship(memberId1, memberId2);
      } else if (relationshipType === 'second-parent') {
        // Find the current parent 
        const child = members[memberId2];
        if (child && child.parentId) {
          await addSecondParentToChild(memberId2, child.parentId, memberId1);
        } else {
          console.error('Cannot add second parent: child has no first parent');
        }
      }
      
      // Reload family members to reflect changes
      await loadFamilyMembers();
    } catch (err) {
      console.error('Failed to update relationship:', err);
      setError('Failed to update relationship. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <FamilyTreeVisualization 
        familyMembers={members}
        onMemberClick={handleMemberClick}
      />

      {/* Member Details Modal */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={handleCloseDetails}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={handleCloseDetails}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {selectedMember.photoUrl ? (
                    <img 
                      src={selectedMember.photoUrl}
                      alt={selectedMember.name}
                      className="w-16 h-16 object-cover"
                    />
                  ) : (
                    <UserCircle className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedMember.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedMember.gender === 'male' ? 'Male' : selectedMember.gender === 'female' ? 'Female' : 'Other'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedMember.birthDate && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Birth Date</h4>
                    <p className="text-gray-900 dark:text-white">{selectedMember.birthDate}</p>
                  </div>
                )}

                {selectedMember.deathDate && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Death Date</h4>
                    <p className="text-gray-900 dark:text-white">{selectedMember.deathDate}</p>
                  </div>
                )}

                {selectedMember.bio && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Biography</h4>
                    <p className="text-gray-900 dark:text-white whitespace-pre-line">{selectedMember.bio}</p>
                  </div>
                )}

                {/* Relationships */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Family Relationships</h4>
                  
                  {selectedMember.parentId && members[selectedMember.parentId] && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Parent</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {members[selectedMember.parentId].name}
                      </span>
                    </div>
                  )}

                  {selectedMember.spouseId && members[selectedMember.spouseId] && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Spouse</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {members[selectedMember.spouseId].name}
                      </span>
                    </div>
                  )}

                  {selectedMember.children && selectedMember.children.length > 0 && (
                    <div className="py-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Children</span>
                      <ul className="mt-1 space-y-1">
                        {selectedMember.children.map(childId => {
                          const child = members[childId];
                          return child ? (
                            <li key={childId} className="text-sm font-medium text-gray-900 dark:text-white">
                              {child.name}
                            </li>
                          ) : null;
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Add Relative Buttons */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Add New Relative</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {!selectedMember.spouseId && (
                      <button
                        onClick={() => handleAddRelative(selectedMember.id!, 'spouse')}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add Spouse
                      </button>
                    )}
                    <button
                      onClick={() => handleAddRelative(selectedMember.id!, 'child')}
                      className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Child
                    </button>
                    <button
                      onClick={() => handleAddRelative(selectedMember.id!, 'parent')}
                      className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Parent
                    </button>
                    <button
                      onClick={() => handleAddRelative(selectedMember.id!, 'sibling')}
                      className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Sibling
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedMember && (
        <MemberDetailModal 
          member={selectedMember}
          members={members}
          onClose={handleCloseDetails}
          onAddRelative={handleAddRelative}
          onUpdateRelationship={updateFamilyRelationships}
        />
      )}
    </div>
  );
} 