# Mobile Responsive Testing Guide

**Quick reference for testing the mobile responsive implementation**

---

## 🎯 Quick Test Checklist

### 1. Typography (2 minutes)
- [ ] Open on mobile device
- [ ] Check h1 size (should be 28px on mobile, 24px on small phones)
- [ ] Check base text (should be 15px on mobile, 14px on small phones)
- [ ] Verify readability (no text too small)

### 2. Layout (3 minutes)
- [ ] No horizontal scroll on any page
- [ ] Full-width layout (no side borders)
- [ ] Content fits within viewport
- [ ] No overlapping elements

### 3. Touch Targets (3 minutes)
- [ ] All buttons ≥44px (easy to tap)
- [ ] No accidental taps
- [ ] Comfortable one-handed use
- [ ] Bottom UI elements reachable with thumb

### 4. Chat Interface (5 minutes)
- [ ] Fixed input at bottom
- [ ] Scrollable messages
- [ ] 36px avatars (not too large)
- [ ] 2-column quick actions
- [ ] Math keyboard compact (110px)

### 5. Language Learning (5 minutes)
- [ ] Horizontal scroll stages (with snap)
- [ ] Single-column modules
- [ ] 2×2 stats grid
- [ ] Lesson progress steps visible
- [ ] Practice modes in 2 columns

### 6. Interactive Components (5 minutes)
- [ ] Flashcard confidence buttons stacked
- [ ] Quiz options easy to tap
- [ ] Code blocks scrollable (no overflow)
- [ ] File prompt button full-width

### 7. Study Modes (5 minutes)
- [ ] Audio viewer: tab switcher works
- [ ] PDF viewer: toolbar at bottom
- [ ] PDF viewer: bottom sheets slide up
- [ ] Landscape: split-panes visible

### 8. Touch Interaction (3 minutes)
- [ ] No sticky hover states
- [ ] Active states on tap
- [ ] Smooth scrolling
- [ ] No lag or jank

---

## 📱 Device Testing Matrix

### Priority 1: Must Test
| Device | Screen Size | Browser | Status |
|--------|-------------|---------|--------|
| iPhone 12/13 | 390×844 | Safari | ⏳ |
| Samsung Galaxy S21 | 360×800 | Chrome | ⏳ |
| iPad Mini | 768×1024 | Safari | ⏳ |

### Priority 2: Should Test
| Device | Screen Size | Browser | Status |
|--------|-------------|---------|--------|
| iPhone SE | 375×667 | Safari | ⏳ |
| iPhone 14 Pro Max | 430×932 | Safari | ⏳ |
| Google Pixel 6 | 412×915 | Chrome | ⏳ |
| iPad Pro | 1024×1366 | Safari | ⏳ |

### Priority 3: Nice to Test
| Device | Screen Size | Browser | Status |
|--------|-------------|---------|--------|
| Samsung Galaxy A52 | 360×800 | Samsung Internet | ⏳ |
| OnePlus 9 | 412×919 | Chrome | ⏳ |
| Xiaomi Redmi Note 10 | 393×851 | Chrome | ⏳ |

---

## 🧪 Feature Testing Scenarios

### Scenario 1: Chat Conversation (5 min)
1. Open chat interface
2. Send a message
3. Scroll through messages
4. Use quick actions
5. Open math keyboard
6. Check input stays at bottom when keyboard opens

**Expected**:
- ✅ Input fixed at bottom
- ✅ Messages scroll smoothly
- ✅ Quick actions in 2 columns
- ✅ Math keyboard compact
- ✅ No layout shift with keyboard

### Scenario 2: Language Learning (5 min)
1. Open language dashboard
2. Scroll through stages horizontally
3. Tap a module
4. Complete a lesson
5. Try practice exercises

**Expected**:
- ✅ Stages scroll with snap
- ✅ Modules in single column
- ✅ Stats in 2×2 grid
- ✅ Lesson progress visible
- ✅ Practice modes in 2 columns

### Scenario 3: Flashcard Practice (3 min)
1. Open a flashcard
2. Flip the card
3. Rate confidence (Hard/Okay/Easy)
4. Check button sizes

**Expected**:
- ✅ Card flips smoothly
- ✅ Confidence buttons stacked
- ✅ Buttons full-width
- ✅ Easy to tap (44px)

### Scenario 4: Quiz (3 min)
1. Open an inline quiz
2. Tap an option
3. Check feedback
4. Complete quiz

**Expected**:
- ✅ Options easy to tap
- ✅ No hover effects
- ✅ Active state on tap
- ✅ Feedback visible

### Scenario 5: Audio Study (5 min)
1. Open audio lecture viewer
2. Switch between Notes/Chat tabs
3. Play audio
4. Add a note
5. Rotate to landscape

**Expected**:
- ✅ Tab switcher works
- ✅ One panel visible at a time
- ✅ Audio controls accessible
- ✅ Landscape shows both panels

### Scenario 6: PDF Study (5 min)
1. Open PDF viewer
2. Navigate pages (toolbar at bottom)
3. Highlight text
4. Open color picker
5. Open bookmarks (bottom sheet)

**Expected**:
- ✅ Toolbar at bottom
- ✅ Easy to reach with thumb
- ✅ Color swatches large (36px)
- ✅ Bottom sheet slides up
- ✅ Handle bar visible

---

## 🔍 Common Issues to Check

### Typography Issues
- ❌ Text too small (< 14px)
- ❌ Headings too large (overflow)
- ❌ Line height too tight
- ❌ Letter spacing off

### Layout Issues
- ❌ Horizontal scroll
- ❌ Content overflow
- ❌ Overlapping elements
- ❌ Side borders visible

### Touch Issues
- ❌ Buttons too small (< 44px)
- ❌ Accidental taps
- ❌ Sticky hover states
- ❌ No tap feedback

### Interaction Issues
- ❌ Keyboard covers input
- ❌ Scroll not smooth
- ❌ Animations janky
- ❌ Lag on tap

---

## 🛠️ Testing Tools

### Browser DevTools
```
Chrome DevTools:
1. F12 → Toggle device toolbar
2. Select device (iPhone 12 Pro)
3. Test responsive behavior

Firefox DevTools:
1. F12 → Responsive Design Mode
2. Select device preset
3. Test touch simulation

Safari Web Inspector:
1. Develop → Enter Responsive Design Mode
2. Select iOS device
3. Test on iOS Simulator
```

### Real Device Testing
```
iOS (Safari):
1. Connect iPhone via USB
2. Safari → Develop → [Your iPhone]
3. Inspect and debug

Android (Chrome):
1. Enable USB debugging
2. chrome://inspect
3. Inspect and debug
```

### Online Testing
```
BrowserStack:
- Real device testing
- Multiple browsers
- Screenshot comparison

LambdaTest:
- Live testing
- Automated testing
- Responsive testing
```

---

## 📊 Test Results Template

### Device: [Device Name]
**Date**: [Date]  
**Tester**: [Name]  
**Browser**: [Browser + Version]

#### Typography
- [ ] Font sizes correct
- [ ] Headings readable
- [ ] No text overflow

#### Layout
- [ ] No horizontal scroll
- [ ] Full-width layout
- [ ] No overlapping

#### Touch Targets
- [ ] All buttons ≥44px
- [ ] Easy to tap
- [ ] No accidental taps

#### Features
- [ ] Chat interface works
- [ ] Language learning works
- [ ] Flashcards work
- [ ] Quizzes work
- [ ] Audio viewer works
- [ ] PDF viewer works

#### Issues Found
1. [Issue description]
2. [Issue description]
3. [Issue description]

#### Screenshots
- [Attach screenshots of issues]

---

## 🚀 Quick Fixes

### Issue: Horizontal scroll
**Fix**: Check for elements with fixed width > viewport
```css
* {
  max-width: 100%;
}
```

### Issue: Text too small
**Fix**: Increase base font size
```css
@media (max-width: 767px) {
  :root {
    font-size: 15px; /* or 16px */
  }
}
```

### Issue: Buttons too small
**Fix**: Add minimum touch target
```css
button {
  min-height: 44px;
  min-width: 44px;
}
```

### Issue: Keyboard covers input
**Fix**: Use viewport height units
```css
.chat-messages {
  height: calc(var(--vh, 1vh) * 100 - 120px);
}
```

### Issue: Sticky hover
**Fix**: Disable hover on touch devices
```css
@media (hover: none) {
  .button:hover {
    transform: none;
  }
}
```

---

## 📝 Reporting Issues

### Issue Template
```markdown
**Device**: iPhone 12 Pro
**Browser**: Safari 15.0
**Screen Size**: 390×844
**Orientation**: Portrait

**Issue**: [Brief description]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected**: [What should happen]
**Actual**: [What actually happens]

**Screenshot**: [Attach screenshot]

**Priority**: High / Medium / Low
```

---

## ✅ Sign-off Checklist

Before marking mobile responsive as complete:

- [ ] All Priority 1 devices tested
- [ ] All 8 feature scenarios passed
- [ ] No critical issues found
- [ ] Typography readable on all devices
- [ ] No horizontal scroll on any page
- [ ] All touch targets ≥44px
- [ ] Smooth scrolling on all pages
- [ ] Keyboard behavior correct
- [ ] Landscape orientation works
- [ ] Safe area insets working (notched devices)
- [ ] Cross-browser testing complete
- [ ] Accessibility audit passed
- [ ] Performance acceptable (<3s load)
- [ ] User testing feedback positive

---

**Last Updated**: May 14, 2026  
**Status**: Ready for testing  
**Estimated Testing Time**: 2-3 hours for complete test
