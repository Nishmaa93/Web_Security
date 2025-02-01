import React, { useState, useEffect } from 'react';
import { 
  PenSquare, 
  LogIn, 
  UserPlus, 
  LogOut, 
  BookOpen, 
  Home, 
  Bell,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu || showNotifications || isMenuOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-menu') && !target.closest('.notifications-menu')) {
          setShowUserMenu(false);
          setShowNotifications(false);
          setIsMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showNotifications, isMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setShowUserMenu(false);
    setShowNotifications(false);
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getNavLinks = () => {
    if (user) {
      return [
        {
          to: '/dashboard',
          icon: <Home className="w-4 h-4" />,
          label: 'Dashboard'
        },
        {
          to: '/explore',
          icon: <BookOpen className="w-4 h-4" />,
          label: 'Explore'
        },
        {
          to: '/write',
          icon: <PenSquare className="w-4 h-4" />,
          label: 'Write'
        }
      ];
    }
    return [
      {
        to: '/',
        label: 'Home'
      },
      {
        to: '/explore',
        label: 'Explore'
      },
      {
        to: '/about',
        label: 'About'
      }
    ];
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to={user ? "/dashboard" : "/"} 
              className="flex items-center group"
            >
              <PenSquare className="h-8 w-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 
                group-hover:scale-110 transition-transform duration-200" />
              <span className="ml-2 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Code & Compass
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {getNavLinks().map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center text-gray-700 hover:text-purple-600 transition-colors duration-200 ${
                  location.pathname === link.to ? 'text-purple-600' : ''
                }`}
              >
                {link.icon && <span className="mr-1">{link.icon}</span>}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative notifications-menu">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-gray-700 hover:text-purple-600 transition-colors relative"
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                  
                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg py-2 border border-gray-100">
                      {notifications.length > 0 ? (
                        notifications.map((notification, index) => (
                          <div key={index} className="px-4 py-3 hover:bg-gray-50">
                            {/* Notification content */}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-center">
                          No new notifications
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative user-menu">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                      alt={user.name}
                      className="w-10 h-10 rounded-full ring-2 ring-purple-600 p-0.5"
                    />
                    <span className="hidden md:block text-sm font-medium text-gray-700">
                      {user.name}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 border border-gray-100">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                      >
                        Profile Settings
                      </Link>
                      <Link
                        to="/my-blogs"
                        className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                      >
                        My Stories
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
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

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-purple-600 transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-4">
              {getNavLinks().map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center text-gray-700 hover:text-purple-600 transition-colors duration-200 ${
                    location.pathname === link.to ? 'text-purple-600' : ''
                  }`}
                >
                  {link.icon && <span className="mr-2">{link.icon}</span>}
                  {link.label}
                </Link>
              ))}
              {!user && (
                <>
                  <Link
                    to="/login"
                    className="flex items-center text-gray-700 hover:text-purple-600"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center text-gray-700 hover:text-purple-600"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}