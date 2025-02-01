import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logActivity } from '../utils/logger.js';
import rateLimit from 'express-rate-limit';
import { verifyPermissions } from '../utils/rbac.js';
import SecuritySettings from '../models/SecuritySettings.js';

// Optional authentication middleware
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.userId || !decoded.iat) {
      return next();
    }

    const user = await User.findById(decoded.userId).select('-password');
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // If token is invalid, continue without user
    next();
  }
};

// Admin middleware
export const admin = (req, res, next) => {
  if (!req.user) {
    return logActivity({
      action: 'auth_failure',
      status: 'failure',
      details: { reason: 'No user found' },
      req
    }).catch(console.error).finally(() => {
      res.status(401).json({ message: 'Authentication required' });
    });
  }

  if (req.user.role !== 'admin') {
    return logActivity({
      action: 'auth_failure',
      status: 'failure',
      details: { reason: 'Admin access required' },
      req,
      user: req.user._id
    }).catch(console.error).finally(() => {
      res.status(403).json({ message: 'Admin access required' });
    });
  }

  // Log success but don't wait for it
  logActivity({
    action: 'auth_success',
    status: 'success',
    details: { type: 'admin_access' },
    req,
    user: req.user._id
  }).catch(console.error);

  next();
};

// Rate limiting for login attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: async (req) => {
    const settings = await SecuritySettings.findOne();
    return settings?.maxLoginAttempts || 5;
  },
  message: { message: 'Too many login attempts. Please try again later.' }
});

// IP-based rate limiting for sensitive routes
export const sensitiveRouteLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again later.' },
  handler: async (req, res) => {
    await logActivity({
      action: 'rate_limit_exceeded',
      status: 'failure',
      details: { path: req.path },
      req
    });
    res.status(429).json({ message: 'Too many requests from this IP, please try again later.' });
  }
});
// Required authentication middleware
const requiredAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      req.authError = true;
      await logActivity({
        action: 'auth_failure',
        status: 'failure',
        details: { reason: 'No token provided', path: req.path },
        req
      });
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify token payload
    if (!decoded.userId || !decoded.iat) {
      req.authError = true;
      throw new Error('Invalid token structure');
    }

    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      req.authError = true;
      await logActivity({
        action: 'auth_failure',
        status: 'failure',
        details: { reason: 'User not found' },
        req
      });
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.accountLocked && user.lockUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000)); // Convert to minutes
      req.authError = true;
      await logActivity({
        action: 'auth_failure',
        status: 'failure',
        details: { reason: 'Account locked', remainingTime },
        req,
        user: user._id
      });
      return res.status(401).json({ 
        message: `Account is locked. Please try again in ${remainingTime} minutes or reset your password.`,
        remainingTime
      });
    }

    // Check password expiry (90 days)
    const passwordMaxAge = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
    if (Date.now() - user.passwordLastChanged.getTime() > passwordMaxAge) {
      return res.status(401).json({
        message: 'Password has expired. Please reset your password.',
        passwordExpired: true
      });
    }

    req.user = user;
    
    await logActivity({
      action: 'auth_success',
      status: 'success',
      req,
      user: user._id
    });
    
    next();
  } catch (error) {
    await logActivity({
      action: 'auth_failure',
      status: 'failure',
      details: { reason: 'Invalid token', path: req.path },
      req
    });
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Export auth object with both required and optional middleware
export const auth = {
  required: requiredAuth,
  optional: optionalAuth
};

// RBAC middleware factory
export const requirePermission = (permission) => {
  return (req, res, next) => {
    // Admin bypass - admins have all permissions
    if (req.user?.role === 'admin') {
      return next();
    }

    console.log('Checking permission:', {
      permission,
      userRole: req.user?.role,
      userPermissions: req.user?.permissions
    });

    if (!verifyPermissions(req.user, permission)) {
      console.log('Permission denied');
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    console.log('Permission granted');
    next();
  };
};

// Session management middleware
export const sessionManager = (req, res, next) => {
  // Set secure headers
  res.set({
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Content-Security-Policy': "default-src 'self'",
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  // Regenerate session ID periodically
  if (req.session) {
    if (!req.session.lastRotated || Date.now() - req.session.lastRotated > 15 * 60 * 1000) {
      req.session.regenerate((err) => {
        if (err) next(err);
        req.session.lastRotated = Date.now();
        next();
      });
      return;
    }
  }
  next();
};