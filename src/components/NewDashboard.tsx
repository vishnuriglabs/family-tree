import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, LogOut, Share2, Printer, UserPlus, Download, FileJson, FileSpreadsheet, X } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { getFamilyMembersByUser, getUserProfile } from '../utils/database';
import { useNavigate } from 'react-router-dom';
import { MemberDetailModal } from './MemberDetailModal';
import { generateFamilyTreeJSON, generateFamilyTreeCSV, downloadFile, findRootMember } from '../utils/treeExport';

// Family Tree Component
const FamilyTree = ({ members, onMemberClick }) => {
  if (!members || Object.keys(members).length === 0) {
    return <div className="text-center p-6 text-gray-400">No family members found</div>;
  }
  
  // Debug: Log photo URLs for debugging
  console.log("Family members with photos:", 
    Object.values(members).map(m => ({
      id: m.id,
      name: m.name, 
      hasPhoto: !!m.photoUrl,
      photoUrl: m.photoUrl ? (m.photoUrl.length > 50 ? m.photoUrl.substring(0, 50) + '...' : m.photoUrl) : 'none'
    }))
  );

  return (
    <div className="family-tree p-4">
      <div className="flex flex-wrap gap-6">
        {Object.entries(members).map(([id, member]) => (
          <div 
            key={id} 
            className="member-card cursor-pointer"
            onClick={() => onMemberClick(member.id)}
          >
            <div className="w-20 h-20 mx-auto mb-2 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
              {member.photoUrl ? (
                <img 
                  src={member.photoUrl} 
                  alt={member.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error(`Error loading image for ${member.name}:`, e);
                    e.target.style.display = 'none';
                    e.currentTarget.parentElement.classList.add('image-error');
                  }}
                />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div className="text-center">
              <h4 className="text-white text-sm font-medium">{member.name}</h4>
              {member.birthDate && (
                <p className="text-gray-400 text-xs">{member.birthDate}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export function NewDashboard() {
  const [members, setMembers] = useState({});
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberRelationships, setMemberRelationships] = useState({ spouse: null, children: [] });
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        // Load user profile
        const profile = await getUserProfile(currentUser.uid);
        if (profile) {
          setUserProfile(profile);
        } else {
          setUserProfile({
            displayName: currentUser.displayName || 'John Doe',
            email: currentUser.email || 'john.doe@example.com',
            familyName: 'Doe Family',
            memberCount: 0
          });
        }

        // Load family members
        const membersData = await getFamilyMembersByUser(currentUser.uid);
        setMembers(membersData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser, navigate]);

  const handleMemberClick = (memberId) => {
    const member = members[memberId];
    if (!member) return;
    
    setSelectedMember(member);
    
    // Find relationships for the selected member
    const relationships = {
      spouse: member.spouseId ? members[member.spouseId] : null,
      children: member.children 
        ? member.children
            .filter(childId => members[childId])
            .map(childId => members[childId])
        : []
    };
    
    setMemberRelationships(relationships);
  };

  const handleAddRelative = (memberId, relationType) => {
    // Store selected member and relationship in sessionStorage
    sessionStorage.setItem('selectedMemberId', memberId);
    sessionStorage.setItem('relationType', relationType);
    
    // Navigate to add family member page
    navigate('/add-family-member');
    
    // Close modal
    setSelectedMember(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    const rootMember = findRootMember(members);
    
    if (!rootMember) {
      alert('No root member found. Please add family members first.');
      return;
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const familyName = userProfile?.familyTreeName || rootMember.name.split(' ')[0] || 'Family';
    
    if (format === 'json') {
      const jsonData = generateFamilyTreeJSON(members);
      downloadFile(jsonData, `${familyName}_Tree_${timestamp}.json`, 'application/json');
    } else {
      const csvData = generateFamilyTreeCSV(members);
      downloadFile(csvData, `${familyName}_Tree_${timestamp}.csv`, 'text/csv');
    }
    
    setIsExportDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-xl font-medium">Family Tree</span>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2"
              >
                <img 
                  src={userProfile?.photoURL || 'https://via.placeholder.com/40?text=JD'} 
                  alt={userProfile?.displayName || 'User'} 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span>{userProfile?.displayName || 'John Doe'}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 bg-gray-800 rounded-lg p-6">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
              {userProfile?.photoURL ? (
                <img 
                  src={userProfile.photoURL} 
                  alt={userProfile.displayName} 
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>
            
            <h2 className="text-xl font-semibold text-white mb-1">
              {userProfile?.displayName || 'John Doe'}
            </h2>
            
            <div className="flex items-center text-gray-400 text-sm mb-4">
              <Mail className="w-4 h-4 mr-1" />
              <span>{userProfile?.email || 'john.doe@example.com'}</span>
            </div>
            
            <div className="w-full space-y-4">
              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Family Name</span>
                  <span className="font-medium text-white">
                    {userProfile?.familyTreeName || 'Doe Family'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <span className="text-gray-400">Members</span>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1 text-gray-400" />
                    <span className="font-medium text-white">
                      {Object.keys(members).length || 24}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-4 grid grid-cols-2 gap-3">
                <div className="relative">
                  <button 
                    onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md text-sm flex items-center justify-center"
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Export
                  </button>
                  
                  {isExportDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 bg-gray-800 rounded-lg shadow-lg z-30 w-48 py-2 border border-gray-700">
                      <div className="flex justify-between items-center px-3 pb-2 mb-1 border-b border-gray-700">
                        <h3 className="font-medium text-sm text-gray-300">Export Options</h3>
                        <button 
                          onClick={() => setIsExportDropdownOpen(false)}
                          className="text-gray-500 hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleExport('json')}
                        className="flex items-center w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-gray-700"
                      >
                        <FileJson className="w-4 h-4 mr-2 text-blue-400" />
                        JSON Format
                      </button>
                      
                      <button
                        onClick={() => handleExport('csv')}
                        className="flex items-center w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-gray-700"
                      >
                        <FileSpreadsheet className="w-4 h-4 mr-2 text-green-400" />
                        CSV Format
                      </button>
                    </div>
                  )}
                </div>
                
                <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md text-sm flex items-center justify-center">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </button>
              </div>
              
              <div className="border-t border-gray-700 pt-4">
                <Link
                  to="/update-relationships"
                  className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md text-sm"
                >
                  Manage Relationships
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Family Tree */}
        <div className="lg:col-span-4">
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Family Tree</h2>
            </div>
            
            {Object.keys(members).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <UserPlus className="h-12 w-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No family members yet</h3>
                <p className="text-gray-400 max-w-md mb-6">
                  Start building your family tree by adding yourself as the first member
                </p>
                <Link
                  to="/add-family-member"
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Member
                </Link>
              </div>
            ) : (
              <FamilyTree 
                members={members}
                onMemberClick={handleMemberClick}
              />
            )}
          </div>
        </div>
      </main>
      
      {/* Use our improved MemberDetailModal component */}
      {selectedMember && (
        <MemberDetailModal 
          member={selectedMember} 
          members={members}
          onClose={() => setSelectedMember(null)}
          onAddRelative={handleAddRelative}
        />
      )}
    </div>
  );
} 