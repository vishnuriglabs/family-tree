import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useDarkMode } from './DarkModeProvider';

interface DarkModeToggleProps {
  className?: string;
}

export function DarkModeToggle({ className = '' }: DarkModeToggleProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className={`p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 
               dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${className}`}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}