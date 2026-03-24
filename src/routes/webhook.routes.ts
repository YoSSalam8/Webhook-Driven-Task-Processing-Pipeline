import { Router } from 'express';
import { receiveWebhookHandler } from '../controllers/webhook.controller';

const router = Router();

router.post('/:sourceKey', receiveWebhookHandler);

export default router;