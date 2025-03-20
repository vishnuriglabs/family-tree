import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Building2, Phone, GraduationCap, MapPin, ChevronRight, ChevronLeft, Check, Upload, X } from 'lucide-react';
import { DarkModeToggle } from './DarkModeToggle';
import { useAuth } from '../utils/AuthContext';
import { createUserProfile } from '../utils/database';
import { FirebaseError } from 'firebase/app';
import { set, ref } from 'firebase/database';
import { database } from '../utils/firebase';
import { Logo } from './Logo';
import { logActivity, ActivityType } from '../utils/activity';

// Add constants for image validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  
  // File upload state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    familyName: '',
    gender: '',
    password: '',
    confirmPassword: '',
    job: '',
    address: '',
    phone: '',
    education: ''
  });
  
  // Form errors
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    familyName: '',
    gender: '',
    password: '',
    confirmPassword: '',
    job: '',
    address: '',
    phone: '',
    education: ''
  });
  
  // Handle image change
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

  // Remove image
  const removeImage = () => {
    setProfileImage(null);
    setImageFile(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };
  
  // Validate a single field
  const validateField = (fieldName: string, value: string) => {
    let error = '';
    
    switch (fieldName) {
      case 'fullName':
        error = value.length < 2 ? 'Full name must be at least 2 characters' : '';
        break;
      case 'email':
        error = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Please enter a valid email address' : '';
        break;
      case 'familyName':
        error = value.length < 2 ? 'Family name must be at least 2 characters' : '';
        break;
      case 'gender':
        error = !value ? 'Please select a gender' : '';
        break;
      case 'password':
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const isLongEnough = value.length >= 8;
        
        if (!isLongEnough) {
          error = 'Password must be at least 8 characters';
        } else if (!hasUpperCase) {
          error = 'Password must contain at least one uppercase letter';
        } else if (!hasLowerCase) {
          error = 'Password must contain at least one lowercase letter';
        } else if (!hasNumber) {
          error = 'Password must contain at least one number';
        }
        break;
      case 'confirmPassword':
        error = value !== formData.password ? 'Passwords don\'t match' : '';
        break;
      case 'job':
        error = value.length < 2 ? 'Job title is required' : '';
        break;
      case 'address':
        error = value.length < 5 ? 'Please enter a valid address' : '';
        break;
      case 'phone':
        error = !/^\+?[1-9]\d{9,14}$/.test(value) ? 'Please enter a valid phone number' : '';
        break;
      case 'education':
        error = value.length < 2 ? 'Education qualification is required' : '';
        break;
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [fieldName]: error }));
    return error === '';
  };
  
  // Validate current step
  const validateStep = () => {
    let isValid = true;
    const fieldsToValidate = currentStep === 0 
      ? ['fullName', 'email', 'familyName', 'gender', 'password', 'confirmPassword'] 
      : ['job', 'address', 'phone', 'education'];
    
    fieldsToValidate.forEach(field => {
      const fieldIsValid = validateField(field, formData[field as keyof typeof formData]);
      if (!fieldIsValid) isValid = false;
    });
    
    return isValid;
  };
  
  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prevStep => prevStep + 1);
    }
  };
  
  // Handle back
  const handleBack = () => {
    setCurrentStep(prevStep => prevStep - 1);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields first
    const stepValid = validateStep();
    if (!stepValid) {
      return;
    }
    
    console.log("Starting signup process with form data:", { 
      email: formData.email, 
      familyName: formData.familyName,
      fullName: formData.fullName 
    });
    
    setIsSubmitting(true);
    setSignupError(null);
    
    try {
      // Create user with Firebase Authentication
      console.log("Attempting to create Firebase user account...");
      const userCredential = await signup(formData.email, formData.password);
      
      // User account created successfully, proceed even if database write fails
      let dbWriteSuccess = false;
      
      // Create user profile in Firebase Realtime Database
      if (userCredential && userCredential.user) {
        console.log("User created successfully in Firebase Auth:", userCredential.user.uid);
        
        const userProfile = {
          uid: userCredential.user.uid,
          email: formData.email,
          displayName: formData.fullName,
          familyTreeName: formData.familyName,
          gender: formData.gender,
          job: formData.job,
          address: formData.address,
          phone: formData.phone,
          education: formData.education,
          photoURL: profileImage || '',
          createdAt: Date.now()
        };
        
        try {
          console.log("Attempting to create user profile in Realtime Database:", userProfile);
          await createUserProfile(userProfile);
          console.log("User profile successfully created in database");
          dbWriteSuccess = true;
        } catch (dbError) {
          console.error("Error saving user profile to database:", dbError);
          // Don't throw - continue with auth-only signup
        }
      } else {
        console.error("User credential is missing user object");
      }
      
      // Even if database write failed, we consider signup complete if auth worked
      setIsComplete(true);
      
      // Log the signup activity
      if (userCredential && userCredential.user) {
        await logActivity(
          userCredential.user.uid,
          userCredential.user.displayName || formData.fullName,
          ActivityType.USER_SIGNUP,
          {
            userEmail: userCredential.user.email || formData.email
          }
        );
      }
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        console.log("Redirecting to dashboard");
        // Pass a query parameter if DB write failed so we can show a message
        if (!dbWriteSuccess) {
          navigate('/dashboard?db_incomplete=true');
        } else {
          navigate('/dashboard');
        }
      }, 2000);
    } catch (error) {
      const firebaseError = error as FirebaseError;
      console.error('Signup error:', firebaseError);
      
      // Handle different Firebase auth errors
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          setSignupError('This email is already registered. Please use another email or login.');
          break;
        case 'auth/invalid-email':
          setSignupError('Invalid email address. Please check and try again.');
          break;
        case 'auth/weak-password':
          setSignupError('Password is too weak. Please choose a stronger password.');
          break;
        default:
          setSignupError('An error occurred during signup. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Steps configuration
  const steps = [
    'Personal Information',
    'Additional Details'
  ];
  
  // Render success screen
  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Registration Complete!
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            Your account has been created successfully.
          </p>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors focus:ring-4 focus:ring-green-500 focus:ring-opacity-50"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="px-4 py-5 bg-green-600 dark:bg-green-700 -mt-6 -mx-6 mb-6 rounded-t-lg">
          <h1 className="text-2xl font-bold text-white text-center">
            Create Account
          </h1>
          <p className="text-green-100 text-center text-sm mt-1">
            Join our family tree platform
          </p>
        </div>
        
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="flex items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index <= currentStep 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    {step}
                  </span>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-4 bg-gray-200 dark:bg-gray-700">
                    <div 
                      className={`h-0.5 bg-green-600 transition-all duration-300 ${
                        currentStep > index ? 'w-full' : 'w-0'
                      }`}
                    >
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Information */}
          {currentStep === 0 && (
            <div className="space-y-4">
              {/* Profile Picture Upload */}
              <div className="flex flex-col items-center mb-4">
                <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Profile Picture (Optional)
                </div>
                <div className="mt-1 flex flex-col items-center">
                  <div 
                    className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center cursor-pointer"
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
                      className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <Upload size={14} className="mr-1" />
                      Upload
                    </button>
                    {profileImage && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 shadow-sm text-xs leading-4 font-medium rounded-md text-red-600 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <X size={14} className="mr-1" />
                        Remove
                      </button>
                    )}
                  </div>

                  {imageError && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{imageError}</p>
                  )}
                </div>
              </div>
              
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white`}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
                )}
              </div>
              
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                  <input
                    type="text"
                    name="familyName"
                    value={formData.familyName}
                    onChange={handleChange}
                    placeholder="Family Name"
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.familyName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white`}
                  />
                </div>
                {errors.familyName && (
                  <p className="mt-1 text-sm text-red-500">{errors.familyName}</p>
                )}
              </div>
              
              <div>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${
                    errors.gender ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white`}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
                )}
              </div>
              
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white`}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>
              
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm Password"
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Step 2: Additional Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                  <input
                    type="text"
                    name="job"
                    value={formData.job}
                    onChange={handleChange}
                    placeholder="Job Title"
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.job ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white`}
                  />
                </div>
                {errors.job && (
                  <p className="mt-1 text-sm text-red-500">{errors.job}</p>
                )}
              </div>
              
              <div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Address"
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white`}
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                )}
              </div>
              
              <div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
              </div>
              
              <div>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                  <input
                    type="text"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="Education Qualification"
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.education ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white`}
                  />
                </div>
                {errors.education && (
                  <p className="mt-1 text-sm text-red-500">{errors.education}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Form Navigation */}
          <div className="flex justify-between mt-8">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronLeft size={16} />
                <span className="ml-1">Back</span>
              </button>
            )}
            
            {currentStep === 0 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center ml-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <span className="mr-1">Next</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center ml-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : 'Complete Signup'}
              </button>
            )}
          </div>
          
          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium"
              >
                Login here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}