import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { generateSecureFilename, validateImageFile } from '../utils/fileUpload';
import { useAuth } from '../context/AuthContext';
import { User, Camera, Loader2, Lock, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { calculateStrength, getStrengthColor, getStrengthText } from '../utils/passwordStrength';

interface ProfileForm {
  name: string;
  avatar: FileList;
  bio: string;
  location: string;
  website: string;
  twitter: string;
  github: string;
  linkedin: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, checks: [] });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar);
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || '',
      twitter: user?.socialLinks?.twitter || '',
      github: user?.socialLinks?.github || '',
      linkedin: user?.socialLinks?.linkedin || ''
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm<PasswordForm>();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      validateImageFile(file);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPasswordStrength(calculateStrength(newPassword));
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      setIsChangingPassword(true);
      await api.put('/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success('Password changed successfully');
      resetPassword();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    try {
      setIsSubmitting(true);

      let avatarUrl = user?.avatar;

      // Upload new avatar if provided
      if (data.avatar?.length > 0) {
        const formData = new FormData();
        formData.append('image', data.avatar[0]);
        const response = await api.post('/upload', formData);
        avatarUrl = response.data.url;
      }

      const profileData = {
        name: data.name,
        avatar: avatarUrl,
        bio: data.bio,
        location: data.location,
        website: data.website,
        socialLinks: {
          twitter: data.twitter,
          github: data.github,
          linkedin: data.linkedin
        }
      };

      await api.put('/users/profile', profileData);
      // Update only the fields that were changed
      updateUser({
        name: profileData.name,
        avatar: profileData.avatar,
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website,
        socialLinks: profileData.socialLinks
      });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Profile Picture
            </label>
            <div className="flex items-center gap-8">
              <div className="relative group">
                <img
                  src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}`}
                  alt={user?.name}
                  className="w-32 h-32 rounded-full object-cover"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                >
                  <Camera className="w-8 h-8 text-white" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  {...register('avatar')}
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{user?.name}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                {...register('bio')}
                rows={4}
                className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                {...register('location')}
                type="text"
                className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="City, Country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                {...register('website')}
                type="url"
                className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Social Links</h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter
                </label>
                <input
                  {...register('twitter')}
                  type="text"
                  className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="@username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub
                </label>
                <input
                  {...register('github')}
                  type="text"
                  className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn
                </label>
                <input
                  {...register('linkedin')}
                  type="text"
                  className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="username"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Password Change Section */}
      <div className="bg-white rounded-2xl shadow-lg mt-8 overflow-hidden">
        <button
          onClick={() => setShowPasswordSection(!showPasswordSection)}
          className="w-full p-8 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold">Change Password</h2>
          </div>
          {showPasswordSection ? (
            <ChevronUp className="w-6 h-6 text-gray-500" />
          ) : (
            <ChevronDown className="w-6 h-6 text-gray-500" />
          )}
        </button>

        {showPasswordSection && <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="p-8 pt-0 space-y-6 border-t">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                {...registerPassword('currentPassword', {
                  required: 'Current password is required'
                })}
                type={showCurrentPassword ? 'text' : 'password'}
                className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                {...registerPassword('newPassword', {
                  required: 'New password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  },
                  validate: {
                    uppercase: value => /[A-Z]/.test(value) || 'Must contain uppercase letter',
                    lowercase: value => /[a-z]/.test(value) || 'Must contain lowercase letter',
                    number: value => /\d/.test(value) || 'Must contain number',
                    special: value => /[!@#$%^&*(),.?":{}|<>]/.test(value) || 'Must contain special character'
                  },
                  onChange: handlePasswordChange
                })}
                type={showNewPassword ? 'text' : 'password'}
                className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
            )}
            
            {/* Password Strength Indicator */}
            {watchPassword('newPassword') && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">Password Strength:</span>
                  </div>
                  <span className={`text-sm font-medium ${getStrengthColor(passwordStrength.score).replace('bg-', 'text-')}`}>
                    {getStrengthText(passwordStrength.score)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStrengthColor(passwordStrength.score)} transition-all duration-300`}
                    style={{ width: `${passwordStrength.score}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                {...registerPassword('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === watchPassword('newPassword') || 'Passwords do not match'
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="btn-primary flex items-center"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Changing Password...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>}
      </div>
    </main>
  );
}