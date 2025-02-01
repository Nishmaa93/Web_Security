import express from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import { auth as authMiddleware, admin, sensitiveRouteLimit } from '../middleware/auth.js';
import { checkAdminMFA } from '../middleware/security.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authMiddleware.required, admin, checkAdminMFA, async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authMiddleware.required, async (req, res, next) => {
  try {
    const { name, avatar } = z.object({
      name: z.string().min(2).optional(),
      avatar: z.string().url().optional()
    }).parse(req.body);

    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    await user.save();

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
});

// Reset 2FA for a user (admin only)
router.post('/:id/reset-2fa', authMiddleware.required, admin, checkAdminMFA, sensitiveRouteLimit, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Reset 2FA fields
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    await user.save();
    
    // Log the action
    await logActivity({
      action: 'mfa_reset',
      status: 'success',
      details: { targetUser: user._id },
      req,
      user: req.user._id
    });
    
    res.json({ message: '2FA has been reset successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:id', authMiddleware.required, admin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;