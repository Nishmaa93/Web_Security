import rateLimit from 'express-rate-limit';
import { logActivity } from '../utils/logger.js';
import SecuritySettings from '../models/SecuritySettings.js';

// IP-based rate limiting for sensitive routes
export const sensitiveRouteLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
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

// Password change history check
export const checkPasswordHistory = async (req, res, next) => {
  try {
    const settings = await SecuritySettings.findOne();
    if (!settings) return next();

    const user = req.user;
    const newPassword = req.body.password || req.body.newPassword;

    if (!newPassword) return next();

    // Check last N passwords
    const lastPasswords = user.passwordHistory.slice(-5);
    for (const historyEntry of lastPasswords) {
      const isMatch = await user.comparePassword(newPassword, historyEntry.password);
      if (isMatch) {
        return res.status(400).json({
          message: 'New password must be different from your last 5 passwords'
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Enforce password expiry
export const checkPasswordExpiry = async (req, res, next) => {
  try {
    const settings = await SecuritySettings.findOne();
    if (!settings || !req.user) return next();

    const expiryDays = settings.passwordExpiryDays;
    const lastChanged = new Date(req.user.passwordLastChanged);
    const daysSinceChange = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceChange > expiryDays) {
      return res.status(401).json({
        message: 'Your password has expired. Please reset your password.',
        passwordExpired: true
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check admin 2FA requirement
export const checkAdminMFA = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // For admin routes, always check MFA
    if (req.user.role === 'admin' && !req.user.mfaEnabled) {
      return res.status(403).json({
        message: 'Administrators must enable 2FA to access this resource',
        requireMFA: true
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "img-src 'self' data: https:; " +
    "style-src 'self' 'unsafe-inline'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "connect-src 'self' https:;"
  );

  // Other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
};

// Password strength validation middleware
export const validatePasswordStrength = async (req, res, next) => {
  try {
    const password = req.body.password || req.body.newPassword;
    if (!password) return next();

    const { isValid, errors } = validatePassword(password);
    if (!isValid) {
      return res.status(400).json({
        message: 'Password does not meet security requirements',
        errors
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Enforce MFA for admins
export const enforceAdminMFA = async (req, res, next) => {
  try {
    const settings = await SecuritySettings.findOne();
    if (!settings || !req.user) return next();

    if (req.user.role === 'admin' && settings.requireAdminMFA && !req.user.mfaEnabled) {
      return res.status(403).json({
        message: 'Administrators must enable 2FA to access this resource',
        requireMFA: true
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Enforce session timeout
export const enforceSessionTimeout = async (req, res, next) => {
  try {
    const settings = await SecuritySettings.findOne();
    if (!settings || !req.session) return next();

    const timeout = settings.sessionTimeoutMinutes * 60 * 1000; // Convert to milliseconds
    const lastActivity = req.session.lastActivity || 0;

    if (Date.now() - lastActivity > timeout) {
      req.session.destroy();
      return res.status(401).json({
        message: 'Session expired. Please login again.',
        sessionExpired: true
      });
    }

    req.session.lastActivity = Date.now();
    next();
  } catch (error) {
    next(error);
  }
};

// Enforce secure headers
export const enforceSecureHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "img-src 'self' data: https:; " +
    "style-src 'self' 'unsafe-inline'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "connect-src 'self' https:;"
  );
  next();
};