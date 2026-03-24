import { Request, Response } from 'express';
import {
  createPipeline,
  deletePipeline,
  getAllPipelines,
  getPipelineById,
  updatePipeline,
} from '../services/pipeline.service';
import { createPipelineSchema, updatePipelineSchema } from '../types/pipeline';

type IdParams = {
  id: string;
};

export async function createPipelineHandler(req: Request, res: Response) {
  try {
    const parsed = createPipelineSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid request body',
        errors: parsed.error.flatten(),
      });
    }

    const pipeline = await createPipeline(parsed.data);

    return res.status(201).json(pipeline);
  } catch (error) {
    console.error('Create pipeline error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getAllPipelinesHandler(_req: Request, res: Response) {
  try {
    const pipelines = await getAllPipelines();
    return res.status(200).json(pipelines);
  } catch (error) {
    console.error('Get pipelines error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getPipelineByIdHandler(
  req: Request<IdParams>,
  res: Response
) {
  try {
    const pipeline = await getPipelineById(req.params.id);

    if (!pipeline) {
      return res.status(404).json({ message: 'Pipeline not found' });
    }

    return res.status(200).json(pipeline);
  } catch (error) {
    console.error('Get pipeline error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updatePipelineHandler(
  req: Request<IdParams>,
  res: Response
) {
  try {
    const parsed = updatePipelineSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid request body',
        errors: parsed.error.flatten(),
      });
    }

    const pipeline = await updatePipeline(req.params.id, parsed.data);

    if (!pipeline) {
      return res.status(404).json({ message: 'Pipeline not found' });
    }

    return res.status(200).json(pipeline);
  } catch (error) {
    console.error('Update pipeline error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function deletePipelineHandler(
  req: Request<IdParams>,
  res: Response
) {
  try {
    const result = await deletePipeline(req.params.id);

    if (!result) {
      return res.status(404).json({ message: 'Pipeline not found' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete pipeline error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}