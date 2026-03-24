import { prisma } from '../config/db';
import { jobQueue } from '../queue/queue';

type WebhookInput = {
  sourceKey: string;
  payload: unknown;
  headers: Record<string, string | string[] | undefined>;
};

export async function handleIncomingWebhook(data: WebhookInput) {
  const pipeline = await prisma.pipeline.findUnique({
    where: {
      sourceKey: data.sourceKey,
    },
    include: {
      subscribers: {
        where: {
          isActive: true,
        },
      },
    },
  });

  if (!pipeline || !pipeline.isActive) {
    return null;
  }

  const event = await prisma.webhookEvent.create({
    data: {
      pipelineId: pipeline.id,
      payload: data.payload as object,
      headers: data.headers as object,
      status: 'queued',
    },
  });

  const job = await prisma.job.create({
    data: {
      eventId: event.id,
      pipelineId: pipeline.id,
      status: 'queued',
    },
  });

  await jobQueue.add(
    'process-pipeline-job',
    {
      jobId: job.id,
      eventId: event.id,
      pipelineId: pipeline.id,
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    }
  );

  return {
    message: 'Webhook accepted',
    eventId: event.id,
    jobId: job.id,
  };
}