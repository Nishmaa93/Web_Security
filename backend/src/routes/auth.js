import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { z } from 'zod';
import User from '../models/User.js';
import { validatePassword } from '../utils/passwordValidation.js';
import { sendResetPasswordEmail, sendVerificationEmail } from '../utils/email.js';
import { auth as authMiddleware, loginLimiter, sensitiveRouteLimit } from '../middleware/auth.js';
import { checkPasswordHistory, checkPasswordExpiry } from '../middleware/security.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces'),
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(254, 'Email must not exceed 254 characters')
    .toLowerCase(),
  password: z.string().refine((pass) => {
    const { isValid, errors } = validatePassword(pass);
    if (!isValid) {
      throw new Error(errors[0]); // Show first error for clearer feedback
    }
    return true;
  }, {
    message: 'Password does not meet security requirements'
  })
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    // Additional email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Additional password validation
    const { isValid, errors } = validatePassword(password);
    if (!isValid) {
      return res.status(400).json({ message: errors[0] });
    }

    const user = await User.create({ name, email, password });
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        permissions: user.permissions
      }, 
      process.env.JWT_SECRET, 
      { 
        expiresIn: '7d',
        algorithm: 'HS512'
      }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const user = await User.findOne({ email });
    
    // Check if user exists and validate password
    if (!user) {
      await logActivity({
        action: 'login_failure',
        status: 'failure',
        details: { reason: 'User not found' },
        req
      });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check for permanent lock first
    if (user.permanentlyLocked) {
      await logActivity({
        action: 'login_failure',
        status: 'failure',
        details: { 
          reason: 'Account permanently locked',
          lockReason: user.lockReason
        },
        req,
        user: user._id
      });
      return res.status(401).json({ 
        message: `Account is permanently locked: ${user.lockReason}. Please contact support.`,
        permanentLock: true,
        reason: user.lockReason
      });
    }
    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({ 
        message: 'Please verify your email before logging in',
        emailVerificationRequired: true
      });
    }

    // Check if account is locked
    if (user.accountLocked && user.lockUntil > new Date()) {
      await logActivity({
        action: 'login_failure',
        status: 'failure',
        details: { 
          reason: 'Account temporarily locked',
          lockReason: user.lockReason,
          remainingTime
        },
        req,
        user: user._id
      });
      return res.status(401).json({ 
        message: `Account is locked. Please try again in ${remainingTime} minutes or reset your password.`,
        temporaryLock: true,
        remainingTime,
        reason: user.lockReason
      });
    }

    // Validate password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      // Increment failed login attempts
      user.failedLoginAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.accountLocked = true;
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }
      
      await user.save();
      
      await logActivity({
        action: 'login_failure',
        status: 'failure',
        details: { 
          reason: 'Invalid password',
          attempts: user.failedLoginAttempts
        },
        req,
        user: user._id
      });
      
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      const { mfaToken } = req.body;

      if (!mfaToken) {
        return res.status(200).json({ 
          message: 'MFA token required',
          requiresMfa: true
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaToken
      });

      if (!verified) {
        await logActivity({
          action: 'mfa_failure',
          status: 'failure',
          details: { reason: 'Invalid MFA token' },
          req,
          user: user._id
        });
        return res.status(401).json({ message: 'Invalid MFA token' });
      }

      await logActivity({
        action: 'mfa_success',
        status: 'success',
        details: { reason: 'MFA verification successful' },
        req,
        user: user._id
      });
    } else {
      // If MFA is not enabled, prompt user to set it up
      // Generate a temporary token for MFA setup
      const tempToken = jwt.sign(
        { 
          userId: user._id,
          temp: true
        }, 
        process.env.JWT_SECRET, 
        { 
          expiresIn: '15m',
          algorithm: 'HS512'
        }
      );
      
      return res.status(200).json({ 
        setupMfa: true,
        tempToken
      });
    }

    // Reset failed login attempts on successful login
    user.failedLoginAttempts = 0;
    user.accountLocked = false;
    user.lockUntil = null;
    await user.save();

    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        permissions: user.permissions,
        mfaEnabled: user.mfaEnabled
      }, 
      process.env.JWT_SECRET, 
      { 
        expiresIn: '7d',
        algorithm: 'HS512'
      }
    );

    await logActivity({
      action: 'login_success',
      status: 'success',
      req,
      user: user._id
    });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    next(error);
  }
});

// Enable MFA
router.post('/mfa/enable', authMiddleware.required, async (req, res, next) => {
  try {
    // Verify if the user has a valid temporary token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.temp) {
      return res.status(401).json({ message: 'Invalid token for MFA setup' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate new secret
    const secret = speakeasy.generateSecret({
      name: `Code & Compass (${user.email})`
    });
    
    // Generate QR code
    const otpauthUrl = `otpauth://totp/Code%20%26%20Compass:${encodeURIComponent(user.email)}?secret=${secret.base32}&issuer=Code%20%26%20Compass`;
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    
    // Save secret to user
    user.mfaSecret = secret.base32;
    await user.save();
    
    await logActivity({
      action: 'mfa_setup',
      status: 'success',
      req,
      user: user._id
    });
    
    res.json({ 
      message: 'MFA setup initiated',
      qrCode: qrCodeUrl,
      secret: secret.base32
    });
  } catch (error) {
    next(error);
  }
});

// Verify and activate MFA
router.post('/mfa/verify', authMiddleware.required, async (req, res, next) => {
  try {
    const { token } = z.object({ 
      token: z.string().length(6, 'Token must be 6 digits')
    }).parse(req.body);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.mfaSecret) {
      return res.status(400).json({ message: 'MFA not set up for this user' });
    }
    
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1 // Allow 30 seconds before/after for time drift
    });
    
    if (!verified) {
      await logActivity({
        action: 'mfa_verification',
        status: 'failure',
        details: { reason: 'Invalid verification code' },
        req,
        user: user._id
      });
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    user.mfaEnabled = true;
    await user.save();
    
    await logActivity({
      action: 'mfa_enabled',
      status: 'success',
      details: { reason: 'MFA verification successful' },
      req,
      user: user._id
    });
    
    res.json({ message: 'MFA enabled successfully' });
  } catch (error) {
    console.error('MFA verification error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    next(error);
  }
});

// Get current user
router.get('/me', authMiddleware.required, async (req, res) => {
  res.json({ user: req.user });
});

// Forgot password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    await sendResetPasswordEmail(user.email, resetToken);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    next(error);
  }
});

// Reset password
router.post('/reset-password', sensitiveRouteLimit, checkPasswordHistory, async (req, res, next) => {
  try {
    const { token, password } = z.object({
      token: z.string(),
      password: z.string().refine((pass) => {
        const { isValid, errors } = validatePassword(pass);
        if (!isValid) {
          throw new Error(errors.join(', '));
        }
        return true;
      }, {
        message: 'Password does not meet security requirements'
      })
    }).parse(req.body);

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
});

// Verify email
router.post('/verify-email/:token', async (req, res, next) => {
  try {
    const verificationToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    
    const user = await User.findOne({
      emailVerificationToken: verificationToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Generate new token for auto-login after verification
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        permissions: user.permissions
      }, 
      process.env.JWT_SECRET, 
      { 
        expiresIn: '7d',
        algorithm: 'HS512'
      }
    );

    res.json({ 
      message: 'Email verified successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: true
      }
    });
  } catch (error) {
    next(error);
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/change-password', authMiddleware.required, sensitiveRouteLimit, checkPasswordHistory, checkPasswordExpiry, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string(),
      newPassword: z.string().refine((pass) => {
        const { isValid, errors } = validatePassword(pass);
        if (!isValid) {
          throw new Error(errors.join(', '));
        }
        return true;
      }, {
        message: 'Password does not meet security requirements'
      })
    }).parse(req.body);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;