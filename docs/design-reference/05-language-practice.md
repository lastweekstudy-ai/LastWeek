# Language Learning Practice Design (LanguageLearningPractice.css)

**File**: `src/pages/LanguageLearningPractice.css`

**Purpose**: Practice exercises for language learning. Includes flashcards, reading comprehension, conversation practice, and speaking/listening exercises.

---

## Layout Structure

```
.practice-container (full height)
  ├─ .practice-selection (practice type selection)
  │   ├─ .practice-header
  │   │   ├─ .btn-back
  │   │   └─ h2 "Practice"
  │   └─ .practice-grid (card grid)
  │       └─ .practice-card (type cards)
  │           ├─ .practice-icon
  │           ├─ .practice-name
  │           ├─ .practice-desc
  │           └─ .due-badge (if due)
  └─ .practice-content (active practice)
      ├─ .practice-progress (progress bar)
      ├─ .question-section (current question)
      │   ├─ h3 (question)
      │   └─ .options-grid (answer options)
      └─ .practice-actions
          └─ .btn-next / .btn-finish
```

**Design Intent**: 
- **Practice type selection**: Choose from 5 practice types
- **Progress tracking**: Shows X/Y questions completed
- **Spaced repetition**: Due items highlighted with red badge
- **Immediate feedback**: Shows correct/incorrect after each answer

---

## Practice Selection

```css
.practice-selection {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.practice-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.practice-header h2 {
  font-size: 1.5rem;
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
```

**Dimensions**: 
- Max width: 900px (centered)
- Padding: 32px
- Header gap: 16px
- Title: 1.5rem (24px)

**Design Intent**: 
- **Back button**: Return to language dashboard
- **Title**: "Practice"
- **Centered layout**: Max 900px for comfortable viewing

---

## Practice Grid

```css
.practice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.practice-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  background: var(--color-bg-secondary, #121212);
  border: 1px solid var(--color-border, #262626);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.practice-card:hover {
  border-color: var(--color-accent, #a855f7);
  background: var(--color-bg-tertiary, #141414);
}

.practice-icon {
  font-size: 2.5rem;
}

.practice-name {
  font-weight: 600;
  font-size: 1.125rem;
}

.practice-desc {
  font-size: 0.875rem;
  color: var(--color-text-muted, #9ca3af);
}
```

**Dimensions**: 
- Grid: Auto-fill, min 200px per column
- Card padding: 24px
- Gap: 16px
- Icon: 2.5rem (40px)
- Name: 1.125rem (18px)
- Description: 0.875rem (14px)

**Design Intent**: 
- **Responsive grid**: Auto-adjusts columns based on width
- **Card hover**: Purple border + darker background
- **Icon at top**: Visual identifier for each type
- **Name + description**: Clear labeling

**Practice types**: 
1. **Flashcards** (🗂️) — Review vocabulary with spaced repetition
2. **Reading** (📖) — Read passages and answer questions
3. **Listening** (👂) — Listen to audio and answer questions
4. **Speaking** (🗣️) — Practice pronunciation with speech recognition
5. **Conversation** (💬) — Practice dialogue with AI

---

## Due Badge

```css
.due-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}
```

**Dimensions**: 
- Padding: 4px vertical, 8px horizontal
- Border radius: 16px (pill)
- Font: 0.75rem (12px)

**Design Intent**: 
- **Red badge**: Urgent, draws attention
- **Top-right corner**: Doesn't interfere with content
- **Shows count**: "5 due" (number of items to review)
- **Spaced repetition**: Items due for review highlighted

---

## Practice Content

```css
.practice-content {
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem;
}

.practice-progress {
  margin-bottom: 2rem;
}

.practice-progress span {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-muted, #9ca3af);
  font-size: 0.875rem;
}

.progress-bar {
  height: 6px;
  background: var(--color-bg-tertiary, #141414);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-accent, #a855f7);
  transition: width 0.3s ease;
}
```

**Dimensions**: 
- Max width: 700px (centered)
- Padding: 32px
- Progress bar: 6px height
- Border radius: 3px

**Design Intent**: 
- **Progress indicator**: "Question 3 of 10"
- **Purple progress bar**: Shows completion
- **Smooth animation**: 0.3s transition on width change

---

## Question Section

```css
.question-section h3 {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-button {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-bg-secondary, #121212);
  border: 1px solid var(--color-border, #262626);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.option-button:hover:not(:disabled) {
  border-color: var(--color-accent, #a855f7);
}

.option-button.selected {
  border-color: var(--color-accent, #a855f7);
  background: rgba(168, 85, 247, 0.1);
}

.option-button.correct {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.option-button.incorrect {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}
```

**Dimensions**: 
- Question: 1.25rem (20px)
- Option padding: 16px vertical, 20px horizontal
- Gap: 12px
- Border radius: 12px

**Design Intent**: 
- **Vertical stack**: One option per row
- **Hover purple**: Indicates interactivity
- **Selected: purple**: Shows user's choice
- **Correct: green**: After answering
- **Incorrect: red**: After answering

---

## Option Letter

```css
.option-letter {
  width: 28px;
  height: 28px;
  background: var(--color-bg-tertiary, #141414);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.option-button.selected .option-letter {
  background: var(--color-accent, #a855f7);
  color: white;
}

.option-button.correct .option-letter {
  background: #10b981;
  color: white;
}

.option-button.incorrect .option-letter {
  background: #ef4444;
  color: white;
}

.option-text {
  flex: 1;
  color: var(--color-text-primary, #fff);
}
```

**Dimensions**: 
- Circle: 28×28px
- Font: 0.875rem (14px)

**Design Intent**: 
- **Circular badge**: Contains letter (A, B, C, D)
- **Color changes**: Gray → Purple (selected) → Green/Red (answered)
- **flex: 1**: Text fills remaining space

---

## Explanation

```css
.explanation {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--color-bg-secondary, #121212);
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.explanation strong {
  color: var(--color-accent, #a855f7);
}
```

**Dimensions**: 
- Padding: 16px
- Border radius: 8px
- Font: 0.9375rem (15px)
- Line height: 1.5

**Design Intent**: 
- **Appears after answering**: Explains correct answer
- **Purple emphasis**: Strong tags highlighted
- **Dark background**: Separates from question

---

## Flashcard Practice

```css
.flashcard-content {
  text-align: center;
}

.flashcard {
  background: var(--color-bg-secondary, #121212);
  border-radius: 1rem;
  padding: 2rem;
  margin: 1.5rem 0;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.flashcard-label {
  display: block;
  color: var(--color-text-muted, #9ca3af);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.flashcard-front h3,
.flashcard-back h3 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.flashcard-back {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border, #262626);
  animation: fadeIn 0.3s ease;
}

.pronunciation {
  color: var(--color-text-muted, #9ca3af);
  font-size: 1.125rem;
  margin: 0.5rem 0;
}

.example-sentence {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-bg-tertiary, #141414);
  border-radius: 0.5rem;
}

.example-sentence em {
  color: var(--color-accent, #a855f7);
}

.example-sentence .translation {
  color: var(--color-text-muted, #9ca3af);
  font-size: 0.875rem;
  margin-top: 0.5rem;
}
```

**Dimensions**: 
- Card padding: 32px
- Min height: 300px
- Front text: 2rem (32px)
- Pronunciation: 1.125rem (18px)

**Design Intent**: 
- **Large text**: Word/phrase prominently displayed
- **Front**: Shows word in target language
- **Back**: Shows translation, pronunciation, example
- **Fade-in**: Back appears with animation
- **Example sentence**: Shows word in context

**Flashcard flow**: 
1. User sees word (e.g., "Hola")
2. User thinks of meaning
3. User clicks "Show Answer"
4. Back reveals: "Hello", /ˈo.la/, "Hola, ¿cómo estás?"
5. User rates difficulty: Forgot / Hard / Easy

---

## Rating Buttons

```css
.rating-buttons p {
  margin-bottom: 1rem;
  color: var(--color-text-muted, #9ca3af);
}

.rating-options {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.rating-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.rating-btn.forgot {
  background: #ef4444;
  color: white;
}

.rating-btn.hard {
  background: #f59e0b;
  color: white;
}

.rating-btn.easy {
  background: #10b981;
  color: white;
}

.rating-btn:hover {
  transform: scale(1.05);
}
```

**Dimensions**: 
- Padding: 12px vertical, 24px horizontal
- Gap: 16px
- Border radius: 8px

**Design Intent**: 
- **Three buttons**: Forgot (red), Hard (amber), Easy (green)
- **Color-coded**: Semantic colors
- **Hover scale**: Grows 5% on hover
- **Spaced repetition**: Rating determines next review time

**Rating logic**: 
- **Forgot**: Show again in 1 minute
- **Hard**: Show again in 10 minutes
- **Easy**: Show again in 1 day

---

## Reading Practice

```css
.reading-passage {
  background: var(--color-bg-secondary, #121212);
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
}

.reading-passage h3 {
  margin-bottom: 1rem;
}

.passage-text {
  line-height: 1.8;
  font-size: 1.0625rem;
}

.reading-questions h4 {
  margin-bottom: 1rem;
}

.reading-question {
  margin-bottom: 1.5rem;
}

.reading-question input {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-bg-tertiary, #141414);
  border: 1px solid var(--color-border, #262626);
  border-radius: 0.5rem;
  color: var(--color-text-primary, #fff);
  font-size: 1rem;
}

.reading-question input:focus {
  outline: none;
  border-color: var(--color-accent, #a855f7);
}

.correct-answer {
  display: block;
  margin-top: 0.5rem;
  color: #10b981;
  font-size: 0.875rem;
}
```

**Dimensions**: 
- Passage padding: 24px
- Line height: 1.8
- Font: 1.0625rem (17px)
- Input padding: 12px

**Design Intent**: 
- **Passage in box**: Dark background, rounded corners
- **Generous line-height**: 1.8 for comfortable reading
- **Text input**: For short answer questions
- **Correct answer**: Shows after submission (green text)

---

## Conversation Practice

```css
.conversation-content {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 4rem);
}

.conversation-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: var(--color-bg-secondary, #121212);
  border-radius: 1rem;
  margin-bottom: 1rem;
}

.conversation-input {
  display: flex;
  gap: 0.5rem;
}

.conversation-input input {
  flex: 1;
  padding: 0.75rem 1rem;
  background: var(--color-bg-secondary, #121212);
  border: 1px solid var(--color-border, #262626);
  border-radius: 0.5rem;
  color: var(--color-text-primary, #fff);
  font-size: 1rem;
}

.conversation-input button {
  padding: 0.75rem 1.5rem;
  background: var(--color-accent, #a855f7);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
}
```

**Dimensions**: 
- Height: calc(100vh - 4rem) (full height minus header)
- Messages padding: 16px
- Input padding: 12px vertical, 16px horizontal

**Design Intent**: 
- **Chat-like interface**: Messages scroll, input at bottom
- **AI conversation**: Practice dialogue with AI
- **Real-time feedback**: AI responds in target language

---

## Action Buttons

```css
.btn-next,
.btn-finish,
.btn-show-answer {
  width: 100%;
  padding: 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-next,
.btn-finish {
  background: var(--color-accent, #a855f7);
  color: white;
  border: none;
}

.btn-next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-show-answer {
  background: #10b981;
  color: white;
  border: none;
}
```

**Dimensions**: 
- Width: 100%
- Padding: 16px
- Border radius: 12px

**Design Intent**: 
- **Next**: Purple, advances to next question
- **Finish**: Purple, completes practice session
- **Show Answer**: Green, reveals answer (flashcards)
- **Disabled**: Until answer selected

---

## Responsive Behavior

```css
@media (max-width: 768px) {
  .practice-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .practice-content {
    padding: 1rem;
  }
  
  .rating-options {
    flex-direction: column;
  }
}
```

**Design Intent**: 
- **2-column grid**: On mobile (instead of auto-fill)
- **Reduce padding**: More space for content
- **Stack rating buttons**: Vertical layout for easier tapping

---

## Summary

**Key Design Decisions**:

1. **5 practice types**: Flashcards, Reading, Listening, Speaking, Conversation
2. **Due badges**: Red badges show items due for review (spaced repetition)
3. **Progress bar**: Shows X/Y questions completed
4. **Colored states**: Green (correct), Red (incorrect), Purple (selected)
5. **Rating buttons**: Forgot (red), Hard (amber), Easy (green)
6. **Flashcard layout**: Large text, fade-in animation for back
7. **Reading passages**: Dark box, 1.8 line-height for comfort
8. **Conversation UI**: Chat-like interface with AI
9. **Full-width buttons**: Easy to tap on mobile

**Why this design?**: 
- **Variety**: Multiple practice types keep learning engaging
- **Spaced repetition**: Due badges encourage regular review
- **Immediate feedback**: Colors show correct/incorrect instantly
- **Motivational**: Progress bar shows advancement
- **Flexible**: Each practice type has appropriate UI

**Practice flow**: 
1. User clicks "Practice" on dashboard
2. Sees 5 practice types with due counts
3. Clicks a type (e.g., "Flashcards")
4. Sees progress bar (0/10)
5. Answers questions/reviews cards
6. Rates difficulty (flashcards) or gets feedback (questions)
7. Progress bar updates (1/10, 2/10, etc.)
8. After 10 items, returns to practice selection
9. Due badge updates (5 due → 0 due)

**Technical notes**: 
- **auto-fill grid**: Responsive columns based on width
- **fadeIn animation**: 0.3s ease for flashcard back
- **transform: scale(1.05)**: Rating button hover effect
- **calc(100vh - 4rem)**: Conversation height minus header
- **flex: 1**: Messages area grows to fill space
