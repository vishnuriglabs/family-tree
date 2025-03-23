import React, { useState, useEffect } from 'react';
import { database } from '../utils/firebase';
import { ref, push, get, update } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
}

export function AddFamilyMember() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [existingMembers, setExistingMembers] = useState<FamilyMember[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'male',
    education: '',
    occupation: '',
    phone: '',
    email: '',
    address: '',
    connectToExisting: false,
    selectedMemberId: '',
    relationshipType: ''
  });

  useEffect(() => {
    // Fetch existing family members
    const fetchFamilyMembers = async () => {
      if (!currentUser) return;
      const familyRef = ref(database, 'familyMembers');
      const snapshot = await get(familyRef);
      if (snapshot.exists()) {
        const members: FamilyMember[] = [];
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          members.push({
            id: childSnapshot.key || '',
            name: data.name || '',
            relation: data.relation || ''
          });
        });
        setExistingMembers(members);

        // Check if we're coming from member details page
        const sourceMemberId = sessionStorage.getItem('sourceMemberId');
        const relationshipType = sessionStorage.getItem('relationshipType');

        if (sourceMemberId && relationshipType) {
          // Pre-select the existing member and relationship type
          setFormData(prev => ({
            ...prev,
            connectToExisting: true,
            selectedMemberId: sourceMemberId,
            relationshipType: relationshipType
          }));
        }
      }
    };

    fetchFamilyMembers();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const familyMembersRef = ref(database, 'familyMembers');
      
      // Create new family member
      const newMemberData = {
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        education: formData.education || '',
        occupation: formData.occupation || '',
        phone: formData.phone || '',
        email: formData.email || '',
        address: formData.address || '',
        createdBy: currentUser.uid,
        createdAt: Date.now(),
        relation: formData.connectToExisting ? formData.relationshipType : null,
        spouseId: null // Initialize as null, will be updated if spouse relationship
      };

      // Push new member to get their ID
      const newMemberRef = await push(familyMembersRef);
      const newMemberId = newMemberRef.key;

      const updates: { [key: string]: any } = {};
      updates[`/familyMembers/${newMemberId}`] = newMemberData;

      // If connecting to existing member
      if (formData.connectToExisting && formData.selectedMemberId && formData.relationshipType) {
        // Get the selected member's data
        const selectedMemberSnapshot = await get(ref(database, `familyMembers/${formData.selectedMemberId}`));
        const selectedMemberData = selectedMemberSnapshot.val();

        // Update relationships based on type
        switch (formData.relationshipType) {
          case 'spouse':
            // Update both members' spouseId fields
            updates[`/familyMembers/${newMemberId}/spouseId`] = formData.selectedMemberId;
            updates[`/familyMembers/${formData.selectedMemberId}/spouseId`] = newMemberId;
            
            // Update relationships node with bidirectional spouse connection
            updates[`/relationships/${newMemberId}/spouse`] = formData.selectedMemberId;
            updates[`/relationships/${formData.selectedMemberId}/spouse`] = newMemberId;
            
            // Set relation field for both members
            updates[`/familyMembers/${newMemberId}/relation`] = 'spouse';
            updates[`/familyMembers/${formData.selectedMemberId}/relation`] = 'spouse';
            
            // Log activity
            const spouseActivityRef = push(ref(database, 'activities'));
            updates[`/activities/${spouseActivityRef.key}`] = {
              type: 'SPOUSE_ADDED',
              timestamp: Date.now(),
              userId: currentUser.uid,
              details: `Added spouse relationship between ${formData.name} and ${selectedMemberData.name}`,
              memberId1: newMemberId,
              memberId2: formData.selectedMemberId
            };
            break;

          case 'child':
            // Set up parent-child relationship
            updates[`/relationships/${formData.selectedMemberId}/children/${newMemberId}`] = true;
            updates[`/relationships/${newMemberId}/parents/${formData.selectedMemberId}`] = true;
            updates[`/familyMembers/${newMemberId}/parentId`] = formData.selectedMemberId;
            break;

          case 'parent':
            // Set up child-parent relationship
            updates[`/relationships/${newMemberId}/children/${formData.selectedMemberId}`] = true;
            updates[`/relationships/${formData.selectedMemberId}/parents/${newMemberId}`] = true;
            updates[`/familyMembers/${formData.selectedMemberId}/parentId`] = newMemberId;
            break;

          case 'sibling':
            // Create bidirectional sibling relationship
            updates[`/relationships/${newMemberId}/siblings/${formData.selectedMemberId}`] = true;
            updates[`/relationships/${formData.selectedMemberId}/siblings/${newMemberId}`] = true;
            break;
        }

        // Log general relationship activity
        const activityRef = push(ref(database, 'activities'));
        updates[`/activities/${activityRef.key}`] = {
          type: 'RELATIONSHIP_ADDED',
          timestamp: Date.now(),
          userId: currentUser.uid,
          details: `Added ${formData.relationshipType} relationship between ${formData.name} and ${selectedMemberData.name}`,
          memberId1: newMemberId,
          memberId2: formData.selectedMemberId,
          relationshipType: formData.relationshipType
        };
      }

      // Apply all updates atomically
      await update(ref(database), updates);

      // Navigate back
      navigate(-1);
    } catch (error) {
      console.error('Error adding family member:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Add Family Member</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Date of Birth</label>
            <input
              type="date"
              required
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Gender</label>
            <select
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Connect to Existing Member */}
        <div className="space-y-4 border-t border-gray-600 pt-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="connectToExisting"
              className="rounded bg-gray-700 border-gray-600 text-indigo-500"
              checked={formData.connectToExisting}
              onChange={(e) => setFormData({ ...formData, connectToExisting: e.target.checked })}
            />
            <label htmlFor="connectToExisting" className="ml-2 text-sm text-gray-300">
              Connect this person to an existing family member
            </label>
          </div>

          {formData.connectToExisting && (
            <div className="space-y-4 pl-6">
              <div>
                <label className="block text-sm font-medium text-gray-300">Select Existing Family Member</label>
                <select
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                  value={formData.selectedMemberId}
                  onChange={(e) => setFormData({ ...formData, selectedMemberId: e.target.value })}
                  required={formData.connectToExisting}
                >
                  <option value="">Select a member...</option>
                  {existingMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Relationship Type</label>
                <select
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                  value={formData.relationshipType}
                  onChange={(e) => setFormData({ ...formData, relationshipType: e.target.value })}
                  required={formData.connectToExisting}
                >
                  <option value="">Select relationship...</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="sibling">Sibling</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-4 border-t border-gray-600 pt-4">
          <h3 className="text-lg font-medium text-white">Contact Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300">Education</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Occupation</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Phone</label>
            <input
              type="tel"
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Address</label>
            <textarea
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Family Member'}
          </button>
        </div>
      </form>
    </div>
  );
} 