import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenSquare, Search, Filter } from 'lucide-react';
import BlogCard from '../components/BlogCard';
import { Blog } from '../types';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PublicHome() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we should redirect to login
    if (location.state?.showLogin) {
      navigate('/login');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data } = await api.get('/blogs');
      setBlogs(data.blogs);
    } catch (error: any) {
      toast.error('Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  const getPopularBlogs = () => {
    return [...blogs].sort((a, b) => b.likes - a.likes).slice(0, 3);
  };

  const getRecentBlogs = () => {
    return [...blogs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const getFeaturedBlogs = () => {
    // For demo, let's consider blogs with more than 5 likes as featured
    return blogs.filter(blog => blog.likes > 5).slice(0, 3);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
          Welcome to Code & Compass
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Your destination for coding tutorials, tech insights, and developer resources.
          Join our community of passionate developers.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/register" className="btn-primary">
            <PenSquare className="w-5 h-5 mr-2" />
            Start Writing
          </Link>
          <Link to="/login" className="btn-secondary">
            Join Community
          </Link>
        </div>
      </section>

      {/* Featured Blogs */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Featured Stories</h2>
          <Link to="/explore" className="text-purple-600 hover:text-pink-600 transition-colors">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {getFeaturedBlogs().map((blog) => (
            <BlogCard key={blog._id} blog={blog} />
          ))}
        </div>
      </section>

      {/* Popular Blogs */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Most Popular</h2>
          <Link to="/explore" className="text-purple-600 hover:text-pink-600 transition-colors">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {getPopularBlogs().map((blog) => (
            <BlogCard key={blog._id} blog={blog} />
          ))}
        </div>
      </section>

      {/* Recent Blogs */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Recently Published</h2>
          <Link to="/explore" className="text-purple-600 hover:text-pink-600 transition-colors">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {getRecentBlogs().map((blog) => (
            <BlogCard key={blog._id} blog={blog} />
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Share Your Story?</h2>
        <p className="mb-6 text-white/90">Join our community and start sharing your knowledge today.</p>
        <Link to="/register" className="inline-block px-8 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105">
          Get Started
        </Link>
      </section>

      {/* Empty State - Show only if no blogs at all */}
      {blogs.length === 0 && (
        <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Code & Compass!</h3>
          <p className="text-gray-600">Be the first to share your story with our community.</p>
        </div>
      )}
    </main>
  );
}