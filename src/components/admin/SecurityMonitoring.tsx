import React from 'react';
import { Shield, AlertTriangle, Lock, UserX, Activity } from 'lucide-react';
import { SecurityMetrics } from '../../types';

interface SecurityMonitoringProps {
  metrics: SecurityMetrics;
}

export default function SecurityMonitoring({ metrics }: SecurityMonitoringProps) {
  // Early return with error state if metrics is not provided
  if (!metrics) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to Load Security Metrics</h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Security Score */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Security Score</h3>
          <div className="text-sm text-gray-500">
            Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
          </div>
        </div>
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <svg className="w-32 h-32">
              <circle
                className="text-gray-200"
                strokeWidth="12"
                stroke="currentColor"
                fill="transparent"
                r="56"
                cx="64"
                cy="64"
              />
              <circle
                className={getProgressColor(metrics.securityScore)}
                strokeWidth="12"
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="56"
                cx="64"
                cy="64"
                style={{
                  strokeDasharray: '352',
                  strokeDashoffset: 352 - (352 * metrics.securityScore) / 100,
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%'
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getScoreColor(metrics.securityScore)}`}>
                {metrics.securityScore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed Login Attempts</p>
              <p className="text-2xl font-bold text-red-600">{metrics.failedLogins}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">Last 24 hours</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{metrics.activeUsers}</p>
            </div>
            <Activity className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">Currently online</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Locked Accounts</p>
              <p className="text-2xl font-bold text-orange-600">{metrics.lockedAccounts}</p>
            </div>
            <UserX className="w-8 h-8 text-orange-600" />
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">Requires attention</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">2FA Adoption</p>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round((metrics.mfaEnabled / metrics.totalUsers) * 100)}%
              </p>
            </div>
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">{metrics.mfaEnabled} of {metrics.totalUsers} users</p>
          </div>
        </div>
      </div>

      {/* Additional Security Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device & Browser Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device & Browser Stats</h3>
          <div className="space-y-4">
            {metrics.deviceFingerprints?.map((device, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{device.browser} on {device.os}</span>
                </div>
                <span className="text-sm text-gray-600">{device.count} sessions</span>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
          <div className="space-y-4">
            {metrics.geoData?.map((location, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {location.city}, {location.country}
                  </span>
                  {location.suspicious && (
                    <AlertTriangle className="w-4 h-4 text-orange-500" title="Suspicious Activity" />
                  )}
                </div>
                <span className="text-sm text-gray-600">{location.count} logins</span>
              </div>
            ))}
          </div>
        </div>

        {/* Login Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Login Activity</h3>
          <div className="space-y-4">
            {metrics.loginPatterns?.map((pattern, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Hour {pattern.hour}:00</span>
                  <span className="text-sm text-gray-600">{pattern.count} attempts</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-green-100 rounded h-2" style={{ width: `${(pattern.success/pattern.count)*100}%` }}></div>
                  <div className="flex-1 bg-red-100 rounded h-2" style={{ width: `${(pattern.failure/pattern.count)*100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Factors */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Factors</h3>
          <div className="space-y-4">
            {metrics.riskFactors?.map((risk, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{risk.type}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    risk.severity === 'high' ? 'bg-red-100 text-red-700' :
                    risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {risk.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{risk.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}