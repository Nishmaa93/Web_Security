import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface Verify2FAForm {
  token: string;
}

export default function Verify2FA() {
  const { register, handleSubmit, formState: { errors } } = useForm<Verify2FAForm>();
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { email, password } = location.state || {};

  // Redirect if no credentials
  React.useEffect(() => {
    const tempToken = localStorage.getItem('tempAuthToken');
    if ((!email || !password) && !tempToken) {
      navigate('/login');
    }
  }, [email, password, navigate]);

  const onSubmit = async (data: Verify2FAForm) => {
    try {
      setVerifying(true);
      const response = await login(email, password, data.token);
      
      if (response?.token && !response?.setupMfa && !response?.requiresMfa) {
        navigate('/');
      } else if (response?.setupMfa) {
        navigate('/setup-mfa');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Invalid verification code';
      toast.error(errorMsg);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Two-Factor Authentication
          </h2>
          <p className="text-gray-600">
            Enter the verification code from your authenticator app
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              {...register('token', {
                required: 'Verification code is required',
                pattern: {
                  value: /^\d{6}$/,
                  message: 'Must be a 6-digit code'
                }
              })}
              type="text"
              className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
              placeholder="Enter 6-digit code"
              maxLength={6}
              autoComplete="one-time-code"
            />
            {errors.token && (
              <p className="mt-1 text-sm text-red-600">{errors.token.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={verifying}
            className="w-full btn-primary flex items-center justify-center"
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}