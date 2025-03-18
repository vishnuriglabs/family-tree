import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Upload, X, Camera, User } from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Zod schema for form validation
const memberSchema = z.object({
  firstName: z.string().min(2, 'First name should be at least 2 characters'),
  lastName: z.string().min(2, 'Last name should be at least 2 characters'),
  familyName: z.string().min(1, 'Please select a family name'),
  relationshipWithId: z.string().min(1, 'Please select a family member'),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Please select a gender' }),
  }),
  dateOfBirth: z.string().refine((val) => {
    const date = new Date(val);
    const today = new Date();
    return date <= today;
  }, 'Date of birth cannot be in the future'),
  relation: z.string().min(1, 'Please select a relation'),
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

// Add mock data for families and their members
const mockFamilies = [
  { id: '1', name: 'Wilson' },
  { id: '2', name: 'Johnson' },
  { id: '3', name: 'Smith' },
  { id: '4', name: 'Brown' },
  { id: '5', name: 'Davis' }
];

const mockFamilyMembers = {
  '1': [ // Wilson family
    { id: '101', name: 'John Wilson', relation: 'Father' },
    { id: '102', name: 'Sarah Wilson', relation: 'Mother' },
    { id: '103', name: 'Michael Wilson', relation: 'Son' }
  ],
  '2': [ // Johnson family
    { id: '201', name: 'Robert Johnson', relation: 'Father' },
    { id: '202', name: 'Patricia Johnson', relation: 'Mother' }
  ],
  '3': [ // Smith family
    { id: '301', name: 'William Smith', relation: 'Father' },
    { id: '302', name: 'Mary Smith', relation: 'Mother' }
  ],
  '4': [ // Brown family
    { id: '401', name: 'Richard Brown', relation: 'Father' },
    { id: '402', name: 'Jennifer Brown', relation: 'Mother' }
  ],
  '5': [ // Davis family
    { id: '501', name: 'Robert Davis', relation: 'Father' }
  ]
};

export function AddFamilyMemberPage() {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [availableFamilyMembers, setAvailableFamilyMembers] = useState<Array<{id: string, name: string, relation: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    setValue,
    watch
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    mode: 'onChange',
  });

  // Watch the familyName field to update available family members
  const watchedFamilyName = watch('familyName');

  // Update available family members when family selection changes
  useEffect(() => {
    if (watchedFamilyName) {
      const familyId = mockFamilies.find(f => f.name === watchedFamilyName)?.id;
      if (familyId) {
        setSelectedFamilyId(familyId);
        setAvailableFamilyMembers(mockFamilyMembers[familyId] || []);
        // Reset the relationshipWithId field when family changes
        setValue('relationshipWithId', '');
      }
    } else {
      setAvailableFamilyMembers([]);
    }
  }, [watchedFamilyName, setValue]);

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
    setIsSubmitting(true);
    setSubmitSuccess(null);
    
    try {
      // Get related family member details
      const relatedMember = availableFamilyMembers.find(m => m.id === data.relationshipWithId);

      // Format the data - create a formatted object that matches the expected format in FamilyDetailsPage
      const formattedData = {
        // In a real app, this would be generated by the backend
        id: Math.floor(Math.random() * 10000).toString(),
        name: `${data.firstName} ${data.lastName}`,
        familyName: data.familyName,
        relation: data.relation.charAt(0).toUpperCase() + data.relation.slice(1),
        dob: data.dateOfBirth,
        gender: data.gender.charAt(0).toUpperCase() + data.gender.slice(1),
        education: data.education || '',
        job: data.occupation || '',
        contact: data.phone || '',
        // Additional fields not shown in the table but stored for the record
        email: data.email || '',
        address: data.address || '',
        additionalNotes: data.additionalNotes || '',
        imageUrl: profileImage || '',
        // Relationship details
        relatedToMemberId: data.relationshipWithId,
        relatedToMemberName: relatedMember ? relatedMember.name : '',
        relatedToMemberRelation: relatedMember ? relatedMember.relation : ''
      };
      
      // Simulate API call to add family member
      console.log('Formatted data for submission:', formattedData);
      console.log('Original form data:', data);
      console.log('Image file:', imageFile);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubmitSuccess(true);
      reset();
      removeImage();

      // Redirect after success
      setTimeout(() => {
        navigate('/family-details');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Family Member</h1>
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

              {/* Family Selection Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Family Name *
                  </label>
                  <select
                    id="familyName"
                    {...register('familyName')}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-invalid={errors.familyName ? 'true' : 'false'}
                  >
                    <option value="">Select family</option>
                    {mockFamilies.map(family => (
                      <option key={family.id} value={family.name}>{family.name}</option>
                    ))}
                  </select>
                  {errors.familyName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.familyName.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="relationshipWithId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Relationship With *
                  </label>
                  <select
                    id="relationshipWithId"
                    {...register('relationshipWithId')}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-invalid={errors.relationshipWithId ? 'true' : 'false'}
                    disabled={availableFamilyMembers.length === 0}
                  >
                    <option value="">Select family member</option>
                    {availableFamilyMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name} ({member.relation})</option>
                    ))}
                  </select>
                  {errors.relationshipWithId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.relationshipWithId.message}
                    </p>
                  )}
                </div>
              </div>
              
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

              {/* Relation type */}
              <div>
                <label htmlFor="relation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Relation Type *
                </label>
                <select
                  id="relation"
                  {...register('relation')}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-invalid={errors.relation ? 'true' : 'false'}
                >
                  <option value="">Select relation type</option>
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
                  Additional Notes
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