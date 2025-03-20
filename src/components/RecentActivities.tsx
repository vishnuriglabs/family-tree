import React, { useState, useEffect } from 'react';
import { database } from '../utils/firebase';
import { ref, query, orderByChild, limitToLast, get } from 'firebase/database';
import { Search, SlidersHorizontal } from 'lucide-react';

interface Activity {
  id: string;
  action: string;
  timestamp: number;
  user: string;
  userEmail: string;
  userId: string;
  details?: string;
  entityId?: string;
  family?: string;
}

export function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchActivities() {
      setLoading(true);
      setError(null);
      try {
        const activitiesRef = ref(database, 'activities');
        const activitiesQuery = query(
          activitiesRef,
          orderByChild('timestamp'),
          limitToLast(20)
        );
        
        const snapshot = await get(activitiesQuery);
        if (snapshot.exists()) {
          const activitiesData = snapshot.val();
          const formattedActivities: Activity[] = Object.entries(activitiesData)
            .map(([id, data]: [string, any]) => ({
              id,
              action: data.action || '',
              timestamp: data.timestamp || Date.now(),
              user: data.user || 'Unknown User',
              userEmail: data.userEmail || '',
              userId: data.userId || '',
              details: data.details || '',
              entityId: data.entityId || '',
              family: data.family || ''
            }))
            .sort((a, b) => b.timestamp - a.timestamp);
          
          setActivities(formattedActivities);
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setError('Failed to load activities. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  // Filter activities based on search query
  const filteredActivities = activities.filter(activity =>
    activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (activity.details && activity.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (activity.family && activity.family.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get activity icon based on action type
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'User Signup':
        return '👤';
      case 'User Login':
        return '🔑';
      case 'Added Family Member':
        return '👨‍👩‍👧‍👦';
      default:
        return '📝';
    }
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>
          <button className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700">
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-400">
          {error}
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No recent activities found
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="bg-gray-800 p-4 rounded-lg border border-gray-700"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-start">
                  <span className="mr-3 text-xl">{getActivityIcon(activity.action)}</span>
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium text-indigo-400">{activity.user}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-gray-400">{activity.action}</span>
                    </div>
                    {activity.details && (
                      <p className="text-sm text-gray-300 mt-1">{activity.details}</p>
                    )}
                    {activity.family && (
                      <p className="text-sm text-gray-400 mt-1">Family: {activity.family}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 