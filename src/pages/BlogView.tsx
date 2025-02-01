import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, MessageSquare, Edit, Trash2, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { Blog } from '../types';
import CommentSection from '../components/CommentSection';

export default function BlogView() {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    try {
      const { data } = await api.get(`/blogs/${id}`);
      setBlog(data.blog);
    } catch (error: any) {
      toast.error('Failed to fetch blog');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast('Please login to like this blog', {
        icon: '👋',
        duration: 4000,
        action: {
          label: 'Login',
          onClick: () => window.location.href = '/login'
        }
      });
      return;
    }

    try {
      const { data } = await api.post(`/blogs/${id}/like`);
      setBlog(prev => prev ? { ...prev, likes: data.likes } : null);
      toast.success('Blog liked!');
    } catch (error: any) {
      toast.error('Failed to like blog');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/blogs/${id}`);
      toast.success('Blog deleted successfully');
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast.error('Failed to delete blog');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading blog...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Blog not found</p>
          <Link to="/dashboard" className="text-purple-600 hover:text-purple-700 mt-4 inline-block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isAuthor = user?._id === blog.author._id;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
      {/* Back Button */}
      <Link
        to="/dashboard"
        className="inline-flex items-center text-gray-600 hover:text-purple-600 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      {/* Cover Image */}
      <img
        src={blog.coverImage}
        alt={blog.title}
        className="w-full aspect-video object-cover rounded-2xl mb-8"
      />

      {/* Blog Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <img
              src={blog.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(blog.author.name)}`}
              alt={blog.author.name}
              className="w-12 h-12 rounded-full ring-2 ring-purple-600/20 p-0.5"
            />
            <div className="ml-4">
              <h3 className="font-medium text-gray-900">{blog.author.name}</h3>
              <div className="text-sm text-gray-500">
                {new Date(blog.createdAt).toLocaleDateString()} · {blog.readTime} min read
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              disabled={!user}
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${
                user 
                  ? 'text-pink-600 hover:text-pink-700 cursor-pointer' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title={user ? 'Like this blog' : 'Login to like this blog'}
            >
              <Heart className="w-5 h-5" />
              <span>{blog.likes}</span>
            </button>
            <a
              href="#comments"
              className="flex items-center gap-1 text-gray-600 hover:text-purple-600 transition-colors"
              title="View comments"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Comments</span>
            </a>
            {isAuthor && (
              <div className="flex items-center gap-2">
                <Link
                  to={`/edit/${blog._id}`}
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                  title="Edit blog"
                >
                  <Edit className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleDelete}
                  className="text-gray-600 hover:text-red-600 transition-colors"
                  title="Delete blog"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {blog.title}
        </h1>

        <div className="flex flex-wrap gap-2 mb-8">
          {blog.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-sm font-medium text-purple-600 bg-purple-100 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Blog Content */}
      <div 
        className="prose prose-lg max-w-none mb-16"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      {/* Comments Section */}
      <CommentSection blogId={blog._id} />
    </main>
  );
}