import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, Activity, Settings, Search, Filter, Loader2, Heart, Shield, FileText } from 'lucide-react';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { User, ActivityLog } from '../types';
import UserManagement from '../components/admin/UserManagement';
import ActivityLogs from '../components/admin/ActivityLogs';
import SecuritySettings from '../components/admin/SecuritySettings';
import BlogManagement from '../components/admin/BlogManagement';
import SecurityMonitoring from '../components/admin/SecurityMonitoring';

type Tab = 'users' | 'blogs' | 'activity' | 'settings' | 'security' | 'blog-management';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [methodFilter, setMethodFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 10;
  const [userFilter, setUserFilter] = useState('all');
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [resetting2FA, setResetting2FA] = useState<string | null>(null);
  const [securityMetrics, setSecurityMetrics] = useState({
    failedLogins: 0,
    activeUsers: 0,
    lockedAccounts: 0,
    mfaEnabled: 0,
    totalUsers: 0,
    lastUpdated: new Date().toISOString()
  });
  const [securitySettings, setSecuritySettings] = useState({
    requireAdminMFA: true,
    passwordExpiryDays: 90,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    sessionTimeoutMinutes: 30,
    rateLimits: {
      default: { windowMs: 900000, maxRequests: 100 },
      auth: { windowMs: 900000, maxRequests: 5 },
      api: { windowMs: 900000, maxRequests: 100 },
      upload: { windowMs: 3600000, maxRequests: 10 }
    }
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    fetchData();
  }, [user, navigate, activeTab, currentPage, statusFilter, methodFilter, userFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setIsSearching(true);
      setIsSearching(true);
      
      // Fetch stats with error handling
      try {
        const statsResponse = await api.get('/admin/stats');
        setStats(statsResponse.data.stats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        toast.error('Failed to load dashboard stats');
        setStats({
          totalUsers: 0,
          totalBlogs: 0,
          totalActivities: 0,
          blogStats: { totalLikes: 0 }
        });
      }

      if (activeTab === 'users') {
        try {
          const { data } = await api.get('/admin/users');
          setUsers(data.users);
        } catch (error) {
          console.error('Failed to fetch users:', error);
          toast.error('Failed to load users');
          setUsers([]);
        }
      } else if (activeTab === 'activity') {
        try {
          const { data } = await api.get('/admin/activity', {
            timeout: 10000, // 10 second timeout for logs
            // timeout: 10000, // 10 second timeout for logs
            params: {
              page: currentPage,
              limit: logsPerPage,
              status: statusFilter !== 'all' ? statusFilter : undefined,
              method: methodFilter !== 'all' ? methodFilter.toUpperCase() : undefined,
              userId: userFilter !== 'all' ? userFilter : undefined,
              search: searchTerm.trim() || undefined
            }
          });
          setActivityLogs(data.logs);
          setTotalPages(data.pagination.pages);
          setTotalLogs(data.pagination.total);
        } catch (error) {
          console.error('Failed to fetch activity logs:', error);
          toast.error('Failed to load activity logs');
          setActivityLogs([]);
          setTotalPages(1);
          setTotalLogs(0);
          setTotalPages(1);
          setTotalLogs(0);
        }
      } else if (activeTab === 'blog-management') {
        try {
          const { data } = await api.get('/admin/blogs');
          setBlogs(data.blogs);
        } catch (error) {
          console.error('Failed to fetch blogs:', error);
          toast.error('Failed to load blogs');
          setBlogs([]);
        }
      } else if (activeTab === 'security') {
        try {
          const { data } = await api.get('/admin/security/metrics');
          if (data.metrics) {
            setSecurityMetrics(data.metrics);
          } else {
            throw new Error('Invalid metrics data');
          }
        } catch (error) {
          console.error('Failed to fetch security metrics:', error);
          toast.error('Failed to load security metrics');
          setSecurityMetrics(prev => ({
            ...prev,
            failedLogins: 0,
            activeUsers: 0,
            lockedAccounts: 0,
            mfaEnabled: 0,
            totalUsers: 0,
            lastUpdated: new Date().toISOString()
          }));
        }
      } else if (activeTab === 'settings') {
        try {
          const { data } = await api.get('/security/settings');
          setSecuritySettings(data.settings);
        } catch (error) {
          console.error('Failed to fetch security settings:', error);
          toast.error('Failed to load security settings');
          // Keep existing settings as fallback
        }
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data. Please try again later.');
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      // Reset to first page when search criteria changes
      if (currentPage !== 1) {
        setCurrentPage(1);
        return; // fetchData will be called by useEffect when page changes
      }

      const { data } = await api.get('/admin/activity', {
        timeout: 10000,
        params: {
          page: currentPage,
          limit: logsPerPage,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          method: methodFilter !== 'all' ? methodFilter : undefined,
          userId: userFilter !== 'all' ? userFilter : undefined,
          search: searchTerm.trim() || undefined
        }
      });
      setActivityLogs(data.logs);
      setTotalPages(data.pagination.pages);
      setTotalLogs(data.pagination.total);
    } catch (error) {
      console.error('Failed to search activity logs:', error);
      toast.error('Failed to search activity logs');
    } finally {
      setIsSearching(false);
    }
  };

  const filterData = () => {
    if (activeTab === 'users') {
      return users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return [];
  };

  const filteredData = filterData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage users, monitor activity, and configure system settings.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Users</h3>
          <div className="flex items-center justify-between">
            <Users className="w-8 h-8 text-purple-600" />
            <span className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Blogs</h3>
          <div className="flex items-center justify-between">
            <BookOpen className="w-8 h-8 text-pink-600" />
            <span className="text-3xl font-bold text-gray-900">{stats?.totalBlogs || 0}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Activities</h3>
          <div className="flex items-center justify-between">
            <Activity className="w-8 h-8 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">{stats?.totalActivities || 0}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Likes</h3>
          <div className="flex items-center justify-between">
            <Heart className="w-8 h-8 text-red-600" />
            <span className="text-3xl font-bold text-gray-900">{stats?.blogStats?.totalLikes || 0}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg mb-8">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center px-6 py-4 border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-5 h-5 mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('blog-management')}
            className={`flex items-center px-6 py-4 border-b-2 transition-colors ${
              activeTab === 'blog-management'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-5 h-5 mr-2" />
            Blogs
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center px-6 py-4 border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Activity className="w-5 h-5 mr-2" />
            Activity Logs
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center px-6 py-4 border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="w-5 h-5 mr-2" />
            Security
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center px-6 py-4 border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="w-5 h-5 mr-2" />
            Settings
          </button>
        </div>

        {/* Search and Filters */}
        {activeTab !== 'settings' && (
          <div className="p-4 border-b">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Search
                      </>
                    )}
                  </button>
                </div>
              </div>
              {activeTab === 'activity' && (
                <div className="relative">
                  <div className="flex gap-4">
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="all">All Status</option>
                        <option value="success">Success</option>
                        <option value="failure">Failure</option>
                      </select>
                    </div>
                    
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        value={methodFilter}
                        onChange={(e) => setMethodFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="all">All Methods</option>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                        <option value="OPTIONS">OPTIONS</option>
                        <option value="HEAD">HEAD</option>
                      </select>
                    </div>
                    
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="all">All Users</option>
                        {users.map(user => (
                          <option key={user._id} value={user._id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {activeTab === 'users' && (
            <UserManagement 
              users={filteredData as User[]} 
              setUsers={setUsers}
              resetting2FA={resetting2FA}
              setResetting2FA={setResetting2FA}
            />
          )}

          {activeTab === 'blog-management' && (
            <BlogManagement blogs={blogs} setBlogs={setBlogs} />
          )}

          {activeTab === 'activity' && (
            <ActivityLogs 
              logs={activityLogs}
              currentPage={currentPage}
              totalPages={totalPages}
              totalLogs={totalLogs}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo(0, 0);
              }}
            />
          )}
          
          {activeTab === 'security' && (
            <SecurityMonitoring metrics={securityMetrics} />
          )}

          {activeTab === 'settings' && (
            <SecuritySettings 
              settings={securitySettings}
              onUpdate={setSecuritySettings}
            />
          )}
        </div>
      </div>
    </main>
  );
}