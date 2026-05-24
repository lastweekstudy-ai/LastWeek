import React from 'react';
import { Link } from 'react-router-dom';
import useScrollToTop from '../hooks/useScrollToTop';
import '../styles/Pages.css';

const RefundPolicy = () => {
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
          <h1>Refund Policy</h1>
          <p>Last updated: May 22, 2026</p>
        </div>

        <div className="page-section">
          <h2>1. Overview</h2>
          <p>
            At LastWeek, we want you to be completely satisfied with your subscription. This Refund Policy outlines the circumstances under which you may receive a refund for payments made through our platform. All payments are processed by Paddle, our Merchant of Record, which handles billing, tax compliance, and refund processing on our behalf.
          </p>
        </div>

        <div className="page-section">
          <h2>2. Free Trial</h2>
          <p>
            All paid plans include a 14-day free trial period. During this trial, you have full access to all features of the plan without being charged. If you cancel before the trial ends, you will not be billed. We encourage you to fully explore the platform during your trial to ensure it meets your needs.
          </p>
        </div>

        <div className="page-section">
          <h2>3. Subscription Refunds</h2>
          <p>
            We offer refunds under the following conditions:
          </p>
          <h3>3.1 Within 14 Days of First Payment</h3>
          <p>
            If you are not satisfied with LastWeek after your first payment (i.e., after the free trial ends), you may request a full refund within 14 days of being charged. No questions asked.
          </p>
          <h3>3.2 Service Unavailability</h3>
          <p>
            If LastWeek experiences significant downtime or service disruption (more than 48 consecutive hours) during your billing period, you are entitled to a prorated refund for the affected period. Contact our support team with details of the disruption.
          </p>
          <h3>3.3 Billing Errors</h3>
          <p>
            If you were charged incorrectly (e.g., double-charged, charged after cancellation, or charged the wrong amount), we will issue a full refund for the erroneous charge immediately upon verification.
          </p>
          <h3>3.4 Unauthorized Charges</h3>
          <p>
            If you believe a charge was made without your authorization, please contact us immediately at contact@lastweekai.study. We will investigate and issue a refund if the charge is confirmed to be unauthorized.
          </p>
        </div>

        <div className="page-section">
          <h2>4. Non-Refundable Situations</h2>
          <p>
            Refunds are generally not provided in the following cases:
          </p>
          <ul>
            <li>Requests made more than 14 days after the initial payment (for first-time refund requests)</li>
            <li>Subsequent billing cycles after the first month (unless covered by Section 3.2 or 3.3)</li>
            <li>Failure to cancel before a renewal date (you can cancel anytime to prevent future charges)</li>
            <li>Dissatisfaction with AI-generated content quality (as AI outputs vary by nature)</li>
            <li>Account suspension or termination due to violation of our <Link to="/terms">Terms of Service</Link></li>
            <li>Partial month usage — we do not offer prorated refunds for partial months unless covered above</li>
          </ul>
        </div>

        <div className="page-section">
          <h2>5. How to Request a Refund</h2>
          <p>
            To request a refund, please follow these steps:
          </p>
          <ol>
            <li><strong>Email us</strong> at <a href="mailto:contact@lastweekai.study">contact@lastweekai.study</a> with the subject line "Refund Request"</li>
            <li><strong>Include</strong> your account email address and the reason for your refund request</li>
            <li><strong>Provide</strong> the transaction ID or receipt (if available) from your payment confirmation email</li>
          </ol>
          <p>
            We aim to respond to all refund requests within 3 business days. Once approved, refunds are processed by Paddle and typically appear on your statement within 5-10 business days, depending on your payment method and financial institution.
          </p>
        </div>

        <div className="page-section">
          <h2>6. Cancellation vs. Refund</h2>
          <p>
            <strong>Cancellation</strong> and <strong>refund</strong> are different actions:
          </p>
          <ul>
            <li><strong>Cancellation:</strong> Stops future billing. Your access continues until the end of your current billing period. You can cancel anytime from your account settings.</li>
            <li><strong>Refund:</strong> Returns money already charged. Must meet the conditions outlined in Section 3 above.</li>
          </ul>
          <p>
            If you simply want to stop being charged in the future, cancellation is the appropriate action. You do not need to request a refund to cancel.
          </p>
        </div>

        <div className="page-section">
          <h2>7. Team Plan Refunds</h2>
          <p>
            For Team plan subscriptions, refund requests must be made by the account owner or administrator. Refunds for Team plans follow the same 14-day policy as individual plans. If team members are removed mid-cycle, no prorated refund is issued for the remaining period.
          </p>
        </div>

        <div className="page-section">
          <h2>8. Payment Processor</h2>
          <p>
            All payments and refunds are processed by <strong>Paddle</strong> (Paddle.com Market Limited), which acts as our Merchant of Record. Paddle handles all billing, sales tax/VAT, and refund processing. When you see a charge on your statement, it will appear as "PADDLE.NET* LASTWEEK" or similar.
          </p>
          <p>
            For billing inquiries that cannot be resolved through our support team, you may also contact Paddle directly through their buyer support portal.
          </p>
        </div>

        <div className="page-section">
          <h2>9. Changes to This Policy</h2>
          <p>
            We reserve the right to modify this Refund Policy at any time. Changes will be posted on this page with an updated "Last updated" date. Material changes will be communicated via email to active subscribers. Your continued use of the service after changes are posted constitutes acceptance of the revised policy.
          </p>
        </div>

        <div className="page-section">
          <h2>10. Contact Us</h2>
          <p>
            If you have questions about this Refund Policy or need to request a refund, please contact us:
          </p>
          <p>
            <strong>Email:</strong> <a href="mailto:contact@lastweekai.study">contact@lastweekai.study</a><br/>
            <strong>Subject:</strong> Refund Request (for refund inquiries)<br/>
            <strong>Response Time:</strong> Within 3 business days
          </p>
        </div>
      </div>

      <footer className="page-footer">
        <p>&copy; 2026 LastWeek. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default RefundPolicy;
