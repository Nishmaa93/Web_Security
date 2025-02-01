import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenSquare, Filter, Search, BookOpen, User } from 'lucide-react';
import BlogCard from '../components/BlogCard';
import { Blog } from '../types';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

interface UserHomeProps {
  defaultTab?: 'my' | 'public';
}

export default function UserHome({ defaultTab = 'my' }: UserHomeProps) {
  const [myBlogs, setMyBlogs] = useState<Blog[]>([]);
  const [publicBlogs, setPublicBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'public'>(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const [myBlogsResponse, publicBlogsResponse] = await Promise.all([
        api.get('/blogs/my'),
        api.get('/blogs')
      ]);
      
      setMyBlogs(myBlogsResponse.data.blogs);
      setPublicBlogs(publicBlogsResponse.data.blogs);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (blogId: string) => {
    try {
      const { data } = await api.post(`/blogs/${blogId}/like`);
      const updateBlogLikes = (blogs: Blog[]) =>
        blogs.map(blog => blog._id === blogId ? { ...blog, likes: data.likes } : blog);
      
      setMyBlogs(updateBlogLikes);
      setPublicBlogs(updateBlogLikes);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to like blog');
    }
  };

  const handleDelete = async (blogId: string) => {
    setMyBlogs(blogs => blogs.filter(blog => blog._id !== blogId));
    setPublicBlogs(blogs => blogs.filter(blog => blog._id !== blogId));
  };

  const filterBlogs = (blogs: Blog[]) => {
    return blogs.filter(blog => {
      const matchesSearch = searchTerm === '' || 
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTag = selectedTag === '' || blog.tags.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    });
  };

  const getAllTags = () => {
    const tags = new Set<string>();
    [...myBlogs, ...publicBlogs].forEach(blog => {
      blog.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
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

  const filteredMyBlogs = filterBlogs(myBlogs);
  const filteredPublicBlogs = filterBlogs(publicBlogs);
  const allTags = getAllTags();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-gray-600">
              Explore your stories and discover what others are writing about.
            </p>
          </div>
          <Link to="/write" className="btn-primary whitespace-nowrap">
            <PenSquare className="w-5 h-5 mr-2" />
            Write a Story
          </Link>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="pl-10 pr-8 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('my')}
              className={`flex items-center px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'my'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-5 h-5 mr-2" />
              My Stories ({filteredMyBlogs.length})
            </button>
            <button
              onClick={() => setActiveTab('public')}
              className={`flex items-center px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'public'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Public Stories ({filteredPublicBlogs.length})
            </button>
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
        {(activeTab === 'my' ? filteredMyBlogs : filteredPublicBlogs).map((blog) => (
          <BlogCard 
            key={blog._id} 
            blog={blog}
            onLike={() => handleLike(blog._id)}
            onDelete={() => handleDelete(blog._id)}
          />
        ))}
      </div>

      {/* Empty States */}
      {activeTab === 'my' && filteredMyBlogs.length === 0 && (
        <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Stories Yet</h3>
          <p className="text-gray-600 mb-6">Start sharing your knowledge with the community!</p>
          <Link to="/write" className="btn-primary inline-flex">
            <PenSquare className="w-5 h-5 mr-2" />
            Write Your First Story
          </Link>
        </div>
      )}

      {activeTab === 'public' && filteredPublicBlogs.length === 0 && (
        <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Stories Found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </main>
  );
}