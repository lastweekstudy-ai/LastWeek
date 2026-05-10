# Requirements Document

## Introduction

This feature improves the AI teaching quality across all five study modes in the LastWeek app. Currently the AI (DeepSeek for chat, Gemini for analysis) produces surface-level responses that skip important subtopics, lack depth, and do not feel like a knowledgeable tutor who knows the full curriculum. The improvement targets the system prompts in `promptBuilder.js` and the way session assessment context is injected into those prompts, so that the AI covers all core concepts of a topic, adapts depth to the user's assessed level, and behaves like a thorough subject-matter expert in every mode.

## Glossary

- **Prompt_Builder**: The `src/utils/promptBuilder.js` module that constructs the system prompt sent to DeepSeek for each study mode.
- **Session_Context**: The user's assessment responses (knowledge level, learning goal, time available, preferred style) stored via `sessionContext.js` and passed to the AI at the start of a session.
- **System_Prompt**: The instruction string prepended to every DeepSeek API call that defines the AI's role, behavior, and teaching approach for the active mode.
- **Knowledge_Level**: The user's self-reported expertise — one of: `complete_beginner`, `beginner`, `intermediate`, `advanced`.
- **Study_Mode**: One of the five learning modes: Mental Model, Active Recall, Focus Breakdown, Collaborative Scholar, Creative Synthesis.
- **Core_Concepts**: The essential subtopics, definitions, mechanisms, and relationships that a subject-matter expert would consider mandatory for understanding a topic at the stated Knowledge_Level.
- **Curriculum_Coverage**: The property of a response that ensures no important subtopic is omitted when introducing or explaining a topic.
- **Depth_Calibration**: The adjustment of explanation complexity, vocabulary, and assumed prior knowledge to match the user's Knowledge_Level.
- **Topic_Scaffold**: A structured outline of Core_Concepts for a topic, ordered from foundational to advanced, used by the AI to ensure Curriculum_Coverage.
- **DeepSeek**: The primary chat AI (`deepseek-chat` model) used for all study-mode responses.
- **Gemini**: The secondary AI used for document/image pre-analysis before passing context to DeepSeek.

---

## Requirements

### Requirement 1: Curriculum-Complete Topic Introduction

**User Story:** As a student, I want the AI to cover all core concepts of a topic when I ask about it, so that I don't miss important subtopics and feel like I'm learning from a complete curriculum.

#### Acceptance Criteria

1. WHEN a user asks the AI to explain or introduce a topic, THE Prompt_Builder SHALL instruct the AI to first identify and enumerate the Core_Concepts of that topic before beginning the explanation.
2. WHEN the AI introduces a topic, THE System_Prompt SHALL require the AI to produce a Topic_Scaffold listing all major subtopics it will cover, ordered from foundational to advanced.
3. WHEN the AI produces a Topic_Scaffold, THE System_Prompt SHALL require the AI to cover every item in that scaffold before ending the response or asking a follow-up question.
4. IF a user's message is a broad topic request (e.g. "teach me photosynthesis"), THEN THE System_Prompt SHALL instruct the AI to treat it as a full curriculum request and not limit coverage to a single subtopic.
5. WHEN the AI has not yet covered all items in the Topic_Scaffold, THE System_Prompt SHALL instruct the AI to explicitly state which subtopics remain uncovered, so the user knows more depth is available.

---

### Requirement 2: Depth Calibration from Session Assessment

**User Story:** As a student, I want the AI to teach at the right depth for my knowledge level, so that explanations are neither too basic nor too advanced for where I am.

#### Acceptance Criteria

1. WHEN a session has a completed assessment, THE Prompt_Builder SHALL inject the user's Knowledge_Level, learning goal, time available, and preferred style into the System_Prompt for every message in that session. IF the injection fails due to a technical error, THEN THE Prompt_Builder SHALL proceed with default `beginner` settings.
2. WHEN the Knowledge_Level is `complete_beginner`, THE System_Prompt SHALL instruct the AI to define every technical term on first use, avoid assumed prior knowledge, and use concrete everyday examples before abstract definitions.
3. WHEN the Knowledge_Level is `beginner`, THE System_Prompt SHALL instruct the AI to briefly recall prerequisite concepts before introducing new ones, and use simplified but accurate language.
4. WHEN the Knowledge_Level is `intermediate`, THE System_Prompt SHALL instruct the AI to skip basic definitions, use domain vocabulary freely, and focus on mechanisms, relationships, and edge cases.
5. WHEN the Knowledge_Level is `advanced`, THE System_Prompt SHALL instruct the AI to engage at peer level, discuss nuance, competing theories, and unsolved problems, and challenge the user's understanding with probing questions.
6. IF no session assessment exists for a session, THEN THE System_Prompt SHALL default to `beginner` depth and instruct the AI to offer to adjust depth if the user finds it too simple or too complex.

---

### Requirement 3: Mode-Specific Teaching Completeness

**User Story:** As a student, I want each study mode to feel like a thorough expert in its domain, so that the AI's behavior matches the mode's purpose and doesn't feel generic.

#### Acceptance Criteria

1. WHEN the active Study_Mode is Mental Model, THE System_Prompt SHALL instruct the AI to cover the full conceptual structure of a topic — including what it is, how it works, why it matters, and how it connects to related concepts — before offering analogies.
2. WHEN the active Study_Mode is Active Recall, THE System_Prompt SHALL instruct the AI to generate questions that span all Core_Concepts of the topic, not only the most obvious ones, and to track which concepts have been tested in the session.
3. WHEN the active Study_Mode is Focus Breakdown, THE System_Prompt SHALL instruct the AI to produce a complete topic map showing all subtopics before breaking any single subtopic into chunks, so the user sees the full scope.
4. WHEN the active Study_Mode is Collaborative Scholar, THE System_Prompt SHALL instruct the AI to evaluate arguments and essays against the full academic standard for the subject, citing specific missing concepts or weak reasoning.
5. WHEN the active Study_Mode is Creative Synthesis, THE System_Prompt SHALL instruct the AI to ensure that any creative output (mind map, story, project) covers all Core_Concepts of the topic, not only the ones the user explicitly mentioned.

---

### Requirement 4: No Concept Skipping

**User Story:** As a student who already knows a subject well, I want the AI to not skip important concepts when I ask about them, so that I can verify my understanding is complete.

#### Acceptance Criteria

1. THE System_Prompt SHALL instruct the AI to never truncate a topic explanation due to response length concerns — if a topic requires multiple parts, the AI SHALL explicitly signal "Part 1 of N" and offer to continue.
2. WHEN the AI finishes explaining a concept, THE System_Prompt SHALL instruct the AI to list any directly related concepts that were not covered in the current response, so the user can request them.
3. THE System_Prompt SHALL instruct the AI to treat every topic request as a signal to be exhaustive and complete, regardless of whether the user phrases it as a "quick overview" or "summary" — brevity is only permitted when the user explicitly asks to skip a specific subtopic they already know.
4. IF the user asks "is that everything?" or "what am I missing?", THEN THE System_Prompt SHALL instruct the AI to perform a gap analysis against the Topic_Scaffold and list any concepts not yet discussed.

---

### Requirement 5: Structured and Organized Explanations

**User Story:** As a student, I want the AI's explanations to be well-structured and easy to follow, so that I can understand the logical flow of a topic rather than receiving a wall of disconnected text.

#### Acceptance Criteria

1. THE System_Prompt SHALL instruct the AI to organize every multi-concept explanation using a clear hierarchy: overview → core mechanism → subtopics → connections → summary.
2. WHEN explaining a topic with more than three subtopics, THE System_Prompt SHALL instruct the AI to number or label each subtopic so the user can track progress through the explanation.
3. THE System_Prompt SHALL instruct the AI to begin every new topic explanation with a one-sentence definition, followed by a "why it matters" statement, before going into detail.
4. WHEN the AI transitions between subtopics, THE System_Prompt SHALL instruct the AI to use explicit transition signals (e.g. "Now that we've covered X, let's look at Y") so the user always knows where they are in the explanation.
5. THE System_Prompt SHALL instruct the AI to end every topic explanation with a brief consolidation that ties all covered subtopics back to the central concept.

---

### Requirement 6: Session Context Injection into Prompts

**User Story:** As a student, I want the AI to remember my assessment answers throughout the session, so that it consistently teaches at the right level and style without me having to repeat myself.

#### Acceptance Criteria

1. WHEN a session has a completed assessment, THE Prompt_Builder SHALL append a dedicated "STUDENT PROFILE" section to the System_Prompt containing the user's Knowledge_Level, learning goal, time available, and preferred style.
2. THE System_Prompt SHALL instruct the AI to reference the STUDENT PROFILE at the start of every response to calibrate tone, vocabulary, and depth before generating content.
3. WHEN the user's preferred style is `analogies`, THE System_Prompt SHALL instruct the AI to lead every new concept explanation with an analogy before giving the formal definition.
4. WHEN the user's preferred style is `step_by_step`, THE System_Prompt SHALL instruct the AI to present every concept as a numbered sequence of logical steps.
5. WHEN the user's preferred style is `visual`, THE System_Prompt SHALL instruct the AI to prioritize diagrams, tables, and charts over prose for every concept explanation.
6. WHEN the user's preferred style is `stories`, THE System_Prompt SHALL instruct the AI to embed every concept explanation inside a narrative or real-world scenario before stating the formal definition.
7. WHEN the user's time available is `1-2_days`, THE System_Prompt SHALL instruct the AI to prioritize high-yield Core_Concepts and explicitly label which subtopics are essential vs. supplementary.

---

### Requirement 7: Tutor Identity and Expertise Signaling

**User Story:** As a student, I want the AI to feel like a knowledgeable tutor who is confident in the subject, so that I trust the explanations and feel I'm learning from an expert.

#### Acceptance Criteria

1. THE System_Prompt SHALL instruct the AI to present itself as a subject-matter expert with full knowledge of the curriculum for the given subject, not as a general-purpose assistant.
2. THE System_Prompt SHALL instruct the AI to proactively surface connections between the current topic and related topics in the subject, even when the user has not asked for them.
3. THE System_Prompt SHALL instruct the AI to correct factual misunderstandings in the user's messages directly and clearly, with an explanation of the correct concept.
4. WHEN the user asks a question the AI cannot answer with certainty, THE System_Prompt SHALL instruct the AI to clearly distinguish between established knowledge and uncertainty, rather than generating plausible-sounding but unverified content.
5. THE System_Prompt SHALL instruct the AI to never respond with "that's a great question" or similar filler phrases, and to proceed directly to the substantive answer.
