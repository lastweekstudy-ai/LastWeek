# Inline Quiz Design (InlineQuiz.css)

**File**: `src/styles/InlineQuiz.css`

**Purpose**: Multiple-choice quiz component rendered inside chat messages. Used for comprehension checks and practice exercises.

---

## Layout Structure

```
.iq-wrapper (border, border-radius)
  ├─ .iq-header (background: tertiary)
  │   ├─ .iq-badge "QUIZ"
  │   └─ .iq-counter "Question 1 of 5"
  ├─ .iq-question (padding)
  │   └─ Question text (supports markdown)
  ├─ .iq-options (flex column, gap)
  │   └─ .iq-option (border, hover: transform)
  │       ├─ .iq-option-label "A"
  │       ├─ .iq-option-text "Answer text"
  │       └─ .iq-tick / .iq-cross (✓ or ✗)
  ├─ .iq-explanation (border-left: accent)
  │   ├─ .iq-explanation-label "EXPLANATION"
  │   └─ Explanation text
  └─ .iq-score (border: accent)
      └─ .iq-score-inner
          ├─ .iq-score-number "4/5"
          └─ .iq-score-label "Correct"
```

**Design Intent**: 
- **Inline rendering**: Appears inside assistant messages
- **Interactive**: Click options to answer
- **Immediate feedback**: Shows correct/incorrect with colors
- **Explanation**: Reveals after answering
- **Score summary**: Shows at end of multi-question quiz

---

## Root Container

```css
.iq-wrapper {
  border: 2px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  margin: 0.75rem 0;
  background: var(--color-bg-secondary);
}
```

**Dimensions**: 
- Border: 2px
- Border radius: 12px
- Margin: 12px vertical

**Design Intent**: 
- **Rounded corners**: Softer than sharp edges
- **Border**: Separates from surrounding message
- **overflow: hidden**: Clips header background at corners

---

## Header

```css
.iq-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
}

.iq-badge {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--color-accent);
  color: #fff;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
}

.iq-counter {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
```

**Dimensions**: 
- Header padding: 9.6px vertical, 16px horizontal
- Badge padding: 3.2px vertical, 8.8px horizontal
- Badge font: 0.65rem (10.4px)
- Counter font: 0.8rem (12.8px)

**Design Intent**: 
- **Purple "QUIZ" badge**: Identifies component type
- **Question counter**: "Question 1 of 5" shows progress
- **Dark background**: Visually separates from content
- **Small text**: Compact, doesn't dominate

---

## Question

```css
.iq-question {
  padding: 1rem 1.25rem 0.75rem;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  line-height: 1.6;
}

.iq-question .enhanced-message p {
  margin: 0;
}
```

**Dimensions**: 
- Padding: 16px top, 20px horizontal, 12px bottom
- Font size: 0.9375rem (15px)
- Line height: 1.6

**Design Intent**: 
- **Generous padding**: Breathing room around question
- **Supports markdown**: Can render formatted text, code, math
- **Tight margins**: No extra spacing on paragraphs

---

## Options

```css
.iq-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 1.25rem 1rem;
}

.iq-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.65rem 0.9rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-primary);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
  width: 100%;
}

.iq-option:not(:disabled):hover {
  border-color: var(--color-accent);
  background: var(--color-bg-tertiary);
  transform: translateX(3px);
}

.iq-option:disabled {
  cursor: default;
}
```

**Dimensions**: 
- Gap between options: 8px
- Option padding: 10.4px vertical, 14.4px horizontal
- Border: 2px
- Border radius: 8px
- Hover slide: 3px right

**Design Intent**: 
- **Vertical stack**: One option per row
- **Hover effect**: Purple border + slide right 3px
- **Disabled after answer**: Can't change answer once submitted
- **Full-width**: Spans entire quiz width

**Why slide right (not up)?**: 
- Sliding up would shift other options (jarring)
- Sliding right feels like "selecting" or "pulling out"
- 3px is subtle but noticeable

### Option States

```css
.iq-option.correct {
  border-color: var(--color-success, #10b981);
  background: color-mix(in srgb, var(--color-success, #10b981) 12%, transparent);
}

.iq-option.wrong {
  border-color: var(--color-error, #ef4444);
  background: color-mix(in srgb, var(--color-error, #ef4444) 12%, transparent);
}

.iq-option.dim {
  opacity: 0.45;
}
```

**Design Intent**: 
- **Correct**: Green border + 12% green tint
- **Wrong**: Red border + 12% red tint
- **Dim**: Other options fade to 45% opacity after answering

**Why color-mix?**: 
- Creates a subtle tinted background (12% color, 88% transparent)
- More elegant than hardcoded rgba values
- Adapts to theme changes

### Option Label

```css
.iq-option-label {
  flex-shrink: 0;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  background: var(--color-bg-tertiary);
  border: 1.5px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  margin-top: 1px;
}

.iq-option.correct .iq-option-label {
  background: var(--color-success, #10b981);
  border-color: var(--color-success, #10b981);
  color: #fff;
}

.iq-option.wrong .iq-option-label {
  background: var(--color-error, #ef4444);
  border-color: var(--color-error, #ef4444);
  color: #fff;
}
```

**Dimensions**: 
- Size: 1.6rem (25.6px) circle
- Border: 1.5px
- Font: 0.75rem (12px)

**Design Intent**: 
- **Circular badge**: Contains letter (A, B, C, D)
- **flex-shrink: 0**: Doesn't shrink when text wraps
- **margin-top: 1px**: Aligns with first line of text
- **Color changes**: Green for correct, red for wrong

### Option Text

```css
.iq-option-text {
  flex: 1;
  font-size: 0.9rem;
  color: var(--color-text-primary);
  line-height: 1.5;
}

.iq-option-text .enhanced-message p {
  margin: 0;
}
```

**Dimensions**: 
- Font size: 0.9rem (14.4px)
- Line height: 1.5

**Design Intent**: 
- **flex: 1**: Grows to fill available space
- **Supports markdown**: Can render formatted text, code
- **Wraps naturally**: Multi-line options are fine

### Tick/Cross Icons

```css
.iq-tick  { margin-left: auto; color: var(--color-success, #10b981); font-weight: 700; }
.iq-cross { margin-left: auto; color: var(--color-error, #ef4444);   font-weight: 700; }
```

**Design Intent**: 
- **margin-left: auto**: Pushes to right edge
- **✓ for correct**: Green checkmark
- **✗ for wrong**: Red X
- **Bold**: Stands out

---

## Explanation

```css
.iq-explanation {
  margin: 0 1.25rem 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: var(--color-bg-tertiary);
  border-left: 3px solid var(--color-accent);
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  animation: fadeIn 0.25s ease;
}

.iq-explanation-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-accent);
  margin-bottom: 0.4rem;
}

.iq-explanation .enhanced-message p {
  margin: 0;
}
```

**Dimensions**: 
- Padding: 12px vertical, 16px horizontal
- Border-left: 3px purple
- Font: 0.875rem (14px)
- Label font: 0.7rem (11.2px)

**Design Intent**: 
- **Appears after answering**: Fades in with animation
- **Purple left border**: Accent color draws attention
- **"EXPLANATION" label**: Identifies section
- **Dark background**: Separates from options
- **Supports markdown**: Can render formatted explanations

---

## Score Summary

```css
.iq-score {
  margin: 0 1.25rem 1.25rem;
  padding: 1rem;
  border-radius: 10px;
  background: var(--color-bg-tertiary);
  border: 2px solid var(--color-accent);
  animation: fadeIn 0.3s ease;
}

.iq-score-inner {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.iq-score-number {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-accent);
  line-height: 1;
}

.iq-score-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}
```

**Dimensions**: 
- Padding: 16px
- Border: 2px purple
- Number font: 2rem (32px)
- Label font: 1rem (16px)

**Design Intent**: 
- **Appears at end**: After all questions answered
- **Large number**: "4/5" is prominent
- **Purple border**: Matches accent color
- **Fade-in animation**: Smooth appearance

---

## Animation

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Design Intent**: 
- **Fade + slide up**: Explanation and score appear smoothly
- **4px slide**: Subtle motion
- **0.25s–0.3s duration**: Quick but noticeable

---

## Responsive Behavior

```css
@media (max-width: 600px) {
  .iq-option-text { font-size: 0.85rem; }
  .iq-question    { font-size: 0.875rem; }
}
```

**Design Intent**: 
- **Smaller text on mobile**: Fits more content
- **600px breakpoint**: Targets small phones

---

## Summary

**Key Design Decisions**:

1. **Inline rendering**: Appears inside chat messages, not a separate page
2. **Immediate feedback**: Colors change instantly when answered
3. **Hover slide right**: 3px slide feels like "selecting"
4. **Circular labels**: A, B, C, D in circles (familiar pattern)
5. **Dim unselected**: Other options fade to 45% after answering
6. **Purple left border on explanation**: Draws attention
7. **Large score number**: "4/5" is prominent and satisfying
8. **Fade-in animations**: Smooth appearance of explanation and score

**Why this design?**: 
- **Familiar**: Looks like standard MCQ tests
- **Clear feedback**: Green/red colors are universal
- **Engaging**: Hover effects and animations make it feel interactive
- **Compact**: Fits inside chat messages without dominating
- **Accessible**: Large touch targets, clear labels, good contrast

**Interaction flow**: 
1. User sees question + options
2. Hover shows purple border + slide right
3. Click option → border turns green/red, other options dim
4. Explanation fades in below
5. After all questions → score summary appears

**Technical notes**: 
- **color-mix()**: Modern CSS for tinted backgrounds
- **:disabled**: Prevents changing answer after submission
- **transform: translateX(3px)**: Slide right on hover
- **animation: fadeIn**: Smooth appearance of new content
