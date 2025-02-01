// Role definitions with associated permissions
const rolePermissions = {
  user: [
    'create:blog',
    'edit:blog',
    'delete:blog'
  ],
  admin: [
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
};

// Check if user has required permission
export const verifyPermissions = (user, requiredPermission) => {
  console.log('Verifying permissions:', {
    userRole: user?.role,
    requiredPermission,
    userPermissions: user?.permissions
  });

  // Admin bypass - admins have all permissions
  if (user?.role === 'admin') {
    return true;
  }
  
  const userPermissions = [
    ...rolePermissions[user.role] || [],
    ...user.permissions || []
  ];

  console.log('User permissions:', userPermissions);
  
  return userPermissions.includes(requiredPermission);
};

// Get all permissions for a role
export const getRolePermissions = (role) => {
  return rolePermissions[role] || [];
};

// Validate if a permission exists
export const isValidPermission = (permission) => {
  return Object.values(rolePermissions)
    .flat()
    .includes(permission);
};