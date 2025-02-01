import React from 'react';
import { PenSquare, LogOut, BookOpen, Home, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 relative">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <PenSquare className="h-8 w-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600" />
              <span className="ml-2 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Code & Compass
              </span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-purple-600 transition-colors duration-200">Home</Link>
            <Link 
              to="/dashboard" 
              className={`flex items-center text-gray-700 hover:text-purple-600 transition-colors duration-200 ${
                location.pathname === '/dashboard' ? 'text-purple-600' : ''
              }`}
            >
              <Home className="w-4 h-4 mr-1" />
              Dashboard
            </Link>
            <Link 
              to="/blogs" 
              className={`flex items-center text-gray-700 hover:text-purple-600 transition-colors duration-200 ${
                location.pathname === '/blogs' ? 'text-purple-600' : ''
              }`}
            >
              <BookOpen className="w-4 h-4 mr-1" />
              Explore
            </Link>
            <Link 
              to="/write" 
              className={`flex items-center text-gray-700 hover:text-purple-600 transition-colors duration-200 ${
                location.pathname === '/write' ? 'text-purple-600' : ''
              }`}
            >
              <PenSquare className="w-4 h-4 mr-1" />
              Write
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <Link to="/profile" className="flex items-center space-x-2">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}`}
                  alt={user?.name}
                  className="w-10 h-10 rounded-full ring-2 ring-purple-600 p-0.5"
                />
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden md:block">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}