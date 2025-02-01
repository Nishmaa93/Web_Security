import express from 'express';
import { z } from 'zod';
import Role from '../models/Role.js';
import User from '../models/User.js';
import { auth, admin, requirePermission } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// Get all roles
router.get('/', auth.required, requirePermission('manage:roles'), async (req, res, next) => {
  try {
    const roles = await Role.find().populate('createdBy', 'name email');
    res.json({ roles });
  } catch (error) {
    next(error);
  }
});

// Create new role
router.post('/', auth.required, requirePermission('manage:roles'), async (req, res, next) => {
  try {
    const { name, description, permissions } = z.object({
      name: z.string().min(2).max(50),
      description: z.string().optional(),
      permissions: z.array(z.string())
    }).parse(req.body);

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ message: 'Role already exists' });
    }

    const role = await Role.create({
      name,
      description,
      permissions,
      createdBy: req.user._id
    });

    await logActivity({
      action: 'role_created',
      status: 'success',
      details: { roleId: role._id, permissions },
      req,
      user: req.user._id
    });

    res.status(201).json({ role });
  } catch (error) {
    next(error);
  }
});

// Update role
router.put('/:id', auth.required, requirePermission('manage:roles'), async (req, res, next) => {
  try {
    const { name, description, permissions } = z.object({
      name: z.string().min(2).max(50),
      description: z.string().optional(),
      permissions: z.array(z.string())
    }).parse(req.body);

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(403).json({ message: 'Cannot modify system roles' });
    }

    Object.assign(role, { name, description, permissions });
    await role.save();

    await logActivity({
      action: 'role_updated',
      status: 'success',
      details: { roleId: role._id, permissions },
      req,
      user: req.user._id
    });

    res.json({ role });
  } catch (error) {
    next(error);
  }
});

// Delete role
router.delete('/:id', auth.required, requirePermission('manage:roles'), async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(403).json({ message: 'Cannot delete system roles' });
    }

    // Remove role from all users
    await User.updateMany(
      { role: role.name },
      { $set: { role: 'user' }}
    );

    await role.deleteOne();

    await logActivity({
      action: 'role_deleted',
      status: 'success',
      details: { roleId: role._id },
      req,
      user: req.user._id
    });

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Assign role to user
router.post('/assign/:userId', auth.required, requirePermission('manage:roles'), async (req, res, next) => {
  try {
    const { roleId } = z.object({
      roleId: z.string()
    }).parse(req.body);

    const [user, role] = await Promise.all([
      User.findById(req.params.userId),
      Role.findById(roleId)
    ]);

    if (!user || !role) {
      return res.status(404).json({ message: 'User or role not found' });
    }

    user.role = role.name;
    user.permissions = role.permissions;
    await user.save();

    await logActivity({
      action: 'role_assigned',
      status: 'success',
      details: { userId: user._id, roleId: role._id },
      req,
      user: req.user._id
    });

    res.json({ message: 'Role assigned successfully', user });
  } catch (error) {
    next(error);
  }
});

// Get available permissions
router.get('/permissions', auth.required, requirePermission('manage:roles'), async (req, res) => {
  const permissions = [
    {
      category: 'Blog Management',
      permissions: [
        { name: 'create:blog', description: 'Create new blogs' },
        { name: 'edit:blog', description: 'Edit existing blogs' },
        { name: 'delete:blog', description: 'Delete blogs' }
      ]
    },
    {
      category: 'User Management',
      permissions: [
        { name: 'manage:users', description: 'Manage user accounts' },
        { name: 'manage:roles', description: 'Manage roles and permissions' },
        { name: 'lock:users', description: 'Lock/unlock user accounts' },
        { name: 'reset:2fa', description: 'Reset user 2FA' }
      ]
    },
    {
      category: 'Admin Panel',
      permissions: [
        { name: 'view:admin_panel', description: 'Access admin panel' },
        { name: 'view:activity_logs', description: 'View activity logs' },
        { name: 'view:security_settings', description: 'View security settings' },
        { name: 'edit:security_settings', description: 'Modify security settings' }
      ]
    },
    {
      category: 'Content Management',
      permissions: [
        { name: 'manage:comments', description: 'Manage blog comments' },
        { name: 'upload:files', description: 'Upload files and images' }
      ]
    }
  ];

  res.json({ permissions });
});

export default router;