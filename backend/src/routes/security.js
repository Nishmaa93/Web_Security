import express from 'express';
import { z } from 'zod';
import { auth as authMiddleware, admin } from '../middleware/auth.js';
import SecuritySettings from '../models/SecuritySettings.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

const securitySettingsSchema = z.object({
  requireAdminMFA: z.boolean(),
  passwordExpiryDays: z.number().min(1).max(365),
  maxLoginAttempts: z.number().min(1).max(10),
  lockoutDurationMinutes: z.number().min(5).max(1440),
  sessionTimeoutMinutes: z.number().min(5).max(1440),
  rateLimits: z.record(z.object({
    windowMs: z.number().min(1000).max(3600000),
    maxRequests: z.number().min(1).max(1000)
  }))
});

// Get security settings
router.get('/settings', authMiddleware.required, admin, async (req, res, next) => {
  try {
    const settings = await SecuritySettings.findOne() || await SecuritySettings.create({
      requireAdminMFA: true,
      passwordExpiryDays: 90,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 15,
      sessionTimeoutMinutes: 30
    });
    
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

// Update security settings
router.put('/settings', authMiddleware.required, admin, async (req, res, next) => {
  try {
    const validatedData = securitySettingsSchema.parse(req.body);
    
    const settings = await SecuritySettings.findOne() || new SecuritySettings();
    Object.assign(settings, validatedData);
    await settings.save();
    
    await logActivity({
      action: 'security_settings_updated',
      status: 'success',
      details: validatedData,
      req,
      user: req.user._id
    });
    
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

// Update rate limits
router.put('/rate-limits', authMiddleware.required, admin, async (req, res, next) => {
  try {
    const { type, windowMs, maxRequests } = z.object({
      type: z.enum(['default', 'auth', 'api', 'upload']),
      windowMs: z.number().min(1000).max(3600000),
      maxRequests: z.number().min(1).max(1000)
    }).parse(req.body);

    const settings = await SecuritySettings.findOne();
    if (!settings) {
      return res.status(404).json({ message: 'Security settings not found' });
    }

    settings.rateLimits.set(type, { windowMs, maxRequests });
    await settings.save();

    await logActivity({
      action: 'rate_limits_updated',
      status: 'success',
      details: { type, windowMs, maxRequests },
      req,
      user: req.user._id
    });

    res.json({ 
      message: 'Rate limits updated successfully',
      settings
    });
  } catch (error) {
    next(error);
  }
});

export default router;