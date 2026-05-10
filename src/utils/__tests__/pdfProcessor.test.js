// Feature: omni-content-pipeline
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { computeGarbageRatio, classifyPage, wrapPageContent, extractText } from '../pdfProcessor';

// ─── Mock pdfjs-dist ──────────────────────────────────────────────────────────
// pdfProcessor.js uses `import * as pdfjsLib from 'pdfjs-dist'` and calls
// pdfjsLib.getDocument(...) and pdfjsLib.GlobalWorkerOptions.workerSrc.
// The mock must export both as named exports on the module namespace.
vi.mock('pdfjs-dist', () => {
  const getDocument = vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 3,
      getPage: vi.fn(async (n) => ({
        getTextContent: async () => ({
          items: n === 1 ? [{ str: 'Hello world' }] : []
        }),
        getViewport: () => ({ width: 100, height: 100 }),
        render: () => ({ promise: Promise.reject(new Error('canvas not available')) })
      }))
    })
  }));

  return {
    // Named exports (accessed via `import * as pdfjsLib`)
    getDocument,
    GlobalWorkerOptions: { workerSrc: '' },
    // Also provide a default export for any default-import consumers
    default: {
      getDocument,
      GlobalWorkerOptions: { workerSrc: '' },
    },
  };
});

// ─── Property 1: Page classification correctness ──────────────────────────────
describe('Property 1: Page classification correctness', () => {
  it('classifyPage returns bad iff items is empty OR joined text is empty OR garbageRatio > threshold', () => {
    // Feature: omni-content-pipeline, Property 1: Page classification correctness
    //
    // classifyPage returns 'bad' when:
    //   1. textItems.length === 0  (empty array)
    //   2. textItems.join('').length === 0  (array of empty strings)
    //   3. computeGarbageRatio(joined) > threshold
    // Otherwise returns 'good'.
    fc.assert(
      fc.property(
        fc.array(fc.string()),
        fc.float({ min: 0, max: 1, noNaN: true }),
        (items, threshold) => {
          const result = classifyPage(items, threshold);
          const joined = items.join('');
          const isEmpty = items.length === 0;
          const joinedEmpty = joined.length === 0;
          const ratio = computeGarbageRatio(joined);
          const expectedBad = isEmpty || joinedEmpty || ratio > threshold;
          expect(result).toBe(expectedBad ? 'bad' : 'good');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 2: Page content wrapper format ──────────────────────────────────
describe('Property 2: Page content wrapper format', () => {
  it('wrapPageContent starts/ends with correct markers and contains content verbatim', () => {
    // Feature: omni-content-pipeline, Property 2: Page content wrapper format
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }),
        fc.string(),
        (pageNum, content) => {
          const result = wrapPageContent(pageNum, content);
          expect(result.startsWith(`=== PAGE ${pageNum} ===`)).toBe(true);
          expect(result.endsWith(`=== END PAGE ${pageNum} ===`)).toBe(true);
          expect(result.includes(content)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 3: Progress callback invoked exactly once per page ──────────────
describe('Property 3: Progress callback invoked exactly once per page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('onProgress is called exactly 3 times with pageNum 1, 2, 3 in order', async () => {
    // Feature: omni-content-pipeline, Property 3: Progress callback invoked exactly once per page
    //
    // The mock at the top of this file sets up a 3-page PDF:
    //   Page 1: good text items [{ str: 'Hello world' }]
    //   Page 2: bad (empty items), render rejects → placeholder path
    //   Page 3: bad (empty items), render rejects → placeholder path
    //
    // In jsdom, document.createElement('canvas') exists but getContext returns null,
    // so the canvas render path will fail and the placeholder is used.
    const onProgress = vi.fn();
    const processImage = vi.fn().mockResolvedValue('# Markdown content');

    await extractText(new ArrayBuffer(0), {
      onProgress,
      processImage,
      garbageThreshold: 0.3,
    });

    expect(onProgress).toHaveBeenCalledTimes(3);

    const calls = onProgress.mock.calls.map(([arg]) => arg);
    expect(calls[0].pageNum).toBe(1);
    expect(calls[1].pageNum).toBe(2);
    expect(calls[2].pageNum).toBe(3);
  });
});

// ─── Property 4: All-placeholder PDF throws ───────────────────────────────────
describe('Property 4: All-placeholder PDF throws', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extractText throws with "no readable content" when all pages are placeholders', async () => {
    // Feature: omni-content-pipeline, Property 4: All-placeholder PDF throws
    //
    // Override the default mock for this test: 2-page PDF, both pages have empty
    // text items and processImage rejects immediately → both pages become placeholders.
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.getDocument.mockReturnValueOnce({
      promise: Promise.resolve({
        numPages: 2,
        getPage: vi.fn(async () => ({
          getTextContent: async () => ({ items: [] }),
          getViewport: () => ({ width: 100, height: 100 }),
          render: () => ({ promise: Promise.reject(new Error('canvas not available')) })
        }))
      })
    });

    const processImage = vi.fn().mockRejectedValue(new Error('vision failed'));

    await expect(
      extractText(new ArrayBuffer(0), {
        onProgress: vi.fn(),
        processImage,
        garbageThreshold: 0.3,
      })
    ).rejects.toThrow('no readable content');
  });
});
