import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSession from '../hooks/useSession';
import useCombinedLimits from '../hooks/useCombinedLimits';
import UsageLimitModal from '../components/UsageLimitModal';
import {
  MentalModelIcon,
  ActiveRecallIcon,
  FocusBreakdownIcon,
  CollaborativeScholarIcon,
  CreativeSynthesisIcon
} from '../components/Icons';
import {
  buildGuidedOpeningMessage,
  buildGuidedSessionPlan,
  getCurriculumCountries,
  getCurriculumClasses,
  getCurriculumLanguages,
  getCurriculumTopicSuggestions,
  getCurriculumTracks,
  getCurriculumsForCountry,
  normalizeAcademicProfile,
  parseProfileFromDocument,
  readLocalAcademicProfile,
  splitProfileForStorage,
  writeLocalAcademicProfile,
} from '../utils/curriculum';
import {
  getUserProfile,
  saveUserLearningProfile,
} from '../appwrite/database';

const modes = [
  {
    id: 'mental_model',
    name: 'Mental Model',
    icon: MentalModelIcon,
    tagline: 'Build intuition with analogies',
    description: 'Best for concepts, formulas, theory, and first-principles understanding.',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.08)',
  },
  {
    id: 'active_recall',
    name: 'Active Recall',
    icon: ActiveRecallIcon,
    tagline: 'Test yourself to remember',
    description: 'Best for definitions, facts, exam recall, and quick memory checks.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
  },
  {
    id: 'focus_breakdown',
    name: 'Focus Breakdown',
    icon: FocusBreakdownIcon,
    tagline: 'Turn big topics into steps',
    description: 'Best for dense chapters, crash courses, and time-crunched studying.',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
  },
  {
    id: 'collaborative_scholar',
    name: 'Scholar',
    icon: CollaborativeScholarIcon,
    tagline: 'Discuss, compare, and critique',
    description: 'Best for essays, debate, viewpoints, and deeper reasoning.',
    color: 'var(--color-accent)',
    bg: 'rgba(var(--color-accent-rgb),0.08)',
  },
  {
    id: 'creative_synthesis',
    name: 'Creative Synthesis',
    icon: CreativeSynthesisIcon,
    tagline: 'Learn by making something',
    description: 'Best for mind maps, stories, projects, and visual study artifacts.',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.08)',
  },
];

const ModeSelector = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startSession } = useSession();
  const { canDo, recordUsage, planName } = useCombinedLimits();

  const [selectedMode, setSelectedMode] = useState(modes[0]);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [profile, setProfile] = useState(() => readLocalAcademicProfile());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limitBlocked, setLimitBlocked] = useState(null);

  const countries = useMemo(() => getCurriculumCountries(), []);
  const curriculums = useMemo(
    () => getCurriculumsForCountry(profile.countryCode),
    [profile.countryCode]
  );
  const selectedCurriculum = useMemo(
    () => curriculums.find((item) => item.name === profile.curriculum) || curriculums[0],
    [curriculums, profile.curriculum]
  );
  const topicSuggestions = useMemo(
    () => getCurriculumTopicSuggestions(selectedCurriculum, profile, `${topic} ${description}`),
    [selectedCurriculum, profile, topic, description]
  );
  const visibleTopicSuggestions = topicSuggestions
    .filter((item) => item.label.toLowerCase() !== topic.trim().toLowerCase())
    .slice(0, 12);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    let cancelled = false;
    const loadProfile = async () => {
      try {
        const remoteProfile = await getUserProfile(user.$id);
        if (!cancelled && remoteProfile?.academicProfile) {
          const parsed = parseProfileFromDocument(remoteProfile);
          setProfile(parsed);
          writeLocalAcademicProfile(parsed);
        }
      } catch (err) {
        console.warn('[ModeSelector] Could not load learning profile:', err.message);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  const updateProfile = (patch) => {
    setProfile((prev) => normalizeAcademicProfile({ ...prev, ...patch }));
  };

  const handleCountryChange = (countryCode) => {
    const country = countries.find((item) => item.countryCode === countryCode);
    const curriculum = country?.curriculums?.[0];
    updateProfile({
      countryCode,
      country: country?.country,
      curriculum: curriculum?.name,
      track: curriculum?.tracks?.[0] || '',
      examBoard: curriculum?.name,
      studyLanguage: getCurriculumLanguages(curriculum, { ...profile, countryCode, country: country?.country })[0] || 'English',
    });
  };

  const handleCurriculumChange = (curriculumName) => {
    const curriculum = curriculums.find((item) => item.name === curriculumName);
    updateProfile({
      curriculum: curriculumName,
      track: curriculum?.tracks?.[0] || '',
      examBoard: curriculumName,
    });
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!selectedMode || !topic.trim()) {
      setError('Add a session name or topic first.');
      return;
    }

    const sessionCheck = canDo('sessions');
    if (!sessionCheck.allowed) {
      setLimitBlocked({
        action: 'sessions',
        current: sessionCheck.current,
        limit: sessionCheck.limit,
        planName,
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const normalizedProfile = writeLocalAcademicProfile(profile);
      const storageProfile = splitProfileForStorage(normalizedProfile);
      saveUserLearningProfile(user.$id, storageProfile).catch((err) => {
        console.warn('[ModeSelector] Learning profile was saved locally only:', err.message);
      });

      const plan = buildGuidedSessionPlan({
        topic: topic.trim(),
        description: description.trim(),
        academicProfile: normalizedProfile,
      });
      const guidedPlan = {
        topic: plan.topic,
        description: plan.description,
        sessionType: plan.sessionType,
        examDays: plan.examDays,
        dailyPlan: plan.dailyPlan,
        recommendedActions: plan.recommendedActions,
      };

      const session = await startSession(
        selectedMode.id,
        topic.trim(),
        topic.trim(),
        {
          curriculumContext: {
            ...plan.curriculumContext,
            guidedPlan,
          },
          guidedPlan,
          sessionState: {
            currentStep: plan.currentStep,
            progress: plan.progress,
            weakTopics: plan.weakTopics,
            strongTopics: plan.strongTopics,
          },
          initialAssistantMessage: buildGuidedOpeningMessage(plan),
        }
      );

      recordUsage('sessions');
      navigate(`/session/${session.$id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mode-selector">
      <div className="container">
        <div className="mode-selector-header">
          <button className="btn btn-ghost back-btn" onClick={() => navigate('/dashboard')}>
            Back
          </button>
          <div className="header-content">
            <h1>Create a tutor session</h1>
            <p>LastWeek will use your curriculum, class, language, and situation brief to start the lesson for you.</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="guided-session-shell" onSubmit={handleStartSession}>
          <section className="guided-session-main card">
            <div className="guided-section-heading">
              <span>Session</span>
              <strong>What should the tutor drive?</strong>
            </div>

            <div className="form-group">
              <label htmlFor="guided-topic">Session name or topic</label>
              <input
                id="guided-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={visibleTopicSuggestions[0]?.label || 'e.g. Trigonometry, English grammar, Photosynthesis'}
                className="form-input subject-input"
                autoComplete="off"
                autoFocus
              />
              {visibleTopicSuggestions.length > 0 && (
                <div className="curriculum-topic-suggestions" aria-label="Suggested curriculum topics">
                  <span>Smart suggestions from {profile.curriculum} / {profile.classLevel}</span>
                  <div className="curriculum-topic-chip-row">
                    {visibleTopicSuggestions.map((item) => (
                      <button
                        key={`${item.type}-${item.label}`}
                        type="button"
                        className="curriculum-topic-chip"
                        onClick={() => setTopic(item.label)}
                        title={`${item.type}: ${item.label}`}
                      >
                        <small>{item.type}</small>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="guided-description">Describe your situation, goals, and study needs</label>
              <textarea
                id="guided-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. I have 6 days left, I have not studied this chapter, I need exam-style practice, and I want explanations in German."
                className="form-input guided-textarea"
                rows={4}
              />
            </div>

            <div className="guided-section-heading">
              <span>Learning style</span>
              <strong>Choose how the tutor should teach</strong>
            </div>

            <div className="modes-grid guided-modes-grid">
              {modes.map((mode) => {
                const Icon = mode.icon;
                const isSelected = selectedMode?.id === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    className={`mode-card${isSelected ? ' selected' : ''}`}
                    onClick={() => {
                      setSelectedMode(mode);
                      setError('');
                    }}
                    style={{
                      '--mode-color': mode.color,
                      '--mode-bg': mode.bg,
                    }}
                  >
                    <div className="mode-card-icon">
                      <Icon size={22} />
                    </div>
                    <div className="mode-card-body">
                      <span className="mode-card-name">{mode.name}</span>
                      <span className="mode-card-tagline">{mode.tagline}</span>
                    </div>
                    {isSelected && <span className="mode-card-check">✓</span>}
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="guided-profile-panel card">
            <div className="guided-section-heading">
              <span>Student profile</span>
              <strong>Used automatically in every session</strong>
            </div>

            <div className="guided-profile-grid">
              <label>
                Country
                <select
                  className="form-input"
                  value={profile.countryCode}
                  onChange={(e) => handleCountryChange(e.target.value)}
                >
                  {countries.map((country) => (
                    <option key={country.countryCode} value={country.countryCode}>
                      {country.country}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Curriculum
                <select
                  className="form-input"
                  value={profile.curriculum}
                  onChange={(e) => handleCurriculumChange(e.target.value)}
                >
                  {curriculums.map((curriculum) => (
                    <option key={curriculum.name} value={curriculum.name}>
                      {curriculum.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Version / track
                <select
                  className="form-input"
                  value={profile.track}
                  onChange={(e) => updateProfile({ track: e.target.value, medium: e.target.value })}
                >
                  {getCurriculumTracks(selectedCurriculum).map((track) => (
                    <option key={track} value={track}>
                      {track || 'General'}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Class
                <select
                  className="form-input"
                  value={profile.classLevel}
                  onChange={(e) => updateProfile({ classLevel: e.target.value })}
                >
                  {getCurriculumClasses(selectedCurriculum).map((classLevel) => (
                    <option key={classLevel} value={classLevel}>
                      {classLevel}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Study language
                <select
                  className="form-input"
                  value={profile.studyLanguage}
                  onChange={(e) => updateProfile({
                    studyLanguage: e.target.value,
                    instructionLanguage: e.target.value,
                  })}
                >
                  {getCurriculumLanguages(selectedCurriculum, profile).map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="guided-profile-preview">
              <span>AI will know</span>
              <p>
                {profile.country}, {profile.curriculum}, {profile.track || 'General'}, {profile.classLevel}, {profile.studyLanguage}
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary start-session-btn"
              disabled={!topic.trim() || loading}
              style={{
                background: selectedMode?.color || 'var(--color-accent)',
                borderColor: selectedMode?.color || 'var(--color-accent)',
              }}
            >
              {loading ? 'Starting...' : 'Start guided session'}
            </button>
          </aside>
        </form>
      </div>

      <UsageLimitModal
        isOpen={!!limitBlocked}
        onClose={() => setLimitBlocked(null)}
        action={limitBlocked?.action}
        current={limitBlocked?.current}
        limit={limitBlocked?.limit}
        remaining={limitBlocked?.remaining}
        requested={limitBlocked?.requested}
        planName={limitBlocked?.planName}
      />
    </div>
  );
};

export default ModeSelector;
