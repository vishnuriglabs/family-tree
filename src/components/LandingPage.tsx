import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { Navigate } from 'react-router-dom';

export function LandingPage() {
  const { currentUser } = useAuth();
  
  // If user is already logged in, redirect to dashboard
  if (currentUser) {
    return <Navigate to="/dashboard" />;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Family Tree App</h1>
          <div className="space-x-4">
            <Link to="/login" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium">
              Login
            </Link>
            <Link to="/signup" className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-medium">
              Sign Up
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Build Your Family Tree</h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Create, visualize, and share your family relationships with our intuitive family tree builder.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link to="/signup" className="px-6 py-3 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium text-lg">
              Get Started Now
            </Link>
            <Link to="/login" className="px-6 py-3 rounded-md bg-gray-700 hover:bg-gray-600 text-white font-medium text-lg">
              Login to Your Account
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-blue-400 text-4xl font-bold mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
              <p className="text-gray-400">Sign up and set up your personal information as the first member of your tree.</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-blue-400 text-4xl font-bold mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Add Family Members</h3>
              <p className="text-gray-400">Easily add your relatives and define relationships between family members.</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-blue-400 text-4xl font-bold mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">View Your Tree</h3>
              <p className="text-gray-400">Visualize your entire family structure with our interactive tree view.</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-800 border-t border-gray-700 py-6">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2023 Family Tree App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 