import { Request, Response } from 'express';
import { getAllJobs, getJobById } from '../services/job.service';

type IdParams = {
  id: string;
};

export async function getAllJobsHandler(_req: Request, res: Response) {
  try {
    const jobs = await getAllJobs();
    return res.status(200).json(jobs);
  } catch (error) {
    console.error('Get jobs error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getJobByIdHandler(
  req: Request<IdParams>,
  res: Response
) {
  try {
    const job = await getJobById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    return res.status(200).json(job);
  } catch (error) {
    console.error('Get job error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}