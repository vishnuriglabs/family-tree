import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, 
  SlidersHorizontal, ArrowUpDown
} from 'lucide-react';

// Mock data for family records
const mockFamilyRecords = [
  { id: 1, name: 'John Wilson', familyName: 'Wilson', relation: 'Father', dob: '1975-05-15', gender: 'Male', education: 'MBA', job: 'Business Analyst', contact: '+1 (555) 123-4567' },
  { id: 2, name: 'Sarah Wilson', familyName: 'Wilson', relation: 'Mother', dob: '1978-08-21', gender: 'Female', education: 'PhD', job: 'Professor', contact: '+1 (555) 123-4568' },
  { id: 3, name: 'Michael Wilson', familyName: 'Wilson', relation: 'Son', dob: '2005-03-10', gender: 'Male', education: 'High School', job: 'Student', contact: '+1 (555) 123-4569' },
  { id: 4, name: 'Emily Wilson', familyName: 'Wilson', relation: 'Daughter', dob: '2010-11-05', gender: 'Female', education: 'Middle School', job: 'Student', contact: '+1 (555) 123-4570' },
  { id: 5, name: 'Robert Johnson', familyName: 'Johnson', relation: 'Father', dob: '1972-09-18', gender: 'Male', education: 'Bachelors', job: 'Engineer', contact: '+1 (555) 234-5678' },
  { id: 6, name: 'Patricia Johnson', familyName: 'Johnson', relation: 'Mother', dob: '1974-12-03', gender: 'Female', education: 'Masters', job: 'Architect', contact: '+1 (555) 234-5679' },
  { id: 7, name: 'James Johnson', familyName: 'Johnson', relation: 'Son', dob: '2008-02-25', gender: 'Male', education: 'Elementary', job: 'Student', contact: '+1 (555) 234-5680' },
  { id: 8, name: 'William Smith', familyName: 'Smith', relation: 'Father', dob: '1980-07-12', gender: 'Male', education: 'PhD', job: 'Doctor', contact: '+1 (555) 345-6789' },
  { id: 9, name: 'Mary Smith', familyName: 'Smith', relation: 'Mother', dob: '1982-04-30', gender: 'Female', education: 'MD', job: 'Surgeon', contact: '+1 (555) 345-6790' },
  { id: 10, name: 'David Smith', familyName: 'Smith', relation: 'Son', dob: '2012-06-08', gender: 'Male', education: 'Elementary', job: 'Student', contact: '+1 (555) 345-6791' },
  { id: 11, name: 'Elizabeth Smith', familyName: 'Smith', relation: 'Daughter', dob: '2015-10-17', gender: 'Female', education: 'Pre-school', job: 'Student', contact: '+1 (555) 345-6792' },
  { id: 12, name: 'Richard Brown', familyName: 'Brown', relation: 'Father', dob: '1968-11-22', gender: 'Male', education: 'Masters', job: 'Manager', contact: '+1 (555) 456-7890' },
  { id: 13, name: 'Jennifer Brown', familyName: 'Brown', relation: 'Mother', dob: '1970-01-14', gender: 'Female', education: 'Bachelors', job: 'Teacher', contact: '+1 (555) 456-7891' },
  { id: 14, name: 'Joseph Brown', familyName: 'Brown', relation: 'Son', dob: '2000-08-07', gender: 'Male', education: 'College', job: 'Student', contact: '+1 (555) 456-7892' },
  { id: 15, name: 'Jessica Brown', familyName: 'Brown', relation: 'Daughter', dob: '2003-05-19', gender: 'Female', education: 'High School', job: 'Student', contact: '+1 (555) 456-7893' }
];

type SortField = 'name' | 'familyName' | 'relation' | 'dob' | 'gender' | 'education' | 'job';
type SortDirection = 'asc' | 'desc';

export function FamilyDetailsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedRelation, setSelectedRelation] = useState('all');

  // Filter and sort logic
  const filteredRecords = mockFamilyRecords.filter((record) => {
    const matchesSearch = 
      record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.familyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.job.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.education.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGender = selectedGender === 'all' || record.gender.toLowerCase() === selectedGender.toLowerCase();
    const matchesRelation = selectedRelation === 'all' || record.relation.toLowerCase() === selectedRelation.toLowerCase();
    
    return matchesSearch && matchesGender && matchesRelation;
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (sortDirection === 'asc') {
      return a[sortField] > b[sortField] ? 1 : -1;
    } else {
      return a[sortField] < b[sortField] ? 1 : -1;
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle sorting
  const handleSort = (field: SortField) => {
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
    navigate('/add-family-member');
  };

  const handleEditMember = (id: number) => {
    // In a real app, this would navigate to an edit form or open a modal
    console.log('Edit family member', id);
  };

  const handleDeleteMember = (id: number) => {
    // In a real app, this would show a confirmation dialog and delete the record
    console.log('Delete family member', id);
  };

  // Format date from yyyy-mm-dd to mm/dd/yyyy
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Family Records</h1>
            <button 
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-300 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50"
            >
              <ChevronLeft size={16} className="mr-1" />
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter Controls */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, family, job..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Filter and Add Member buttons */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <SlidersHorizontal size={16} className="mr-2" />
                  Filters
                </button>
                
                {isFilterMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                    <div className="p-4 space-y-4">
                      {/* Gender filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Gender
                        </label>
                        <select
                          value={selectedGender}
                          onChange={(e) => setSelectedGender(e.target.value)}
                          className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="all">All</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                      
                      {/* Relation filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Relation
                        </label>
                        <select
                          value={selectedRelation}
                          onChange={(e) => setSelectedRelation(e.target.value)}
                          className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="all">All</option>
                          <option value="father">Father</option>
                          <option value="mother">Mother</option>
                          <option value="son">Son</option>
                          <option value="daughter">Daughter</option>
                        </select>
                      </div>
                      
                      {/* Items per page */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Records per page
                        </label>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => setItemsPerPage(Number(e.target.value))}
                          className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={15}>15</option>
                        </select>
                      </div>
                      
                      {/* Apply and Reset buttons */}
                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          onClick={() => {
                            setSelectedGender('all');
                            setSelectedRelation('all');
                            setItemsPerPage(5);
                          }}
                          className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => setIsFilterMenuOpen(false)}
                          className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleAddMember}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus size={16} className="mr-2" />
                Add Member
              </button>
            </div>
          </div>
        </div>

        {/* Family Records Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Name
                      <ArrowUpDown size={14} className="ml-1" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('familyName')}
                  >
                    <div className="flex items-center">
                      Family Name
                      <ArrowUpDown size={14} className="ml-1" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('relation')}
                  >
                    <div className="flex items-center">
                      Relation
                      <ArrowUpDown size={14} className="ml-1" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('dob')}
                  >
                    <div className="flex items-center">
                      DOB
                      <ArrowUpDown size={14} className="ml-1" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('gender')}
                  >
                    <div className="flex items-center">
                      Gender
                      <ArrowUpDown size={14} className="ml-1" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('education')}
                  >
                    <div className="flex items-center">
                      Education
                      <ArrowUpDown size={14} className="ml-1" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('job')}
                  >
                    <div className="flex items-center">
                      Job
                      <ArrowUpDown size={14} className="ml-1" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Contact
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {record.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {record.familyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {record.relation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatDate(record.dob)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {record.gender}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {record.education}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {record.job}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {record.contact}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditMember(record.id)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(record.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredRecords.length)}
              </span>{' '}
              of <span className="font-medium">{filteredRecords.length}</span> results
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-200 dark:border-gray-700 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                // Logic to show pagination numbers around current page
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = index + 1;
                } else if (currentPage <= 3) {
                  pageNumber = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + index;
                } else {
                  pageNumber = currentPage - 2 + index;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-8 h-8 rounded-md ${
                      currentPage === pageNumber
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
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
      </main>
    </div>
  );
} 