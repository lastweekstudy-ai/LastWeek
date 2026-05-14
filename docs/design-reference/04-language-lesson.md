# Language Learning Lesson Design (LanguageLearningLesson.css)

**File**: `src/pages/LanguageLearningLesson.css`

**Purpose**: Individual lesson page with 5-step structure (Introduction, Explanation, Examples, Practice, Mastery Check). Shows progress through steps and validates understanding.

---

## Layout Structure

```
.lesson-container (full height)
  ├─ .lesson-header (fixed top)
  │   ├─ .btn-back
  │   ├─ h2 (lesson title)
  │   └─ .progress-steps (5 circular indicators)
  └─ .lesson-content (scrollable, max-width: 800px)
      ├─ .lesson-section (current step)
      │   ├─ h3 (step title)
      │   ├─ .content-text (main content)
      │   ├─ .examples-section (example cards)
      │   └─ .btn-next
      └─ .mastery-section (final step)
          ├─ .mastery-question (multiple questions)
          │   ├─ .question-text
          │   └─ .options (option buttons)
          ├─ .btn-submit
          └─ .results-section (score display)
```

**Design Intent**: 
- **5-step structure**: Introduction → Explanation → Examples → Practice → Mastery Check
- **Progress indicators**: Circular steps at top show current position
- **Linear flow**: User progresses through steps sequentially
- **Mastery check**: Final quiz validates understanding (80% pass threshold)

---

## Header

```css
.lesson-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: var(--color-bg-secondary, #121212);
  border-bottom: 1px solid var(--color-border, #262626);
}

.btn-back {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--color-border, #262626);
  border-radius: 0.5rem;
  color: var(--color-text-primary, #fff);
  cursor: pointer;
  transition: all 0.2s ease;
}

.lesson-header h2 {
  font-size: 1.25rem;
  text-transform: capitalize;
}
```

**Dimensions**: 
- Padding: 16px vertical, 32px horizontal
- Title: 1.25rem (20px)
- Back button: 8px vertical, 16px horizontal padding

**Design Intent**: 
- **Back button**: Return to dashboard
- **Lesson title**: Shows module name (e.g., "Vocabulary - Beginner")
- **Progress steps**: Visual indicator of position

---

## Progress Steps

```css
.progress-steps {
  display: flex;
  gap: 0.5rem;
}

.progress-step {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-bg-tertiary, #1a1a1a);
  border: 2px solid var(--color-border, #333);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted, #9ca3af);
  cursor: pointer;
  transition: all 0.2s ease;
}

.progress-step:hover:not(:disabled) {
  border-color: var(--color-accent, #a855f7);
  transform: scale(1.1);
}

.progress-step.completed {
  background: var(--color-accent, #a855f7);
  border-color: var(--color-accent, #a855f7);
  color: white;
  cursor: pointer;
}

.progress-step.current {
  background: var(--color-accent-light, #c084fc);
  border-color: var(--color-accent-light, #c084fc);
  color: white;
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.4);
}
```

**Dimensions**: 
- Circle: 32×32px
- Gap: 8px
- Border: 2px
- Font: 0.8rem (12.8px)

**Design Intent**: 
- **5 circles**: Numbered 1-5 for each step
- **Gray**: Not yet reached
- **Purple**: Completed (clickable to revisit)
- **Light purple + glow**: Current step
- **Hover scale**: Grows 10% on hover
- **Clickable**: Can jump to completed steps

**Why circles?**: 
- Familiar pattern (stepper UI)
- Compact (fits in header)
- Clear visual progress

---

## Content Area

```css
.lesson-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.lesson-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.lesson-section h3 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lesson-section p {
  line-height: 1.7;
  color: var(--color-text-secondary, #d1d5db);
  margin-bottom: 1rem;
}
```

**Dimensions**: 
- Max width: 800px (centered)
- Padding: 32px
- h3: 1.5rem (24px)
- Line height: 1.7

**Design Intent**: 
- **Centered column**: Max 800px for comfortable reading
- **Fade-in animation**: Smooth transition between steps
- **Generous line-height**: 1.7 for readability
- **Icon in heading**: Visual indicator of step type

---

## Content Text

```css
.content-text {
  background: var(--color-bg-secondary, #121212);
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.content-text p {
  margin: 0;
  font-size: 1.0625rem;
}
```

**Dimensions**: 
- Padding: 24px
- Border radius: 12px
- Font: 1.0625rem (17px)

**Design Intent**: 
- **Dark background**: Separates from page background
- **Rounded corners**: Softer than sharp edges
- **Slightly larger text**: 17px for emphasis

---

## Examples Section

```css
.examples-section {
  margin: 1.5rem 0;
}

.examples-section h4 {
  margin-bottom: 1rem;
  color: var(--color-text-muted, #9ca3af);
}

.example-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg-secondary, #121212);
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  border-left: 3px solid var(--color-accent, #a855f7);
}

.example-number {
  width: 24px;
  height: 24px;
  background: var(--color-accent, #a855f7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.example-card p {
  margin: 0;
  flex: 1;
}
```

**Dimensions**: 
- Card padding: 16px
- Gap: 16px
- Border-left: 3px purple
- Number circle: 24×24px

**Design Intent**: 
- **Purple left border**: Accent color draws attention
- **Numbered circles**: Shows sequence (1, 2, 3...)
- **Flex layout**: Number on left, text on right
- **Multiple examples**: Usually 3-5 examples per lesson

**Example content**: 
- Vocabulary: "Hello" → "Hola" (Spanish)
- Grammar: "I am" → "Yo soy" (conjugation)
- Pronunciation: "Gracias" → /ˈɡɾa.sjas/ (IPA)

---

## Mastery Check

```css
.mastery-section {
  background: var(--color-bg-secondary, #121212);
  padding: 2rem;
  border-radius: 1rem;
}

.mastery-instructions {
  color: var(--color-text-muted, #9ca3af);
  margin-bottom: 1.5rem;
}

.mastery-question {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border, #262626);
}

.mastery-question:last-of-type {
  border-bottom: none;
}

.question-text {
  font-weight: 500;
  margin-bottom: 1rem;
  color: var(--color-text-primary, #fff);
}
```

**Dimensions**: 
- Section padding: 32px
- Question margin: 24px
- Border-bottom: 1px

**Design Intent**: 
- **Dark background**: Separates from lesson content
- **Instructions**: "Answer all questions to complete the lesson"
- **Multiple questions**: Usually 5 questions
- **Border between**: Separates questions visually

---

## Option Buttons

```css
.options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-btn {
  padding: 0.75rem 1rem;
  background: var(--color-bg-tertiary, #141414);
  border: 1px solid var(--color-border, #262626);
  border-radius: 0.5rem;
  color: var(--color-text-primary, #fff);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.option-btn:hover:not(:disabled) {
  border-color: var(--color-accent, #a855f7);
}

.option-btn.selected {
  border-color: var(--color-accent, #a855f7);
  background: rgba(168, 85, 247, 0.1);
}

.option-btn.correct {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.option-btn.incorrect {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}
```

**Dimensions**: 
- Padding: 12px vertical, 16px horizontal
- Gap: 8px
- Border radius: 8px

**Design Intent**: 
- **Vertical stack**: One option per row
- **Hover purple**: Indicates interactivity
- **Selected: purple border + tint**: Shows user's choice
- **Correct: green**: Shows correct answer after submit
- **Incorrect: red**: Shows wrong answer after submit

---

## Submit Button

```css
.btn-submit {
  width: 100%;
  padding: 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1.5rem;
  background: var(--color-accent, #a855f7);
  color: white;
  border: none;
}

.btn-submit:hover {
  background: var(--color-accent-hover, #9333ea);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Dimensions**: 
- Width: 100%
- Padding: 16px
- Border radius: 12px

**Design Intent**: 
- **Full-width**: Easy to tap
- **Purple**: Accent color
- **Disabled**: Until all questions answered

---

## Results Section

```css
.results-section {
  margin-top: 2rem;
  text-align: center;
}

.score-display {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 3rem;
  background: var(--color-bg-tertiary, #141414);
  border-radius: 1rem;
  margin-bottom: 1.5rem;
}

.score-display.passed .score-value {
  color: #10b981;
}

.score-display.failed .score-value {
  color: #ef4444;
}

.score-label {
  font-size: 0.875rem;
  color: var(--color-text-muted, #9ca3af);
}

.score-value {
  font-size: 3rem;
  font-weight: 700;
}

.pass-message,
.fail-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.pass-icon,
.fail-icon {
  font-size: 3rem;
}
```

**Dimensions**: 
- Score padding: 24px vertical, 48px horizontal
- Score value: 3rem (48px)
- Icon: 3rem (48px)

**Design Intent**: 
- **Large score**: "4/5" or "80%" prominently displayed
- **Green if passed**: ≥80% (4/5 or better)
- **Red if failed**: <80%
- **Icon**: ✓ for pass, ✗ for fail
- **Message**: "Great job!" or "Try again"

---

## Action Buttons

```css
.btn-continue {
  background: #10b981;
  color: white;
  border: none;
}

.btn-continue:hover {
  background: #059669;
}

.btn-retry {
  background: transparent;
  color: var(--color-text-primary, #fff);
  border: 1px solid var(--color-border, #262626);
}

.btn-retry:hover {
  background: var(--color-bg-tertiary, #141414);
}
```

**Design Intent**: 
- **Continue (green)**: If passed, return to dashboard
- **Retry (gray)**: If failed, restart lesson

---

## Responsive Behavior

```css
@media (max-width: 768px) {
  .lesson-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .lesson-content {
    padding: 1rem;
  }
  
  .mastery-section {
    padding: 1rem;
  }
  
  .example-card {
    flex-direction: column;
    gap: 0.5rem;
  }
}
```

**Design Intent**: 
- **Stack header**: Back button, title, progress steps stack vertically
- **Reduce padding**: More space for content
- **Stack examples**: Number above text (not side-by-side)

---

## Summary

**Key Design Decisions**:

1. **5-step structure**: Introduction → Explanation → Examples → Practice → Mastery Check
2. **Progress circles**: Visual indicator at top (clickable to revisit)
3. **Fade-in animation**: Smooth transition between steps (0.3s)
4. **Centered column**: Max 800px for comfortable reading
5. **Purple left border**: On example cards (accent color)
6. **Mastery check**: 5 questions, 80% pass threshold
7. **Colored states**: Green for correct, red for incorrect
8. **Large score display**: 48px font, green/red color
9. **Action buttons**: Continue (green) or Retry (gray)

**Why this design?**: 
- **Linear flow**: Guides user through learning progression
- **Clear progress**: Always know where you are (circles at top)
- **Validation**: Mastery check ensures understanding
- **Feedback**: Immediate visual feedback (colors)
- **Motivational**: Large score display, encouraging messages

**Lesson flow**: 
1. User clicks module on dashboard
2. Lesson loads with step 1 (Introduction)
3. User reads content, clicks "Next"
4. Steps 2-4: Explanation, Examples, Practice
5. Step 5: Mastery Check (5 questions)
6. User answers all questions, clicks "Submit"
7. Score displayed (green if ≥80%, red if <80%)
8. If passed: "Continue" returns to dashboard
9. If failed: "Retry" restarts lesson

**Technical notes**: 
- **fadeIn animation**: 0.3s ease, 10px slide up
- **transform: scale(1.1)**: Progress step hover effect
- **box-shadow glow**: Current step has purple glow
- **text-transform: capitalize**: Lesson titles capitalized
- **border-left: 3px**: Example cards have purple accent
