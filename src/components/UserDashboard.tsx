import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, LogOut, Moon, Sun, Users, ChevronDown, Settings, Trees as Tree, Download, Share2 } from 'lucide-react';
import { FamilyTree } from './FamilyTree';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from './DarkModeProvider';

const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  familyName: "Doe Family",
  memberCount: 24,
  imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
};

const mockFamilyMembers = [
  {
    id: "1",
    name: "John Doe",
    birthDate: "1980-05-15",
    imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    parentIds: [],
    childrenIds: ["3", "4"],
    spouseIds: ["2"],
    bio: "Family patriarch, software engineer, and hobby photographer."
  },
  {
    id: "2",
    name: "Jane Doe",
    birthDate: "1982-03-20",
    imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    parentIds: [],
    childrenIds: ["3", "4"],
    spouseIds: ["1"],
    bio: "Family matriarch, pediatrician, and avid gardener."
  },
  {
    id: "3",
    name: "Emma Doe",
    birthDate: "2010-08-12",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    parentIds: ["1", "2"],
    childrenIds: [],
    spouseIds: [],
    bio: "High school student, loves art and music."
  },
  {
    id: "4",
    name: "Lucas Doe",
    birthDate: "2012-11-30",
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    parentIds: ["1", "2"],
    childrenIds: [],
    spouseIds: [],
    bio: "Middle school student, soccer enthusiast."
  }
];

export function UserDashboard() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log('Logging out...');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Tree className="h-8 w-8 text-green-600 dark:text-green-500" />
                <h1 className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                  Family Tree
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 
                           dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 focus:outline-none"
                  >
                    <img
                      src={mockUser.imageUrl}
                      alt={mockUser.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div className="hidden md:flex items-center space-x-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {mockUser.name}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg 
                                 shadow-lg py-1 ring-1 ring-black ring-opacity-5"
                      >
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 
                                   hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
                <div className="text-center">
                  <img
                    src={mockUser.imageUrl}
                    alt={mockUser.name}
                    className="h-24 w-24 rounded-full mx-auto object-cover"
                  />
                  <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                    {mockUser.name}
                  </h2>
                  <div className="mt-1 flex items-center justify-center space-x-1 text-gray-500 dark:text-gray-400">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{mockUser.email}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Family Name</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {mockUser.familyName}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Members</span>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {mockUser.memberCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center space-x-2 px-4 py-2 
                                     border border-gray-300 dark:border-gray-600 rounded-lg
                                     text-sm font-medium text-gray-700 dark:text-gray-300
                                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                    </button>
                    <button className="flex items-center justify-center space-x-2 px-4 py-2
                                     border border-gray-300 dark:border-gray-600 rounded-lg
                                     text-sm font-medium text-gray-700 dark:text-gray-300
                                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Family Tree */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Family Tree
                </h3>
                <FamilyTree members={mockFamilyMembers} />
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}