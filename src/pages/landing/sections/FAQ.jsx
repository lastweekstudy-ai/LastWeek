import { useEffect, useState } from 'react';
import { PixelIcon } from '../../../components/shared/pixel-art/PixelIcons';
import { getAdminSettings } from '../../../appwrite/admin';
import { getPreRegPricing } from '../../../utils/preRegPricing';

const FAQ = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [adminSettings, setAdminSettings] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getAdminSettings()
      .then((settings) => {
        if (!cancelled) setAdminSettings(settings);
      })
      .catch(() => {
        if (!cancelled) setAdminSettings(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const preRegPricing = getPreRegPricing(adminSettings);

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
      answer: 'LastWeek is built as an online AI tutor, so AI chat, processing, and sync need an internet connection. You can still review downloaded files from your device outside the app.',
    },
    {
      question: 'How much does it cost?',
      answer: `LastWeek is free to start. Plus is $9/month for serious multi-subject study, and Pro+ is $19.99/month for heavy exam-season use with unlimited positioning. During pre-registration, a ${preRegPricing.priceLabel} one-time payment grants Plus for 1 year.`,
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
