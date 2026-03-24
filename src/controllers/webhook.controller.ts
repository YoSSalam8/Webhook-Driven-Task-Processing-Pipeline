import { Request, Response } from 'express';
import { handleIncomingWebhook } from '../services/webhook.service';

type SourceKeyParams = {
  sourceKey: string;
};

export async function receiveWebhookHandler(
  req: Request<SourceKeyParams>,
  res: Response
) {
  try {
    const result = await handleIncomingWebhook({
      sourceKey: req.params.sourceKey,
      payload: req.body,
      headers: req.headers,
    });

    if (!result) {
      return res.status(404).json({
        message: 'Pipeline not found or inactive',
      });
    }

    return res.status(202).json(result);
  } catch (error) {
    console.error('Receive webhook error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}