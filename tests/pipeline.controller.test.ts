import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../src/services/pipeline.service', () => ({
  createPipeline: vi.fn(),
  getAllPipelines: vi.fn(),
  getPipelineById: vi.fn(),
  updatePipeline: vi.fn(),
  deletePipeline: vi.fn(),
}));

import {
  createPipelineHandler,
  deletePipelineHandler,
  getAllPipelinesHandler,
  getPipelineByIdHandler,
  updatePipelineHandler,
} from '../src/controllers/pipeline.controller';
import * as pipelineService from '../src/services/pipeline.service';

function createMockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('pipeline controller - error paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when create body is invalid', async () => {
    const req = {
      body: {
        name: '',
        actionType: 'wrong_action',
        subscribers: [],
      },
    } as Request;

    const res = createMockResponse();

    await createPipelineHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 when createPipeline throws', async () => {
    vi.mocked(pipelineService.createPipeline).mockRejectedValueOnce(
      new Error('DB error')
    );

    const req = {
      body: {
        name: 'Test',
        actionType: 'extract_fields',
        actionConfig: { fields: ['email'] },
        subscribers: [{ targetUrl: 'https://example.com' }],
      },
    } as Request;

    const res = createMockResponse();

    await createPipelineHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });

  it('returns 500 when getAllPipelines throws', async () => {
    vi.mocked(pipelineService.getAllPipelines).mockRejectedValueOnce(
      new Error('DB error')
    );

    const req = {} as Request;
    const res = createMockResponse();

    await getAllPipelinesHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('returns 404 when pipeline is not found by id', async () => {
    vi.mocked(pipelineService.getPipelineById).mockResolvedValueOnce(null);

    const req = {
      params: { id: 'missing-id' },
    } as unknown as Request<{ id: string }>;

    const res = createMockResponse();

    await getPipelineByIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Pipeline not found' });
  });

  it('returns 500 when getPipelineById throws', async () => {
    vi.mocked(pipelineService.getPipelineById).mockRejectedValueOnce(
      new Error('DB error')
    );

    const req = {
      params: { id: 'pipeline-id' },
    } as unknown as Request<{ id: string }>;

    const res = createMockResponse();

    await getPipelineByIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('returns 400 when update body is invalid', async () => {
    const req = {
      params: { id: 'pipeline-id' },
      body: {
        actionType: 'not_supported',
      },
    } as unknown as Request<{ id: string }>;

    const res = createMockResponse();

    await updatePipelineHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when update target does not exist', async () => {
    vi.mocked(pipelineService.updatePipeline).mockResolvedValueOnce(null);

    const req = {
      params: { id: 'missing-id' },
      body: { name: 'Updated' },
    } as unknown as Request<{ id: string }>;

    const res = createMockResponse();

    await updatePipelineHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 when updatePipeline throws', async () => {
    vi.mocked(pipelineService.updatePipeline).mockRejectedValueOnce(
      new Error('DB error')
    );

    const req = {
      params: { id: 'pipeline-id' },
      body: { name: 'Updated' },
    } as unknown as Request<{ id: string }>;

    const res = createMockResponse();

    await updatePipelineHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('returns 404 when delete target does not exist', async () => {
    vi.mocked(pipelineService.deletePipeline).mockResolvedValueOnce(null);

    const req = {
      params: { id: 'missing-id' },
    } as unknown as Request<{ id: string }>;

    const res = createMockResponse();

    await deletePipelineHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 when deletePipeline throws', async () => {
    vi.mocked(pipelineService.deletePipeline).mockRejectedValueOnce(
      new Error('DB error')
    );

    const req = {
      params: { id: 'pipeline-id' },
    } as unknown as Request<{ id: string }>;

    const res = createMockResponse();

    await deletePipelineHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});