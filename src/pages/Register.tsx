import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, X, Shield, AlertTriangle, Lock } from 'lucide-react';
import { calculateStrength, getStrengthColor, getStrengthText, isPasswordValid } from '../utils/passwordStrength';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const { register: registerUser, user, loading } = useAuth();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const [password, setPassword] = useState('');
  const [strengthResult, setStrengthResult] = useState({ score: 0, checks: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const formValues = watch();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
      return;
    }
  }, [user, loading, navigate]);

  const isFormValid = formValues.name?.length >= 2 && 
    formValues.email?.includes('@') && 
    isPasswordValid(formValues.password) &&
    formValues.password === formValues.confirmPassword;

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (pass: string) => pass.length >= 8 },
    { label: 'Contains uppercase letter', test: (pass: string) => /[A-Z]/.test(pass) },
    { label: 'Contains lowercase letter', test: (pass: string) => /[a-z]/.test(pass) },
    { label: 'Contains number', test: (pass: string) => /\d/.test(pass) },
    { label: 'Contains special character', test: (pass: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pass) }
  ];

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setStrengthResult(calculateStrength(e.target.value));
  };

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsSubmitting(true);
      await registerUser(data.name, data.email, data.password);
      navigate('/');
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
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
                  Join Code & Compass
                </h2>
                <p className="mt-2 text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-purple-600 hover:text-pink-600 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>

              <form className="py-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-8">
                  <div>
                    <label htmlFor="name" className="text-sm font-medium text-gray-700 block mb-2">
                      Full Name
                    </label>
                    <input
                      {...register('name', {
                        required: 'Name is required',
                        minLength: {
                          value: 2,
                          message: 'Name must be at least 2 characters'
                        }
                      })}
                      type="text"
                      className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                      placeholder="John Doe"
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-pink-600">{errors.name.message}</p>
                    )}
                  </div>
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
                        validate: {
                          length: value => value.length >= 8 || 'Password must be at least 8 characters',
                          uppercase: value => /[A-Z]/.test(value) || 'Password must contain an uppercase letter',
                          lowercase: value => /[a-z]/.test(value) || 'Password must contain a lowercase letter',
                          number: value => /\d/.test(value) || 'Password must contain a number',
                          special: value => /[!@#$%^&*(),.?":{}|<>]/.test(value) || 'Password must contain a special character'
                        },
                        onChange: handlePasswordChange
                      })}
                      type="password"
                      className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                    {/* Password Strength Meter */}
                    {password && (
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <Shield className="w-4 h-4 mr-2 text-gray-600" />
                            <span className="text-sm font-medium text-gray-600">Password Strength:</span>
                          </div>
                          <span className={`text-sm font-medium ${getStrengthColor(strengthResult.score).replace('bg-', 'text-')}`}>
                            {getStrengthText(strengthResult.score)}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getStrengthColor(strengthResult.score)} transition-all duration-300`}
                            style={{ width: `${strengthResult.score}%` }}
                          ></div>
                        </div>

                        {/* Strength Categories */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Basic Requirements */}
                          <div className="space-y-2">
                            <div className="flex items-center text-sm font-medium text-gray-700">
                              <Lock className="w-4 h-4 mr-2" />
                              Basic Requirements
                            </div>
                            {strengthResult.checks.slice(0, 7).map((check, index) => (
                              <div key={index} className="flex items-center text-sm">
                                {check.passed ? (
                                  <Check className="w-4 h-4 text-green-500 mr-2" />
                                ) : (
                                  <X className="w-4 h-4 text-red-500 mr-2" />
                                )}
                                <span className={check.passed ? 'text-green-700' : 'text-red-700'}>
                                  {check.message}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Advanced Suggestions */}
                          <div className="space-y-2">
                            <div className="flex items-center text-sm font-medium text-gray-700">
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Advanced Suggestions
                            </div>
                            {strengthResult.checks.slice(7).map((check, index) => (
                              <div key={index} className="flex items-center text-sm">
                                {check.passed ? (
                                  <Check className="w-4 h-4 text-green-500 mr-2" />
                                ) : (
                                  <X className="w-4 h-4 text-gray-400 mr-2" />
                                )}
                                <span className={check.passed ? 'text-green-700' : 'text-gray-500'}>
                                  {check.message}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {errors.password && (
                      <p className="mt-2 text-sm text-pink-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 block mb-2">
                      Confirm Password
                    </label>
                    <input
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: value => value === watch('password') || 'Passwords do not match'
                      })}
                      type="password"
                      className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-pink-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className={`w-full py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 transform transition-all font-medium
                    ${isFormValid 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 hover:scale-[1.02]' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}