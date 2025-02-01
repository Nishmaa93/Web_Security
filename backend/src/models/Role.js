import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: String,
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
  isSystem: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Pre-save hook to ensure admin role has all permissions
roleSchema.pre('save', function(next) {
  if (this.name === 'admin') {
    // Get all available permissions from the schema
    const allPermissions = this.schema.path('permissions.0').enumValues;
    this.permissions = allPermissions;
  }
  next();
});
// Prevent modification of system roles
roleSchema.pre('save', function(next) {
  if (this.isSystem && this.isModified('permissions')) {
    const err = new Error('Cannot modify system roles');
    next(err);
  }
  next();
});

export default mongoose.model('Role', roleSchema);