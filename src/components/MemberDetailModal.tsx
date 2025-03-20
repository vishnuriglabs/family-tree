import React, { useState, useEffect } from 'react';
import { UserPlus, Users, User } from 'lucide-react';

export const MemberDetailModal = ({ member, members, onClose, onAddRelative, onUpdateRelationship }) => {
  const [showSecondParentOptions, setShowSecondParentOptions] = useState(false);
  const [relationships, setRelationships] = useState({
    spouse: null,
    children: [],
    parent: null
  });

  // Reset relationships when member changes
  useEffect(() => {
    if (!member || !members) return;
    
    // Find all relationships using database references
    findAllRelationships();
  }, [member, members]);

  const findAllRelationships = () => {
    // Debug info
    console.log(`Finding relationships for ${member.name} (ID: ${member.id})`);
    console.log('Member data:', member);
    
    // --------- FIND PARENT ---------
    let parent = null;
    if (member.parentId && members[member.parentId]) {
      // Skip self-referential relationships
      if (member.parentId !== member.id) {
        parent = members[member.parentId];
        console.log(`Found parent: ${parent.name}`);
      } else {
        console.log('Skipping self-reference parent');
      }
    }

    // --------- FIND SPOUSE ---------
    let spouse = null;
    
    // Method 1: Check if this member has a spouse reference
    if (member.spouseId && members[member.spouseId]) {
      // Skip self-referential relationships
      if (member.spouseId !== member.id) {
        spouse = members[member.spouseId];
        console.log(`Found spouse (method 1): ${spouse.name}`);
      } else {
        console.log('Skipping self-reference spouse');
      }
    }

    // Method 2: Look for members that have this member as their spouse
    if (!spouse) {
      const spouseFromOthers = Object.values(members).find(m => 
        m.spouseId === member.id && m.id !== member.id
      );
      if (spouseFromOthers) {
        spouse = spouseFromOthers;
        console.log(`Found spouse (method 2): ${spouse.name}`);
      }
    }

    // If we found a spouse, ensure both members reference each other
    if (spouse) {
      const spouseId = spouse.id;
      const memberId = member.id;
      
      // Update the current member's spouseId if needed
      if (!member.spouseId) {
        member.spouseId = spouseId;
      }
      
      // Update the spouse's spouseId if needed
      if (!spouse.spouseId) {
        spouse.spouseId = memberId;
      }
    }

    // --------- FIND CHILDREN ---------
    let children = [];
    
    // Method 1: Check this member's children array
    if (member.children && Array.isArray(member.children)) {
      children = member.children
        .filter(childId => childId !== member.id) // Skip self-references
        .map(childId => members[childId])
        .filter(child => child); // Remove any undefined children
      console.log(`Found ${children.length} children from member's children array`);
    }

    // Method 2: Look for members that have this member as their parent
    const childrenFromParentId = Object.values(members)
      .filter(m => m.parentId === member.id && m.id !== member.id);
    
    if (childrenFromParentId.length > 0) {
      // Add any children not already in the array
      childrenFromParentId.forEach(child => {
        if (!children.find(c => c.id === child.id)) {
          children.push(child);
        }
      });
      console.log(`Found ${childrenFromParentId.length} additional children from parentId references`);
    }

    // Update the relationships state
    setRelationships({
      spouse,
      children,
      parent
    });
  };

  // Guard clause if no member selected
  if (!member) return null;

  // Find children for second parent functionality
  const potentialChildrenForSecondParent = relationships.spouse 
    ? Object.values(members).filter(m => {
        // Skip self, current children, and spouse
        if (m.id === member.id) return false;
        if (relationships.children.some(child => child.id === m.id)) return false;
        if (relationships.spouse && m.id === relationships.spouse.id) return false;
        
        // Include children of spouse that aren't already children of this member
        return m.parentId === relationships.spouse.id;
      })
    : [];

  const handleSetAsSecondParent = (childId) => {
    if (onUpdateRelationship) {
      onUpdateRelationship(member.id, childId, 'second-parent');
      setShowSecondParentOptions(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
        <button 
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          ×
        </button>
        
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
            {member.photoUrl ? (
              <img 
                src={member.photoUrl} 
                alt={member.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(`Failed to load image for ${member.name}`);
                  e.target.style.display = 'none';
                  e.currentTarget.parentElement.appendChild(
                    document.createElement('div')
                  ).outerHTML = '<div class="w-full h-full flex items-center justify-center"><User class="w-8 h-8 text-gray-400" /></div>';
                }}
              />
            ) : (
              <User className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{member.name}</h3>
            <p className="text-gray-400">
              {member.gender === 'male' ? 'Male' : member.gender === 'female' ? 'Female' : 'Other'}
              {member.birthDate && ` • ${member.birthDate}`}
            </p>
          </div>
        </div>
        
        {member.bio && (
          <div className="mb-4">
            <h4 className="text-gray-400 text-sm font-medium mb-1">Biography</h4>
            <p className="text-gray-300">{member.bio}</p>
          </div>
        )}
        
        {/* Parents */}
        <div className="mb-4">
          <h4 className="text-gray-400 text-sm font-medium border-b border-gray-700 pb-2 mb-3">Parents</h4>
          {relationships.parent ? (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                {relationships.parent.photoUrl ? (
                  <img 
                    src={relationships.parent.photoUrl} 
                    alt={relationships.parent.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-white">{relationships.parent.name}</p>
                <p className="text-gray-400 text-xs">{relationships.parent.birthDate}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No parent information</p>
          )}
        </div>
        
        {/* Spouse */}
        <div className="mb-4">
          <h4 className="text-gray-400 text-sm font-medium border-b border-gray-700 pb-2 mb-3">Spouse</h4>
          {relationships.spouse && relationships.spouse.id !== member.id ? (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                {relationships.spouse.photoUrl ? (
                  <img 
                    src={relationships.spouse.photoUrl} 
                    alt={relationships.spouse.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-white">{relationships.spouse.name}</p>
                <p className="text-gray-400 text-xs">{relationships.spouse.birthDate}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No spouse</p>
          )}
        </div>
        
        {/* Children */}
        <div className="mb-4">
          <h4 className="text-gray-400 text-sm font-medium border-b border-gray-700 pb-2 mb-3">Children</h4>
          {relationships.children.length > 0 && relationships.children.some(child => child.id !== member.id) ? (
            <div className="grid grid-cols-2 gap-4">
              {relationships.children
                .filter(child => child.id !== member.id) // Extra safety filter to remove self-references
                .map(child => (
                <div key={child.id} className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                    {child.photoUrl ? (
                      <img 
                        src={child.photoUrl} 
                        alt={child.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-white text-sm">{child.name}</p>
                    <p className="text-gray-400 text-xs">{child.birthDate}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No children</p>
          )}
        </div>

        {/* Second parent options */}
        {relationships.spouse && potentialChildrenForSecondParent.length > 0 && (
          <div className="mb-4">
            <button
              className="text-indigo-400 text-sm font-medium flex items-center"
              onClick={() => setShowSecondParentOptions(!showSecondParentOptions)}
            >
              <Users className="h-4 w-4 mr-1" />
              {showSecondParentOptions ? 'Hide second parent options' : 'Add as second parent'}
            </button>
            
            {showSecondParentOptions && (
              <div className="mt-2 bg-gray-700 p-3 rounded-md">
                <p className="text-sm text-gray-300 mb-2">
                  Mark as second parent for:
                </p>
                {potentialChildrenForSecondParent.map(child => (
                  <div key={child.id} className="flex items-center justify-between mb-2 last:mb-0">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                        {child.photoUrl ? (
                          <img 
                            src={child.photoUrl} 
                            alt={child.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <span className="text-white text-sm">{child.name}</span>
                    </div>
                    <button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1 px-2 rounded"
                      onClick={() => handleSetAsSecondParent(child.id)}
                    >
                      Mark as Parent
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Add Relative Buttons */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
            onClick={() => {
              console.log('Add Spouse button clicked for member:', member);
              if (onAddRelative && member && member.id) {
                onAddRelative(member.id, 'spouse');
              } else {
                console.error('Cannot add spouse:', { 
                  hasOnAddRelative: !!onAddRelative,
                  member,
                  memberId: member?.id 
                });
              }
            }}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            {relationships.spouse ? 'Update Spouse' : 'Add Spouse'}
          </button>
          <button 
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
            onClick={() => {
              console.log('Add Child button clicked for member:', member);
              if (onAddRelative && member && member.id) {
                onAddRelative(member.id, 'child');
              } else {
                console.error('Cannot add child:', { 
                  hasOnAddRelative: !!onAddRelative,
                  member,
                  memberId: member?.id 
                });
              }
            }}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add Child
          </button>
          {!relationships.parent && (
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
              onClick={() => {
                console.log('Add Parent button clicked for member:', member);
                if (onAddRelative && member && member.id) {
                  onAddRelative(member.id, 'parent');
                } else {
                  console.error('Cannot add parent:', { 
                    hasOnAddRelative: !!onAddRelative,
                    member,
                    memberId: member?.id 
                  });
                }
              }}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Add Parent
            </button>
          )}
          <button 
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
            onClick={() => {
              console.log('Add Sibling button clicked for member:', member);
              if (onAddRelative && member && member.id) {
                onAddRelative(member.id, 'sibling');
              } else {
                console.error('Cannot add sibling:', { 
                  hasOnAddRelative: !!onAddRelative,
                  member,
                  memberId: member?.id 
                });
              }
            }}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add Sibling
          </button>
        </div>
      </div>
    </div>
  );
}; 