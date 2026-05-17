import { useState } from 'react';
import { useSession as useSessionContext } from '../context/SessionContext';
import useDeepSeek from './useDeepSeek';
import { useGemini } from './useGemini';
import { getPromptForMode } from '../utils/promptBuilder';
import { buildContextMessages } from '../utils/contextManager';
import { saveSessionSummary } from '../appwrite/database';
import { processAIResponse, addChartWarningIfNeeded } from '../utils/chartFixer';

// File content markers that indicate processed file content
const FILE_MARKERS = [
  '[PDF processed:',
  '[Image analyzed:',
  '[Text file processed:',
  '[File processed:',
  '[Document analyzed:',
  'PDF Content:',
  'Image analysis:',
  'Document Analysis:',
  'File content analysis:'
  // NOTE: '[STUDY MODE:' is intentionally excluded — study mode PDF context
  // goes straight to DeepSeek with a focused page extract, no Gemini pre-analysis.
];

const hasFileContent = (message) => {
  if (!message) return false;
  return FILE_MARKERS.some(marker => message.includes(marker));
};

const isStudyMode = (message) => {
  return message?.includes('[STUDY MODE:');
};

const useSession = () => {
  const sessionContext = useSessionContext();
  const { ask: askDeepSeek, askStream } = useDeepSeek();
  const { processDocument } = useGemini();
  const [isAnalysing, setIsAnalysing] = useState(false);

  const sendMessageWithAI = async (aiContextMessage, persona = null, userDisplayMessage = null, fileAttachment = null) => {
    const { activeSession, messages } = sessionContext;
    
    if (!activeSession) {
      throw new Error('No active session');
    }

    const messageToSave = userDisplayMessage || aiContextMessage;

    // Load session context for student profile injection
    let sessionCtx = null;
    try {
      const { getSessionContext } = await import('../appwrite/sessionContext');
      sessionCtx = await getSessionContext(activeSession.$id, activeSession.userId);
    } catch (e) {
      // Non-fatal — fall back to default depth
      console.warn('[useSession] Could not load session context for prompt:', e.message);
    }

    // Build system prompt for current mode — now includes student profile
    const systemPrompt = getPromptForMode(
      activeSession.mode, 
      activeSession.subject, 
      persona,
      sessionCtx
    );

    // ── ROUTING ──────────────────────────────────────────────────────────────
    // Study mode (PDF open in split view): extract only the relevant page(s)
    //   and send directly to DeepSeek — no Gemini pre-analysis needed.
    //   The full 43k PDF text would exceed context limits and cause silent failures.
    //
    // Regular file upload (image / text / PDF attachment via chat):
    //   Run Gemini pre-analysis first, then pass structured summary to DeepSeek.
    // ─────────────────────────────────────────────────────────────────────────

    let finalContextMessage = aiContextMessage;
    let requestedPage = null;
    let fullText = null;

    // ── Handle passthrough messages (no AI needed) ───────────────────────────
    if (aiContextMessage.includes('[SYSTEM WARNING]')) {
      const warningMatch = aiContextMessage.match(/\[SYSTEM WARNING\]\n([\s\S]*?)\n\nUser asked:/);
      if (warningMatch) return warningMatch[1].trim();
    }

    if (aiContextMessage.includes('[NO PDF TEXT AVAILABLE]')) {
      const noTextMatch = aiContextMessage.match(/\[NO PDF TEXT AVAILABLE\]\n([\s\S]*?)\n\nUser asked:/);
      if (noTextMatch) return noTextMatch[1].trim();
    }

    // ── Study mode: focused page extraction, straight to DeepSeek ────────────
    if (isStudyMode(aiContextMessage)) {
      const parts = aiContextMessage.split('\nUser Question:');
      const studyHeader = parts[0] || aiContextMessage;
      const userQuestion = parts[1]?.trim() || aiContextMessage;

      const pageMatch = userQuestion.match(/page\s+(\d+)/i) || 
                        studyHeader.match(/currently on page (\d+)/i);
      requestedPage = pageMatch ? parseInt(pageMatch[1]) : null;

      const fullTextMatch = studyHeader.match(/COMPLETE DOCUMENT TEXT:\n([\s\S]*)/);
      fullText = fullTextMatch ? fullTextMatch[1] : null;

      const headerEndIndex = studyHeader.indexOf('COMPLETE DOCUMENT TEXT:');
      const metaHeader = headerEndIndex > -1 
        ? studyHeader.substring(0, headerEndIndex).trim() 
        : studyHeader.substring(0, 1000);

      finalContextMessage = `${metaHeader}

User Question: ${userQuestion}`;
    }
    // ── Regular file upload: Gemini pre-analysis → DeepSeek ──────────────────
    else if (hasFileContent(aiContextMessage)) {
      const lockedPdfMatch = aiContextMessage.match(/\[LOCKED PDF CONTEXT - ONLY USE THIS PDF\]\s*PDF Name: "([^"]+)"/);
      const lockedPdfName = lockedPdfMatch ? lockedPdfMatch[1] : null;

      setIsAnalysing(true);
      try {
        const parts = aiContextMessage.split('\nUser Question:');
        const fileContent = parts[0] || aiContextMessage;
        const userQuestion = parts[1]?.trim() || 'Please analyze this content and help me study it.';

        const pageMatch = userQuestion.match(/page\s+(\d+)/i);
        const lineMatch = userQuestion.match(/line\s+(\d+)/i);

        const geminiPrompt = `You are a content extraction specialist. Analyze the following content and extract:

${lockedPdfName ? `CRITICAL: Only answer about "${lockedPdfName}".` : ''}

1. KEY CONCEPTS: List the main topics and concepts
2. VISUAL DATA: Identify any charts, tables, graphs, diagrams, or numerical data
3. STRUCTURED SUMMARY: Organize the content into clear sections
4. STUDY POINTS: Extract the most important facts for studying
5. DATA FOR CHARTS: If there is numerical data, format it as JSON arrays ready for visualization
${pageMatch ? `6. PAGE ${pageMatch[1]} CONTENT: Extract and quote the exact content of page ${pageMatch[1]}` : ''}

Content to analyze:
${fileContent.substring(0, 50000)}

Format your response as structured text that another AI can use to answer educational questions.`;

        const geminiAnalysis = await processDocument(
          fileContent.substring(0, 50000), 
          geminiPrompt
        );

        finalContextMessage = `GEMINI PRE-ANALYSIS:
${geminiAnalysis}

ORIGINAL CONTENT (truncated):
${fileContent.substring(0, 10000)}

USER QUESTION: ${userQuestion}

Instructions: Use the Gemini analysis above to provide a comprehensive, educational response using the ${activeSession.mode} teaching approach. ${pageMatch || lineMatch ? 'CRITICAL: The user asked about a specific page/line — quote the exact text from that location.' : ''}`;

      } catch (geminiError) {
        console.warn('[useSession] Gemini pre-analysis failed, using DeepSeek only:', geminiError.message);
        // Cap the context to avoid DeepSeek token limit
        finalContextMessage = aiContextMessage.substring(0, 15000);
      } finally {
        setIsAnalysing(false);
      }
    }

    const { messages: contextualMessages } = buildContextMessages(
      messages,
      finalContextMessage,
      activeSession,
      28000,
      { currentPage: requestedPage, pageContext: fullText }
    );

    try {
      const result = await sessionContext.sendMessageStreaming(
        messageToSave,
        async (onChunk) => {
          const response = await askStream(systemPrompt, contextualMessages, onChunk);
          // Post-process response to fix malformed chart data
          const fixedResponse = processAIResponse(response);
          const finalResponse = addChartWarningIfNeeded(fixedResponse);
          return finalResponse;
        },
        fileAttachment
      );
      return result;
    } catch (error) {
      console.error('[useSession] Error in sendMessageStreaming:', error);
      throw error;
    }
  };

  const generateAndSaveSummary = async () => {
    const { activeSession, messages } = sessionContext;
    if (!activeSession || messages.length < 2) return null;

    const recentMessages = messages.slice(-20);
    const conversationText = recentMessages
      .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content.substring(0, 300)}`)
      .join('\n');

    const summaryPrompt = `You are summarizing a study session. Based on this conversation, write a concise 3-line summary in this exact format:

✅ Covered: [what topics/concepts were taught]
⚠️ Gaps: [what the student struggled with or didn't fully grasp, or "None identified"]
📌 Next: [what to study next or review]

Keep each line under 15 words. Be specific, not generic.

Conversation:
${conversationText}`;

    try {
      const summary = await askDeepSeek(summaryPrompt, [
        { role: 'user', content: 'Generate the session summary now.' }
      ]);
      if (summary && activeSession.$id) {
        await saveSessionSummary(activeSession.$id, summary);
      }
      return summary;
    } catch (err) {
      console.error('[useSession] Failed to generate summary:', err.message);
      return null;
    }
  };

  return {
    ...sessionContext,
    sendMessageWithAI,
    isAnalysing,
    generateAndSaveSummary,
  };
};

export default useSession;
