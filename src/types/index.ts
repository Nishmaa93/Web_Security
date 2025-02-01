export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  createdAt: string;
}

export interface Blog {
  _id: string;
  title: string;
  content: string;
  coverImage: string;
  author: User;
  tags: string[];
  readTime: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  blog: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  _id: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  action: string;
  status: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface SecurityMetrics {
  failedLogins: number;
  activeUsers: number;
  lockedAccounts: number;
  mfaEnabled: number;
  totalUsers: number;
  lastUpdated: string;
  securityScore: number;
  deviceFingerprints: {
    browser: string;
    os: string;
    device: string;
    count: number;
  }[];
  loginPatterns: {
    hour: number;
    count: number;
    success: number;
    failure: number;
  }[];
  geoData: {
    country: string;
    city: string;
    count: number;
    suspicious: boolean;
  }[];
  threatScore: number;
  riskFactors: {
    type: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
  }[];
}

export interface SecurityAlert {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  status: 'new' | 'investigating' | 'resolved';
  details: {
    location?: string;
    ipAddress?: string;
    userAgent?: string;
    userId?: string;
    actionTaken?: string;
    deviceFingerprint?: string;
    geoData?: {
      country: string;
      city: string;
      latitude: number;
      longitude: number;
      isp: string;
      timezone: string;
    };
    riskScore?: number;
    anomalyDetails?: {
      type: string;
      confidence: number;
      evidence: string[];
    };
  };
}