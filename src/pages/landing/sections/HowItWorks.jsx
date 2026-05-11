import React from 'react';
import { PixelIcon } from '../../../components/shared/pixel-art/PixelIcons';
import '../landing.css';

const HowItWorks = () => {
  const steps = [
    {
      number: '1',
      title: 'Create Session',
      description: 'Start a new study session for any subject or topic you want to master.',
      icon: 'flash',
      docsLink: '/docs/getting-started',
    },
    {
      number: '2',
      title: 'Upload Resources',
      description: 'Add PDFs, record audio lectures, upload images, or paste text content.',
      icon: 'book',
      docsLink: '/docs/resource-management',
    },
    {
      number: '3',
      title: 'Choose Study Mode',
      description: 'Select from 5 specialized learning modes based on your subject and goals.',
      icon: 'brain',
      docsLink: '/docs/study-modes',
    },
    {
      number: '4',
      title: 'Track Progress',
      description: 'Monitor your learning with detailed analytics and spaced repetition reminders.',
      icon: 'chart',
      docsLink: '/docs/study-tools',
    },
  ];

  return (
    <section id="how-it-works" className="how-it-works">
      <div className="container">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">Simple, effective learning in 4 steps</p>

        <div className="steps-grid">
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-number">{step.number}</div>
              <div className="step-icon">
                <PixelIcon type={step.icon} size={48} />
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
