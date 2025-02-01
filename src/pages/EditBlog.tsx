import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Image as ImageIcon, Loader2, AlertTriangle } from 'lucide-react';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { uploadFile } from '../utils/fileUpload';
import { QuillModules, QuillFormats } from '../utils/editorConfig';
import { DeltaStatic } from 'quill';
import { Blog } from '../types';

interface BlogForm {
  title: string;
  tags: string;
  coverImage: FileList;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_TITLE_LENGTH = 100;
const MAX_TAGS = 5;

export default function EditBlog() {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  const [uploadedCoverUrl, setUploadedCoverUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<BlogForm>();

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    try {
      const { data } = await api.get(`/blogs/${id}`);
      setBlog(data.blog);
      setContent(data.blog.content);
      setValue('title', data.blog.title);
      setValue('tags', data.blog.tags.join(', '));
      setCoverImagePreview(data.blog.coverImage);
      setUploadedCoverUrl(data.blog.coverImage);
      setLoading(false);
    } catch (error: any) {
      toast.error('Failed to fetch blog');
      navigate('/dashboard');
    }
  };

  const handleEditorChange = (content: string, delta: DeltaStatic, source: string, editor: any) => {
    setContent(content);
    
    const chars = editor.getLength() - 1;
    setCharCount(chars);
    
    const text = editor.getText();
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
    
    const minutes = Math.ceil(words / 200);
    setReadingTime(minutes);
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.dismiss();
      setUploadError('No file selected');
      setValue('coverImage', null as any);
      setCoverImagePreview(blog?.coverImage || '');
      setUploadedCoverUrl(blog?.coverImage || null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.dismiss();
      setUploadError('Image size should be less than 5MB');
      toast.error('Image size should be less than 5MB');
      setValue('coverImage', null as any);
      setCoverImagePreview(blog?.coverImage || '');
      setUploadedCoverUrl(blog?.coverImage || null);
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.dismiss();
      setUploadError('Only JPEG, PNG and WebP images are allowed');
      toast.error('Only JPEG, PNG and WebP images are allowed');
      setValue('coverImage', null as any);
      setCoverImagePreview(blog?.coverImage || '');
      setUploadedCoverUrl(blog?.coverImage || null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const toastId = toast.loading('Uploading cover image...');
      setUploadError(null);
      const url = await uploadFile(file, 'cover-');
      if (url) {
        setUploadedCoverUrl(url);
        setValue('coverImage', e.target.files as any, { shouldValidate: true });
        toast.dismiss(toastId);
        toast.success('Cover image uploaded successfully');
      }
    } catch (error) {
      console.error('Cover image upload error:', error);
      setUploadError('Failed to upload image');
      toast.dismiss();
      toast.error('Failed to upload cover image. Please try again.');
      setValue('coverImage', null as any);
      setCoverImagePreview(blog?.coverImage || '');
      setUploadedCoverUrl(blog?.coverImage || null);
    }
  };

  const onSubmit = async (data: BlogForm) => {
    let toastId: string | undefined;
    
    try {
      setIsSubmitting(true);
      toastId = toast.loading('Updating blog...');

      const trimmedContent = content.trim();
      if (!trimmedContent || trimmedContent === '<p><br></p>') {
        toast.error('Please add some content to your blog');
        toast.dismiss(toastId);
        setIsSubmitting(false);
        return;
      }

      const tags = data.tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      if (tags.length > MAX_TAGS) {
        toast.dismiss(toastId);
        setIsSubmitting(false);
        toast.error(`Please use ${MAX_TAGS} tags or fewer`);
        return;
      }

      if (tags.length === 0) {
        toast.dismiss(toastId);
        setIsSubmitting(false);
        toast.error('Please add at least one tag');
        return;
      }

      const blogData = {
        title: data.title,
        content: trimmedContent,
        coverImage: uploadedCoverUrl,
        tags
      };

      await api.put(`/blogs/${id}`, blogData);
      toast.dismiss(toastId);
      toast.success('Blog updated successfully!');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate('/dashboard');
    } catch (error: any) {
      if (toastId) toast.dismiss(toastId);
      
      const errorMessage = error.response?.data?.message || 'Failed to update blog. Please try again.';
      toast.error(errorMessage);
      
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err: any) => {
          toast.error(err.message);
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      return;
    }

    try {
      const toastId = toast.loading('Deleting blog...');
      await api.delete(`/blogs/${id}`);
      toast.dismiss(toastId);
      toast.success('Blog deleted successfully');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete blog');
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
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Title */}
        <div>
          <input
            {...register('title', {
              required: 'Title is required',
              maxLength: {
                value: MAX_TITLE_LENGTH,
                message: `Title cannot exceed ${MAX_TITLE_LENGTH} characters`
              }
            })}
            type="text"
            placeholder="Enter your title"
            className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder-gray-400"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image
          </label>
          <div className="relative">
            <input
              {...register('coverImage', {
                required: false
              })}
              type="file"
              accept="image/*"
              onChange={handleCoverImageChange}
              className="hidden"
              id="cover-image"
            />
            <label
              htmlFor="cover-image"
              className={`cursor-pointer block w-full aspect-video rounded-xl border-2 border-dashed transition-colors ${
                errors.coverImage ? 'border-red-500' : 'border-gray-300 hover:border-purple-500'
              }`}
            >
              {coverImagePreview ? (
                <div className="relative group">
                  <img
                    src={coverImagePreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                    <p className="text-white">Change Cover Image</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <ImageIcon className="w-12 h-12 mb-4" />
                  <p>Click to upload cover image</p>
                  <p className="text-sm">JPEG, PNG, WebP up to 5MB</p>
                </div>
              )}
            </label>
            {uploadError && (
              <p className="mt-1 text-sm text-red-600">{uploadError}</p>
            )}
          </div>
        </div>

        {/* Quill Editor */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={handleEditorChange}
            modules={QuillModules}
            formats={QuillFormats}
            placeholder="Write your story here..."
            className="h-[400px] mb-12"
          />
          <div className="flex justify-between items-center px-4 py-2 text-sm text-gray-500 border-t">
            <div className="flex items-center gap-4">
              <span>{charCount} characters</span>
              <span>{wordCount} words</span>
              <span>{readingTime} min read</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma separated)
          </label>
          <input
            {...register('tags', {
              required: 'At least one tag is required',
              validate: value => 
                value.split(',').filter(tag => tag.trim()).length <= MAX_TAGS ||
                `Maximum ${MAX_TAGS} tags are allowed`
            })}
            type="text"
            placeholder="e.g., programming, javascript, web-development"
            className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          {errors.tags && (
            <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handleDelete}
            className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            Delete Blog
          </button>
          
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`btn-primary flex items-center ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Blog'
              )}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}