import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, Plus, ChevronUp, ChevronDown,
  Edit2, Trash2, ArrowLeft
} from 'lucide-react';
import { getFamilyMembersByUser } from '../utils/database';
import { useAuth } from '../utils/AuthContext';

interface FamilyMember {
  id: string;
  name: string;
  familyName: string;
  relation: string;
  birthDate: string;
  gender: string;
  education: string;
  occupation: string;
  phone: string;
}

export function FamilyRecordsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof FamilyMember;
    direction: 'asc' | 'desc';
  }>({ key: 'name', direction: 'asc' });

  // Load family members from Firebase
  useEffect(() => {
    async function loadFamilyMembers() {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const familyData = await getFamilyMembersByUser(currentUser.uid);
        
        // Convert the object of family members to an array and add the id to each member
        const membersArray = Object.entries(familyData).map(([id, data]: [string, any]) => ({
          id,
          name: data.name || '',
          familyName: data.familyName || '',
          relation: data.relation || '',
          birthDate: data.birthDate || '',
          gender: data.gender || '',
          education: data.education || '',
          occupation: data.occupation || '',
          phone: data.phone || ''
        }));

        setMembers(membersArray);
      } catch (error) {
        console.error('Error loading family members:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFamilyMembers();
  }, [currentUser, navigate]);

  // Handle sorting
  const handleSort = (key: keyof FamilyMember) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter and sort members
  const filteredAndSortedMembers = members
    .filter(member => 
      Object.values(member).some(value => 
        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
    .sort((a, b) => {
      const aValue = a[sortConfig.key]?.toString().toLowerCase() || '';
      const bValue = b[sortConfig.key]?.toString().toLowerCase() || '';
      
      if (sortConfig.direction === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  // Render sort indicator
  const renderSortIndicator = (key: keyof FamilyMember) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Family Records</h1>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center px-4 py-2 text-sm bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, family, job..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-4 ml-4">
          <button className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 flex items-center">
            <SlidersHorizontal size={16} className="mr-2" />
            Filters
          </button>
          <button 
            onClick={() => navigate('/add-family-member')}
            className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add Member
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700">
                <th 
                  className="px-6 py-3 text-left cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    NAME {renderSortIndicator('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left cursor-pointer"
                  onClick={() => handleSort('familyName')}
                >
                  <div className="flex items-center">
                    FAMILY NAME {renderSortIndicator('familyName')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left cursor-pointer"
                  onClick={() => handleSort('relation')}
                >
                  <div className="flex items-center">
                    RELATION {renderSortIndicator('relation')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left cursor-pointer"
                  onClick={() => handleSort('birthDate')}
                >
                  <div className="flex items-center">
                    DOB {renderSortIndicator('birthDate')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left cursor-pointer"
                  onClick={() => handleSort('gender')}
                >
                  <div className="flex items-center">
                    GENDER {renderSortIndicator('gender')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left cursor-pointer"
                  onClick={() => handleSort('education')}
                >
                  <div className="flex items-center">
                    EDUCATION {renderSortIndicator('education')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left cursor-pointer"
                  onClick={() => handleSort('occupation')}
                >
                  <div className="flex items-center">
                    JOB {renderSortIndicator('occupation')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left">CONTACT</th>
                <th className="px-6 py-3 text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center">
                    Loading family records...
                  </td>
                </tr>
              ) : filteredAndSortedMembers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center">
                    No family members found
                  </td>
                </tr>
              ) : (
                filteredAndSortedMembers.map((member) => (
                  <tr key={member.id} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="px-6 py-4">{member.name}</td>
                    <td className="px-6 py-4">{member.familyName}</td>
                    <td className="px-6 py-4">{member.relation}</td>
                    <td className="px-6 py-4">{member.birthDate}</td>
                    <td className="px-6 py-4">{member.gender}</td>
                    <td className="px-6 py-4">{member.education}</td>
                    <td className="px-6 py-4">{member.occupation}</td>
                    <td className="px-6 py-4">{member.phone}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => navigate(`/edit-family-member/${member.id}`)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 