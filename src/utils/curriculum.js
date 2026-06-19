import seed from '../data/curriculum/global_curriculum_seed_top_30_updated.json';

const STORAGE_KEY = 'lastweek.academicProfile.v1';

const safeParse = (value, fallback = null) => {
  if (!value || typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const curriculumSeed = seed;

export const UNIVERSAL_UNIVERSITY_CURRICULUM = {
  name: 'University / Open Study',
  version: 'Universal higher-education pathway',
  isUniversal: true,
  tracks: [
    'Undergraduate',
    'Postgraduate',
    'Professional Certification',
    'Entrance Exam',
    'Research / Thesis',
    'Self Study',
  ],
  classes: [
    'Foundation / Bridge',
    'Year 1',
    'Year 2',
    'Year 3',
    'Year 4',
    'Masters',
    'PhD / Research',
    'Professional',
  ],
  languagesOfInstruction: ['English'],
  examBoards: ['University / Institution', 'Professional Body', 'Self-directed'],
  coreSubjects: [
    'Mathematics',
    'Computer Science',
    'Engineering',
    'Business',
    'Economics',
    'Medicine',
    'Law',
    'Psychology',
    'Statistics',
    'Research Methods',
    'Academic Writing',
  ],
  progression: {
    Mathematics: ['Calculus', 'Linear Algebra', 'Discrete Mathematics', 'Probability', 'Statistics'],
    'Computer Science': ['Programming', 'Data Structures', 'Algorithms', 'Databases', 'Operating Systems'],
    Engineering: ['Mechanics', 'Circuits', 'Thermodynamics', 'Materials', 'Control systems'],
    Business: ['Accounting', 'Marketing', 'Finance', 'Operations', 'Strategy'],
    Economics: ['Microeconomics', 'Macroeconomics', 'Econometrics', 'Development economics', 'Game theory'],
    Medicine: ['Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Clinical reasoning'],
    Law: ['Legal systems', 'Case analysis', 'Contract law', 'Criminal law', 'Legal writing'],
    Psychology: ['Cognition', 'Research design', 'Statistics', 'Developmental psychology', 'Clinical psychology'],
    Statistics: ['Descriptive statistics', 'Hypothesis testing', 'Regression', 'ANOVA', 'Data visualization'],
    'Research Methods': ['Literature review', 'Research questions', 'Methodology', 'Data analysis', 'Citation'],
    'Academic Writing': ['Essay structure', 'Argumentation', 'Referencing', 'Critical analysis', 'Editing'],
  },
  examFocus: [
    'syllabus mapping',
    'lecture-to-notes workflow',
    'past-paper practice',
    'assignment planning',
    'research-backed explanations',
    'exam strategy',
  ],
  assessmentMethods: [
    'Exams',
    'Assignments',
    'Lab reports',
    'Projects',
    'Presentations',
    'Research papers',
  ],
  aiNotes: 'Universal option for university and adult learners when country-specific curriculum data is not available. Use uploaded course outlines, PDFs, lecture notes, rubrics, and the student brief as the source of truth.',
};

export const getCurriculumCountries = () =>
  [...(seed.countries || [])].sort((a, b) => (a.priority || 999) - (b.priority || 999));

export const getCountryByCode = (countryCode) =>
  getCurriculumCountries().find((country) => country.countryCode === countryCode) || null;

export const getCurriculumsForCountry = (countryCode) => {
  const curriculums = getCountryByCode(countryCode)?.curriculums || [];
  return [...curriculums, UNIVERSAL_UNIVERSITY_CURRICULUM];
};

export const getLanguageSupportForCountry = (countryCode) =>
  getCountryByCode(countryCode)?.languageSupport || null;

export const getCurriculumTracks = (curriculum) =>
  curriculum?.tracks?.length ? curriculum.tracks : ['General'];

export const getCurriculumClasses = (curriculum) =>
  curriculum?.classes?.length ? uniq(curriculum.classes) : ['Class 9'];

const normalizeKey = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const getMatchingTrackSubjects = (curriculum, profile = {}) => {
  const trackSubjects = curriculum?.trackSubjects || {};
  const trackEntries = Object.entries(trackSubjects);
  if (!trackEntries.length) return [];

  const profileKeys = [
    profile.track,
    profile.classLevel,
    profile.examBoard,
    profile.curriculum,
  ]
    .map(normalizeKey)
    .filter(Boolean);

  const matched = [];
  trackEntries.forEach(([track, subjects]) => {
    const trackKey = normalizeKey(track);
    const isMatch = profileKeys.some((key) => {
      if (!key || !trackKey) return false;
      return (
        key === trackKey ||
        key.includes(trackKey) ||
        trackKey.includes(key) ||
        (key.includes('igcse') && trackKey.includes('igcse')) ||
        (key.includes('o level') && trackKey.includes('o level')) ||
        (key.includes('as level') && trackKey.includes('as level')) ||
        (key.includes('a level') && trackKey.includes('a level'))
      );
    });

    if (isMatch) matched.push(...subjects);
  });

  return uniq(matched);
};

const SUBJECT_TOPIC_HINTS = {
  'English Language Arts': ['Reading comprehension', 'literary analysis', 'argumentative writing', 'research writing', 'vocabulary'],
  Deutsch: ['Grammatik', 'Textanalyse', 'Erörterung', 'Leseverstehen', 'Aufsatztraining'],
  Italiano: ['Grammatica', 'Analisi del testo', 'Tema argomentativo', 'Comprensione', 'Letteratura'],
  Matematica: ['Algebra', 'Geometria', 'Funzioni', 'Probabilita', 'Trigonometria'],
  Mathematik: ['Algebra', 'Geometrie', 'Funktionen', 'Stochastik', 'Trigonometrie'],
  French: ['Grammaire', 'comprehension ecrite', 'dissertation', 'commentaire', 'oral practice'],
  Mathematics: ['Algebra', 'Geometry', 'Trigonometry', 'Functions', 'Statistics', 'Calculus', 'Word problems'],
  Math: ['Algebra', 'Geometry', 'Trigonometry', 'Functions', 'Statistics', 'Word problems'],
  English: ['Grammar', 'Reading comprehension', 'Essay writing', 'Literature', 'Vocabulary', 'Speaking practice'],
  'English Language': ['Grammar', 'Reading comprehension', 'Essay writing', 'Directed writing', 'Summary writing'],
  Physics: ['Motion', 'Forces', 'Energy', 'Electricity', 'Waves', 'Light', 'Measurements'],
  Chemistry: ['Atomic structure', 'Chemical bonding', 'Acids and bases', 'Organic chemistry', 'Stoichiometry'],
  Biology: ['Cells', 'Genetics', 'Human biology', 'Ecology', 'Photosynthesis', 'Respiration'],
  Science: ['Life Science', 'Earth Science', 'Physical Science', 'Scientific method', 'Data interpretation'],
  ICT: ['Computer basics', 'Internet and communication', 'Spreadsheets', 'Databases', 'Programming basics'],
  'Computer Science': ['Algorithms', 'Programming', 'Data representation', 'Computer systems', 'Databases'],
  Accounting: ['Journal entries', 'Ledger', 'Trial balance', 'Financial statements', 'Depreciation'],
  Economics: ['Demand and supply', 'Markets', 'National income', 'Inflation', 'Development economics'],
  'Business Studies': ['Business activity', 'Marketing', 'Finance', 'Operations', 'Human resources'],
  History: ['Source analysis', 'Chronology', 'Cause and consequence', 'National history', 'World history'],
  Geography: ['Maps', 'Climate', 'Population', 'Resources', 'Physical geography'],
  French: ['Grammar', 'Reading comprehension', 'Writing practice', 'Speaking practice', 'Listening practice'],
  German: ['Grammar', 'Reading comprehension', 'Writing practice', 'Speaking practice', 'Listening practice'],
  Italian: ['Grammar', 'Reading comprehension', 'Writing practice', 'Speaking practice', 'Listening practice'],
};

const uniq = (items) => items.filter((item, index, list) => item && list.indexOf(item) === index);

const normalizeText = (value = '') => String(value).toLowerCase();

const getSuggestionScore = (item, index, profile, contextText) => {
  const label = normalizeText(item.label);
  const type = normalizeText(item.type);
  const context = normalizeText(contextText);
  const track = normalizeText(profile.track || profile.medium || profile.examBoard);
  const classLevel = normalizeText(profile.classLevel);
  let score = 1000 - index;

  if (item.type === 'Subject') score += 60;
  if (track && (label.includes(track) || type.includes(track))) score += 120;
  if (classLevel && (label.includes(classLevel) || type.includes(classLevel))) score += 40;
  if (profile.weakSubjects?.some((subject) => label.includes(normalizeText(subject)))) score += 160;
  if (context) {
    context
      .split(/[^a-z0-9]+/i)
      .filter((token) => token.length > 3)
      .forEach((token) => {
        if (label.includes(token) || type.includes(token)) score += 90;
      });
  }
  if (/exam|test|mock|past|deadline|days?|week/i.test(context) && item.type === 'Exam focus') score += 180;
  if (/university|college|assignment|lecture|thesis|research|course/i.test(context) && /University|Research|Academic|Subject/.test(item.type)) score += 180;
  return score;
};

export const getCurriculumSubjectSuggestions = (curriculum, profile = {}) => {
  const trackSubjects = curriculum?.trackSubjects || {};
  const selectedTrackSubjects = trackSubjects[profile.track] || getMatchingTrackSubjects(curriculum, profile);
  const allTrackSubjects = Object.values(trackSubjects).flat();
  if (selectedTrackSubjects.length && curriculum?.subjectDetails) {
    return selectedTrackSubjects;
  }
  return uniq([
    ...(curriculum?.coreSubjects || []),
    ...selectedTrackSubjects,
    ...allTrackSubjects,
  ]);
};

export const getCurriculumTopicSuggestions = (curriculum, profile = {}, contextText = '') => {
  const subjects = getCurriculumSubjectSuggestions(curriculum, profile);
  const suggestions = [];

  subjects.forEach((subject) => {
    suggestions.push({ label: subject, type: 'Subject' });
    const detailTopics = curriculum?.subjectDetails?.[subject]?.topics?.map((topic) => topic.name) || [];
    const topicHints = detailTopics.length
      ? detailTopics
      : curriculum?.progression?.[subject] || SUBJECT_TOPIC_HINTS[subject] || [];
    topicHints.slice(0, 5).forEach((topic) => {
      suggestions.push({
        label: topic,
        type: subject,
      });
    });
  });

  (curriculum?.examFocus || []).slice(0, 4).forEach((focus) => {
    suggestions.push({ label: focus, type: 'Exam focus' });
  });

  const seen = new Set();
  return suggestions
    .map((item, index) => ({ ...item, score: getSuggestionScore(item, index, profile, contextText) }))
    .sort((a, b) => b.score - a.score)
    .filter((item) => {
      const key = item.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(({ score, ...item }) => item);
};

export const getCurriculumLanguages = (curriculum, profile = {}) => {
  const country = getCountryByCode(profile.countryCode);
  const values = [
    ...(curriculum?.languagesOfInstruction || []),
    ...(country?.languageSupport?.officialInstructionLanguages || []),
    ...(country?.languageSupport?.nativeLanguages || []),
    country?.languageSupport?.defaultFallbackLanguage,
    country?.country === 'France' ? 'French' : null,
    country?.country === 'Germany' ? 'German' : null,
    country?.country === 'Italy' ? 'Italian' : null,
    country?.country === 'India' ? 'Hindi' : null,
    country?.country === 'Bangladesh' ? 'Bangla' : null,
    country?.country === 'United States' ? 'Spanish' : null,
    profile.studyLanguage,
    profile.instructionLanguage,
    profile.nativeLanguage,
    'English',
  ].filter(Boolean);
  return values.filter((value, index, list) => list.indexOf(value) === index);
};

export const getDefaultAcademicProfile = () => {
  const country = getCountryByCode('BD') || getCurriculumCountries()[0];
  const curriculum = country?.curriculums?.[0];
  const track = curriculum?.tracks?.[1] || curriculum?.tracks?.[0] || '';
  const classLevel = country?.defaultClassLevel || curriculum?.classes?.[0] || 'Class 9';
  const instructionLanguage =
    track?.toLowerCase().includes('bangla')
      ? 'Bangla'
      : curriculum?.languagesOfInstruction?.includes('English')
        ? 'English'
        : curriculum?.languagesOfInstruction?.[0] || 'English';

  return {
    countryCode: country?.countryCode || 'BD',
    country: country?.country || 'Bangladesh',
    curriculum: curriculum?.name || 'NCTB',
    track,
    classLevel,
    medium: track,
    examBoard: curriculum?.name || 'NCTB',
    nativeLanguage: instructionLanguage === 'Bangla' ? 'Bangla' : 'English',
    uiLanguage: 'English',
    instructionLanguage,
    studyLanguage: instructionLanguage,
    fallbackLanguage: country?.languageSupport?.defaultFallbackLanguage || 'English',
    outputMode: 'instruction_language_first',
    weakSubjects: [],
  };
};

export const normalizeAcademicProfile = (profile = {}) => {
  const base = getDefaultAcademicProfile();
  const merged = { ...base, ...profile };
  const country = getCountryByCode(merged.countryCode) || getCurriculumCountries()[0];
  const curriculums = getCurriculumsForCountry(country?.countryCode || merged.countryCode);
  const curriculum =
    curriculums.find((item) => item.name === merged.curriculum) ||
    curriculums[0] ||
    null;
  const track =
    curriculum?.tracks?.includes(merged.track)
      ? merged.track
      : curriculum?.tracks?.[0] || merged.track || '';
  const aliasedClassLevel = curriculum?.classAliases?.[merged.classLevel] || merged.classLevel;
  const classLevel =
    curriculum?.classes?.includes(aliasedClassLevel)
      ? aliasedClassLevel
      : country?.defaultClassLevel || curriculum?.classes?.[0] || aliasedClassLevel || '';
  const languages = getCurriculumLanguages(curriculum, merged);
  const studyLanguage = languages.includes(merged.studyLanguage)
    ? merged.studyLanguage
    : languages[0] || 'English';

  return {
    ...merged,
    countryCode: country?.countryCode || merged.countryCode,
    country: country?.country || merged.country,
    curriculum: curriculum?.name || merged.curriculum,
    track,
    classLevel,
    medium: merged.medium || track,
    examBoard: merged.examBoard || curriculum?.name || merged.curriculum,
    instructionLanguage: studyLanguage,
    studyLanguage,
  };
};

export const readLocalAcademicProfile = () =>
  normalizeAcademicProfile(safeParse(localStorage.getItem(STORAGE_KEY), {}));

export const writeLocalAcademicProfile = (profile) => {
  const normalized = normalizeAcademicProfile(profile);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
};

export const parseProfileFromDocument = (profileDoc) => {
  const academic = safeParse(profileDoc?.academicProfile, {});
  const language = safeParse(profileDoc?.languageProfile, {});
  return normalizeAcademicProfile({ ...academic, ...language });
};

export const splitProfileForStorage = (profile) => {
  const normalized = normalizeAcademicProfile(profile);
  const {
    nativeLanguage,
    uiLanguage,
    instructionLanguage,
    studyLanguage,
    fallbackLanguage,
    outputMode,
    ...academicProfile
  } = normalized;

  return {
    academicProfile,
    languageProfile: {
      nativeLanguage,
      uiLanguage,
      instructionLanguage,
      studyLanguage,
      fallbackLanguage,
      outputMode,
    },
  };
};

const daysUntil = (dateValue) => {
  if (!dateValue) return null;
  const target = new Date(`${dateValue}T23:59:59`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86400000));
};

const inferDeadlineDaysFromText = (text = '') => {
  const normalized = String(text).toLowerCase();
  const direct = normalized.match(/(?:in|within|only|left|remaining)?\s*(\d{1,3})\s*(day|days|week|weeks|month|months)\b/);
  if (direct) {
    const amount = Number(direct[1]);
    const unit = direct[2];
    if (unit.startsWith('week')) return amount * 7;
    if (unit.startsWith('month')) return amount * 30;
    return amount;
  }
  if (/\btomorrow\b/.test(normalized)) return 1;
  if (/\btoday\b/.test(normalized)) return 0;
  return null;
};

const inferSessionType = ({ description, examDays }) => {
  const text = `${description || ''}`.toLowerCase();
  if (examDays !== null && examDays <= 7) return 'crash_course';
  if (/exam|test|final|mock|past paper|question/i.test(text)) return 'exam_revision';
  if (/weak|confus|struggl|don't understand|dont understand/i.test(text)) return 'weak_topic_repair';
  return 'guided_learning';
};

export const buildGuidedSessionPlan = ({ topic, description = '', academicProfile }) => {
  const profile = normalizeAcademicProfile(academicProfile);
  const examDays = inferDeadlineDaysFromText(description);
  const sessionType = inferSessionType({ description, examDays });
  const urgent = sessionType === 'crash_course';
  const dayCount = urgent ? Math.max(1, Math.min(examDays || 6, 6)) : 5;
  const focus = topic.trim();

  const dailyPlan = Array.from({ length: dayCount }, (_, index) => {
    const day = index + 1;
    if (urgent) {
      const labels = [
        `Foundations and must-know terms for ${focus}`,
        `Core formulas, rules, and worked examples`,
        `Exam-style problems and common mistakes`,
        `Weak-area repair and timed practice`,
        `Past-question practice and answer strategy`,
        `Final review and mock check`,
      ];
      return { day, title: labels[index] || `Focused practice for ${focus}` };
    }
    const labels = [
      `Map the full topic and prerequisites`,
      `Learn the core concept step by step`,
      `Practice guided examples`,
      `Check understanding with MCQs and flashcards`,
      `Review weak areas and summarize mastery`,
    ];
    return { day, title: labels[index] || `Continue ${focus}` };
  });

  return {
    version: 1,
    topic: focus,
    description,
    sessionType,
    examDays,
    createdAt: new Date().toISOString(),
    curriculumContext: {
      country: profile.country,
      countryCode: profile.countryCode,
      curriculum: profile.curriculum,
      track: profile.track,
      classLevel: profile.classLevel,
      examBoard: profile.examBoard,
      instructionLanguage: profile.instructionLanguage,
      studyLanguage: profile.studyLanguage,
      outputMode: profile.outputMode,
    },
    currentStep: 'plan_created',
    progress: 0,
    weakTopics: [],
    strongTopics: [],
    dailyPlan,
    recommendedActions: [
      urgent ? 'Start Day 1' : 'Start Lesson',
      'Generate Crash Course',
      'Show Study Map',
      'Give Me Exam Questions',
      'Make MCQs',
      'Create Flashcards',
    ],
  };
};

export const buildGuidedOpeningMessage = (plan) => {
  const c = plan.curriculumContext || {};
  const examLine =
    plan.examDays === null
      ? 'I will pace this as a guided learning session.'
      : plan.examDays === 0
        ? 'Your exam is today, so we will focus only on the highest-impact work.'
        : `Your exam is in ${plan.examDays} day${plan.examDays === 1 ? '' : 's'}, so I will prioritize what matters most.`;

  const planLines = plan.dailyPlan
    .map((item) => `**Day ${item.day}:** ${item.title}`)
    .join('\n');

  return `I have set up your session for **${plan.topic}**.

**Profile I will use**
- Country: ${c.country || 'Not set'}
- Curriculum: ${c.curriculum || 'Not set'}
- Version / track: ${c.track || 'Not set'}
- Class: ${c.classLevel || 'Not set'}
- Exam board: ${c.examBoard || c.curriculum || 'Not set'}
- Study language: ${c.studyLanguage || c.instructionLanguage || 'English'}

${examLine}

**Study Plan**
${planLines}

I will drive the session: teach a small concept, check your understanding, update weak areas, then decide the next best step.

[ACTION:${plan.recommendedActions[0]}]
[ACTION:Generate Crash Course]
[ACTION:Show Study Map]
[ACTION:Give Me Exam Questions]
[ACTION:Make MCQs]
[ACTION:Create Flashcards]`;
};

export const buildCurriculumPromptBlock = (activeSession, sessionContext = null) => {
  const plan = safeParse(activeSession?.sessionPlan, null);
  const state = safeParse(activeSession?.sessionState, null);
  const curriculumContext = safeParse(activeSession?.curriculumContext, null) || plan?.curriculumContext;

  if (!plan && !curriculumContext && !state) return '';

  return `
CURRICULUM-AWARE SESSION ENGINE:
You are not a passive chatbot. You are running an AI-led tutor session.

Known curriculum context:
${JSON.stringify(curriculumContext || {}, null, 2)}

Current guided session plan:
${JSON.stringify(plan || {}, null, 2)}

Current session state:
${JSON.stringify(state || {}, null, 2)}

Behavior rules:
- Do not ask the student what to study if the plan already defines the topic.
- Decide the next best learning action from the plan, deadline, weak topics, and student history.
- Teach in short lesson steps, then check understanding with a question or MCQ.
- Every assistant response must end with 3-6 contextual [ACTION:...] buttons. Use labels that match the next best learning moves.
- Use [ACTION:Continue], [ACTION:Explain Simpler], [ACTION:Practice More], [ACTION:Show Study Map], [ACTION:Make MCQs], [ACTION:Create Flashcards], [ACTION:Generate Diagram], [ACTION:Show Graph], and [ACTION:Review Weak Topic] when useful.
- Periodically prompt the student to generate MCQs, create flashcards, test understanding, revise weak topics, or switch to an exam-focused plan.
- When a concept is visual, automatically include an SVG [FIGURE], Mermaid diagram, chart, table, or structured visual explanation without waiting for the user to ask.
- Keep MCQs in the [MCQ]...[/MCQ] format so the dedicated MCQ section can render them separately from prose.
- Maintain a compact knowledge map mentally: prerequisites, current node, weak nodes, strong nodes, and next node.
- For PDFs, reason over extracted text, tables, diagrams, figure registry, page context, and notes; explain uncertainty if OCR/table recognition is weak.
- For audio, use transcript, timestamps, speaker turns when available, lecture notes, summaries, and key concepts.
- If the student asks for an exam path, prioritize curriculum/exam-board style questions.
- Respect the study language and output mode in the curriculum context. Teach fully in that language unless the user explicitly asks for another language.
${sessionContext?.currentLevel ? `- Student level from assessment: ${sessionContext.currentLevel}` : ''}
`;
};
