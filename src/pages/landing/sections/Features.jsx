import React from 'react';
import { PixelIcon } from '../../../components/shared/pixel-art/PixelIcons';
import '../landing.css';

const Features = () => {
  const features = [
    {
      icon: 'book',
      title: 'Multiple Resource Types',
      description: 'Upload PDFs, record audio, add images, and more. Support for 100MB files with advanced OCR.',
      docsLink: '/docs/resource-management',
    },
    {
      icon: 'brain',
      title: 'AI-Powered Processing',
      description: 'Automatic transcription, note generation, and intelligent analysis of your study materials.',
      docsLink: '/docs/study-tools',
    },
    {
      icon: 'flash',
      title: 'Smart Flashcards',
      description: 'Auto-generated flashcards with spaced repetition for optimal long-term retention.',
      docsLink: '/docs/study-tools',
    },
    {
      icon: 'chart',
      title: 'Progress Tracking',
      description: 'Detailed analytics showing your learning progress, study patterns, and improvement areas.',
      docsLink: '/docs/study-tools',
    },
    {
      icon: 'share',
      title: 'Resource Sharing',
      description: 'Share materials with other students in the community and learn collaboratively.',
      docsLink: '/docs/collaboration',
    },
    {
      icon: 'clock',
      title: 'Pomodoro Timer',
      description: 'Built-in timer to maintain focus, avoid burnout, and optimize study sessions.',
      docsLink: '/docs/study-tools',
    },
  ];

  return (
    <section id="features" className="features">
      <div className="container">
        <h2 className="section-title">Powerful Features</h2>
        <p className="section-subtitle">Everything you need to study effectively</p>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                <PixelIcon type={feature.icon} size={48} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
