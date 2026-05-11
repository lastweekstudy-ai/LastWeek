import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useScrollToTop from '../hooks/useScrollToTop';
import '../styles/Pages.css';

const Contact = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would send to a backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="page-container">
      <nav className="page-navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <span>LastWeek</span>
          </Link>
          <div className="navbar-links">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </div>
      </nav>

      <div className="page-content">
        <div className="page-header">
          <h1>Contact Us</h1>
          <p>We'd love to hear from you. Get in touch with our team.</p>
        </div>

        <div className="contact-container">
          <div className="contact-info">
            <div className="info-section">
              <h3>Email</h3>
              <p><a href="mailto:support@lastweek.com">support@lastweek.com</a></p>
              <p>For general inquiries and support requests</p>
            </div>

            <div className="info-section">
              <h3>Business Inquiries</h3>
              <p><a href="mailto:business@lastweek.com">business@lastweek.com</a></p>
              <p>For partnerships, integrations, and enterprise solutions</p>
            </div>

            <div className="info-section">
              <h3>Feedback</h3>
              <p><a href="mailto:feedback@lastweek.com">feedback@lastweek.com</a></p>
              <p>Share your ideas and suggestions for improvement</p>
            </div>

            <div className="info-section">
              <h3>Response Time</h3>
              <p>We typically respond to inquiries within 24-48 hours during business days.</p>
            </div>
          </div>

          <div className="contact-form-container">
            {submitted ? (
              <div className="success-message">
                <h3>Thank you for reaching out!</h3>
                <p>We've received your message and will get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="What is this about?"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Tell us more..."
                    rows="6"
                  ></textarea>
                </div>

                <button type="submit" className="btn-primary">Send Message</button>
              </form>
            )}
          </div>
        </div>

        <div className="page-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3>How can I report a bug?</h3>
              <p>Please email us at support@lastweek.com with details about the bug, including screenshots if possible. We take all bug reports seriously and will investigate promptly.</p>
            </div>
            <div className="faq-item">
              <h3>Can I request a new feature?</h3>
              <p>Absolutely! We love hearing feature requests from our users. Send your ideas to feedback@lastweek.com. We review all suggestions and prioritize based on user demand and impact.</p>
            </div>
            <div className="faq-item">
              <h3>How do I delete my account?</h3>
              <p>You can delete your account from your account settings. If you need assistance, contact support@lastweek.com and we'll help you through the process.</p>
            </div>
            <div className="faq-item">
              <h3>Is there a phone number I can call?</h3>
              <p>Currently, we support contact through email. We're working on adding phone support in the future. For urgent matters, please email support@lastweek.com and mark it as urgent.</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="page-footer">
        <p>&copy; 2026 LastWeek. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Contact;
