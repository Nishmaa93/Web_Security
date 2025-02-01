import React, { useState } from 'react';
import { Blog } from '../../types';
import { Edit, Trash2, Eye, Search, Filter, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

interface BlogManagementProps {
  blogs: Blog[];
  setBlogs: (blogs: Blog[]) => void;
}

export default function BlogManagement({ blogs, setBlogs }: BlogManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [deletingBlog, setDeletingBlog] = useState<string | null>(null);

  // Get unique tags and authors for filters
  const uniqueTags = Array.from(new Set(blogs.flatMap(blog => blog.tags)));
  const uniqueAuthors = Array.from(new Set(blogs.map(blog => blog.author.name)));

  const handleDelete = async (blogId: string) => {
    try {
      setDeletingBlog(blogId);
      await api.delete(`/admin/blogs/${blogId}`);
      setBlogs(blogs.filter(blog => blog._id !== blogId));
      toast.success('Blog deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete blog');
    } finally {
      setDeletingBlog(null);
    }
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = 
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !selectedTag || blog.tags.includes(selectedTag);
    const matchesAuthor = !selectedAuthor || blog.author.name === selectedAuthor;
    
    return matchesSearch && matchesTag && matchesAuthor;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 appearance-none bg-white"
          >
            <option value="">All Tags</option>
            {uniqueTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 appearance-none bg-white"
          >
            <option value="">All Authors</option>
            {uniqueAuthors.map(author => (
              <option key={author} value={author}>{author}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Blog List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredBlogs.map((blog) => (
          <div key={blog._id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <img
                    src={blog.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(blog.author.name)}`}
                    alt={blog.author.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{blog.author.name}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(blog.createdAt).toLocaleDateString()} · {blog.readTime} min read
                    </p>
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{blog.title}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {blog.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm font-medium text-purple-600 bg-purple-100 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-gray-600 line-clamp-2">
                  {blog.content.replace(/<[^>]*>/g, '')}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Link
                  to={`/blogs/${blog._id}`}
                  className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
                  title="View blog"
                >
                  <Eye className="w-5 h-5" />
                </Link>
                <Link
                  to={`/edit/${blog._id}`}
                  className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
                  title="Edit blog"
                >
                  <Edit className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => {
                    const modal = document.createElement('div');
                    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                    modal.innerHTML = `
                      <div class="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 class="text-lg font-semibold mb-4">Delete Blog</h3>
                        <p class="text-gray-600 mb-6">Are you sure you want to delete this blog? This action cannot be undone.</p>
                        <div class="flex justify-end gap-4">
                          <button class="px-4 py-2 text-gray-600 hover:text-gray-800" onclick="this.closest('.fixed').remove(); window.deleteConfirmed(false)">Cancel</button>
                          <button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700" onclick="this.closest('.fixed').remove(); window.deleteConfirmed(true)">Delete</button>
                        </div>
                      </div>
                    `;
                    document.body.appendChild(modal);
                    window.deleteConfirmed = (confirmed: boolean) => {
                      if (confirmed) {
                        handleDelete(blog._id);
                      }
                    };
                  }}
                  disabled={deletingBlog === blog._id}
                  className={`p-2 text-gray-600 hover:text-red-600 transition-colors ${
                    deletingBlog === blog._id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="Delete blog"
                >
                  {deletingBlog === blog._id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredBlogs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-600">No blogs found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}