import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useScrollToTop from '../hooks/useScrollToTop';

const About = () => {
  useScrollToTop();
  const navigate = useNavigate();

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
            <Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </div>
      </nav>

      <div className="page-content">
        <div className="page-header">
          <h1>About LastWeek</h1>
          <p>Transforming Education Through Intelligent Learning</p>
        </div>

        <div className="page-section">
          <h2>Our Mission</h2>
          <p>
            At LastWeek, we believe that every student deserves access to personalized, effective learning tools. Our mission is to democratize education by providing an intelligent study platform that adapts to each learner's unique needs and learning style. We're committed to helping students achieve their academic goals through scientifically-proven learning methodologies combined with cutting-edge artificial intelligence.
          </p>
          <p>
            We understand that traditional one-size-fits-all study methods don't work for everyone. Some students thrive with visual learning, others with active recall, and many benefit from spaced repetition. LastWeek brings all these proven techniques together in one intelligent platform, allowing students to choose the learning method that works best for them.
          </p>
        </div>

        <div className="page-section">
          <h2>Our Story</h2>
          <p>
            LastWeek was founded by a team of educators, software engineers, and learning scientists who shared a common frustration: existing study tools were either too simplistic or too complicated. We spent months researching cognitive science, interviewing students, and testing different approaches to learning. The result is a platform that combines the best of educational psychology with modern technology.
          </p>
          <p>
            What started as a small project has grown into a comprehensive learning platform used by thousands of students worldwide. We've continuously refined our approach based on user feedback, research, and real-world results. Today, LastWeek stands as a testament to what's possible when education meets innovation.
          </p>
        </div>

        <div className="page-section">
          <h2>Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <h3>Accessibility</h3>
              <p>We believe quality education should be accessible to everyone, regardless of background or financial situation. That's why LastWeek is free and available to all students.</p>
            </div>
            <div className="value-card">
              <h3>Effectiveness</h3>
              <p>Every feature we build is grounded in educational research and cognitive science. We measure success by real learning outcomes, not just user engagement.</p>
            </div>
            <div className="value-card">
              <h3>Privacy</h3>
              <p>Your data is yours. We never sell personal information, and we're transparent about how we use data. Your privacy is a fundamental right we respect completely.</p>
            </div>
            <div className="value-card">
              <h3>Innovation</h3>
              <p>We're constantly exploring new ways to improve learning. From AI-powered note generation to adaptive study schedules, we push the boundaries of what's possible in education technology.</p>
            </div>
          </div>
        </div>

        <div className="page-section">
          <h2>How LastWeek Works</h2>
          <p>
            LastWeek combines five scientifically-proven study modes with AI-powered content processing. When you upload a resource—whether it's a PDF, audio lecture, or image—our system automatically processes it, extracting key information and generating study materials. You then choose the learning mode that best fits your goals: Mental Model for conceptual understanding, Active Recall for memorization, Spaced Repetition for long-term retention, Focus Breakdown for complex topics, or Exam Prep for test preparation.
          </p>
          <p>
            Our AI learns from your interactions, adapting the difficulty level and review schedule to match your learning pace. Over time, the system becomes increasingly personalized, providing recommendations tailored specifically to your strengths and weaknesses. This combination of proven learning science and intelligent technology creates a study experience that's both effective and engaging.
          </p>
        </div>

        <div className="page-section">
          <h2>Our Team</h2>
          <p>
            LastWeek is built by a diverse team of educators, engineers, and designers passionate about improving education. Our team includes former teachers, cognitive scientists, full-stack developers, and UX designers. We come from different backgrounds and bring different perspectives, but we're united by a common goal: making learning more effective and accessible for everyone.
          </p>
          <p>
            We're constantly growing and looking for talented individuals who share our vision. If you're interested in joining our mission to transform education, we'd love to hear from you.
          </p>
        </div>

        <div className="page-section">
          <h2>Our Impact</h2>
          <p>
            Since launching, LastWeek has helped thousands of students improve their academic performance. Our users report higher test scores, better retention, and increased confidence in their studies. We've received testimonials from medical students who aced their board exams, language learners who achieved fluency, and high school students who improved their GPA significantly.
          </p>
          <p>
            But our impact goes beyond individual success stories. We're contributing to a broader shift in education toward personalized, technology-enhanced learning. We're proving that AI and education technology can work together to create better outcomes for students everywhere.
          </p>
        </div>

        <div className="page-section">
          <h2>Looking Forward</h2>
          <p>
            We're just getting started. Our roadmap includes advanced features like collaborative study groups, AI-powered tutoring, integration with educational institutions, and support for more languages and subjects. We're also investing in research to continuously improve our learning algorithms and ensure we're always providing the most effective study experience possible.
          </p>
          <p>
            As we grow, we remain committed to our core values: accessibility, effectiveness, privacy, and innovation. We believe that the future of education is personalized, intelligent, and accessible to all. LastWeek is leading that future.
          </p>
        </div>

        <div className="page-section contact-cta">
          <h2>Get in Touch</h2>
          <p>Have questions about LastWeek? Want to learn more about our mission? We'd love to hear from you.</p>
          <Link to="/contact" className="btn-primary">Contact Us</Link>
        </div>
      </div>

      <footer className="page-footer">
        <p>&copy; 2026 LastWeek. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default About;
