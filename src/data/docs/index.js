import { introductionContent } from './introduction';
import { gettingStartedContent } from './gettingStarted';
import { studyModesContent } from './studyModes';
import { resourceManagementContent } from './resourceManagement';
import { studyToolsContent } from './studyTools';
import { examPlanningContent } from './examPlanning';
import { collaborationContent } from './collaboration';
import { pricingAndPlansContent } from './pricingAndPlans';
import { faqContent } from './faq';

export const allDocumentation = [
  introductionContent,
  gettingStartedContent,
  studyModesContent,
  resourceManagementContent,
  studyToolsContent,
  examPlanningContent,
  collaborationContent,
  pricingAndPlansContent,
  faqContent,
];

export const documentationIndex = {
  'introduction': introductionContent,
  'getting-started': gettingStartedContent,
  'study-modes': studyModesContent,
  'resource-management': resourceManagementContent,
  'study-tools': studyToolsContent,
  'exam-planning': examPlanningContent,
  'collaboration': collaborationContent,
  'pricing-plans': pricingAndPlansContent,
  'faq': faqContent,
};

export const sidebarNavigation = [
  {
    category: 'Getting Started',
    items: [
      { title: 'Introduction', slug: 'introduction', icon: 'book' },
      { title: 'Getting Started', slug: 'getting-started', icon: 'flash' },
    ],
  },
  {
    category: 'Features',
    items: [
      { title: 'Study Modes', slug: 'study-modes', icon: 'brain' },
      { title: 'Resource Management', slug: 'resource-management', icon: 'share' },
      { title: 'Study Tools', slug: 'study-tools', icon: 'flash' },
      { title: 'Exam Planning', slug: 'exam-planning', icon: 'target' },
      { title: 'Collaboration', slug: 'collaboration', icon: 'share' },
    ],
  },
  {
    category: 'Account',
    items: [
      { title: 'Pricing & Plans', slug: 'pricing-plans', icon: 'chart' },
    ],
  },
  {
    category: 'Help',
    items: [
      { title: 'FAQ', slug: 'faq', icon: 'target' },
    ],
  },
];

export const searchableContent = allDocumentation.flatMap(doc => 
  doc.sections.map(section => ({
    id: `${doc.slug}-${section.id}`,
    title: section.title,
    docTitle: doc.title,
    docSlug: doc.slug,
    content: section.content,
    keywords: section.keywords,
    searchText: `${doc.title} ${section.title} ${section.content} ${section.keywords.join(' ')}`.toLowerCase(),
  }))
);

export default {
  allDocumentation,
  documentationIndex,
  sidebarNavigation,
  searchableContent,
};
