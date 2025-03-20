import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { getUserProfile, updateUserProfile } from '../utils/database';

export function EditProfilePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    displayName: '',
    familyTreeName: '',
    gender: '',
    occupation: '',
    education: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    async function loadProfile() {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const profile = await getUserProfile(currentUser.uid);
        if (profile) {
          setFormData({
            displayName: profile.displayName || '',
            familyTreeName: profile.familyTreeName || '',
            gender: profile.gender || '',
            occupation: profile.job || '',
            education: profile.education || '',
            phone: profile.phone || '',
            address: profile.address || ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile information.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [currentUser, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      await updateUserProfile(currentUser.uid, {
        displayName: formData.displayName,
        familyTreeName: formData.familyTreeName,
        gender: formData.gender,
        job: formData.occupation,
        education: formData.education,
        phone: formData.phone,
        address: formData.address
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
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
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Edit Profile</h1>
          <button 
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-sm px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back
          </button>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto mt-8 px-4">
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded">
            Profile updated successfully! Redirecting...
          </div>
        )}
        
        <div className="bg-gray-800 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-medium border-b border-gray-700 pb-2">Basic Information</h2>
              
              <div>
                <label htmlFor="displayName" className="block text-sm text-gray-400 mb-1">
                  Full Name
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="familyTreeName" className="block text-sm text-gray-400 mb-1">
                  Family Name
                </label>
                <input
                  id="familyTreeName"
                  name="familyTreeName"
                  type="text"
                  value={formData.familyTreeName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="gender" className="block text-sm text-gray-400 mb-1">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-lg font-medium border-b border-gray-700 pb-2">Professional Information</h2>
              
              <div>
                <label htmlFor="occupation" className="block text-sm text-gray-400 mb-1">
                  Occupation
                </label>
                <input
                  id="occupation"
                  name="occupation"
                  type="text"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="education" className="block text-sm text-gray-400 mb-1">
                  Education
                </label>
                <input
                  id="education"
                  name="education"
                  type="text"
                  value={formData.education}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-lg font-medium border-b border-gray-700 pb-2">Contact Information</h2>
              
              <div>
                <label htmlFor="phone" className="block text-sm text-gray-400 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm text-gray-400 mb-1">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-700 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 mr-3 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 