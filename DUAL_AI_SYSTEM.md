# Dual-AI System: Gemini + DeepSeek Collaboration

## Overview

The application now uses a **Dual-AI System** where Gemini and DeepSeek work together, each contributing based on their unique strengths:

- **Gemini AI**: Vision-capable, analyzes charts, tables, graphs, diagrams, and images
- **DeepSeek AI**: Text reasoning expert, provides educational insights and explanations

## How It Works

### Workflow for PDFs with Complex Visuals

```
1. USER UPLOADS PDF
   ↓
2. EXTRACT TEXT from PDF
   ↓
3. GEMINI ANALYZES VISUALS
   • Identifies all charts, tables, graphs, diagrams
   • Extracts data points, labels, values
   • Describes patterns and relationships
   ↓
4. GEMINI BREAKS DOWN FOR DEEPSEEK
   • Converts visuals into structured text/data
   • Creates detailed descriptions
   • Explains trends and correlations
   ↓
5. DEEPSEEK ANALYZES CONTENT
   • Reads text + visual breakdown
   • Provides educational insights
   • Formulates study-focused responses
   ↓
6. COMBINED RESPONSE
   • Visual analysis from Gemini
   • Educational insights from DeepSeek
   • Ready for student interaction
```

### Workflow for Images

```
1. USER UPLOADS IMAGE
   ↓
2. GEMINI ANALYZES IMAGE
   • Identifies charts, graphs, diagrams
   • Extracts text and formulas
   • Describes visual elements
   ↓
3. DEEPSEEK PROVIDES INSIGHTS
   • Explains concepts shown
   • Provides educational context
   • Helps student understand
   ↓
4. COMBINED RESPONSE
   • Visual analysis + Educational insights
```

## AI Responsibilities

### Gemini's Role (Visual Expert)

**What Gemini Does:**
- Analyzes images, charts, tables, graphs, diagrams
- Extracts data points and values
- Identifies patterns and relationships
- Converts visuals into text descriptions
- Handles PDFs with complex visual elements

**Example Gemini Output:**
```
VISUAL 1: Bar Chart
Data: 
- Soviet Union: 26.6 million deaths
- China: 20.0 million deaths
- Germany: 7.4 million deaths
Description: Comparing WWII casualties by country
Key Insights: Soviet Union had highest casualties, over 3x more than Germany

VISUAL 2: Line Graph
Data: Time (0s, 1s, 2s, 3s) vs Velocity (20, 10, 0, -10 m/s)
Description: Shows velocity decreasing linearly over time
Key Insights: Constant deceleration, velocity becomes negative after 2 seconds
```

### DeepSeek's Role (Reasoning Expert)

**What DeepSeek Does:**
- Analyzes text content
- Provides educational explanations
- Answers student questions
- Uses visual data from Gemini to enhance explanations
- Applies study mode strategies (mental models, active recall, etc.)

**Example DeepSeek Output:**
```
Based on the visual data showing WWII casualties:

The Soviet Union's massive casualties (26.6 million) reflect several factors:
1. Eastern Front was the largest theater of war
2. Siege of Leningrad lasted 872 days
3. Scorched earth tactics affected civilians
4. German invasion covered vast territory

This data helps us understand why the Soviet contribution to Allied victory 
was so significant, despite often being underrepresented in Western narratives.

Think of it like this: If WWII casualties were a pie chart, the Soviet Union 
would be nearly half the pie - that's how devastating the Eastern Front was.
```

## Implementation

### New Hook: `useDualAI.js`

Located at: `lastweek/src/hooks/useDualAI.js`

**Functions:**

1. **`processPDFWithVisuals(pdfFile, extractedText, studyMode, subject)`**
   - Processes PDFs using both AIs
   - Returns combined analysis
   - Handles fallback if Dual-AI fails

2. **`processImageWithDualAI(imageBase64, studyMode, subject)`**
   - Processes images using both AIs
   - Returns combined analysis
   - Handles fallback to Gemini-only

3. **`askAboutContent(question, context, studyMode, subject)`**
   - Allows DeepSeek to answer questions about previously analyzed content
   - Uses Gemini's visual analysis as context

### Updated Components

**FileAttachment.jsx**
- Now uses `useDualAI` hook
- Automatically applies Dual-AI to PDFs and images
- Falls back to Gemini-only if Dual-AI fails
- Receives `studyMode` and `subject` props

**ChatInterface.jsx**
- Passes `studyMode` and `subject` to FileAttachment
- Enables context-aware file processing

**Mode Pages (MentalModel.jsx, etc.)**
- Pass `subject` from session to ChatInterface
- Ensures Dual-AI knows the study context

## Benefits

### For Students

1. **Better Visual Understanding**
   - Charts and graphs are fully explained
   - Data points are extracted and analyzed
   - Patterns are identified automatically

2. **Comprehensive Analysis**
   - Visual elements + text content analyzed together
   - No information lost from complex PDFs
   - Educational insights tailored to study mode

3. **Seamless Experience**
   - Automatic detection of visual content
   - No manual description needed
   - Works with any PDF or image

### For Learning

1. **Charts & Graphs**
   - Gemini extracts all data points
   - DeepSeek explains trends and patterns
   - Student gets both data and insights

2. **Tables**
   - Gemini converts to structured data
   - DeepSeek explains relationships
   - Easy to understand and remember

3. **Diagrams**
   - Gemini describes visual structure
   - DeepSeek explains concepts
   - Student understands the big picture

## Example Use Cases

### Use Case 1: Economics PDF with Charts

**Student uploads:** PDF with GDP growth charts

**Gemini analyzes:**
```
VISUAL 1: Line Chart - GDP Growth 2010-2020
Data: 2010: $14.5T, 2015: $18.2T, 2020: $21.4T
Pattern: Steady growth with dip in 2020
```

**DeepSeek explains:**
```
The GDP growth chart shows consistent economic expansion from 2010-2019, 
averaging about 2.5% annually. The 2020 dip reflects COVID-19 impact.

Think of GDP like a company's revenue - steady growth indicates a healthy 
economy, while the 2020 drop shows how external shocks can disrupt growth.
```

### Use Case 2: Physics PDF with Velocity Graph

**Student uploads:** PDF with velocity vs time graph

**Gemini analyzes:**
```
VISUAL 1: Line Graph - Velocity vs Time
Data: (0s, 20m/s), (1s, 10m/s), (2s, 0m/s), (3s, -10m/s), (4s, -20m/s)
Pattern: Linear decrease, constant slope
```

**DeepSeek explains:**
```
This graph shows constant deceleration (negative acceleration). The velocity 
decreases by 10 m/s every second, indicating uniform deceleration of -10 m/s².

At t=2s, velocity is zero - this is the turning point. After this, velocity 
becomes negative, meaning the object is moving in the opposite direction.

Real-world analogy: Like a ball thrown upward - it slows down, stops at the 
peak, then falls back down (negative velocity).
```

### Use Case 3: History PDF with Casualty Table

**Student uploads:** PDF with WWII casualties table

**Gemini analyzes:**
```
VISUAL 1: Table - WWII Deaths by Country
Data:
- Soviet Union: 26.6 million
- China: 20.0 million  
- Germany: 7.4 million
- Poland: 5.9 million
- Japan: 3.1 million
```

**DeepSeek explains:**
```
This data reveals the true scale of WWII's Eastern Front. The Soviet Union's 
casualties were nearly 4x higher than Germany's, showing the brutal nature 
of the Eastern campaign.

To put this in perspective: If you lined up all WWII casualties, roughly 
40% would be Soviet citizens. This helps explain why Victory Day (May 9) 
is such a significant holiday in Russia.
```

## Fallback Behavior

If Dual-AI processing fails, the system automatically falls back to:

1. **Gemini-only mode**: Gemini analyzes everything
2. **Text extraction**: Basic text extraction without AI
3. **Manual input**: User can paste content manually

This ensures the system always works, even if one AI is unavailable.

## Console Logging

The Dual-AI system provides detailed console logs:

```
[Dual-AI] Stage 1: Gemini analyzing visuals...
[Dual-AI] Gemini visual analysis complete
[Dual-AI] Stage 2: Gemini breaking down visuals for DeepSeek...
[Dual-AI] Gemini breakdown complete
[Dual-AI] Stage 3: DeepSeek analyzing content...
[Dual-AI] DeepSeek analysis complete
[Dual-AI] Stage 4: Combining AI insights...
```

This helps debug issues and understand the processing flow.

## Future Enhancements

Potential improvements:

1. **Page-by-page analysis**: Analyze each PDF page separately for better accuracy
2. **Interactive visuals**: Allow students to interact with extracted charts
3. **Visual comparison**: Compare charts across multiple PDFs
4. **OCR integration**: Better text extraction from scanned PDFs
5. **Math formula recognition**: Specialized handling for mathematical content

## Technical Details

### API Calls

For each PDF with visuals:
- 2-3 Gemini API calls (visual analysis + breakdown)
- 1 DeepSeek API call (educational insights)

For each image:
- 1 Gemini API call (image analysis)
- 1 DeepSeek API call (educational insights)

### Performance

- PDF processing: 10-30 seconds (depending on size)
- Image processing: 5-15 seconds
- Fallback to Gemini-only: 5-10 seconds

### Error Handling

- Network errors: Automatic retry with fallback
- API errors: Graceful degradation to simpler analysis
- Timeout errors: Clear error messages with retry option

## Configuration

No additional configuration needed! The Dual-AI system uses existing API keys:

- `VITE_GEMINI_API_KEY` - Already configured
- `VITE_DEEPSEEK_API_KEY` - Already configured

The system automatically detects when to use Dual-AI based on file type and content.

## Summary

The Dual-AI system combines the best of both worlds:
- **Gemini's vision capabilities** for analyzing complex visuals
- **DeepSeek's reasoning abilities** for educational insights

This creates a powerful learning experience where students can upload any PDF or image with charts, tables, and graphs, and receive comprehensive analysis that helps them understand and learn the content effectively.
