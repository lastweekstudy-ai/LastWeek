import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { account } from '../appwrite/config';
import { SettingsIcon, UserIcon, KeyboardIcon, TrashIcon } from '../components/Icons';
import UpgradeButton from '../components/UpgradeButton';
import UsageWidget from '../components/UsageWidget';
import useCombinedLimits from '../hooks/useCombinedLimits';
import { formatLimit } from '../config/planLimits';
import { getUserProfile, saveUserLearningProfile } from '../appwrite/database';
import {
  getCurriculumClasses,
  getCurriculumCountries,
  getCurriculumLanguages,
  getCurriculumsForCountry,
  normalizeAcademicProfile,
  parseProfileFromDocument,
  readLocalAcademicProfile,
  splitProfileForStorage,
  writeLocalAcademicProfile,
} from '../utils/curriculum';

const Settings = () => {
  const { user, logout, isGuest } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { plan, planName, limits, usage, isTestingMode, loading: limitsLoading } = useCombinedLimits();
  const countries = useMemo(() => getCurriculumCountries(), []);

  // Account settings state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [learningProfile, setLearningProfile] = useState(() => readLocalAcademicProfile());
  const [learningProfileNeedsSetup, setLearningProfileNeedsSetup] = useState(false);
  const [learningProfileLoading, setLearningProfileLoading] = useState(false);

  // Show loading skeleton while limits are loading
  const isLoading = limitsLoading || !limits;

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const curriculums = useMemo(
    () => getCurriculumsForCountry(learningProfile.countryCode),
    [learningProfile.countryCode]
  );
  const selectedCurriculum = useMemo(
    () => curriculums.find((item) => item.name === learningProfile.curriculum) || curriculums[0],
    [curriculums, learningProfile.curriculum]
  );

  useEffect(() => {
    if (!user?.$id || isGuest) {
      setLearningProfileNeedsSetup(false);
      return;
    }

    let cancelled = false;

    const loadLearningProfile = async () => {
      try {
        const remoteProfile = await getUserProfile(user.$id);
        if (cancelled) return;

        const parsedProfile = parseProfileFromDocument(remoteProfile);
        const normalized = normalizeAcademicProfile(parsedProfile);
        setLearningProfile(normalized);
        writeLocalAcademicProfile(normalized);
        setLearningProfileNeedsSetup(
          !remoteProfile?.academicProfile ||
          !normalized.countryCode ||
          !normalized.curriculum ||
          !normalized.classLevel ||
          !normalized.studyLanguage
        );
      } catch (error) {
        console.warn('Could not load learning profile:', error);
        if (!cancelled) {
          setLearningProfileNeedsSetup(true);
        }
      }
    };

    loadLearningProfile();
    return () => {
      cancelled = true;
    };
  }, [isGuest, user?.$id]);

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

  const updateLearningProfile = (updates) => {
    setLearningProfile((current) => {
      const normalized = normalizeAcademicProfile({ ...current, ...updates });
      writeLocalAcademicProfile(normalized);
      return normalized;
    });
  };

  const handleLearningCountryChange = (countryCode) => {
    const country = countries.find((item) => item.countryCode === countryCode);
    const countryCurriculums = getCurriculumsForCountry(countryCode);
    const nextCurriculum = countryCurriculums[0];
    const nextProfile = { ...learningProfile, countryCode, country: country?.country };
    updateLearningProfile({
      countryCode,
      country: country?.country,
      curriculum: nextCurriculum?.name || '',
      curriculumVersion: nextCurriculum?.version || '',
      classLevel: nextCurriculum?.classes?.[0] || '',
      examBoard: nextCurriculum?.examBoards?.[0] || nextCurriculum?.name || '',
      studyLanguage: getCurriculumLanguages(nextCurriculum, nextProfile)[0] || 'English',
    });
  };

  const handleLearningCurriculumChange = (curriculumName) => {
    const nextCurriculum = curriculums.find((item) => item.name === curriculumName);
    updateLearningProfile({
      curriculum: curriculumName,
      curriculumVersion: nextCurriculum?.version || '',
      classLevel: nextCurriculum?.classes?.[0] || '',
      examBoard: nextCurriculum?.examBoards?.[0] || curriculumName,
      studyLanguage: getCurriculumLanguages(nextCurriculum, learningProfile)[0] || learningProfile.studyLanguage || 'English',
    });
  };

  const handleSaveLearningProfile = async (e) => {
    e.preventDefault();
    if (isGuest) {
      showMessage('error', 'Guest users cannot save learning profile');
      return;
    }

    try {
      setLearningProfileLoading(true);
      const normalized = normalizeAcademicProfile(learningProfile);
      writeLocalAcademicProfile(normalized);
      await saveUserLearningProfile(user.$id, splitProfileForStorage(normalized));
      setLearningProfileNeedsSetup(false);
      showMessage('success', 'Learning profile saved successfully');
    } catch (error) {
      console.error('Failed to save learning profile:', error);
      showMessage('error', 'Failed to save learning profile: ' + error.message);
    } finally {
      setLearningProfileLoading(false);
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
              className={`settings-tab ${activeTab === 'subscription' ? 'active' : ''}`}
              onClick={() => setActiveTab('subscription')}
            >
              ⭐
              Subscription
            </button>
            <button
              className={`settings-tab ${activeTab === 'learning' ? 'active' : ''}`}
              onClick={() => setActiveTab('learning')}
            >
              <UserIcon size={20} />
              Learning Profile
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

                {!isGuest && learningProfileNeedsSetup && (
                  <div className="alert alert-warning profile-alert">
                    <div>
                      <strong>Complete your learning profile.</strong>
                      <p>
                        Add your country, curriculum, class, exam board, and study language so new sessions can start with the right plan automatically.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setActiveTab('learning')}
                    >
                      Edit Learning Profile
                    </button>
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

            {activeTab === 'learning' && (
              <div className="settings-section learning-profile-form">
                <h2>Learning Profile</h2>
                <p className="settings-description">
                  This profile powers guided tutor sessions, curriculum-aware study plans, and exam-focused recommendations.
                </p>

                <form onSubmit={handleSaveLearningProfile} className="settings-form">
                  <div className="learning-profile-grid">
                    <div className="form-group">
                      <label htmlFor="countryCode">Country</label>
                      <select
                        id="countryCode"
                        value={learningProfile.countryCode}
                        onChange={(e) => handleLearningCountryChange(e.target.value)}
                        disabled={isGuest || learningProfileLoading}
                      >
                        {countries.map((country) => (
                          <option key={country.countryCode} value={country.countryCode}>
                            {country.country}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="curriculum">Curriculum</label>
                      <select
                        id="curriculum"
                        value={learningProfile.curriculum}
                        onChange={(e) => handleLearningCurriculumChange(e.target.value)}
                        disabled={isGuest || learningProfileLoading}
                      >
                        {curriculums.map((curriculum) => (
                          <option key={curriculum.name} value={curriculum.name}>
                            {curriculum.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="classLevel">Class / Level</label>
                      <select
                        id="classLevel"
                        value={learningProfile.classLevel}
                        onChange={(e) => updateLearningProfile({ classLevel: e.target.value })}
                        disabled={isGuest || learningProfileLoading}
                      >
                        {getCurriculumClasses(selectedCurriculum).map((classLevel) => (
                          <option key={classLevel} value={classLevel}>
                            {classLevel}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="examBoard">Board / Track</label>
                      <select
                        id="examBoard"
                        value={learningProfile.examBoard || learningProfile.board || selectedCurriculum?.name || 'General'}
                        onChange={(e) => updateLearningProfile({ examBoard: e.target.value })}
                        disabled={isGuest || learningProfileLoading}
                      >
                        {(selectedCurriculum?.examBoards || [learningProfile.examBoard || learningProfile.board || selectedCurriculum?.name || 'General']).map((board) => (
                          <option key={board} value={board}>
                            {board}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="studyLanguage">Preferred Study Language</label>
                      <select
                        id="studyLanguage"
                        value={learningProfile.studyLanguage}
                        onChange={(e) => updateLearningProfile({ studyLanguage: e.target.value })}
                        disabled={isGuest || learningProfileLoading}
                      >
                        {getCurriculumLanguages(selectedCurriculum, learningProfile).map((language) => (
                          <option key={language} value={language}>
                            {language}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  <div className="guided-profile-preview">
                    <span>Current context</span>
                    <p>
                      {learningProfile.countryCode || 'Country'} / {learningProfile.curriculum || 'Curriculum'} / {learningProfile.classLevel || 'Class'} / {learningProfile.studyLanguage || 'Language'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isGuest || learningProfileLoading}
                  >
                    {learningProfileLoading ? 'Saving...' : 'Save Learning Profile'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="settings-section">
                <h2>Subscription & Usage</h2>
                <p className="settings-description">Your current plan and monthly usage</p>

                {isLoading ? (
                  <div style={{
                    padding: '2rem',
                    borderRadius: '10px',
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    animation: 'pulse 2s infinite',
                  }}>
                    <div style={{ 
                      width: '150px', 
                      height: '24px', 
                      backgroundColor: 'var(--color-bg-tertiary)', 
                      borderRadius: '4px',
                      marginBottom: '0.5rem',
                    }} />
                    <div style={{ 
                      width: '200px', 
                      height: '16px', 
                      backgroundColor: 'var(--color-bg-tertiary)', 
                      borderRadius: '4px',
                    }} />
                  </div>
                ) : (
                  <>
                    {/* Current plan badge */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem',
                      backgroundColor: 'rgba(var(--color-accent-rgb),0.06)', border: '1px solid rgba(var(--color-accent-rgb),0.2)',
                    }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                          {planName} Plan
                        </p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          Resets on the 1st of each month
                        </p>
                      </div>
                      {plan === 'free' ? (
                        <UpgradeButton label="Upgrade" />
                      ) : (
                        <span style={{
                          padding: '0.35rem 0.85rem', borderRadius: '999px',
                          backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981',
                          fontSize: '0.8rem', fontWeight: 700,
                        }}>Active ✓</span>
                      )}
                    </div>

                    {/* Live usage widget */}
                    <UsageWidget />

                    {/* Full limits table */}
                    <div style={{ marginTop: '1.5rem' }}>
                      <h3 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Plan Limits
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                          { label: 'Sessions / month', value: formatLimit(limits.sessions) },
                          { label: 'AI Messages / month', value: formatLimit(limits.messages) },
                          { label: 'PDF Uploads / month', value: formatLimit(limits.pdfs) },
                          { label: 'Max PDF size', value: `${limits.pdfMaxSizeMB} MB` },
                          { label: 'Audio Uploads / month', value: formatLimit(limits.audios) },
                          { label: 'Max Audio size', value: `${limits.audioMaxSizeMB} MB` },
                          { label: 'Flashcards / month', value: formatLimit(limits.flashcards) },
                          { label: 'MCQs / month', value: formatLimit(limits.mcqs) },
                          { label: 'Exam Plans (active)', value: formatLimit(limits.examPlans) },
                          { label: 'Language Learning', value: limits.languageLearning ? '✅ Included' : '❌ Not included' },
                          { label: 'Storage', value: limits.storageMB >= 1024 ? `${limits.storageMB / 1024} GB` : `${limits.storageMB} MB` },
                        ].map(({ label, value }) => (
                          <div key={label} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '0.5rem 0.75rem', borderRadius: '6px',
                            backgroundColor: 'var(--color-bg-tertiary)',
                            fontSize: '0.875rem',
                          }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {plan === 'free' && (
                      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <button
                          onClick={() => navigate('/pricing')}
                          style={{
                            padding: '0.65rem 1.5rem', borderRadius: '8px', border: 'none',
                            backgroundColor: 'var(--color-accent)', color: 'white', cursor: 'pointer',
                            fontWeight: 600, fontSize: '0.9rem',
                          }}
                        >
                          See All Plans →
                        </button>
                      </div>
                    )}
                  </>
                )}
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
