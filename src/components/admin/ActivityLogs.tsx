import React from 'react';
import { ActivityLog } from '../../types';
import { Clock, Globe, User, Activity, AlertTriangle, ArrowDown, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Edit, Settings, Eye, List, FileText } from 'lucide-react';

interface ActivityLogsProps {
  logs: ActivityLog[];
  currentPage: number;
  totalPages: number;
  totalLogs: number;
  onPageChange: (page: number) => void;
  currentPage: number;
  totalPages: number;
  totalLogs: number;
  onPageChange: (page: number) => void;
}

const getMethodColor = (method: string) => {
  const upperMethod = method?.toUpperCase() || 'GET';
  switch (upperMethod) {
    case 'GET':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'POST':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'PUT':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'DELETE':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'PATCH':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'OPTIONS':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'HEAD':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getMethodIcon = (method: string) => {
  const upperMethod = method?.toUpperCase() || 'GET';
  switch (upperMethod) {
    case 'GET':
      return <ArrowDown className="w-4 h-4" />;
    case 'POST':
      return <Plus className="w-4 h-4" />;
    case 'PUT':
      return <Pencil className="w-4 h-4" />;
    case 'DELETE':
      return <Trash2 className="w-4 h-4" />;
    case 'PATCH':
      return <Edit className="w-4 h-4" />;
    case 'OPTIONS':
      return <Settings className="w-4 h-4" />;
    case 'HEAD':
      return <Eye className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
};

export default function ActivityLogs({ logs, currentPage, totalPages, totalLogs, onPageChange }: ActivityLogsProps) {
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{totalLogs}</p>
            </div>
            <Activity className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Page</p>
              <p className="text-2xl font-bold text-gray-900">{currentPage} of {totalPages}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Showing</p>
              <p className="text-2xl font-bold text-gray-900">{logs.length} Logs</p>
            </div>
            <List className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Activity Log List */}
      {logs.map((log) => (
        <div key={log._id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
              <span className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 ${getMethodColor(log.method || 'GET')}`}>
                {getMethodIcon(log.method || 'GET')}
                <span>{(log.method || 'GET').toUpperCase()}</span>
              </span>
              <span className="font-medium text-gray-900">{log.action}</span>
              {log.status === 'failure' && (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              {new Date(log.createdAt).toLocaleString()}
            </div>
          </div>
          
          {/* Request Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-start gap-2">
              <Globe className="w-4 h-4 mt-1 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-700">Endpoint</div>
                <div className="text-sm text-gray-600 break-all font-mono bg-gray-50 p-2 rounded-lg mt-1">
                  {log.endpoint || 'N/A'}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Activity className="w-4 h-4 mt-1 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-700">Response</div>
                <div className="text-sm font-mono bg-gray-50 p-2 rounded-lg mt-1">
                  Status: <span className={log.responseStatus >= 400 ? 'text-red-600' : 'text-green-600'}>
                    {log.responseStatus || 'N/A'}
                  </span>
                  {log.responseTime && ` • ${log.responseTime}ms`}
                </div>
              </div>
            </div>
          </div>

          {/* User Info */}
          {log.user && (
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-gray-400" />
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(log.user.name)}`}
                alt={log.user.name}
                className="w-6 h-6 rounded-full mr-2"
              />
              <span className="text-sm text-gray-600">{log.user.name} ({log.user.email})</span>
            </div>
          )}
          
          {/* Client Info */}
          <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">IP:</span>
              <span>{log.ipAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">User Agent:</span>
              <span className="truncate">{log.userAgent}</span>
            </div>
          </div>
          
          {/* Additional Details */}
          {log.details && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Additional Details</div>
              <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto font-mono border border-gray-100">
              {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-8 bg-white rounded-xl p-6 shadow-sm">
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg transition-colors ${
              currentPage === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg transition-colors ${
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {logs.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Activity Logs Found</h3>
          <p className="text-gray-600">Try adjusting your search filters to see more results.</p>
        </div>
      )}
    </div>
  );
}