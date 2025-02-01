// Determine action based on request
function determineAction(req) {
  const { method, path } = req;
  const methodLower = method.toLowerCase();
  const pathLower = path.toLowerCase();
  
  // Authentication actions
  if (pathLower.startsWith('/api/auth')) {
    const action = pathLower.includes('login') ? 'login' :
                  pathLower.includes('register') ? 'register' :
                  pathLower.includes('verify-email') ? 'verify_email' :
                  pathLower.includes('reset-password') ? 'reset_password' :
                  pathLower.includes('mfa') ? 'mfa' :
                  pathLower.includes('forgot-password') ? 'forgot_password' :
                  'auth';
    return `${action}_${methodLower}`;
  }
  
  // Blog actions
  if (pathLower.startsWith('/api/blogs')) {
    if (pathLower.includes('comments')) {
      return `comment_${methodLower}`;
    }
    return `blog_${methodLower}`;
  }
  
  // User actions
  if (pathLower.startsWith('/api/users')) {
    const action = pathLower.includes('profile') ? 'profile' :
                  pathLower.includes('reset-2fa') ? 'mfa' :
                  'user';
    return `${action}_${methodLower}`;
  }
  
  // Admin actions
  if (pathLower.startsWith('/api/admin')) {
    const action = pathLower.includes('stats') ? 'stats' :
                  pathLower.includes('lock') ? 'lock' :
                  pathLower.includes('unlock') ? 'unlock' :
                  pathLower.includes('role') ? 'role' :
                  pathLower.includes('activity') ? 'activity' :
                  'admin';
    return `${action}_${methodLower}`;
  }
  
  // File upload actions
  if (pathLower.startsWith('/api/upload')) {
    return `file_${methodLower}`;
  }
  
  // Security settings
  if (pathLower.startsWith('/api/security')) {
    return `security_${methodLower}`;
  }
  
  return `api_${methodLower}`;
}