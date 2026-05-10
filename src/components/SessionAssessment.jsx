import React, { useState } from 'react';
import { CheckIcon } from './Icons';
import '../styles/SessionAssessment.css';

const SessionAssessment = ({ mode, onComplete, onSkip }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState({});
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Mode-specific questions
  const questions = getQuestionsForMode(mode);

  const handleOptionClick = (questionKey, value) => {
    const newResponses = {
      ...responses,
      [questionKey]: value
    };
    setResponses(newResponses);
    setShowCustomInput(false);
    setCustomInput('');

    // Auto-advance to next question
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        onComplete(newResponses);
      }
    }, 300);
  };

  const handleCustomSubmit = (questionKey) => {
    if (customInput.trim()) {
      handleOptionClick(questionKey, customInput.trim());
    }
  };

  const handleSkip = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      onSkip(responses);
    }
  };

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="session-assessment">
      <div className="assessment-container">
        <div className="assessment-header">
          <h2>Let's Personalize Your Learning</h2>
          <p>Answer a few questions so I can help you better</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>

        <div className="assessment-question">
          <h3>{question.question}</h3>
          {question.subtitle && <p className="question-subtitle">{question.subtitle}</p>}

          <div className="assessment-options">
            {question.options.map((option, index) => (
              <button
                key={index}
                className={`option-btn ${responses[question.key] === option.value ? 'selected' : ''}`}
                onClick={() => handleOptionClick(question.key, option.value)}
              >
                <span className="option-icon">{option.icon}</span>
                <div className="option-content">
                  <div className="option-label">{option.label}</div>
                  {option.description && (
                    <div className="option-description">{option.description}</div>
                  )}
                </div>
                {responses[question.key] === option.value && (
                  <CheckIcon size={20} className="check-icon" />
                )}
              </button>
            ))}

            {question.allowCustom && (
              <div className="custom-option">
                {!showCustomInput ? (
                  <button
                    className="option-btn custom-trigger"
                    onClick={() => setShowCustomInput(true)}
                  >
                    <span className="option-icon">✏️</span>
                    <div className="option-content">
                      <div className="option-label">Other (specify)</div>
                    </div>
                  </button>
                ) : (
                  <div className="custom-input-container">
                    <input
                      type="text"
                      className="custom-input"
                      placeholder="Type your answer..."
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCustomSubmit(question.key);
                        }
                      }}
                      autoFocus
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleCustomSubmit(question.key)}
                      disabled={!customInput.trim()}
                    >
                      Submit
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="assessment-actions">
            <button className="btn btn-ghost" onClick={handleSkip}>
              Skip
            </button>
            {currentQuestion > 0 && (
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Define questions for each mode
function getQuestionsForMode(mode) {
  const commonQuestions = [
    {
      key: 'currentLevel',
      question: "What's your current knowledge level on this topic?",
      subtitle: 'This helps me adjust the complexity of explanations',
      options: [
        { value: 'complete_beginner', label: 'Complete Beginner', icon: '🌱', description: 'Never studied this before' },
        { value: 'beginner', label: 'Beginner', icon: '📚', description: 'Know the basics' },
        { value: 'intermediate', label: 'Intermediate', icon: '🎯', description: 'Comfortable with fundamentals' },
        { value: 'advanced', label: 'Advanced', icon: '🚀', description: 'Deep understanding, need refinement' }
      ],
      allowCustom: false
    },
    {
      key: 'timeAvailable',
      question: 'How much time do you have to study?',
      subtitle: "I'll pace the content accordingly",
      options: [
        { value: '1-2_days', label: '1-2 Days', icon: '⚡', description: 'Urgent - need quick mastery' },
        { value: '3-5_days', label: '3-5 Days', icon: '📅', description: 'About a week' },
        { value: '1-2_weeks', label: '1-2 Weeks', icon: '📆', description: 'Comfortable timeline' },
        { value: 'flexible', label: 'Flexible', icon: '🕐', description: 'No rush, thorough learning' }
      ],
      allowCustom: false
    }
  ];

  const modeSpecificQuestions = {
    mental_model: [
      {
        key: 'learningGoal',
        question: 'What do you want to achieve?',
        options: [
          { value: 'understand_concepts', label: 'Understand Core Concepts', icon: '🧠', description: 'Build intuitive understanding' },
          { value: 'connect_ideas', label: 'Connect Ideas', icon: '🔗', description: 'See how things relate' },
          { value: 'real_world_application', label: 'Real-World Application', icon: '🌍', description: 'Apply to practical scenarios' },
          { value: 'teach_others', label: 'Teach Others', icon: '👥', description: 'Explain to someone else' }
        ],
        allowCustom: true
      },
      {
        key: 'preferredStyle',
        question: 'How do you learn best?',
        options: [
          { value: 'analogies', label: 'Analogies & Metaphors', icon: '🎭', description: 'Compare to familiar things' },
          { value: 'visual', label: 'Visual Diagrams', icon: '📊', description: 'Charts and illustrations' },
          { value: 'stories', label: 'Stories & Examples', icon: '📖', description: 'Real-life scenarios' },
          { value: 'step_by_step', label: 'Step-by-Step', icon: '🪜', description: 'Logical progression' }
        ],
        allowCustom: false
      }
    ],
    active_recall: [
      {
        key: 'learningGoal',
        question: "What's your main goal?",
        options: [
          { value: 'exam_prep', label: 'Exam Preparation', icon: '📝', description: 'Ace an upcoming test' },
          { value: 'long_term_retention', label: 'Long-term Retention', icon: '🧠', description: 'Remember for years' },
          { value: 'quick_review', label: 'Quick Review', icon: '⚡', description: 'Refresh what I know' },
          { value: 'master_details', label: 'Master Details', icon: '🔍', description: 'Know every detail' }
        ],
        allowCustom: true
      },
      {
        key: 'preferredStyle',
        question: 'What type of practice do you prefer?',
        options: [
          { value: 'flashcards', label: 'Flashcards', icon: '🃏', description: 'Quick Q&A format' },
          { value: 'quizzes', label: 'Multiple Choice Quizzes', icon: '✅', description: 'Test with options' },
          { value: 'scenarios', label: 'Scenario-Based', icon: '🎬', description: 'Apply to situations' },
          { value: 'mixed', label: 'Mixed Practice', icon: '🔀', description: 'Variety of formats' }
        ],
        allowCustom: false
      }
    ],
    focus_breakdown: [
      {
        key: 'learningGoal',
        question: "What's overwhelming you?",
        options: [
          { value: 'too_much_content', label: 'Too Much Content', icon: '📚', description: 'Volume is intimidating' },
          { value: 'complex_topic', label: 'Topic is Complex', icon: '🧩', description: 'Hard to understand' },
          { value: 'no_structure', label: 'No Clear Structure', icon: '🗺️', description: "Don't know where to start" },
          { value: 'time_pressure', label: 'Time Pressure', icon: '⏰', description: 'Need to learn fast' }
        ],
        allowCustom: true
      },
      {
        key: 'preferredStyle',
        question: 'How should I break it down?',
        options: [
          { value: 'small_chunks', label: 'Very Small Chunks', icon: '🧱', description: 'Tiny, digestible pieces' },
          { value: 'logical_flow', label: 'Logical Flow', icon: '➡️', description: 'Step-by-step progression' },
          { value: 'key_concepts', label: 'Key Concepts First', icon: '🔑', description: 'Big ideas, then details' },
          { value: 'practice_focused', label: 'Practice-Focused', icon: '💪', description: 'Learn by doing' }
        ],
        allowCustom: false
      }
    ],
    collaborative_scholar: [
      {
        key: 'learningGoal',
        question: 'What do you need help with?',
        options: [
          { value: 'essay_writing', label: 'Essay Writing', icon: '✍️', description: 'Improve my writing' },
          { value: 'critical_thinking', label: 'Critical Thinking', icon: '🤔', description: 'Analyze deeply' },
          { value: 'research', label: 'Research Skills', icon: '🔬', description: 'Find and evaluate sources' },
          { value: 'argumentation', label: 'Build Arguments', icon: '⚖️', description: 'Strengthen reasoning' }
        ],
        allowCustom: true
      },
      {
        key: 'preferredStyle',
        question: 'What kind of feedback do you want?',
        options: [
          { value: 'constructive', label: 'Constructive Criticism', icon: '🎯', description: 'Point out weaknesses' },
          { value: 'socratic', label: 'Socratic Questions', icon: '❓', description: 'Challenge my thinking' },
          { value: 'expert_review', label: 'Expert Review', icon: '👨‍🏫', description: 'Professional perspective' },
          { value: 'peer_feedback', label: 'Peer-Level Feedback', icon: '👥', description: 'Friendly suggestions' }
        ],
        allowCustom: false
      }
    ],
    creative_synthesis: [
      {
        key: 'learningGoal',
        question: 'What do you want to create?',
        options: [
          { value: 'mind_maps', label: 'Mind Maps', icon: '🗺️', description: 'Visual connections' },
          { value: 'stories', label: 'Stories & Narratives', icon: '📖', description: 'Make it memorable' },
          { value: 'presentations', label: 'Presentations', icon: '📊', description: 'Teach or present' },
          { value: 'projects', label: 'Creative Projects', icon: '🎨', description: 'Hands-on learning' }
        ],
        allowCustom: true
      },
      {
        key: 'preferredStyle',
        question: "What's your creative style?",
        options: [
          { value: 'visual', label: 'Visual & Colorful', icon: '🎨', description: 'Diagrams and images' },
          { value: 'narrative', label: 'Story-Based', icon: '📚', description: 'Tell a story' },
          { value: 'interactive', label: 'Interactive', icon: '🎮', description: 'Engage actively' },
          { value: 'structured', label: 'Structured & Organized', icon: '📋', description: 'Clear framework' }
        ],
        allowCustom: false
      }
    ]
  };

  return [...commonQuestions, ...(modeSpecificQuestions[mode] || [])];
}

export default SessionAssessment;
