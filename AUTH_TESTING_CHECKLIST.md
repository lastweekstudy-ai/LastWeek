# Auth Page Testing Checklist

## Pre-Testing Setup
- [ ] Access admin panel at `/admin/settings`
- [ ] Note current settings for `preRegActive` and `dailyFreeSlotsActive`
- [ ] Have test user credentials ready (existing account)
- [ ] Have fresh email addresses for new signups

---

## Test Suite 1: Pre-Registration Only

### Setup
- [ ] Set `preRegActive = true`
- [ ] Set `dailyFreeSlotsActive = false`
- [ ] Refresh the page to apply settings

### Tests
- [ ] Navigate to `/auth`
- [ ] Verify blocking screen shows "Pre-Registration Open" title
- [ ] Verify ONLY "Pay $5 Now" option is displayed
- [ ] Verify "Free Testing Slot" option is NOT displayed
- [ ] Click "Pre-Register Now" button → Should redirect to `/pre-register`
- [ ] Go back to `/auth`
- [ ] Click "Sign in" link → Should show login form
- [ ] Enter existing credentials → Should login successfully

**Expected Result**: ✅ Only pre-reg path available, login works

---

## Test Suite 2: Free Slots Only

### Setup
- [ ] Set `preRegActive = false`
- [ ] Set `dailyFreeSlotsActive = true`
- [ ] Refresh the page to apply settings

### Tests
- [ ] Navigate to `/auth`
- [ ] Verify blocking screen shows "Free Testing Available" title
- [ ] Verify ONLY "Free Testing Slot" option is displayed
- [ ] Verify "Pay $5 Now" option is NOT displayed
- [ ] Verify remaining slots count shows (e.g., "8 of 10")
- [ ] Verify countdown timer is visible
- [ ] Click "Claim Free Slot" button → Should show free slot signup form
- [ ] Fill signup form → Should create account with testing limits
- [ ] Logout
- [ ] Go to `/auth` again
- [ ] Click "Sign in" → Should login successfully

**Expected Result**: ✅ Only free slot path available, login works

---

## Test Suite 3: Both Active

### Setup
- [ ] Set `preRegActive = true`
- [ ] Set `dailyFreeSlotsActive = true`
- [ ] Refresh the page to apply settings

### Tests
- [ ] Navigate to `/auth`
- [ ] Verify blocking screen shows "Two Ways to Join" title
- [ ] Verify "Pay $5 Now" option is displayed
- [ ] Verify "Free Testing Slot" option is displayed
- [ ] Verify proper spacing between options
- [ ] Click "Pre-Register Now" → Should redirect to `/pre-register`
- [ ] Go back to `/auth`
- [ ] Click "Claim Free Slot" → Should show free slot signup form
- [ ] Go back to blocking screen
- [ ] Click "Sign in" → Should show login form
- [ ] Enter credentials → Should login successfully

**Expected Result**: ✅ Both paths available, user can choose

---

## Test Suite 4: Both Inactive (Normal Signup)

### Setup
- [ ] Set `preRegActive = false`
- [ ] Set `dailyFreeSlotsActive = false`
- [ ] Refresh the page to apply settings

### Tests
- [ ] Navigate to `/auth`
- [ ] Verify NO blocking screen is shown
- [ ] Verify normal signup form is displayed
- [ ] Verify all signup fields are present:
  - [ ] Full Name
  - [ ] Date of Birth
  - [ ] Email
  - [ ] Password
  - [ ] Confirm Password
  - [ ] Terms of Service checkbox
  - [ ] Privacy Policy checkbox
  - [ ] Data Collection checkbox
- [ ] Verify "Create Account" button is visible
- [ ] Fill out form with valid data
- [ ] Submit form → Should create free account
- [ ] Should redirect to `/dashboard`
- [ ] Logout
- [ ] Go to `/auth`
- [ ] Toggle to login mode
- [ ] Login with new account → Should work

**Expected Result**: ✅ Normal free signup available, no restrictions

---

## Test Suite 5: Guest Mode Disabled

### Tests
- [ ] Navigate to `/auth` (any settings combination)
- [ ] Verify NO "Continue as Guest" button exists
- [ ] Verify NO "or" divider for guest mode
- [ ] Verify no guest-related UI elements anywhere
- [ ] Try navigating to `/auth?guest=true` directly
- [ ] Verify no guest login occurs
- [ ] Verify only normal auth UI is shown

**Expected Result**: ✅ Guest mode completely hidden

---

## Test Suite 6: Login Always Available

### Tests
- [ ] For each setting combination (4 total):
  1. Pre-reg only
  2. Free slots only
  3. Both active
  4. Both inactive

- [ ] Navigate to `/auth`
- [ ] If blocking screen: Click "Sign in" link
- [ ] If normal form: Toggle to login mode
- [ ] Enter existing user credentials
- [ ] Submit login form
- [ ] Verify successful login
- [ ] Verify redirect to `/dashboard`

**Expected Result**: ✅ Login works in ALL scenarios

---

## Test Suite 7: Mobile Responsiveness

### Tests (on mobile viewport or DevTools mobile emulation)
- [ ] Navigate to `/auth` with blocking screen active
- [ ] Verify blocking screen is readable
- [ ] Verify buttons are tappable
- [ ] Verify text is not cut off
- [ ] Verify countdown timer displays correctly
- [ ] Navigate to normal signup form
- [ ] Verify all fields are accessible
- [ ] Verify checkboxes are tappable
- [ ] Verify submit button works
- [ ] Test login form on mobile
- [ ] Verify password show/hide toggle works

**Expected Result**: ✅ All UI elements work on mobile

---

## Test Suite 8: Edge Cases

### No Slots Remaining
- [ ] Set `dailyFreeSlotsActive = true`
- [ ] Admin panel: Manually set used slots = total slots
- [ ] Navigate to `/auth`
- [ ] Verify "All slots taken today" message
- [ ] Verify countdown shows "Check back tomorrow"
- [ ] Verify "Claim Free Slot" button is NOT shown

### Invalid Signup Data
- [ ] Try signup with password < 8 characters → Should show error
- [ ] Try signup without agreeing to terms → Should show error
- [ ] Try signup with mismatched passwords → Should show error
- [ ] Try signup with age < 13 → Should show error
- [ ] Try signup with invalid email format → Should show error

### Existing User Re-signup
- [ ] Try to claim free slot with existing user email → Should block
- [ ] Error message should indicate email already used

**Expected Result**: ✅ All validations work correctly

---

## Test Suite 9: Navigation Flow

### From Landing Page
- [ ] Start on landing page `/`
- [ ] Click "Get Started" button
- [ ] Should redirect to `/auth`
- [ ] Verify correct screen shows based on settings

### Direct URL Access
- [ ] Navigate to `/auth` directly
- [ ] Verify correct screen loads
- [ ] Navigate to `/auth?freeSlot=true` directly
- [ ] Verify free slot flow triggers (if active)

### Back Button Behavior
- [ ] Go through blocking screen → free slot flow
- [ ] Click browser back button
- [ ] Verify returns to blocking screen correctly
- [ ] Go through blocking screen → pre-reg
- [ ] Click browser back button
- [ ] Verify returns correctly

**Expected Result**: ✅ Navigation flows work smoothly

---

## Final Verification

- [ ] All 9 test suites passed
- [ ] No console errors in browser DevTools
- [ ] No 404 or network errors
- [ ] Admin settings update in real-time (after refresh)
- [ ] Database records created correctly for new users
- [ ] Daily slots counter increments correctly
- [ ] Pre-reg records created correctly
- [ ] Email validation works
- [ ] Age validation works (13+ requirement)
- [ ] Password requirements enforced (8+ chars)

---

## Deployment Checklist

Before deploying to production:
- [ ] All local tests passed
- [ ] Build successful (`npm run build`)
- [ ] No TypeScript/linting errors
- [ ] Staging environment tested
- [ ] Admin settings verified in production
- [ ] Monitor user feedback after deployment
- [ ] Check analytics for signup conversion rates
- [ ] Monitor error logs for auth-related issues

---

## Rollback Plan

If issues occur in production:
1. **Quick Fix**: Disable both `preRegActive` and `dailyFreeSlotsActive` via admin panel
   - This will restore normal free signup immediately
2. **Code Rollback**: Revert to previous Git commit
   - Run: `git revert HEAD` or `git reset --hard <previous-commit>`
3. **Monitor**: Check error logs and user reports
4. **Fix & Redeploy**: Fix issue locally, test, and redeploy

---

## Notes
- Test with BOTH anonymous (incognito) and logged-in sessions
- Clear browser cache between tests if needed
- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on both desktop and mobile devices
- Verify email notifications work (if implemented)
- Check database records after each signup type
