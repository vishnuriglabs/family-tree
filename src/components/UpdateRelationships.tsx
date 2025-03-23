import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { 
  getFamilyMembersByUser, 
  FamilyMemberData, 
  setParentForChild, 
  setSpouseRelationship, 
  addSecondParentToChild,
  updateFamilyMember,
  getFamilyMember,
  removeFamilyRelationship
} from '../utils/database';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';

export function UpdateRelationships() {
  const [members, setMembers] = useState<Record<string, FamilyMemberData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedMember1, setSelectedMember1] = useState<string>('');
  const [selectedMember2, setSelectedMember2] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<string>('parent-child');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadFamilyMembers();

    // Check if relationship data exists in sessionStorage
    const sourceMemberId = sessionStorage.getItem('sourceMemberId');
    const targetMemberId = sessionStorage.getItem('targetMemberId');
    const storedRelationshipType = sessionStorage.getItem('relationshipType');

    if (sourceMemberId && targetMemberId && storedRelationshipType) {
      console.log('Found relationship data in sessionStorage:', {
        source: sourceMemberId,
        target: targetMemberId,
        type: storedRelationshipType
      });
      
      setSelectedMember1(sourceMemberId);
      setSelectedMember2(targetMemberId);
      
      // Map the relationship type from the modal to the select options
      if (storedRelationshipType === 'child') {
        setRelationshipType('parent-child');
      } else if (storedRelationshipType === 'parent') {
        setRelationshipType('child-parent');
      } else if (storedRelationshipType === 'spouse') {
        setRelationshipType('spouse');
      } else if (storedRelationshipType === 'second-parent') {
        setRelationshipType('second-parent');
      }
      
      // Clear sessionStorage
      sessionStorage.removeItem('sourceMemberId');
      sessionStorage.removeItem('targetMemberId');
      sessionStorage.removeItem('relationshipType');
    }
  }, [currentUser]);

  const loadFamilyMembers = async () => {
    if (!currentUser) return;

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

  const handleUpdateRelationship = async () => {
    setError(null);
    setSuccess(null);
    
    if (!selectedMember1 || !selectedMember2) {
      setError('Please select both members to update relationship');
      return;
    }
    
    if (selectedMember1 === selectedMember2) {
      setError('Cannot create a relationship with the same person');
      return;
    }
    
    try {
      const member1 = members[selectedMember1];
      const member2 = members[selectedMember2];
      
      if (!member1 || !member2) {
        setError('One or both selected members not found');
        return;
      }
      
      switch (relationshipType) {
        case 'parent-child':
          // Member1 is parent of Member2
          await setParentForChild(selectedMember1, selectedMember2);
          setSuccess(`Set ${member1.name} as parent of ${member2.name}`);
          break;
          
        case 'child-parent':
          // Member1 is child of Member2
          await setParentForChild(selectedMember2, selectedMember1);
          setSuccess(`Set ${member1.name} as child of ${member2.name}`);
          break;
          
        case 'spouse':
          // Member1 and Member2 are spouses
          await setSpouseRelationship(selectedMember1, selectedMember2);
          setSuccess(`Set ${member1.name} and ${member2.name} as spouses`);
          break;
          
        case 'second-parent':
          // Member1 is second parent of Member2 (who already has a parent)
          if (!member2.parentId) {
            setError(`${member2.name} does not have a primary parent set`);
            return;
          }
          await addSecondParentToChild(selectedMember2, member2.parentId, selectedMember1);
          setSuccess(`Added ${member1.name} as second parent of ${member2.name}`);
          break;

        case 'sibling':
          // Create bidirectional sibling relationship
          await setSiblingRelationship(selectedMember1, selectedMember2);
          setSuccess(`Set ${member1.name} and ${member2.name} as siblings`);
          break;
          
        default:
          setError('Please select a valid relationship type');
          return;
      }
      
      // Reload data to show updated relationships
      await loadFamilyMembers();
      
    } catch (err) {
      console.error('Error updating relationship:', err);
      setError('Failed to update relationship. See console for details.');
    }
  };

  const handleRemoveRelationship = async () => {
    setError(null);
    setSuccess(null);

    if (!selectedMember1 || !selectedMember2) {
      setError('Please select both members to remove relationship');
      return;
    }

    try {
      const member1 = members[selectedMember1];
      const member2 = members[selectedMember2];
      
      if (!member1 || !member2) {
        setError('One or both selected members not found');
        return;
      }

      switch (relationshipType) {
        case 'parent-child':
          // Remove parent-child relationship
          await removeFamilyRelationship('parent-child', selectedMember1, selectedMember2);
          setSuccess(`Removed parent relationship between ${member1.name} and ${member2.name}`);
          break;
          
        case 'child-parent':
          // Remove child-parent relationship
          await removeFamilyRelationship('parent-child', selectedMember2, selectedMember1);
          setSuccess(`Removed parent relationship between ${member2.name} and ${member1.name}`);
          break;
          
        case 'spouse':
          // Remove spouse relationship
          await removeFamilyRelationship('spouse', selectedMember1, selectedMember2);
          setSuccess(`Removed spouse relationship between ${member1.name} and ${member2.name}`);
          break;
          
        case 'second-parent':
          // Remove second parent relationship
          await removeFamilyRelationship('second-parent', selectedMember1, selectedMember2);
          setSuccess(`Removed second parent relationship between ${member1.name} and ${member2.name}`);
          break;
          
        default:
          setError('Please select a valid relationship type');
          return;
      }
      
      // Reload data to show updated relationships
      await loadFamilyMembers();
    } catch (err) {
      console.error('Error removing relationship:', err);
      setError('Failed to remove relationship. See console for details.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-white">Loading family members...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header with back button */}
      <div className="mb-6 flex items-center">
        <Link 
          to="/dashboard" 
          className="mr-4 p-2 rounded-full hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </Link>
        <h1 className="text-2xl font-bold">Update Family Relationships</h1>
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-900/30 border border-green-800 text-green-300 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="text-xl font-medium text-white mb-2">How to Use This Page</h2>
          <p className="text-gray-300 mb-3">
            This page allows you to update or fix relationships between family members. To update a relationship:
          </p>
          <ol className="list-decimal list-inside text-gray-300 space-y-1 ml-4">
            <li>Select the first person</li>
            <li>Choose the relationship type between them</li>
            <li>Select the second person</li>
            <li>Click "Update Relationship" to create or modify the relationship</li>
            <li>Or click "Remove Relationship" to delete an existing relationship</li>
          </ol>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              First Person
            </label>
            <select
              value={selectedMember1}
              onChange={(e) => setSelectedMember1(e.target.value)}
              className="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a person</option>
              {Object.values(members).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Relationship Type
            </label>
            <select
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              className="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="parent-child">is parent of</option>
              <option value="child-parent">is child of</option>
              <option value="spouse">is spouse of</option>
              <option value="second-parent">is second parent of</option>
              <option value="sibling">is sibling of</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Second Person
            </label>
            <select
              value={selectedMember2}
              onChange={(e) => setSelectedMember2(e.target.value)}
              className="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a person</option>
              {Object.values(members).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleUpdateRelationship}
              disabled={!selectedMember1 || !selectedMember2}
              className="w-full px-4 py-3 border border-transparent rounded-md shadow-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update Relationship
            </button>
            
            <button
              onClick={handleRemoveRelationship}
              disabled={!selectedMember1 || !selectedMember2}
              className="w-full px-4 py-3 border border-transparent rounded-md shadow-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Relationship
            </button>
          </div>
        </div>
        
        {Object.keys(members).length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-medium text-white border-b border-gray-700 pb-2 mb-4">Current Relationships</h3>
            <div className="space-y-4 mt-4">
              {Object.values(members).map((member) => (
                <div key={member.id} className="border border-gray-700 rounded-md p-4 bg-gray-800/50">
                  <h4 className="font-medium text-white text-lg">{member.name}</h4>
                  <div className="mt-2 space-y-2">
                    {member.parentId && (
                      <p className="text-gray-300">
                        <span className="font-medium text-gray-400">Parent:</span> {members[member.parentId]?.name || 'Unknown'}
                      </p>
                    )}
                    
                    {member.spouseId && (
                      <p className="text-gray-300">
                        <span className="font-medium text-gray-400">Spouse:</span> {members[member.spouseId]?.name || 'Unknown'}
                      </p>
                    )}
                    
                    {member.children && member.children.length > 0 && (
                      <p className="text-gray-300">
                        <span className="font-medium text-gray-400">Children:</span>{' '}
                        {member.children.map(childId => members[childId]?.name || 'Unknown').join(', ')}
                      </p>
                    )}
                    
                    {!member.parentId && !member.spouseId && (!member.children || member.children.length === 0) && (
                      <p className="text-gray-500 italic">No relationships</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}