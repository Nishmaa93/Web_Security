import mongoose from 'mongoose';

const securitySettingsSchema = new mongoose.Schema({
  requireAdminMFA: {
    type: Boolean,
    default: true
  },
  passwordExpiryDays: {
    type: Number,
    min: 1,
    max: 365,
    default: 90
  },
  maxLoginAttempts: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  lockoutDurationMinutes: {
    type: Number,
    min: 5,
    max: 1440,
    default: 15
  },
  sessionTimeoutMinutes: {
    type: Number,
    min: 5,
    max: 1440,
    default: 30
  },
  rateLimits: {
    type: Map,
    of: {
      windowMs: {
        type: Number,
        min: 1000, // 1 second
        max: 3600000, // 1 hour
        default: 900000 // 15 minutes
      },
      maxRequests: {
        type: Number,
        min: 1,
        max: 1000,
        default: 100
      }
    },
    default: new Map([
      ['default', { windowMs: 900000, maxRequests: 100 }],
      ['auth', { windowMs: 900000, maxRequests: 5 }],
      ['api', { windowMs: 900000, maxRequests: 100 }],
      ['upload', { windowMs: 3600000, maxRequests: 10 }]
    ])
  }
}, {
  timestamps: true
});

export default mongoose.model('SecuritySettings', securitySettingsSchema);