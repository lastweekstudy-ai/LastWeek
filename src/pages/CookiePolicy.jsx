import React from 'react';
import { Link } from 'react-router-dom';
import useScrollToTop from '../hooks/useScrollToTop';
import '../styles/Pages.css';

const CookiePolicy = () => {
  useScrollToTop();

  return (
    <div className="page-container">
      <nav className="page-navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <img src="/logos/lastweek_main_logo.png" alt="LastWeek" style={{ height: "36px", objectFit: "contain" }} />
          </Link>
          <div className="navbar-links">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </nav>

      <div className="page-content">
        <div className="page-header">
          <h1>Cookie Policy</h1>
          <p>Last updated: May 22, 2026</p>
        </div>

        <div className="page-section">
          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device by your web browser when you visit a website. They help websites remember information about your visit, such as your login status and preferences. Similar technologies include localStorage, which stores data directly in your browser without expiration.
          </p>
        </div>

        <div className="page-section">
          <h2>2. How We Use Cookies and Local Storage</h2>
          <p>
            LastWeek uses only <strong>strictly necessary</strong> and <strong>functional</strong> cookies and local storage. We do not use any marketing, advertising, or third-party tracking cookies. We do not track you across other websites.
          </p>
        </div>

        <div className="page-section">
          <h2>3. Cookies We Use</h2>
          
          <h3>3.1 Authentication Cookie (Strictly Necessary)</h3>
          <table className="cookie-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Purpose</th>
                <th>Duration</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>a_session_*</code></td>
                <td>Keeps you logged in to your account. Set by our authentication provider (Appwrite).</td>
                <td>1 year (or until you log out)</td>
                <td>Strictly Necessary</td>
              </tr>
            </tbody>
          </table>
          <p>
            This cookie is essential for the website to function. Without it, you would need to log in on every page visit. It cannot be disabled while using the platform.
          </p>

          <h3>3.2 Payment Cookies (Strictly Necessary)</h3>
          <table className="cookie-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Purpose</th>
                <th>Duration</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>Paddle checkout cookies</code></td>
                <td>Set by Paddle (our payment processor) during checkout to process payments securely.</td>
                <td>Session / varies</td>
                <td>Strictly Necessary</td>
              </tr>
            </tbody>
          </table>
          <p>
            These cookies are only set when you interact with the payment/checkout flow. They are required for secure payment processing and fraud prevention.
          </p>
        </div>

        <div className="page-section">
          <h2>4. Local Storage We Use</h2>
          <p>
            In addition to cookies, we use your browser's localStorage to remember your preferences. This data never leaves your device and is not sent to our servers.
          </p>
          <table className="cookie-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Purpose</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>lastweek-theme</code></td>
                <td>Remembers your dark/light theme preference</td>
                <td>Until cleared</td>
              </tr>
              <tr>
                <td><code>study-split-ratio</code></td>
                <td>Remembers your preferred PDF viewer panel width</td>
                <td>Until cleared</td>
              </tr>
              <tr>
                <td><code>audio-split-ratio</code></td>
                <td>Remembers your preferred audio viewer panel width</td>
                <td>Until cleared</td>
              </tr>
              <tr>
                <td><code>mcq_answer_*</code></td>
                <td>Saves your quiz answers so they persist if you refresh the page</td>
                <td>Until cleared</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="page-section">
          <h2>5. What We Do NOT Use</h2>
          <ul>
            <li><strong>No analytics cookies</strong> — we do not use Google Analytics, Mixpanel, Hotjar, or any similar tracking tools</li>
            <li><strong>No advertising cookies</strong> — we do not serve ads or use ad tracking pixels</li>
            <li><strong>No social media cookies</strong> — we do not embed Facebook, Twitter, or other social media trackers</li>
            <li><strong>No cross-site tracking</strong> — we do not track your activity on other websites</li>
            <li><strong>No fingerprinting</strong> — we do not use browser fingerprinting techniques</li>
          </ul>
        </div>

        <div className="page-section">
          <h2>6. Managing Cookies</h2>
          <p>
            Since we only use strictly necessary cookies, disabling them would prevent the website from functioning properly (you would not be able to stay logged in). However, you can manage cookies through your browser settings:
          </p>
          <ul>
            <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
            <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
            <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
            <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
          </ul>
          <p>
            To clear localStorage data, you can use your browser's developer tools (F12 → Application → Local Storage) or clear all site data through your browser settings.
          </p>
        </div>

        <div className="page-section">
          <h2>7. Do We Need a Cookie Consent Banner?</h2>
          <p>
            Because LastWeek only uses strictly necessary cookies (authentication and payment processing), we are exempt from cookie consent requirements under most privacy regulations including the EU ePrivacy Directive (the "Cookie Law") and GDPR. Strictly necessary cookies do not require user consent.
          </p>
          <p>
            If we ever add analytics or marketing cookies in the future, we will update this policy and implement a cookie consent mechanism before doing so.
          </p>
        </div>

        <div className="page-section">
          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date. If we introduce new types of cookies (such as analytics), we will notify users and obtain consent where required by law.
          </p>
        </div>

        <div className="page-section">
          <h2>9. Contact Us</h2>
          <p>
            If you have questions about our use of cookies or local storage, please contact us:
          </p>
          <p>
            <strong>Email:</strong> <a href="mailto:contact@lastweekai.study">contact@lastweekai.study</a><br/>
            <strong>Twitter / X:</strong> <a href="https://x.com/LastWeek_AI" target="_blank" rel="noopener noreferrer">@LastWeek_AI</a>
          </p>
        </div>
      </div>

      <footer className="page-footer">
        <p>&copy; 2026 LastWeek. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default CookiePolicy;
