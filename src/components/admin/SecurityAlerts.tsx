import React from 'react';
import { Bell, AlertTriangle, Shield, Clock } from 'lucide-react';

interface SecurityAlert {
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
  };
}

interface SecurityAlertsProps {
  alerts: SecurityAlert[];
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
}

export default function SecurityAlerts({ alerts, onAcknowledge, onResolve }: SecurityAlertsProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 text-red-700';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Security Alerts</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {alerts.filter(a => a.status === 'new').length} new alerts
          </span>
          <Bell className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`border-l-4 bg-white p-6 rounded-r-xl shadow-sm ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <AlertTriangle className={`w-5 h-5 ${getSeverityColor(alert.severity).split(' ')[1]}`} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(alert.status)}`}>
                      {alert.status.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900">{alert.type}</h4>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                {new Date(alert.timestamp).toLocaleString()}
              </div>
            </div>

            <p className="text-gray-600 mb-4">{alert.message}</p>

            {/* Alert Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alert.details.location && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Location:</span>
                    <span className="text-sm text-gray-600 ml-2">{alert.details.location}</span>
                  </div>
                )}
                {alert.details.ipAddress && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">IP Address:</span>
                    <span className="text-sm text-gray-600 ml-2">{alert.details.ipAddress}</span>
                  </div>
                )}
                {alert.details.userAgent && (
                  <div className="col-span-2">
                    <span className="text-sm font-medium text-gray-700">User Agent:</span>
                    <span className="text-sm text-gray-600 ml-2">{alert.details.userAgent}</span>
                  </div>
                )}
                {alert.details.userId && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">User ID:</span>
                    <span className="text-sm text-gray-600 ml-2">{alert.details.userId}</span>
                  </div>
                )}
                {alert.details.actionTaken && (
                  <div className="col-span-2">
                    <span className="text-sm font-medium text-gray-700">Action Taken:</span>
                    <span className="text-sm text-gray-600 ml-2">{alert.details.actionTaken}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {alert.status !== 'resolved' && (
              <div className="flex justify-end gap-4">
                {alert.status === 'new' && (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
                <button
                  onClick={() => onResolve(alert.id)}
                  className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                >
                  Mark as Resolved
                </button>
              </div>
            )}
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No security alerts at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}