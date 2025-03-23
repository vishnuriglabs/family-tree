import React, { useState, useEffect } from 'react';
import { database } from '../utils/firebase';
import { ref, get } from 'firebase/database';
import { DataInsights } from './DataInsights';
import { LineChart, BarChart3, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EducationStats {
  [key: string]: number;
}

interface RelationshipStats {
  spouses: number;
  parents: number;
  children: number;
  siblings: number;
}

interface MemberGrowth {
  date: string;
  count: number;
}

export function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [educationStats, setEducationStats] = useState<EducationStats>({});
  const [relationshipStats, setRelationshipStats] = useState<RelationshipStats>({
    spouses: 0,
    parents: 0,
    children: 0,
    siblings: 0
  });
  const [memberGrowth, setMemberGrowth] = useState<MemberGrowth[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        // Fetch family members
        const membersRef = ref(database, 'familyMembers');
        const membersSnapshot = await get(membersRef);

        if (membersSnapshot.exists()) {
          const membersData = membersSnapshot.val();

          // Calculate education statistics and member growth
          const eduStats: EducationStats = {};
          const growthData: { [key: string]: number } = {};
          let total = 0;

          Object.values(membersData).forEach((member: any) => {
            // Education stats
            if (member.education) {
              eduStats[member.education] = (eduStats[member.education] || 0) + 1;
            }

            // Member growth stats
            if (member.createdAt) {
              const date = new Date(member.createdAt).toISOString().split('T')[0];
              growthData[date] = (growthData[date] || 0) + 1;
            }
            total++;
          });

          // Convert growth data to array and sort by date
          const growthArray = Object.entries(growthData)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          setEducationStats(eduStats);
          setMemberGrowth(growthArray);
          setTotalMembers(total);

          // Fetch relationships
          const relationshipsRef = ref(database, 'relationships');
          const relationshipsSnapshot = await get(relationshipsRef);

          if (relationshipsSnapshot.exists()) {
            const relationshipsData = relationshipsSnapshot.val();
            const stats = {
              spouses: 0,
              parents: 0,
              children: 0,
              siblings: 0
            };

            Object.values(relationshipsData).forEach((rel: any) => {
              if (rel.spouse) stats.spouses++;
              if (rel.parents) stats.parents += Object.keys(rel.parents).length;
              if (rel.children) stats.children += Object.keys(rel.children).length;
              if (rel.siblings) stats.siblings += Object.keys(rel.siblings).length;
            });

            setRelationshipStats(stats);
          }
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} className="text-indigo-500" />
          </button>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Users className="text-indigo-500" />
              <div>
                <p className="text-sm text-gray-400">Total Members</p>
                <p className="text-xl font-bold text-white">{totalMembers}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-400">{error}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Member Growth Chart */}
          <div className="bg-gray-800 p-6 rounded-lg col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <LineChart className="text-indigo-500" />
              <h2 className="text-xl font-semibold text-white">Member Growth</h2>
            </div>
            <div className="h-64 relative">
              {memberGrowth.map((data, index) => {
                const height = `${(data.count / Math.max(...memberGrowth.map(d => d.count))) * 100}%`;
                return (
                  <div
                    key={data.date}
                    className="absolute bottom-0 bg-indigo-500 rounded-t-sm w-8 transition-all duration-300"
                    style={{
                      height,
                      left: `${(index / (memberGrowth.length - 1)) * 100}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
                      {data.count}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-4 text-sm text-gray-400">
              {memberGrowth.map(data => (
                <span key={data.date}>{new Date(data.date).toLocaleDateString()}</span>
              ))}
            </div>
          </div>
          {/* Data Insights Component */}
          <div className="col-span-2">
            <DataInsights />
          </div>

          {/* Education Statistics */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-6">Education Distribution</h2>
            <div className="space-y-4">
              {Object.entries(educationStats).map(([education, count]) => (
                <div key={education} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">{education}</span>
                    <span className="text-gray-300">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{
                        width: `${(count / Object.values(educationStats).reduce((a, b) => a + b, 0)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Relationship Statistics */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-6">Relationship Statistics</h2>
            <div className="space-y-4">
              {Object.entries(relationshipStats).map(([type, count]) => (
                <div key={type} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                    <span className="text-gray-300">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${(count / Object.values(relationshipStats).reduce((a, b) => a + b, 0)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}