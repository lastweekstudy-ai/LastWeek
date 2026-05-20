import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../../../components/shared/BrandLogo';
import { PixelIcon } from '../../../components/shared/pixel-art/PixelIcons';
import '../landing.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      <div className="hero-content">
        <div className="hero-logo-container">
          <BrandLogo variant="text" width={200} height={60} priority={true} />
        </div>

        <h1 className="hero-title">
          Study Smarter,<br />
          <span className="text-gradient">Not Harder</span>
        </h1>

        <p className="hero-subtitle">
          AI-powered learning platform with 5 specialized study modes, intelligent PDF processing, 
          and spaced repetition algorithms. Master any subject faster with science-backed methods.
        </p>

        <div className="hero-buttons">
          <Link to="/auth" className="btn btn-primary">
            Start Learning Free
            <PixelIcon type="arrow" size={18} />
          </Link>
          <a href="#features" className="btn btn-secondary">
            Learn More
            <PixelIcon type="arrow" size={18} />
          </a>
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">5</div>
            <div className="stat-label">Modes</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">PDF/Audio</div>
            <div className="stat-label">Processed Notes</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">Ai Accuracy</div>
            <div className="stat-label">In every click</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">4.8/5</div>
            <div className="stat-label">User Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
