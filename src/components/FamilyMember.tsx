import React from 'react';
import { User, UserCircle } from 'lucide-react';
import type { FamilyMember as FamilyMemberType } from '../types';

interface Props {
  member: FamilyMemberType;
  onSelect: (member: FamilyMemberType) => void;
}

export function FamilyMember({ member, onSelect }: Props) {
  return (
    <div 
      onClick={() => onSelect(member)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer
                 hover:shadow-lg transition-shadow duration-200"
    >
      <div className="flex items-center space-x-4">
        {member.imageUrl ? (
          <img 
            src={member.imageUrl} 
            alt={member.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 
                        flex items-center justify-center">
            <UserCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {member.name}
          </h3>
          {member.birthDate && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {member.birthDate} {member.deathDate && `- ${member.deathDate}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}