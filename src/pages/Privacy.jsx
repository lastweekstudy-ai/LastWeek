import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useScrollToTop from '../hooks/useScrollToTop';
import '../styles/Pages.css';

const Privacy = () => {
  useScrollToTop();
  const navigate = useNavigate();

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
          <h1>Privacy Policy</h1>
          <p>Last updated: May 11, 2026</p>
        </div>

        <div className="page-section">
          <h2>1. Introduction</h2>
          <p>
            LastWeek ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this privacy policy carefully. If you do not agree with our policies and practices, please do not use our services.
          </p>
        </div>

        <div className="page-section">
          <h2>2. Information We Collect</h2>
          <p>
            We collect information in various ways, including information you provide directly, information collected automatically, and information from third parties.
          </p>
          <h3>2.1 Information You Provide</h3>
          <p>
            When you create an account, we collect your name, email address, and password. When you use our services, we collect information about your study sessions, resources you upload, notes you create, and your learning progress. This information is essential for providing personalized learning experiences.
          </p>
          <h3>2.2 Automatically Collected Information</h3>
          <p>
            When you access our platform, we automatically collect certain information about your device and usage patterns. This includes your IP address, browser type, operating system, pages visited, time spent on pages, and referring URLs. We use this information to improve our services and understand how users interact with our platform.
          </p>
          <h3>2.3 Cookies and Local Storage</h3>
          <p>
            We use only strictly necessary cookies for authentication (keeping you logged in) and payment processing (via Paddle). We do not use any analytics, advertising, or third-party tracking cookies. We also use your browser's localStorage to remember preferences like your theme choice and panel layout — this data never leaves your device. For full details, see our <Link to="/cookies">Cookie Policy</Link>.
          </p>
        </div>

        <div className="page-section">
          <h2>3. How We Use Your Information</h2>
          <p>
            We use the information we collect for various purposes, including:
          </p>
          <ul>
            <li>Providing and improving our services</li>
            <li>Personalizing your learning experience</li>
            <li>Processing transactions and sending related information</li>
            <li>Sending promotional communications (with your consent)</li>
            <li>Responding to your inquiries and providing customer support</li>
            <li>Analyzing usage patterns to improve our platform</li>
            <li>Detecting and preventing fraud and security issues</li>
            <li>Complying with legal obligations</li>
          </ul>
        </div>

        <div className="page-section">
          <h2>4. Data Security</h2>
          <p>
            We implement comprehensive security measures to protect your personal information. Your data is encrypted in transit using SSL/TLS protocols and stored securely on our servers. We use industry-standard security practices, including firewalls, intrusion detection systems, and regular security audits. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
          <p>
            We limit access to your personal information to employees and contractors who need to know that information to provide services to you. All personnel are bound by confidentiality agreements and are subject to disciplinary action if they violate these agreements.
          </p>
        </div>

        <div className="page-section">
          <h2>5. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. You can request deletion of your account and associated data at any time by contacting us at contact@lastweekai.study. Upon deletion, we will remove your personal information from our active databases, though we may retain certain information for legal compliance and fraud prevention purposes.
          </p>
        </div>

        <div className="page-section">
          <h2>6. Sharing Your Information</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
          </p>
          <ul>
            <li><strong>Service Providers:</strong> We share information with third-party service providers who assist us in operating our website and conducting our business, subject to confidentiality agreements.</li>
            <li><strong>Legal Requirements:</strong> We may disclose information when required by law or when we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others.</li>
            <li><strong>Business Transfers:</strong> If LastWeek is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
            <li><strong>With Your Consent:</strong> We may share your information with third parties when you explicitly consent to such sharing.</li>
          </ul>
        </div>

        <div className="page-section">
          <h2>7. Your Privacy Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal information:
          </p>
          <ul>
            <li><strong>Right to Access:</strong> You have the right to request access to the personal information we hold about you.</li>
            <li><strong>Right to Correction:</strong> You can request that we correct inaccurate or incomplete information.</li>
            <li><strong>Right to Deletion:</strong> You can request deletion of your personal information, subject to certain legal exceptions.</li>
            <li><strong>Right to Opt-Out:</strong> You can opt out of receiving promotional communications from us at any time.</li>
            <li><strong>Right to Data Portability:</strong> You can request a copy of your data in a portable format.</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at contact@lastweekai.study with your request and proof of identity.
          </p>
        </div>

        <div className="page-section">
          <h2>8. Children's Privacy</h2>
          <p>
            LastWeek is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will take steps to delete such information and terminate the child's account. If you believe we have collected information from a child under 13, please contact us immediately at contact@lastweekai.study.
          </p>
        </div>

        <div className="page-section">
          <h2>9. Third-Party Links</h2>
          <p>
            Our platform may contain links to third-party websites and services that are not operated by LastWeek. This Privacy Policy does not apply to third-party websites, and we are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party services before providing your information.
          </p>
        </div>

        <div className="page-section">
          <h2>10. International Data Transfers</h2>
          <p>
            Your information may be transferred to, stored in, and processed in countries other than your country of residence. These countries may have data protection laws that differ from your home country. By using LastWeek, you consent to the transfer of your information to countries outside your country of residence, which may have different data protection rules.
          </p>
        </div>

        <div className="page-section">
          <h2>11. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by posting the updated policy on our website and updating the "Last updated" date. Your continued use of our services after such modifications constitutes your acceptance of the updated Privacy Policy.
          </p>
        </div>

        <div className="page-section">
          <h2>12. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our privacy practices, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> contact@lastweekai.study<br/>
            <strong>Twitter / X:</strong> <a href="https://x.com/LastWeek_AI">@LastWeek_AI</a><br/>
            <strong>LinkedIn:</strong> <a href="https://www.linkedin.com/company/lastweekstudy-ai/">LastWeek Study AI</a><br/>
            <strong>Response Time:</strong> We will respond to privacy inquiries within 30 days.
          </p>
        </div>
      </div>

      <footer className="page-footer">
        <p>&copy; 2026 LastWeek. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Privacy;
