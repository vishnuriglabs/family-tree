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
import { RecentActivities } from './RecentActivities';
import { DataInsights } from './DataInsights';

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
  const filteredActivity = recentActivities.filter(item => {
    // Skip items with missing required data
    if (!item || !item.action) return false;

    const searchLower = searchQuery.toLowerCase();
    const actionMatches = selectedFilter === 'all' || 
      (item.action && item.action.toLowerCase().includes(selectedFilter));
    
    const searchMatches = 
      (item.user && item.user.toLowerCase().includes(searchLower)) ||
      (item.family && item.family.toLowerCase().includes(searchLower)) ||
      (item.action && item.action.toLowerCase().includes(searchLower)) ||
      (item.userEmail && item.userEmail.toLowerCase().includes(searchLower));

    return actionMatches && searchMatches;
  });
  
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
        <div className="p-6 space-y-6">
          {/* Overview Cards */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                    <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
                    {stats.loading ? (
                      <div className="h-8 w-16 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ) : (
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalUsers}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <Home className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Families</h3>
                    {stats.loading ? (
                      <div className="h-8 w-16 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ) : (
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalFamilies}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Recent Members</h3>
                    {stats.loading ? (
                      <div className="h-8 w-16 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ) : (
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.recentMembers}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleViewFamilyDetails}
                className="flex items-center justify-center p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
              >
                <FileText className="mr-2" />
                View Family Records
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

          {/* Recent Activities Section */}
          <section>
            <RecentActivities />
          </section>

          {/* Data Insights */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Data Insights</h2>
            <div className="mb-8">
              <DataInsights />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 