import React, { useState, useEffect } from 'react';
import { database } from '../utils/firebase';
import { ref, get, update, push } from 'firebase/database';
import { useAuth } from '../utils/AuthContext';
import { useAdminAuth } from '../utils/AdminAuthContext';
import { useNavigate } from 'react-router-dom';

interface FamilyMember {
  id: string;
  name: string;
  gender: string;
  spouseId?: string;
  parentId?: string;
  children?: string[];
}

export function FixRelationships() {
  const { currentUser } = useAuth();
  const { isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMember1, setSelectedMember1] = useState<string>('');
  const [selectedMember2, setSelectedMember2] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<string>('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!currentUser && !isAdmin) {
        navigate('/login');
        return;
      }
      
      try {
        const membersRef = ref(database, 'familyMembers');
        const snapshot = await get(membersRef);
        
        if (snapshot.exists()) {
          const membersData: FamilyMember[] = [];
          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            membersData.push({
              id: childSnapshot.key || '',
              name: data.name || '',
              gender: data.gender || '',
              spouseId: data.spouseId || null,
              parentId: data.parentId || null,
              children: data.children || []
            });
          });
          setMembers(membersData);
        }
      } catch (err) {
        console.error('Error fetching members:', err);
        setError('Failed to load family members');
      }
    };

    fetchMembers();
  }, [currentUser, isAdmin, navigate]);

  const handleFixRelationship = async () => {
    if (!selectedMember1 || !selectedMember2 || !relationshipType) {
      setError('Please select both members and a relationship type');
      return;
    }

    if (selectedMember1 === selectedMember2) {
      setError('Cannot create a relationship with the same person');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const updates: { [key: string]: any } = {};
      const member1 = members.find(m => m.id === selectedMember1);
      const member2 = members.find(m => m.id === selectedMember2);

      if (!member1 || !member2) {
        setError('One or both members not found');
        return;
      }

      switch (relationshipType) {
        case 'spouse':
          // Update both members' spouseId fields
          updates[`/familyMembers/${selectedMember1}/spouseId`] = selectedMember2;
          updates[`/familyMembers/${selectedMember2}/spouseId`] = selectedMember1;
          
          // Update relationships node
          updates[`/relationships/${selectedMember1}/spouse`] = selectedMember2;
          updates[`/relationships/${selectedMember2}/spouse`] = selectedMember1;
          
          // Set relation field for both members
          updates[`/familyMembers/${selectedMember1}/relation`] = 'spouse';
          updates[`/familyMembers/${selectedMember2}/relation`] = 'spouse';
          break;

        case 'parent-child':
          // Set up parent-child relationship
          updates[`/relationships/${selectedMember1}/children/${selectedMember2}`] = true;
          updates[`/relationships/${selectedMember2}/parents/${selectedMember1}`] = true;
          updates[`/familyMembers/${selectedMember2}/parentId`] = selectedMember1;
          
          // Update children array for parent
          const parentChildren = member1.children || [];
          if (!parentChildren.includes(selectedMember2)) {
            parentChildren.push(selectedMember2);
            updates[`/familyMembers/${selectedMember1}/children`] = parentChildren;
          }
          break;

        case 'child-parent':
          // Set up child-parent relationship
          updates[`/relationships/${selectedMember2}/children/${selectedMember1}`] = true;
          updates[`/relationships/${selectedMember1}/parents/${selectedMember2}`] = true;
          updates[`/familyMembers/${selectedMember1}/parentId`] = selectedMember2;
          
          // Update children array for parent
          const parentChildren2 = member2.children || [];
          if (!parentChildren2.includes(selectedMember1)) {
            parentChildren2.push(selectedMember1);
            updates[`/familyMembers/${selectedMember2}/children`] = parentChildren2;
          }
          break;

        case 'sibling':
          // Create bidirectional sibling relationship
          updates[`/relationships/${selectedMember1}/siblings/${selectedMember2}`] = true;
          updates[`/relationships/${selectedMember2}/siblings/${selectedMember1}`] = true;
          break;
      }

      // Add activity log
      const activityRef = push(ref(database, 'activities'));
      updates[`/activities/${activityRef.key}`] = {
        type: 'RELATIONSHIP_FIXED',
        timestamp: Date.now(),
        userId: isAdmin ? 'admin' : currentUser?.uid,
        details: `Fixed ${relationshipType} relationship between ${member1.name} and ${member2.name}`,
        memberId1: selectedMember1,
        memberId2: selectedMember2,
        relationshipType
      };

      // Apply all updates atomically
      await update(ref(database), updates);
      setResult(`Successfully fixed ${relationshipType} relationship between ${member1.name} and ${member2.name}`);
      
      // Refresh members list
      const membersRef = ref(database, 'familyMembers');
      const snapshot = await get(membersRef);
      if (snapshot.exists()) {
        const membersData: FamilyMember[] = [];
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          membersData.push({
            id: childSnapshot.key || '',
            name: data.name || '',
            gender: data.gender || '',
            spouseId: data.spouseId || null,
            parentId: data.parentId || null,
            children: data.children || []
          });
        });
        setMembers(membersData);
      }
    } catch (err) {
      console.error('Error fixing relationship:', err);
      setError('Failed to fix relationship. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Fix Family Relationships</h1>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Member Selection Panel */}
          <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-6">Select Family Members</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">First Member</label>
                <select
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  value={selectedMember1}
                  onChange={(e) => setSelectedMember1(e.target.value)}
                >
                  <option value="">Select a member...</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Second Member</label>
                <select
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  value={selectedMember2}
                  onChange={(e) => setSelectedMember2(e.target.value)}
                >
                  <option value="">Select a member...</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Relationship Type</label>
                <select
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                >
                  <option value="">Select relationship type...</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent-child">Parent → Child</option>
                  <option value="child-parent">Child → Parent</option>
                  <option value="sibling">Sibling</option>
                </select>
              </div>

              <button
                onClick={handleFixRelationship}
                disabled={loading || !selectedMember1 || !selectedMember2 || !relationshipType}
                className="w-full px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Fixing Relationship...
                  </span>
                ) : (
                  'Fix Relationship'
                )}
              </button>

              {/* Status Messages */}
              {result && (
                <div className="mt-4 p-4 bg-green-900 border border-green-700 text-green-100 rounded-lg">
                  <p className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    {result}
                  </p>
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-4 bg-red-900 border border-red-700 text-red-100 rounded-lg">
                  <p className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                    {error}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Current Relationships Panel */}
          <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-6">Current Relationships</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {members.map((member) => (
                <div key={member.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors">
                  <h3 className="text-lg font-medium text-white mb-2">{member.name}</h3>
                  <div className="space-y-2">
                    {member.spouseId && (
                      <p className="text-gray-300 flex items-center">
                        <span className="font-medium text-indigo-400 mr-2">Spouse:</span>
                        {members.find(m => m.id === member.spouseId)?.name || 'Unknown'}
                      </p>
                    )}
                    {member.parentId && (
                      <p className="text-gray-300 flex items-center">
                        <span className="font-medium text-indigo-400 mr-2">Parent:</span>
                        {members.find(m => m.id === member.parentId)?.name || 'Unknown'}
                      </p>
                    )}
                    {member.children && member.children.length > 0 && (
                      <p className="text-gray-300">
                        <span className="font-medium text-indigo-400 mr-2">Children:</span>
                        {member.children
                          .map(childId => members.find(m => m.id === childId)?.name || 'Unknown')
                          .join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 