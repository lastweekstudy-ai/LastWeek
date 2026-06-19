# AI Feature Audit - 2026-06-18

## Updated In This Pass

- Session creation now uses curriculum-aware smart suggestions without the native browser datalist dropdown.
- Suggestions are not random. They are scored from the selected country, curriculum, class, track, weak subjects when present, typed topic text, and the freeform study brief.
- A universal `University / Open Study` curriculum is available for every country. It supports undergraduate, postgraduate, professional, research, and self-study users without requiring country-specific university datasets.
- Exam Planner now suggests curriculum-aware topics and stores selected suggestions inside the existing `topics` JSON payload, so no Appwrite schema migration is required.
- Audio transcription now forwards an optional language hint to the Appwrite AI proxy and Groq Whisper.
- Audio lecture notes now include student profile context and generate notes in the selected study language.
- A new Appwrite function archive was generated:
  `appwrite-functions/aiProxyUniversal/aiProxyUniversal_v13_curriculum_language_20260618-061221.tar.gz`

## Curriculum / AI Behavior

- Guided sessions already pass `curriculumContext` into session state.
- `buildCurriculumPromptBlock()` tells the tutor to teach from curriculum context, use the selected study language, drive the session proactively, generate visuals when helpful, and produce MCQs/flashcards/action buttons.
- PDF OCR already uses Gemini Vision for complex scripts and image-heavy pages. The current code supports multilingual PDFs through OCR, extracted text, and downstream prompt context.
- Audio now has better multilingual routing: selected study language is converted to Whisper language codes for English, Bangla/Bengali, Hindi, Spanish, French, German, and Italian.

## Appwrite

- No live Appwrite data was modified.
- No collection/table changes were required for this pass because learning profile fields are already stored as JSON and exam topics are already JSON.
- To deploy the function update, upload the new `.tar.gz` archive to the existing AI proxy function.

## Still Worth Testing Manually

- Signup and Settings profile selection for each supported country plus `University / Open Study`.
- Guided session creation suggestions after typing exam-related or university-related briefs.
- Exam Planner topic suggestions and starting a plan topic session.
- Audio upload in English, German, Italian, Bangla/Hindi where possible.
- PDF upload with non-English documents to confirm OCR and note language behavior.

## Known Build Warnings

- Vite still reports large chunks and ineffective dynamic imports. These are pre-existing bundle optimization warnings, not failures from this pass.
