import React from 'react';
import { Link } from 'react-router-dom';
import { PixelIcon } from '../../../components/shared/pixel-art/PixelIcons';
import '../landing.css';

const FinalCTA = () => {
  return (
    <section className="final-cta">
      <div className="container">
        <div className="cta-content">
          <h2>Ready to Transform Your Study Habits?</h2>
          <p>Join thousands of students who are mastering subjects faster with AI-powered learning</p>
          
          <div className="cta-buttons">
            <Link to="/auth" className="btn btn-primary btn-large">
              Start Learning Free
              <PixelIcon type="arrow" size={18} />
            </Link>
            <a href="#faq" className="btn btn-secondary btn-large">
              Learn More
              <PixelIcon type="arrow" size={18} />
            </a>
          </div>

          <div className="cta-features">
            <div className="cta-feature">
              <PixelIcon type="checkmark" size={20} />
              <span>14-day free trial</span>
            </div>
            <div className="cta-feature">
              <PixelIcon type="checkmark" size={20} />
              <span>No credit card required</span>
            </div>
            <div className="cta-feature">
              <PixelIcon type="checkmark" size={20} />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
