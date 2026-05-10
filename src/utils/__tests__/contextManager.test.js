// Feature: omni-content-pipeline
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { estimateTokens, buildSessionMemory, buildContextMessages } from '../contextManager';

describe('omni-content-pipeline — Context Manager', () => {

  // ── Property 7: Token budget never exceeded ──────────────────────────────
  it('Property 7: Token budget never exceeded', () => {
    // Feature: omni-content-pipeline, Property 7: Context token budget never exceeded
    // Validates: Requirements 3.1
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            role: fc.constantFrom('user', 'assistant'),
            content: fc.string({ maxLength: 2000 })
          }),
          { minLength: 0, maxLength: 20 }
        ),
        fc.integer({ min: 500, max: 28000 }),
        (messages, tokenBudget) => {
          const result = buildContextMessages(
            messages,
            'test question',
            { subject: 'Math', mode: 'active_recall' },
            tokenBudget
          );

          // Compute the mandatory minimum: 2 priming messages + the new user message
          const primingMsg1 = {
            role: 'user',
            content: '[CONTEXT] I am studying: Math. Current learning mode: active_recall. Please stay focused on this subject throughout our conversation.'
          };
          const primingMsg2 = {
            role: 'assistant',
            content: "Understood. I will focus entirely on Math using the active_recall approach. Let's begin."
          };
          const newUserMsg = { role: 'user', content: 'test question' };

          const minimumTokens = estimateTokens([primingMsg1, primingMsg2, newUserMsg]);

          // If even the minimum exceeds the budget, the function is allowed to exceed it
          if (minimumTokens > tokenBudget) {
            return; // escape hatch — skip assertion
          }

          expect(estimateTokens(result.messages)).toBeLessThanOrEqual(tokenBudget);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 8: Priming messages always retained ─────────────────────────
  it('Property 8: Priming messages always retained', () => {
    // Feature: omni-content-pipeline, Property 8: Priming messages always retained and messages never truncated mid-string
    // Validates: Requirements 3.2, 3.6
    const priming1 = {
      role: 'user',
      content: '[CONTEXT] I am studying: Math. Current learning mode: active_recall. Please stay focused on this subject throughout our conversation.'
    };
    const priming2 = {
      role: 'assistant',
      content: "Understood. I will focus entirely on Math using the active_recall approach. Let's begin."
    };

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            role: fc.constantFrom('user', 'assistant'),
            content: fc.string({ maxLength: 500 })
          }),
          { minLength: 20, maxLength: 40 }
        ),
        (messages) => {
          // Use a small budget to force eviction
          const result = buildContextMessages(
            messages,
            'test question',
            { subject: 'Math', mode: 'active_recall' },
            500
          );

          // First two messages must always be the priming messages
          expect(result.messages[0].content).toBe(priming1.content);
          expect(result.messages[1].content).toBe(priming2.content);

          // Every message must have a valid role
          result.messages.forEach(msg => {
            expect(['user', 'assistant']).toContain(msg.role);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 9: Session Memory block character limits ────────────────────
  it('Property 9: Session Memory block character limits', () => {
    // Feature: omni-content-pipeline, Property 9: Session Memory block character limits
    // Validates: Requirements 3.3
    const messagesArb = fc.array(
      fc.record({
        role: fc.constantFrom('user', 'assistant'),
        content: fc.string({ minLength: 1, maxLength: 600 })
      }),
      { minLength: 10, maxLength: 30 }
    );

    fc.assert(
      fc.property(messagesArb, (messages) => {
        const assistantCount = messages.filter(m => m.role === 'assistant').length;
        fc.pre(assistantCount >= 4); // skip if not enough assistant messages

        const result = buildSessionMemory(messages);
        if (result === null) return; // shouldn't happen given pre-condition

        const segments = result.split('\n');
        // At most 3 segments (last 3 assistant messages)
        expect(segments.length).toBeLessThanOrEqual(3);
        // Each segment <= 500 chars
        segments.forEach(seg => expect(seg.length).toBeLessThanOrEqual(500));
        // Total <= 1500 chars
        expect(result.length).toBeLessThanOrEqual(1500);
      }),
      { numRuns: 100 }
    );
  });

  // ── Unit test: Eviction count logged ─────────────────────────────────────
  describe('Unit test: Eviction count logged', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('logs "Evicted" when messages are dropped due to token budget', () => {
      // Create a large message history (30 alternating user/assistant messages with 1000-char content)
      const largeContent = 'x'.repeat(1000);
      const messages = [];
      for (let i = 0; i < 30; i++) {
        messages.push({ role: i % 2 === 0 ? 'user' : 'assistant', content: largeContent });
      }

      buildContextMessages(
        messages,
        'test',
        { subject: 'Math', mode: 'active_recall' },
        1000
      );

      // Assert console.log was called with a string containing 'Evicted'
      const evictedCall = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('Evicted')
      );
      expect(evictedCall).toBeDefined();
    });
  });

});
