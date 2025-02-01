import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

interface SecuritySettingsProps {
  settings: {
    requireAdminMFA: boolean;
    passwordExpiryDays: number;
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
    sessionTimeoutMinutes: number;
    rateLimits: {
      [key: string]: {
        windowMs: number;
        maxRequests: number;
      };
    };
  };
  onUpdate: (settings: any) => void;
}

export default function SecuritySettings({ settings, onUpdate }: SecuritySettingsProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(settings);

  const handleChange = (setting: string, value: number | boolean) => {
    if (setting.startsWith('rateLimits.')) {
      const [_, type, field] = setting.split('.');
      setFormData(prev => ({
        ...prev,
        rateLimits: {
          ...prev.rateLimits,
          [type]: {
            ...prev.rateLimits[type],
            [field]: value
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [setting]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/security/settings', formData);
      onUpdate(formData);
      toast.success('Security settings updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update security settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
        
        <div className="space-y-6">
          {/* 2FA Requirement */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Require 2FA for Admins
              </label>
              <p className="text-sm text-gray-500">
                All administrators must enable two-factor authentication
              </p>
            </div>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                className="hidden"
                checked={formData.requireAdminMFA}
                onChange={(e) => handleChange('requireAdminMFA', e.target.checked)}
                id="admin-mfa"
              />
              <label
                htmlFor="admin-mfa"
                className={`absolute cursor-pointer inset-0 rounded-full transition duration-300 ${
                  formData.requireAdminMFA ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform duration-300 transform bg-white ${
                    formData.requireAdminMFA ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </label>
            </div>
          </div>

          {/* Password Expiry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password Expiry (Days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={formData.passwordExpiryDays}
              onChange={(e) => handleChange('passwordExpiryDays', parseInt(e.target.value))}
              className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <p className="mt-1 text-sm text-gray-500">
              Users will be required to change their password after this many days
            </p>
          </div>

          {/* Max Login Attempts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Login Attempts
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.maxLoginAttempts}
              onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value))}
              className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <p className="mt-1 text-sm text-gray-500">
              Number of failed attempts before account lockout
            </p>
          </div>

          {/* Lockout Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Lockout Duration (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="1440"
              value={formData.lockoutDurationMinutes}
              onChange={(e) => handleChange('lockoutDurationMinutes', parseInt(e.target.value))}
              className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <p className="mt-1 text-sm text-gray-500">
              Duration of account lockout after exceeding maximum login attempts
            </p>
          </div>

          {/* Session Timeout */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Timeout (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="1440"
              value={formData.sessionTimeoutMinutes}
              onChange={(e) => handleChange('sessionTimeoutMinutes', parseInt(e.target.value))}
              className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <p className="mt-1 text-sm text-gray-500">
              Users will be logged out after this period of inactivity
            </p>
          </div>

          {/* Rate Limits */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Rate Limits</h4>
            {Object.entries(formData.rateLimits).map(([type, limits]) => (
              <div key={type} className="mb-6">
                <h5 className="text-sm font-medium text-gray-900 mb-2 capitalize">{type} Endpoints</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Window (Minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={limits.windowMs / 60000} // Convert from ms to minutes
                      onChange={(e) => handleChange(
                        `rateLimits.${type}.windowMs`,
                        parseInt(e.target.value) * 60000
                      )}
                      className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Requests
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={limits.maxRequests}
                      onChange={(e) => handleChange(
                        `rateLimits.${type}.maxRequests`,
                        parseInt(e.target.value)
                      )}
                      className="w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Security Settings'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}