import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('../src/config/db', () => ({
  prisma: {
    deliveryAttempt: {
      create: vi.fn(),
    },
    subscriber: {
      findMany: vi.fn(),
    },
  },
}));

import axios from 'axios';
import { prisma } from '../src/config/db';
import {
  deliverToSubscriber,
  deliverToSubscribers,
} from '../src/services/delivery.service';

describe('delivery service - error paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns failure on non-retryable 404 response', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      status: 404,
      data: { message: 'not found' },
    } as never);

    const promise = deliverToSubscriber({
      jobId: 'job-1',
      subscriberId: 'sub-1',
      targetUrl: 'https://example.com',
      payload: { ok: true },
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({
      success: false,
      attempts: 1,
    });

    expect(prisma.deliveryAttempt.create).toHaveBeenCalledTimes(1);
  });

  it('retries on 500 and eventually fails after max attempts', async () => {
    vi.mocked(axios.post)
      .mockResolvedValueOnce({ status: 500, data: 'server error' } as never)
      .mockResolvedValueOnce({ status: 500, data: 'server error' } as never)
      .mockResolvedValueOnce({ status: 500, data: 'server error' } as never);

    const promise = deliverToSubscriber({
      jobId: 'job-2',
      subscriberId: 'sub-2',
      targetUrl: 'https://example.com',
      payload: { ok: true },
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({
      success: false,
      attempts: 3,
    });

    expect(axios.post).toHaveBeenCalledTimes(3);
    expect(prisma.deliveryAttempt.create).toHaveBeenCalledTimes(3);
  });

  it('retries on network error and eventually succeeds', async () => {
    vi.mocked(axios.post)
      .mockRejectedValueOnce(new Error('socket hang up'))
      .mockResolvedValueOnce({
        status: 200,
        data: { delivered: true },
      } as never);

    const promise = deliverToSubscriber({
      jobId: 'job-3',
      subscriberId: 'sub-3',
      targetUrl: 'https://example.com',
      payload: { ok: true },
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({
      success: true,
      attempts: 2,
    });

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(prisma.deliveryAttempt.create).toHaveBeenCalledTimes(2);
  });

  it('retries on 429 response', async () => {
    vi.mocked(axios.post)
      .mockResolvedValueOnce({ status: 429, data: 'rate limited' } as never)
      .mockResolvedValueOnce({
        status: 200,
        data: { delivered: true },
      } as never);

    const promise = deliverToSubscriber({
      jobId: 'job-4',
      subscriberId: 'sub-4',
      targetUrl: 'https://example.com',
      payload: { ok: true },
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({
      success: true,
      attempts: 2,
    });
  });

  it('returns zero counts when there are no subscribers', async () => {
    vi.mocked(prisma.subscriber.findMany).mockResolvedValueOnce([]);

    const result = await deliverToSubscribers({
      jobId: 'job-5',
      pipelineId: 'pipeline-1',
      payload: { ok: true },
    });

    expect(result).toEqual({
      total: 0,
      successCount: 0,
      failedCount: 0,
    });
  });

  it('counts mixed delivery results correctly', async () => {
    vi.mocked(prisma.subscriber.findMany).mockResolvedValueOnce([
      {
        id: 'sub-1',
        pipelineId: 'pipeline-1',
        targetUrl: 'https://success.example.com',
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 'sub-2',
        pipelineId: 'pipeline-1',
        targetUrl: 'https://fail.example.com',
        isActive: true,
        createdAt: new Date(),
      },
    ] as never);

    vi.mocked(axios.post)
      .mockResolvedValueOnce({ status: 200, data: 'ok' } as never)
      .mockResolvedValueOnce({ status: 404, data: 'not found' } as never);

    const promise = deliverToSubscribers({
      jobId: 'job-6',
      pipelineId: 'pipeline-1',
      payload: { ok: true },
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({
      total: 2,
      successCount: 1,
      failedCount: 1,
    });
  });
});