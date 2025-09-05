import { describe, it, expect, vi, afterEach } from 'vitest';
import { taskPool } from './task';
import type { queueAsPromised } from 'fastq';

vi.mock('fastq', () => ({
  promise: vi.fn(),
}));

import * as fastq from 'fastq';

describe.concurrent('taskPool function', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('processes initial tasks', async () => {
    const mockProcess = vi.fn().mockImplementation(() => Promise.resolve());
    const mockQueue = {
      push: vi.fn().mockResolvedValue(undefined),
      drained: vi.fn().mockResolvedValue(undefined),
      error: vi.fn(),
    } as unknown as queueAsPromised<{ id: number }>;

    (fastq.promise as jest.Mock).mockReturnValue(mockQueue);

    const pool = taskPool({
      initialTasks: [{ id: 1 }, { id: 2 }, { id: 3 }],
      concurrency: 2,
      process: mockProcess,
    });

    expect(mockQueue.push).toHaveBeenCalledTimes(3);
    expect(mockQueue.push).toHaveBeenCalledWith({ id: 1 });
    expect(mockQueue.push).toHaveBeenCalledWith({ id: 2 });
    expect(mockQueue.push).toHaveBeenCalledWith({ id: 3 });

    await pool.whenDone();
    expect(mockQueue.drained).toHaveBeenCalledTimes(1);
  });

  it('handles errors with onError callback', async () => {
    const mockProcess = vi.fn().mockRejectedValue(new Error('Process error'));
    const mockOnError = vi.fn();
    const mockQueue = {
      push: vi.fn(),
      drained: vi.fn().mockResolvedValue(undefined),
      error: vi.fn(),
    };

    vi.spyOn(fastq, 'promise').mockReturnValue(mockQueue as any);

    const pool = taskPool({
      initialTasks: [{ id: 1 }],
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
    const mockProcess = vi.fn().mockImplementation(() => Promise.resolve());
    const mockQueue = {
      push: vi.fn().mockResolvedValue(undefined),
      drained: vi.fn().mockResolvedValue(undefined),
      error: vi.fn(),
    } as unknown as queueAsPromised<{ id: number }>;

    (fastq.promise as jest.Mock).mockReturnValue(mockQueue);

    const concurrency = 3;

    taskPool({
      initialTasks: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
      concurrency,
      process: mockProcess,
    });

    expect(fastq.promise).toHaveBeenCalledWith(expect.any(Function), concurrency);
  });

  it('handles empty initial tasks', async () => {
    const mockProcess = vi.fn();
    const mockQueue = {
      push: vi.fn().mockResolvedValue(undefined),
      drained: vi.fn().mockResolvedValue(undefined),
      error: vi.fn(),
    } as unknown as queueAsPromised<{ id: number }>;

    (fastq.promise as jest.Mock).mockReturnValue(mockQueue);

    const pool = taskPool({
      initialTasks: [],
      concurrency: 1,
      process: mockProcess,
    });

    expect(mockQueue.push).not.toHaveBeenCalled();
    await pool.whenDone();
    expect(mockQueue.drained).toHaveBeenCalledTimes(1);
  });

  it('allows adding new tasks to the queue', async () => {
    const mockProcess = vi.fn().mockImplementation(() => Promise.resolve());
    const mockQueue = {
      push: vi.fn().mockResolvedValue(undefined),
      drained: vi.fn().mockResolvedValue(undefined),
      error: vi.fn(),
    } as unknown as queueAsPromised<{ id: number }>;

    (fastq.promise as jest.Mock).mockReturnValue(mockQueue);

    const pool = taskPool({
      initialTasks: [],
      concurrency: 2,
      process: mockProcess,
    });

    pool.addToQueue({ id: 4 });
    pool.addManyToQueue([{ id: 5 }, { id: 6 }]);

    expect(mockQueue.push).toHaveBeenCalledTimes(3);
    expect(mockQueue.push).toHaveBeenCalledWith({ id: 4 });
    expect(mockQueue.push).toHaveBeenCalledWith({ id: 5 });
    expect(mockQueue.push).toHaveBeenCalledWith({ id: 6 });
  });

  it('whenDone returns a promise that resolves when queue is drained', async () => {
    const mockProcess = vi.fn().mockImplementation(() => Promise.resolve());
    const mockQueue = {
      push: vi.fn().mockResolvedValue(undefined),
      drained: vi.fn().mockResolvedValue(undefined),
      error: vi.fn(),
    } as unknown as queueAsPromised<{ id: number }>;

    (fastq.promise as jest.Mock).mockReturnValue(mockQueue);

    const pool = taskPool({
      initialTasks: [{ id: 1 }, { id: 2 }],
      concurrency: 2,
      process: mockProcess,
    });

    const whenDonePromise = pool.whenDone();
    expect(whenDonePromise).toBeInstanceOf(Promise);

    await whenDonePromise;
    expect(mockQueue.drained).toHaveBeenCalledTimes(1);
  });
});