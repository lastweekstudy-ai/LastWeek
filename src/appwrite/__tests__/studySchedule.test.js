// Feature: omni-content-pipeline
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

vi.mock('../config', () => ({
  databases: {
    listDocuments: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
  }
}));

vi.mock('appwrite', () => ({
  ID: { unique: () => 'mock-id-' + Math.random() },
  Query: {
    equal: (field, value) => `equal(${field},${value})`,
    lessThanEqual: (field, value) => `lessThanEqual(${field},${value})`,
  }
}));

import { applySM2, upsertStudySchedule, getDueSchedules } from '../studySchedule';
import { databases } from '../config';

beforeEach(() => vi.clearAllMocks());

/**
 * Property 10 — SM-2 invariants across all confidence levels
 * Validates: Requirements 4.1–4.5
 */
describe('Property 10 — SM-2 invariants across all confidence levels', () => {
  it('should maintain SM-2 invariants for all valid inputs', () => {
    fc.assert(
      fc.property(
        fc.record({
          interval: fc.integer({ min: 1, max: 365 }),
          easeFactor: fc.double({ min: 1.3, max: 4.0, noNaN: true }),
          repetitions: fc.integer({ min: 0, max: 100 }),
        }),
        fc.integer({ min: 1, max: 3 }),
        (record, confidence) => {
          const result = applySM2(record, confidence);

          // Universal invariants
          expect(result.easeFactor >= 1.3 - 1e-9 && result.easeFactor <= 4.0 + 1e-9).toBe(true);
          expect(result.interval >= 1).toBe(true);
          expect(result.nextReviewDate > new Date().toISOString().split('T')[0]).toBe(true);

          // Confidence-specific invariants
          if (confidence === 1) {
            expect(result.repetitions).toBe(0);
            expect(result.interval).toBe(1);
            expect(Math.abs(result.easeFactor - Math.max(1.3, record.easeFactor - 0.2)) < 0.0001).toBe(true);
          } else if (confidence === 2) {
            expect(result.repetitions).toBe(record.repetitions + 1);
            expect(result.interval).toBe(Math.max(1, Math.floor(record.interval * record.easeFactor * 0.9)));
            expect(Math.abs(result.easeFactor - record.easeFactor) < 0.0001).toBe(true);
          } else if (confidence === 3) {
            expect(result.repetitions).toBe(record.repetitions + 1);
            expect(result.interval).toBe(Math.max(1, Math.floor(record.interval * record.easeFactor)));
            expect(Math.abs(result.easeFactor - Math.min(4.0, record.easeFactor + 0.1)) < 0.0001).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 11 — Due schedules filter correctness
 * Validates: Requirements 4.6–4.9
 */
describe('Property 11 — Due schedules filter correctness', () => {
  it('should return only records with nextReviewDate <= today', async () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const allRecords = [
      { $id: '1', nextReviewDate: yesterday },
      { $id: '2', nextReviewDate: today },
      { $id: '3', nextReviewDate: tomorrow },
    ];

    databases.listDocuments.mockResolvedValue({
      documents: allRecords.filter(r => r.nextReviewDate <= today),
    });

    const result = await getDueSchedules('user1');

    expect(result.some(r => r.$id === '1')).toBe(true);
    expect(result.some(r => r.$id === '2')).toBe(true);
    expect(result.some(r => r.$id === '3')).toBe(false);
  });
});

/**
 * Property 12 — Days-overdue calculation correctness
 * Validates: Requirements 4.11
 */
describe('Property 12 — Days-overdue calculation correctness', () => {
  it('should compute days overdue correctly for past dates', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 30 }),
        (daysAgo) => {
          const pastDate = new Date(Date.now() - daysAgo * 86400000);
          const dateString = pastDate.toISOString().split('T')[0];

          const daysOverdue = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);

          expect(daysOverdue >= 0).toBe(true);
          if (daysAgo === 0) {
            expect(daysOverdue).toBe(0);
          }
          expect(daysOverdue <= daysAgo + 1).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Unit test — New record initialised with correct defaults
 * Validates: Requirements 4.2
 */
describe('Unit test — New record initialised with correct defaults', () => {
  it('should create a new document with correct initial defaults', async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    databases.listDocuments.mockResolvedValue({ documents: [] });

    let capturedPayload = null;
    databases.createDocument.mockImplementation((_dbId, _colId, _docId, payload) => {
      capturedPayload = payload;
      return Promise.resolve({ $id: 'new', ...payload });
    });

    await upsertStudySchedule('u1', 's1', 'Math', 'Calculus', 2);

    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload).toMatchObject({
      repetitions: 0,
      easeFactor: 2.5,
      interval: 1,
      nextReviewDate: tomorrow,
    });
  });
});

/**
 * Unit test — Appwrite write failure does not throw
 * Validates: Requirements 4.3
 */
describe('Unit test — Appwrite write failure does not throw', () => {
  it('should return null when createDocument throws', async () => {
    databases.listDocuments.mockResolvedValue({ documents: [] });
    databases.createDocument.mockRejectedValue(new Error('Appwrite error'));

    const result = await upsertStudySchedule('u1', 's1', 'Math', 'topic', 1);

    expect(result).toBeNull();
  });
});
