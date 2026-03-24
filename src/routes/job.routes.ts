import { Router } from 'express';
import {
  getAllJobsHandler,
  getJobByIdHandler,
} from '../controllers/job.controller';

const router = Router();

router.get('/', getAllJobsHandler);
router.get('/:id', getJobByIdHandler);

export default router;