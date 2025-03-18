import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { DarkModeToggle } from './DarkModeToggle';
import { useNavigate } from 'react-router-dom';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, we'll just simulate success
      console.log('Password reset requested for:', data.email);
      setIsComplete(true);
    } catch (error) {
      setError('Unable to process your request. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-6 bg-green-600 dark:bg-green-700 relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
              className="absolute left-4 top-4 text-white/80 hover:text-white transition-colors
                       flex items-center space-x-1 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Login</span>
            </button>
            <h2 className="text-2xl font-bold text-white text-center mt-2">Forgot Password</h2>
            <p className="text-green-100 text-center mt-1">We'll help you reset your password</p>
          </div>
          
          <div className="p-8">
            {isComplete ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
              >
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Check Your Email
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We've sent password reset instructions to your email address.
                  Please check your inbox and follow the link to reset your password.
                </p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/login');
                  }}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg
                           transition-colors focus:ring-4 focus:ring-green-500 focus:ring-opacity-50"
                >
                  Return to Login
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg
                             flex items-center space-x-2"
                  >
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </motion.div>
                )}
                
                <div className="space-y-2">
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="Email address"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                               focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 
                               dark:text-white transition-colors"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg
                           focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}