import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../src/services/job.service', () => ({
  getAllJobs: vi.fn(),
  getJobById: vi.fn(),
}));

import {
  getAllJobsHandler,
  getJobByIdHandler,
} from '../src/controllers/job.controller';
import * as jobService from '../src/services/job.service';

function createMockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('job controller - error paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 500 when getAllJobs throws', async () => {
    vi.mocked(jobService.getAllJobs).mockRejectedValueOnce(
      new Error('DB error')
    );

    const req = {} as Request;
    const res = createMockResponse();

    await getAllJobsHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('returns 404 when job is not found', async () => {
    vi.mocked(jobService.getJobById).mockResolvedValueOnce(null);

    const req = {
      params: { id: 'missing-job' },
    } as unknown as Request<{ id: string }>;

    const res = createMockResponse();

    await getJobByIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Job not found' });
  });

  it('returns 500 when getJobById throws', async () => {
    vi.mocked(jobService.getJobById).mockRejectedValueOnce(
      new Error('DB error')
    );

    const req = {
      params: { id: 'job-id' },
    } as unknown as Request<{ id: string }>;

    const res = createMockResponse();

    await getJobByIdHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});