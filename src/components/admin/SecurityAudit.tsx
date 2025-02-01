import React from 'react';
import { Shield, AlertTriangle, Lock, UserCheck, FileText, Activity } from 'lucide-react';

interface AuditMetrics {
  vulnerabilities: {
    high: number;
    medium: number;
    low: number;
  };
  securityScore: number;
  lastAudit: string;
  findings: Array<{
    id: string;
    type: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    recommendation: string;
    affectedComponent: string;
    discoveredAt: string;
  }>;
  complianceStatus: {
    gdpr: boolean;
    hipaa: boolean;
    pci: boolean;
    iso27001: boolean;
  };
}

interface SecurityAuditProps {
  metrics: AuditMetrics;
}

export default function SecurityAudit({ metrics }: SecurityAuditProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getComplianceIcon = (status: boolean) => {
    return status ? (
      <div className="w-4 h-4 rounded-full bg-green-500" />
    ) : (
      <div className="w-4 h-4 rounded-full bg-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Security Score */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Security Score</h3>
          <span className="text-sm text-gray-500">
            Last Audit: {new Date(metrics.lastAudit).toLocaleDateString()}
          </span>
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
                className="text-purple-600"
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
              <span className="text-2xl font-bold">{metrics.securityScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vulnerability Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">High Risk</h4>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">{metrics.vulnerabilities.high}</p>
          <p className="text-sm text-gray-500">Critical vulnerabilities</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Medium Risk</h4>
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">{metrics.vulnerabilities.medium}</p>
          <p className="text-sm text-gray-500">Moderate vulnerabilities</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Low Risk</h4>
            <AlertTriangle className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{metrics.vulnerabilities.low}</p>
          <p className="text-sm text-gray-500">Minor vulnerabilities</p>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">GDPR</span>
            </div>
            {getComplianceIcon(metrics.complianceStatus.gdpr)}
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">HIPAA</span>
            </div>
            {getComplianceIcon(metrics.complianceStatus.hipaa)}
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">PCI DSS</span>
            </div>
            {getComplianceIcon(metrics.complianceStatus.pci)}
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">ISO 27001</span>
            </div>
            {getComplianceIcon(metrics.complianceStatus.iso27001)}
          </div>
        </div>
      </div>

      {/* Security Findings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Findings</h3>
        <div className="space-y-4">
          {metrics.findings.map((finding) => (
            <div
              key={finding.id}
              className={`border-l-4 p-4 rounded-r-lg ${getSeverityColor(finding.severity)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(finding.severity)}`}>
                  {finding.severity.toUpperCase()}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(finding.discoveredAt).toLocaleDateString()}
                </span>
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">{finding.type}</h4>
              <p className="text-sm text-gray-600 mb-2">{finding.description}</p>
              <div className="text-sm">
                <p className="font-medium text-gray-900">Affected Component:</p>
                <p className="text-gray-600">{finding.affectedComponent}</p>
              </div>
              <div className="text-sm mt-2">
                <p className="font-medium text-gray-900">Recommendation:</p>
                <p className="text-gray-600">{finding.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}