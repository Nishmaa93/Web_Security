import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface MFAForm {
  token: string;
}

export default function SetupMFA() {
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<MFAForm>();

  React.useEffect(() => {
    setupMFA();
  }, []);

  const setupMFA = async () => {
    const tempToken = localStorage.getItem('tempAuthToken');
    if (!tempToken) {
      navigate('/login');
      return;
    }

    try {
      const { data } = await api.post('/auth/mfa/enable');
      setQrCode(data.qrCode);
      setSecret(data.secret);
    } catch (error: any) {
      toast.error('Failed to setup MFA');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: MFAForm) => {
    try {
      setVerifying(true);
      await api.post('/auth/mfa/verify', { token: data.token });
      localStorage.removeItem('tempAuthToken');
      toast.success('2FA enabled successfully!');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid verification code');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Setting up 2FA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="flex justify-end mb-4">
          <button
            onClick={logout}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel & Logout
          </button>
        </div>
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Set Up Two-Factor Authentication
          </h2>
          <p className="text-gray-600">
            Enhance your account security with 2FA
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Step 1: Scan QR Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Open Google Authenticator and scan this QR code:
            </p>
            <div className="bg-white p-4 rounded-lg shadow-inner mb-4">
              <img src={qrCode} alt="QR Code" className="mx-auto" />
            </div>
            <p className="text-sm text-gray-500">
              Can't scan? Manual code: <code className="bg-gray-100 px-2 py-1 rounded">{secret}</code>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                Step 2: Enter Verification Code
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
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Enable 2FA
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}