import React, { useState } from 'react';
import { FamilyMember } from './FamilyMember';
import type { FamilyMember as FamilyMemberType } from '../types';

interface Props {
  members: FamilyMemberType[];
}

export function FamilyTree({ members }: Props) {
  const [selectedMember, setSelectedMember] = useState<FamilyMemberType | null>(null);

  const getRelatives = (member: FamilyMemberType, relativeIds: string[]) => {
    return members.filter(m => relativeIds.includes(m.id));
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => (
          <FamilyMember
            key={member.id}
            member={member}
            onSelect={setSelectedMember}
          />
        ))}
      </div>

      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center 
                      justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedMember.name}
              </h2>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 
                         dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>

            {selectedMember.bio && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {selectedMember.bio}
              </p>
            )}

            <div className="space-y-4">
              {selectedMember.parentIds.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Parents</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {getRelatives(selectedMember, selectedMember.parentIds).map(parent => (
                      <FamilyMember
                        key={parent.id}
                        member={parent}
                        onSelect={setSelectedMember}
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedMember.spouseIds.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Spouse(s)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {getRelatives(selectedMember, selectedMember.spouseIds).map(spouse => (
                      <FamilyMember
                        key={spouse.id}
                        member={spouse}
                        onSelect={setSelectedMember}
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedMember.childrenIds.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Children</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {getRelatives(selectedMember, selectedMember.childrenIds).map(child => (
                      <FamilyMember
                        key={child.id}
                        member={child}
                        onSelect={setSelectedMember}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}