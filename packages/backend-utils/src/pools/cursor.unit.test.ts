import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cursorPool } from './cursor';
import { AggregationCursor } from 'mongodb';
import type { queueAsPromised } from 'fastq';

vi.mock('fastq', () => ({
  promise: vi.fn(),
}));

import * as fastq from 'fastq';

describe.concurrent('cursorPool function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('processes documents from cursor concurrently', async () => {
    const mockCursor = {
      [Symbol.asyncIterator]: vi.fn().mockImplementation(function* () {
        yield { id: 1 };
        yield { id: 2 };
        yield { id: 3 };
      }),
    } as unknown as AggregationCursor<{ id: number }>;

    const mockProcess = vi.fn().mockImplementation(() => Promise.resolve());
    const mockQueue = {
      push: vi.fn().mockResolvedValue(undefined),
      drained: vi.fn().mockResolvedValue(undefined),
      error: vi.fn(),
    } as unknown as queueAsPromised<{ id: number }>;

    (fastq.promise as jest.Mock).mockReturnValue(mockQueue);

    await cursorPool({
      cursor: mockCursor,
      concurrency: 2,
      process: mockProcess,
    });

    expect(mockQueue.push).toHaveBeenCalledTimes(3);
    expect(mockQueue.push).toHaveBeenCalledWith({ id: 1 });
    expect(mockQueue.push).toHaveBeenCalledWith({ id: 2 });
    expect(mockQueue.push).toHaveBeenCalledWith({ id: 3 });
    expect(mockQueue.drained).toHaveBeenCalledTimes(1);
  });

  it('handles errors with onError callback', async () => {
    const mockCursor = {
      [Symbol.asyncIterator]: vi.fn().mockImplementation(function* () {
        yield { id: 1 };
      }),
    } as unknown as AggregationCursor<{ id: number }>;

    const mockProcess = vi.fn().mockRejectedValue(new Error('Process error'));
    const mockOnError = vi.fn();
    const mockQueue = {
      push: vi.fn(),
      drained: vi.fn().mockResolvedValue(undefined),
      error: vi.fn(),
    };

    vi.spyOn(fastq, 'promise').mockReturnValue(mockQueue as any);

    await cursorPool({
      cursor: mockCursor,
      concurrency: 1,
      process: mockProcess,
      onError: mockOnError,
    });

    expect(mockQueue.error).toBeDefined();
    const error = new Error('Test error');
    mockQueue.error(error, { id: 1 });
    expect(mockOnError).toHaveBeenCalledWith(error);
  });

  it('respects concurrency limit', async () => {
    const mockCursor = {
      [Symbol.asyncIterator]: vi.fn().mockImplementation(function* () {
        for (let i = 0; i < 10; i++) {
          yield { id: i };
        }
      }),
    } as unknown as AggregationCursor<{ id: number }>;

    const mockProcess = vi.fn().mockImplementation(() => Promise.resolve());
    const mockQueue = {
      push: vi.fn().mockResolvedValue(undefined),
      drained: vi.fn().mockResolvedValue(undefined),
      error: vi.fn(),
    } as unknown as queueAsPromised<{ id: number }>;

    (fastq.promise as jest.Mock).mockReturnValue(mockQueue);

    const concurrency = 3;

    await cursorPool({
      cursor: mockCursor,
      concurrency,
      process: mockProcess,
    });

    expect(fastq.promise).toHaveBeenCalledWith(expect.any(Function), concurrency);
  });

  it('handles empty cursor', async () => {
    const mockCursor = {
      [Symbol.asyncIterator]: vi.fn().mockImplementation(function* () {}),
    } as unknown as AggregationCursor<{ id: number }>;

    const mockProcess = vi.fn();
    const mockQueue = {
      push: vi.fn().mockResolvedValue(undefined),
      drained: vi.fn().mockResolvedValue(undefined),
      error: vi.fn(),
    } as unknown as queueAsPromised<{ id: number }>;

    (fastq.promise as jest.Mock).mockReturnValue(mockQueue);

    await cursorPool({
      cursor: mockCursor,
      concurrency: 1,
      process: mockProcess,
    });

    expect(mockQueue.push).not.toHaveBeenCalled();
    expect(mockQueue.drained).toHaveBeenCalledTimes(1);
  });
});