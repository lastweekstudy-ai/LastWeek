import React, { useState } from 'react';
import { PixelIcon } from '../../../components/shared/pixel-art/PixelIcons';

const FAQ = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqs = [
    {
      question: 'What file formats does LastWeek support?',
      answer: 'LastWeek supports PDFs, images (JPG, PNG), text files (TXT), and HTML documents. We can process scanned PDFs with OCR, extract text from images, and handle files up to 100MB in size.',
    },
    {
      question: 'How does the spaced repetition system work?',
      answer: 'Our AI analyzes your learning patterns and schedules reviews at optimal intervals: 1 day, 3 days, 7 days, 14 days, and 30 days after initial learning. This scientifically-proven method increases retention by up to 200% compared to traditional cramming.',
    },
    {
      question: 'Can I share my study materials with others?',
      answer: 'Yes! You can share individual resources or entire study sessions with classmates. Shared resources appear in their library, and you can control whether they can edit or just view your materials.',
    },
    {
      question: 'Is my data private and secure?',
      answer: 'Absolutely. All your data is encrypted in transit and at rest. We use industry-standard security practices and never sell your data. You can delete your account and all associated data anytime.',
    },
    {
      question: 'Which study mode should I use?',
      answer: 'It depends on your subject and goals: Mental Model for abstract concepts, Active Recall for memorization, Focus Breakdown for overwhelming material, Collaborative Scholar for essays, and Creative Synthesis for presentations.',
    },
    {
      question: 'Can I use LastWeek offline?',
      answer: 'The Pro and Team plans include offline access. You can download your study materials and continue learning without internet. Changes sync automatically when you reconnect.',
    },
    {
      question: 'How much does it cost?',
      answer: 'LastWeek is free to start with up to 3 sessions. Pro plan is $9.99/month with unlimited sessions and advanced features. Team plan is $29.99/month for study groups. All plans include a 14-day free trial.',
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription anytime with no penalties. You\'ll retain access until the end of your billing period. If you cancel, you can always reactivate later.',
    },
  ];

  const toggleExpanded = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section id="faq" className="faq">
      <div className="container">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-subtitle">Find answers to common questions about LastWeek</p>

        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <button
                className={`faq-question ${expandedIndex === index ? 'expanded' : ''}`}
                onClick={() => toggleExpanded(index)}
              >
                <span>{faq.question}</span>
                <PixelIcon 
                  type="arrow" 
                  size={20} 
                  className={`faq-icon ${expandedIndex === index ? 'rotated' : ''}`}
                />
              </button>
              {expandedIndex === index && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
