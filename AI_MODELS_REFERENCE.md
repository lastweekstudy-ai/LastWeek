# AI Models & Providers Reference - LastWeek

## Overview
This document provides a comprehensive reference of all AI models and providers used in the LastWeek platform, including their versions, capabilities, use cases, and cost structure.

---

## 🏗️ Architecture Overview

### Security Model
**All AI API calls are routed through a secure Appwrite Function proxy.**

```
Frontend → Appwrite Function (aiProxyUniversal) → AI Provider APIs
```

**Benefits:**
- API keys never exposed to client code
- Centralized error handling and logging
- Rate limiting and usage tracking
- Easy provider switching

**Implementation:** `src/services/secureAiProvider.js`

---

## 🤖 AI Providers & Models

### 1. **Groq** (Primary Chat Provider)

**Base URL:** `https://api.groq.com/openai/v1/`

#### Models:

##### **Llama 3.3 70B Versatile**
- **Model ID:** `llama-3.3-70b-versatile`
- **Context Window:** 131,072 tokens
- **Rate Limits:** 1,000 requests/day, 12,000 tokens/minute (free tier)
- **Cost:** Free tier
- **Best For:**
  - Primary study chat responses
  - Complex reasoning tasks
  - Multi-turn conversations
  - Question answering
- **Use Cases in App:**
  - Mental Model mode explanations
  - Active Recall responses
  - Focus Breakdown analysis
  - Collaborative Scholar dialogue

##### **Llama 3.1 8B Instant**
- **Model ID:** `llama-3.1-8b-instant`
- **Context Window:** 131,072 tokens
- **Rate Limits:** 14,400 requests/day, 6,000 tokens/minute (free tier)
- **Cost:** Free tier
- **Best For:**
  - Fast, lightweight responses
  - Fallback when Llama 70B hits rate limits
  - Simple queries
- **Use Cases in App:**
  - Automatic failover for chat
  - Quick follow-up questions

##### **Qwen 2.5 32B Coder**
- **Model ID:** `qwen2.5-coder-32b-instruct`
- **Context Window:** 32,768 tokens
- **Rate Limits:** 1,000 requests/day, 6,000 tokens/minute (free tier)
- **Cost:** Free tier
- **Best For:**
  - Coding explanations
  - Programming-related study content
  - Multi-lingual content (supports 29 languages including Bengali, Hindi, Arabic)
- **Use Cases in App:**
  - Computer science study sessions
  - Code explanation in PDFs
  - Programming problem breakdown

##### **Gemma 2 9B IT**
- **Model ID:** `gemma2-9b-it`
- **Context Window:** 8,192 tokens
- **Rate Limits:** High availability
- **Cost:** Free tier
- **Best For:**
  - Emergency fallback
  - Short responses
- **Use Cases in App:**
  - Last-resort failover when other models are unavailable

##### **Whisper Large V3**
- **Model ID:** `whisper-large-v3`
- **Rate Limits:** 2,000 requests/day (free tier)
- **Cost:** Free tier
- **Best For:**
  - Audio transcription
  - Lecture audio to text
  - High-quality speech recognition
- **Supported Formats:** MP3, WAV, M4A, OGG, FLAC, WebM, AAC
- **Max File Size:** 25 MB
- **Use Cases in App:**
  - Transcribing lecture audio files
  - Converting study audio to searchable text
  - Audio note transcription

##### **Whisper Large V3 Turbo**
- **Model ID:** `whisper-large-v3-turbo`
- **Best For:**
  - Faster audio transcription
  - Real-time processing
- **Use Cases in App:**
  - Quick audio transcription when speed is priority

---

### 2. **Google Gemini** (Vision & Document Analysis)

**Base URL:** `https://generativelanguage.googleapis.com/v1beta/`

#### Models:

##### **Gemini 2.0 Flash (Latest)**
- **Model ID:** `gemini-2.0-flash-exp`
- **Context Window:** 2,000,000 tokens (2M!)
- **Rate Limits:** 1,500 requests/day, 15 requests/minute (free tier)
- **Cost:** Free tier
- **Capabilities:**
  - Text generation
  - Vision (image analysis)
  - Document understanding (native PDF support)
  - Multi-modal (text + images together)
- **Best For:**
  - Large PDF documents
  - Image analysis and OCR
  - Vision-based questions
  - Document summarization
- **Use Cases in App:**
  - PDF text extraction (when PDF.js fails)
  - Image-only PDF pages (OCR)
  - Diagram and chart analysis
  - Visual content understanding
  - Bengali/Hindi/Arabic PDF OCR (when text is garbled)
  - Handwritten note recognition

##### **Gemini 1.5 Flash (Stable)**
- **Model ID:** `gemini-1.5-flash`
- **Context Window:** 1,000,000 tokens
- **Best For:**
  - Stable production fallback
  - When 2.0 Flash has issues
- **Use Cases in App:**
  - Fallback for document analysis
  - Vision tasks when 2.0 Flash unavailable

---

### 3. **DeepSeek** (Reasoning & Long Context)

**Base URL:** `https://api.deepseek.com/v1/`

#### Models:

##### **DeepSeek R1 (Reasoning Model)**
- **Model ID:** `deepseek-chat`
- **Context Window:** 64,000 tokens
- **Rate Limits:** No strict limits (paid API)
- **Cost:** $0.14 per 1M input tokens, $0.28 per 1M output tokens
- **Best For:**
  - Complex reasoning tasks
  - Long-form explanations
  - Deep analytical responses
  - Reliable fallback when free tiers exhausted
- **Use Cases in App:**
  - Creative Synthesis mode (combining multiple concepts)
  - Complex problem-solving
  - Fallback when Groq/Gemini hit rate limits
  - Long study sessions requiring consistent quality

##### **DeepSeek Coder**
- **Model ID:** `deepseek-coder`
- **Best For:**
  - Code-heavy content
  - Programming explanations
- **Use Cases in App:**
  - Computer science PDFs
  - Algorithm explanations

---

## 🔄 Automatic Failover Strategy

### Chat/Text Generation Priority:
```
1. Groq Llama 3.3 70B (primary)
   ↓ (on rate limit or error)
2. Groq Qwen 2.5 32B (coding/multilingual)
   ↓ (on rate limit or error)
3. DeepSeek R1 (paid, reliable)
   ↓ (on error)
4. Groq Llama 3.1 8B (fast fallback)
```

### Vision/Image Analysis Priority:
```
1. Gemini 2.0 Flash (primary)
   ↓ (on error)
2. Gemini 1.5 Flash (stable fallback)
```

### Document Analysis Priority:
```
1. Gemini 2.0 Flash (2M context, native PDF)
   ↓ (on rate limit)
2. Groq Llama 3.3 70B (text extraction)
   ↓ (on error)
3. DeepSeek R1 (long context)
```

### Audio Transcription:
```
1. Groq Whisper V3 (primary)
   ↓ (on error)
2. Groq Whisper V3 Turbo (faster fallback)
```

---

## 📊 Rate Limit Management

### Token Budget Strategy:
- **Groq Llama 70B:** Max 7,500 tokens per request (leaves room for 4,500 output tokens)
- **Groq Llama 8B:** Max 3,500 tokens per request (leaves room for 2,500 output tokens)
- **Groq Skip Threshold:** 6,500 tokens (skip to DeepSeek if input exceeds this)

### Context Truncation:
- System automatically truncates conversation history to fit token limits
- Always keeps the last user message
- Drops oldest messages first
- 800-token safety buffer for estimation errors

**Implementation:** `src/services/aiProvider.js` - `truncateMessages()`

---

## 🎯 Feature-Specific AI Usage

### 1. **Study Modes**

#### **Mental Model Mode**
- **Primary:** Groq Llama 3.3 70B
- **Prompt Style:** Conceptual explanations, analogies, visual descriptions
- **Response Format:** Markdown with KaTeX math

#### **Active Recall Mode**
- **Primary:** Groq Llama 3.3 70B
- **Prompt Style:** Questions and spaced repetition
- **Response Format:** Interactive Q&A

#### **Focus Breakdown Mode**
- **Primary:** Groq Llama 3.3 70B
- **Prompt Style:** Step-by-step granular breakdown
- **Response Format:** Structured lessons

#### **Collaborative Scholar Mode**
- **Primary:** Groq Llama 3.3 70B
- **Prompt Style:** Socratic dialogue
- **Response Format:** Conversational teaching

#### **Creative Synthesis Mode**
- **Primary:** DeepSeek R1 (for deep reasoning)
- **Fallback:** Groq Llama 3.3 70B
- **Prompt Style:** Cross-concept connections
- **Response Format:** Creative analogies

---

### 2. **PDF Processing**

#### **Text Extraction (PDF.js)**
- **Library:** `react-pdf` + `pdfjs`
- **When:** PDF has embedded text
- **Process:** Direct text extraction from PDF structure

#### **Vision OCR Fallback (Gemini)**
- **Model:** Gemini 2.0 Flash
- **When:** 
  - PDF text is garbled (encoding issues)
  - Image-only PDFs (scanned documents)
  - Complex scripts (Bengali, Hindi, Arabic, Tamil, Thai, Myanmar)
  - Garbage ratio > 5% for Indic scripts
- **Process:** Render page as image → send to Gemini Vision → extract text
- **Implementation:** `src/utils/pdfProcessor.js` - `classifyPage()`

---

### 3. **Language Learning**

#### **Conversation Generation**
- **Primary:** Groq Llama 3.3 70B
- **Fallback:** Gemini 2.0 Flash
- **Use:** Native speaker dialogue simulation

#### **Vocabulary & Grammar**
- **Primary:** Gemini 2.0 Flash (structured JSON output)
- **Fallback:** Groq Llama 3.3 70B
- **Use:** Exercise generation, grammar explanations

**Implementation:** `src/services/languageAI.js`

---

### 4. **Visual Generation**

#### **SVG Diagram Generation**
- **Primary:** Groq Llama 3.3 70B
- **Max Tokens:** 16,000 (to support multiple SVGs)
- **Use:** Generating visual aids from text

#### **Mermaid Diagrams**
- **Primary:** Groq Llama 3.3 70B
- **Library:** `mermaid` for rendering
- **Use:** Flowcharts, mind maps, timelines

**Implementation:** `src/services/visualGenerator.js`

---

## 💰 Cost Breakdown (Monthly Estimates)

### Free Tier Coverage:
- **Groq:** 30,000 requests/month (Llama 70B)
- **Gemini:** 45,000 requests/month
- **Whisper:** 60,000 transcriptions/month

### Paid Usage (DeepSeek):
- **Average session:** ~20,000 tokens ($0.0056 per session)
- **Heavy user (100 sessions/month):** ~$0.56/month
- **Cost per 1000 users:** ~$560/month (assuming 100 sessions each)

### Estimated Total Cost (1000 Active Users):
- **Groq:** $0 (free tier)
- **Gemini:** $0 (free tier)
- **DeepSeek:** ~$560/month (fallback only)
- **Whisper:** $0 (free tier)

**Total:** ~$560/month for 1000 users (with aggressive DeepSeek usage)

**Optimized:** ~$100-200/month (most queries handled by free tiers)

---

## 🔧 Configuration

### Environment Variables:
```env
# API Keys (stored server-side only)
DEEPSEEK_API_KEY=your_deepseek_key
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key

# Appwrite Function
VITE_APPWRITE_AI_PROXY_FUNCTION_ID=your_function_id
```

### Provider Selection:
**Location:** `src/services/secureAiProvider.js`

**Functions:**
- `callGroq()` - Groq chat completions
- `callGroqVision()` - Groq vision (Llama 3.2 11B)
- `callGeminiText()` - Gemini text generation
- `callGeminiVision()` - Gemini image analysis
- `callDeepSeek()` - DeepSeek chat completions
- `callDeepSeekSimple()` - Simple DeepSeek prompt
- `transcribeAudio()` - Groq Whisper async transcription

---

## 📈 Monitoring & Analytics

### Usage Tracking:
- **Database:** `usage` collection in Appwrite
- **Tracked Actions:** 
  - AI messages sent
  - PDFs uploaded
  - Audio transcriptions
  - Sessions created
- **Per User Limits:**
  - Free: 100 messages/month
  - Pro: Unlimited messages

### Error Logging:
- All AI errors logged to Appwrite Function logs
- Provider failures trigger automatic failover
- Rate limit errors return user-friendly messages

**Implementation:** `src/hooks/useCombinedLimits.js`

---

## 🚀 Future Enhancements

### Planned Additions:
1. **Claude 3 Opus** - For advanced reasoning tasks
2. **GPT-4o** - For specialized use cases
3. **Local LLaMA** - For offline study mode
4. **Fine-tuned Models** - Custom models for specific subjects

### Optimization Targets:
- Reduce DeepSeek usage to <10% of total requests
- Implement smarter caching for repeated queries
- Add user preference for preferred AI provider

---

## 📚 Additional Resources

### Provider Documentation:
- **Groq:** https://console.groq.com/docs
- **Gemini:** https://ai.google.dev/docs
- **DeepSeek:** https://platform.deepseek.com/docs

### Model Comparisons:
- **LLM Leaderboard:** https://huggingface.co/spaces/lmsys/chatbot-arena-leaderboard
- **Token Pricing:** https://openrouter.ai/models

### Implementation Files:
- `src/services/aiProvider.js` - Main AI service
- `src/services/secureAiProvider.js` - Secure proxy wrapper
- `src/services/languageAI.js` - Language learning AI
- `src/services/visualGenerator.js` - Visual generation AI
- `appwrite-functions/aiProxyUniversal/` - Serverless AI proxy

---

**Last Updated:** June 2026  
**Maintained By:** AI Infrastructure Team  
**Version:** 2.0
