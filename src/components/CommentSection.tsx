import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

interface CommentSectionProps {
  blogId: string;
}

interface CommentForm {
  content: string;
}

export default function CommentSection({ blogId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CommentForm>();
  const commentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchComments();
  }, [blogId]);

  useEffect(() => {
    // Scroll to comments if URL has #comments
    if (window.location.hash === '#comments' && commentRef.current) {
      commentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/blogs/${blogId}/comments`);
      setComments(data.comments);
    } catch (error) {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CommentForm) => {
    try {
      const response = await api.post(`/blogs/${blogId}/comments`, data);
      setComments([response.data.comment, ...comments]);
      reset();
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await api.delete(`/blogs/${blogId}/comments/${commentId}`);
      setComments(comments.filter(comment => comment._id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-gray-100 rounded-lg"></div>
        <div className="h-20 bg-gray-100 rounded-lg"></div>
        <div className="h-20 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div id="comments" ref={commentRef} className="space-y-6">
      <h3 className="text-2xl font-semibold flex items-center gap-2">
        <MessageSquare className="w-6 h-6" />
        Comments ({comments.length})
      </h3>

      {user ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <textarea
              {...register('content', {
                required: 'Comment cannot be empty',
                maxLength: {
                  value: 1000,
                  message: 'Comment is too long'
                }
              })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all resize-none"
              rows={4}
              placeholder="Share your thoughts..."
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>
          <button
            type="submit"
            className="btn-primary"
          >
            Post Comment
          </button>
        </form>
      ) : (
        <div className="bg-gray-50 p-4 rounded-xl text-center">
          <p className="text-gray-600">
            <Link to="/login" className="text-purple-600 hover:text-purple-700">
              sign in
            </Link>
            {' '}to leave a comment.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment._id}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <img
                  src={comment.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}`}
                  alt={comment.author.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-900">{comment.author.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              {(user?._id === comment.author._id || user?.role === 'admin') && (
                <button
                  onClick={() => handleDelete(comment._id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete comment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="mt-4 text-gray-600">{comment.content}</p>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
    </div>
  );
}