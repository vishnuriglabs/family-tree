import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Trash2, ChevronLeft, ChevronRight, 
  SlidersHorizontal, ArrowUpDown
} from 'lucide-react';
import { database } from '../utils/firebase';
import { ref, get, remove, push } from 'firebase/database';
import { motion } from 'framer-motion';
import { useAuth } from '../utils/AuthContext';
import { logActivity, ActivityType } from '../utils/activity';

interface FamilyMember {
  id: string;
  name: string;
  familyName: string;
  relation: string;
  dob: string;
  birthDate: string;
  gender: string;
  education: string;
  job: string;
  phone: string;
  createdBy?: string;
  createdByName?: string;
}

export function FamilyDetailsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedRelation, setSelectedRelation] = useState('all');

  // Fetch family members from Firebase
  useEffect(() => {
    async function fetchFamilyMembers() {
      setLoading(true);
      try {
        const membersRef = ref(database, 'familyMembers');
        const snapshot = await get(membersRef);
        
        if (snapshot.exists()) {
          const membersData = snapshot.val();
          const formattedMembers: FamilyMember[] = await Promise.all(
            Object.entries(membersData).map(async ([id, data]: [string, any]) => {
              // Get creator's name if available
              let creatorName = 'Unknown User';
              if (data.createdBy) {
                const userRef = ref(database, `users/${data.createdBy}`);
                const userSnapshot = await get(userRef);
                if (userSnapshot.exists()) {
                  const userData = userSnapshot.val();
                  creatorName = userData.displayName || userData.email || 'Unknown User';
                }
              }
              
              return {
                id,
                name: data.name || '',
                familyName: data.familyName || '',
                relation: data.relation || '',
                dob: data.dob || '',
                birthDate: data.birthDate || '',
                gender: data.gender || '',
                education: data.education || '',
                job: data.job || data.occupation || '',
                phone: data.phone || data.contactNumber || '',
                createdBy: data.createdBy || '',
                createdByName: creatorName
              };
            })
          );
          console.log('Formatted Members:', formattedMembers);
          setMembers(formattedMembers);
        }
      } catch (error) {
        console.error('Error fetching family members:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFamilyMembers();
  }, []);

  // Filter and sort logic
  const filteredMembers = members.filter((member) => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.familyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.job.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.education.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGender = selectedGender === 'all' || member.gender.toLowerCase() === selectedGender.toLowerCase();
    const matchesRelation = selectedRelation === 'all' || member.relation.toLowerCase() === selectedRelation.toLowerCase();
    
    return matchesSearch && matchesGender && matchesRelation;
  });

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortDirection === 'asc') {
      return a[sortField] > b[sortField] ? 1 : -1;
    } else {
      return a[sortField] < b[sortField] ? 1 : -1;
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedMembers.length / itemsPerPage);
  const paginatedMembers = sortedMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Action handlers
  const handleAddMember = () => {
    // Navigate to the add family member page
    navigate('/admin-dashboard/add-member');
  };

  const handleDeleteMember = async (id: string) => {
    if (!currentUser) {
      alert('You must be logged in to delete members');
      return;
    }

    const isConfirmed = window.confirm('Are you sure you want to delete this family member? This action cannot be undone.');
    
    if (!isConfirmed) {
      return;
    }

    try {
      const deletedMember = members.find(m => m.id === id);
      
      const memberRef = ref(database, `familyMembers/${id}`);
      await remove(memberRef);

      setMembers(prevMembers => prevMembers.filter(member => member.id !== id));

      // Log the deletion activity with user information
      const newActivity = {
        type: ActivityType.MEMBER_DELETED,
        timestamp: Date.now(),
        details: `Deleted family member: ${deletedMember?.name}`,
        memberId: id,
        memberName: deletedMember?.name,
        action: 'delete',
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email
      };
      
      await push(ref(database, 'activities'), newActivity);
      alert('Member deleted successfully');
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member. Please try again.');
    }
  };

  // Format date from yyyy-mm-dd to mm/dd/yyyy
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Invalid Date') return 'N/A';
    
    try {
      // Check if the date is in the format YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        if (!isNaN(date.getTime())) {
          return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }).format(date);
        }
      }
      
      return dateString; // Return original string if it doesn't match expected format
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/admin-dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="mr-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Family Details</h1>
          <button
            onClick={handleAddMember}
            className="flex items-center px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <Plus size={20} className="mr-2" />
            Add Member
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, family, job..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button className="ml-4 p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700">
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center">
                      Name
                      <ArrowUpDown size={14} className="ml-1" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('familyName')}>
                    <div className="flex items-center">
                      Family Name
                      <ArrowUpDown size={14} className="ml-1" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('relation')}>
                    <div className="flex items-center">
                      Relation
                      <ArrowUpDown size={14} className="ml-1" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('dob')}>
                    <div className="flex items-center">
                      DOB
                      <ArrowUpDown size={14} className="ml-1" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('gender')}>
                    <div className="flex items-center">
                      Gender
                      <ArrowUpDown size={14} className="ml-1" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('education')}>
                    <div className="flex items-center">
                      Education
                      <ArrowUpDown size={14} className="ml-1" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('job')}>
                    <div className="flex items-center">
                      Job
                      <ArrowUpDown size={14} className="ml-1" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {paginatedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{member.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{member.familyName || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{member.relation || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatDate(member.birthDate) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{member.gender || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{member.education || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{member.job || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{member.createdByName || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{member.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex justify-center">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-1 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-700">
              <div className="text-sm text-gray-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredMembers.length)} of{' '}
                {filteredMembers.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-gray-700 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`w-8 h-8 rounded-md ${
                      currentPage === index + 1
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-300 border border-gray-700'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-gray-700 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 