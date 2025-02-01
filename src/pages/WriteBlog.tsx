import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Quote, 
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  X,
  Loader2
} from 'lucide-react';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { uploadFile } from '../utils/fileUpload';
import { QuillModules, QuillFormats } from '../utils/editorConfig';
import { DeltaStatic } from 'quill';

interface BlogForm {
  title: string;
  tags: string;
  coverImage: FileList;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_TITLE_LENGTH = 100;
const MAX_TAGS = 5;

export default function WriteBlog() {
  const [content, setContent] = useState('');
  const [editorKey, setEditorKey] = useState(Date.now());
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  const [uploadedCoverUrl, setUploadedCoverUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<BlogForm>();

  const coverImage = watch('coverImage');

  const handleEditorChange = (content: string, delta: DeltaStatic, source: string, editor: any) => {
    setContent(content);
    
    // Update character count
    const chars = editor.getLength() - 1; // -1 for trailing newline
    setCharCount(chars);
    
    // Update word count
    const text = editor.getText();
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
    
    // Update reading time (assuming average reading speed of 200 words per minute)
    const minutes = Math.ceil(words / 200);
    setReadingTime(minutes);
  };
  const handleImageUpload = async (file: File): Promise<string> => {
    return uploadFile(file, 'blog-');
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.dismiss();
      setUploadError('No file selected');
      setValue('coverImage', null as any);
      setCoverImagePreview('');
      setUploadedCoverUrl(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.dismiss();
      setUploadError('Image size should be less than 5MB');
      toast.error('Image size should be less than 5MB');
      setValue('coverImage', null as any);
      setCoverImagePreview('');
      setUploadedCoverUrl(null);
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.dismiss();
      setUploadError('Only JPEG, PNG and WebP images are allowed');
      toast.error('Only JPEG, PNG and WebP images are allowed');
      setValue('coverImage', null as any);
      setCoverImagePreview('');
      setUploadedCoverUrl(null);
      return;
    }

    // Create local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
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
      setCoverImagePreview('');
      setUploadedCoverUrl(null);
    }
  };

  const onSubmit = async (data: BlogForm) => {
    let toastId: string | undefined;
    console.log('Starting blog submission...');
    
    try {
      setIsSubmitting(true);
      toastId = toast.loading('Publishing your blog...');

      // Validate content
      const trimmedContent = content.trim();
      if (!trimmedContent || trimmedContent === '<p><br></p>') {
        console.log('Empty content detected');
        toast.error('Please add some content to your blog');
        toast.dismiss(toastId);
        setIsSubmitting(false);
        return;
      }

      // Validate and process tags
      const tags = data.tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      if (tags.length > MAX_TAGS) {
        console.log('Too many tags:', tags.length);
        toast.dismiss(toastId);
        setIsSubmitting(false);
        toast.error(`Please use ${MAX_TAGS} tags or fewer`);
        return;
      }

      if (tags.length === 0) {
        console.log('No tags provided');
        toast.dismiss(toastId);
        setIsSubmitting(false);
        toast.error('Please add at least one tag');
        return;
      }

      // Prepare blog data
      console.log('Preparing blog data...');
      const blogData = {
        title: data.title,
        content: trimmedContent,
        coverImage: uploadedCoverUrl,
        tags
      };
      console.log('Blog data prepared:', { title: blogData.title, contentLength: blogData.content.length, tags: blogData.tags });

      // Submit blog
      await api.post('/blogs', blogData);
      toast.dismiss(toastId);
      toast.success('Blog published successfully!');
      
      // Short delay before navigation
      console.log('Blog published, preparing to navigate...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Blog publish error:', error);
      if (toastId) toast.dismiss(toastId);
      
      const errorMessage = error.response?.data?.message || 'Failed to publish blog. Please try again.';
      console.error('Blog publish error:', { error: error.response?.data, message: errorMessage });
      toast.error(errorMessage);
      
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err: any) => {
          toast.error(err.message);
        });
      }
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" encType="multipart/form-data">
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
            Cover Image (Optional)
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
            {errors.coverImage && !uploadedCoverUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.coverImage.message}</p>
            )}
          </div>
        </div>

        {/* Quill Editor */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <ReactQuill
            key={editorKey}
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
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span>Markdown supported</span>
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

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
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
              isSubmitting ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish Blog'
            )}
          </button>
        </div>
      </form>
    </main>
  );
}