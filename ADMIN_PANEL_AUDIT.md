# LastWeek Admin Panel Audit

Audit date: 2026-06-19  
Scope: Current React admin UI, admin Appwrite service usage, and backup manifest coverage.  
No live Appwrite data was modified.

## Current Admin Surface

Active admin routes are mounted under `/admin` in `src/App.jsx` and protected by the Appwrite user label `admin`.

Current pages:

- `/admin` - Dashboard
- `/admin/testing-users` - Testing/free-slot usage list
- `/admin/pre-reg` - Pre-registration and promo usage list
- `/admin/daily-slots` - Daily free slot controls/history
- `/admin/reviews` - Review moderation
- `/admin/settings` - Launch/payment/plan settings

There is also an older `src/pages/AdminPanel.jsx` that is not routed. It duplicates older admin behavior and should be retired or clearly marked as legacy.

## What Works Today

- Admin route guard exists through `user.labels.includes('admin')`.
- Admin settings can be loaded and updated from the `admin_settings` singleton document.
- Admin can toggle:
  - pre-registration mode
  - payment availability
  - daily free slots
  - plan availability for Free, Pro, Plus, Pro+
- Admin can edit:
  - Paddle pre-registration price ID
  - daily free slot count
- Admin dashboard shows basic launch metrics:
  - pre-registration counts
  - promo code usage
  - bonus months owed
  - review counts
  - daily slot remaining count
- Pre-registration page can list records, filter by status/type, search loaded emails locally, and export visible records to CSV.
- Daily slots page can show today’s slot state and last 30 days of slot history.
- Reviews page can approve, unapprove, publish, unpublish, and delete reviews.
- Testing users page lists recent testing usage documents.
- Backup manifest confirms the Appwrite project is reachable and contains:
  - 34 database collections/tables
  - 86 users
  - 1 storage bucket
  - 30 storage files

## Main Gaps

The current admin panel controls the launch/testing layer, but it does not control the full product.

The project has collections for sessions, messages, flashcards, user profiles, attachments, PDF resources, PDF notes, highlights, study schedules, session context, exam plans, audio lectures, language learning, TTS, subscriptions, usage tracking, reviews, daily slots, and transcription jobs. Most of these are not visible or manageable in admin.

Missing core admin modules:

- User management: search users, view profile, plan, limits, activity, sessions, resources, flags, and support notes.
- Subscription and billing control: grant/revoke plans safely, view Paddle metadata, handle failed payments, issue credits.
- Session and chat moderation: inspect sessions/messages, hide/report content, debug slow sessions, view AI artifacts.
- Resource moderation: manage PDFs, audio lectures, public resources, storage files, imports, and processing status.
- AI operations: model/provider settings, prompt versions, function executions, failures, latency, cost, and fallback status.
- Curriculum CMS: countries, curricula, classes, subjects, topics, versions, imports, and active/deprecated datasets.
- Exam planner admin: inspect plans, generated schedules, progress, and failed generation flows.
- Language learning admin: roadmaps, lessons, attempts, points, SRS state, and conversation sessions.
- System health: Appwrite collection health, index status, storage usage, function execution logs, and backup status.
- Audit logs: who changed what, when, before/after values, and whether actions succeeded.

## Risky Current Behaviors

- Admin protection is UI-based. The route guard is useful, but real safety depends on Appwrite permissions. Every admin write must be permission-checked server-side or by strict collection permissions.
- Several privileged actions run from the browser Appwrite client:
  - updating admin settings
  - deleting reviews
  - deleting duplicate daily slot documents
  - converting all pre-registrations to Plus
- Bulk conversion of all pre-registrations is exposed in the dashboard with only browser `confirm()` prompts. This should move to a server-side Appwrite Function with dry-run preview, audit log, and per-user result export.
- `cleanupDuplicateDailySlots()` deletes documents. It should be an admin function with a dry-run mode, not a direct browser action.
- `Settings.jsx` writes daily slot count on every input change. This can accidentally write partial values and should become a local input plus explicit Save button.
- Admin list pages use fixed limits:
  - pre-registrations: `limit(100)`
  - reviews: `limit(100)`
  - testing users: `limit(100)`
  - promo code usage stats: `limit(1000)`
  These pages will silently miss records once data grows.
- Some admin stats are calculated by loading documents and counting in the browser. This is acceptable for tiny datasets, but not for production-scale usage.
- Several functions log internal database/collection IDs and full errors to the browser console. That is noisy and can expose implementation details.
- Daily slot date logic uses a fixed UTC-5 offset for US Eastern time, so daylight saving time can be wrong.
- `claimDailySlot()` is not atomic. Two users can claim the same remaining slot during concurrent requests.
- `createReview()` defaults `isPublished: true` while `isApproved: false`. Public display filters approved reviews, but the status model is confusing.
- CSV export does not escape commas, quotes, or new lines, so exported data can break.
- Emoji/icon text appears mojibaked in several files, which can surface as broken symbols depending on encoding/build path.

## Performance/Admin Scale Issues

- No cursor pagination on admin tables.
- No server-side search for users, pre-reg emails, reviews, or testing users.
- No `Query.select()` on admin list views, so list pages may fetch unnecessary fields as data grows.
- Dashboard calls multiple list endpoints and calculates counts client-side.
- Promo usage loads up to 1000 records just for stats and recent usage.
- Admin pages use large inline styles and duplicated components, making redesign and consistency harder.

## Index Observations

Based on the backup, the currently used admin query fields mostly have indexes:

- `pre_registrations`: `userId`, `email`, `promoCode`, `status`
- `promo_code_usage`: `promoCode`, `referrerId`, `newUserId`
- `user_reviews`: `userId`, `isApproved`, `isPublished`
- `daily_free_slots`: unique `date`
- `daily_slot_usage`: `userId`, `email`, `date`
- `testing_usage`: `userId`, `email`
- `subscriptions`: `userId`

Likely index improvement before scale:

- `pre_registrations`: composite or sort-supporting indexes for `status + createdAt`, `type + createdAt`, and possibly `status + type + createdAt`.
- `user_reviews`: `isApproved + createdAt`, `isPublished + createdAt`, and possibly `isApproved + isPublished + createdAt`.
- `testing_usage`: `createdAt` if the admin table continues ordering by it.
- `promo_code_usage`: `createdAt` if recent usage is shown with server-side ordering.

Do not create these blindly. Add them only after checking the exact Appwrite index capabilities and confirming current query errors/performance.

## Recommended Admin Architecture

For full project control, admin should be split into:

- Admin UI: React pages/components only.
- Admin client read layer: safe list/detail reads with pagination and `Query.select()`.
- Admin action layer: Appwrite Functions using server key for privileged mutations.
- Audit log collection: every admin action writes an immutable event.
- Role model: owner, admin, support, moderator, billing, curriculum editor.
- Confirmation model: destructive and billing actions require typed confirmation, preview, and audit trail.

## Priority Roadmap

1. Stabilize current admin panel.
   - Remove or archive unused `src/pages/AdminPanel.jsx`.
   - Add shared admin components for cards, tables, tabs, toggles, empty states, and danger actions.
   - Add real pagination to all admin lists.
   - Replace direct daily slot count writes with explicit Save.
   - Fix mojibake icons.

2. Add audit logging and move privileged writes behind server functions.
   - Settings updates.
   - Review deletion.
   - Daily slot cleanup.
   - Pre-registration completion/granting Plus.
   - Manual subscription changes.

3. Build user management.
   - Search by email/name/user ID.
   - View user profile, prefs, subscription, testing limits, usage tracking, sessions, files, resources, exam plans, language learning records.
   - Admin notes and support flags.

4. Build content/resource operations.
   - PDF/audio/resource list and detail pages.
   - Public resource moderation.
   - Storage file metadata.
   - Processing status/errors.

5. Build AI operations.
   - Function execution status/logs.
   - Model/provider configuration.
   - Prompt version registry.
   - Failed AI requests and latency dashboard.
   - Cost/usage estimates by user and feature.

6. Build curriculum and guided-learning admin.
   - Curriculum import/versioning.
   - Country/curriculum/class/subject/topic editor.
   - Exam planner template controls.
   - Language support matrix.

7. Build system health.
   - Database/table stats.
   - Index status.
   - Storage bucket usage.
   - Backup status.
   - Recent errors.

## Bottom Line

The current admin panel is a useful launch-control panel, not a full product admin console. It can manage testing slots, pre-registration, reviews, and a few settings, but it cannot yet control users, content, resources, AI behavior, curriculum data, subscriptions, or operational health in a production-safe way.

The next safest implementation step is to harden the existing admin pages with pagination, shared components, and audit logging, then move high-risk writes into Appwrite Functions before adding broader admin powers.
