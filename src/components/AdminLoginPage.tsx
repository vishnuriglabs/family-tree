import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, User, Lock, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { DarkModeToggle } from './DarkModeToggle';
import { useNavigate } from 'react-router-dom';

const adminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    setIsLoading(true);
    setLoginError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate authentication error
      if (data.username !== 'admin') {
        throw new Error('Invalid credentials');
      }

      // Handle successful login
      console.log('Admin logged in:', data);
      navigate('/admin-dashboard'); // Navigate to admin dashboard instead of user dashboard
      
    } catch (error) {
      setLoginError('Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 sm:p-6 md:p-8 relative">
      <div className="absolute top-4 right-4 z-10">
        <DarkModeToggle />      
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="px-8 py-6 bg-indigo-600 dark:bg-indigo-700 relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
              className="absolute left-4 top-4 text-white/80 hover:text-white transition-colors
                       flex items-center space-x-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 rounded-md"
              aria-label="Back to login"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Login</span>
            </button>
            <div className="flex justify-center mb-2">
              <Shield className="h-12 w-12 text-white drop-shadow-md" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center">Admin Portal</h2>
            <p className="text-indigo-100 text-center mt-1">Secure administrative access</p>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg
                           flex items-center space-x-2 border border-red-100 dark:border-red-900/50"
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{loginError}</p>
                </motion.div>
              )}

              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300 sr-only">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    id="username"
                    {...register('username')}
                    type="text"
                    placeholder="Username"
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 
                             dark:text-white transition-colors shadow-sm"
                  />
                </div>
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300 sr-only">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    {...register('password')}
                    type="password"
                    placeholder="Password"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 
                             dark:text-white transition-colors shadow-sm"
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg
                         transition-colors focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center space-x-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    <span>Login as Administrator</span>
                  </>
                )}
              </button>

              <div className="text-center border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This portal is restricted to authorized personnel only.
                </p>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}