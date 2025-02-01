import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async ({ 
  action, 
  status, 
  details = {}, 
  method = 'GET',
  endpoint = '/',
  responseStatus = 200,
  responseTime = 0,
  requestBody,
  requestQuery,
  requestParams,
  req, 
  user = null 
}) => {
  try {
    // Set default action for general requests
    if (!action) {
      action = determineDefaultAction(req, user) || 'system_action';
    }

    // Extract request info if req object is provided
    if (req) {
      method = req.method;
      endpoint = req.originalUrl || req.url;
      
      // For activity logging middleware
      if (req.route?.path) {
        endpoint = req.route.path;
      }
    }

    const logData = {
      action,
      status,
      method,
      endpoint,
      responseStatus,
      responseTime,
      details: {
        ...details,
        url: req?.originalUrl,
        method: req?.method
      },
      requestBody,
      requestQuery,
      requestParams,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
      path: req?.path
    };

    // Add user if provided
    if (user && !['auth_failure', 'login_failure'].includes(action)) {
      logData.user = user;
    }

    try {
      await ActivityLog.create(logData);
    } catch (dbError) {
      console.warn('Activity logging DB error:', dbError.message);
    }
  } catch (error) {
    // Log error but don't throw to prevent disrupting main flow
    console.warn('Activity logging error:', error.message);
  }
};

// Helper function to determine default action
function determineDefaultAction(req, user) {
  if (!req) return 'system_action';
  
  // For authentication failures
  if (req.authError) {
    return 'auth_failure';
  }
  
  // For general API requests
  return user ? 'api_request' : 'system_action';
}