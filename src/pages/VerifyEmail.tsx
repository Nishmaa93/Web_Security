import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function VerifyEmail() {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await api.post(`/auth/verify-email/${token}`);
        setSuccess(true);
        
        // Start countdown
        let count = 5;
        const countdownInterval = setInterval(() => {
          count -= 1;
          setCountdown(count);
          
          if (count === 0) {
            clearInterval(countdownInterval);
            navigate('/login');
          }
        }, 1000);

        return () => clearInterval(countdownInterval);
      } catch (error: any) {
        setError(error.response?.data?.message || 'Verification failed');
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
          <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Verifying Your Email</h2>
          <p className="text-gray-600">
            Please wait while we verify your email address...
          </p>
          <div className="mt-6 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Email Verified Successfully! 🎉
          </h2>
          <p className="text-gray-600 mb-8">
            Your email has been verified. Redirecting to login page in {countdown} seconds...
          </p>
          <div className="space-y-4">
            <Link
              to="/login"
              className="block w-full btn-primary relative overflow-hidden"
            >
              <span className="relative z-10">Login Now</span>
              <div 
                className="absolute inset-0 bg-white/20 origin-left"
                style={{ 
                  transform: `scaleX(${countdown / 5})`,
                  transition: 'transform 1s linear'
                }}
              ></div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="mb-6">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Verification Failed 😕
          </h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <div className="space-y-4">
            <Link
              to="/login"
              className="block w-full btn-primary"
            >
              Return to Login
            </Link>
            <Link
              to="/register"
              className="block w-full btn-secondary"
            >
              Create New Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}