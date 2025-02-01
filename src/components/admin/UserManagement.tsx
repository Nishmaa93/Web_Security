import React, { useState } from 'react';
import { User } from '../../types';
import { Loader2, X, Plus } from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

interface UserManagementProps {
  users: User[];
  setUsers: (users: User[]) => void;
  resetting2FA: string | null;
  setResetting2FA: (id: string | null) => void;
}

export default function UserManagement({ users, setUsers, resetting2FA, setResetting2FA }: UserManagementProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [lockingUser, setLockingUser] = useState<string | null>(null);
  const [unlockingUser, setUnlockingUser] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    lockDuration: '15',
    lockReason: 'admin_action',
    permanent: false
  });

  const handleCreateUser = async () => {
    try {
      setCreatingUser(true);
      const { data } = await api.post('/admin/users', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      setUsers([data.user, ...users]);
      toast.success('User created successfully');
      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        lockDuration: '15',
        lockReason: 'admin_action',
        permanent: false
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateUser = async (userId: string) => {
    try {
      setUpdatingUser(userId);
      const { data } = await api.put(`/admin/users/${userId}`, {
        name: formData.name,
        email: formData.email
      });

      setUsers(users.map(u => u._id === userId ? data.user : u));
      toast.success('User updated successfully');
      setShowUpdateModal(false);
      setSelectedUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        lockDuration: '15',
        lockReason: 'admin_action',
        permanent: false
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleLockUser = async (userId: string, permanent: boolean, duration?: number, reason?: string) => {
    try {
      setLockingUser(userId);
      await api.post(`/admin/users/${userId}/lock`, {
        permanent,
        duration,
        reason
      });
      
      setUsers(users.map(user => 
        user._id === userId ? {
          ...user,
          permanentlyLocked: permanent,
          accountLocked: !permanent,
          lockReason: reason
        } : user
      ));
      
      toast.success(`User ${permanent ? 'permanently' : 'temporarily'} locked`);
      setShowLockModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to lock user');
    } finally {
      setLockingUser(null);
    }
  };

  const handleUnlockUser = async (userId: string) => {
    try {
      setUnlockingUser(userId);
      await api.post(`/admin/users/${userId}/unlock`);
      
      setUsers(users.map(user => 
        user._id === userId ? {
          ...user,
          permanentlyLocked: false,
          accountLocked: false,
          lockReason: null
        } : user
      ));
      
      toast.success('User unlocked successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to unlock user');
    } finally {
      setUnlockingUser(null);
    }
  };

  const handleReset2FA = async (userId: string) => {
    try {
      setResetting2FA(userId);
      await api.post(`/users/${userId}/reset-2fa`);
      toast.success('2FA has been reset successfully');
      setUsers(users.map(user => 
        user._id === userId ? { ...user, mfaEnabled: false } : user
      ));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset 2FA');
    } finally {
      setResetting2FA(null);
    }
  };

  const handleUserAction = async (userId: string, action: 'delete' | 'promote' | 'demote') => {
    try {
      if (action === 'delete') {
        await api.delete(`/users/${userId}`);
        setUsers(users.filter(user => user._id !== userId));
        toast.success('User deleted successfully');
      } else if (action === 'promote') {
        await api.put(`/admin/users/${userId}/role`, { role: 'admin' });
        setUsers(users.map(user => 
          user._id === userId ? { ...user, role: 'admin' } : user
        ));
        toast.success('User promoted to admin');
      } else if (action === 'demote') {
        await api.put(`/admin/users/${userId}/role`, { role: 'user' });
        setUsers(users.map(user => 
          user._id === userId ? { ...user, role: 'user' } : user
        ));
        toast.success('Admin demoted to user');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Action failed';
      toast.error(errorMessage);
      console.error('User action error:', error);
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={creatingUser}
          className="btn-primary flex items-center"
        >
          {creatingUser ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </>
          )}
        </button>
      </div>

      {/* User Table */}
      <table className="w-full">
        <thead>
          <tr className="text-left border-b">
            <th className="pb-4 font-semibold text-gray-600">User</th>
            <th className="pb-4 font-semibold text-gray-600">Email</th>
            <th className="pb-4 font-semibold text-gray-600">Role</th>
            <th className="pb-4 font-semibold text-gray-600">Joined</th>
            <th className="pb-4 font-semibold text-gray-600">2FA</th>
            <th className="pb-4 font-semibold text-gray-600">Status</th>
            <th className="pb-4 font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="border-b last:border-0">
              <td className="py-4">
                <div className="flex items-center">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <span className="font-medium text-gray-900">{user.name}</span>
                </div>
              </td>
              <td className="py-4 text-gray-600">{user.email}</td>
              <td className="py-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {user.role}
                </span>
              </td>
              <td className="py-4 text-gray-600">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="py-4">
                {user.mfaEnabled ? (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                    Enabled
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                    Disabled
                  </span>
                )}
              </td>
              <td className="py-4">
                {user.permanentlyLocked ? (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                    Permanently Locked
                  </span>
                ) : user.accountLocked ? (
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                    Temporarily Locked
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                    Active
                  </span>
                )}
              </td>
              <td className="py-4">
                <div className="flex gap-2">
                  {!user.permanentlyLocked && !user.accountLocked && (
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowLockModal(true);
                      }}
                      className="px-3 py-1 text-sm text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors"
                    >
                      Lock
                    </button>
                  )}
                  {(user.permanentlyLocked || user.accountLocked) && (
                    <button
                      onClick={() => handleUnlockUser(user._id)}
                      disabled={unlockingUser === user._id}
                      className="px-3 py-1 text-sm text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      {unlockingUser === user._id ? 'Unlocking...' : 'Unlock'}
                    </button>
                  )}
                  {user.role === 'admin' ? (
                    <button
                      onClick={() => handleUserAction(user._id, 'demote')}
                      className="px-3 py-1 text-sm text-yellow-700 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition-colors"
                    >
                      Demote
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUserAction(user._id, 'promote')}
                      className="px-3 py-1 text-sm text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      Promote
                    </button>
                  )}
                  {user.mfaEnabled && (
                    <button
                      onClick={() => {
                        const modal = document.createElement('div');
                        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                        modal.innerHTML = `
                          <div class="bg-white rounded-xl p-6 max-w-md w-full">
                            <h3 class="text-lg font-semibold mb-4">Reset 2FA</h3>
                            <p class="text-gray-600 mb-6">Are you sure you want to reset 2FA for this user? They will need to set it up again.</p>
                            <div class="flex justify-end gap-4">
                              <button class="px-4 py-2 text-gray-600 hover:text-gray-800" onclick="this.closest('.fixed').remove(); window.resetConfirmed(false)">Cancel</button>
                              <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onclick="this.closest('.fixed').remove(); window.resetConfirmed(true)">Reset 2FA</button>
                            </div>
                          </div>
                        `;
                        document.body.appendChild(modal);
                        window.resetConfirmed = (confirmed: boolean) => {
                          if (confirmed) {
                            handleReset2FA(user._id);
                          }
                        };
                      }}
                      disabled={resetting2FA === user._id}
                      className={`px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors ${
                        resetting2FA === user._id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {resetting2FA === user._id ? 'Resetting...' : 'Reset 2FA'}
                    </button>
                  )}
                  <button
                    onClick={() => handleUserAction(user._id, 'delete')}
                    className="px-3 py-1 text-sm text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setFormData(prev => ({
                        ...prev,
                        name: user.name,
                        email: user.email
                      }));
                      setShowUpdateModal(true);
                    }}
                    disabled={updatingUser === user._id}
                    className="px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    {updatingUser === user._id ? 'Updating...' : 'Edit'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New User</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateUser();
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="btn-primary"
                >
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update User Modal */}
      {showUpdateModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Update User</h3>
              <button onClick={() => setShowUpdateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateUser(selectedUser._id);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingUser === selectedUser._id}
                  className="btn-primary"
                >
                  {updatingUser === selectedUser._id ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lock User Modal */}
      {showLockModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Lock User Account</h3>
              <button onClick={() => setShowLockModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (formData.permanent) {
                handleLockUser(selectedUser._id, true, undefined, formData.lockReason);
              } else {
                const duration = parseInt(formData.lockDuration);
                if (!isNaN(duration) && duration >= 5 && duration <= 10080) {
                  handleLockUser(selectedUser._id, false, duration, formData.lockReason);
                } else {
                  toast.error('Invalid duration. Must be between 5 and 10080 minutes.');
                  return;
                }
              }
              setShowLockModal(false);
            }} className="space-y-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.permanent}
                    onChange={(e) => setFormData(prev => ({ ...prev, permanent: e.target.checked }))}
                    className="rounded text-purple-600 focus:ring-purple-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Permanent Lock</span>
                </label>
              </div>
              {!formData.permanent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lock Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.lockDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, lockDuration: e.target.value }))}
                    min="5"
                    max="10080"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">Between 5 minutes and 7 days (10080 minutes)</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lock Reason</label>
                <select
                  value={formData.lockReason}
                  onChange={(e) => setFormData(prev => ({ ...prev, lockReason: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
                >
                  <option value="suspicious_activity">Suspicious Activity</option>
                  <option value="admin_action">Admin Action</option>
                  <option value="policy_violation">Policy Violation</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLockModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={lockingUser === selectedUser._id}
                  className="btn-primary"
                >
                  {lockingUser === selectedUser._id ? 'Locking...' : 'Lock Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}