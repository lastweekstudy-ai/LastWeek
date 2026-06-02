import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingNew.css';

const LandingNew = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: '📚',
      title: 'Multiple Study Modes',
      description: 'Mental Model, Active Recall, Spaced Repetition, Exam Prep, and Focus Breakdown modes tailored to your learning style.',
      color: '#6366f1'
    },
    {
      icon: '📄',
      title: 'Smart Resource Management',
      description: 'Upload PDFs, record audio lectures, and organize everything by session. Automatic transcription and note generation.',
      color: '#ec4899'
    },
    {
      icon: '🎙️',
      title: 'Audio Processing',
      description: 'Record lectures, get automatic transcriptions, and AI-generated structured notes with visual diagrams.',
      color: '#f59e0b'
    },
    {
      icon: '🧠',
      title: 'AI-Powered Learning',
      description: 'Contextual chat, auto-generated quizzes, flashcards, and intelligent content analysis.',
      color: '#10b981'
    },
    {
      icon: '📊',
      title: 'Study Tools',
      description: 'Pomodoro timer, flashcards, quizzes, highlighting, notes, and comprehensive progress tracking.',
      color: '#3b82f6'
    },
    {
      icon: '🤝',
      title: 'Community Learning',
      description: 'Share resources with other students, import shared materials, and build together while keeping your notes private.',
      color: 'var(--color-accent)'
    }
  ];

  const modes = [
    {
      name: 'Mental Model',
      emoji: '🧠',
      description: 'Build deep conceptual understanding through structured breakdowns and visual diagrams.',
      benefits: ['Concept mapping', 'Visual learning', 'Relationship building', 'Foundation building']
    },
    {
      name: 'Active Recall',
      emoji: '🎯',
      description: 'Test your memory and strengthen retrieval pathways with auto-generated quizzes.',
      benefits: ['Memory testing', 'Gap identification', 'Retention practice', 'Performance tracking']
    },
    {
      name: 'Spaced Repetition',
      emoji: '📅',
      description: 'Optimize long-term retention through intelligent scheduling of reviews.',
      benefits: ['Optimal intervals', 'Difficulty-based scheduling', 'Long-term retention', 'Mastery tracking']
    },
    {
      name: 'Exam Prep',
      emoji: '🎓',
      description: 'Focused preparation with AI-generated schedules and mock exams.',
      benefits: ['Study scheduling', 'Topic prioritization', 'Mock exams', 'Performance analytics']
    }
  ];

  return (
    <div className="landing-new">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-emoji">📚</span>
            <span className="logo-text">LastWeek</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#modes" className="nav-link">Study Modes</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <button className="nav-cta" onClick={() => navigate('/auth')}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text" style={{ transform: `translateY(${scrollY * 0.5}px)` }}>
            <h1 className="hero-title">
              <span className="title-word">Transform</span>
              <span className="title-word">the way</span>
              <span className="title-word">you study</span>
            </h1>
            <p className="hero-subtitle">
              Master any subject with intelligent, adaptive learning modes. From concept building to exam preparation, we've got you covered.
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={() => navigate('/auth')}>
                Start Learning Free
              </button>
              <button className="btn btn-secondary">
                Watch Demo
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card card-1">
              <div className="card-icon">📚</div>
              <div className="card-text">Upload Resources</div>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">🎙️</div>
              <div className="card-text">Record Lectures</div>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">🧠</div>
              <div className="card-text">Smart Learning</div>
            </div>
            <div className="floating-card card-4">
              <div className="card-icon">📊</div>
              <div className="card-text">Track Progress</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="section-header">
          <h2>Powerful Features</h2>
          <p>Everything you need to study smarter, not harder</p>
        </div>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="feature-card"
              style={{
                '--feature-color': feature.color,
                animationDelay: `${idx * 0.1}s`
              }}
              onMouseEnter={() => setActiveFeature(idx)}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-accent"></div>
            </div>
          ))}
        </div>
      </section>

      {/* Study Modes Section */}
      <section id="modes" className="study-modes">
        <div className="section-header">
          <h2>5 Intelligent Study Modes</h2>
          <p>Choose the learning approach that works best for you</p>
        </div>
        <div className="modes-container">
          {modes.map((mode, idx) => (
            <div key={idx} className="mode-card">
              <div className="mode-emoji">{mode.emoji}</div>
              <h3>{mode.name}</h3>
              <p className="mode-description">{mode.description}</p>
              <ul className="mode-benefits">
                {mode.benefits.map((benefit, bidx) => (
                  <li key={bidx}>
                    <span className="benefit-check">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Get started in 4 simple steps</p>
        </div>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-icon">📝</div>
            <h3>Create a Session</h3>
            <p>Start a new study session for any subject or topic</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-icon">📚</div>
            <h3>Upload Resources</h3>
            <p>Add PDFs, record audio, or import from shared library</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-icon">🧠</div>
            <h3>Choose Study Mode</h3>
            <p>Select the learning approach that fits your needs</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-icon">📊</div>
            <h3>Track Progress</h3>
            <p>Monitor your improvement and adjust your strategy</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stat">
          <div className="stat-number">5</div>
          <div className="stat-label">Study Modes</div>
        </div>
        <div className="stat">
          <div className="stat-number">∞</div>
          <div className="stat-label">Resources</div>
        </div>
        <div className="stat">
          <div className="stat-number">24/7</div>
          <div className="stat-label">Available</div>
        </div>
        <div className="stat">
          <div className="stat-number">100%</div>
          <div className="stat-label">Private</div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="section-header">
          <h2>What Students Say</h2>
          <p>Join thousands of students transforming their learning</p>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial">
            <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p>"LastWeek completely changed how I study. I went from struggling to acing my exams!"</p>
            <div className="testimonial-author">
              <div className="author-avatar">👩‍🎓</div>
              <div>
                <div className="author-name">Sarah Chen</div>
                <div className="author-role">Pre-Med Student</div>
              </div>
            </div>
          </div>
          <div className="testimonial">
            <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p>"The spaced repetition feature is a game-changer. I actually remember what I study now!"</p>
            <div className="testimonial-author">
              <div className="author-avatar">👨‍💼</div>
              <div>
                <div className="author-name">Marcus Johnson</div>
                <div className="author-role">Law Student</div>
              </div>
            </div>
          </div>
          <div className="testimonial">
            <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p>"Recording lectures and getting instant notes saved me so much time. Highly recommend!"</p>
            <div className="testimonial-author">
              <div className="author-avatar">👩‍🔬</div>
              <div>
                <div className="author-name">Emma Rodriguez</div>
                <div className="author-role">Engineering Student</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your Learning?</h2>
          <p>Join thousands of students who are already studying smarter</p>
          <button className="btn btn-large" onClick={() => navigate('/auth')}>
            Get Started Free Today
          </button>
          <p className="cta-subtext">No credit card required • Free forever plan available</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>LastWeek</h4>
            <p>Transform the way you study</p>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#modes">Study Modes</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Resources</h4>
            <ul>
              <li><a href="/docs/TUTORIAL.md">Tutorial</a></li>
              <li><a href="/docs/FEATURES.md">Documentation</a></li>
              <li><a href="/docs/TROUBLESHOOTING.md">Support</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 LastWeek. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingNew;
