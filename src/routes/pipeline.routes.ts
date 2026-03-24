import { Router } from 'express';
import {
  createPipelineHandler,
  deletePipelineHandler,
  getAllPipelinesHandler,
  getPipelineByIdHandler,
  updatePipelineHandler,
} from '../controllers/pipeline.controller';

const router = Router();

router.post('/', createPipelineHandler);
router.get('/', getAllPipelinesHandler);
router.get('/:id', getPipelineByIdHandler);
router.patch('/:id', updatePipelineHandler);
router.delete('/:id', deletePipelineHandler);

export default router;