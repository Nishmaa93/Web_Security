import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenSquare } from 'lucide-react';
import BlogCard from '../components/BlogCard';
import { Blog } from '../types';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleLike = async (blogId: string) => {
    if (!user) return;
    
    try {
      const { data } = await api.post(`/blogs/${blogId}/like`);
      setBlogs(blogs.map(blog => 
        blog._id === blogId ? { ...blog, likes: data.likes } : blog
      ));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to like blog');
    }
  };

  const fetchBlogs = async () => {
    try {
      const { data } = await api.get('/blogs');
      setBlogs(data.blogs);
    } catch (error: any) {
      // Don't show error for unauthenticated state
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'Failed to fetch blogs');
      }
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-12"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 flex-grow">
      <section className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Welcome to Code & Compass
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl">
              Discover the latest in programming, technology, and development. Join our community of developers.
            </p>
          </div>
          {user && (
            <Link
              to="/write"
              className="btn-primary whitespace-nowrap"
            >
              <PenSquare className="w-5 h-5 mr-2" />
              Write a Story
            </Link>
          )}
        </div>
      </section>
      
      {blogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
          {blogs.map((blog) => (
            <BlogCard 
              key={blog._id} 
              blog={blog}
              onLike={() => handleLike(blog._id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl">
          <p className="text-gray-600 text-xl mb-6">No stories yet. Be the first to share one!</p>
          {user && (
            <Link
              to="/write"
              className="btn-primary inline-flex"
            >
              <PenSquare className="w-5 h-5 mr-2" />
              Start Writing
            </Link>
          )}
        </div>
      )}
    </main>
  );
}