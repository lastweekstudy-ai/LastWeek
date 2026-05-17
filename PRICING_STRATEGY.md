# LastWeek — Pricing Strategy & Monetisation Plan

### A complete guide to free tier limits, paid plans, what users get at each level, and how to grow revenue without burning through the AI budget.

---

## The Core Challenge

LastWeek is an AI-heavy product. Every message a user sends costs us real money — roughly **$0.003 per message** in AI tokens. A free user who chats for an hour can cost us $0.50 before they've paid a cent.

The pricing strategy has one job: **let free users experience enough value to convert, without letting them consume unlimited resources at our expense.**

---

## Feature Inventory — Everything the App Can Do

Before designing tiers, here's every feature mapped to its cost impact:

| Feature | What it does | Cost to us | Cost driver |
|---|---|---|---|
| AI Chat (5 study modes) | Tutor conversation in Mental Model, Active Recall, Focus Breakdown, Collaborative Scholar, Creative Synthesis | 🔴 High | ~$0.003/message (tokens) |
| Exam Planner + Sessions | Create exam plan, AI coaches through each topic | 🔴 High | ~$0.003/message |
| Language Learning | Structured lessons, practice, conversation | 🔴 High | ~$0.003/message |
| Flashcard Generation | AI creates flashcards from conversation | 🟡 Medium | Included in chat cost |
| MCQ Generation | AI creates quiz questions | 🟡 Medium | Included in chat cost |
| Text-to-Speech (TTS) | AI reads responses aloud | 🟡 Medium | ~$0.00025/request |
| Audio Lecture Processing | Upload audio → AI generates notes + transcript | 🔴 High | Large AI call per upload |
| PDF Upload + AI Q&A | Upload PDF, ask questions about it | 🟡 Medium | Storage + AI calls |
| Flashcard Library | Save, organise, review flashcards | 🟢 Low | Database only |
| Spaced Repetition Reviews | Review due flashcards | 🟢 Low | Database only |
| Flashcard Collections | Organise cards into folders | 🟢 Low | Database only |
| Charts & Diagrams | Visual charts, Mermaid diagrams, SVG figures | 🟢 Low | Included in AI response |
| Session History | Access past study sessions | 🟢 Low | Database only |
| Student Assessment | Personalised learning profile | 🟢 Low | One-time AI call |
| YouTube Study | Process YouTube video into study notes | 🔴 High | Large AI call per video |

---

## Recommended Tier Structure

Three tiers: **Free**, **Pro** ($9.99/month), **Max** ($19.99/month).
Plus annual and quarterly discounts, and a B2B school plan.

---

## 🆓 Free Tier — "Try Before You Buy"

**Goal:** Let users experience the magic of the AI tutor without giving away unlimited usage. The free tier should be generous enough to feel real, but limited enough that serious students hit the wall within a week.

### Daily Limits (resets at midnight)

| Feature | Free daily limit | Why this limit |
|---|---|---|
| AI chat messages | **20 messages/day** | Covers a 30-minute study session. Enough to feel the product, not enough for serious study. |
| Text-to-speech | **5 TTS plays/day** | Lets them hear the feature, doesn't drain TTS budget |
| Flashcard saves | **10 flashcards/day** | Enough to see the library fill up |
| MCQ attempts | **Unlimited** | MCQs are generated within chat messages — already limited by message cap |

### Monthly / Total Limits

| Feature | Free limit | Notes |
|---|---|---|
| Study sessions | **5 active sessions** | Can't create more until they delete old ones |
| PDF uploads | **2 PDFs total** | Max 5MB each |
| Audio lecture uploads | **1 audio file total** | The most expensive feature — strictly limited |
| YouTube study | **2 videos total** | Expensive AI processing |
| Flashcard library | **50 cards total** | Enough to see the value, not enough for a full course |
| Flashcard collections | **2 collections** | Basic organisation only |
| Exam plans | **1 active plan** | Can experience the feature, can't run multiple exams |
| Language learning | **Module 1 only** | First module free, rest locked |
| Session history | **Last 7 days** | Older sessions not accessible |
| File storage | **50MB total** | Covers 2 PDFs + 1 audio |

### What Free Users Can Do Fully (no limits)
- ✅ All 5 study modes (within message limit)
- ✅ Student assessment (personalised learning profile)
- ✅ Spaced repetition reviews (for cards they already have)
- ✅ Charts, diagrams, math rendering in responses
- ✅ Session history for last 7 days
- ✅ Mobile app (same limits)

### What Free Users Cannot Do
- ❌ More than 20 messages/day
- ❌ More than 5 active sessions
- ❌ More than 2 PDFs or 1 audio lecture
- ❌ More than 50 flashcards
- ❌ Language learning beyond Module 1
- ❌ Multiple exam plans
- ❌ Priority AI (free users get Groq/Gemini, not DeepSeek)

> **Free tier cost to us:** ~$0.06/day per active free user (20 messages × $0.003). A free user who uses it every day costs us ~$1.80/month. We need ~18% of free users to convert to Pro to break even on free tier costs.

---

## ⭐ Pro Plan — "Serious Student"

**Price:**
- Monthly: **$9.99/month**
- Quarterly: **$26.99/quarter** ($8.99/month — 10% off)
- Annual: **$89.99/year** ($7.50/month — 25% off)

**Goal:** Cover the needs of a student preparing for one or two exams, learning a language, or using the app as their primary study tool.

### Daily Limits

| Feature | Pro daily limit | vs Free |
|---|---|---|
| AI chat messages | **100 messages/day** | 5× more |
| Text-to-speech | **50 TTS plays/day** | 10× more |
| Flashcard saves | **Unlimited** | Unlimited |
| Audio lecture uploads | **3/day** | Was 1 total on free |

### Monthly / Total Limits

| Feature | Pro limit | vs Free |
|---|---|---|
| Active sessions | **Unlimited** | Was 5 |
| PDF uploads | **20 PDFs/month** | Was 2 total |
| Audio lecture uploads | **15/month** | Was 1 total |
| YouTube study | **20 videos/month** | Was 2 total |
| Flashcard library | **2,000 cards** | Was 50 |
| Flashcard collections | **Unlimited** | Was 2 |
| Exam plans | **5 active plans** | Was 1 |
| Language learning | **All modules** | Was Module 1 only |
| Session history | **Unlimited** | Was 7 days |
| File storage | **2GB** | Was 50MB |

### Pro Exclusive Features
- ✅ **DeepSeek as primary AI** (better quality responses than free tier's Groq/Gemini)
- ✅ **All 5 study modes** with no session limits
- ✅ **Full exam planner** — unlimited plans, full coaching
- ✅ **Full language learning** — all modules, conversation practice, SRS
- ✅ **Priority support** — responses within 24 hours
- ✅ **Session export** — download your study sessions as PDF
- ✅ **Advanced flashcard analytics** — see your confidence trends over time
- ✅ **Pomodoro timer** in all study modes

> **Pro cost to us:** ~$0.52/user/month. At $9.99/month, margin is **~95%** after costs.

---

## 🚀 Max Plan — "Power User"

**Price:**
- Monthly: **$19.99/month**
- Quarterly: **$53.99/quarter** ($17.99/month — 10% off)
- Annual: **$179.99/year** ($15.00/month — 25% off)

**Goal:** Students with multiple subjects, heavy PDF/audio usage, or who want the absolute best AI quality with no daily friction.

### Daily Limits

| Feature | Max daily limit | vs Pro |
|---|---|---|
| AI chat messages | **Unlimited** | Was 100/day |
| Text-to-speech | **Unlimited** | Was 50/day |
| Audio lecture uploads | **Unlimited** | Was 3/day |

### Monthly / Total Limits

| Feature | Max limit | vs Pro |
|---|---|---|
| PDF uploads | **Unlimited** | Was 20/month |
| Audio lecture uploads | **Unlimited** | Was 15/month |
| YouTube study | **Unlimited** | Was 20/month |
| Flashcard library | **Unlimited** | Was 2,000 |
| Exam plans | **Unlimited** | Was 5 |
| File storage | **10GB** | Was 2GB |

### Max Exclusive Features
- ✅ Everything in Pro
- ✅ **Truly unlimited AI messages** — no daily cap
- ✅ **Highest priority AI** — always DeepSeek, never falls back to cheaper models
- ✅ **Bulk flashcard import** — upload a CSV or paste a list to create cards in bulk
- ✅ **Collaborative study** — share a session link with a friend (both can chat in the same session)
- ✅ **Custom AI persona** — choose your tutor's teaching style and personality
- ✅ **Advanced analytics dashboard** — full learning progress, time spent, topics covered
- ✅ **Priority support** — responses within 4 hours

> **Max cost to us:** Heavy users on Max could cost $2–4/month in AI. At $19.99/month, margin is still **~85–90%**.

---

## 🏫 School / Team Plan — B2B

**Price:** **$299/month per school** (up to 50 students)
Additional students: **$4/student/month**

**What schools get:**
- ✅ All Max features for every student
- ✅ **Teacher dashboard** — see all students' progress, time spent, topics covered
- ✅ **Assign topics** — teacher sets the subject and exam date for the whole class
- ✅ **Bulk account creation** — upload a CSV of student emails
- ✅ **Custom branding** — school logo in the app
- ✅ **Dedicated support** — Slack/email channel with 2-hour response time
- ✅ **Usage reports** — monthly PDF report of class engagement
- ✅ **Annual billing only** — $2,990/year per school (saves $598 vs monthly)

> **School cost to us:** 50 students × $0.52 = $26/month. At $299/month, margin is **~91%**.

---

## Pricing Comparison Table

| Feature | Free | Pro $9.99/mo | Max $19.99/mo | School $299/mo |
|---|---|---|---|---|
| AI messages/day | 20 | 100 | Unlimited | Unlimited |
| TTS plays/day | 5 | 50 | Unlimited | Unlimited |
| Active sessions | 5 | Unlimited | Unlimited | Unlimited |
| PDFs/month | 2 total | 20 | Unlimited | Unlimited |
| Audio lectures/month | 1 total | 15 | Unlimited | Unlimited |
| YouTube videos/month | 2 total | 20 | Unlimited | Unlimited |
| Flashcard library | 50 cards | 2,000 cards | Unlimited | Unlimited |
| Flashcard collections | 2 | Unlimited | Unlimited | Unlimited |
| Exam plans | 1 | 5 | Unlimited | Unlimited |
| Language learning | Module 1 | All modules | All modules | All modules |
| Session history | 7 days | Unlimited | Unlimited | Unlimited |
| File storage | 50MB | 2GB | 10GB | 10GB/student |
| AI quality | Groq/Gemini | DeepSeek | DeepSeek (priority) | DeepSeek (priority) |
| Bulk flashcard import | ❌ | ❌ | ✅ | ✅ |
| Collaborative sessions | ❌ | ❌ | ✅ | ✅ |
| Analytics dashboard | ❌ | Basic | Advanced | Teacher view |
| Teacher dashboard | ❌ | ❌ | ❌ | ✅ |
| Support | Community | 24h email | 4h email | 2h Slack |

---

## Billing Periods & Discounts

### Monthly
Pay month-to-month. Cancel anytime. No commitment.

### Quarterly (10% off)
Pay every 3 months. Saves 10% vs monthly.
- Pro: $26.99/quarter (saves $3/quarter)
- Max: $53.99/quarter (saves $6/quarter)

### Annual (25% off)
Pay once a year. Best value. Saves 25% vs monthly.
- Pro: $89.99/year (saves $30/year vs monthly)
- Max: $179.99/year (saves $60/year vs monthly)

### Why offer annual?
- **Cash flow:** Annual payments give us 12 months of revenue upfront
- **Retention:** Annual subscribers churn at ~5% vs ~20% for monthly
- **Predictability:** Easier to forecast costs and plan infrastructure

### Recommended promotion: "Back to School" annual discount
Run in August/September: **30% off annual plans** for students who sign up with a `.edu` email address.
- Pro annual: $83.99/year (normally $89.99)
- Max annual: $167.99/year (normally $179.99)

---

## Free Tier Sustainability — The Maths

The free tier is a marketing cost, not a product cost. Here's how to think about it:

**Scenario: 10,000 total users, 70% free, 30% paid**

| Segment | Users | Monthly cost | Monthly revenue |
|---|---|---|---|
| Free users (70%) | 7,000 | $420 (at $0.06/day × 30 days × 20% actually active) | $0 |
| Pro users (25%) | 2,500 | $1,300 | $24,975 |
| Max users (5%) | 500 | $520 | $9,995 |
| **Total** | **10,000** | **$2,240** | **$34,970** |
| **Profit** | | | **$32,730 (93% margin)** |

**Key insight:** Even with 70% free users, the paid 30% generates enough revenue to cover everyone — including the free users — with a 93% margin.

**The free tier pays for itself** as long as conversion rate stays above ~5%.

---

## What Triggers Conversion — The "Upgrade Moment"

The best time to show an upgrade prompt is when a user hits a limit they care about. Design these moments carefully:

| Trigger | What the user sees | Upgrade message |
|---|---|---|
| Hits 20 message limit | Soft wall with message count | *"You've used your 20 free messages today. Upgrade to Pro for 100 messages/day — your session will be waiting."* |
| Tries to upload 3rd PDF | Upload blocked | *"Free plan includes 2 PDFs. Pro gives you 20/month — enough for a full course."* |
| Tries to create 6th session | Creation blocked | *"You have 5 active sessions. Pro removes this limit entirely."* |
| Tries to access Language Module 2 | Module locked | *"Module 2 and beyond are available on Pro. You've already completed Module 1 — keep going."* |
| Tries to upload audio lecture (2nd time) | Upload blocked | *"Free plan includes 1 audio lecture. Pro gives you 15/month."* |
| Flashcard library hits 50 | Warning at 45 | *"You're at 45/50 flashcards. Pro gives you 2,000 — enough for your entire degree."* |
| Tries to create 2nd exam plan | Creation blocked | *"Pro supports 5 exam plans — perfect for students juggling multiple subjects."* |

**Rule:** Never block mid-session. Always let the current session finish. Block at the start of the next action.

---

## Promotional Strategy

### 1. Student Verification Discount — 20% off Pro
Students with a `.edu` email get 20% off Pro forever.
- Pro: $7.99/month (normally $9.99)
- This is our primary acquisition channel — students are the core user

### 2. 7-Day Free Trial of Pro
New users get 7 days of Pro features automatically. No credit card required.
- After 7 days, they drop to Free unless they subscribe
- This is the most effective conversion tool — let them experience the full product

### 3. Referral Programme
- Refer a friend who subscribes → get 1 month free
- Friend gets 20% off their first month
- Cost to us: ~$0.52 (one month of their usage) — worth it for a new paying customer

### 4. "Exam Season" Promotion
Run in April/May and November/December (peak exam periods):
- 50% off first month of Pro
- Headline: *"Exam in 2 weeks? Get unlimited AI tutoring for $4.99 this month."*
- This targets the highest-intent users at their most motivated moment

### 5. Annual Plan Incentive
When a monthly subscriber reaches their 3rd month, show:
*"You've been studying with LastWeek for 3 months. Switch to annual and save $30 — that's 3 months free."*

### 6. Pause Instead of Cancel
When a user tries to cancel, offer a **1-month pause** instead.
- Their data stays, limits stay at Pro level, billing pauses
- Reactivates automatically after 1 month
- Reduces churn by ~30% in similar products

---

## AI Usage by Tier — Cost Analysis

This shows what each tier actually costs us in AI, and confirms the margins hold.

### Free User (active, hits daily limit every day)
- 20 messages/day × 30 days = 600 messages/month
- 600 × 8,100 tokens = 4.86M tokens
- Cost: (4.86M × 0.80 × $0.27/M input) + (600 × 800 × 0.80 × $1.10/M output) = **$1.47/month**
- But: only ~20% of free users are active every day. Average free user cost: **~$0.30/month**

### Pro User (typical usage)
- 100 messages/day × 20 active days = 2,000 messages/month (not all days are study days)
- 2,000 × 8,100 tokens = 16.2M tokens
- Cost: **~$4.90/month**
- Revenue: $9.99/month
- **Margin: 51%** on heavy Pro users

### Pro User (light usage — 30 messages/month)
- 30 × 8,100 = 243K tokens
- Cost: **~$0.07/month**
- Revenue: $9.99/month
- **Margin: 99%** on light Pro users

### Pro User (average — 150 messages/month)
- Cost: **~$0.52/month**
- Revenue: $9.99/month
- **Margin: 95%**

### Max User (heavy — 500 messages/month)
- 500 × 8,100 = 4.05M tokens
- Cost: **~$1.22/month**
- Revenue: $19.99/month
- **Margin: 94%**

### Max User (very heavy — 1,500 messages/month, 50/day)
- 1,500 × 8,100 = 12.15M tokens
- Cost: **~$3.67/month**
- Revenue: $19.99/month
- **Margin: 82%** — still healthy

> **The unlimited Max plan is safe** because even the heaviest realistic users (50 messages/day every day) cost us ~$3.67/month against $19.99 revenue.

---

## Recommended Launch Sequence

### Month 1–3: Free only, build user base
- Launch with free tier only
- Focus on getting 500–1,000 active users
- Collect data on which features they use most
- Identify the natural "upgrade moments" from real usage

### Month 3: Introduce Pro
- Launch Pro at $9.99/month with 7-day free trial
- Email all existing free users: *"You've been using LastWeek for 3 months. Here's what Pro unlocks."*
- Target: 15–20% conversion from existing free users

### Month 6: Introduce Max + Annual
- Launch Max at $19.99/month
- Introduce annual billing with 25% discount
- Run first "Exam Season" promotion

### Month 9: B2B / School Plan
- Reach out to 10–20 schools directly
- Offer 3-month free pilot for one class
- Convert pilots to paid at $299/month

---

## Summary — The Numbers That Matter

| Metric | Target |
|---|---|
| Free → Pro conversion rate | 15–20% |
| Monthly churn (Pro) | < 8% |
| Annual churn (Pro annual) | < 15% |
| Average revenue per paying user | $11.50/month (mix of Pro + Max) |
| Cost per paying user | $0.52–$1.50/month |
| **Target gross margin** | **85–95%** |
| Break-even paying users | **~55 users** (covers $15 Appwrite + minimal AI) |
| Profitable at | **~100 paying users** |
