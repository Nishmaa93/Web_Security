import express from 'express';
import { z } from 'zod';
import Blog from '../models/Blog.js';
import Comment from '../models/Comment.js';
import { auth as authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get user's blogs
router.get('/my', authMiddleware.required, async (req, res, next) => {
  try {
    const blogs = await Blog.find({ author: req.user._id })
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 });
    
    res.json({ blogs });
  } catch (error) {
    next(error);
  }
});

const blogSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  coverImage: z.string().min(1),
  tags: z.array(z.string()).min(1)
});

// Public routes - no auth required
router.get('/', authMiddleware.optional, async (req, res, next) => {
  try {
    const blogs = await Blog.find()
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 });
    
    // If user is authenticated, include user-specific data
    const blogsWithUserData = blogs.map(blog => {
      const blogObj = blog.toObject();
      if (req.user) {
        // Add user-specific data here if needed
        // Example: blogObj.hasLiked = blog.likes.includes(req.user._id);
      }
      return blogObj;
    });
    
    res.json({ 
      blogs: blogsWithUserData,
      isAuthenticated: !!req.user
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authMiddleware.optional, async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name email avatar');
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    const blogObj = blog.toObject();
    if (req.user) {
      // Add user-specific data here if needed
    }
    
    res.json({ 
      blog: blogObj,
      isAuthenticated: !!req.user
    });
  } catch (error) {
    next(error);
  }
});

// Get blog comments
router.get('/:id/comments', async (req, res, next) => {
  try {
    const comments = await Comment.find({ blog: req.params.id })
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 });
    
    res.json({ comments });
  } catch (error) {
    next(error);
  }
});

// Add comment
router.post('/:id/comments', authMiddleware.required, async (req, res, next) => {
  try {
    const { content } = z.object({
      content: z.string().min(1).max(1000)
    }).parse(req.body);

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const comment = await Comment.create({
      content,
      blog: blog._id,
      author: req.user._id
    });

    await comment.populate('author', 'name email avatar');
    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
});

// Delete comment
router.delete('/:blogId/comments/:commentId', authMiddleware.required, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
});

// Create blog
router.post('/', authMiddleware.required, async (req, res, next) => {
  try {
    if (!req.body.title || !req.body.content || !req.body.tags) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Set default cover image if not provided
    const blogData = {
      ...req.body,
      coverImage: req.body.coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80'
    };

    const validatedData = blogSchema.parse(blogData);
    
    // Calculate read time
    const wordsPerMinute = 200;
    const wordCount = validatedData.content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);

    // Create blog document
    const blog = await Blog.create({
      title: validatedData.title,
      content: validatedData.content,
      coverImage: validatedData.coverImage,
      tags: validatedData.tags,
      author: req.user._id,
      readTime
    });
    
    await blog.populate('author', 'name email avatar');

    res.status(201).json({ blog });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid blog data', 
        errors: error.errors 
      });
    }

    next(error);
  }
});

// Update blog
router.put('/:id', authMiddleware.required, async (req, res, next) => {
  try {
    const blogData = blogSchema.parse(req.body);
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    Object.assign(blog, blogData);
    await blog.save();
    await blog.populate('author', 'name email avatar');
    
    res.json({ blog });
  } catch (error) {
    next(error);
  }
});

// Delete blog
router.delete('/:id', authMiddleware.required, async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await blog.deleteOne();
    res.json({ message: 'Blog deleted' });
  } catch (error) {
    next(error);
  }
});

// Like blog
router.post('/:id/like', authMiddleware.required, async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    blog.likes += 1;
    await blog.save();
    
    res.json({ likes: blog.likes });
  } catch (error) {
    next(error);
  }
});

export default router;