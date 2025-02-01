# Admin Activity Logs API Methods

## Activity Logs Endpoints (`/api/admin/activity`)

### GET /api/admin/activity
- **Method**: GET
- **Auth Required**: Yes (Admin only)
- **Description**: Get all activity logs with pagination and filters
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `status`: Filter by status ('success' or 'failure')
  - `action`: Filter by action type
  - `search`: Search in user names, emails, and actions

### Logged HTTP Methods in Activity Logs
The system logs the following HTTP methods for all routes:
- `GET`: Read operations
- `POST`: Create operations
- `PUT`: Update operations
- `DELETE`: Delete operations
- `PATCH`: Partial updates
- `OPTIONS`: CORS preflight requests
- `HEAD`: Header-only requests

## Activity Log Schema Fields
```typescript
{
  method: {
    type: String,
    required: false,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH']
  },
  endpoint: String,
  responseStatus: Number,
  responseTime: Number,
  status: 'success' | 'failure',
  action: String,
  details: Object,
  ipAddress: String,
  userAgent: String
}
```

## Example Activity Log Actions
1. Authentication:
   - `auth_success`: Successful login/authentication
   - `auth_failure`: Failed authentication attempt
   - `login_success`: Successful login
   - `login_failure`: Failed login attempt

2. User Management:
   - `user_created`: New user registration
   - `user_updated`: User profile update
   - `user_deleted`: User account deletion
   - `user_locked`: Account locking
   - `user_unlocked`: Account unlocking

3. Blog Operations:
   - `blog_created`: New blog post creation
   - `blog_updated`: Blog post update
   - `blog_deleted`: Blog post deletion

4. Security:
   - `mfa_setup`: 2FA setup
   - `mfa_enabled`: 2FA enablement
   - `mfa_failure`: Failed 2FA attempt
   - `password_changed`: Password change
   - `password_reset_requested`: Password reset request

5. System:
   - `rate_limit_exceeded`: Rate limit violation
   - `api_request`: General API request
   - `admin_action`: Administrative action
   - `system_action`: System-level action

## Example Log Entry
```json
{
  "action": "user_locked",
  "method": "POST",
  "endpoint": "/api/admin/users/123/lock",
  "responseStatus": 200,
  "responseTime": 150,
  "status": "success",
  "details": {
    "userId": "123",
    "reason": "suspicious_activity",
    "duration": "15 minutes"
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2024-01-27T12:00:00Z"
}
```

## Activity Log Filtering
The activity logs can be filtered by:
- HTTP Method
- Status (success/failure)
- Action type
- Date range
- User
- IP address
- Response status code

## Security Considerations
1. All activity logs include:
   - IP address tracking
   - User agent information
   - Response times
   - Success/failure status
   - Detailed error information

2. Sensitive data in logs is automatically redacted:
   - Passwords
   - Tokens
   - Security keys
   - Personal information

3. Rate limiting is applied to log access:
   - Maximum 50 requests per 15 minutes per IP
   - Separate limits for admin endpoints