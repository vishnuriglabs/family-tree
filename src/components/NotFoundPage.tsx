import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-8 text-center">
        <h1 className="text-9xl font-bold text-green-600 dark:text-green-500">404</h1>
        
        <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
          Page Not Found
        </h2>
        
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <div className="mt-8 flex flex-col space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 
                     border border-gray-300 dark:border-gray-600 rounded-lg
                     text-sm font-medium text-gray-700 dark:text-gray-300
                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3
                     bg-green-600 text-white rounded-lg hover:bg-green-700
                     transition-colors focus:ring-4 focus:ring-green-500 focus:ring-opacity-50"
          >
            <Home className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
} 