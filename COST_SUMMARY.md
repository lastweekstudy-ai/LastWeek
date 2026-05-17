# LastWeek — Business Cost Summary

### What does it cost to run LastWeek, and what can we make from it?

---

## ⚠️ Important Correction — Why the Real Number Is Higher

An earlier estimate put the cost at **$0.22 per user per month**. That was based on a simplified assumption of 2,000 tokens per AI exchange.

**The real number is $0.52 per user per month.**

Here's why it's higher:

Every time a user sends a message, the AI receives:
- The **teaching instructions** we send before every conversation (~3,000 tokens — this is the "system prompt" that tells the AI how to behave as a tutor)
- The **conversation history** so far in the session (~5,000 tokens on average — the AI needs to remember what was said)
- The **user's message** (~100 tokens)
- Then it writes back a **detailed teaching response** (~800 tokens)

That's **~8,100 tokens per exchange**, not 2,000. The AI charges per token, so the real cost is about 4× higher than the simplified estimate.

---

## The Corrected One-Line Answer

> **It costs roughly $0.52 per active user per month to run LastWeek.**

This number stays nearly flat at every scale — because costs grow with usage, not with headcount.

---

## What Are We Actually Paying For?

| Service | What it does | Monthly cost model |
|---|---|---|
| 🤖 **DeepSeek AI** | Powers the AI tutor — 80% of all conversations | Pay per word the AI reads and writes |
| ⚡ **Groq AI** | Backup AI — 15% of conversations (when DeepSeek is slow) | Pay per word |
| 🔮 **Google Gemini** | Second backup AI (5%) + text-to-speech voice | Pay per word + per character spoken |
| 🗄️ **Appwrite** | Stores all user data — accounts, flashcards, sessions, files | Flat $15/month |
| ☁️ **Cloudflare** | Stores audio files (lecture recordings, TTS audio) | Pay per GB stored — no download fees |

**The AI conversation is 96% of the bill.** Everything else is nearly free.

---

## Unit Economics — What One Active User Costs Per Month

A typical active user each month:
- Sends **150 chat messages** to the AI tutor
- Each message triggers ~**8,100 tokens** of AI processing (instructions + history + message + response)
- Gets **20 text-to-speech** audio responses
- Uploads **2 PDFs** and **1 audio lecture**

| Cost component | How it's calculated | Monthly cost per user |
|---|---|---|
| AI — DeepSeek (80% of traffic) | 1.215M input tokens × $0.27/M + 120K output tokens × $1.10/M, × 80% | **$0.37** |
| AI — Groq backup (15% of traffic) | Same token volume × 15% × Groq rates | **$0.12** |
| AI — Gemini backup (5% of traffic) | Same token volume × 5% × Gemini rates | **$0.01** |
| Text-to-speech (Gemini TTS) | 20 requests × 500 characters × $0.50/M chars | **$0.005** |
| File storage (Cloudflare R2) | ~9MB per user × $0.015/GB | **$0.0003** |
| Database & account (Appwrite) | $15 flat fee ÷ users (at 1,000 users = $0.015 each) | **$0.015** |
| **Total** | | **~$0.52 / user / month** |

> **Why is output more expensive than input?** DeepSeek charges $0.27 per million tokens to *read* (input) but $1.10 per million tokens to *write* (output). Teaching responses are long and detailed — that's where most of the cost comes from.

---

## Cost at Different Scales

---

### 500 Users — $266/month

| Service | Cost |
|---|---|
| AI conversations (DeepSeek + Groq + Gemini) | $248 |
| Text-to-speech audio | $3 |
| File storage (Cloudflare) | $0.13 |
| User accounts & database (Appwrite) | $15 |
| **Monthly total** | **$266** |
| **Cost per user** | **$0.53** |

**AI breakdown:** DeepSeek $185 · Groq $59 · Gemini $4

---

### 1,000 Users — $516/month

| Service | Cost |
|---|---|
| AI conversations | $496 |
| Text-to-speech audio | $5 |
| File storage (Cloudflare) | $0.26 |
| User accounts & database (Appwrite) | $15 |
| **Monthly total** | **$516** |
| **Cost per user** | **$0.52** |

**AI breakdown:** DeepSeek $370 · Groq $118 · Gemini $8

---

### 5,000 Users — $2,521/month

| Service | Cost |
|---|---|
| AI conversations | $2,481 |
| Text-to-speech audio | $25 |
| File storage (Cloudflare) | $1.10 |
| User accounts & database (Appwrite) | $15 |
| **Monthly total** | **$2,521** |
| **Cost per user** | **$0.50** |

**AI breakdown:** DeepSeek $1,850 · Groq $591 · Gemini $40

> 📌 Appwrite stays at $15 flat — function executions (TTS + YouTube processing) are only 110,000/month, well within the 3.5M included in the Pro plan.

---

### 10,000 Users — $5,028/month

| Service | Cost |
|---|---|
| AI conversations | $4,961 |
| Text-to-speech audio | $50 |
| File storage (Cloudflare) | $2.20 |
| User accounts & database (Appwrite) | $15 |
| **Monthly total** | **$5,028** |
| **Cost per user** | **$0.50** |

**AI breakdown:** DeepSeek $3,700 · Groq $1,182 · Gemini $79

---

### 50,000 Users — $25,079/month

| Service | Cost |
|---|---|
| AI conversations | $24,807 |
| Text-to-speech audio | $250 |
| File storage (Cloudflare) | $11 |
| User accounts & database (Appwrite) | $15 |
| **Monthly total** | **$25,079** |
| **Cost per user** | **$0.50** |

**AI breakdown:** DeepSeek $18,500 · Groq $5,910 · Gemini $397

> 📌 At 50,000 users, it's worth negotiating a volume discount with DeepSeek. A 20% discount saves ~$3,700/month.

---

### 100,000 Users — $50,143/month

| Service | Cost |
|---|---|
| AI conversations | $49,614 |
| Text-to-speech audio | $500 |
| File storage (Cloudflare) | $22 |
| User accounts & database (Appwrite) | $15 |
| **Monthly total** | **$50,143** |
| **Cost per user** | **$0.50** |

**AI breakdown:** DeepSeek $37,000 · Groq $11,820 · Gemini $794

> 📌 At 100,000 users, running our own AI servers (instead of paying per token) cuts the $49,614 AI bill to roughly $5,400/month — a saving of **$44,000/month**. This is the point where that investment clearly pays off.

---

## The Big Picture — All Scales at a Glance

| Users | Monthly Cost | Cost Per User | Annual Cost |
|---|---|---|---|
| 500 | $266 | $0.53 | $3,192 |
| 1,000 | $516 | $0.52 | $6,192 |
| 5,000 | $2,521 | $0.50 | $30,252 |
| 10,000 | $5,028 | $0.50 | $60,336 |
| 50,000 | $25,079 | $0.50 | $300,948 |
| 100,000 | $50,143 | $0.50 | $601,716 |

**The cost per user decreases slightly as we grow** — because the $15 Appwrite flat fee gets spread across more users.

---

## What Can We Charge? — Revenue Scenarios

### Scenario A — Freemium ($9.99/month paid plan, 30% conversion)

| Users | Paying users | Monthly revenue | Monthly cost | **Monthly profit** | **Margin** |
|---|---|---|---|---|---|
| 1,000 | 300 | $2,997 | $516 | **$2,481** | **83%** |
| 5,000 | 1,500 | $14,985 | $2,521 | **$12,464** | **83%** |
| 10,000 | 3,000 | $29,970 | $5,028 | **$24,942** | **83%** |
| 50,000 | 15,000 | $149,850 | $25,079 | **$124,771** | **83%** |
| 100,000 | 30,000 | $299,700 | $50,143 | **$249,557** | **83%** |

### Scenario B — All paid ($4.99/month, no free tier)

| Users | Monthly revenue | Monthly cost | **Monthly profit** | **Margin** |
|---|---|---|---|---|
| 1,000 | $4,990 | $516 | **$4,474** | **90%** |
| 10,000 | $49,900 | $5,028 | **$44,872** | **90%** |
| 100,000 | $499,000 | $50,143 | **$448,857** | **90%** |

### Scenario C — B2B / School licenses ($299/month per school, 50 students)

| Schools | Students | Monthly revenue | Monthly cost | **Monthly profit** |
|---|---|---|---|---|
| 10 | 500 | $2,990 | $266 | **$2,724** |
| 50 | 2,500 | $14,950 | $1,261 | **$13,689** |
| 200 | 10,000 | $59,800 | $5,028 | **$54,772** |

> B2B is the highest-margin model — schools pay a flat fee regardless of how much each student uses the app.

---

## How to Reduce Costs

Ranked by impact:

### 🥇 #1 — Cache AI responses (saves 20–30% of AI bill)
When two users ask the same question, we answer it once and reuse the answer for 24 hours. The infrastructure for this is already partially built.

**Potential saving at 10,000 users: ~$1,000/month**

### 🥈 #2 — Route simple questions to cheaper AI (saves 15–20%)
Google Gemini Flash costs $0.075/M input tokens vs DeepSeek's $0.27/M — it's 3.6× cheaper. Short, simple questions can be routed there automatically.

**Potential saving at 10,000 users: ~$750/month**

### 🥉 #3 — Shorten the teaching instructions (saves 10–15%)
The instructions we send to the AI before every conversation are ~3,000 tokens. Trimming them by 30% reduces every single exchange by 900 tokens.

**Potential saving at 10,000 users: ~$500/month**

### #4 — Cap text-to-speech length (saves ~40% of TTS bill)
Limiting audio responses to 300 characters instead of 500 cuts the TTS bill nearly in half.

**Potential saving at 10,000 users: ~$20/month**

### #5 — Self-host AI at 100K+ users (saves ~89% of AI bill)
Running our own AI servers instead of paying per token. Only worth doing above 100,000 users — below that, the setup and maintenance cost outweighs the savings.

**Potential saving at 100,000 users: ~$44,000/month**

---

## When Do We Need to Make Infrastructure Decisions?

| Milestone | What changes | Action needed |
|---|---|---|
| **500 users** | Costs start (~$266/mo) | Move from free tiers to paid plans |
| **10,000 users** | AI bill hits $5K/month | Implement response caching |
| **25,000 users** | AI bill hits $12.5K/month | Negotiate volume pricing with DeepSeek |
| **50,000 users** | AI bill hits $25K/month | Evaluate volume discounts across all AI providers |
| **100,000 users** | AI bill hits $50K/month | Evaluate self-hosted AI servers (saves ~$44K/month) |

---

## Summary — The 4 Things to Remember

1. **$0.52 per active user per month** — this is our real unit economics. It stays flat at every scale.

2. **The AI conversation is 96% of the cost.** The teaching instructions + conversation history sent with every message are what make it higher than a simple chatbot.

3. **Margins are strong.** At $9.99/month with 30% conversion, we keep 83 cents of every dollar of revenue. The business model works at any scale above ~60 paying users.

4. **The cost per user actually falls slightly as we grow** — from $0.53 at 500 users to $0.50 at 10,000+ users — because the fixed Appwrite fee gets spread across more people.
