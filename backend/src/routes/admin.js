import express from 'express';
import { z } from 'zod';
import { auth as authMiddleware, admin } from '../middleware/auth.js';
import { checkAdminMFA } from '../middleware/security.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Blog from '../models/Blog.js';
import ActivityLog from '../models/ActivityLog.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// Get dashboard stats
router.get('/stats', authMiddleware.required, admin, checkAdminMFA, async (req, res, next) => {
  try {
    // Ensure all promises resolve even if some fail
    const [
      totalUsers,
      totalBlogs,
      totalActivities,
      recentActivities,
      userStats,
      blogStats
    ] = await Promise.allSettled([
      User.countDocuments(),
      Blog.countDocuments(),
      ActivityLog.countDocuments(),
      ActivityLog.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email'),
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),
      Blog.aggregate([
        {
          $group: {
            _id: null,
            totalLikes: { $sum: '$likes' },
            avgReadTime: { $avg: '$readTime' }
          }
        }
      ])
    ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null));

    const formattedStats = {
      totalUsers: totalUsers || 0,
      totalBlogs: totalBlogs || 0,
      totalActivities: totalActivities || 0,
      recentActivities: recentActivities || [],
      userStats: Object.fromEntries((userStats || []).map(stat => [stat._id, stat.count]) || []),
      blogStats: blogStats?.[0] || { totalLikes: 0, avgReadTime: 0 }
    };

    res.json({
      stats: formattedStats
    });

    // Log after successful response
    await logActivity({
      action: 'admin_action',
      status: 'success',
      details: { type: 'stats_access' },
      req,
      user: req.user?._id
    }).catch(console.error); // Prevent logging errors from affecting response

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    await logActivity({
      action: 'admin_action',
      status: 'failure',
      details: { type: 'stats_access', error: error.message },
      req,
      user: req.user?._id
    }).catch(console.error);
    next(error);
  }
});

// Get security metrics
router.get('/security/metrics', authMiddleware.required, admin, checkAdminMFA, async (req, res, next) => {
  try {
    // Get user metrics
    const [
      totalUsers,
      mfaEnabledUsers,
      lockedAccounts,
      activeUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ mfaEnabled: true }),
      User.countDocuments({ $or: [{ accountLocked: true }, { permanentlyLocked: true }] }),
      User.countDocuments({ lastLoginAttempt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
    ]);

    // Get login patterns
    const loginLogs = await ActivityLog.find({
      action: { $in: ['login_success', 'login_failure'] },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    // Calculate login patterns by hour
    const loginPatterns = Array.from({ length: 24 }, (_, hour) => {
      const hourLogs = loginLogs.filter(log => new Date(log.createdAt).getHours() === hour);
      return {
        hour,
        count: hourLogs.length,
        success: hourLogs.filter(log => log.status === 'success').length,
        failure: hourLogs.filter(log => log.status === 'failure').length
      };
    });

    // Get device fingerprints
    const deviceStats = await ActivityLog.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            browser: '$userAgent',
            os: '$platform'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const deviceFingerprints = deviceStats.map(stat => ({
      browser: stat._id.browser || 'Unknown',
      os: stat._id.os || 'Unknown',
      count: stat.count
    }));

    // Mock geo data for demo
    const geoData = [
      { country: 'United States', city: 'New York', count: 150, suspicious: false },
      { country: 'United Kingdom', city: 'London', count: 75, suspicious: false },
      { country: 'Unknown', city: 'Unknown', count: 25, suspicious: true }
    ];

    // Calculate risk factors
    const riskFactors = [
      {
        type: 'Failed Login Rate',
        severity: loginLogs.filter(log => log.status === 'failure').length > 50 ? 'high' : 'medium',
        description: 'High rate of failed login attempts detected'
      },
      {
        type: 'MFA Adoption',
        severity: (mfaEnabledUsers / totalUsers) < 0.5 ? 'high' : 'low',
        description: 'Low MFA adoption rate among users'
      },
      {
        type: 'Account Security',
        severity: lockedAccounts > 10 ? 'high' : 'medium',
        description: 'Multiple accounts currently locked'
      }
    ];

    // Calculate security score
    const securityScore = calculateSecurityScore({
      mfaRate: totalUsers ? (mfaEnabledUsers / totalUsers) * 100 : 0,
      failedLoginRate: loginLogs.length ? loginLogs.filter(log => log.status === 'failure').length / loginLogs.length : 0,
      lockedAccountRate: totalUsers ? (lockedAccounts / totalUsers) * 100 : 0
    });

    const metrics = {
      failedLogins: loginLogs.filter(log => log.status === 'failure').length,
      activeUsers,
      lockedAccounts,
      mfaEnabled: mfaEnabledUsers,
      totalUsers,
      lastUpdated: new Date().toISOString(),
      securityScore,
      deviceFingerprints,
      loginPatterns,
      geoData,
      riskFactors
    };

    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    next(error);
  }
});

function calculateSecurityScore(params) {
  const weights = {
    mfaRate: 0.4,
    failedLoginRate: 0.3,
    lockedAccountRate: 0.3
  };

  let score = 100;

  // Reduce score based on MFA adoption rate
  if (params.mfaRate < 80) score -= (80 - params.mfaRate) * weights.mfaRate;

  // Reduce score based on failed login rate
  if (params.failedLoginRate > 0.1) {
    score -= (params.failedLoginRate * 100) * weights.failedLoginRate;
  }

  // Reduce score based on locked accounts
  if (params.lockedAccountRate > 5) {
    score -= (params.lockedAccountRate * weights.lockedAccountRate);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Get all activity logs with pagination and filters
router.get('/activity', authMiddleware.required, admin, checkAdminMFA, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const method = req.query.method;
    const status = req.query.status;
    const action = req.query.action;
    const search = req.query.search;

    const query = {};
    if (status) query.status = status;
    if (method) query.method = method;
    if (action) query.action = action;
    if (search) {
      query.$or = [
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { method: { $regex: search, $options: 'i' } }
      ];
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ActivityLog.countDocuments(query)
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all users with pagination and filters
router.get('/users', authMiddleware.required, admin, checkAdminMFA, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;
    const search = req.query.search;
    const mfaStatus = req.query.mfaStatus;

    const query = {};
    if (role) query.role = role;
    if (mfaStatus) query.mfaEnabled = mfaStatus === 'enabled';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -passwordHistory')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user role
router.put('/users/:id/role', authMiddleware.required, admin, checkAdminMFA, async (req, res, next) => {
  try {
    const { role } = z.object({
      role: z.enum(['user', 'admin'])
    }).parse(req.body);

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-demotion
    if (req.user._id.toString() === user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot demote yourself' });
    }

    user.role = role;
    await user.save();

    await logActivity({
      action: 'user_role_updated',
      status: 'success',
      details: { userId: user._id, newRole: role },
      req,
      user: req.user._id
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Create user
router.post('/users', authMiddleware.required, admin, checkAdminMFA, async (req, res, next) => {
  try {
    const { name, email, password, role } = z.object({
      name: z.string().min(2).max(50),
      email: z.string().email(),
      password: z.string().min(8),
      role: z.enum(['user', 'admin'])
    }).parse(req.body);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      isEmailVerified: true // Admin-created accounts are pre-verified
    });

    await logActivity({
      action: 'user_created',
      status: 'success',
      details: { userId: user._id, role },
      req,
      user: req.user._id
    });

    res.status(201).json({ 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/users/:id', authMiddleware.required, admin, checkAdminMFA, async (req, res, next) => {
  try {
    const { name, email } = z.object({
      name: z.string().min(2).max(50),
      email: z.string().email()
    }).parse(req.body);

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and is already taken
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    user.name = name;
    user.email = email;
    await user.save();

    await logActivity({
      action: 'user_updated',
      status: 'success',
      details: { userId: user._id },
      req,
      user: req.user._id
    });

    res.json({ 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete user
router.delete('/users/:id', authMiddleware.required, admin, checkAdminMFA, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-deletion
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    await user.deleteOne();

    await logActivity({
      action: 'user_deleted',
      status: 'success',
      details: { userId: user._id },
      req,
      user: req.user._id
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Lock user account
router.post('/users/:id/lock', authMiddleware.required, admin, checkAdminMFA, async (req, res, next) => {
  try {
    const { permanent, duration, reason } = z.object({
      permanent: z.boolean(),
      duration: z.number().min(5).max(10080).optional(), // 5 minutes to 7 days
      reason: z.enum(['suspicious_activity', 'admin_action', 'policy_violation'])
    }).parse(req.body);

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-locking
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Cannot lock your own account' });
    }

    if (permanent) {
      user.permanentlyLocked = true;
    } else {
      user.accountLocked = true;
      user.lockUntil = new Date(Date.now() + (duration * 60 * 1000));
    }
    
    user.lockReason = reason;
    await user.save();

    await logActivity({
      action: permanent ? 'user_permanently_locked' : 'user_temporarily_locked',
      status: 'success',
      details: { 
        userId: user._id, 
        reason,
        duration: permanent ? 'permanent' : `${duration} minutes`
      },
      req,
      user: req.user._id
    });

    res.json({ 
      message: `User account ${permanent ? 'permanently' : 'temporarily'} locked`,
      user
    });
  } catch (error) {
    next(error);
  }
});

// Unlock user account
router.post('/users/:id/unlock', authMiddleware.required, admin, checkAdminMFA, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.permanentlyLocked = false;
    user.accountLocked = false;
    user.lockUntil = null;
    user.lockReason = undefined;
    user.failedLoginAttempts = 0;
    await user.save();

    await logActivity({
      action: 'user_account_unlocked',
      status: 'success',
      details: { userId: user._id },
      req,
      user: req.user._id
    });

    res.json({ 
      message: 'User account unlocked',
      user
    });
  } catch (error) {
    next(error);
  }
});

// Get all blogs with pagination and filters
router.get('/blogs', authMiddleware.required, admin, checkAdminMFA, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const tag = req.query.tag;
    const author = req.query.author;

    const query = {};
    if (tag) query.tags = tag;
    if (author) query.author = author;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate('author', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Blog.countDocuments(query)
    ]);

    res.json({
      blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete blog
router.delete('/blogs/:id', authMiddleware.required, admin, checkAdminMFA, async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    await blog.deleteOne();

    await logActivity({
      action: 'blog_deleted',
      status: 'success',
      details: { blogId: blog._id },
      req,
      user: req.user._id
    });

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;