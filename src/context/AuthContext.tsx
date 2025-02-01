import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';
import { User } from '../types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  updateUser: (userData: Partial<User>) => void;
  sessionTimeout: number | null;
  resendVerification: (email: string) => Promise<void>;
  login: (email: string, password: string, mfaToken?: string) => Promise<any>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };
  const [loading, setLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState<number | null>(null);
  const navigate = useNavigate();

  // Session timeout handler
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (user) {
        timeoutId = setTimeout(() => {
          logout();
          toast.error('Session expired. Please login again.');
          navigate('/login');
        }, 30 * 60 * 1000); // 30 minutes
      }
    };

    // Reset timeout on user activity
    const handleActivity = () => {
      resetTimeout();
    };

    if (user) {
      resetTimeout();
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keydown', handleActivity);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [user, navigate]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch (error) {
      // Only clear auth state if there's a token but it's invalid
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
        setUser(null);
      }
    } 
    setLoading(false);
  };

  const login = async (email: string, password: string, mfaToken?: string) => {
    try {
      const { data } = await api.post('/auth/login', { email, password, mfaToken });

      // Clear any existing tokens
      localStorage.removeItem('token');
      localStorage.removeItem('tempAuthToken');

      if (data.requiresMfa) {
        return { requiresMfa: true };
      }
      
      if (data.setupMfa) {
        // Store temporary token for MFA setup only
        localStorage.setItem('tempAuthToken', data.tempToken);
        return { setupMfa: true };
      }
      
      if (!data.token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('token', data.token);
      setUser(data.user);
      toast.success('Logged in successfully');
      return data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
      return null;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      toast.success('Registration successful! Please check your email to verify your account.');
      return data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const resendVerification = async (email: string) => {
    try {
      await api.post('/auth/resend-verification', { email });
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend verification email');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tempAuthToken');
    localStorage.removeItem('lastActive');
    setUser(null);
    setSessionTimeout(null);
    toast.success('Logged out successfully');
    navigate('/');
  };

  const forgotPassword = async (email: string) => {
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Password reset email sent');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      updateUser,
      login, 
      register,
      resendVerification,
      logout, 
      forgotPassword, 
      resetPassword,
      sessionTimeout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const onSubmit = async (data: LoginForm) => {
  try {
    setIsSubmitting(true);
    const response = await login(data.email, data.password);

    // Handle permanent lock
    if (response?.permanentLock) {
      toast.error(`Account permanently locked: ${response.reason}. Please contact support.`, {
        duration: 6000
      });
      return;
    }

    if (response?.temporaryLock) {
      toast.error(`Account locked: ${response.reason}. Try again in ${response.remainingTime} minutes.`, {
        duration: 6000
      });
      return;
    }

    if (response?.requiresMfa) {
      navigate('/verify-2fa', { 
        state: { 
          email: data.email, 
          password: data.password 
        } 
      });
      return;
    }
    
    if (response?.setupMfa) {
      navigate('/setup-mfa');
      return;
    }

    if (response?.token) {
      navigate(redirectPath);
      localStorage.removeItem('redirectPath');
    }
  } catch (error) {
    if (error.response?.data?.emailVerificationRequired) {
      setShowResendVerification(true);
      setVerificationEmail(data.email);
    }
  } finally {
    setIsSubmitting(false);
  }
};