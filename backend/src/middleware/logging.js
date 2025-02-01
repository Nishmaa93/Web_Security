import { logActivity } from '../utils/logger.js';

// Activity logging middleware
export const activityLogger = async (req, res, next) => {
  const startTime = Date.now();
  
  // Store original end function
  const originalEnd = res.end;  
  
  // Override end function
  res.end = function (chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Restore original end function
    res.end = originalEnd;
    
    // Call original end function
    res.end(chunk, encoding);
    
    // Log the activity
    const action = determineAction(req);
    
    logActivity({
      action,
      method: req.method,
      endpoint: req.originalUrl,
      responseStatus: res.statusCode,
      responseTime,
      status: res.statusCode < 400 ? 'success' : 'failure',
      details: {
        ...req.activityDetails || {},
        route: req.route?.path,
        query: sanitizeData(req.query),
        params: sanitizeData(req.params)
      },
      requestBody: sanitizeData(req.body),
      requestQuery: req.query,
      requestParams: req.params,
      req,
      user: req.user?._id
    });
  };
  
  next();
};

// Determine action based on request
function determineAction(req) {
  const { method, path } = req;
  
  // Authentication actions
  if (path.startsWith('/api/auth')) {
    if (path.includes('login')) return 'login_success';
    if (path.includes('register')) return 'user_created';
    if (path.includes('verify-email')) return 'email_verified';
    if (path.includes('reset-password')) return 'password_reset_requested';
    if (path.includes('mfa')) return 'mfa_setup';
  }
  
  // Blog actions
  if (path.startsWith('/api/blogs')) {
    if (method === 'POST') return 'blog_created';
    if (method === 'PUT') return 'blog_updated';
    if (method === 'DELETE') return 'blog_deleted';
    if (path.includes('comments')) {
      if (method === 'POST') return 'comment_added';
      if (method === 'DELETE') return 'comment_deleted';
    }
  }
  
  // User actions
  if (path.startsWith('/api/users')) {
    if (method === 'PUT' && path.includes('profile')) return 'profile_updated';
    if (method === 'DELETE') return 'user_deleted';
  }
  
  // Admin actions
  if (path.startsWith('/api/admin')) {
    if (path.includes('stats')) return 'admin_action';
    if (path.includes('lock')) return 'user_locked';
    if (path.includes('unlock')) return 'user_unlocked';
    if (path.includes('role')) return 'user_role_updated';
  }
  
  // File upload actions
  if (path.startsWith('/api/upload')) {
    return 'file_uploaded';
  }
  
  // Security settings
  if (path.startsWith('/api/security')) {
    return 'security_settings_updated';
  }
  
  return 'api_request';
}

// Sanitize sensitive data
function sanitizeData(data) {
  if (!data) return data;
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'mfaSecret', 'resetToken'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) sanitized[field] = '[REDACTED]';
  });
  
  return sanitized;
}