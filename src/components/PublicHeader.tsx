import React from 'react';
import { PenSquare, LogIn, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicHeader() {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <PenSquare className="h-8 w-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600" />
              <span className="ml-2 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Code & Compass
              </span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            {user ? (
              <Link to="/dashboard" className="text-gray-700 hover:text-purple-600 transition-colors duration-200">
                Dashboard
              </Link>
            ) : (
              <Link to="/" className="text-gray-700 hover:text-purple-600 transition-colors duration-200">
                Home
              </Link>
            )}
            <Link to="/blogs" className="text-gray-700 hover:text-purple-600 transition-colors duration-200">
              Explore
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-purple-600 transition-colors duration-200">
              About
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="flex items-center space-x-2">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full ring-2 ring-purple-600 p-0.5"
                  />
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </Link>
                <Link to="/write" className="btn-primary">
                  <PenSquare className="w-4 h-4 mr-1" />
                  Write
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="hidden md:flex items-center btn-primary"
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden md:flex items-center btn-secondary"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}