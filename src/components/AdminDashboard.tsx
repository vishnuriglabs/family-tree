import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Home, PlusCircle, FileText, UserCog, BarChart3, LogOut, 
  Search, ChevronLeft, ChevronRight, SlidersHorizontal, Bell, CalendarDays
} from 'lucide-react';
import { DarkModeToggle } from './DarkModeToggle';
import { motion } from 'framer-motion';

// Mock data - would be replaced with API calls in a real application
const mockStats = {
  totalUsers: 186,
  totalFamilies: 42,
  recentMembers: 8,
  pendingRequests: 3
};

const mockRecentActivity = [
  { id: 1, user: 'james.wilson@example.com', action: 'Added new member', family: 'Wilson', date: '2023-03-17 14:32' },
  { id: 2, user: 'emily.johnson@example.com', action: 'Updated family details', family: 'Johnson', date: '2023-03-17 11:15' },
  { id: 3, user: 'michael.smith@example.com', action: 'Deleted member', family: 'Smith', date: '2023-03-16 19:45' },
  { id: 4, user: 'sarah.brown@example.com', action: 'Added new member', family: 'Brown', date: '2023-03-16 16:22' },
  { id: 5, user: 'david.jones@example.com', action: 'Updated family details', family: 'Jones', date: '2023-03-16 10:08' },
  { id: 6, user: 'lisa.miller@example.com', action: 'Added new member', family: 'Miller', date: '2023-03-15 15:30' },
  { id: 7, user: 'robert.davis@example.com', action: 'Updated member details', family: 'Davis', date: '2023-03-15 13:17' },
  { id: 8, user: 'jennifer.garcia@example.com', action: 'Added new member', family: 'Garcia', date: '2023-03-15 09:42' },
];

const mockChartData = {
  genderRatio: { male: 85, female: 93, other: 8 },
  ageGroups: { 
    children: 14, 
    teens: 18, 
    youngAdults: 32, 
    adults: 87, 
    seniors: 35 
  },
  monthlyActivity: [12, 19, 15, 23, 28, 25, 21, 18, 24, 29, 22, 30]
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Pagination logic
  const itemsPerPage = 5;
  const filteredActivity = mockRecentActivity.filter(item => 
    (selectedFilter === 'all' || item.action.toLowerCase().includes(selectedFilter)) &&
    (item.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
     item.family.toLowerCase().includes(searchQuery.toLowerCase()) ||
     item.action.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const totalPages = Math.ceil(filteredActivity.length / itemsPerPage);
  const paginatedActivity = filteredActivity.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Action handlers
  const handleAddFamilyMember = () => {
    navigate('/add-family-member');
  };

  const handleViewFamilyDetails = () => {
    navigate('/family-details');
  };

  const handleLogout = () => {
    // In a real app, this would clear auth tokens, etc.
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
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/add-family-member');
                }}
                className="flex items-center p-3 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                <PlusCircle size={20} />
                {!isSidebarCollapsed && <span className="ml-3">Add Member</span>}
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
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
              A
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
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{mockStats.totalUsers}</p>
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
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{mockStats.totalFamilies}</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                    <PlusCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Recent Members</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{mockStats.recentMembers}</p>
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
                onClick={handleAddFamilyMember}
                className="flex items-center justify-center p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow"
              >
                <PlusCircle className="mr-2" />
                Add Family Member
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleViewFamilyDetails}
                className="flex items-center justify-center p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
              >
                <FileText className="mr-2" />
                View Family Details
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
                          onClick={() => navigate('/add-family-member')}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none"
                        >
                          {item.user}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.action}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <button
                          onClick={() => navigate('/add-family-member')}
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