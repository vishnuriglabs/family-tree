import React, { useState, useEffect } from 'react';
import { database } from '../utils/firebase';
import { ref, get } from 'firebase/database';

interface FamilyMember {
  id: string;
  dateOfBirth: string;
  gender: string;
}

interface AgeGroups {
  children: number;    // 0-12
  teens: number;       // 13-19
  youngAdults: number; // 20-35
  adults: number;      // 36-65
  seniors: number;     // 65+
}

interface GenderDistribution {
  male: number;
  female: number;
  other: number;
}

export function DataInsights() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ageGroups, setAgeGroups] = useState<AgeGroups>({
    children: 0,
    teens: 0,
    youngAdults: 0,
    adults: 0,
    seniors: 0
  });
  const [genderDistribution, setGenderDistribution] = useState<GenderDistribution>({
    male: 0,
    female: 0,
    other: 0
  });

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Determine age group from age
  const getAgeGroup = (age: number): keyof AgeGroups => {
    if (age <= 12) return 'children';
    if (age <= 19) return 'teens';
    if (age <= 35) return 'youngAdults';
    if (age <= 65) return 'adults';
    return 'seniors';
  };

  useEffect(() => {
    async function fetchFamilyData() {
      setLoading(true);
      setError(null);
      try {
        const familyMembersRef = ref(database, 'familyMembers');
        const snapshot = await get(familyMembersRef);

        if (snapshot.exists()) {
          const familyData = snapshot.val();
          const members: FamilyMember[] = Object.values(familyData);

          // Reset counters
          const newAgeGroups: AgeGroups = {
            children: 0,
            teens: 0,
            youngAdults: 0,
            adults: 0,
            seniors: 0
          };

          const newGenderDistribution: GenderDistribution = {
            male: 0,
            female: 0,
            other: 0
          };

          // Calculate distributions
          members.forEach(member => {
            // Calculate age group
            const age = calculateAge(member.dateOfBirth);
            const ageGroup = getAgeGroup(age);
            newAgeGroups[ageGroup]++;

            // Calculate gender distribution
            const gender = member.gender.toLowerCase();
            if (gender === 'male') newGenderDistribution.male++;
            else if (gender === 'female') newGenderDistribution.female++;
            else newGenderDistribution.other++;
          });

          setAgeGroups(newAgeGroups);
          setGenderDistribution(newGenderDistribution);
        }
      } catch (error) {
        console.error('Error fetching family data:', error);
        setError('Failed to load family data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchFamilyData();
  }, []);

  const getPercentage = (value: number, total: number): number => {
    return total === 0 ? 0 : Math.round((value / total) * 100);
  };

  const totalMembers = Object.values(genderDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Data Insights</h2>
        <div className="flex space-x-2">
          <div className="bg-gray-800 px-4 py-2 rounded-lg">
            <p className="text-sm text-gray-400">Total Members</p>
            <p className="text-xl font-bold text-white">{totalMembers}</p>
          </div>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Age Distribution Chart */}
          <div className="bg-gray-800 p-6 rounded-lg col-span-2 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">Age Distribution</h3>
            <div className="relative h-64">
              {Object.entries(ageGroups).map(([group, count], index) => {
                const maxCount = Math.max(...Object.values(ageGroups));
                const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const colors = {
                  children: 'bg-yellow-500',
                  teens: 'bg-green-500',
                  youngAdults: 'bg-blue-500',
                  adults: 'bg-purple-500',
                  seniors: 'bg-red-500'
                };
                return (
                  <div
                    key={group}
                    className="absolute bottom-0 transition-all duration-300"
                    style={{
                      height: `${height}%`,
                      width: '15%',
                      left: `${(index * 20) + 2.5}%`,
                    }}
                  >
                    <div className={`h-full ${colors[group]} rounded-t-lg relative group hover:opacity-90`}>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        {count} members
                      </div>
                    </div>
                    <div className="text-center mt-2 text-sm text-gray-400">
                      {group.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Gender Distribution */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-white mb-4">Gender Distribution</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Male</span>
                  <span className="text-gray-300">{genderDistribution.male}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${getPercentage(genderDistribution.male, totalMembers)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Female</span>
                  <span className="text-gray-300">{genderDistribution.female}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-pink-500 rounded-full"
                    style={{ width: `${getPercentage(genderDistribution.female, totalMembers)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Other</span>
                  <span className="text-gray-300">{genderDistribution.other}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${getPercentage(genderDistribution.other, totalMembers)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Age Groups */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-white mb-4">Age Groups</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Children (0-12)</span>
                  <span className="text-gray-300">{ageGroups.children}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${getPercentage(ageGroups.children, totalMembers)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Teens (13-19)</span>
                  <span className="text-gray-300">{ageGroups.teens}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${getPercentage(ageGroups.teens, totalMembers)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Young Adults (20-35)</span>
                  <span className="text-gray-300">{ageGroups.youngAdults}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${getPercentage(ageGroups.youngAdults, totalMembers)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Adults (36-65)</span>
                  <span className="text-gray-300">{ageGroups.adults}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${getPercentage(ageGroups.adults, totalMembers)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Seniors (65+)</span>
                  <span className="text-gray-300">{ageGroups.seniors}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${getPercentage(ageGroups.seniors, totalMembers)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}