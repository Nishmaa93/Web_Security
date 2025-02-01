import rateLimit from 'express-rate-limit';
import SecuritySettings from '../models/SecuritySettings.js';
import { logActivity } from '../utils/logger.js';

// Dynamic rate limiter factory
export const createRateLimiter = async (type = 'default') => {
  try {
    const settings = await SecuritySettings.findOne();
    if (!settings) {
      throw new Error('Security settings not found');
    }

    const limits = settings.rateLimits.get(type) || settings.rateLimits.get('default');
    
    return rateLimit({
      windowMs: limits.windowMs,
      max: limits.maxRequests,
      message: { 
        message: `Too many requests. Please try again after ${Math.ceil(limits.windowMs / 60000)} minutes.`
      },
      handler: async (req, res) => {
        await logActivity({
          action: 'rate_limit_exceeded',
          status: 'failure',
          details: { 
            path: req.path,
            limitType: type,
            windowMs: limits.windowMs,
            maxRequests: limits.maxRequests
          },
          req
        });
        res.status(429).json({ 
          message: `Too many requests. Please try again after ${Math.ceil(limits.windowMs / 60000)} minutes.`,
          retryAfter: limits.windowMs / 1000
        });
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Use IP and user ID (if available) as the key
        return req.user ? `${req.ip}-${req.user._id}` : req.ip;
      }
    });
  } catch (error) {
    console.error('Error creating rate limiter:', error);
    // Return default rate limiter as fallback
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100
    });
  }
};