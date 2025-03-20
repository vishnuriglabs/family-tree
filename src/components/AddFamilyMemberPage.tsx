import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Upload, X, Camera, User } from 'lucide-react';
import { addFamilyMember, getFamilyMembersByUser, getFamilyMember } from '../utils/database';
import { useAuth } from '../utils/AuthContext';
import { AuthContext } from '../utils/AuthContext';
import { database } from '../utils/firebase';
import { ref, push, set } from 'firebase/database';
import { logActivity, ActivityType } from '../utils/activity';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Simplified schema for form validation - removed familyName and relationshipWithId
const memberSchema = z.object({
  firstName: z.string().min(2, 'First name should be at least 2 characters'),
  lastName: z.string().min(2, 'Last name should be at least 2 characters'),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Please select a gender' }),
  }),
  dateOfBirth: z.string().refine((val) => {
    const date = new Date(val);
    const today = new Date();
    return date <= today;
  }, 'Date of birth cannot be in the future'),
  relation: z.string().min(1, 'Please select a relation'),
  relateToExisting: z.boolean().optional(),
  existingMemberId: z.string().optional(),
  relationshipType: z.string().optional(),
  phone: z.string().optional()
    .refine((val) => !val || /^\+?[0-9]{10,15}$/.test(val), {
      message: 'Invalid phone number format',
    }),
  email: z.string().optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Invalid email address',
    }),
  education: z.string().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

export function AddFamilyMemberPage() {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);
  const [userFamilyMembers, setUserFamilyMembers] = useState<Record<string, any>>({});
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [relationType, setRelationType] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    watch,
    setValue
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    mode: 'onChange',
  });

  // Load existing family members and check for selected member from sessionStorage
  useEffect(() => {
    async function loadInitialData() {
      console.log('AddFamilyMemberPage: loadInitialData called');
      
      if (currentUser) {
        try {
          // Get family members
          const members = await getFamilyMembersByUser(currentUser.uid);
          setUserFamilyMembers(members);
          
          // Check for selected member in sessionStorage
          const storedMemberId = sessionStorage.getItem('selectedMemberId');
          const storedRelationType = sessionStorage.getItem('relationType');
          
          console.log('AddFamilyMemberPage: Checking sessionStorage', { 
            storedMemberId, 
            storedRelationType,
            allSessionStorage: Object.keys(sessionStorage).map(key => `${key}: ${sessionStorage.getItem(key)}`)
          });
          
          if (storedMemberId && storedRelationType) {
            console.log(`Found stored member ID: ${storedMemberId}, relation: ${storedRelationType}`);
            
            // Get the details of the selected member
            const memberDetails = await getFamilyMember(storedMemberId);
            console.log('Fetched member details:', memberDetails);
            
            if (memberDetails) {
              setSelectedMemberId(storedMemberId);
              setRelationType(storedRelationType);
              setSelectedMember(memberDetails);
              
              // Set default relationship values based on the stored relation type
              setValue('relateToExisting', true);
              setValue('existingMemberId', storedMemberId);
              setValue('relationshipType', storedRelationType === 'sibling' ? 'child' : storedRelationType);
              
              // Set a default relation based on the relationship type
              if (storedRelationType === 'child') {
                setValue('relation', memberDetails?.gender === 'male' ? 'son' : 'daughter');
              } else if (storedRelationType === 'parent') {
                setValue('relation', memberDetails?.gender === 'male' ? 'father' : 'mother');
              } else if (storedRelationType === 'spouse') {
                setValue('relation', 'spouse');
              } else if (storedRelationType === 'sibling') {
                setValue('relation', memberDetails?.gender === 'male' ? 'brother' : 'sister');
              }
              
              console.log(`Loaded member details for ${memberDetails.name}, set relation type: ${storedRelationType}`);
            } else {
              console.error(`Failed to load details for member ID: ${storedMemberId}`);
            }
            
            // Clear the sessionStorage after use
            sessionStorage.removeItem('selectedMemberId');
            sessionStorage.removeItem('relationType');
            console.log('Cleared sessionStorage after use');
          }
        } catch (error) {
          console.error("Failed to load initial data:", error);
        }
      }
    }
    
    loadInitialData();
  }, [currentUser, setValue]);

  // Watched values for conditional rendering
  const watchRelation = watch('relation');
  const watchRelateToExisting = watch('relateToExisting');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);

    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setImageError(`File size should be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    // Validate file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Only .jpg, .jpeg, .png and .webp files are accepted');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setProfileImage(null);
    setImageFile(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (data: MemberFormData) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitSuccess(null);
    
    try {
      setLoading(true);
      
      // Create the member data object
      const memberData = {
        name: `${data.firstName} ${data.lastName}`,
        relation: data.relation,
        birthDate: data.dateOfBirth,
        gender: data.gender as 'male' | 'female' | 'other',
        bio: data.additionalNotes || '',
        photoUrl: profileImage || '',
        createdBy: currentUser?.uid,
        createdAt: Date.now(),
        isRoot: Object.keys(userFamilyMembers).length === 0,
        phone: data.phone || '',
        email: data.email || '',
        education: data.education || '',
        occupation: data.occupation || '',
        address: data.address || ''
      };
      
      // Add the family member to the database
      const newMemberId = await addFamilyMember(memberData);
      console.log('New family member added with ID:', newMemberId);
      
      // Log the activity after successful addition
      if (currentUser) {
        await logActivity(
          currentUser.uid,
          currentUser.displayName || 'Unknown User',
          ActivityType.MEMBER_ADDED,
          {
            userEmail: currentUser.email || undefined,
            family: memberData.name,
            entityId: newMemberId || undefined,
            details: `Added ${memberData.name} as ${memberData.relation}`
          }
        );
      }
      
      // Show success message and redirect
      setSubmitSuccess(true);
      reset();
      removeImage();
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error adding family member:', error);
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedMember ? `Add ${relationType === 'child' ? 'Child' : 
                                relationType === 'parent' ? 'Parent' : 
                                relationType === 'spouse' ? 'Spouse' : 
                                relationType === 'sibling' ? 'Sibling' : 
                                'Family Member'} for ${selectedMember.name}` : 
                Object.keys(userFamilyMembers).length === 0 ? 'Add Root Family Member' : 'Add Family Member'}
            </h1>
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alert for success/error */}
        {submitSuccess !== null && (
          <div 
            className={`mb-6 p-4 rounded-md ${
              submitSuccess 
                ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}
          >
            {submitSuccess 
              ? 'Family member added successfully! Redirecting...' 
              : 'An error occurred while adding the family member. Please try again.'}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Profile Picture Upload Section */}
            <div className="flex flex-col items-center mb-6">
              <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Profile Picture (Optional)
              </div>
              <div className="mt-1 flex flex-col items-center">
                <div 
                  className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center cursor-pointer"
                  onClick={triggerFileInput}
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 w-full h-full">
                      <User size={36} className="text-gray-400 dark:text-gray-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">Add Photo</span>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                />

                <div className="flex mt-3 space-x-2">
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <Upload size={16} className="mr-2" />
                    Upload
                  </button>
                  {profileImage && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-red-600 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <X size={16} className="mr-2" />
                      Remove
                    </button>
                  )}
                </div>

                {imageError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{imageError}</p>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-medium text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-700 w-full">
                Basic Information
              </legend>
              
              {/* Name fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    {...register('firstName')}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-invalid={errors.firstName ? 'true' : 'false'}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    {...register('lastName')}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-invalid={errors.lastName ? 'true' : 'false'}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Gender and DOB fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gender *
                  </label>
                  <select
                    id="gender"
                    {...register('gender')}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-invalid={errors.gender ? 'true' : 'false'}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.gender.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-invalid={errors.dateOfBirth ? 'true' : 'false'}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.dateOfBirth.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Relation to you */}
              <div>
                <label htmlFor="relation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Relation to You *
                </label>
                <select
                  id="relation"
                  {...register('relation')}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-invalid={errors.relation ? 'true' : 'false'}
                >
                  <option value="">Select relation</option>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="spouse">Spouse</option>
                  <option value="son">Son</option>
                  <option value="daughter">Daughter</option>
                  <option value="brother">Brother</option>
                  <option value="sister">Sister</option>
                  <option value="grandfather">Grandfather</option>
                  <option value="grandmother">Grandmother</option>
                  <option value="uncle">Uncle</option>
                  <option value="aunt">Aunt</option>
                  <option value="cousin">Cousin</option>
                  <option value="nephew">Nephew</option>
                  <option value="niece">Niece</option>
                  <option value="other">Other</option>
                </select>
                {errors.relation && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.relation.message}
                  </p>
                )}
              </div>
            </fieldset>

            {/* Relate to Existing Family Member Section */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-medium text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-700 w-full">
                Connect to Existing Family Member (Optional)
              </legend>
              
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <input
                    id="relateToExisting"
                    type="checkbox"
                    {...register('relateToExisting')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-700 dark:bg-gray-700 rounded"
                  />
                  <label htmlFor="relateToExisting" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Connect this person to an existing family member
                  </label>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This will create a relationship between this new person and someone already in your family tree
                </p>
              </div>

              {watchRelateToExisting && (
                <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                  <div>
                    <label htmlFor="existingMemberId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Select Existing Family Member
                    </label>
                    <select
                      id="existingMemberId"
                      {...register('existingMemberId')}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select a family member</option>
                      {Object.entries(userFamilyMembers).map(([id, member]: [string, any]) => (
                        <option key={id} value={id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="relationshipType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Relationship Type
                    </label>
                    <select
                      id="relationshipType"
                      {...register('relationshipType')}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select relationship type</option>
                      <option value="parent">Parent of selected person</option>
                      <option value="child">Child of selected person</option>
                      <option value="spouse">Spouse of selected person</option>
                    </select>
                  </div>
                </div>
              )}
            </fieldset>

            {/* Contact Information */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-medium text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-700 w-full">
                Contact Information
              </legend>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-invalid={errors.phone ? 'true' : 'false'}
                    placeholder="+1 (123) 456-7890"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    placeholder="example@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Educational & Professional Details */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-medium text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-700 w-full">
                Educational & Professional Details
              </legend>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="education" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Education
                  </label>
                  <input
                    id="education"
                    type="text"
                    {...register('education')}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Highest qualification"
                  />
                </div>

                <div>
                  <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Occupation
                  </label>
                  <input
                    id="occupation"
                    type="text"
                    {...register('occupation')}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Current job or role"
                  />
                </div>
              </div>
            </fieldset>

            {/* Additional Information */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-medium text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-700 w-full">
                Additional Information
              </legend>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <input
                  id="address"
                  type="text"
                  {...register('address')}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Current residence"
                />
              </div>

              <div>
                <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Notes (Biography)
                </label>
                <textarea
                  id="additionalNotes"
                  {...register('additionalNotes')}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Any additional information you'd like to add"
                ></textarea>
              </div>
            </fieldset>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isDirty || !isValid}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Add Family Member'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 