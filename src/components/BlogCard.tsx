import React from 'react';
import type { Blog } from '../types';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../lib/axios';
import toast from 'react-hot-toast';

interface BlogCardProps {
  blog: Blog;
  onLike?: () => void;
  onDelete?: () => void;
}

export default function BlogCard({ blog, onLike, onDelete }: BlogCardProps) {
  const { user } = useAuth();
  const [commentCount, setCommentCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCommentCount();
  }, [blog._id]);

  const fetchCommentCount = async () => {
    try {
      const { data } = await api.get(`/blogs/${blog._id}/comments`);
      setCommentCount(data.comments.length);
    } catch (error) {
      console.error('Failed to fetch comment count');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/blogs/${blog._id}`);
      toast.success('Blog deleted successfully');
      if (onDelete) onDelete();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete blog');
    }
  };

  const isAuthor = user?._id === blog.author._id;

  return (
    <article className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden 
      hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:bg-white">
      <div
        onClick={() => navigate(`/blogs/${blog._id}`)}
        className="cursor-pointer"
      >
        <img 
          src={blog.coverImage} 
          alt={blog.title}
          className="w-full h-48 object-cover hover:opacity-90 transition-opacity duration-300"
        />
      </div>
      <div className="p-6">
        <div className="flex items-center mb-4">
          <img
            src={blog.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(blog.author.name)}`}
            alt={blog.author.name}
            className="w-10 h-10 rounded-full ring-2 ring-purple-600/20 p-0.5"
          />
          <div className="ml-3">
            <p className="text-sm font-medium text-purple-900">{blog.author.name}</p>
            <p className="text-sm text-gray-500">
              {new Date(blog.createdAt).toLocaleDateString()} · {blog.readTime} min read
            </p>
          </div>
        </div>
        <Link 
          to={`/blogs/${blog._id}`}
          className="text-xl font-semibold text-gray-900 hover:text-purple-600 transition-colors duration-200 block mb-2"
        >
          {blog.title}
        </Link>
        <p className="text-gray-600 line-clamp-3">
          {blog.content.replace(/<[^>]*>/g, '')}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex space-x-2">
            {blog.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button
                  onClick={onLike}
                  className="flex items-center gap-1 text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  {blog.likes}
                </button>
                {isAuthor && (
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      to={`/edit/${blog._id}`}
                      className="text-gray-600 hover:text-purple-600 transition-colors"
                      title="Edit blog"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={handleDelete}
                      className="text-gray-600 hover:text-red-600 transition-colors"
                      title="Delete blog"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                to={`/blogs/${blog._id}`}
                className="flex items-center gap-1 text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors"
              >
                <Heart className="w-4 h-4" />
                {blog.likes}
              </Link>
            )}
            <Link
              to={`/blogs/${blog._id}#comments`}
              className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              {commentCount}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}