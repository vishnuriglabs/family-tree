import React, { useState, useEffect } from 'react';
import { database } from '../utils/firebase';
import { ref, get } from 'firebase/database';
import { useParams, useNavigate } from 'react-router-dom';

interface FamilyMember {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  education?: string;
  occupation?: string;
  phone?: string;
  email?: string;
  address?: string;
  spouseId?: string;
}

interface Relationships {
  spouse?: string;
  parents?: { [key: string]: boolean };
  children?: { [key: string]: boolean };
  siblings?: { [key: string]: boolean };
}

export function MemberDetails() {
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [relationships, setRelationships] = useState<Relationships | null>(null);
  const [spouse, setSpouse] = useState<FamilyMember | null>(null);
  const [parents, setParents] = useState<FamilyMember[]>([]);
  const [children, setChildren] = useState<FamilyMember[]>([]);
  const [siblings, setSiblings] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { memberId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!memberId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch member data
        const memberSnapshot = await get(ref(database, `familyMembers/${memberId}`));
        if (!memberSnapshot.exists()) {
          setError('Member not found');
          return;
        }
        
        const memberData = memberSnapshot.val();
        setMember({ id: memberId, ...memberData });

        // Check both spouseId and relationships for spouse information
        let spouseData = null;
        
        // First check spouseId in member data
        if (memberData.spouseId) {
          const spouseSnapshot = await get(ref(database, `familyMembers/${memberData.spouseId}`));
          if (spouseSnapshot.exists()) {
            spouseData = { id: memberData.spouseId, ...spouseSnapshot.val() };
          }
        }

        // If no spouse found, check relationships node
        if (!spouseData) {
          const relationshipsSnapshot = await get(ref(database, `relationships/${memberId}`));
          if (relationshipsSnapshot.exists()) {
            const relationshipsData = relationshipsSnapshot.val();
            if (relationshipsData.spouse) {
              const spouseSnapshot = await get(ref(database, `familyMembers/${relationshipsData.spouse}`));
              if (spouseSnapshot.exists()) {
                spouseData = { id: relationshipsData.spouse, ...spouseSnapshot.val() };
              }
            }
          }
        }

        // Set spouse data if found
        if (spouseData) {
          setSpouse(spouseData);
        }

        // Fetch relationships
        const relationshipsSnapshot = await get(ref(database, `relationships/${memberId}`));
        const relationshipsData = relationshipsSnapshot.exists() ? relationshipsSnapshot.val() : null;
        setRelationships(relationshipsData);

        // Fetch parents if any
        if (relationshipsData?.parents) {
          const parentPromises = Object.keys(relationshipsData.parents).map(async (parentId) => {
            const parentSnapshot = await get(ref(database, `familyMembers/${parentId}`));
            return parentSnapshot.exists() ? { id: parentId, ...parentSnapshot.val() } : null;
          });
          const parentResults = await Promise.all(parentPromises);
          setParents(parentResults.filter((p): p is FamilyMember => p !== null));
        }

        // Fetch children if any
        if (relationshipsData?.children) {
          const childPromises = Object.keys(relationshipsData.children).map(async (childId) => {
            const childSnapshot = await get(ref(database, `familyMembers/${childId}`));
            return childSnapshot.exists() ? { id: childId, ...childSnapshot.val() } : null;
          });
          const childResults = await Promise.all(childPromises);
          setChildren(childResults.filter((c): c is FamilyMember => c !== null));
        }

        // Fetch siblings if any
        if (relationshipsData?.siblings) {
          const siblingPromises = Object.keys(relationshipsData.siblings).map(async (siblingId) => {
            const siblingSnapshot = await get(ref(database, `familyMembers/${siblingId}`));
            return siblingSnapshot.exists() ? { id: siblingId, ...siblingSnapshot.val() } : null;
          });
          const siblingResults = await Promise.all(siblingPromises);
          setSiblings(siblingResults.filter((s): s is FamilyMember => s !== null));
        }
      } catch (error) {
        console.error('Error fetching member details:', error);
        setError('Failed to load member details');
      } finally {
        setLoading(false);
      }
    };

    fetchMemberDetails();
  }, [memberId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="text-center text-red-500 p-4">
        {error || 'Member not found'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 rounded-lg shadow-xl">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-bold text-white">{member.name}</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
          <div className="space-y-2">
            <p className="text-gray-300">
              <span className="font-medium">Date of Birth:</span>{' '}
              {formatDate(member.dateOfBirth)}
            </p>
            <p className="text-gray-300">
              <span className="font-medium">Gender:</span>{' '}
              {member.gender.charAt(0).toUpperCase() + member.gender.slice(1)}
            </p>
            {member.education && (
              <p className="text-gray-300">
                <span className="font-medium">Education:</span> {member.education}
              </p>
            )}
            {member.occupation && (
              <p className="text-gray-300">
                <span className="font-medium">Occupation:</span> {member.occupation}
              </p>
            )}
          </div>
        </div>

        {/* Relationships */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white mb-4">Family Relationships</h2>
          
          {/* Spouse */}
          <div className="mb-4">
            <h3 className="text-lg font-medium text-white mb-2">Spouse</h3>
            {spouse ? (
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-indigo-400">{spouse.name}</p>
                <p className="text-sm text-gray-400">
                  {formatDate(spouse.dateOfBirth)}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">No spouse information</p>
            )}
          </div>

          {/* Parents */}
          <div className="mb-4">
            <h3 className="text-lg font-medium text-white mb-2">Parents</h3>
            {parents.length > 0 ? (
              <div className="space-y-2">
                {parents.map(parent => (
                  <div key={parent.id} className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-indigo-400">{parent.name}</p>
                    <p className="text-sm text-gray-400">
                      {formatDate(parent.dateOfBirth)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No parent information</p>
            )}
          </div>

          {/* Children */}
          <div className="mb-4">
            <h3 className="text-lg font-medium text-white mb-2">Children</h3>
            {children.length > 0 ? (
              <div className="space-y-2">
                {children.map(child => (
                  <div key={child.id} className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-indigo-400">{child.name}</p>
                    <p className="text-sm text-gray-400">
                      {formatDate(child.dateOfBirth)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No children</p>
            )}
          </div>

          {/* Siblings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Siblings</h3>
            {siblings.length > 0 ? (
              <div className="space-y-2">
                {siblings.map(sibling => (
                  <div key={sibling.id} className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-indigo-400">{sibling.name}</p>
                    <p className="text-sm text-gray-400">
                      {formatDate(sibling.dateOfBirth)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No siblings</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4 md:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {member.phone && (
              <p className="text-gray-300">
                <span className="font-medium">Phone:</span> {member.phone}
              </p>
            )}
            {member.email && (
              <p className="text-gray-300">
                <span className="font-medium">Email:</span> {member.email}
              </p>
            )}
            {member.address && (
              <p className="text-gray-300 md:col-span-2">
                <span className="font-medium">Address:</span> {member.address}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-medium text-white mb-2">Add Family Members</h3>
            
            {/* Spouse Button */}
            <button
              onClick={() => {
                // Store current member info in session storage
                sessionStorage.setItem('sourceMemberId', memberId || '');
                sessionStorage.setItem('relationshipType', 'spouse');
                navigate('/add-family-member');
              }}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center justify-center space-x-2"
              disabled={!!spouse}
            >
              <span>Update Spouse</span>
            </button>

            {/* Add Child Button */}
            <button
              onClick={() => {
                sessionStorage.setItem('sourceMemberId', memberId || '');
                sessionStorage.setItem('relationshipType', 'child');
                navigate('/add-family-member');
              }}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center space-x-2"
            >
              <span>Add Child</span>
            </button>

            {/* Add Parent Button */}
            <button
              onClick={() => {
                sessionStorage.setItem('sourceMemberId', memberId || '');
                sessionStorage.setItem('relationshipType', 'parent');
                navigate('/add-family-member');
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
              disabled={parents.length >= 2}
            >
              <span>Add Parent</span>
            </button>

            {/* Add Sibling Button */}
            <button
              onClick={() => {
                sessionStorage.setItem('sourceMemberId', memberId || '');
                sessionStorage.setItem('relationshipType', 'sibling');
                navigate('/add-family-member');
              }}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 flex items-center justify-center space-x-2"
            >
              <span>Add Sibling</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 