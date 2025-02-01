import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  action: {
    type: String,
    required: true,
    enum: [
      'auth_failure',
      'auth_success',
      'login_failure',
      'login_success',
      'mfa_failure',
      'mfa_success',
      'mfa_setup',
      'mfa_enabled',
      'blog_created',
      'blog_updated',
      'blog_deleted',
      'comment_added',
      'comment_deleted',
      'user_created',
      'user_updated',
      'user_deleted',
      'user_role_updated',
      'user_locked',
      'user_unlocked',
      'password_changed',
      'password_reset_requested',
      'password_reset_completed',
      'email_verification_requested',
      'email_verified',
      'profile_updated',
      'avatar_updated',
      'settings_updated',
      'file_uploaded',
      'mfa_reset',
      'security_settings_updated',
      'rate_limit_exceeded',
      'password_expired',
      'password_history_violation',
      'general_request',
      'admin_access',
      'admin_action',
      'api_request',
      'system_action'
    ]
  },
  method: {
    type: String,
    required: false,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH']
  },
  endpoint: {
    type: String,
    required: false
  },
  responseStatus: {
    type: Number,
    required: false
  },
  responseTime: {
    type: Number,  // in milliseconds
    required: false
  },
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  path: String,
  requestBody: mongoose.Schema.Types.Mixed,
  requestQuery: mongoose.Schema.Types.Mixed,
  requestParams: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['success', 'failure'],
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ ipAddress: 1, createdAt: -1 });
activityLogSchema.index({ method: 1, endpoint: 1 });
activityLogSchema.index({ responseStatus: 1 });
activityLogSchema.index({ createdAt: 1 });

export default mongoose.model('ActivityLog', activityLogSchema);