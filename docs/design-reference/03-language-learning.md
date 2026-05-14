# Language Learning Dashboard (LanguageLearning.css)

**File**: `src/pages/LanguageLearning/LanguageLearning.css`

**Purpose**: The main dashboard for language learning. Shows available languages, learning stages, and lesson modules.

---

## Layout Structure

```
.language-learning-container (full height, flex column)
  ├─ .language-header (padding, border-bottom)
  │   ├─ h1 "Language Learning"
  │   └─ .language-selector (dropdown)
  ├─ .learning-stages (flex row, gap)
  │   ├─ .stage-card.active (border: accent)
  │   └─ .stage-card (border: border)
  └─ .modules-grid (grid, auto-fit, minmax)
      └─ .module-card (border, hover: transform + shadow)
          ├─ .module-icon
          ├─ .module-title
          ├─ .module-description
          └─ .module-progress
```

**Design Intent**: 
- **Horizontal stage selector**: Shows learning progression (Beginner → Elementary → Intermediate → Advanced)
- **Grid of modules**: Each stage has 5 modules (Vocabulary, Grammar, Pronunciation, Listening, Cultural Context)
- **Card-based UI**: Consistent with rest of app

---

## Root Container

```css
.language-learning-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-bg-primary);
  padding: var(--spacing-xl) var(--spacing-2xl);
}
```

**Dimensions**: 
- Padding: 28px vertical, 40px horizontal
- Min height: 100vh (full viewport)

**Design Intent**: Full-page layout with generous padding for comfortable reading.

---

## Header

```css
.language-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--spacing-xl);
}

.language-header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.language-selector {
  min-width: 200px;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  color: var(--color-text-primary);
  font-size: 1rem;
}
```

**Dimensions**: 
- Header padding-bottom: 20px
- Selector: Min 200px width, 8px vertical padding, 12px horizontal padding

**Design Intent**: 
- **Title + selector**: Left-aligned title, right-aligned language dropdown
- **Border-bottom**: Separates header from content
- **Dropdown**: Allows switching between languages (English, Spanish, French, etc.)

---

## Learning Stages

```css
.learning-stages {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-2xl);
  overflow-x: auto;
}

.stage-card {
  flex: 1;
  min-width: 200px;
  padding: var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.stage-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-2px);
}

.stage-card.active {
  border-color: var(--color-accent);
  background-color: rgba(168, 85, 247, 0.1);
}

.stage-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.stage-description {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
```

**Dimensions**: 
- Card: Min 200px width, 20px padding
- Gap: 12px
- Border: 2px (4px when active)

**Design Intent**: 
- **Horizontal scroll**: On mobile, stages scroll horizontally
- **Active state**: Purple border + tinted background
- **Equal width**: Each stage takes equal space (flex: 1)
- **Hover lift**: Cards lift 2px on hover

**Stages**: 
1. **Beginner** (A1): Basic phrases, common words
2. **Elementary** (A2): Simple conversations, everyday topics
3. **Intermediate** (B1-B2): Complex sentences, abstract concepts
4. **Advanced** (C1-C2): Fluent, nuanced expression

---

## Modules Grid

```css
.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.module-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-xl);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.module-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.module-card.completed {
  border-color: var(--color-success);
}

.module-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Dimensions**: 
- Grid: Auto-fit, min 280px per column
- Card padding: 28px
- Gap: 20px
- Hover lift: 4px

**Design Intent**: 
- **Responsive grid**: Automatically adjusts columns based on available width
- **Min 280px**: Ensures cards don't get too narrow
- **Hover effect**: Lift + shadow + purple border
- **Completed state**: Green border
- **Locked state**: Dimmed (50% opacity)

---

## Module Card Content

```css
.module-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin-bottom: var(--spacing-sm);
}

.module-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.module-description {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-bottom: var(--spacing-md);
}

.module-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: auto;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background-color: var(--color-bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-accent);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  white-space: nowrap;
}
```

**Dimensions**: 
- Icon: 56×56px circle
- Progress bar: 6px height
- Title: 1.25rem (20px)
- Description: 0.875rem (14px)

**Design Intent**: 
- **Icon at top**: Visual identifier for each module
- **Title + description**: Clear hierarchy
- **Progress bar at bottom**: Shows completion percentage
- **margin-top: auto**: Pushes progress bar to bottom of card

**Module Icons**: 
- 📚 Vocabulary
- 📖 Grammar
- 🗣️ Pronunciation
- 👂 Listening
- 🌍 Cultural Context

---

## Module Types

### 1. Vocabulary Module

```css
.module-card.vocabulary .module-icon {
  background-color: rgba(168, 85, 247, 0.2);
  color: var(--color-accent);
}
```

**Purpose**: Learn common words and phrases
**Content**: Flashcards, spaced repetition, word lists

### 2. Grammar Module

```css
.module-card.grammar .module-icon {
  background-color: rgba(16, 185, 129, 0.2);
  color: var(--color-success);
}
```

**Purpose**: Understand sentence structure and rules
**Content**: Explanations, examples, exercises

### 3. Pronunciation Module

```css
.module-card.pronunciation .module-icon {
  background-color: rgba(245, 158, 11, 0.2);
  color: var(--color-warning);
}
```

**Purpose**: Practice speaking and accent
**Content**: Audio playback, speech recognition, IPA transcription

### 4. Listening Module

```css
.module-card.listening .module-icon {
  background-color: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}
```

**Purpose**: Improve comprehension of spoken language
**Content**: Audio clips, transcripts, comprehension questions

### 5. Cultural Context Module

```css
.module-card.cultural-context .module-icon {
  background-color: rgba(236, 72, 153, 0.2);
  color: #ec4899;
}
```

**Purpose**: Learn about culture, customs, and context
**Content**: Articles, videos, cultural notes

---

## Stats Bar

```css
.stats-bar {
  display: flex;
  gap: var(--spacing-xl);
  padding: var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-xl);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-accent);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

**Dimensions**: 
- Padding: 20px
- Gap: 28px
- Value: 1.75rem (28px)
- Label: 0.875rem (14px)

**Design Intent**: 
- **Horizontal layout**: Stats displayed in a row
- **Large numbers**: Emphasize progress
- **Muted labels**: Secondary information

**Stats Shown**: 
- **Day Streak**: Consecutive days of practice
- **Words Learned**: Total vocabulary count
- **Lessons Completed**: Total lessons finished
- **Current Level**: A1, A2, B1, B2, C1, C2

---

## Responsive Behavior

```css
@media (max-width: 1024px) {
  .modules-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .language-learning-container {
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .learning-stages {
    flex-direction: column;
  }

  .stage-card {
    min-width: auto;
  }

  .modules-grid {
    grid-template-columns: 1fr;
  }

  .stats-bar {
    flex-direction: column;
    gap: var(--spacing-md);
  }
}
```

**Design Intent**: 
- **1024px**: Reduce module card min-width to 240px
- **768px**: 
  - Stack stages vertically
  - Single-column module grid
  - Stack stats vertically
  - Reduce padding

---

## Summary

**Key Design Decisions**:

1. **Horizontal stage selector**: Clear progression path (Beginner → Advanced)
2. **Card grid layout**: Responsive, auto-adjusts to screen width
3. **Module icons**: Visual identifiers with color coding
4. **Progress bars**: Show completion at a glance
5. **Hover effects**: Lift + shadow + purple border
6. **Locked state**: Dimmed cards for unavailable modules
7. **Stats bar**: Motivational metrics at top

**Why this layout?**: 
- Clear learning path (stages)
- Easy to scan (grid of cards)
- Visual feedback (progress bars, colors)
- Motivational (stats, completion states)
