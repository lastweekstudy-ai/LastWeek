import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  MentalModelIcon, 
  ActiveRecallIcon, 
  FocusBreakdownIcon, 
  CollaborativeScholarIcon, 
  CreativeSynthesisIcon,
  ArrowRightIcon,
  BookIcon,
  FileIcon,
  ChatIcon,
  StorageIcon,
  RefreshIcon,
  ListIcon,
  BulbIcon,
  FlashcardIcon,
  ClockIcon,
  ChartBarIcon,
  CheckIcon,
  SettingsIcon,
  WarningIcon
} from '../components/Icons';
import '../styles/LandingNew.css';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDocs, setShowDocs] = useState(false);
  const [expandedMode, setExpandedMode] = useState(null);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const modes = [
    {
      id: 'mental_model',
      name: 'Mental Model',
      icon: <MentalModelIcon size={48} />,
      shortDesc: 'Learn through real-world analogies and comparisons',
      bestFor: 'Abstract concepts, theoretical subjects, complex systems',
      whenToUse: 'When you need to understand "why" something works, not just "what" it is. Perfect for physics, philosophy, economics, and systems thinking.',
      howItWorks: 'The AI creates relatable analogies and mental frameworks that connect new concepts to things you already understand. It builds bridges between abstract ideas and concrete examples.',
      examples: [
        'Understanding quantum superposition through coin flips',
        'Learning blockchain via library book checkout systems',
        'Grasping neural networks through postal service analogies'
      ],
      tips: [
        'Start with the big picture before diving into details',
        'Ask for multiple analogies if the first one doesn\'t click',
        'Request comparisons to subjects you already know well'
      ]
    },
    {
      id: 'active_recall',
      name: 'Active Recall',
      icon: <ActiveRecallIcon size={48} />,
      shortDesc: 'Test yourself with quizzes, flashcards, and practice scenarios',
      bestFor: 'Memorization, exam preparation, vocabulary, formulas, facts',
      whenToUse: 'When you need to retain information long-term and perform well on tests. Scientifically proven to be the most effective study method for memory retention.',
      howItWorks: 'The AI generates personalized quizzes, flashcards, and practice questions based on your materials. It uses spaced repetition to show you content right before you\'re about to forget it.',
      examples: [
        'Medical terminology flashcards with spaced repetition',
        'Math formula practice with increasing difficulty',
        'Historical dates and events quiz generation',
        'Programming syntax and concept testing'
      ],
      tips: [
        'Review daily for 15-20 minutes rather than cramming',
        'Don\'t skip cards you get right - repetition builds retention',
        'Use this mode 2-3 days before exams for best results',
        'Combine with other modes for deeper understanding'
      ]
    },
    {
      id: 'focus_breakdown',
      name: 'Focus Breakdown',
      icon: <FocusBreakdownIcon size={48} />,
      shortDesc: 'Break overwhelming topics into small, manageable pieces',
      bestFor: 'Dense textbooks, complex subjects, overwhelming material, step-by-step learning',
      whenToUse: 'When you feel overwhelmed by the amount or complexity of material. Perfect for tackling 50-page chapters, dense research papers, or subjects that seem impossible to grasp.',
      howItWorks: 'The AI analyzes your material and breaks it into a logical learning sequence. Each piece is small enough to master in one session, with clear connections showing how pieces fit together.',
      examples: [
        'Breaking down a 60-page biology chapter into 8 digestible concepts',
        'Simplifying calculus theorems into step-by-step proofs',
        'Deconstructing legal cases into key arguments and precedents',
        'Parsing dense philosophy texts into core arguments'
      ],
      tips: [
        'Master one piece completely before moving to the next',
        'Use this mode first, then switch to Active Recall for retention',
        'Perfect for subjects that intimidate you',
        'Ask for visual diagrams to see how pieces connect'
      ]
    },
    {
      id: 'collaborative_scholar',
      name: 'Collaborative Scholar',
      icon: <CollaborativeScholarIcon size={48} />,
      shortDesc: 'Get feedback from AI personas and historical expert perspectives',
      bestFor: 'Essay writing, research projects, critical thinking, debate preparation',
      whenToUse: 'When you need feedback on your ideas, want to explore multiple perspectives, or need to strengthen arguments. Excellent for humanities, social sciences, and creative work.',
      howItWorks: 'The AI adopts different expert personas (historical figures, field experts, peer reviewers) to critique your work, challenge your assumptions, and offer alternative viewpoints.',
      examples: [
        'Getting Einstein\'s perspective on your physics paper',
        'Having Socrates question your philosophical arguments',
        'Peer review simulation for research proposals',
        'Debate practice with opposing viewpoints'
      ],
      tips: [
        'Use for essays and projects that require critical thinking',
        'Ask specific personas for feedback on specific sections',
        'Don\'t just accept feedback - engage in dialogue',
        'Great for identifying weak points in arguments before submission'
      ]
    },
    {
      id: 'creative_synthesis',
      name: 'Creative Synthesis',
      icon: <CreativeSynthesisIcon size={48} />,
      shortDesc: 'Transform learning into stories, mind maps, and creative projects',
      bestFor: 'Visual learners, creative projects, presentations, making learning fun',
      whenToUse: 'When traditional studying feels boring or when you need to create presentations, teach others, or make connections between disparate topics. Perfect for visual and creative learners.',
      howItWorks: 'The AI helps you create mind maps, visual diagrams, stories, analogies, and creative projects that make learning engaging and memorable. It connects ideas in unexpected ways.',
      examples: [
        'Creating a story where historical events are characters',
        'Building mind maps that connect biology to chemistry',
        'Designing infographics for complex data',
        'Turning math concepts into visual metaphors'
      ],
      tips: [
        'Use this mode when you need to present or teach material',
        'Great for making boring subjects interesting',
        'Combine with Mental Model for powerful understanding',
        'Perfect for creating study guides that actually work'
      ]
    }
  ];

  return (
    <div className="landing">
      <div className="container">
        {/* Hero Section */}
        <div className="landing-hero">
          <div className="landing-logo-container">
            <img 
              src="/logos/lastweek_main_logo.png" 
              alt="LastWeek Logo" 
              className="landing-logo"
            />
          </div>
          <h1 className="hero-title fade-in">
            One week. Every subject. <span className="text-accent">No panic.</span>
          </h1>
          <p className="hero-subtitle fade-in">
            AI-powered study platform with 5 specialized learning modes, intelligent PDF processing, 
            and spaced repetition algorithms. Master any subject faster with science-backed study methods.
          </p>
          
          <div className="hero-actions fade-in">
            <button 
              className="btn btn-primary btn-large"
              onClick={() => navigate('/auth')}
            >
              <ArrowRightIcon size={20} />
              Start Studying Now
            </button>
            <button 
              className="btn btn-secondary btn-large"
              onClick={() => setShowDocs(true)}
            >
              <BookIcon size={20} />
              Read Full Documentation
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="features-section">
          <h2 className="section-title">Powerful Features for Effective Learning</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <FileIcon size={40} />
              </div>
              <h3>Smart PDF Processing</h3>
              <p>Upload any PDF including scanned documents and images. Advanced OCR and Vision AI extract text, diagrams, equations, and tables automatically. Supports files up to 100MB.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <ChatIcon size={40} />
              </div>
              <h3>Real-time AI Streaming</h3>
              <p>Get instant responses with streaming AI technology. Ask questions in natural language and watch answers appear in real-time. Powered by advanced language models for accurate, contextual responses.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <StorageIcon size={40} />
              </div>
              <h3>Comprehensive Study Library</h3>
              <p>Organize unlimited PDFs with tags and folders. Add highlights, bookmarks, and annotations. Search across all your documents instantly. Everything synced and accessible anywhere.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <ClockIcon size={40} />
              </div>
              <h3>Spaced Repetition System</h3>
              <p>AI-powered scheduling shows you material right before you forget it. Based on cognitive science research, this method increases retention by up to 200%. Never cram again.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <ListIcon size={40} />
              </div>
              <h3>5 Specialized Learning Modes</h3>
              <p>Each mode uses different pedagogical approaches: analogies, active testing, chunking, peer review, and creative synthesis. Choose the method that matches your subject and learning style.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <RefreshIcon size={40} />
              </div>
              <h3>Persistent Session Memory</h3>
              <p>AI remembers your entire conversation history, uploaded documents, and learning progress. Pick up exactly where you left off, even days later. Context never gets lost.</p>
            </div>
          </div>
        </div>

        {/* Modes Section */}
        <div className="modes-section">
          <h2 className="section-title">5 AI Learning Modes</h2>
          <p className="section-subtitle">
            Each mode uses proven teaching strategies from cognitive science. Click any mode to learn more.
          </p>
          <div className="modes-grid">
            {modes.map((mode, index) => (
              <div 
                key={mode.id} 
                className={`mode-card-detailed fade-in ${expandedMode === mode.id ? 'expanded' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setExpandedMode(expandedMode === mode.id ? null : mode.id)}
              >
                <div className="mode-header">
                  <div className="mode-icon">{mode.icon}</div>
                  <h3 className="mode-name">{mode.name}</h3>
                  <p className="mode-short-desc">{mode.shortDesc}</p>
                </div>
                
                {expandedMode === mode.id && (
                  <div className="mode-expanded-content">
                    <div className="mode-detail-section">
                      <h4><BulbIcon size={20} /> Best For</h4>
                      <p>{mode.bestFor}</p>
                    </div>
                    
                    <div className="mode-detail-section">
                      <h4><ClockIcon size={20} /> When to Use</h4>
                      <p>{mode.whenToUse}</p>
                    </div>
                    
                    <div className="mode-detail-section">
                      <h4><ChartBarIcon size={20} /> How It Works</h4>
                      <p>{mode.howItWorks}</p>
                    </div>
                    
                    <div className="mode-detail-section">
                      <h4><FlashcardIcon size={20} /> Examples</h4>
                      <ul>
                        {mode.examples.map((example, i) => (
                          <li key={i}>{example}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mode-detail-section">
                      <h4><CheckIcon size={20} /> Pro Tips</h4>
                      <ul>
                        {mode.tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                <button className="mode-expand-btn">
                  {expandedMode === mode.id ? 'Show Less' : 'Learn More'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Study Tips Section */}
        <div className="tips-section">
          <h2 className="section-title">Study Tips & Best Practices</h2>
          <p className="section-subtitle">
            Maximize your learning efficiency with these evidence-based strategies
          </p>
          
          <div className="tips-grid">
            <div className="tip-card">
              <h3><BulbIcon size={24} /> Choosing the Right Mode</h3>
              <ul>
                <li><strong>Start with Focus Breakdown</strong> when material feels overwhelming</li>
                <li><strong>Use Mental Model</strong> for abstract or theoretical subjects</li>
                <li><strong>Switch to Active Recall</strong> 2-3 days before exams</li>
                <li><strong>Try Collaborative Scholar</strong> for essays and critical thinking</li>
                <li><strong>Use Creative Synthesis</strong> when you need to present or teach</li>
              </ul>
            </div>
            
            <div className="tip-card">
              <h3><ClockIcon size={24} /> Optimal Study Schedule</h3>
              <ul>
                <li><strong>Study in 25-50 minute blocks</strong> with 5-10 minute breaks</li>
                <li><strong>Review within 24 hours</strong> of first learning (retention boost: 80%)</li>
                <li><strong>Use spaced repetition:</strong> Day 1, Day 3, Day 7, Day 14, Day 30</li>
                <li><strong>Study hardest subjects</strong> when you're most alert</li>
                <li><strong>Mix subjects</strong> to prevent mental fatigue</li>
              </ul>
            </div>
            
            <div className="tip-card">
              <h3><FileIcon size={24} /> Working with PDFs</h3>
              <ul>
                <li><strong>Upload before asking questions</strong> for context-aware answers</li>
                <li><strong>Highlight key concepts</strong> as you read for quick review</li>
                <li><strong>Add bookmarks</strong> to important pages and formulas</li>
                <li><strong>Use notes</strong> to record your own insights and questions</li>
                <li><strong>Organize with tags</strong> for easy retrieval later</li>
              </ul>
            </div>
            
            <div className="tip-card">
              <h3><ChatIcon size={24} /> Getting Better AI Responses</h3>
              <ul>
                <li><strong>Be specific:</strong> "Explain photosynthesis step-by-step" not "biology help"</li>
                <li><strong>Ask follow-ups:</strong> "Can you give another example?" or "Why does that work?"</li>
                <li><strong>Request formats:</strong> "Make a table" or "Create a mind map"</li>
                <li><strong>Set difficulty:</strong> "Explain like I'm 10" or "Use technical terms"</li>
                <li><strong>Challenge yourself:</strong> "Quiz me on this" or "What did I miss?"</li>
              </ul>
            </div>
            
            <div className="tip-card">
              <h3><ChartBarIcon size={24} /> Tracking Progress</h3>
              <ul>
                <li><strong>Check Dashboard daily</strong> for due reviews and statistics</li>
                <li><strong>Aim for 80% accuracy</strong> on Active Recall quizzes</li>
                <li><strong>Review wrong answers</strong> immediately while fresh</li>
                <li><strong>Track study time</strong> to identify your peak hours</li>
                <li><strong>Celebrate milestones</strong> to maintain motivation</li>
              </ul>
            </div>
            
            <div className="tip-card">
              <h3><RefreshIcon size={24} /> Combining Modes</h3>
              <ul>
                <li><strong>Week 1:</strong> Focus Breakdown + Mental Model (understand)</li>
                <li><strong>Week 2:</strong> Active Recall (memorize and retain)</li>
                <li><strong>Before Exam:</strong> Active Recall + Collaborative Scholar (test & refine)</li>
                <li><strong>For Projects:</strong> Creative Synthesis + Collaborative Scholar</li>
                <li><strong>For Presentations:</strong> Mental Model + Creative Synthesis</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="cta-section">
          <h2>Ready to Transform Your Study Habits?</h2>
          <p>Join students who are mastering subjects faster with AI-powered learning</p>
          <button 
            className="btn btn-primary btn-large"
            onClick={() => navigate('/auth')}
          >
            <ArrowRightIcon size={20} />
            Get Started Now
          </button>
        </div>

        {/* Footer */}
        <div className="landing-footer">
          <p className="text-muted text-center">
            Built for students who refuse to let time constraints limit their potential.
          </p>
          <button 
            className="footer-link"
            onClick={() => setShowDocs(true)}
          >
            <BookIcon size={18} /> Read Complete Documentation
          </button>
        </div>
      </div>

      {/* Documentation Modal */}
      {showDocs && (
        <div className="docs-modal" onClick={() => setShowDocs(false)}>
          <div className="docs-content" onClick={(e) => e.stopPropagation()}>
            <button className="docs-close" onClick={() => setShowDocs(false)}>✕</button>
            <h2><BookIcon size={32} /> Complete User Guide</h2>
            
            <div className="docs-section">
              <h3><ArrowRightIcon size={24} /> Quick Start Guide</h3>
              <ol>
                <li><strong>Create Account:</strong> Click "Start Studying Now" and sign up with email</li>
                <li><strong>Choose Learning Mode:</strong> Select from 5 specialized modes based on your subject</li>
                <li><strong>Upload Materials:</strong> Add PDFs, images, or documents (up to 100MB each)</li>
                <li><strong>Start Learning:</strong> Ask questions, get quizzes, or request explanations</li>
                <li><strong>Review Regularly:</strong> Check Dashboard for spaced repetition reminders</li>
              </ol>
            </div>

            <div className="docs-section">
              <h3><FileIcon size={24} /> PDF Management</h3>
              <h4>Uploading Documents</h4>
              <ul>
                <li><strong>Click Attachment Button (📎):</strong> Located in chat input area</li>
                <li><strong>Select File:</strong> Choose PDF, image (JPG/PNG), or text document</li>
                <li><strong>Auto-Processing:</strong> AI extracts text, even from scanned pages</li>
                <li><strong>Library Opens:</strong> PDF library automatically opens after upload</li>
                <li><strong>Supported Formats:</strong> PDF, PNG, JPG, TXT, HTML (max 100MB)</li>
              </ul>
              
              <h4>Reading & Annotating</h4>
              <ul>
                <li><strong>Navigation:</strong> Use arrow buttons or page number input to jump pages</li>
                <li><strong>Zoom Controls:</strong> Click +/- buttons or use mouse wheel</li>
                <li><strong>Highlighting:</strong> Click highlight button (🖍️), select text, click save (💾)</li>
                <li><strong>Bookmarks:</strong> Click star (⭐) to bookmark current page for quick access</li>
                <li><strong>Notes:</strong> Click note button (📝) to add personal annotations</li>
                <li><strong>Search:</strong> Use search bar to find text across entire document</li>
              </ul>
              
              <h4>Organization</h4>
              <ul>
                <li><strong>Tags:</strong> Add custom tags to categorize documents by subject/topic</li>
                <li><strong>Folders:</strong> Create folders to organize related materials</li>
                <li><strong>Favorites:</strong> Star important documents for quick access</li>
                <li><strong>Recent:</strong> View recently accessed documents</li>
                <li><strong>Search:</strong> Full-text search across all your documents</li>
              </ul>
            </div>

            <div className="docs-section">
              <h3><ChatIcon size={24} /> Chat Interface Features</h3>
              <h4>Basic Chat</h4>
              <ul>
                <li><strong>Natural Language:</strong> Type questions as you would ask a tutor</li>
                <li><strong>Streaming Responses:</strong> Watch answers appear in real-time</li>
                <li><strong>Context Aware:</strong> AI remembers uploaded PDFs and conversation history</li>
                <li><strong>Follow-up Questions:</strong> Build on previous answers naturally</li>
              </ul>
              
              <h4>Advanced Features</h4>
              <ul>
                <li><strong>Math Keyboard (∑):</strong> Insert symbols, equations, Greek letters</li>
                <li><strong>Quick Actions:</strong> Pre-made prompts like "Summarize", "Quiz Me", "Explain"</li>
                <li><strong>File Attachments:</strong> Upload images, PDFs, or text mid-conversation</li>
                <li><strong>Code Blocks:</strong> AI formats code with syntax highlighting</li>
                <li><strong>Tables & Lists:</strong> Structured data displayed clearly</li>
                <li><strong>Diagrams:</strong> AI can generate Mermaid diagrams and flowcharts</li>
              </ul>
              
              <h4>Keyboard Shortcuts</h4>
              <ul>
                <li><strong>Ctrl/Cmd + Enter:</strong> Send message</li>
                <li><strong>Ctrl/Cmd + K:</strong> Open keyboard shortcuts modal</li>
                <li><strong>Esc:</strong> Close modals and panels</li>
                <li><strong>Ctrl/Cmd + L:</strong> Toggle PDF library</li>
                <li><strong>Ctrl/Cmd + /:</strong> Focus chat input</li>
              </ul>
            </div>

            <div className="docs-section">
              <h3><ListIcon size={24} /> Learning Modes Deep Dive</h3>
              
              <div className="mode-doc">
                <h4><MentalModelIcon size={20} /> Mental Model Mode</h4>
                <p><strong>Purpose:</strong> Build intuitive understanding through analogies and frameworks</p>
                <p><strong>Best For:</strong> Physics, philosophy, economics, systems thinking, abstract concepts</p>
                <p><strong>How to Use:</strong></p>
                <ul>
                  <li>Ask "Explain [concept] using an analogy"</li>
                  <li>Request "Compare [concept A] to [concept B]"</li>
                  <li>Say "Help me build a mental model for [topic]"</li>
                </ul>
                <p><strong>Example Prompts:</strong></p>
                <ul>
                  <li>"Explain quantum entanglement using everyday objects"</li>
                  <li>"Compare supply and demand to a seesaw"</li>
                  <li>"Build a mental model for how neural networks learn"</li>
                </ul>
              </div>

              <div className="mode-doc">
                <h4><ActiveRecallIcon size={20} /> Active Recall Mode</h4>
                <p><strong>Purpose:</strong> Maximize retention through testing and spaced repetition</p>
                <p><strong>Best For:</strong> Exam prep, memorization, vocabulary, formulas, medical terms</p>
                <p><strong>How to Use:</strong></p>
                <ul>
                  <li>Say "Quiz me on [topic]"</li>
                  <li>Request "Create flashcards from this PDF"</li>
                  <li>Ask "Test my understanding of [concept]"</li>
                </ul>
                <p><strong>Spaced Repetition Schedule:</strong></p>
                <ul>
                  <li>First review: 1 day after learning</li>
                  <li>Second review: 3 days after first review</li>
                  <li>Third review: 7 days after second review</li>
                  <li>Fourth review: 14 days after third review</li>
                  <li>Fifth review: 30 days after fourth review</li>
                </ul>
                <p><strong>Pro Tips:</strong></p>
                <ul>
                  <li>Don't skip reviews even if you feel confident</li>
                  <li>Review wrong answers immediately</li>
                  <li>Aim for 80-90% accuracy before moving on</li>
                </ul>
              </div>

              <div className="mode-doc">
                <h4><FocusBreakdownIcon size={20} /> Focus Breakdown Mode</h4>
                <p><strong>Purpose:</strong> Deconstruct overwhelming material into manageable pieces</p>
                <p><strong>Best For:</strong> Dense textbooks, complex subjects, research papers, overwhelming chapters</p>
                <p><strong>How to Use:</strong></p>
                <ul>
                  <li>Say "Break down this chapter into key concepts"</li>
                  <li>Request "Simplify this topic step-by-step"</li>
                  <li>Ask "What are the core ideas in this PDF?"</li>
                </ul>
                <p><strong>Learning Sequence:</strong></p>
                <ul>
                  <li>AI identifies main concepts and dependencies</li>
                  <li>Material broken into logical learning order</li>
                  <li>Each piece small enough to master in one session</li>
                  <li>Clear connections show how pieces fit together</li>
                </ul>
              </div>

              <div className="mode-doc">
                <h4><CollaborativeScholarIcon size={20} /> Collaborative Scholar Mode</h4>
                <p><strong>Purpose:</strong> Get expert feedback and multiple perspectives</p>
                <p><strong>Best For:</strong> Essay writing, research, critical thinking, debate prep, humanities</p>
                <p><strong>How to Use:</strong></p>
                <ul>
                  <li>Say "Review my essay as [expert name]"</li>
                  <li>Request "What would [historical figure] say about this?"</li>
                  <li>Ask "Critique my argument from opposing viewpoint"</li>
                </ul>
                <p><strong>Available Personas:</strong></p>
                <ul>
                  <li>Historical figures (Einstein, Socrates, Marie Curie, etc.)</li>
                  <li>Field experts (professors, researchers, practitioners)</li>
                  <li>Peer reviewers (constructive feedback on writing)</li>
                  <li>Devil's advocate (challenge your assumptions)</li>
                </ul>
              </div>

              <div className="mode-doc">
                <h4><CreativeSynthesisIcon size={20} /> Creative Synthesis Mode</h4>
                <p><strong>Purpose:</strong> Transform learning into creative, memorable formats</p>
                <p><strong>Best For:</strong> Visual learners, presentations, teaching others, creative projects</p>
                <p><strong>How to Use:</strong></p>
                <ul>
                  <li>Say "Create a mind map for [topic]"</li>
                  <li>Request "Turn this into a story"</li>
                  <li>Ask "Make an infographic about [concept]"</li>
                </ul>
                <p><strong>Creative Formats:</strong></p>
                <ul>
                  <li>Mind maps and concept maps</li>
                  <li>Stories and narratives</li>
                  <li>Visual metaphors and analogies</li>
                  <li>Infographics and diagrams</li>
                  <li>Mnemonic devices</li>
                </ul>
              </div>
            </div>

            <div className="docs-section">
              <h3><ChartBarIcon size={24} /> Dashboard & Progress Tracking</h3>
              <ul>
                <li><strong>Study Statistics:</strong> View total study time, sessions, and materials reviewed</li>
                <li><strong>Due Reviews:</strong> See which flashcards and concepts need review today</li>
                <li><strong>Progress Charts:</strong> Track learning progress over time</li>
                <li><strong>Session History:</strong> Access all previous study sessions</li>
                <li><strong>Performance Metrics:</strong> Monitor quiz accuracy and retention rates</li>
                <li><strong>Streak Tracking:</strong> Maintain daily study streaks for motivation</li>
              </ul>
            </div>

            <div className="docs-section">
              <h3><SettingsIcon size={24} /> Settings & Customization</h3>
              <ul>
                <li><strong>Theme:</strong> Toggle between light and dark mode</li>
                <li><strong>AI Model:</strong> Choose your preferred AI assistant style</li>
                <li><strong>Notifications:</strong> Set reminders for spaced repetition reviews</li>
                <li><strong>Storage:</strong> Monitor storage usage and manage files</li>
                <li><strong>Keyboard Shortcuts:</strong> Customize shortcuts for faster workflow</li>
                <li><strong>Export Data:</strong> Download your notes, highlights, and progress</li>
              </ul>
            </div>

            <div className="docs-section">
              <h3><BulbIcon size={24} /> Pro Tips for Maximum Efficiency</h3>
              <ul>
                <li><strong>Upload First:</strong> Always upload PDFs before asking questions for context</li>
                <li><strong>Be Specific:</strong> Detailed questions get better answers</li>
                <li><strong>Use Multiple Modes:</strong> Combine modes for comprehensive understanding</li>
                <li><strong>Review Daily:</strong> 15-20 minutes daily beats 3-hour cram sessions</li>
                <li><strong>Ask Follow-ups:</strong> Don't hesitate to ask "why" or "can you explain differently"</li>
                <li><strong>Organize Early:</strong> Tag and organize materials from day one</li>
                <li><strong>Track Progress:</strong> Check dashboard regularly to stay motivated</li>
                <li><strong>Experiment:</strong> Try different modes for the same subject to find what works</li>
              </ul>
            </div>

            <div className="docs-section">
              <h3><WarningIcon size={24} /> Troubleshooting</h3>
              <p><strong>PDF won't upload:</strong></p>
              <ul>
                <li>Check file size (max 100MB)</li>
                <li>Ensure file format is supported (PDF, PNG, JPG, TXT)</li>
                <li>Try refreshing the page</li>
              </ul>
              
              <p><strong>AI responses are slow:</strong></p>
              <ul>
                <li>Check internet connection</li>
                <li>Large PDFs take longer to process</li>
                <li>Try switching AI model in settings</li>
              </ul>
              
              <p><strong>Can't find uploaded PDF:</strong></p>
              <ul>
                <li>Check "Recent" tab in PDF library</li>
                <li>Use search function to find by name</li>
                <li>Verify upload completed successfully</li>
              </ul>
            </div>

            <div className="docs-section">
              <h3>❓ Frequently Asked Questions</h3>
              
              <p><strong>Q: How much does it cost?</strong></p>
              <p>A: LastWeek offers free and paid plans. See our pricing page for details.</p>
              
              <p><strong>Q: What file types are supported?</strong></p>
              <p>A: PDF, PNG, JPG, TXT, and HTML files up to 100MB each.</p>
              
              <p><strong>Q: Can I study multiple subjects?</strong></p>
              <p>A: Yes! Create separate sessions for each subject and switch between them anytime.</p>
              
              <p><strong>Q: Is my data private?</strong></p>
              <p>A: Yes. All data is stored securely in your Appwrite account. We don't access your study materials.</p>
              
              <p><strong>Q: Can I export my notes?</strong></p>
              <p>A: Yes. Go to Settings → Export Data to download all your notes, highlights, and progress.</p>
              
              <p><strong>Q: How does spaced repetition work?</strong></p>
              <p>A: The AI tracks when you learned each concept and schedules reviews at optimal intervals (1, 3, 7, 14, 30 days) to maximize retention.</p>
              
              <p><strong>Q: Can I use this offline?</strong></p>
              <p>A: No, an internet connection is required for AI responses. However, you can view uploaded PDFs offline.</p>
              
              <p><strong>Q: What's the best mode for exam prep?</strong></p>
              <p>A: Start with Focus Breakdown to understand material, then switch to Active Recall 2-3 days before the exam.</p>
            </div>

            <button 
              className="btn btn-primary btn-large"
              onClick={() => {
                setShowDocs(false);
                navigate('/auth');
              }}
            >
              <ArrowRightIcon size={20} />
              Start Studying Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
