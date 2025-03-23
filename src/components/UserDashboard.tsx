import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, LogOut, Moon, Sun, ChevronDown,
  Trees, Download, Share2, Phone, GraduationCap,
  MapPin, Briefcase, UserPlus, Edit, RefreshCw, Printer,
  FileJson, FileSpreadsheet, X, Plus
} from 'lucide-react';
import { FamilyTreeContainer } from './FamilyTreeContainer';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDarkMode } from './DarkModeProvider';
import { useAuth } from '../utils/AuthContext';
import { getFamilyMembersByUser, getUserProfile, fixSelfReferences } from '../utils/database';
import { MemberDetailModal } from './MemberDetailModal';
import { generateFamilyTreeJSON, generateFamilyTreeCSV, downloadFile, findRootMember } from '../utils/treeExport';

// Family Tree Component
const FamilyTree = ({ members, onMemberClick }) => {
  if (!members || Object.keys(members).length === 0) {
    return <div className="text-center p-6 text-gray-400 dark:text-gray-400">No family members found</div>;
  }

  return (
    <div className="family-tree p-4">
      <div className="flex flex-wrap gap-6">
        {Object.entries(members).map(([id, member]) => (
          <div
            key={id}
            className="member-card cursor-pointer"
            onClick={() => onMemberClick(member.id || id)}
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

export function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDbWarning, setShowDbWarning] = useState(false);
  const [refreshingTree, setRefreshingTree] = useState(false);

  // New state variables from NewDashboard
  const [members, setMembers] = useState({});
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberRelationships, setMemberRelationships] = useState({ spouse: null, children: [] });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  useEffect(() => {
    if (location.search.includes('db_incomplete=true')) {
      setShowDbWarning(true);
    }
  }, [location]);

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
          // No profile found, create a basic one from auth data
          console.log("No user profile found, using auth data");
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || "User",
            familyTreeName: "My Family Tree",
            createdAt: Date.now()
          });
        }

        // Load family members
        const membersData = await getFamilyMembersByUser(currentUser.uid);
        console.log('Loaded members:', membersData);
        
        // Fix any self-referential relationships in the loaded members
        for (const memberId in membersData) {
          await fixSelfReferences(memberId);
        }
        
        // Reload members after fixing
        const fixedMembersData = await getFamilyMembersByUser(currentUser.uid);
        setMembers(fixedMembersData);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to basic user data from auth
        setUserProfile({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || "User"
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleRefreshTree = () => {
    setRefreshingTree(true);
    // Refresh data from database
    async function refreshData() {
      try {
        const membersData = await getFamilyMembersByUser(currentUser.uid);
        setMembers(membersData);
      } catch (error) {
        console.error('Error refreshing data:', error);
      } finally {
        setRefreshingTree(false);
      }
    }
    refreshData();
  };

  const handleMemberClick = (memberId) => {
    console.log('Member clicked:', memberId);
    const member = members[memberId];
    if (!member) {
      console.error('Member not found:', memberId);
      return;
    }

    // Ensure the member has an id field
    const memberWithId = {
      ...member,
      id: memberId // Explicitly set the id field
    };

    console.log('Setting selected member:', memberWithId);
    setSelectedMember(memberWithId);

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

  const handleUpdateRelationship = async (memberId, relatedMemberId, relationshipType) => {
    console.log(`Updating relationship: ${relationshipType} between ${memberId} and ${relatedMemberId}`);

    try {
      // Close the modal
      setSelectedMember(null);

      // Store relationship info in sessionStorage for the update page
      sessionStorage.setItem('sourceMemberId', memberId);
      sessionStorage.setItem('targetMemberId', relatedMemberId);
      sessionStorage.setItem('relationshipType', relationshipType);

      // Navigate to the relationship update page
      navigate('/update-relationships');
    } catch (error) {
      console.error('Error preparing relationship update:', error);
    }
  };

  const handleAddRelative = (memberId, relationType) => {
    console.log(`handleAddRelative called with memberId: ${memberId}, relationType: ${relationType}`);
    
    if (!memberId || !relationType) {
      console.error('Invalid parameters for adding relative', { memberId, relationType });
      return;
    }

    // Verify the member exists
    const member = members[memberId];
    if (!member) {
      console.error(`Member not found with ID: ${memberId}`);
      return;
    }

    try {
      // Store selected member and relationship in sessionStorage
      sessionStorage.setItem('selectedMemberId', memberId);
      sessionStorage.setItem('relationType', relationType);

      console.log(`Adding relative: ${relationType} for member ${memberId} (${member.name})`);
      console.log('About to navigate to /add-family-member');

      // Close modal first
      setSelectedMember(null);

      // Navigate to add family member page immediately
      navigate('/add-family-member', { 
        state: { 
          memberId, 
          relationType,
          memberName: member.name 
        }
      });
      
      console.log('Navigation to /add-family-member completed');
    } catch (error) {
      console.error('Error during navigation:', error);
    }
  };

  const handleExport = (format) => {
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
      {/* Navigation Bar */}
      <nav className="bg-gray-800 border-b border-gray-700 py-3 px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-full mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Trees className="h-8 w-8 text-green-500 mr-2" />
            <h1 className="text-xl font-bold text-white">Family Tree</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2"
              >
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                  {userProfile?.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt={userProfile.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <span className="text-white hidden md:inline-block">{userProfile?.displayName}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-700">
                  <div className="px-4 py-2 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">{userProfile?.displayName}</p>
                    <p className="text-xs text-gray-400">{userProfile?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
            <Link
              to="/fix-relationships"
              className="flex items-center space-x-2 text-gray-300 hover:text-white"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Fix Relationships</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
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
              {userProfile?.displayName || 'User'}
            </h2>

            <div className="flex items-center text-gray-400 text-sm mb-4">
              <Mail className="w-4 h-4 mr-1" />
              <span>{userProfile?.email || ''}</span>
            </div>

            <div className="w-full space-y-4">
              <div className="border-t border-gray-700 pt-4">
                <h3 className="font-medium text-white mb-3">Family Information</h3>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Family Name</span>
                  <span className="font-medium text-white">
                    {userProfile?.familyTreeName || 'Family Tree'}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <span className="text-gray-400">Members</span>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1 text-gray-400" />
                    <span className="font-medium text-white">
                      {Object.keys(members).length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4 grid grid-cols-1 gap-3">
                <button
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded flex items-center justify-center text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span>Export</span>
                </button>

                {isExportDropdownOpen && (
                  <div className="bg-gray-700 p-3 rounded-md mt-2">
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => handleExport('json')}
                        className="bg-gray-600 hover:bg-gray-500 text-white py-1 px-2 rounded text-xs"
                      >
                        JSON Format
                      </button>
                      <button
                        onClick={() => handleExport('csv')}
                        className="bg-gray-600 hover:bg-gray-500 text-white py-1 px-2 rounded text-xs"
                      >
                        CSV Format
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleRefreshTree}
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded flex items-center justify-center text-sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshingTree ? 'animate-spin' : ''}`} />
                  <span>Refresh Tree</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-4">
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Family Tree</h2>
              <button className="p-1 text-gray-400 hover:text-gray-200">
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            {Object.keys(members).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
                  <h2 className="text-2xl font-bold mb-4">Your family tree is empty</h2>
                  <p className="text-gray-400 mb-6">
                    Get started by adding your first family member who will be the root of your family tree.
                  </p>
                  <button
                    onClick={() => navigate('/add-family-member')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-5 rounded-md flex items-center justify-center mx-auto text-lg font-medium"
                  >
                    <Plus className="mr-2" />
                    Add Root Family Member
                  </button>
                </div>
              </div>
            ) : (
              <FamilyTree
                members={members}
                onMemberClick={handleMemberClick}
              />
            )}
          </div>
        </div>
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          members={members}
          onClose={() => setSelectedMember(null)}
          onAddRelative={handleAddRelative}
          onUpdateRelationship={handleUpdateRelationship}
        />
      )}
    </div>
  );
} 