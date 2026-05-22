import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useScrollToTop from '../hooks/useScrollToTop';
import '../styles/Pages.css';

const Terms = () => {
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
          <h1>Terms of Service</h1>
          <p>Last updated: May 11, 2026</p>
        </div>

        <div className="page-section">
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing and using LastWeek ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service. LastWeek reserves the right to make changes to these Terms of Service at any time and without notice. Your continued use of the Service following the posting of revised Terms of Service means that you accept and agree to the changes.
          </p>
        </div>

        <div className="page-section">
          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on LastWeek for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul>
            <li>Modifying or copying the materials</li>
            <li>Using the materials for any commercial purpose or for any public display</li>
            <li>Attempting to decompile or reverse engineer any software contained on the Service</li>
            <li>Removing any copyright or other proprietary notations from the materials</li>
            <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            <li>Violating any applicable laws or regulations</li>
            <li>Harassing or causing distress or inconvenience to any person</li>
            <li>Obscene or offensive content or disrupting the normal flow of dialogue within our website</li>
          </ul>
        </div>

        <div className="page-section">
          <h2>3. Disclaimer</h2>
          <p>
            The materials on LastWeek are provided on an 'as is' basis. LastWeek makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
          <p>
            Further, LastWeek does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.
          </p>
        </div>

        <div className="page-section">
          <h2>4. Limitations</h2>
          <p>
            In no event shall LastWeek or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on LastWeek, even if LastWeek or an authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>
        </div>

        <div className="page-section">
          <h2>5. Accuracy of Materials</h2>
          <p>
            The materials appearing on LastWeek could include technical, typographical, or photographic errors. LastWeek does not warrant that any of the materials on its website are accurate, complete, or current. LastWeek may make changes to the materials contained on its website at any time without notice.
          </p>
        </div>

        <div className="page-section">
          <h2>6. Links</h2>
          <p>
            LastWeek has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by LastWeek of the site. Use of any such linked website is at the user's own risk.
          </p>
        </div>

        <div className="page-section">
          <h2>7. Modifications</h2>
          <p>
            LastWeek may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </div>

        <div className="page-section">
          <h2>8. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which LastWeek operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>
        </div>

        <div className="page-section">
          <h2>9. User Accounts</h2>
          <p>
            When you create an account with LastWeek, you must provide accurate, complete, and current information. You are responsible for maintaining the confidentiality of your account information and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account or password. You must notify us immediately of any unauthorized use of your account.
          </p>
        </div>

        <div className="page-section">
          <h2>10. User Content</h2>
          <p>
            You retain all rights to any content you submit, post, or display on or through the Service. By submitting content to LastWeek, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute such content in any media or medium and for any purpose.
          </p>
          <p>
            You represent and warrant that you own or have the necessary rights to the content you submit and that such content does not violate any third-party rights or applicable laws. You agree not to submit content that is illegal, offensive, defamatory, or violates any intellectual property rights.
          </p>
        </div>

        <div className="page-section">
          <h2>11. Prohibited Activities</h2>
          <p>
            You agree not to engage in any of the following prohibited activities:
          </p>
          <ul>
            <li>Harassing or causing distress or inconvenience to any person</li>
            <li>Impersonating or attempting to impersonate any person or entity</li>
            <li>Uploading viruses or malicious code</li>
            <li>Collecting or tracking personal information of others</li>
            <li>Spamming or sending unsolicited messages</li>
            <li>Interfering with the proper functioning of the Service</li>
            <li>Accessing the Service through unauthorized means</li>
            <li>Violating any applicable laws or regulations</li>
          </ul>
        </div>

        <div className="page-section">
          <h2>12. Termination</h2>
          <p>
            LastWeek may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including if you breach the Terms of Service. Upon termination, your right to use the Service will immediately cease.
          </p>
        </div>

        <div className="page-section">
          <h2>13. Limitation of Liability</h2>
          <p>
            In no event shall LastWeek, its directors, employees, or agents be liable to you for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service or materials, even if LastWeek has been advised of the possibility of such damages.
          </p>
        </div>

        <div className="page-section">
          <h2>14. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless LastWeek and its officers, directors, employees, and agents from any and all claims, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or related to your use of the Service or violation of these Terms of Service.
          </p>
        </div>

        <div className="page-section">
          <h2>15. Subscription and Payments</h2>
          <p>
            LastWeek offers subscription-based plans processed through Paddle (Paddle.com Market Limited), our Merchant of Record. By subscribing to a paid plan, you agree to the following:
          </p>
          <ul>
            <li><strong>Billing:</strong> Subscriptions are billed on a recurring monthly basis. Your payment method will be charged automatically at the start of each billing cycle.</li>
            <li><strong>Free Trial:</strong> Paid plans include a 14-day free trial. You will not be charged until the trial period ends. You may cancel at any time during the trial without being charged.</li>
            <li><strong>Price Changes:</strong> We reserve the right to change subscription prices. Existing subscribers will be notified at least 30 days before any price increase takes effect.</li>
            <li><strong>Cancellation:</strong> You may cancel your subscription at any time from your account settings. Access continues until the end of your current billing period.</li>
            <li><strong>Refunds:</strong> Refunds are handled according to our <Link to="/refund-policy">Refund Policy</Link>.</li>
            <li><strong>Taxes:</strong> Paddle handles all applicable sales tax, VAT, and other transaction taxes on our behalf.</li>
          </ul>
        </div>

        <div className="page-section">
          <h2>16. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> contact@lastweekai.study<br/>
            <strong>Twitter / X:</strong> <a href="https://x.com/LastWeek_AI">@LastWeek_AI</a><br/>
            <strong>LinkedIn:</strong> <a href="https://www.linkedin.com/company/lastweekstudy-ai/">LastWeek Study AI</a><br/>
            <strong>Response Time:</strong> We will respond to legal inquiries within 30 days.
          </p>
        </div>
      </div>

      <footer className="page-footer">
        <p>&copy; 2026 LastWeek. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Terms;
