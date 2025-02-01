import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { validatePassword } from '../utils/passwordValidation.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name must not exceed 50 characters'],
    match: [/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [5, 'Email must be at least 5 characters'],
    maxlength: [254, 'Email must not exceed 254 characters'],
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: true
  },
  passwordHistory: [{
    password: String,
    createdAt: Date
  }],
  passwordLastChanged: {
    type: Date,
    default: Date.now
  },
  permissions: [{
    type: String,
    enum: [
      'create:blog',
      'edit:blog',
      'delete:blog',
      'manage:users',
      'manage:roles',
      'view:admin_panel',
      'edit:settings',
      'view:activity_logs',
      'manage:comments',
      'upload:files',
      'lock:users',
      'reset:2fa',
      'view:security_settings',
      'edit:security_settings',
      'manage:system',
      'manage:all'
    ]
  }],
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  mfaSecret: String,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  permanentlyLocked: {
    type: Boolean,
    default: false
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  lockUntil: Date,
  lockReason: {
    type: String,
    enum: ['failed_attempts', 'suspicious_activity', 'admin_action', 'policy_violation'],
    default: undefined,
    required: false
  },
  lastLoginAttempt: Date,
  lastLoginIP: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  avatar: String,
  bio: String,
  location: String,
  website: String,
  socialLinks: {
    twitter: String,
    github: String,
    linkedin: String
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Pre-save hook to ensure admin users have all permissions
userSchema.pre('save', function(next) {
  if (this.role === 'admin') {
    // Get all available permissions from the schema
    const allPermissions = this.schema.path('permissions.0').enumValues;
    this.permissions = allPermissions;
  }
  next();
});
// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Validate password strength
    const { isValid, errors } = validatePassword(this.password);
    if (!isValid) {
      throw new Error(errors[0]); // Show first error for clearer feedback
    }

    // Check password history
    const passwordHistoryLimit = 5;
    for (const historyEntry of this.passwordHistory.slice(-passwordHistoryLimit)) {
      if (await bcrypt.compare(this.password, historyEntry.password)) {
        throw new Error('Password has been used recently. Please choose a different password.');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    
    // Add to password history
    this.passwordHistory.push({
      password: hashedPassword,
      createdAt: new Date()
    });
    
    // Maintain history limit
    if (this.passwordHistory.length > passwordHistoryLimit) {
      this.passwordHistory = this.passwordHistory.slice(-passwordHistoryLimit);
    }
    
    this.password = hashedPassword;
    this.passwordLastChanged = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);