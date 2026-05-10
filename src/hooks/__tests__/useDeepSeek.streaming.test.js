// Feature: omni-content-pipeline
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import fc from 'fast-check';
import useDeepSeek from '../useDeepSeek';

// Helper: build a mock SSE ReadableStream from an array of string chunks
function makeMockStream(chunks) {
  const encoder = new TextEncoder();
  const lines = [
    ...chunks.map(c => `data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`),
    'data: [DONE]\n\n'
  ].join('');

  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(lines));
      controller.close();
    }
  });
}

describe('useDeepSeek — streaming (Phase 2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Property 5 — Streaming assembly invariant
  // Feature: omni-content-pipeline, Property 5: Streaming assembly invariant
  // -------------------------------------------------------------------------
  it('Property 5: assembled result equals chunks.join("") for any chunk sequence', async () => {
    // Validates: Requirements 2.2, 2.3
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 20 }),
        async (chunks) => {
          global.fetch = vi.fn(() =>
            Promise.resolve({
              ok: true,
              body: makeMockStream(chunks)
            })
          );

          const { result } = renderHook(() => useDeepSeek());
          const assembled = await result.current.askStream('system', [], vi.fn());

          expect(assembled).toBe(chunks.join(''));
        }
      ),
      { numRuns: 50 }
    );
  });

  // -------------------------------------------------------------------------
  // Unit test — Retry fires at most 2 times
  // -------------------------------------------------------------------------
  it('retries at most 2 times on network error (3 total fetch calls)', async () => {
    // Set up fake timers BEFORE the mock so no real timers fire
    vi.useFakeTimers();

    // Use mockImplementation so each call returns a new rejected promise
    // that is immediately attached to the chain inside askStream
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.reject(new Error('Failed to fetch'))
    );

    const { result } = renderHook(() => useDeepSeek());

    // Start the call — it will fail and schedule retries via setTimeout.
    // Attach a no-op catch immediately so the rejection is never "unhandled"
    // from Vitest's perspective while timers are being advanced.
    const promise = result.current.askStream('system', [], vi.fn());
    promise.catch(() => {}); // prevent unhandled-rejection noise

    // Advance all pending timers (the 2 × 2-second retry delays)
    await vi.runAllTimersAsync();

    // The promise should ultimately reject after 3 attempts
    await expect(promise).rejects.toThrow('Failed to fetch');
    expect(global.fetch).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Unit test — [DONE] sentinel closes the stream
  // -------------------------------------------------------------------------
  it('[DONE] sentinel causes the stream to resolve with the chunk content', async () => {
    const chunk = 'hello world';
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        body: makeMockStream([chunk])
      })
    );

    const { result } = renderHook(() => useDeepSeek());
    const assembled = await result.current.askStream('system', [], vi.fn());

    expect(assembled).toBe(chunk);
  });

  // -------------------------------------------------------------------------
  // Unit test — Malformed JSON chunk is skipped (does not throw)
  // -------------------------------------------------------------------------
  it('skips malformed JSON chunks and assembles only valid content', async () => {
    const encoder = new TextEncoder();
    // Build a stream with: valid chunk, malformed chunk, [DONE]
    const lines = [
      `data: ${JSON.stringify({ choices: [{ delta: { content: 'hello' } }] })}\n\n`,
      'data: {invalid json}\n\n',
      'data: [DONE]\n\n'
    ].join('');

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(lines));
            controller.close();
          }
        })
      })
    );

    const { result } = renderHook(() => useDeepSeek());
    const assembled = await result.current.askStream('system', [], vi.fn());

    // Malformed chunk is skipped; only 'hello' is assembled
    expect(assembled).toBe('hello');
  });
});
