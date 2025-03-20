import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Home, FileText, UserCog, BarChart3, LogOut, 
  Search, ChevronLeft, ChevronRight, SlidersHorizontal, Bell, CalendarDays
} from 'lucide-react';
import { DarkModeToggle } from './DarkModeToggle';
import { motion } from 'framer-motion';
import { useAdminAuth } from '../utils/AdminAuthContext';
import { getDatabase, ref, get, query, orderByChild, limitToLast, push, set } from 'firebase/database';
import { database } from '../utils/firebase';
import { format } from 'date-fns';
import { ActivityType } from '../utils/activity';

// Database paths
const USERS_PATH = 'users';
const FAMILY_MEMBERS_PATH = 'familyMembers';

// Stats interface
interface DashboardStats {
  totalUsers: number;
  totalFamilies: number;
  recentMembers: number;
  loading: boolean;
}

// Mock chart data for UI demonstration
const mockChartData = {
  genderRatio: {
    male: 55,
    female: 42,
    other: 3
  },
  ageGroups: {
    children: 15,
    teens: 12,
    youngAdults: 28,
    adults: 35,
    seniors: 10
  }
};

// Replace mockRecentActivity with a proper interface and state
interface ActivityItem {
  id: string;
  userId: string;
  user: string;
  userEmail?: string;
  action: string;
  family?: string;
  details?: string;
  entityId?: string;
  timestamp: number;
  date: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { adminUser, adminLogout, isAdmin } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalFamilies: 0,
    recentMembers: 0,
    loading: true
  });
  
  // Add activities state to the component
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  
  // Add redirect if not logged in as admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin-login');
    }
  }, [isAdmin, navigate]);
  
  // Fetch real stats from Firebase
  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch users count
        const usersRef = ref(database, USERS_PATH);
        const usersSnapshot = await get(usersRef);
        const totalUsers = usersSnapshot.exists() ? Object.keys(usersSnapshot.val()).length : 0;
        
        // Fetch family members
        const membersRef = ref(database, FAMILY_MEMBERS_PATH);
        const membersSnapshot = await get(membersRef);
        const allMembers = membersSnapshot.exists() ? membersSnapshot.val() : {};
        
        // Count unique families (by createdBy field)
        const uniqueFamilies = new Set();
        let recentMembersCount = 0;
        const currentTime = Date.now();
        const oneWeekAgo = currentTime - (7 * 24 * 60 * 60 * 1000);
        
        Object.values(allMembers).forEach((member: any) => {
          if (member.createdBy) {
            uniqueFamilies.add(member.createdBy);
          }
          
          // Count members created in the last week
          if (member.createdAt && member.createdAt > oneWeekAgo) {
            recentMembersCount++;
          }
        });
        
        setStats({
          totalUsers,
          totalFamilies: uniqueFamilies.size,
          recentMembers: recentMembersCount,
          loading: false
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats(prev => ({...prev, loading: false}));
      }
    }
    
    fetchStats();
  }, []);
  
  // Add this as a new useEffect to fetch recent activities
  useEffect(() => {
    async function fetchRecentActivities() {
      setActivitiesLoading(true);
      try {
        const activitiesRef = query(
          ref(database, 'activities'),
          orderByChild('timestamp'),
          limitToLast(20)
        );
        
        const snapshot = await get(activitiesRef);
        const activitiesData: ActivityItem[] = [];
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          Object.keys(data).forEach(key => {
            const activity = data[key];
            activitiesData.push({
              id: key,
              userId: activity.userId,
              user: activity.user,
              userEmail: activity.userEmail || 'N/A',
              action: activity.action,
              family: activity.family || 'N/A',
              details: activity.details || '',
              entityId: activity.entityId || '',
              timestamp: activity.timestamp,
              date: formatDate(activity.timestamp)
            });
          });
        }
        
        // Sort activities by timestamp in descending order (newest first)
        activitiesData.sort((a, b) => b.timestamp - a.timestamp);
        setRecentActivities(activitiesData);
      } catch (error) {
        console.error("Error fetching recent activities:", error);
      } finally {
        setActivitiesLoading(false);
      }
    }
    
    fetchRecentActivities();
  }, []);

  // Add this utility function to format timestamps
  const formatDate = (timestamp: number): string => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Pagination logic
  const itemsPerPage = 5;
  const filteredActivity = recentActivities.filter(item => 
    (selectedFilter === 'all' || item.action.toLowerCase().includes(selectedFilter)) &&
    (item.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
     item.family.toLowerCase().includes(searchQuery.toLowerCase()) ||
     item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (item.userEmail && item.userEmail.toLowerCase().includes(searchQuery.toLowerCase())))
  );
  
  const totalPages = Math.ceil(filteredActivity.length / itemsPerPage);
  const paginatedActivity = filteredActivity.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Action handlers
  const handleViewFamilyDetails = () => {
    navigate('/family-details');
  };

  const handleLogout = () => {
    adminLogout();
    navigate('/admin-login');
  };

  // Simple chart rendering (in a real app, use a proper chart library like Chart.js or Recharts)
  const renderBar = (value: number, max: number, color: string) => {
    const percentage = (value / max) * 100;
    return (
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-full">
        <div 
          className={`h-4 ${color} rounded-full`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div 
        className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 flex flex-col`}
      >
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {!isSidebarCollapsed && <h2 className="text-xl font-bold text-gray-800 dark:text-white">Admin Panel</h2>}
          <button 
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <a 
                href="#" 
                className="flex items-center p-3 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                <Users size={20} />
                {!isSidebarCollapsed && <span className="ml-3">Dashboard</span>}
              </a>
            </li>
            <li>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/family-details');
                }}
                className="flex items-center p-3 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                <Home size={20} />
                {!isSidebarCollapsed && <span className="ml-3">Families</span>}
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="flex items-center p-3 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                <BarChart3 size={20} />
                {!isSidebarCollapsed && <span className="ml-3">Analytics</span>}
              </a>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full p-3 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 group"
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span className="ml-3">Logout</span>}
          </button>
          {!isSidebarCollapsed && <div className="mt-4">
            <DarkModeToggle />
          </div>}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <Bell size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                {adminUser?.username.charAt(0).toUpperCase() || 'A'}
              </div>
              {!isSidebarCollapsed && (
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{adminUser?.username || 'Admin'}</span>
              )}
            </div>
            {isSidebarCollapsed && <DarkModeToggle />}
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-6">
          {/* Overview Cards */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900">
                    <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                    {stats.loading ? (
                      <div className="h-8 w-16 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ) : (
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalUsers}</p>
                    )}
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                    <Home className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Families</p>
                    {stats.loading ? (
                      <div className="h-8 w-16 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ) : (
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalFamilies}</p>
                    )}
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                    <CalendarDays className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Recent Members</p>
                    {stats.loading ? (
                      <div className="h-8 w-16 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ) : (
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.recentMembers}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleViewFamilyDetails}
                className="flex items-center justify-center p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
              >
                <FileText className="mr-2" />
                View Family Details
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/update-relationships')}
                className="flex items-center justify-center p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow"
              >
                <UserCog className="mr-2" />
                Manage Relationships
              </motion.button>
            </div>
          </section>

          {/* Recent Activity Table */}
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Activity</h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <button className="p-2 rounded-lg border hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                  <SlidersHorizontal size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {activitiesLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No recent activities found
                </div>
              ) : (
                <>
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Family</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedActivity.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                            <button
                              onClick={() => navigate('/family-details')}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none"
                            >
                              {item.user}
                              {item.userEmail && (
                                <span className="block text-xs text-gray-500 dark:text-gray-400">{item.userEmail}</span>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.action}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            <button
                              onClick={() => navigate('/family-details')}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none"
                            >
                              {item.family}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination */}
                  <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredActivity.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredActivity.length}</span> results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-md border border-gray-200 dark:border-gray-700 disabled:opacity-50"
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
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-md border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Data Visualization */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Data Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gender Distribution */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Gender Distribution</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Male</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mockChartData.genderRatio.male}</span>
                    </div>
                    {renderBar(mockChartData.genderRatio.male, 100, 'bg-blue-500')}
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Female</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mockChartData.genderRatio.female}</span>
                    </div>
                    {renderBar(mockChartData.genderRatio.female, 100, 'bg-pink-500')}
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Other</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mockChartData.genderRatio.other}</span>
                    </div>
                    {renderBar(mockChartData.genderRatio.other, 100, 'bg-purple-500')}
                  </div>
                </div>
              </div>

              {/* Age Groups */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Age Groups</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Children (0-12)</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mockChartData.ageGroups.children}</span>
                    </div>
                    {renderBar(mockChartData.ageGroups.children, 100, 'bg-yellow-500')}
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Teens (13-19)</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mockChartData.ageGroups.teens}</span>
                    </div>
                    {renderBar(mockChartData.ageGroups.teens, 100, 'bg-green-500')}
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Young Adults (20-35)</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mockChartData.ageGroups.youngAdults}</span>
                    </div>
                    {renderBar(mockChartData.ageGroups.youngAdults, 100, 'bg-blue-500')}
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Adults (36-65)</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mockChartData.ageGroups.adults}</span>
                    </div>
                    {renderBar(mockChartData.ageGroups.adults, 100, 'bg-indigo-500')}
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Seniors (65+)</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mockChartData.ageGroups.seniors}</span>
                    </div>
                    {renderBar(mockChartData.ageGroups.seniors, 100, 'bg-red-500')}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 