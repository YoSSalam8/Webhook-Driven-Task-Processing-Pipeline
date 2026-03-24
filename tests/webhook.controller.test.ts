import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../src/services/webhook.service', () => ({
  handleIncomingWebhook: vi.fn(),
}));

import { receiveWebhookHandler } from '../src/controllers/webhook.controller';
import * as webhookService from '../src/services/webhook.service';

function createMockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('webhook controller - error paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when pipeline is missing or inactive', async () => {
    vi.mocked(webhookService.handleIncomingWebhook).mockResolvedValueOnce(null);

    const req = {
      params: { sourceKey: 'missing' },
      body: { hello: 'world' },
      headers: {},
    } as unknown as Request<{ sourceKey: string }>;

    const res = createMockResponse();

    await receiveWebhookHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Pipeline not found or inactive',
    });
  });

  it('returns 500 when handleIncomingWebhook throws', async () => {
    vi.mocked(webhookService.handleIncomingWebhook).mockRejectedValueOnce(
      new Error('Queue error')
    );

    const req = {
      params: { sourceKey: 'source-key' },
      body: { hello: 'world' },
      headers: {},
    } as unknown as Request<{ sourceKey: string }>;

    const res = createMockResponse();

    await receiveWebhookHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Internal server error',
    });
  });
});