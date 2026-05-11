import React from 'react';
import { PixelIcon } from '../../../components/shared/pixel-art/PixelIcons';
import '../landing.css';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Medical Student',
      text: 'LastWeek helped me study for my board exams. The spaced repetition system is incredible - I went from 65% to 92% in just 3 weeks.',
      rating: 5,
    },
    {
      name: 'Marcus Johnson',
      role: 'Computer Science Major',
      text: 'The Mental Model mode finally made algorithms click for me. I can now explain concepts I struggled with for months.',
      rating: 5,
    },
    {
      name: 'Emma Rodriguez',
      role: 'Law Student',
      text: 'Collaborative Scholar mode is like having a study group available 24/7. The different perspectives really strengthen my arguments.',
      rating: 5,
    },
    {
      name: 'James Park',
      role: 'High School Student',
      text: 'I was drowning in my AP classes. Focus Breakdown mode broke everything into manageable pieces. Now I actually enjoy studying.',
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="testimonials">
      <div className="container">
        <h2 className="section-title">What Students Say</h2>
        <p className="section-subtitle">Join thousands of learners transforming their study habits</p>

        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="testimonial-rating">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <PixelIcon key={i} type="star" size={16} />
                ))}
              </div>
              <p className="testimonial-text">"{testimonial.text}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="author-info">
                  <p className="author-name">{testimonial.name}</p>
                  <p className="author-role">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
