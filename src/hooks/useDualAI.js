import { useState } from 'react';
import { useGemini } from './useGemini';
import useDeepSeek from './useDeepSeek';

/**
 * Dual-AI System Hook
 * 
 * Gemini: Handles visual analysis (charts, tables, graphs, images in PDFs)
 * DeepSeek: Handles text reasoning and response generation
 * 
 * Workflow:
 * 1. Gemini analyzes visual content and extracts structured data
 * 2. Gemini breaks down visuals into text/data for DeepSeek
 * 3. DeepSeek analyzes the content and formulates responses
 * 4. Both AIs collaborate based on their strengths
 */
export const useDualAI = () => {
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState(''); // Track which AI is working
  const { processImage, processDocument } = useGemini();
  const { ask: askDeepSeek } = useDeepSeek();

  /**
   * Process PDF with complex visuals using dual-AI approach
   * @param {File} pdfFile - The PDF file object
   * @param {string} extractedText - Text extracted from PDF
   * @param {string} studyMode - Current study mode (mental_model, active_recall, etc.)
   * @param {string} subject - Subject being studied
   * @returns {Promise<string>} - Combined analysis from both AIs
   */
  const processPDFWithVisuals = async (pdfFile, extractedText, studyMode, subject) => {
    setProcessing(true);
    
    try {
      // Stage 1: Gemini analyzes the PDF for visual content
      setStage('gemini-visual-analysis');
      console.log('[Dual-AI] Stage 1: Gemini analyzing visuals...');
      
      const geminiPrompt = `Analyze this PDF content and identify ALL visual elements (charts, tables, graphs, diagrams, images).

For EACH visual element you find:
1. Describe what type of visual it is (bar chart, line graph, table, diagram, etc.)
2. Extract ALL data points, labels, and values
3. Explain what the visual is showing
4. Convert the visual into structured text/data that can be understood without seeing it

PDF Content:
${extractedText}

Format your response as:
VISUAL 1: [Type]
Data: [Extracted data points]
Description: [What it shows]
Key Insights: [Important patterns or findings]

VISUAL 2: [Type]
...

If there are NO visual elements, respond with: "NO_VISUALS_FOUND"

Be thorough - extract every chart, table, graph, and diagram you can identify.`;

      const geminiAnalysis = await processDocument(extractedText, geminiPrompt);
      console.log('[Dual-AI] Gemini visual analysis complete');

      // Stage 2: Gemini breaks down visuals for DeepSeek
      setStage('gemini-breakdown');
      console.log('[Dual-AI] Stage 2: Gemini breaking down visuals for DeepSeek...');
      
      let visualBreakdown = '';
      if (!geminiAnalysis.includes('NO_VISUALS_FOUND')) {
        const breakdownPrompt = `You previously identified visual elements in a PDF. Now convert them into a format that a text-only AI can understand and work with.

Your visual analysis:
${geminiAnalysis}

Create a detailed text breakdown that includes:
1. All data points in list or table format
2. Clear descriptions of relationships and patterns
3. Key insights that would be obvious from seeing the visual
4. Any trends, comparisons, or correlations shown

Make it so detailed that someone who cannot see the visuals can fully understand the data.`;

        visualBreakdown = await processDocument(geminiAnalysis, breakdownPrompt);
        console.log('[Dual-AI] Gemini breakdown complete');
      } else {
        visualBreakdown = 'This PDF contains primarily text content without complex visual elements.';
      }

      // Stage 3: DeepSeek analyzes and formulates response
      setStage('deepseek-analysis');
      console.log('[Dual-AI] Stage 3: DeepSeek analyzing content...');
      
      const deepseekSystemPrompt = `You are an expert tutor in ${subject} using ${studyMode} mode.

You have received a PDF that has been pre-analyzed by a visual AI (Gemini). The visual AI has:
1. Identified all charts, tables, graphs, and diagrams
2. Extracted all data points and values
3. Described patterns and relationships
4. Converted visuals into structured text

Your job is to:
1. Analyze the content (both text and visual data)
2. Provide educational insights based on your expertise
3. Answer questions or explain concepts
4. Use the visual data to enhance your explanations

VISUAL ANALYSIS FROM GEMINI:
${visualBreakdown}

ORIGINAL PDF TEXT:
${extractedText.substring(0, 50000)}

Now provide your analysis and help the student learn this content effectively.`;

      const deepseekResponse = await askDeepSeek(deepseekSystemPrompt, [
        { role: 'user', content: 'Please analyze this PDF content and help me understand it.' }
      ]);
      
      console.log('[Dual-AI] DeepSeek analysis complete');

      // Stage 4: Combine insights
      setStage('combining');
      console.log('[Dual-AI] Stage 4: Combining AI insights...');
      
      const combinedResponse = `${deepseekResponse}`;

      return combinedResponse;

    } catch (error) {
      console.error('[Dual-AI] Error:', error);
      throw new Error(`Dual-AI processing failed at stage ${stage}: ${error.message}`);
    } finally {
      setProcessing(false);
      setStage('');
    }
  };

  /**
   * Process image with dual-AI approach
   * @param {string} imageBase64 - Base64 encoded image
   * @param {string} studyMode - Current study mode
   * @param {string} subject - Subject being studied
   * @returns {Promise<string>} - Combined analysis
   */
  const processImageWithDualAI = async (imageBase64, studyMode, subject) => {
    setProcessing(true);
    
    try {
      // Stage 1: Gemini analyzes the image
      setStage('gemini-image-analysis');
      console.log('[Dual-AI] Gemini analyzing image...');
      
      const geminiPrompt = `Analyze this image in detail. Identify:
1. Any charts, graphs, or data visualizations
2. Tables with data
3. Diagrams or flowcharts
4. Text content
5. Mathematical formulas or equations
6. Any other educational content

Extract ALL data points, labels, and values. Describe relationships and patterns.`;

      const geminiAnalysis = await processImage(imageBase64, geminiPrompt);
      console.log('[Dual-AI] Gemini image analysis complete');

      // Stage 2: DeepSeek provides educational insights
      setStage('deepseek-analysis');
      console.log('[Dual-AI] DeepSeek analyzing content...');
      
      const deepseekSystemPrompt = `You are an expert tutor in ${subject} using ${studyMode} mode.

An image has been analyzed by Gemini (visual AI). Here's what it found:

${geminiAnalysis}

Your job is to:
1. Explain the concepts shown in the image
2. Provide educational insights
3. Help the student understand and learn from this content
4. Use the visual data to enhance your explanations`;

      const deepseekResponse = await askDeepSeek(deepseekSystemPrompt, [
        { role: 'user', content: 'Please help me understand this image content.' }
      ]);
      
      console.log('[Dual-AI] DeepSeek analysis complete');

      const combinedResponse = `${deepseekResponse}`;

      return combinedResponse;

    } catch (error) {
      console.error('[Dual-AI] Error:', error);
      throw new Error(`Dual-AI image processing failed: ${error.message}`);
    } finally {
      setProcessing(false);
      setStage('');
    }
  };

  /**
   * Ask a question about previously analyzed content
   * @param {string} question - User's question
   * @param {string} context - Previously analyzed content
   * @param {string} studyMode - Current study mode
   * @param {string} subject - Subject being studied
   * @returns {Promise<string>} - DeepSeek's response
   */
  const askAboutContent = async (question, context, studyMode, subject) => {
    setProcessing(true);
    setStage('deepseek-response');
    
    try {
      const systemPrompt = `You are an expert tutor in ${subject} using ${studyMode} mode.

You have access to content that was previously analyzed by Gemini (visual AI):

${context}

Answer the student's questions based on this content and your expertise.`;

      const response = await askDeepSeek(systemPrompt, [
        { role: 'user', content: question }
      ]);
      
      return response;

    } catch (error) {
      console.error('[Dual-AI] Error:', error);
      throw error;
    } finally {
      setProcessing(false);
      setStage('');
    }
  };

  return {
    processPDFWithVisuals,
    processImageWithDualAI,
    askAboutContent,
    processing,
    stage
  };
};

export default useDualAI;
