import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Building2, Phone, GraduationCap, MapPin, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { DarkModeToggle } from './DarkModeToggle';

export function SignupPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
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
    
    if (validateStep()) {
      setIsSubmitting(true);
      
      try {
        // Simulating API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('Form submitted:', formData);
        setIsComplete(true);
      } catch (error) {
        console.error('Error submitting form:', error);
      } finally {
        setIsSubmitting(false);
      }
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