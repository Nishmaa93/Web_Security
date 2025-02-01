import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validatePassword } from '../utils/passwordValidation';

interface LoginForm {
  email: string;
  password: string;
  mfaToken?: string;
}

export default function Login() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<LoginForm>();
  const { login, user, loading, resendVerification } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [setupMfa, setSetupMfa] = useState(false);
  const navigate = useNavigate();
  const password = watch('password', '');
  const isPasswordValid = password.length >= 8;

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
      return;
    }
  }, [user, loading, navigate]);

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsSubmitting(true);
      const redirectPath = localStorage.getItem('redirectPath') || '/dashboard';
      const response = await login(data.email, data.password);

      if (response) {
        if (response.permanentLock) {
          toast.error(`Account permanently locked: ${response.reason}. Please contact support.`, {
            duration: 6000
          });
          return;
        }
        
        if (response.temporaryLock) {
          toast.error(`Account locked: ${response.reason}. Try again in ${response.remainingTime} minutes.`, {
            duration: 6000
          });
          return;
        }

        if (response.requiresMfa) {
          navigate('/verify-2fa', { 
            state: { 
              email: data.email, 
              password: data.password 
            } 
          });
          return;
        }
        
        if (response.setupMfa) {
          navigate('/setup-mfa');
          return;
        }

        if (response.token) {
          navigate(redirectPath);
          localStorage.removeItem('redirectPath');
        }
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

  const handleResendVerification = async () => {
    try {
      await resendVerification(verificationEmail);
    } catch (error) {
      // Error is handled by AuthContext
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative bg-white shadow-lg sm:rounded-3xl px-8 py-12">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="text-center pb-8">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  Welcome Back
                </h2>
                <p className="mt-2 text-gray-600">
                  New to Code & Compass?{' '}
                  <Link to="/register" className="font-medium text-purple-600 hover:text-pink-600 transition-colors">
                    Create an account
                  </Link>
                </p>
              </div>

              <form className="py-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-8">
                  <div>
                    <label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-2">
                      Email
                    </label>
                    <input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      type="email"
                      className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                      placeholder="you@example.com"
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-pink-600">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="password" className="text-sm font-medium text-gray-700 block mb-2">
                      Password
                    </label>
                    <input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters'
                        }
                      })}
                      type="password"
                      className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                    {errors.password && (
                      <p className="mt-2 text-sm text-pink-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end">
                    <Link to="/forgot-password" className="text-sm font-medium text-purple-600 hover:text-pink-600 transition-colors">
                      Forgot your password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !isPasswordValid}
                    className={`w-full py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 transform transition-all font-medium
                      ${isPasswordValid 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 hover:scale-[1.02]' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Email Verification Modal */}
          {showResendVerification && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-8 max-w-md w-full">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Email Verification Required
                </h3>
                <p className="text-gray-600 mb-6">
                  Please verify your email address before logging in. 
                  Haven't received the verification email?
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowResendVerification(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleResendVerification}
                    className="btn-primary"
                  >
                    Resend Verification Email
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}