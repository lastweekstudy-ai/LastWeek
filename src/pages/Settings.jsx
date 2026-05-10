import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { account } from '../appwrite/config';
import { SettingsIcon, UserIcon, KeyboardIcon, TrashIcon } from '../components/Icons';
import '../styles/Settings.css';

const Settings = () => {
  const { user, logout, isGuest } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Account settings state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (isGuest) {
      showMessage('error', 'Guest users cannot update profile');
      return;
    }

    try {
      setLoading(true);
      await account.updateName(name);
      showMessage('success', 'Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      showMessage('error', 'Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (isGuest) {
      showMessage('error', 'Guest users cannot change password');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      await account.updatePassword(newPassword, currentPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showMessage('success', 'Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      showMessage('error', 'Failed to change password: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isGuest) {
      showMessage('error', 'Guest users cannot delete account');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.'
    );

    if (!confirmed) return;

    const doubleConfirm = window.prompt(
      'Type "DELETE" to confirm account deletion:'
    );

    if (doubleConfirm !== 'DELETE') {
      showMessage('error', 'Account deletion cancelled');
      return;
    }

    try {
      setLoading(true);
      // Note: Appwrite doesn't have a direct delete account method
      // You would need to implement this via your backend
      showMessage('error', 'Account deletion is not yet implemented. Please contact support.');
    } catch (error) {
      console.error('Failed to delete account:', error);
      showMessage('error', 'Failed to delete account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const keyboardShortcuts = [
    { keys: 'Ctrl + K', description: 'Show keyboard shortcuts' },
    { keys: 'Ctrl + D', description: 'Go to dashboard' },
    { keys: 'Ctrl + N', description: 'New session' },
    { keys: 'Ctrl + F', description: 'Focus search' },
    { keys: 'Ctrl + Shift + T', description: 'Toggle theme' },
    { keys: 'Escape', description: 'Clear selection / Close modals' },
  ];

  return (
    <div className="settings-page">
      <div className="container">
        <div className="settings-header">
          <h1>
            <SettingsIcon size={32} />
            Settings
          </h1>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>

        {message.text && (
          <div className={`settings-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="settings-layout">
          <div className="settings-sidebar">
            <button
              className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <UserIcon size={20} />
              Account
            </button>
            <button
              className={`settings-tab ${activeTab === 'shortcuts' ? 'active' : ''}`}
              onClick={() => setActiveTab('shortcuts')}
            >
              <KeyboardIcon size={20} />
              Keyboard Shortcuts
            </button>
            <button
              className={`settings-tab ${activeTab === 'danger' ? 'active' : ''}`}
              onClick={() => setActiveTab('danger')}
            >
              <TrashIcon size={20} />
              Danger Zone
            </button>
          </div>

          <div className="settings-content">
            {activeTab === 'account' && (
              <div className="settings-section">
                <h2>Account Information</h2>
                <p className="settings-description">
                  Update your account details and preferences
                </p>

                {isGuest && (
                  <div className="alert alert-warning">
                    You are using a guest account. Some features are limited.
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="settings-form">
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isGuest || loading}
                      placeholder="Your name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      placeholder="Your email"
                    />
                    <small className="form-help">Email cannot be changed</small>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isGuest || loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>

                <hr className="settings-divider" />

                <h3>Change Password</h3>
                <form onSubmit={handleChangePassword} className="settings-form">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isGuest || loading}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isGuest || loading}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isGuest || loading}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isGuest || loading}
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="settings-section">
                <h2>Keyboard Shortcuts</h2>
                <p className="settings-description">
                  Use these keyboard shortcuts to navigate faster
                </p>

                <div className="shortcuts-list">
                  {keyboardShortcuts.map((shortcut, index) => (
                    <div key={index} className="shortcut-item">
                      <div className="shortcut-keys">
                        {shortcut.keys.split(' + ').map((key, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span className="shortcut-plus">+</span>}
                            <kbd className="shortcut-key">{key}</kbd>
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="shortcut-description">{shortcut.description}</div>
                    </div>
                  ))}
                </div>

                <div className="alert alert-info" style={{ marginTop: '24px' }}>
                  <strong>Tip:</strong> Press Ctrl + K anywhere to see all available shortcuts
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="settings-section">
                <h2>Danger Zone</h2>
                <p className="settings-description">
                  Irreversible and destructive actions
                </p>

                <div className="danger-zone">
                  <div className="danger-item">
                    <div>
                      <h3>Delete Account</h3>
                      <p>
                        Permanently delete your account and all associated data.
                        This action cannot be undone.
                      </p>
                    </div>
                    <button
                      className="btn btn-danger"
                      onClick={handleDeleteAccount}
                      disabled={isGuest || loading}
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
