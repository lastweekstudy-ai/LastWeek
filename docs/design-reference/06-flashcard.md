# Flashcard Design (Flashcard.css)

**File**: `src/styles/Flashcard.css`

**Purpose**: 3D flip animation for flashcards used in vocabulary learning. Two versions: inline (in chat) and standalone.

---

## Layout Structure

```
.inline-flashcard-wrapper
  └─ .inline-flashcard-container (max-width: 680px)
      └─ .inline-flashcard-scene (perspective: 1200px)
          └─ .inline-flashcard-card (transform-style: preserve-3d)
              ├─ .inline-flashcard-face.front (backface-visibility: hidden)
              │   ├─ .inline-flashcard-label "QUESTION"
              │   ├─ .inline-flashcard-body (question text)
              │   └─ .inline-flashcard-hint "Click to reveal"
              └─ .inline-flashcard-face.back (transform: rotateY(180deg))
                  ├─ .inline-flashcard-label "ANSWER"
                  └─ .inline-flashcard-body (answer text)
```

**Design Intent**: 
- **3D flip animation**: Card rotates 180° on Y-axis when clicked
- **Two faces**: Front (question) and back (answer)
- **Inline rendering**: Appears inside chat messages
- **Confidence rating**: After flip, user rates how well they knew the answer

---

## 3D Flip Mechanics

### Perspective Container

```css
.inline-flashcard-scene {
  width: 100%;
  perspective: 1200px;
  cursor: pointer;
}
```

**Dimensions**: 
- Width: 100% of parent
- Perspective: 1200px (depth of 3D space)

**Design Intent**: 
- **perspective: 1200px**: Creates 3D depth for flip animation
- **cursor: pointer**: Indicates clickability
- **Width: 100%**: Responsive to container width

**Why 1200px perspective?**: 
- Too low (e.g., 500px): Flip looks too dramatic, distorted
- Too high (e.g., 3000px): Flip looks flat, not 3D enough
- 1200px: Sweet spot for realistic 3D effect

### Card Container

```css
.inline-flashcard-card {
  position: relative;
  width: 100%;
  min-height: 160px;
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1);
}

.inline-flashcard-card.flipped {
  transform: rotateY(180deg);
}
```

**Dimensions**: 
- Width: 100%
- Min height: 160px (grows with content)
- Transition: 0.55s with custom easing

**Design Intent**: 
- **transform-style: preserve-3d**: Enables 3D transformations on children
- **rotateY(180deg)**: Flips card on Y-axis (horizontal flip)
- **0.55s duration**: Smooth but not too slow
- **cubic-bezier(0.4, 0.2, 0.2, 1)**: Custom easing (ease-in-out with slight acceleration)

**Why rotateY (not rotateX)?**: 
- rotateY: Horizontal flip (like a book page)
- rotateX: Vertical flip (like a calendar page)
- Horizontal feels more natural for flashcards

### Card Faces

```css
.inline-flashcard-face {
  position: absolute;
  width: 100%;
  min-height: 160px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Front face */
.inline-flashcard-face.front {
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-accent);
}

/* Back face — rotated 180deg so it shows when card is flipped */
.inline-flashcard-face.back {
  background: var(--color-bg-tertiary);
  border: 2px solid var(--color-border);
  transform: rotateY(180deg);
}
```

**Dimensions**: 
- Width: 100%
- Min height: 160px
- Padding: 20px vertical, 24px horizontal
- Border radius: 12px
- Border: 2px

**Design Intent**: 
- **position: absolute**: Both faces occupy same space
- **backface-visibility: hidden**: Hides back of face when rotated away
- **Front: purple border**: Accent color draws attention
- **Back: gray border**: Neutral, less prominent
- **Back: transform: rotateY(180deg)**: Pre-rotated so it shows when card flips

**Why backface-visibility: hidden?**: 
- Without it, you'd see the back of the front face (mirrored text) during flip
- With it, each face only shows when facing forward

---

## Card Content

### Label

```css
.inline-flashcard-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-accent);
  margin-bottom: 0.25rem;
}

.inline-flashcard-face.back .inline-flashcard-label {
  color: var(--color-text-muted);
}
```

**Dimensions**: 
- Font size: 0.7rem (11.2px)
- Letter spacing: 0.08em

**Design Intent**: 
- **"QUESTION" / "ANSWER"**: Labels the card face
- **Uppercase + letter-spacing**: Looks like a badge or tag
- **Front: purple**: Matches border
- **Back: muted gray**: Less prominent

### Body

```css
.inline-flashcard-body {
  flex: 1;
  color: var(--color-text-primary);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.inline-flashcard-body .enhanced-message {
  margin: 0;
}

.inline-flashcard-body p {
  margin: 0 0 0.5rem;
}

.inline-flashcard-body p:last-child {
  margin-bottom: 0;
}
```

**Dimensions**: 
- Font size: 0.9375rem (15px)
- Line height: 1.6

**Design Intent**: 
- **flex: 1**: Grows to fill available space
- **Supports markdown**: Can render formatted text, code, lists
- **Tight spacing**: Minimal margins for compact display

### Hint

```css
.inline-flashcard-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: center;
  font-style: italic;
  margin-top: 0.5rem;
}
```

**Dimensions**: 
- Font size: 0.75rem (12px)

**Design Intent**: 
- **"Click to reveal"**: Appears on front face
- **Italic + muted**: Subtle instruction
- **Center-aligned**: Balanced at bottom of card

---

## Confidence Rating

```css
.inline-flashcard-confidence {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  animation: fadeIn 0.3s ease;
}

.inline-confidence-buttons {
  display: flex;
  gap: 0.625rem;
  justify-content: center;
  flex-wrap: wrap;
}

.inline-confidence-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  border: none;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.inline-confidence-btn:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

.inline-confidence-btn.hard {
  background: var(--color-error, #ef4444);
  color: #fff;
}

.inline-confidence-btn.okay {
  background: var(--color-warning, #f59e0b);
  color: #fff;
}

.inline-confidence-btn.easy {
  background: var(--color-success, #10b981);
  color: #fff;
}
```

**Dimensions**: 
- Button padding: 8px vertical, 20px horizontal
- Gap: 10px
- Border radius: 8px

**Design Intent**: 
- **Appears after flip**: Fades in with animation
- **Three buttons**: Hard (red), Okay (amber), Easy (green)
- **Color-coded**: Matches semantic meaning
- **Hover lift**: 2px up on hover
- **Flex-wrap**: Wraps to multiple rows on narrow screens

**Why three options?**: 
- **Hard**: "I didn't know this" → Show again soon
- **Okay**: "I knew it but struggled" → Show again in a few days
- **Easy**: "I knew it instantly" → Show again in a week+

This implements **spaced repetition** — cards you struggle with appear more frequently.

---

## Animation

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Design Intent**: 
- **Fade + slide up**: Confidence buttons appear smoothly
- **6px slide**: Subtle motion, not jarring
- **0.3s duration**: Quick but noticeable

---

## Legacy Standalone Flashcard

```css
.flashcard-container {
  max-width: 400px;
  margin: 0 auto var(--spacing-lg);
}

.flashcard {
  position: relative;
  width: 100%;
  height: 200px;
  cursor: pointer;
  perspective: 1000px;
}

.flashcard-front,
.flashcard-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  transition: transform 0.6s ease;
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.flashcard-front {
  background-color: var(--color-bg-secondary);
  transform: rotateY(0deg);
}

.flashcard-back {
  background-color: var(--color-bg-tertiary);
  transform: rotateY(180deg);
}

.flashcard.flipped .flashcard-front {
  transform: rotateY(-180deg);
}

.flashcard.flipped .flashcard-back {
  transform: rotateY(0deg);
}
```

**Dimensions**: 
- Max width: 400px
- Fixed height: 200px

**Design Intent**: 
- **Fixed height**: Ensures consistent card size
- **Centered**: max-width + margin auto
- **Slower flip**: 0.6s (vs 0.55s for inline)

**Difference from inline**: 
- **Fixed height** (inline uses min-height)
- **Centered container** (inline is full-width)
- **Standalone page** (inline is embedded in chat)

---

## Responsive Behavior

```css
@media (max-width: 768px) {
  .flashcard-container {
    max-width: 100%;
  }

  .inline-confidence-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .confidence-buttons {
    flex-direction: column;
  }

  .confidence-btn {
    min-width: auto;
  }
}
```

**Design Intent**: 
- **Full-width cards**: No max-width constraint on mobile
- **Stacked buttons**: Vertical layout for easier tapping
- **Full-width buttons**: Easier to tap on small screens

---

## Summary

**Key Design Decisions**:

1. **3D flip animation**: Uses CSS 3D transforms (perspective, rotateY, preserve-3d)
2. **Two faces**: Front (question) and back (answer), both absolutely positioned
3. **backface-visibility: hidden**: Prevents seeing mirrored text during flip
4. **Purple border on front**: Draws attention to active card
5. **Confidence rating**: Three color-coded buttons (red, amber, green)
6. **Fade-in animation**: Confidence buttons appear smoothly after flip
7. **Responsive**: Stacks buttons vertically on mobile

**Why 3D flip?**: 
- **Engaging**: More interesting than fade or slide
- **Familiar**: Mimics physical flashcards
- **Clear state**: Front vs back is obvious
- **Smooth**: 0.55s with custom easing feels natural

**Technical notes**: 
- **perspective** on parent creates 3D space
- **transform-style: preserve-3d** on card enables 3D children
- **backface-visibility: hidden** prevents seeing back of faces
- **transform: rotateY(180deg)** on back face pre-rotates it
- **transform: rotateY(180deg)** on card.flipped shows back face
