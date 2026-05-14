import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLanguageUser, getRoadmap, getAllLessons, LANGUAGES } from '../appwrite/languageLearning';

/**
 * Lesson Selection Page
 * Shows the roadmap stages and modules, with completion status for each.
 */
const LanguageLearningLessons = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [expandedStage, setExpandedStage] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [profile, roadmapData, lessons] = await Promise.all([
        getLanguageUser(user.$id),
        getRoadmap(user.$id),
        getAllLessons(user.$id),
      ]);

      if (!profile) { navigate('/language-learning'); return; }

      setUserData(profile);
      setCompletedLessons(lessons || []);

      if (roadmapData?.roadmap) {
        const parsed = typeof roadmapData.roadmap === 'string'
          ? JSON.parse(roadmapData.roadmap)
          : roadmapData.roadmap;
        setRoadmap(parsed);
        // Auto-expand current stage
        const currentStage = profile.currentStage || 'beginner';
        const stageIndex = parsed.findIndex(s =>
          s.stageId === currentStage || s.stageName?.toLowerCase().includes(currentStage)
        );
        setExpandedStage(stageIndex >= 0 ? stageIndex : 0);
      }
    } catch (err) {
      console.error('Error loading lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLessonStatus = (moduleId, stageId) => {
    const lesson = completedLessons.find(
      l => l.moduleId === moduleId && l.stageName === stageId
    );
    if (!lesson) return 'available';
    return lesson.status; // 'completed' | 'in_progress'
  };

  const getLessonScore = (moduleId, stageId) => {
    const lesson = completedLessons.find(
      l => l.moduleId === moduleId && l.stageName === stageId
    );
    return lesson?.score || 0;
  };

  const getStatusIcon = (status, score) => {
    if (status === 'completed') return score >= 100 ? '🌟' : '✅';
    if (status === 'in_progress') return '⏳';
    return '📖';
  };

  // Check if a stage is unlocked (all modules in previous stage are completed)
  const isStageLocked = (stageIndex) => {
    if (stageIndex === 0) return false; // First stage is always unlocked
    
    const previousStage = roadmap[stageIndex - 1];
    if (!previousStage) return false;
    
    // Count completed modules in previous stage
    const completedInPrevious = previousStage.modules?.filter(m => {
      const status = getLessonStatus(m.moduleId, previousStage.stageId);
      return status === 'completed';
    }).length || 0;
    
    const totalInPrevious = previousStage.modules?.length || 0;
    
    // Stage is locked if not all modules in previous stage are completed
    return completedInPrevious < totalInPrevious;
  };

  // Get lock reason message
  const getLockReason = (stageIndex) => {
    if (stageIndex === 0) return null;
    
    const previousStage = roadmap[stageIndex - 1];
    const completedInPrevious = previousStage.modules?.filter(m => {
      const status = getLessonStatus(m.moduleId, previousStage.stageId);
      return status === 'completed';
    }).length || 0;
    
    const totalInPrevious = previousStage.modules?.length || 0;
    
    return `Complete all ${totalInPrevious} modules in ${previousStage.stageName} first (${completedInPrevious}/${totalInPrevious} done)`;
  };

  const targetLang = LANGUAGES.TARGET.find(l => l.code === userData?.targetLanguage);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Loading your roadmap...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/language-learning')}
          style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '0.5rem', padding: '0.5rem 1rem', color: 'var(--color-text-primary)', cursor: 'pointer' }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>
            {targetLang?.flag} {targetLang?.name} Lessons
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {completedLessons.filter(l => l.status === 'completed').length} lessons completed
          </p>
        </div>
      </div>

      {/* Roadmap stages */}
      {roadmap ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {roadmap.map((stage, stageIndex) => {
            const isExpanded = expandedStage === stageIndex;
            const stageCompleted = stage.modules?.filter(m =>
              getLessonStatus(m.moduleId, stage.stageId) === 'completed'
            ).length || 0;
            const stageTotal = stage.modules?.length || 0;

            return (
              <div key={stage.stageId || stageIndex} style={{ background: 'var(--color-bg-secondary)', borderRadius: '0.75rem', border: '1px solid var(--color-border)', overflow: 'hidden', opacity: isStageLocked(stageIndex) ? 0.6 : 1 }}>
                {/* Stage header */}
                <button
                  onClick={() => !isStageLocked(stageIndex) && setExpandedStage(isExpanded ? null : stageIndex)}
                  disabled={isStageLocked(stageIndex)}
                  title={isStageLocked(stageIndex) ? getLockReason(stageIndex) : ''}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'none', border: 'none', color: 'var(--color-text-primary)', cursor: isStageLocked(stageIndex) ? 'not-allowed' : 'pointer', textAlign: 'left' }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isStageLocked(stageIndex) && <span>🔒</span>}
                      {stage.stageName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      {isStageLocked(stageIndex) 
                        ? getLockReason(stageIndex)
                        : `${stageCompleted}/${stageTotal} modules completed`
                      }
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Mini progress bar */}
                    <div style={{ width: '80px', height: '6px', background: 'var(--color-bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${stageTotal > 0 ? (stageCompleted / stageTotal) * 100 : 0}%`, background: 'var(--color-accent)', borderRadius: '3px', transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Modules list */}
                {isExpanded && !isStageLocked(stageIndex) && (
                  <div style={{ borderTop: '1px solid var(--color-border)', padding: '0.5rem' }}>
                    {stage.modules?.map((module, modIndex) => {
                      const status = getLessonStatus(module.moduleId, stage.stageId);
                      const score = getLessonScore(module.moduleId, stage.stageId);
                      const icon = getStatusIcon(status, score);

                      return (
                        <button
                          key={module.moduleId || modIndex}
                          onClick={() => navigate(`/language-learning/lessons/${encodeURIComponent(module.moduleId)}/${encodeURIComponent(stage.stageId)}`)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            background: status === 'in_progress' ? '#f59e0b10' : 'none',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: 'var(--color-text-primary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            marginBottom: '0.25rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                            <div>
                              <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>{module.moduleName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                ~{module.estimatedMinutes || 15} min · {module.pointsReward || 50} XP
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {status === 'completed' && score > 0 && (
                              <span style={{ fontSize: '0.8rem', color: score >= 100 ? '#f59e0b' : '#10b981', fontWeight: '600' }}>{score}%</span>
                            )}
                            {status === 'in_progress' && (
                              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#f59e0b20', color: '#f59e0b', borderRadius: '1rem' }}>Resume</span>
                            )}
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>→</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          <p>No roadmap found. Go back and generate one.</p>
          <button onClick={() => navigate('/language-learning')} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageLearningLessons;
